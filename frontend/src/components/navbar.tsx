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
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Courses", href: "/courses" },
    { label: "Professors", href: "/professors" },
    { label: "Reviews", href: "/reviews" },
  ];

  return (
    <nav style={{ 
      background: "var(--color-surface-light-cream)", 
      borderBottom: "1px solid var(--color-border-tan)",
      height: 68,
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
        {/* Placeholder for Logo */}
        <div style={{ fontWeight: 700, fontFamily: "var(--font-logo)" }}>NorthStar</div>

        <div style={{ display: "flex", gap: 48 }}>
          {navLinks.map(({ label, href }) => {
            const isActive = pathname === href;
            return (
              <Link 
                key={label} 
                href={href} 
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--font-size-base)",
                  color: isActive ? "var(--color-primary-navy)" : "var(--color-text-primary)",
                  textDecoration: isActive ? "underline" : "none",
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {label}
              </Link>
            );
          })}
        </div>

        <button style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "1px solid var(--color-border-tan)",
          background: "white",
          cursor: "pointer",
        }}>
          {/* User Icon Placeholder */}
          👤
        </button>
      </div>
    </nav>
  );
}