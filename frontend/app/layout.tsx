import { montserrat } from "./fonts";
import "./globals.css";
import { GoogleMapsProvider } from "@/components/providers/GoogleMapsProvider";
import { AuthProvider } from "@/lib/context/AuthContext";
import I18nProvider from "@/components/providers/I18nProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={montserrat.variable}>
        <I18nProvider>
          <GoogleMapsProvider>
            <AuthProvider>{children}</AuthProvider>
          </GoogleMapsProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
