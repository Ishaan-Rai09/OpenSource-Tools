import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
const display = Space_Grotesk({ subsets: ["latin"], weight: "700", variable: "--font-display" });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
export const metadata: Metadata = {
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "OSSwap", statusBarStyle: "black" },
  icons: { apple: "/icons/icon-192.svg" },
};
export const viewport: Viewport = { themeColor: "#111111" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
    <body className="bg-[#FAF6EF] text-[#111111] antialiased"><header className="border-b-[1.5px] border-[#111111] px-4 py-3 font-mono text-xs uppercase tracking-widest">◉ OSSwap — stop paying for software</header><main>{children}</main>{process.env.NODE_ENV === "production" && <script dangerouslySetInnerHTML={{ __html: "if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})})}" }} />}</body></html>;
}
