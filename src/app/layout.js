import "./globals.css";
import Script from "next/script";
import ThemeErrorBoundary from "@/components/ThemeErrorBoundary"
import ThemeProvider from "@/components/ThemeProvider";
import ClientLayout from "@/components/ClientLayout";

export const metadata = {
  title: "低谷渡口—你不是一个人",
  description: "一个给负债、失业、想逃离原生家庭的人们的安静社群。",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <head>
        <Script id="theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{__html:"(function(){try{var t=localStorage.getItem('dgdk_theme');if(!t){var m=window.matchMedia('(prefers-color-scheme:dark)');t=m.matches?'night':'night'}document.documentElement.setAttribute('data-theme',t)}catch(e){document.documentElement.setAttribute('data-theme','night')}})()"}} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{background:"#faf6f0"}}>
        <ThemeProvider><ThemeErrorBoundary><ClientLayout>
          <div className="page-wrap">{children}</div>
        </ClientLayout></ThemeErrorBoundary></ThemeProvider>
      </body>
    </html>
  );
}
