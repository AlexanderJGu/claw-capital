const express = require("express");
const { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } = require("plaid");
const fs = require("fs");
const path = require("path");

// Load env
require("dotenv").config({ path: path.join(process.env.HOME, ".config/env/global.env") });

const TOKENS_PATH = path.join(process.env.HOME, ".config/env/plaid-tokens.json");

const plaidEnv = process.env.PLAID_ENV || "development";
const config = new Configuration({
  basePath: PlaidEnvironments[plaidEnv],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET,
    },
  },
});
const plaidClient = new PlaidApi(config);

function loadTokens() {
  if (fs.existsSync(TOKENS_PATH)) return JSON.parse(fs.readFileSync(TOKENS_PATH, "utf-8"));
  return { items: [] };
}
function saveTokens(data) {
  fs.mkdirSync(path.dirname(TOKENS_PATH), { recursive: true });
  fs.writeFileSync(TOKENS_PATH, JSON.stringify(data, null, 2));
}

const app = express();
app.use(express.json());

app.get("/", (_req, res) => {
  const tokens = loadTokens();
  const connected = tokens.items.map((i) => `<li>${i.institution} — ${i.accounts?.join(", ") || "connected"}</li>`).join("");
  res.send(`<!DOCTYPE html>
<html><head><title>Claw Capital — Plaid Link</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font-family:system-ui;background:#0a0a0a;color:#e0e0e0;max-width:600px;margin:40px auto;padding:0 20px}
h1{font-size:1.4rem;letter-spacing:0.1em}button{background:#4f46e5;color:#fff;border:none;padding:12px 24px;border-radius:6px;cursor:pointer;font-size:1rem;margin-top:16px}
button:hover{background:#4338ca}.connected{margin-top:24px;padding:16px;background:#111;border-radius:8px;border:1px solid #222}
.connected h3{margin:0 0 8px;font-size:0.85rem;color:#888;text-transform:uppercase;letter-spacing:0.1em}ul{padding-left:20px;margin:0}li{margin:4px 0}
.status{margin-top:12px;padding:8px 12px;background:#1a2e1a;border:1px solid #2a4a2a;border-radius:4px;color:#4ade80;display:none}</style>
<script src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"></script>
</head><body>
<h1>◈ CLAW CAPITAL</h1>
<p>Connect your brokerage accounts via Plaid.</p>
<button id="link-btn" onclick="startLink()">Connect Account</button>
<div id="status" class="status"></div>
${connected ? `<div class="connected"><h3>Connected</h3><ul>${connected}</ul></div>` : ""}
<script>
async function startLink(){
  const r=await fetch("/api/create-link-token",{method:"POST"});
  const{link_token}=await r.json();
  const handler=Plaid.create({token:link_token,onSuccess:async(public_token,metadata)=>{
    const s=document.getElementById("status");s.style.display="block";s.textContent="Exchanging token...";
    const ex=await fetch("/api/exchange-token",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({public_token,institution:metadata.institution?.name||"Unknown",accounts:metadata.accounts?.map(a=>a.name)||[]})});
    const res=await ex.json();s.textContent=res.ok?"✓ Connected! Refresh to see.":"Error: "+JSON.stringify(res);
    if(res.ok)setTimeout(()=>location.reload(),1500);
  },onExit:(err)=>{if(err)console.error(err)}});
  handler.open();
}
</script></body></html>`);
});

app.post("/api/create-link-token", async (_req, res) => {
  try {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: "claw-capital-user" },
      client_name: "Claw Capital",
      products: [Products.Investments],
      country_codes: [CountryCode.Us],
      language: "en",
    });
    res.json({ link_token: response.data.link_token });
  } catch (e) {
    console.error("create-link-token error:", e.response?.data || e.message);
    res.status(500).json({ error: e.response?.data || e.message });
  }
});

app.post("/api/exchange-token", async (req, res) => {
  try {
    const { public_token, institution, accounts } = req.body;
    const response = await plaidClient.itemPublicTokenExchange({ public_token });
    const { access_token, item_id } = response.data;
    const tokens = loadTokens();
    // Remove existing item for same institution if re-linking
    tokens.items = tokens.items.filter((i) => i.item_id !== item_id);
    tokens.items.push({ access_token, item_id, institution, accounts, linked_at: new Date().toISOString() });
    saveTokens(tokens);
    console.log(`Linked: ${institution} (${accounts.join(", ")})`);
    res.json({ ok: true });
  } catch (e) {
    console.error("exchange-token error:", e.response?.data || e.message);
    res.status(500).json({ error: e.response?.data || e.message });
  }
});

app.listen(3001, () => console.log("Plaid Link server running at http://localhost:3001"));
