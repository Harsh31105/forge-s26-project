import type { Metadata } from "next";
import {
  Libre_Baskerville,
  Merriweather,
  Fredericka_the_Great,
  Vollkorn_SC,
} from "next/font/google";
import "./globals.css";
import ReactQueryProvider from "@/src/lib/ReactQueryProvider";
import AuthGuard from "@/src/components/AuthGuard";

const libreBaskerville = Libre_Baskerville({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const merriweather = Merriweather({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

const frederickaTheGreat = Fredericka_the_Great({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const vollkornSC = Vollkorn_SC({
  variable: "--font-logo",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "NorthStar",
  description: "Course discovery platform for Northeastern students",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${libreBaskerville.variable} ${merriweather.variable} ${vollkornSC.variable} antialiased`}
      >
        <ReactQueryProvider>
          <AuthGuard>{children}</AuthGuard>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
