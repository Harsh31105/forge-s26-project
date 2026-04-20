/*Navbar from home page
      <nav style={{ background: "var(--color-surface-light-cream)", borderBottom: "1px solid var(--color-border-tan)" }}>
        <div style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 48px",
          height: 68,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <NorthStarLogo />

          <div style={{ display: "flex", gap: 48 }}>
            {[
              { label: "Home", href: "/", active: true },
              { label: "Courses", href: "/courses", active: false },
              { label: "Professors", href: "/professors", active: false },
              { label: "Reviews", href: "/reviews", active: false },
            ].map(({ label, href, active }) => (
              <Link key={label} href={href} style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--font-size-base)",
                color: active ? "var(--color-primary-navy)" : "var(--color-text-primary)",
                textDecoration: active ? "underline" : "none",
                fontWeight: active ? 600 : 400,
              }}>
                {label}
              </Link>
            ))}
          </div>

          <button style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "1px solid var(--color-border-tan)",
            background: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
        </div>
      </nav>
*/

"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Courses", href: "/courses" },
    { label: "Professors", href: "/professors" },
  ];

  return (
    <nav style={{ 
      background: "var(--color-surface-light-cream)", 
      borderBottom: "3px solid var(--color-border-tan)",
      height: 80,
      display: "flex",
      alignItems: "center",
    }}>
      <div style={{
        maxWidth: 1280,
        margin: "0 auto",
        padding: "0 48px",
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", marginRight: "24px" }}>
          <Image
            src="/NorthStarLogo.png"
            alt="NorthStar"
            width={230} // Slightly bigger
            height={64}
            priority
            style={{ objectFit: "contain" }}
          />
        </Link>

        <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
          {navLinks.map(({ label, href }) => {
            const isActive = pathname === href;
            return (
              <Link key={label} href={href} style={{
                fontFamily: "var(--font-body)",
                color: isActive ? "var(--color-primary-navy)" : "var(--color-text-primary)",
                textDecoration: isActive ? "underline" : "none",
                fontWeight: isActive ? 600 : 400,
              }}>
                {label}
              </Link>
            );
          })}

          {/* Compare Courses */}
          {/* possible designs are commented out */}

          <Link href="/compare" style={{
            //padding: "2px 4px",
            //border: "1px solid var(--color-text-primary)",
            //borderRadius: "10px",
            fontFamily: "var(--font-body)",
            fontWeight: 400,
            color: "var(--color-text-primary)",
            //textDecoration: "none",
            textDecoration: "underline",
          }}>
            Compare Course
          </Link>
        </div>

        {/* Profile */}
        <Link href="/profile">
          <button style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            overflow: "hidden",
            border: "1px solid var(--color-border-tan)",
            //background: "white",
            cursor: "pointer",
          }}>
             <Image
            src="/profile.png"
            alt="profile"
            width={40}
            height={40}
            priority
            style={{ objectFit: "contain" }}
            //style={{ objectFit: "cover" }}
          />
          </button>
        </Link>
      </div>
    </nav>
  );
}