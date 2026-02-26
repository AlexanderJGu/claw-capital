import { getWatchlist } from "@/lib/data";

export default function Watchlist() {
  const watchlist = getWatchlist();

  const statusColors: Record<string, string> = {
    "watching": "bg-blue/20 text-blue",
    "buy-zone": "bg-green/20 text-green",
    "owned": "bg-accent/20 text-accent",
    "short-target": "bg-red/20 text-red",
  };

  const categories: string[] = [...new Set(watchlist.map((a: any) => a.category))] as string[];

  return (
    <div className="space-y-6 pt-2 lg:pt-0">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Watchlist</h1>
        <span className="text-xs text-muted-foreground font-mono">{watchlist.length} assets</span>
      </div>

      {categories.map((cat: string) => {
        const items = watchlist.filter((a: any) => a.category === cat);
        return (
          <div key={cat}>
            <h2 className="text-xs font-bold text-muted-foreground font-mono uppercase mb-2">{cat}</h2>
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground font-mono">
                    <th className="text-left p-2.5">Ticker</th>
                    <th className="text-left p-2.5 hidden md:table-cell">Thesis</th>
                    <th className="text-right p-2.5">Buy Zone</th>
                    <th className="text-right p-2.5 hidden sm:table-cell">Watch Zone</th>
                    <th className="text-center p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((a: any) => (
                    <tr key={a.ticker} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                      <td className="p-2.5 font-mono font-bold">{a.ticker}</td>
                      <td className="p-2.5 text-xs text-muted-foreground hidden md:table-cell max-w-xs truncate">{a.thesis}</td>
                      <td className="p-2.5 text-right font-mono text-xs">
                        {a.buyZone ? `${a.buyZone[0].toLocaleString()}–${a.buyZone[1].toLocaleString()}` : "—"}
                      </td>
                      <td className="p-2.5 text-right font-mono text-xs hidden sm:table-cell">
                        {a.watchZone ? `${a.watchZone[0].toLocaleString()}–${a.watchZone[1].toLocaleString()}` : "—"}
                      </td>
                      <td className="p-2.5 text-center">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${statusColors[a.status] || "bg-muted text-muted-foreground"}`}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
