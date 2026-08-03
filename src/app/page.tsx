import Header from "@/components/Header";
import PricesBoard from "@/components/PricesBoard";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <PricesBoard />
      </main>
      <footer className="safe-bottom px-4 pb-4 pt-2 text-center text-xs text-muted">
        DeepInk Group - Gheymat
      </footer>
    </div>
  );
}
