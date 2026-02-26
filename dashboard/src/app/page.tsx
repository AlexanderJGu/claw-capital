import { getRegime, getWatchlist, getTradeIdeas, getDrafts } from "@/lib/data";
import Link from "next/link";

export default function Home() {
  const regime = getRegime();
  const watchlist = getWatchlist();
  const trades = getTradeIdeas();
  const drafts = getDrafts();

  const activeTrades = trades.filter((t: any) => t.status === "active").length;
  const watchingTrades = trades.filter((t: any) => t.status === "watching").length;
  const longs = trades.filter((t: any) => t.direction === "long").length;
  const shorts = trades.filter((t: any) => t.direction === "short").length;

  const regimeColor = regime.regime === "bear" ? "bg-red/20 text-red border-red/30" 
    : regime.regime === "bull" ? "bg-green/20 text-green border-green/30" 
    : "bg-yellow/20 text-yellow border-yellow/30";

  return (
    <div className="space-y-6 pt-2 lg:pt-0">
      {/* Regime Banner */}
      <div className={`border rounded-lg p-4 ${regimeColor}`}>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-mono font-black tracking-widest">
              {regime.regime.toUpperCase()}
            </span>
            <span className="ml-3 text-xs opacity-70">confidence: {regime.confidence}</span>
          </div>
          <span className="text-xs font-mono opacity-60">updated {regime.lastUpdated}</span>
        </div>
        <p className="text-sm mt-2 opacity-80">{regime.bias}</p>
      </div>

      {/* Signals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Object.entries(regime.signals || {}).map(([key, val]) => (
          <div key={key} className="bg-card border border-border rounded-lg p-3">
            <div className="text-[10px] text-muted-foreground font-mono uppercase mb-1">{key}</div>
            <div className="text-xs">{val as string}</div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link href="/watchlist" className="bg-card border border-border rounded-lg p-4 hover:border-accent/50 transition-colors">
          <div className="text-2xl font-mono font-bold">{watchlist.length}</div>
          <div className="text-xs text-muted-foreground">Assets Tracked</div>
        </Link>
        <Link href="/trades" className="bg-card border border-border rounded-lg p-4 hover:border-accent/50 transition-colors">
          <div className="text-2xl font-mono font-bold">{activeTrades}</div>
          <div className="text-xs text-muted-foreground">Active Trades</div>
        </Link>
        <Link href="/trades" className="bg-card border border-border rounded-lg p-4 hover:border-accent/50 transition-colors">
          <div className="text-2xl font-mono font-bold">
            <span className="text-green">{longs}L</span>
            {" / "}
            <span className="text-red">{shorts}S</span>
          </div>
          <div className="text-xs text-muted-foreground">Long / Short Ideas</div>
        </Link>
        <Link href="/drafts" className="bg-card border border-border rounded-lg p-4 hover:border-accent/50 transition-colors">
          <div className="text-2xl font-mono font-bold">{drafts.length}</div>
          <div className="text-xs text-muted-foreground">Tweet Drafts</div>
        </Link>
      </div>

      {/* Active Trades Quick View */}
      {activeTrades > 0 && (
        <div>
          <h2 className="text-sm font-bold text-muted-foreground font-mono mb-3">ACTIVE POSITIONS</h2>
          <div className="space-y-2">
            {trades.filter((t: any) => t.status === "active").map((t: any) => (
              <div key={t.id} className="bg-card border border-border rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${t.direction === "long" ? "bg-green/20 text-green" : "bg-red/20 text-red"}`}>
                    {t.direction.toUpperCase()}
                  </span>
                  <span className="font-mono font-bold text-sm">{t.ticker}</span>
                  <span className="text-xs text-muted-foreground hidden md:inline">{t.size}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className={`w-1.5 h-3 rounded-sm ${i < t.conviction ? (t.direction === "long" ? "bg-green" : "bg-red") : "bg-muted"}`} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
