"use client";
import { usePathname } from "next/navigation";
import NavBar from "./NavBar";

export default function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // If we are on the login page, we hide the navbar
  if (pathname === "/login") {
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