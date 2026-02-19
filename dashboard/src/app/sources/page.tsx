import { getSources } from "@/lib/data";

export default function Sources() {
  const data = getSources();
  const sources = data?.sources || [];
  const grading = data?.grading || {};

  const gradeColors: Record<string, string> = {
    A: "text-green bg-green/20",
    B: "text-yellow bg-yellow/20",
    C: "text-red bg-red/20",
  };

  // Sort by grade
  const sorted = [...sources].sort((a: any, b: any) => {
    const order = { A: 0, B: 1, C: 2 };
    return (order[a.grade as keyof typeof order] ?? 3) - (order[b.grade as keyof typeof order] ?? 3);
  });

  return (
    <div className="space-y-6 pt-2 lg:pt-0">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Sources</h1>
        <span className="text-xs text-muted-foreground font-mono">{sources.length} accounts</span>
      </div>

      {/* Grade legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(grading).filter(([k]) => k !== "ungraded").map(([grade, info]: [string, any]) => (
          <div key={grade} className="flex items-center gap-2 text-xs">
            <span className={`font-mono font-bold px-1.5 py-0.5 rounded ${gradeColors[grade] || ""}`}>{grade}</span>
            <span className="text-muted-foreground">wt:{info.weight} — {info.description}</span>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[10px] text-muted-foreground font-mono uppercase">
              <th className="pb-2 pr-3">Handle</th>
              <th className="pb-2 pr-3 text-center">Grade</th>
              <th className="pb-2 pr-3 text-center hidden sm:table-cell">Weight</th>
              <th className="pb-2 pr-3 hidden md:table-cell">Sectors</th>
              <th className="pb-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s: any) => (
              <tr key={s.handle} className="border-b border-border/50 hover:bg-muted/30">
                <td className="py-2 pr-3">
                  <a
                    href={`https://twitter.com/${s.handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-accent hover:underline"
                  >
                    @{s.handle}
                  </a>
                </td>
                <td className="py-2 pr-3 text-center">
                  <span className={`font-mono font-bold text-xs px-1.5 py-0.5 rounded ${gradeColors[s.grade] || "bg-muted text-muted-foreground"}`}>
                    {s.grade}
                  </span>
                </td>
                <td className="py-2 pr-3 text-center font-mono text-xs hidden sm:table-cell">
                  {grading[s.grade]?.weight || 0}
                </td>
                <td className="py-2 pr-3 hidden md:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {s.sectors?.map((sec: string) => (
                      <span key={sec} className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                        {sec}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-2 text-xs text-muted-foreground max-w-xs truncate">
                  {s.notes}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
