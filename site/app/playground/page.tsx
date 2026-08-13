import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/footer/Footer";
import { LivePlayground } from "@/components/playground/LivePlayground";

export default function PlaygroundPage() {
  return (
    <>
      <Navbar />
      <LivePlayground />
      <div className="container-site pb-16">
        <p className="mt-2 text-center font-mono text-[11px] leading-relaxed text-faint">
          POST /ingest · POST /ask · GET /memory · GET /audit —{" "}
          <span className="text-secondary">FastAPI → memory_os → Postgres/pgvector</span>
        </p>
        <div className="mt-8 text-center">
          <Link href="/" className="btn-ghost">
            <ArrowLeft size={15} /> Back to the site
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
}