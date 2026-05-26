import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";

// Load our clinical fonts
const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter'
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: '--font-mono'
});

export const metadata: Metadata = {
  title: "MedSentinel | Clinical AI",
  description: "AI-Powered Clinical Data Quality & Anomaly Detection",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-background text-accent min-h-screen flex flex-col antialiased`}>
        <Navbar />
        {/* The main container where all our page content will go */}
        <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}