"use client";
import { usePathname } from "next/navigation";
import NavBar from "./NavBar";

export default function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Login and onboarding own their page chrome.
  if (pathname === "/login" || pathname === "/onboarding") {
    return <>{children}</>;
  }

  // Otherwise, we show the NavBar
  return (
    <>
      <NavBar />
      {children}
    </>
  );
}
