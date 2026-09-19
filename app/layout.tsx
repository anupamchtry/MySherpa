import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Sherpa — Trek smarter, stay safer",
  description: "Plan Nepal trekking routes with community warnings, nearby services, trail conditions, and safer alternatives.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
