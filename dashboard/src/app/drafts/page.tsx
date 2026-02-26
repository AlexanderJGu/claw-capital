import { getDrafts } from "@/lib/data";

export default function Drafts() {
  const drafts = getDrafts();

  const grouped: Record<string, typeof drafts> = {};
  for (const d of drafts) {
    const acc = d.account || "unknown";
    if (!grouped[acc]) grouped[acc] = [];
    grouped[acc].push(d);
  }

  const statusColors: Record<string, string> = {
    draft: "bg-yellow/20 text-yellow",
    approved: "bg-green/20 text-green",
    posted: "bg-blue/20 text-blue",
    killed: "bg-red/20 text-red",
  };

  return (
    <div className="space-y-6 pt-2 lg:pt-0">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Tweet Drafts</h1>
        <span className="text-xs text-muted-foreground font-mono">{drafts.length} drafts</span>
      </div>

      {Object.entries(grouped).map(([account, items]) => (
        <div key={account} className="space-y-3">
          <h2 className="text-sm font-bold text-accent font-mono">{account}</h2>
          <div className="space-y-3">
            {items.map((d) => (
              <div key={d.filename} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${statusColors[d.status] || "bg-muted text-muted-foreground"}`}>
                      {d.status}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                      {d.type}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0">{d.filename.slice(0, 10)}</span>
                </div>

                <div className="bg-muted rounded p-3 text-sm whitespace-pre-wrap font-mono leading-relaxed">
                  {d.text}
                </div>

                {d.source && (
                  <p className="text-[10px] text-muted-foreground mt-2">
                    <span className="font-mono">Source:</span> {d.source}
                  </p>
                )}
                {d.media && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    <span className="font-mono">Media:</span> {d.media}
                  </p>
                )}
                {d.notes && (
                  <p className="text-xs text-muted-foreground mt-2 italic">{d.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {drafts.length === 0 && (
        <p className="text-muted-foreground text-sm">No drafts found.</p>
      )}
    </div>
  );
}
