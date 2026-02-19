import { listThesisDocs, getUniverse, getThesisDoc } from "@/lib/data";
import Link from "next/link";

export default function ThesesIndex() {
  const docs = listThesisDocs();
  const universe = getUniverse();
  const assets = universe?.assets || {};

  const cards = docs.map((sym) => {
    const u = assets[sym] || {};
    const doc = getThesisDoc(sym);
    // Extract one-line thesis from content
    let oneLiner = u.notes || "";
    if (doc?.content) {
      const m = doc.content.match(/## 1\. One-Line Thesis\s*\n+(.+)/);
      if (m) oneLiner = m[1].trim();
    }
    // Extract last updated from content
    let lastUpdated = u.price_date || "";
    if (doc?.content) {
      const m = doc.content.match(/\*\*Last Updated:\*\*\s*(\S+)/);
      if (m) lastUpdated = m[1];
    }

    return {
      sym,
      name: u.name || sym,
      conviction: u.conviction || null,
      status: u.status || "watchlist",
      oneLiner,
      lastUpdated,
    };
  });

  return (
    <div className="space-y-6 pt-2 lg:pt-0">
      <h1 className="text-xl font-bold">Theses</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cards.map((c) => (
          <Link
            key={c.sym}
            href={`/theses/${c.sym}`}
            className="bg-card border border-border rounded-lg p-4 hover:border-accent/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-bold">{c.sym}</h3>
                <p className="text-xs text-muted-foreground">{c.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                  c.status === "active" ? "bg-green/20 text-green" : "bg-muted text-muted-foreground"
                }`}>
                  {c.status}
                </span>
                {c.conviction && (
                  <span className="text-xs font-mono text-accent font-bold">{c.conviction}/10</span>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{c.oneLiner}</p>
            {c.lastUpdated && (
              <p className="text-[10px] text-muted-foreground font-mono mt-2">Updated: {c.lastUpdated}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
