"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, ExternalLink, ArrowRight } from "lucide-react";
import { LogoMark } from "@/components/LogoMark";

const LINKS = [
  { label: "Product", href: "#product" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Developers", href: "#developers" },
  { label: "Docs", href: "#docs", stub: true },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
      <nav
        className={`mx-auto flex max-w-5xl items-center justify-between rounded-xl px-4 py-2.5 transition-all duration-300 ${
          scrolled
            ? "border border-[rgba(255,255,255,0.12)] bg-[rgba(13,13,17,0.72)] backdrop-blur-md shadow-lg shadow-black/30"
            : "border border-transparent bg-transparent"
        }`}
        aria-label="Primary"
      >
        <Link href="/" className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight">
          <span className="text-primary">
            <LogoMark size={22} />
          </span>
          MemoryOS
        </Link>

        {/* desktop */}
        <div className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) =>
            l.stub ? (
              <span key={l.label} className="cursor-not-allowed text-[13.5px] text-faint" aria-disabled="true" title="Coming soon">
                {l.label}
              </span>
            ) : (
              <Link
                key={l.label}
                href={l.href}
                className="text-[13.5px] text-muted transition-colors hover:text-text"
              >
                {l.label}
              </Link>
            ),
          )}
          <Link
            href="https://github.com/Abhii-07/MemoryOS"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[13.5px] text-muted transition-colors hover:text-text"
            aria-label="GitHub"
          >
            <ExternalLink size={15} />
          </Link>
          <Link
            href="/playground"
            className="inline-flex items-center gap-1.5 rounded-lg bg-text px-3.5 py-1.5 text-[13px] font-semibold text-background transition-opacity hover:opacity-85"
          >
            Playground <ArrowRight size={13} />
          </Link>
        </div>

        {/* mobile toggle */}
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-white/5 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle menu"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>

      {/* mobile menu */}
      {open && (
        <div className="mx-auto mt-2 flex max-w-5xl flex-col gap-1 rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(13,13,17,0.92)] p-3 backdrop-blur-md md:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-[14px] text-muted hover:bg-white/5 hover:text-text"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/playground"
            onClick={() => setOpen(false)}
            className="mt-1 rounded-lg bg-text px-3 py-2 text-center text-[14px] font-semibold text-background"
          >
            Playground
          </Link>
        </div>
      )}
    </header>
  );
}
