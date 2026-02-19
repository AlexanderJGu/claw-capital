import { getThesisDoc, getUniverse, getPredictions, listThesisDocs } from "@/lib/data";
import { notFound } from "next/navigation";
import { ThesisContent } from "./thesis-content";

export function generateStaticParams() {
  return listThesisDocs().map((asset) => ({ asset }));
}

export default async function ThesisPage({ params }: { params: Promise<{ asset: string }> }) {
  const { asset } = await params;
  const sym = asset.toUpperCase();
  const doc = getThesisDoc(sym);
  if (!doc) return notFound();

  const universe = getUniverse();
  const predictions = getPredictions();
  const u = universe?.assets?.[sym] || {};
  const assetPredictions = predictions?.predictions?.filter(
    (p: any) => p.asset === sym
  ) || [];

  return (
    <div className="pt-2 lg:pt-0">
      <div className="lg:flex gap-6">
        {/* Sidebar */}
        <aside className="lg:w-64 shrink-0 mb-6 lg:mb-0">
          <div className="bg-card border border-border rounded-lg p-4 space-y-4 lg:sticky lg:top-6">
            <div>
              <h2 className="font-bold text-lg">{sym}</h2>
              <p className="text-xs text-muted-foreground">{u.name || sym}</p>
            </div>

            <div className="space-y-2 text-sm">
              <Row label="Price" value={u.current_price_approx ? `$${u.current_price_approx < 10 ? u.current_price_approx.toFixed(2) : u.current_price_approx.toLocaleString()}` : "—"} />
              <Row label="Conviction" value={u.conviction ? `${u.conviction}/10` : "—"} accent />
              <Row label="Status" value={u.status || "—"} />
              <Row label="Tier" value={u.tier?.toString() || "—"} />
            </div>

            {u.buy_zone && (
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground font-mono uppercase">Zones</p>
                <div className="text-xs space-y-0.5">
                  <p><span className="text-green font-mono">BUY:</span> <span className="font-mono">${u.buy_zone[0].toLocaleString()}–${u.buy_zone[1].toLocaleString()}</span></p>
                  <p><span className="text-yellow font-mono">WATCH:</span> <span className="font-mono">${u.watch_zone[0].toLocaleString()}–${u.watch_zone[1].toLocaleString()}</span></p>
                </div>
              </div>
            )}

            {u.key_supports && (
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground font-mono uppercase">Key Supports</p>
                <div className="flex flex-wrap gap-1">
                  {u.key_supports.map((s: number) => (
                    <span key={s} className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                      ${s.toLocaleString()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {assetPredictions.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] text-muted-foreground font-mono uppercase">Predictions ({assetPredictions.length})</p>
                {assetPredictions.map((p: any) => (
                  <div key={p.id} className="bg-muted rounded p-2">
                    <p className="text-[10px] font-mono text-accent">{p.id}</p>
                    <p className="text-xs mt-0.5">{p.statement}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-mono ${p.status === "open" ? "text-yellow" : p.status === "confirmed" ? "text-green" : "text-red"}`}>
                        {p.status}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">by {p.deadline}</span>
                      {p.critical && <span className="text-[10px] text-red font-mono">CRITICAL</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <ThesisContent content={doc.content} />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className={`font-mono text-xs ${accent ? "text-accent font-bold" : ""}`}>{value}</span>
    </div>
  );
}
