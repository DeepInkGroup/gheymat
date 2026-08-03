import Header from "@/components/Header";
import PricesBoard from "@/components/PricesBoard";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <PricesBoard />
      </main>
      <Footer />
    </div>
  );
}
