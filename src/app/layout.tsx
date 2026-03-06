import type { Metadata } from "next";
import "./globals.css";
import AppTheme from "@/components/theme/AppTheme";
import QueryProvider from "@/components/providers/QueryProvider";
import { Plus_Jakarta_Sans } from "next/font/google";
import { configureApiClient } from "@rawfli/types";

configureApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000",
});

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
          <QueryProvider>
            {children}
          </QueryProvider>
        </AppTheme>
      </body>
    </html>
  );
}
