"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import JobRequestDetailView from "@/components/requests/JobRequestDetailView";
import { useAuth } from "@/lib/context/AuthContext";
import { type MapResolvedPlace } from "@/components/common/Map";
import {
  authApi,
  categoriesApi,
  jobRequestsApi,
  ApiError,
  type Category,
  type JobRequest,
  type JobRequestResponse,
  type User,
} from "@/lib/api";
import { useRequestsTranslation } from "@/lib/i18n/useRequestsTranslation";

function bidStorageKey(jobRequestId: number) {
  return `job_request_my_bid_${jobRequestId}`;
}

export default function JobRequestDetailPage() {
  const { t, formatWhen } = useRequestsTranslation();
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const rawId = params.id;
  const jobRequestId = typeof rawId === "string" ? Number(rawId) : Number.NaN;

  const [jr, setJr] = useState<JobRequest | null>(null);
  const [responses, setResponses] = useState<JobRequestResponse[]>([]);
  const [providerNames, setProviderNames] = useState<Record<string, string>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [bidPrice, setBidPrice] = useState("");
  const [bidComment, setBidComment] = useState("");
  const [bidDays, setBidDays] = useState("");
  const [bidSubmitting, setBidSubmitting] = useState(false);
  const [bidError, setBidError] = useState("");
  const [myBidId, setMyBidId] = useState<number | null>(null);
  const [myBid, setMyBid] = useState<JobRequestResponse | null>(null);

  const [acceptOpen, setAcceptOpen] = useState(false);
  const [acceptTarget, setAcceptTarget] = useState<JobRequestResponse | null>(
    null,
  );
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [latitude, setLatitude] = useState("51.1801");
  const [longitude, setLongitude] = useState("71.446");
  const [scheduledAt, setScheduledAt] = useState("");
  const [acceptSubmitting, setAcceptSubmitting] = useState(false);
  const [acceptMsg, setAcceptMsg] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [poster, setPoster] = useState<User | null>(null);

  const load = useCallback(async () => {
    if (!Number.isFinite(jobRequestId) || jobRequestId <= 0) return;
    setLoading(true);
    setError("");
    try {
      const req = await jobRequestsApi.getJobRequest(jobRequestId);
      setJr(req);

      try {
        const { user: posterUser } = await authApi.getProviderInfo(
          String(req.customerId),
        );
        setPoster(posterUser);
      } catch {
        setPoster(null);
      }

      const uid = user?.id ? Number(user.id) : NaN;
      const isOwner = Number.isFinite(uid) && req.customerId === uid;

      if (isOwner && user?.role === "customer") {
        const list = await jobRequestsApi.listJobRequestResponses(
          jobRequestId,
          {
            limit: 100,
          },
        );
        setResponses(list);
        const names: Record<string, string> = {};
        await Promise.all(
          list.map(async (r) => {
            const pid = String(r.providerId);
            if (names[pid]) return;
            try {
              const { user: u } = await authApi.getProviderInfo(pid);
              names[pid] = `${u.firstName} ${u.secondName}`.trim();
            } catch {
              names[pid] = t("detailPage.providerFallback", { id: pid });
            }
          }),
        );
        setProviderNames(names);
      } else {
        setResponses([]);
      }

      if (user?.role === "provider") {
        const stored = sessionStorage.getItem(bidStorageKey(jobRequestId));
        const sid = stored ? Number(stored) : NaN;
        if (Number.isFinite(sid) && sid > 0) {
          try {
            const bid = await jobRequestsApi.getJobRequestResponse(
              jobRequestId,
              sid,
            );
            const pid = Number(user?.id);
            if (!Number.isFinite(pid) || bid.providerId !== pid) {
              sessionStorage.removeItem(bidStorageKey(jobRequestId));
              setMyBidId(null);
              setMyBid(null);
            } else {
              setMyBidId(sid);
              setMyBid(bid);
              if (bid.status !== "pending") {
                sessionStorage.removeItem(bidStorageKey(jobRequestId));
                setMyBidId(null);
                setMyBid(null);
              }
            }
          } catch {
            sessionStorage.removeItem(bidStorageKey(jobRequestId));
            setMyBidId(null);
            setMyBid(null);
          }
        } else {
          setMyBidId(null);
          setMyBid(null);
        }
      }
    } catch {
      setError(t("detailPage.loadError"));
      setJr(null);
    } finally {
      setLoading(false);
    }
  }, [jobRequestId, user?.id, user?.role, t]);

  useEffect(() => {
    if (authLoading || !user) return;
    void load();
  }, [authLoading, user, load]);

  useEffect(() => {
    if (jr?.scheduledAt) {
      const d = new Date(jr.scheduledAt);
      if (!Number.isNaN(d.getTime())) {
        const pad = (n: number) => String(n).padStart(2, "0");
        const local = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setScheduledAt(local);
      }
      setCity(jr.city);
    }
  }, [jr]);

  useEffect(() => {
    categoriesApi
      .getCategories()
      .then((r) => setCategories(r.categories))
      .catch(() => {});
  }, []);

  const categoryName = useMemo(() => {
    if (!jr) return "";
    const match = categories.find(
      (c) => String(c.id) === String(jr.categoryId),
    );
    return match?.name ?? "";
  }, [jr, categories]);

  const pendingBidCount = useMemo(
    () => responses.filter((r) => r.status === "pending").length,
    [responses],
  );

  const isOwner =
    user?.role === "customer" && jr && Number(user.id) === jr.customerId;

  const isProvider = user?.role === "provider";

  const handleBid = async () => {
    if (!jr || !isProvider) return;
    const price = parseFloat(bidPrice);
    const days = parseInt(bidDays, 10);
    if (!Number.isFinite(price) || price <= 0) {
      setBidError(t("detailPage.bidPriceInvalid"));
      return;
    }
    if (!bidComment.trim()) {
      setBidError(t("detailPage.bidCommentRequired"));
      return;
    }
    if (!Number.isFinite(days) || days <= 0) {
      setBidError(t("detailPage.bidDaysInvalid"));
      return;
    }
    setBidSubmitting(true);
    setBidError("");
    try {
      const resp = await jobRequestsApi.respondToJobRequest(jr.id, {
        proposed_price: price,
        comment: bidComment.trim(),
        estimated_days: days,
      });
      sessionStorage.setItem(bidStorageKey(jr.id), String(resp.id));
      setMyBidId(resp.id);
      setMyBid(resp);
      setBidPrice("");
      setBidComment("");
      setBidDays("");
      await load();
    } catch (err) {
      if (err instanceof ApiError) {
        setBidError(
          err.body.message ?? err.body.error ?? t("detailPage.bidSubmitFailed"),
        );
      } else {
        setBidError(t("detailPage.genericError"));
      }
    } finally {
      setBidSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    const rid = myBidId ?? myBid?.id;
    if (!jr || !rid) return;
    try {
      await jobRequestsApi.withdrawJobRequestResponse(jr.id, rid);
      sessionStorage.removeItem(bidStorageKey(jr.id));
      setMyBidId(null);
      setMyBid(null);
      await load();
    } catch (err) {
      if (err instanceof ApiError) {
        setBidError(
          err.body.message ?? err.body.error ?? t("detailPage.withdrawFailed"),
        );
      }
    }
  };

  const handleCancelRequest = async () => {
    if (!jr || !isOwner) return;
    if (!confirm(t("detailPage.cancelConfirm"))) return;
    try {
      await jobRequestsApi.cancelJobRequest(jr.id);
      await load();
    } catch {
      setError(t("detailPage.cancelFailed"));
    }
  };

  const handleShare = useCallback(async () => {
    if (!jr || typeof window === "undefined") return;
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: jr.title, url });
        return;
      }
    } catch {
      /* user cancelled share */
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* ignore */
    }
  }, [jr]);

  const openAccept = (r: JobRequestResponse) => {
    setAcceptTarget(r);
    setStreet("");
    setRegion("");
    setAcceptMsg("");
    setAcceptOpen(true);
  };

  const applyAcceptMapLocation = useCallback((p: MapResolvedPlace) => {
    setStreet(p.street);
    setCity(p.city);
    setRegion(p.region);
    setLatitude(String(p.latitude));
    setLongitude(String(p.longitude));
    setAcceptMsg("");
  }, []);

  const submitAccept = async () => {
    if (!jr || !acceptTarget || !scheduledAt.trim()) {
      setAcceptMsg(t("detailPage.pickDateTime"));
      return;
    }
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (!street.trim() || !city.trim() || !region.trim()) {
      setAcceptMsg(t("detailPage.addressRequired"));
      return;
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setAcceptMsg(t("detailPage.coordsInvalid"));
      return;
    }
    setAcceptMsg("");
    let iso = scheduledAt.trim();
    if (!iso.includes("T")) iso = `${iso}T12:00:00`;
    const scheduled_at = new Date(iso).toISOString();

    setAcceptSubmitting(true);
    try {
      const result = await jobRequestsApi.acceptJobRequestResponse(
        jr.id,
        acceptTarget.id,
        {
          street: street.trim(),
          city: city.trim(),
          region: region.trim(),
          latitude: lat,
          longitude: lng,
          scheduled_at,
        },
      );
      if (!result.orderId || result.orderId <= 0) {
        setAcceptMsg(t("detailPage.orderNotCreated"));
        return;
      }
      setAcceptOpen(false);
      setAcceptTarget(null);
      router.push(`/orders/${result.orderId}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setAcceptMsg(
          err.body.message ??
            err.body.error ??
            t("detailPage.acceptFailed"),
        );
      } else {
        setAcceptMsg(t("detailPage.acceptFailed"));
      }
    } finally {
      setAcceptSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#f4f6f9] px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-6xl animate-pulse space-y-8">
          <div className="h-4 w-40 rounded bg-slate-200" />
          <div className="h-10 max-w-lg rounded-lg bg-slate-200" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-white" />
            ))}
          </div>
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="h-64 rounded-2xl bg-white lg:col-span-2" />
            <div className="h-80 rounded-2xl bg-white" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f6f9] px-4 text-center">
        <p className="text-slate-600">
          <Link href="/login" className="font-semibold text-[#486284] underline">
            {t("list.signIn")}
          </Link>{" "}
          {t("detailPage.signInToView")}
        </p>
      </div>
    );
  }

  if (!Number.isFinite(jobRequestId) || jobRequestId <= 0 || error || !jr) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f4f6f9] px-4 text-center">
        <p className="mb-4 text-slate-600">
          {error || t("detailPage.notFound")}
        </p>
        <Link
          href="/requests"
          className="font-semibold text-[#486284] underline"
        >
          {t("detailPage.backToRequests")}
        </Link>
      </div>
    );
  }

  return (
    <JobRequestDetailView
      jr={jr}
      categoryName={categoryName}
      isOwner={!!isOwner}
      isProvider={isProvider}
      poster={poster}
      pendingBidCount={pendingBidCount}
      responses={responses}
      providerNames={providerNames}
      formatWhen={formatWhen}
      bidPrice={bidPrice}
      setBidPrice={setBidPrice}
      bidComment={bidComment}
      setBidComment={setBidComment}
      bidDays={bidDays}
      setBidDays={setBidDays}
      bidSubmitting={bidSubmitting}
      bidError={bidError}
      myBid={myBid}
      onBid={() => void handleBid()}
      onWithdraw={() => void handleWithdraw()}
      onCancelRequest={() => void handleCancelRequest()}
      onShare={() => void handleShare()}
      onOpenAccept={openAccept}
      acceptOpen={acceptOpen}
      acceptTarget={acceptTarget}
      acceptSubmitting={acceptSubmitting}
      acceptMsg={acceptMsg}
      street={street}
      setStreet={setStreet}
      city={city}
      setCity={setCity}
      region={region}
      setRegion={setRegion}
      scheduledAt={scheduledAt}
      setScheduledAt={setScheduledAt}
      onCloseAccept={() => !acceptSubmitting && setAcceptOpen(false)}
      onSubmitAccept={() => void submitAccept()}
      onMapPlace={applyAcceptMapLocation}
    />
  );
}
