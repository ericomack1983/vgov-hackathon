import type { Metadata } from "next";
import { AppProviders } from "@/context/AppProviders";
import { AppShell } from "@/components/layout/AppShell";
import "@visa/nova-styles/styles.css";
import "@visa/nova-styles/themes/visa/index.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "VGov - Procurement",
  description: "AI-Powered Government Procurement Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
