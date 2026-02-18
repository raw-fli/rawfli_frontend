import type { Metadata } from "next";
import "./globals.css";
import AppTheme from "@/components/theme/AppTheme";
import { Plus_Jakarta_Sans } from "next/font/google";

const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rawfli",
  description: "Rawfli - Camera Community",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={plusJakarta.className}>
        <AppTheme>
          {children}
        </AppTheme>
      </body>
    </html>
  );
}
