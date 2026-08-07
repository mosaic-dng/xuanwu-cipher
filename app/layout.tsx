import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "玄武加密 | Xuanwu Cipher",
  description: "把一句正常的话，变成「遥遥领先」的表达方式。纯本地、完全可逆的娱乐文本转换工具。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
