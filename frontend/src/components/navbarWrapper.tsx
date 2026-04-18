"use client";
import { usePathname } from "next/navigation";
import Navbar from "./navbar";

export default function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // If we are on the login page, we hide the navbar
  if (pathname === "/login") {
    return <>{children}</>;
  }

  // Otherwise, we show the Navbar
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}