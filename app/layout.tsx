import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { GoogleReCaptchaProvider } from "@/components/google/google-recaptcha-provider";
import { generateGoogleReCaptchaScriptSrc } from "@google-recaptcha/react";
import Script from "next/script";
import GoogleTagManager from "@/components/google/google-tag-manager";
import GoogleAnalytics from "@/components/google/google-analytics";

const fontM = Geist({ subsets: ["latin"], variable: "--font-sans" });
const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Send Emaily",
  description: "Created with +84 team",
  generator: "+84 team",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const scriptSrc = generateGoogleReCaptchaScriptSrc({
    isEnterprise: false,
    render: `${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}`,
    hl: "en",
  });

  return (
    <html
      lang='en'
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        fontM.variable,
      )}
    >
      <head>
        <GoogleTagManager
          GTMId={process.env.G_PUBLIC_GTM!}
          position='head'
        ></GoogleTagManager>
        <GoogleAnalytics GAId={process.env.G_PUBLIC_GTM!}></GoogleAnalytics>
        <script
          async
          src={
            "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" +
            process.env.G_PUBLIC_SEN!
          }
          crossOrigin='anonymous'
        ></script>
        <Script src={scriptSrc} strategy='afterInteractive' />
      </head>
      <body>
        <ThemeProvider>
          <GoogleTagManager
            GTMId={process.env.G_PUBLIC_GTM!}
            position='body'
          ></GoogleTagManager>
          <GoogleReCaptchaProvider
            type='v2-invisible'
            siteKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
          >
            {children}
          </GoogleReCaptchaProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
