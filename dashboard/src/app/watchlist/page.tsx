import { getUniverse, getThesisLevels } from "@/lib/data";
import Link from "next/link";

export default function Watchlist() {
  const universe = getUniverse();
  const levels = getThesisLevels();
  const assets = universe?.assets || {};

  // Merge universe + thesis-levels for full coverage
  const allSymbols = new Set([
    ...Object.keys(assets),
    ...Object.keys(levels?.assets || {}),
  ]);

  const rows = Array.from(allSymbols)
    .map((sym) => {
      const u = assets[sym] || {};
      const l = (levels?.assets || {})[sym] || {};
      const price = u.current_price_approx || null;
      const buyZone = u.buy_zone || l.buy_zone || null;
      const watchZone = u.watch_zone || l.watch_zone || null;
      const tier = u.tier || (l.type === "equity" ? "EQ" : "—");
      const conviction = u.conviction || null;
      const name = u.name || l.symbol || sym;

      let status = "—";
      let statusColor = "text-muted-foreground";
      if (price && buyZone && price >= buyZone[0] && price <= buyZone[1]) {
        status = "BUY ZONE";
        statusColor = "text-green";
      } else if (price && watchZone && price >= watchZone[0] && price <= watchZone[1]) {
        status = "WATCH ZONE";
        statusColor = "text-yellow";
      } else if (price && buyZone) {
        const dist = ((price - buyZone[1]) / buyZone[1]) * 100;
        if (dist > 20) {
          status = `+${dist.toFixed(0)}% above`;
          statusColor = "text-red";
        } else if (dist > 0) {
          status = `+${dist.toFixed(0)}% above`;
          statusColor = "text-yellow";
        } else {
          status = `${dist.toFixed(0)}% below`;
          statusColor = "text-blue";
        }
      }

      let distToZone = null;
      if (price && buyZone) {
        const mid = (buyZone[0] + buyZone[1]) / 2;
        distToZone = ((price - mid) / mid) * 100;
      }

      return { sym, name, price, tier, conviction, buyZone, watchZone, status, statusColor, distToZone, type: l.type || "crypto" };
    })
    .sort((a, b) => {
      const ta = typeof a.tier === "number" ? a.tier : 99;
      const tb = typeof b.tier === "number" ? b.tier : 99;
      if (ta !== tb) return ta - tb;
      return (b.conviction || 0) - (a.conviction || 0);
    });

  const cryptoRows = rows.filter((r) => r.type === "crypto");
  const equityRows = rows.filter((r) => r.type === "equity");

  return (
    <div className="space-y-6 pt-2 lg:pt-0">
      <h1 className="text-xl font-bold">Watchlist</h1>

      <div className="space-y-6">
        <WatchlistTable title="Crypto" rows={cryptoRows} />
        {equityRows.length > 0 && <WatchlistTable title="Equities" rows={equityRows} />}
      </div>
    </div>
  );
}

function WatchlistTable({ title, rows }: { title: string; rows: any[] }) {
  return (
    <div>
      <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">{title} ({rows.length})</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[10px] text-muted-foreground font-mono uppercase">
              <th className="pb-2 pr-3">Asset</th>
              <th className="pb-2 pr-3 text-right">Price</th>
              <th className="pb-2 pr-3 text-center">Tier</th>
              <th className="pb-2 pr-3 text-center">Conv</th>
              <th className="pb-2 pr-3 text-right hidden sm:table-cell">Buy Zone</th>
              <th className="pb-2 pr-3 text-right hidden sm:table-cell">Watch Zone</th>
              <th className="pb-2 pr-3 text-right hidden md:table-cell">Dist</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.sym} className="border-b border-border/50 hover:bg-muted/30">
                <td className="py-2 pr-3">
                  <Link href={`/theses/${r.sym}`} className="font-mono font-bold text-accent hover:underline">
                    {r.sym}
                  </Link>
                  <span className="text-[10px] text-muted-foreground ml-1.5 hidden sm:inline">{r.name}</span>
                </td>
                <td className="py-2 pr-3 text-right font-mono">
                  {r.price ? (r.price < 10 ? `$${r.price.toFixed(2)}` : `$${r.price.toLocaleString()}`) : "—"}
                </td>
                <td className="py-2 pr-3 text-center font-mono text-xs">{r.tier}</td>
                <td className="py-2 pr-3 text-center font-mono text-xs">
                  {r.conviction ? <span className="text-accent">{r.conviction}</span> : "—"}
                </td>
                <td className="py-2 pr-3 text-right font-mono text-xs hidden sm:table-cell text-muted-foreground">
                  {r.buyZone ? `$${r.buyZone[0].toLocaleString()}–$${r.buyZone[1].toLocaleString()}` : "—"}
                </td>
                <td className="py-2 pr-3 text-right font-mono text-xs hidden sm:table-cell text-muted-foreground">
                  {r.watchZone ? `$${r.watchZone[0].toLocaleString()}–$${r.watchZone[1].toLocaleString()}` : "—"}
                </td>
                <td className="py-2 pr-3 text-right font-mono text-xs hidden md:table-cell">
                  {r.distToZone !== null ? `${r.distToZone > 0 ? "+" : ""}${r.distToZone.toFixed(1)}%` : "—"}
                </td>
                <td className={`py-2 font-mono text-xs font-bold ${r.statusColor}`}>
                  {r.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
