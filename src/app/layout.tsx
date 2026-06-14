import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "3D Organ and Mathematics Simulator",
  description: "Figure 12 kinematics and 3D bellows tube simulation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
