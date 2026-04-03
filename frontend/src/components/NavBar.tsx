"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

interface NavbarProps {
  activePage?: "home" | "courses" | "professors" | "reviews";
}

const NAV_LINKS = [
  { label: "Home",       href: "/",           key: "home" },
  { label: "Courses",    href: "/courses",    key: "courses" },
  { label: "Professors", href: "/professors", key: "professors" },
  { label: "Reviews",    href: "/reviews",    key: "reviews" },
] as const;

export default function Navbar({ activePage }: NavbarProps) {
  const pathname = usePathname();

  const isActive = (key: string, href: string) => {
    if (activePage) return activePage === key;
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header
      style={{
        background: "var(--color-surface-light-cream)",
        borderBottom: "var(--border-width) solid var(--color-border-tan)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <nav
        style={{
          padding: "0 40px",
          height: "76px",
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <Image
            src="/NorthStarLogo.png"
            alt="NorthStar"
            width={180}
            height={56}
            priority
            style={{
              objectFit: "contain",
              objectPosition: "left center",
              height: "56px",
              width: "auto",
            }}
          />
        </Link>

        <ul
          style={{
            display: "flex",
            alignItems: "center",
            gap: "40px",
            listStyle: "none",
            margin: 0,
            padding: 0,
          }}
        >
          {NAV_LINKS.map(({ label, href, key }) => {
            const active = isActive(key, href);
            return (
              <li key={key}>
                <Link
                  href={href}
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--font-size-base)",
                    fontWeight: active ? "var(--font-weight-semibold)" : "var(--font-weight-regular)",
                    color: active ? "var(--color-primary-navy)" : "var(--color-text-secondary)",
                    textDecoration: active ? "underline" : "none",
                    textUnderlineOffset: "4px",
                    textDecorationThickness: "2px",
                    transition: "color 0.15s ease",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={e => {
                    if (!active) (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-text-primary)";
                  }}
                  onMouseLeave={e => {
                    if (!active) (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-text-secondary)";
                  }}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
        
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            aria-label="User profile"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "var(--border-radius-full)",
              border: "var(--border-width) solid var(--color-border-tan)",
              background: "var(--color-white)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "border-color 0.15s ease",
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--color-primary-navy)")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--color-border-tan)")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle cx="12" cy="8" r="4" stroke="var(--color-text-secondary)" strokeWidth="1.5" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="var(--color-text-secondary)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </nav>
    </header>
  );
}