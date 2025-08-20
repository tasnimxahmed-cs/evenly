import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Evenly - Split bills effortlessly with friends",
  description: "Connect your bank accounts, create groups, and let Evenly handle the math. Never worry about who owes what again.",
  keywords: ["bill splitting", "expense sharing", "roommates", "group expenses", "financial app"],
  authors: [{ name: "Evenly Team" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  openGraph: {
    title: "Evenly - Split bills effortlessly with friends",
    description: "Connect your bank accounts, create groups, and let Evenly handle the math. Never worry about who owes what again.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Evenly - Split bills effortlessly with friends",
    description: "Connect your bank accounts, create groups, and let Evenly handle the math. Never worry about who owes what again.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
