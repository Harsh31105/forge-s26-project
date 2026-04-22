"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function NavBar() {
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
            width={230}
            height={64}
            priority
            style={{ objectFit: "contain" }}
          />
        </Link>

        <div style={{ display: "flex", gap: 68, alignItems: "center" }}>
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

          {/*/!* Compare Courses *!/*/}
          {/*<Link*/}
          {/*    href="/compare"*/}
          {/*    className="bg-[var(--color-primary-navy)] text-white px-4 py-2 font-semibold*/}
          {/*               no-underline inline-flex items-center justify-center shadow-md duration-150*/}
          {/*               rounded-[var(--border-radius-md)] transition-all*/}
          {/*               hover:bg-[var(--color-accent-copper)]"*/}
          {/*    onMouseEnter={(e) => {*/}
          {/*      e.currentTarget.style.background = "var(--color-accent-copper)";*/}
          {/*    }}*/}
          {/*    onMouseLeave={(e) => {*/}
          {/*      e.currentTarget.style.background = "var(--color-primary-navy)";*/}
          {/*    }}*/}
          {/*>*/}
          {/*  Compare*/}
          {/*</Link>*/}
        </div>

        {/* Profile */}
        <Link href="/profile">
          <button style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            overflow: "hidden",
            border: "1px solid var(--color-border-tan)",
            cursor: "pointer",
          }}>
             <Image
            src="/profile.png"
            alt="profile"
            width={40}
            height={40}
            priority
            style={{ objectFit: "contain" }}
          />
          </button>
        </Link>
      </div>
    </nav>
  );
}