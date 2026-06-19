"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { fadeUp, staggerContainer } from "@/lib/motion/presets";
import CheckboxCheckIcon from "./CheckboxCheckIcon";
import InputFields from "./InputFields";
import { useAuth } from "@/lib/context/AuthContext";
import {
  ApiError,
  authApi,
  getRememberedLoginEmail,
} from "@/lib/api";
import { useAuthTranslation } from "@/lib/i18n/useAuthTranslation";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default function LoginForm() {
  const { t, resolveOAuthError } = useAuthTranslation();
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const saved = getRememberedLoginEmail();
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthErr = params.get("oauth_error");
    if (oauthErr) {
      setError(resolveOAuthError(oauthErr));
      router.replace("/login", { scroll: false });
    }
  }, [router, resolveOAuthError]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError(t("login.fillAll"));
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password, rememberMe);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.body.message ?? err.body.error ?? t("login.failed"));
      } else {
        setError(t("login.genericError"));
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError("");
    setGoogleLoading(true);
    try {
      const { url } = await authApi.getGoogleAuthUrl();
      if (!url?.trim()) {
        setError(t("login.googleStartFailed"));
        return;
      }
      window.location.assign(url.trim());
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.body.message ?? err.body.error ?? t("login.googleFailed"),
        );
      } else {
        setError(t("login.genericError"));
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      <motion.div
        className="w-full max-w-[404px]"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={fadeUp} className="mb-10 sm:mb-14 lg:mb-[70px]">
          <h1 className="text-black mb-3 sm:mb-4 font-medium text-2xl sm:text-[28px] lg:text-[32px] tracking-tight text-shadow-lg">
            {t("login.title")}
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            {t("login.subtitle")}
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {error ? (
            <motion.div
              key={error}
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                {error}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <motion.form
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          <motion.div variants={fadeUp}>
            <InputFields
              placeholder={t("login.emailPlaceholder")}
              label={t("login.email")}
              type="email"
              value={email}
              onChange={setEmail}
            />
          </motion.div>
          <motion.div variants={fadeUp}>
            <InputFields
              placeholder={t("login.passwordPlaceholder")}
              label={t("login.password")}
              type="password"
              value={password}
              onChange={setPassword}
            />
          </motion.div>

          <motion.div variants={fadeUp} className="mt-2">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                className="sr-only"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span
                className={`mt-px flex h-6 w-6 items-center justify-center shrink-0 rounded transition-colors duration-150 ${
                  rememberMe
                    ? "border-0 bg-primary"
                    : "border border-[#CBD5E1] bg-white"
                }`}
                aria-hidden
              >
                <CheckboxCheckIcon checked={rememberMe} />
              </span>
              <span className="text-xs sm:text-[12px] font-medium leading-relaxed pt-px text-[#475569]">
                {t("login.rememberMe")}
              </span>
            </label>
          </motion.div>

          <motion.button
            variants={fadeUp}
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.01 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="mt-2 p-1.5 w-full bg-[#3A5B22] text-center font-bold text-white rounded-[10px] disabled:opacity-50 transition shadow-md shadow-[#3A5B22]/20"
          >
            {loading ? t("login.submitting") : t("login.submit")}
          </motion.button>

          <motion.div
            variants={fadeUp}
            className="relative mt-6 flex items-center gap-3"
          >
            <div className="h-px flex-1 bg-[#E2E8F0]" aria-hidden />
            <span className="text-xs font-medium text-[#64748B] shrink-0">
              {t("login.orContinue")}
            </span>
            <div className="h-px flex-1 bg-[#E2E8F0]" aria-hidden />
          </motion.div>

          <motion.button
            variants={fadeUp}
            type="button"
            disabled={loading || googleLoading}
            onClick={() => void handleGoogleLogin()}
            whileHover={{ scale: loading || googleLoading ? 1 : 1.01 }}
            whileTap={{ scale: loading || googleLoading ? 1 : 0.98 }}
            className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-[#CBD5E1] bg-white py-3 px-3 text-sm font-semibold text-[#334155] shadow-sm disabled:opacity-50 transition hover:bg-gray-50 hover:border-[#486284]/30"
          >
            <GoogleIcon className="h-[22px] w-[22px] shrink-0" />
            {googleLoading ? t("login.googleRedirecting") : t("login.google")}
          </motion.button>
        </motion.form>

        <motion.p
          variants={fadeUp}
          className="mt-7 text-sm font-semibold w-full text-center"
        >
          {t("login.noAccount")}{" "}
          <Link
            href="/registration"
            className="text-[#0F3DDE] hover:text-[#486284] transition-colors"
          >
            {t("login.signUp")}
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
