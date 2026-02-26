"use client";

import { useState } from "react";

interface Source {
  type: "tweet" | "note" | "article";
  url?: string;
  label: string;
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

function TweetEmbed({ url }: { url: string }) {
  const tweetId = url.split("/status/")[1]?.split("?")[0];
  if (!tweetId) return null;
  return (
    <div className="rounded border border-border overflow-hidden bg-black/20">
      <iframe
        src={`https://platform.twitter.com/embed/Tweet.html?id=${tweetId}&theme=dark&chrome=nofooter&dnt=true`}
        className="w-full border-0"
        style={{ height: 280, colorScheme: "dark" }}
        loading="lazy"
        sandbox="allow-scripts allow-same-origin allow-popups"
      />
    </div>
  );
}

function SourceItem({ source }: { source: Source }) {
  if (source.type === "tweet" && source.url) {
    return (
      <div className="space-y-1.5">
        <TweetEmbed url={source.url} />
        <p className="text-[11px] text-muted-foreground pl-1">{source.label}</p>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2 py-1.5 px-2 rounded bg-muted/30 border border-border/50">
      <span className="text-[10px] font-mono text-muted-foreground mt-0.5 shrink-0">
        {source.type === "article" ? "📄" : "📝"}
      </span>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {source.url ? (
          <a href={source.url} target="_blank" rel="noopener noreferrer" className="hover:text-foreground underline underline-offset-2">
            {source.label}
          </a>
        ) : (
          source.label
        )}
      </p>
    </div>
  );
}

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
          <div className="border-t border-border bg-muted/10 p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Sources
            </div>
            <div className="space-y-2.5">
              {t.sources!.map((s, i) => (
                <SourceItem key={i} source={s} />
              ))}
            </div>
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
