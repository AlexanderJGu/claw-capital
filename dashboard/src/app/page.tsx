import { getUniverse, getRegime, getThesisLevels, getPredictions } from "@/lib/data";
import Link from "next/link";

function RegimeBadge({ regime }: { regime: string }) {
  const colors: Record<string, string> = {
    bear: "bg-red/20 text-red border-red/30",
    bull: "bg-green/20 text-green border-green/30",
    distribution: "bg-yellow/20 text-yellow border-yellow/30",
    accumulation: "bg-blue/20 text-blue border-blue/30",
  };
  return (
    <span className={`inline-block px-3 py-1 rounded border text-xs font-mono font-bold uppercase ${colors[regime] || "bg-muted text-muted-foreground border-border"}`}>
      {regime}
    </span>
  );
}

function DistanceBar({ current, zone, label }: { current: number; zone: [number, number]; label: string }) {
  const midZone = (zone[0] + zone[1]) / 2;
  const distance = ((current - midZone) / midZone) * 100;
  const inZone = current >= zone[0] && current <= zone[1];
  const belowZone = current < zone[0];
  const barColor = inZone ? "bg-green" : belowZone ? "bg-blue" : distance > 20 ? "bg-red" : "bg-yellow";
  const pct = Math.max(0, Math.min(100, 100 - Math.abs(distance)));

  return (
    <div className="mt-1">
      <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
        <span>{label}</span>
        <span className={inZone ? "text-green font-bold" : ""}>{distance > 0 ? "+" : ""}{distance.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-0.5">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const universe = getUniverse();
  const regime = getRegime();
  const levels = getThesisLevels();
  const predictions = getPredictions();

  const assets = universe?.assets || {};
  const tier1 = Object.entries(assets)
    .filter(([, v]: [string, any]) => v.tier === 1)
    .sort(([, a]: [string, any], [, b]: [string, any]) => (b.conviction || 0) - (a.conviction || 0));

  // Find assets in zones
  const alerts = Object.entries(assets)
    .map(([sym, a]: [string, any]) => {
      const price = a.current_price_approx;
      const inBuy = price >= a.buy_zone[0] && price <= a.buy_zone[1];
      const inWatch = price >= a.watch_zone[0] && price <= a.watch_zone[1];
      if (inBuy || inWatch) return { sym, name: a.name, zone: inBuy ? "BUY" : "WATCH", price };
      return null;
    })
    .filter(Boolean);

  const openPredictions = predictions?.predictions?.filter((p: any) => p.status === "open")?.length || 0;

  return (
    <div className="space-y-6 pt-2 lg:pt-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Dashboard</h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            Last updated: {regime?.last_updated || "—"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RegimeBadge regime={regime?.current_regime || "unknown"} />
          <span className="text-xs text-muted-foreground">
            Confidence: <span className="text-foreground font-medium">{regime?.confidence || "—"}</span>
          </span>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-yellow/5 border border-yellow/20 rounded-lg p-3">
          <p className="text-xs font-mono font-bold text-yellow mb-2">⚠ ZONE ALERTS</p>
          <div className="flex flex-wrap gap-2">
            {alerts.map((a: any) => (
              <span key={a.sym} className={`px-2 py-0.5 rounded text-xs font-mono ${a.zone === "BUY" ? "bg-green/20 text-green" : "bg-yellow/20 text-yellow"}`}>
                {a.sym} — {a.zone} @ ${a.price.toLocaleString()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tier 1 Cards */}
      <div>
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Tier 1 Assets</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tier1.map(([sym, asset]: [string, any]) => {
            const price = asset.current_price_approx;
            const inBuy = price >= asset.buy_zone[0] && price <= asset.buy_zone[1];
            const inWatch = price >= asset.watch_zone[0] && price <= asset.watch_zone[1];
            return (
              <Link
                key={sym}
                href={`/theses/${sym}`}
                className={`block bg-card border rounded-lg p-4 hover:border-accent/50 transition-colors ${
                  inBuy ? "border-green/50" : inWatch ? "border-yellow/50" : "border-border"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm">{sym}</h3>
                    <p className="text-[10px] text-muted-foreground">{asset.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-bold">
                      ${price < 10 ? price.toFixed(2) : price.toLocaleString()}
                    </p>
                    {asset.conviction && (
                      <p className="text-[10px] text-muted-foreground">
                        Conv: <span className="text-accent font-bold">{asset.conviction}/10</span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <DistanceBar current={price} zone={asset.buy_zone} label={`Buy: $${asset.buy_zone[0].toLocaleString()}–$${asset.buy_zone[1].toLocaleString()}`} />
                  <DistanceBar current={price} zone={asset.watch_zone} label={`Watch: $${asset.watch_zone[0].toLocaleString()}–$${asset.watch_zone[1].toLocaleString()}`} />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    asset.status === "active" ? "bg-green/20 text-green" : "bg-muted text-muted-foreground"
                  }`}>
                    {asset.status}
                  </span>
                  {inBuy && <span className="text-[10px] px-1.5 py-0.5 rounded bg-green/20 text-green font-mono font-bold">IN BUY ZONE</span>}
                  {inWatch && <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow/20 text-yellow font-mono font-bold">IN WATCH ZONE</span>}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-[10px] text-muted-foreground font-mono">UNIVERSE</p>
          <p className="text-lg font-bold font-mono">{Object.keys(assets).length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-[10px] text-muted-foreground font-mono">TRACKED LEVELS</p>
          <p className="text-lg font-bold font-mono">{Object.keys(levels?.assets || {}).length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-[10px] text-muted-foreground font-mono">OPEN PREDICTIONS</p>
          <p className="text-lg font-bold font-mono">{openPredictions}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-[10px] text-muted-foreground font-mono">REGIME</p>
          <p className="text-lg font-bold font-mono capitalize">{regime?.current_regime}</p>
        </div>
      </div>

      {/* Desk Implications */}
      {regime?.desk_implications && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Desk Implications</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {Object.entries(regime.desk_implications).map(([key, val]: [string, any]) => (
              <div key={key} className="flex gap-2">
                <span className="text-muted-foreground font-mono text-xs min-w-[120px]">{key.replace(/_/g, " ")}:</span>
                <span className="text-xs">{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
