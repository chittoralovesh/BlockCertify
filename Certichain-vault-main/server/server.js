const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

/** ✅ Issuer Registry (edit these addresses) */
const issuers = {
  // Put your connected wallet here (lowercase)
  "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1": {
    orgName: "VIT Bhopal University",
    website: "https://vitbhopal.ac.in",
    location: "Bhopal, India",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/en/9/9c/VIT_University_logo.png",
    verified: true,
  },
};

/** ✅ Health check */
app.get("/", (req, res) => {
  res.json({ ok: true, service: "certicult-backend" });
});

/** ✅ Get all issuers */
app.get("/issuers", (req, res) => {
  const list = Object.entries(issuers).map(([address, info]) => ({
    address,
    ...info,
  }));
  res.json({ issuers: list });
});

/** ✅ Get issuer by address */
app.get("/issuers/:address", (req, res) => {
  const addr = String(req.params.address || "").toLowerCase();
  const issuer = issuers[addr];
  if (!issuer) {
    return res.status(404).json({ error: "Issuer not found", address: addr });
  }
  res.json({ address: addr, ...issuer });
});

/** ✅ Always return JSON for unknown routes (prevents HTML) */
app.use((req, res) => {
  res.status(404).json({ error: "Route not found", path: req.path });
});

const PORT = 5050;
app.listen(PORT, () => console.log(`✅ Backend running on http://localhost:${PORT}`));