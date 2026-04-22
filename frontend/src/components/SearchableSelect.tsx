"use client";

import { useState, useRef, useEffect } from "react";

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyLabel?: string;
  isLoading?: boolean;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Search...",
  emptyLabel = "Any",
  isLoading = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find(o => o.value === value);
  const displayLabel = selected ? selected.label : emptyLabel;

  const filtered = search.trim()
    ? options.filter(
        o =>
          o.label.toLowerCase().includes(search.toLowerCase()) ||
          o.sublabel?.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
    setSearch("");
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          width: "100%",
          padding: "8px 12px",
          border: `var(--border-width) solid ${open ? "var(--color-primary-navy)" : "var(--color-border-tan)"}`,
          borderRadius: "var(--border-radius-sm)",
          background: "var(--color-surface-light-cream)",
          fontSize: "var(--font-size-xs)",
          color: value ? "var(--color-text-primary)" : "var(--color-text-secondary)",
          fontFamily: "var(--font-body)",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          textAlign: "left",
          transition: "border-color 0.15s ease",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {isLoading ? "Loading..." : displayLabel}
        </span>
        <span style={{
          fontSize: "10px",
          color: "var(--color-text-secondary)",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.15s ease",
          flexShrink: 0,
          marginLeft: "8px",
        }}>
          ▼
        </span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "var(--color-white)",
            border: "var(--border-width) solid var(--color-border-tan)",
            borderRadius: "var(--border-radius-sm)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            zIndex: 100,
            maxHeight: "240px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{
            padding: "8px",
            borderBottom: "var(--border-width) solid var(--color-border-tan)",
            flexShrink: 0,
          }}>
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute",
                left: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "12px",
                color: "var(--color-text-secondary)",
                pointerEvents: "none",
              }}>
                🔍
              </span>
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={placeholder}
                style={{
                  width: "100%",
                  padding: "6px 8px 6px 26px",
                  border: "var(--border-width) solid var(--color-border-tan)",
                  borderRadius: "var(--border-radius-sm)",
                  fontSize: "var(--font-size-xs)",
                  fontFamily: "var(--font-body)",
                  color: "var(--color-text-primary)",
                  background: "var(--color-surface-light-cream)",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <div style={{ overflowY: "auto", flex: 1 }}>
            <button
              onClick={() => handleSelect("")}
              style={{
                width: "100%",
                padding: "10px 12px",
                background: !value ? "var(--color-surface-light-cream)" : "transparent",
                border: "none",
                borderBottom: "var(--border-width) solid var(--color-border-tan)",
                cursor: "pointer",
                textAlign: "left",
                fontSize: "var(--font-size-xs)",
                fontFamily: "var(--font-body)",
                color: "var(--color-text-secondary)",
                fontStyle: "italic",
              }}
            >
              {emptyLabel}
            </button>

            {filtered.length === 0 ? (
              <div style={{
                padding: "16px 12px",
                fontSize: "var(--font-size-xs)",
                color: "var(--color-text-secondary)",
                textAlign: "center",
              }}>
                No results found
              </div>
            ) : (
              filtered.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    background: opt.value === value ? "var(--color-surface-light-cream)" : "transparent",
                    border: "none",
                    borderBottom: "var(--border-width) solid var(--color-border-tan)",
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "background 0.1s ease",
                  }}
                  onMouseEnter={e => {
                    if (opt.value !== value)
                      (e.currentTarget as HTMLButtonElement).style.background = "var(--color-surface-extra-light)";
                  }}
                  onMouseLeave={e => {
                    if (opt.value !== value)
                      (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  }}
                >
                  {opt.sublabel && (
                    <span style={{
                      fontSize: "var(--font-size-xs)",
                      fontWeight: "var(--font-weight-bold)",
                      color: "var(--color-primary-navy)",
                      minWidth: "40px",
                      fontFamily: "var(--font-heading)",
                    }}>
                      {opt.sublabel}
                    </span>
                  )}
                  <span style={{
                    fontSize: "var(--font-size-xs)",
                    color: "var(--color-text-primary)",
                    fontFamily: "var(--font-body)",
                  }}>
                    {opt.label}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}