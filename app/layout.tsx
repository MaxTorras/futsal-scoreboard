import type { Metadata } from "next";
import "./globals.css";
import "./styles/scoreboard_styles.css";
import "./styles/control_styles.css";

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