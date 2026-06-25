import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClientProvider } from "@/components/client-provider";
import { SimulatorPanel } from "@/components/simulator";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RemindFlow | Fee Collection Automation for Coaching Academies",
  description: "Automate fee reminders, WhatsApp notifications, payment collection, and class attendance tracking from a single dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ClientProvider>
          {children}
          <SimulatorPanel />
        </ClientProvider>
      </body>
    </html>
  );
}

