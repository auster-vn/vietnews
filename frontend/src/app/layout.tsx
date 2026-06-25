import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
});

const lora = Lora({
  subsets: ["latin", "vietnamese"],
  variable: "--font-lora",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "VietNews — Bản tin Việt tự động, render thành ảnh",
  description: "Mỗi tin hot, một tấm ảnh — tự động, đẹp, không quảng cáo. Nguồn tin chính thống cập nhật liên tục.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${inter.variable} ${lora.variable} antialiased bg-slate-950`}>
        {children}
      </body>
    </html>
  );
}
