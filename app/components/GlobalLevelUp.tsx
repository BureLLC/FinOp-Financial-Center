"use client";

import { usePathname } from "next/navigation";
import LevelUpAssistant from "./LevelUpAssistant";

export default function GlobalLevelUp() {
  const pathname = usePathname();
  if (!pathname || pathname === "/") return null;
  if (pathname.startsWith("/auth")) return null;
  return <LevelUpAssistant pathname={pathname} />;
}
