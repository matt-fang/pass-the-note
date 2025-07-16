import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Little Notes™",
  description: "Pass a little note to a friend. Start a big conversation.",
  keywords: [
    "notes",
    "drawing",
    "friends",
    "conversation",
    "social",
    "creative",
  ],
  authors: [{ name: "Little Notes" }],
  creator: "Little Notes",
  publisher: "Little Notes",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "a note for a special friend",
    description: "write ur answer and pass it on !",
    url: "https://littlenotes.app",
    siteName: "Little Notes",
    images: [
      {
        url: "/url.jpeg",
        width: 1200,
        height: 630,
        alt: "Little Notes - Pass a little note to a friend",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "a note for a special friend",
    description: "write ur answer and pass it on !",
    images: ["/url.jpeg"],
    creator: "@littlenotes",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_VERIFICATION,
  },
  alternates: {
    canonical: "https://littlenotes.app",
  },
  category: "social",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#f5f4f0" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Little Notes" />
        <link rel="apple-touch-icon" href="/littlenoteslogo.png" />
        <link rel="icon" href="/favicon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>{children}</body>
    </html>
  );
}
