import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resume / JD Matcher",
  description: "Local LLM-powered resume screening with rubric-based scoring.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="grain" />
        {children}
      </body>
    </html>
  );
}
