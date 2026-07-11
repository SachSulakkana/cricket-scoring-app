import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Score Overlay",
  robots: { index: false, follow: false },
};

export default function LiveEmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
