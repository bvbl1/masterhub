import {
  authApi,
  servicesApi,
  type DisputedOrderListEntry,
  type Service,
  type User,
} from "@/lib/api";

export type DisputePartyDetail = {
  name: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
};

export type DisputeEnrichment = {
  customer: DisputePartyDetail;
  provider: DisputePartyDetail;
  serviceTitle: string;
  raisedBy: DisputePartyDetail;
};

export const DISPUTE_RESOLUTIONS = [
  { value: "completed", label: "Mark completed" },
  { value: "cancelled", label: "Mark cancelled" },
] as const;

export function userLabel(
  u: User | null | undefined,
  fallback: string,
): DisputePartyDetail {
  if (!u) return { name: fallback };
  const name = `${u.firstName} ${u.secondName}`.trim();
  const avatarTrimmed = u.avatarUrl?.trim();
  const phoneTrimmed = u.phone?.trim();
  return {
    name: name || u.email || fallback,
    email: u.email || undefined,
    phone: phoneTrimmed ? phoneTrimmed : undefined,
    avatarUrl: avatarTrimmed ? avatarTrimmed : undefined,
  };
}

export async function enrichDisputes(
  list: DisputedOrderListEntry[],
): Promise<Record<number, DisputeEnrichment>> {
  const userIds = new Set<number>();
  const serviceIds = new Set<number>();
  for (const e of list) {
    const o = e.order;
    userIds.add(o.customer_id);
    userIds.add(o.provider_id);
    if (e.raisedBy > 0) userIds.add(e.raisedBy);
    serviceIds.add(o.service_id);
  }

  const userById = new Map<number, User | null>();
  await Promise.all(
    [...userIds].map(async (id) => {
      try {
        const { user } = await authApi.getProviderInfo(String(id));
        userById.set(id, user);
      } catch {
        userById.set(id, null);
      }
    }),
  );

  const serviceById = new Map<number, Service | null>();
  await Promise.all(
    [...serviceIds].map(async (sid) => {
      try {
        const r = await servicesApi.getService(sid, { auth: true });
        serviceById.set(sid, r.service);
      } catch {
        try {
          const r = await servicesApi.getService(sid);
          serviceById.set(sid, r.service);
        } catch {
          serviceById.set(sid, null);
        }
      }
    }),
  );

  const out: Record<number, DisputeEnrichment> = {};
  for (const e of list) {
    const o = e.order;
    const cu = userById.get(o.customer_id);
    const pr = userById.get(o.provider_id);
    const rb = e.raisedBy > 0 ? userById.get(e.raisedBy) : null;
    const sv = serviceById.get(o.service_id);
    out[e.disputeId] = {
      customer: userLabel(cu, `Customer #${o.customer_id}`),
      provider: userLabel(pr, `Provider #${o.provider_id}`),
      serviceTitle: sv?.title?.trim() || `Service #${o.service_id}`,
      raisedBy: userLabel(rb, e.raisedBy > 0 ? `User #${e.raisedBy}` : "—"),
    };
  }
  return out;
}
