"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { frFR, enUS } from "@clerk/localizations";
import { useLocale } from "next-intl";

const localeMap = {
  fr: frFR,
  en: enUS,
} as const;

export default function ClerkProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = useLocale();
  const clerkLocale = localeMap[locale as keyof typeof localeMap] || frFR;

  return (
    <ClerkProvider
      localization={clerkLocale}
      signInUrl={`/${locale}/sign-in`}
      signUpUrl={`/${locale}/sign-up`}
      afterSignOutUrl={`/${locale}`}
    >
      {children}
    </ClerkProvider>
  );
}
