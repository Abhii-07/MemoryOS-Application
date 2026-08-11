import { Navbar } from "@/components/navigation/Navbar";
import { Hero } from "@/components/hero/Hero";
import { Footer } from "@/components/footer/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />

        {/* Act 02+ mount here (Phase 3) — anchors kept stable:
            #product · #how-it-works · #developers · #docs */}
        <div id="product" />
        <div id="how-it-works" />
        <div id="developers" />
        <div id="docs" />
      </main>
      <Footer />
    </>
  );
}
