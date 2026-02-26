"use client";

import { useState } from "react";

interface Source {
  author: string;
  summary: string;
  stance: "agrees" | "disagrees" | "neutral";
  url?: string;
}

interface Trade {
  id: string;
  ticker: string;
  direction: string;
  thesis: string;
  timeframe: string;
  entryZone: number[] | null;
  target: number[] | null;
  stopLoss: number | null;
  size: string;
  status: string;
  conviction: number;
  lastUpdated: string;
  sources?: Source[];
}

const stanceConfig = {
  agrees: { label: "Agrees", color: "text-green", icon: "↑" },
  disagrees: { label: "Disagrees", color: "text-red", icon: "↓" },
  neutral: { label: "Neutral", color: "text-muted-foreground", icon: "—" },
};

function TradeCard({ t }: { t: Trade }) {
  const [open, setOpen] = useState(false);
  const dirColor = t.direction === "long" ? "bg-green/20 text-green border-green/20" : "bg-red/20 text-red border-red/20";
  const barColor = t.direction === "long" ? "bg-green" : "bg-red";
  const hasSources = t.sources && t.sources.length > 0;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${dirColor}`}>
              {t.direction.toUpperCase()}
            </span>
            <span className="font-mono font-bold text-lg">{t.ticker}</span>
          </div>
          <div className="flex gap-0.5" title={`Conviction: ${t.conviction}/10`}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className={`w-1.5 h-4 rounded-sm ${i < t.conviction ? barColor : "bg-muted"}`} />
            ))}
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
          <div className="flex items-center gap-3">
            <span>updated {t.lastUpdated}</span>
            {hasSources && (
              <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>{t.sources!.length} source{t.sources!.length !== 1 ? "s" : ""}</span>
                <svg
                  className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {hasSources && (
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            open ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="border-t border-border bg-muted/10">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                  <th className="text-left py-2 px-4 w-[120px]">Author</th>
                  <th className="text-left py-2 px-4">Summary</th>
                  <th className="text-center py-2 px-4 w-[90px]">Stance</th>
                  <th className="text-center py-2 px-4 w-[50px]">Link</th>
                </tr>
              </thead>
              <tbody>
                {t.sources!.map((s, i) => {
                  const stance = stanceConfig[s.stance];
                  return (
                    <tr key={i} className="border-b border-border/30 last:border-0">
                      <td className="py-2.5 px-4 font-mono text-foreground whitespace-nowrap">
                        @{s.author}
                      </td>
                      <td className="py-2.5 px-4 text-muted-foreground leading-relaxed">
                        {s.summary}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`font-mono ${stance.color}`}>
                          {stance.icon} {stance.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {s.url ? (
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title="View tweet"
                          >
                            ↗
                          </a>
                        ) : (
                          <span className="text-muted-foreground/30">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export function TradesClient({ trades }: { trades: Trade[] }) {
  const active = trades.filter((t) => t.status === "active");
  const watching = trades.filter((t) => t.status === "watching");
  const closed = trades.filter((t) => t.status === "closed");

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
            {active.map((t) => <TradeCard key={t.id} t={t} />)}
          </div>
        </div>
      )}

      {watching.length > 0 && (
        <div>
          <h2 className="text-xs font-bold text-muted-foreground font-mono uppercase mb-3">Watching</h2>
          <div className="grid gap-3">
            {watching.map((t) => <TradeCard key={t.id} t={t} />)}
          </div>
        </div>
      )}

      {closed.length > 0 && (
        <div>
          <h2 className="text-xs font-bold text-muted-foreground font-mono uppercase mb-3">Closed</h2>
          <div className="grid gap-3">
            {closed.map((t) => <TradeCard key={t.id} t={t} />)}
          </div>
        </div>
      )}
    </div>
  );
}
