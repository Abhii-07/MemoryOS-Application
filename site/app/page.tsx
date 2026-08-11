import { Navbar } from "@/components/navigation/Navbar";
import { Hero } from "@/components/hero/Hero";
import { MemoryConversation } from "@/components/acts/MemoryConversation";
import { MemoryGraph } from "@/components/graph/MemoryGraph";
import { DecisionStream } from "@/components/stream/DecisionStream";
import { DeveloperSection } from "@/components/developer/DeveloperSection";
import { TrustSection } from "@/components/trust/TrustSection";
import { FinalCta } from "@/components/FinalCta";
import { Footer } from "@/components/footer/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />

        {/* Act 02+ — anchors stable: #product · #how-it-works · #developers */}
        <MemoryConversation />
        <MemoryGraph />
        <DecisionStream />
        <DeveloperSection />
        <TrustSection />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
