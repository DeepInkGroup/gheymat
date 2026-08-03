import BrandMark from "./BrandMark";

export default function Header() {
  return (
    <header className="glass safe-top sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4">
        <BrandMark size={32} />
        <div className="leading-tight">
          <div className="text-sm font-bold text-foreground">Gheymat</div>
          <div className="text-[0.65rem] text-muted">Live currency, gold &amp; crypto prices</div>
        </div>
      </div>
    </header>
  );
}
