import { getTradeIdeas } from "@/lib/data";

export default function Trades() {
  const trades = getTradeIdeas();
  const active = trades.filter((t: any) => t.status === "active");
  const watching = trades.filter((t: any) => t.status === "watching");
  const closed = trades.filter((t: any) => t.status === "closed");

  function TradeCard({ t }: { t: any }) {
    const dirColor = t.direction === "long" ? "bg-green/20 text-green border-green/20" : "bg-red/20 text-red border-red/20";
    const barColor = t.direction === "long" ? "bg-green" : "bg-red";

    return (
      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${dirColor}`}>
              {t.direction.toUpperCase()}
            </span>
            <span className="font-mono font-bold text-lg">{t.ticker}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5" title={`Conviction: ${t.conviction}/10`}>
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className={`w-1.5 h-4 rounded-sm ${i < t.conviction ? barColor : "bg-muted"}`} />
              ))}
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">{t.thesis}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground font-mono">Entry</span>
            <div className="font-mono mt-0.5">
              {t.entryZone ? `${t.entryZone[0].toLocaleString()}–${t.entryZone[1].toLocaleString()}` : "—"}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground font-mono">Target</span>
            <div className="font-mono mt-0.5 text-green">
              {t.target ? `${t.target[0].toLocaleString()}–${t.target[1].toLocaleString()}` : "—"}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground font-mono">Stop</span>
            <div className="font-mono mt-0.5 text-red">
              {t.stopLoss ? t.stopLoss.toLocaleString() : "—"}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground font-mono">Size</span>
            <div className="font-mono mt-0.5">{t.size}</div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
          <span>{t.timeframe}</span>
          <span>updated {t.lastUpdated}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2 lg:pt-0">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Trade Ideas</h1>
        <span className="text-xs text-muted-foreground font-mono">
          {active.length} active · {watching.length} watching
        </span>
      </div>

      {active.length > 0 && (
        <div>
          <h2 className="text-xs font-bold text-muted-foreground font-mono uppercase mb-3">Active</h2>
          <div className="grid gap-3">
            {active.map((t: any) => <TradeCard key={t.id} t={t} />)}
          </div>
        </div>
      )}

      {watching.length > 0 && (
        <div>
          <h2 className="text-xs font-bold text-muted-foreground font-mono uppercase mb-3">Watching</h2>
          <div className="grid gap-3">
            {watching.map((t: any) => <TradeCard key={t.id} t={t} />)}
          </div>
        </div>
      )}

      {closed.length > 0 && (
        <div>
          <h2 className="text-xs font-bold text-muted-foreground font-mono uppercase mb-3">Closed</h2>
          <div className="grid gap-3">
            {closed.map((t: any) => <TradeCard key={t.id} t={t} />)}
          </div>
        </div>
      )}
    </div>
  );
}
