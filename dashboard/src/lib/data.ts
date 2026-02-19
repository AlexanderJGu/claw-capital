import fs from "fs";
import path from "path";
import matter from "gray-matter";

// Root of the claw-capital repo
// On Vercel: data is copied into dashboard/data/ via prebuild script
// Locally: reads from parent directory
const DATA_DIR = path.join(process.cwd(), "data");
const REPO_ROOT = fs.existsSync(DATA_DIR) ? DATA_DIR : path.resolve(process.cwd(), "..");

function readJson(relPath: string) {
  const full = path.join(REPO_ROOT, relPath);
  if (!fs.existsSync(full)) return null;
  return JSON.parse(fs.readFileSync(full, "utf-8"));
}

function readMd(relPath: string) {
  const full = path.join(REPO_ROOT, relPath);
  if (!fs.existsSync(full)) return null;
  const raw = fs.readFileSync(full, "utf-8");
  const { data, content } = matter(raw);
  return { frontmatter: data, content };
}

export function getUniverse() {
  return readJson("crypto-desk/coverage/universe.json");
}

export function getThesisLevels() {
  return readJson("alerts/config/thesis-levels.json");
}

export function getRegime() {
  return readJson("crypto-desk/coverage/regime.json");
}

export function getSources() {
  return readJson("crypto-desk/coverage/sources.json");
}

export function getNarratives() {
  return readJson("crypto-desk/coverage/narratives.json");
}

export function getPredictions() {
  return readJson("crypto-desk/reports/prediction-tracker.json");
}

export function getPortfolio() {
  return readJson("portfolio/snapshots/combined-latest.json");
}

export function getThesisDoc(asset: string) {
  const dir = path.join(REPO_ROOT, "crypto-desk/theses");
  const file = path.join(dir, `${asset.toUpperCase()}.md`);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf-8");
  const { data, content } = matter(raw);
  return { frontmatter: data, content };
}

export function listThesisDocs(): string[] {
  const dir = path.join(REPO_ROOT, "crypto-desk/theses");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .map((f) => f.replace(".md", ""));
}

export function getDrafts() {
  const dir = path.join(REPO_ROOT, "drafts/tweets");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md") && f !== "README.md")
    .map((f) => {
      const raw = fs.readFileSync(path.join(dir, f), "utf-8");
      // Parse custom frontmatter format (not standard YAML)
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
      // Find the tweet body (between the two --- blocks after metadata)
      const rest = lines.slice(bodyStart);
      let tweetText = "";
      let notes = "";
      let media = "";
      let inTweet = false;
      let pastTweet = false;
      for (const line of rest) {
        if (line.trim() === "---" && !inTweet && !pastTweet) { inTweet = true; continue; }
        if (line.trim() === "---" && inTweet) { inTweet = false; pastTweet = true; continue; }
        if (inTweet) { tweetText += (tweetText ? "\n" : "") + line; continue; }
        if (pastTweet) {
          const mm = line.match(/^\*\*Media:\*\*\s*(.+)$/);
          if (mm) media = mm[1];
          const mn = line.match(/^\*\*Notes:\*\*\s*(.+)$/);
          if (mn) notes = mn[1];
        }
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

export function getSignals() {
  const dir = path.join(REPO_ROOT, "crypto-desk/reports");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json") && f !== "prediction-tracker.json" && f !== "thesis-scorecard.json")
    .map((f) => {
      try { return { name: f, data: JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8")) }; }
      catch { return null; }
    })
    .filter(Boolean);
}
