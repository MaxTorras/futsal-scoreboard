import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scoreboard System",
  description: "Live futsal scoreboard control + overlay",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}