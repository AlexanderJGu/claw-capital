import { getRegime } from "@/lib/data";

export default function Regime() {
  const regime = getRegime();
  if (!regime) return <p className="text-muted-foreground">No regime data found.</p>;

  const regimeColors: Record<string, string> = {
    bear: "bg-red/20 text-red border-red/30",
    bull: "bg-green/20 text-green border-green/30",
    distribution: "bg-yellow/20 text-yellow border-yellow/30",
    accumulation: "bg-blue/20 text-blue border-blue/30",
  };

  return (
    <div className="space-y-6 pt-2 lg:pt-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Regime Dashboard</h1>
        <span className={`inline-block px-4 py-1.5 rounded border text-sm font-mono font-bold uppercase ${regimeColors[regime.current_regime] || "bg-muted text-muted-foreground border-border"}`}>
          {regime.current_regime}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>Confidence: <span className="text-foreground font-bold">{regime.confidence}</span></span>
        <span>Determined by: <span className="text-foreground">{regime.determined_by}</span></span>
        <span>Updated: <span className="font-mono">{regime.last_updated}</span></span>
      </div>

      {/* Primary Indicators */}
      <div>
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Primary Indicators</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(regime.primary_indicators || {}).map(([key, ind]: [string, any]) => (
            <div key={key} className="bg-card border border-border rounded-lg p-4">
              <p className="text-[10px] text-muted-foreground font-mono uppercase mb-1">
                {key.replace(/_/g, " ")}
              </p>
              {ind.value !== undefined && (
                <p className="text-lg font-bold font-mono">{typeof ind.value === "number" ? ind.value.toLocaleString() : ind.value}</p>
              )}
              {ind.btc_price && (
                <div className="space-y-0.5">
                  <p className="text-sm font-mono">BTC: <span className="font-bold">${ind.btc_price.toLocaleString()}</span></p>
                  <p className="text-sm font-mono">200W SMA: <span className="font-bold">${ind.sma_200w.toLocaleString()}</span></p>
                  <p className="text-sm font-mono">Ratio: <span className="font-bold">{ind.ratio}</span></p>
                </div>
              )}
              {ind.direction && (
                <p className="text-xs text-muted-foreground mt-0.5">Direction: <span className="text-foreground">{ind.direction}</span></p>
              )}
              <p className="text-xs text-muted-foreground mt-1">{ind.interpretation}</p>
              <p className="text-[10px] text-muted-foreground font-mono mt-1">{ind.source} — {ind.as_of}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Secondary Indicators */}
      <div>
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Secondary Indicators</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(regime.secondary_indicators || {}).map(([key, ind]: [string, any]) => (
            <div key={key} className="bg-card border border-border rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground font-mono uppercase mb-1">
                {key.replace(/_/g, " ")}
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-sm font-bold font-mono">
                  {typeof ind.value === "number"
                    ? ind.value > 1000000000
                      ? `$${(ind.value / 1e9).toFixed(0)}B`
                      : ind.value.toLocaleString()
                    : ind.value}
                </p>
                <span className={`text-[10px] font-mono ${
                  ind.trend === "rising" || ind.trend === "growing" ? "text-green" :
                  ind.trend === "declining" || ind.trend === "negative" ? "text-red" : "text-yellow"
                }`}>
                  {ind.trend}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{ind.interpretation}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ITC Qualitative */}
      {regime.itc_qualitative && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">ITC Qualitative View</h2>
          <p className="text-sm">{regime.itc_qualitative.cowen_cycle_view}</p>
        </div>
      )}

      {/* Regime History */}
      {regime.regime_history && regime.regime_history.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Regime History</h2>
          <div className="space-y-1">
            {regime.regime_history.map((h: any, i: number) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${regimeColors[h.regime] || "bg-muted text-muted-foreground"}`}>
                  {h.regime}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {h.from} → {h.to || "present"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Desk Implications / Gating */}
      {regime.desk_implications && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Gating Rules — {regime.current_regime.toUpperCase()} Regime</h2>
          <div className="space-y-2">
            {Object.entries(regime.desk_implications).map(([key, val]: [string, any]) => (
              <div key={key} className="flex gap-3">
                <span className="text-xs text-muted-foreground font-mono min-w-[140px] shrink-0">{key.replace(/_/g, " ")}</span>
                <span className="text-sm">{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
