import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
// Import global styles (asegúrate que globals.css existe en app/)
import "./globals.css";

import { NavigationMenuMain } from "@/components/NavigationMenuMain";
import { AuthButton } from "@/components/AuthButton";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sales Connect",
  description: "Uber-like app for connecting customers with businesses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <header className="flex items-center justify-between p-5 gap-35 fixed top-0 left-0 right-0 z-20">
            <ProgressiveBlur position="top" height="140px" blurLevels={[1, 2, 4, 8, 16, 32, 64, 128]}/>
            <Link href="/" className="flex items-center justify-center z-10">
              <svg width="56" height="56" viewBox="0 0 375 345" xmlns="http://www.w3.org/2000/svg">
                <title>Company Logo</title>
                <g transform="translate(-10.542937,-7.6143431)">
                  <path style={{ fill: "#334155", strokeWidth: 1, strokeDasharray: "none" }} d="m 58.035467,318.56537 c 1.248033,-4.75554 2.814746,-10.79602 4.46633,-17.23343 C 66.146896,287.12437 69.943458,272.575 70.938601,269 c 0.995144,-3.575 2.803824,-10.1 4.019291,-14.5 0.610587,-2.21033 1.221432,-4.42105 1.712591,-6.19817 0.546928,-1.9789 2.655856,-3.82378 4.007317,-2.74523 1.268171,1.01207 3.042723,2.61709 5.522239,4.94964 9.082411,8.54408 19.853091,14.40008 35.299961,19.19254 l 6.00412,1.86281 a 20.700261,20.700261 8.6201444 0 0 6.13263,0.92967 l 61.36325,0.004 61.07789,0.004 a 15.411849,15.411849 167.48447 0 0 6.52272,-1.44791 L 265.5,269.69681 c 12.08861,-5.64591 18.47279,-14.934 18.49023,-26.90069 0.0146,-9.99606 -4.37631,-18.21482 -12.66413,-23.70444 -9.82277,-6.50633 -8.76681,-6.40715 -74.8261,-7.02837 l -54.15625,-0.50929 a 23.056986,23.056986 14.761443 0 1 -10.95583,-2.88676 l -0.21147,-0.11715 c -9.94902,-5.51122 -14.6904,-14.44956 -14.01407,-26.41899 0.70582,-12.49122 7.59895,-21.19785 19.65406,-24.82478 5.09829,-1.53388 12.27399,-1.71497 69.68356,-1.75862 63.31334,-0.0481 64.08583,-0.0246 72,2.19145 4.4,1.23206 12.275,4.34237 17.5,6.9118 8.15671,4.01112 10.84329,6.02746 19,14.2599 18.75291,18.92702 27.2547,41.78786 25.66945,69.02375 -2.27445,39.07686 -25.99406,69.23172 -62.66945,79.67196 -6.11329,1.74025 -12.94718,1.868 -114.86691,2.14727 -57.15534,0.15717 -84.828448,0.16335 -97.64206,-0.13683 -5.643198,-0.1322 -8.913994,-5.49441 -7.455563,-11.05165 z M 60.097893,147.25 C 51.663621,109.5997 63.126204,75.72721 91.394252,54.76773 100.56205,47.97022 108.2496,44.162856 120.66495,40.271006 l 5.98467,-1.87602 a 19.702697,19.702697 171.21632 0 1 5.83751,-0.901991 l 95.26287,-0.27045 69.22192,-0.19652 A 28.945899,28.945899 44.918669 0 1 326,65.971808 v 0.144806 A 28.888596,28.888596 134.99483 0 1 297.11661,95.00521 L 229.75,95.01736 C 127.38332,95.03583 128.47603,94.98966 114.58168,99.882733 94.383776,106.99568 75.962855,124.07186 65.10238,145.75 c -1.722143,3.4375 -3.313249,6.25 -3.53579,6.25 -0.222541,0 -0.883455,-2.1375 -1.468697,-4.75 z" />
                </g>
              </svg>
              <h3 className="text-2xl font-bold ml-2 text-slate-700">Sales Connect</h3>
            </Link>
            <NavigationMenuMain />
            <div className="z-10">
              <AuthButton />
            </div>
          </header>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
