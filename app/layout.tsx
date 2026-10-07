import React from "react"
import type { Metadata } from 'next'
import './globals.css'

// Ca hai font deu duoc tu host trong /public/fonts va khai bao bang @font-face
// o globals.css (Google Sans khong co trong danh sach cua next/font/google).
// Preload 2 tep bat buoc: latin cho chu thuong, vietnamese cho dau tieng Viet.

export const metadata: Metadata = {
  title: 'PCM Vận Hành',
  description: 'Hệ thống quản lý vận hành cửa hàng linh kiện máy tính: đơn hàng, kho, kỹ thuật, bảo hành và giao hàng',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

import { AuthProvider } from "@/components/auth-context";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href="/fonts/google-sans-vietnamese.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/google-sans-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`font-sans antialiased`} suppressHydrationWarning>
        <AuthProvider>
          {children}
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
