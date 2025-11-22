import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ronaldo vs The World",
  description: "Ultra-cinematic action experience in Times Square"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
