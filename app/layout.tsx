import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sri Ranganayaka Transport",
  description: "Transport business load, expense and profit tracker"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en-IN"><body>{children}</body></html>;
}
