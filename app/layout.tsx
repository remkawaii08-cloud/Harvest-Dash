import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Harvest Dash - Mini Game",
  description: "A fast, fun way to challenge friends in real time.",
  other: {
    "base:app_id": "69906cc5e0d5d2cf831b5bc6",
    "fc:miniapp": JSON.stringify({
      version: "next",
      imageUrl: "https://harvest-dash.vercel.app/harvestdash-logo.png",
      button: {
        title: "Play Now",
        action: {
          type: "launch_miniapp",
          name: "Harvest Dash",
          url: "https://harvest-dash.vercel.app",
        },
      },
    }),
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Harvest Dash",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#4CAF50",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=VT323&display=swap"
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/svg+xml" href="/hay-bale.svg" />
      </head>
      <body>{children}</body>
    </html>
  );
}
