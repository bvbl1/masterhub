"use client";

import Image from "next/image";
import Link from "next/link";
import { useHomeTranslation } from "@/lib/i18n/useHomeTranslation";

export default function Footer() {
  const { t } = useHomeTranslation();

  return (
    <footer className="bg-[#DFE6EE] text-[#1A202C]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-10 mb-10 sm:mb-12">
          <div className="max-w-sm">
            <h3 className="text-xl font-semibold text-text-primary mb-3 sm:mb-4">
              {t("header.brand")}
            </h3>
            <p className="text-text-secondary mb-6 text-sm sm:text-base leading-relaxed">
              {t("footer.tagline")}
            </p>
            <div className="flex items-center gap-2">
              <SocialIcon href="#" label={t("footer.instagram")}>
                <Image
                  src="/Instagram.png"
                  alt=""
                  width={48}
                  height={48}
                  className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
                  unoptimized
                />
              </SocialIcon>
              <SocialIcon href="#" label={t("footer.facebook")}>
                <Image
                  src="/Facebook.png"
                  alt=""
                  width={48}
                  height={48}
                  className="w-10 h-10 sm:w-12 sm:h-12 object-cover"
                  unoptimized
                />
              </SocialIcon>
              <SocialIcon href="#" label={t("footer.twitter")}>
                <Image
                  src="/Twitter.png"
                  alt=""
                  width={48}
                  height={48}
                  className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
                  unoptimized
                />
              </SocialIcon>
            </div>
          </div>

          <div className="flex flex-wrap gap-12 sm:gap-16 lg:mr-8">
            <div>
              <h4 className="font-semibold mb-4 sm:mb-6">
                {t("footer.aboutHeading")}
              </h4>
              <ul className="space-y-2 sm:space-y-3 text-text-secondary text-sm sm:text-base">
                <li>
                  <Link href="#about" className="hover:text-slate-600">
                    {t("footer.aboutUs")}
                  </Link>
                </li>
                <li>
                  <Link href="#howWorks" className="hover:text-slate-600">
                    {t("footer.howItWorks")}
                  </Link>
                </li>
                <li>
                  <Link href="#services" className="hover:text-slate-600">
                    {t("footer.services")}
                  </Link>
                </li>
                <li>
                  <Link href="#reviews" className="hover:text-slate-600">
                    {t("footer.reviews")}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 sm:mb-6">
                {t("footer.socialsHeading")}
              </h4>
              <ul className="space-y-2 sm:space-y-3 text-text-secondary text-sm sm:text-base">
                <li>
                  <Link href="#" className="hover:text-slate-600">
                    {t("footer.instagram")}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-slate-600">
                    {t("footer.twitter")}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-slate-600">
                    {t("footer.facebook")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t-2 border-gray-300 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-text-secondary text-center md:text-left">
          <span>{t("footer.copyright")}</span>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <Link href="#" className="hover:text-text-primary">
              {t("footer.privacy")}
            </Link>
            <Link href="#" className="hover:text-text-primary">
              {t("footer.terms")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="shrink-0" aria-label={label}>
      {children}
    </Link>
  );
}
