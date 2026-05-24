import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "수강 신청",
  description: "온라인 강의 수강 신청 폼",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}