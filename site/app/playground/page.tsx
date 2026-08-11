import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/footer/Footer";

export default function PlaygroundPage() {
  return (
    <>
      <Navbar />
      <main className="container-site flex flex-1 flex-col items-center justify-center py-40 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-secondary">Playground</p>
        <h1 className="mt-6 max-w-xl font-display text-[clamp(32px,5vw,52px)] font-bold leading-tight tracking-[-0.03em]">
          Coming in Phase 5
        </h1>
        <p className="mt-5 max-w-md text-[15.5px] leading-relaxed text-muted">
          The live playground will wire the real MemoryOS engine — type a message, and watch it
          store, supersede, and retrieve memories for real.
        </p>
        <Link href="/" className="btn-ghost mt-10">
          <ArrowLeft size={15} /> Back to the site
        </Link>
      </main>
      <Footer />
    </>
  );
}
