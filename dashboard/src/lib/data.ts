import fs from "fs";
import path from "path";
import matter from "gray-matter";

const DATA_DIR = path.join(process.cwd(), "data");

function readJson(filename: string) {
  const full = path.join(DATA_DIR, filename);
  if (!fs.existsSync(full)) return null;
  return JSON.parse(fs.readFileSync(full, "utf-8"));
}

export function getWatchlist() {
  return readJson("watchlist.json") || [];
}

export function getTradeIdeas() {
  return readJson("trade-ideas.json") || [];
}

export function getRegime() {
  return readJson("regime.json") || { regime: "unknown", signals: {}, bias: "", lastUpdated: "" };
}

export function getDrafts() {
  const dir = path.join(DATA_DIR, "drafts");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md") && f !== "README.md")
    .map((f) => {
      const raw = fs.readFileSync(path.join(dir, f), "utf-8");
      const lines = raw.split("\n");
      const meta: Record<string, string> = {};
      let bodyStart = 0;
      let inHeader = false;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === "# Tweet Draft") { inHeader = true; continue; }
        if (line === "---") {
          if (inHeader) { bodyStart = i + 1; break; }
          continue;
        }
        const m = line.match(/^\*\*(\w+):\*\*\s*(.+)$/);
        if (m) meta[m[1]] = m[2];
      }
      const rest = lines.slice(bodyStart);
      let tweetText = "";
      let notes = "";
      let media = "";
      let hitSeparator = false;
      for (const line of rest) {
        if (line.trim() === "---" && !hitSeparator) { hitSeparator = true; continue; }
        if (!hitSeparator) { tweetText += (tweetText ? "\n" : "") + line; continue; }
        const mm = line.match(/^\*\*Media:\*\*\s*(.+)$/);
        if (mm) media = mm[1];
        const mn = line.match(/^\*\*Notes:\*\*\s*(.+)$/);
        if (mn) notes = mn[1];
      }
      return {
        filename: f,
        account: meta.Account || "",
        type: meta.Type || "",
        status: meta.Status || "draft",
        source: meta.Source || "",
        text: tweetText.trim(),
        media,
        notes,
      };
    });
}
