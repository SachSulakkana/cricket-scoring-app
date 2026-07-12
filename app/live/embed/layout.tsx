import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Score Overlay",
  robots: { index: false, follow: false },
};

export const viewport = {
  width: 1920,
  initialScale: 1,
};

export default function LiveEmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
