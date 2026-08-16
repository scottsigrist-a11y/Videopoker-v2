"use client";

import dynamic from "next/dynamic";

// Dynamically import GlassesHome with SSR disabled to prevent hydration mismatches locally
const GlassesHome = dynamic(
  () => import("@/components/glasses-home").then((mod) => mod.GlassesHome),
  { ssr: false }
);

export default function Home() {
  return <GlassesHome />;
}
