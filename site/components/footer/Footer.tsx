import Link from "next/link";
import { LogoMark } from "@/components/LogoMark";
import { MotionToggle } from "@/components/MotionToggle";

const COLS = [
  { title: "Product", links: ["How it works", "Playground", "GitHub"] },
  { title: "Resources", links: ["Docs", "Developers"] },
];

export function Footer() {
  return (
    <footer className="mt-32 border-t border-[rgba(255,255,255,0.08)]">
      <div className="container-site grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5 text-[15px] font-semibold">
            <span className="text-primary">
              <LogoMark size={22} />
            </span>
            MemoryOS
          </div>
          <p className="mt-3 max-w-[260px] text-[13.5px] leading-relaxed text-faint">
            Memory infrastructure for AI.
          </p>
        </div>

        {COLS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
              {col.title}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l}>
                  <Link
                    href={l === "How it works" ? "#how-it-works" : l === "Playground" ? "/playground" : "#"}
                    className="text-[13.5px] text-muted transition-colors hover:text-text"
                  >
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-[rgba(255,255,255,0.06)]">
        <div className="container-site flex flex-wrap items-center justify-between gap-3 py-6 font-mono text-[11.5px] tracking-[0.12em] text-faint">
          <span>© 2026 MemoryOS</span>
          <MotionToggle />
          <span>THE AI YOU CAN AUDIT</span>
        </div>
      </div>
    </footer>
  );
}
