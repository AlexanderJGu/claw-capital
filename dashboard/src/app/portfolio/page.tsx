import { getPortfolio } from "@/lib/data";

export default function Portfolio() {
  const data = getPortfolio();

  if (!data) {
    return (
      <div className="space-y-6 pt-2 lg:pt-0">
        <h1 className="text-xl font-bold">Portfolio</h1>
        <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
          <p>No portfolio data yet. Run <code className="bg-muted px-1.5 py-0.5 rounded text-xs">node portfolio/pull-portfolio.js</code> to sync.</p>
        </div>
      </div>
    );
  }

  const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
  const pnlColor = (n: number) => n >= 0 ? "text-green" : "text-red";

  const thesisEntries = Object.entries(data.summary?.byThesis || {}).sort(([, a]: any, [, b]: any) => b - a);

  return (
    <div className="space-y-6 pt-2 lg:pt-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Portfolio</h1>
        <span className="text-xs text-muted-foreground font-mono">
          updated {new Date(data.lastUpdated).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      {/* Net Worth */}
      <div className="bg-card border border-border rounded-lg p-6">
        <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1">Total Net Worth</p>
        <p className="text-4xl font-mono font-black tracking-tight">{fmt(data.totalNetWorth)}</p>
        <div className="flex gap-6 mt-3 text-sm font-mono">
          <span>Equities: <span className="text-accent">{fmt(data.summary?.totalEquities || 0)}</span></span>
          <span>Crypto: <span className="text-accent">{fmt(data.summary?.totalCrypto || 0)}</span></span>
          <span>Cash: <span className="text-accent">{fmt(data.summary?.totalCash || 0)}</span></span>
        </div>
      </div>

      {/* By Thesis */}
      {thesisEntries.length > 0 && (
        <div>
          <h2 className="text-xs font-bold text-muted-foreground font-mono uppercase mb-2">By Thesis</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {thesisEntries.map(([thesis, value]: any) => (
              <div key={thesis} className="bg-card border border-border rounded-lg p-3">
                <p className="text-xs text-muted-foreground font-mono uppercase">{thesis}</p>
                <p className="text-lg font-mono font-bold">{fmt(value)}</p>
                <p className="text-[10px] text-muted-foreground font-mono">
                  {data.totalNetWorth > 0 ? ((value / data.totalNetWorth) * 100).toFixed(1) : 0}%
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Account Cards + Positions */}
      <div>
        <h2 className="text-xs font-bold text-muted-foreground font-mono uppercase mb-2">Accounts</h2>
        <div className="space-y-4">
          {data.accounts.map((acct: any, i: number) => (
            <div key={i} className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b border-border">
                <div>
                  <span className="font-mono font-bold text-sm">{acct.name}</span>
                  <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">{acct.source}</span>
                </div>
                <span className="font-mono font-bold text-sm">{fmt(acct.balance)}</span>
              </div>
              {acct.positions?.length > 0 && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground font-mono">
                      <th className="text-left p-2.5">Ticker</th>
                      <th className="text-right p-2.5 hidden sm:table-cell">Qty</th>
                      <th className="text-right p-2.5">Value</th>
                      <th className="text-right p-2.5 hidden md:table-cell">Cost Basis</th>
                      <th className="text-right p-2.5">P&L</th>
                      <th className="text-right p-2.5">P&L%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {acct.positions
                      .sort((a: any, b: any) => b.value - a.value)
                      .map((pos: any, j: number) => (
                        <tr key={j} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                          <td className="p-2.5 font-mono font-bold">{pos.ticker}</td>
                          <td className="p-2.5 text-right font-mono text-xs hidden sm:table-cell">{pos.quantity?.toLocaleString()}</td>
                          <td className="p-2.5 text-right font-mono text-xs">{fmt(pos.value)}</td>
                          <td className="p-2.5 text-right font-mono text-xs hidden md:table-cell">{pos.costBasis ? fmt(pos.costBasis) : "—"}</td>
                          <td className={`p-2.5 text-right font-mono text-xs ${pnlColor(pos.pnl)}`}>
                            {pos.pnl ? fmt(pos.pnl) : "—"}
                          </td>
                          <td className={`p-2.5 text-right font-mono text-xs ${pnlColor(pos.pnlPct)}`}>
                            {pos.pnlPct ? fmtPct(pos.pnlPct) : "—"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
