import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getCertificateContract, getWeb3 } from "../web3/certContract";

export default function Certificates() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");

  async function fetchCount(contract) {
    // Try common count patterns
    const candidates = ["certCount", "certificateCount", "count", "totalCertificates"];
    for (const name of candidates) {
      if (contract.methods?.[name]) {
        const v = await contract.methods[name]().call();
        return Number(v);
      }
    }
    // Try common getter method
    if (contract.methods?.getTotalCertificates) {
      const v = await contract.methods.getTotalCertificates().call();
      return Number(v);
    }
    throw new Error("Could not find a certificate count method in the contract.");
  }

  async function fetchOne(contract, id) {
    // Common read method names
    const candidates = ["getCertificate", "certificates", "getCert", "viewCertificate"];
    for (const name of candidates) {
      if (contract.methods?.[name]) {
        const data = await contract.methods[name](id).call();
        return data;
      }
    }
    throw new Error("Could not find a certificate read method (getCertificate/certificates/...).");
  }

  async function load() {
    setMsg("");
    setItems([]);
    try {
      setLoading(true);
      const web3 = getWeb3();
      const contract = getCertificateContract(web3);

      const count = await fetchCount(contract);
      const ids = Array.from({ length: count }, (_, i) => i + 1);

      const results = [];
      for (const id of ids) {
        try {
          const data = await fetchOne(contract, id);
          results.push({ id, data });
        } catch {
          // skip if missing
        }
      }

      setItems(results.reverse());
      if (!results.length) setMsg("No certificates found yet. Issue one first.");
    } catch (e) {
      setMsg(e?.message || "Failed to load certificates.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const s = q.toLowerCase();
    return items.filter(({ id, data }) => {
      const raw = JSON.stringify({ id, data }).toLowerCase();
      return raw.includes(s);
    });
  }, [items, q]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 text-white">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">Certificates</h2>
          <p className="mt-2 text-white/70">Browse issued certificates stored on-chain.</p>
        </div>

        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name / roll / course / id..."
            className="w-72 rounded-xl bg-slate-950 border border-white/10 px-3 py-2 text-white outline-none focus:border-white/30"
          />
          <button
            onClick={load}
            className="rounded-xl bg-white text-slate-950 px-4 py-2 font-semibold hover:opacity-90"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="mt-6">
        {msg && (
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-white/85">
            {msg}
          </div>
        )}

        {loading ? (
          <div className="text-white/70 mt-6">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {filtered.map(({ id, data }) => (
              <CertCard key={id} id={id} data={data} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CertCard({ id, data }) {
  // try to map common struct fields
  const name = data?.name ?? data?.studentName ?? data?.[0] ?? "";
  const roll = data?.roll ?? data?.rollNo ?? data?.[1] ?? "";
  const course = data?.course ?? data?.program ?? data?.[2] ?? "";
  const cid = data?.cid ?? data?.ipfsCid ?? data?.[3] ?? "";

  return (
    <Link
      to={`/certificates/${id}`}
      className="rounded-2xl bg-white/5 border border-white/10 p-5 hover:bg-white/10 transition"
    >
      <div className="flex items-center justify-between">
        <div className="font-semibold text-lg">{name || "Certificate"}</div>
        <div className="text-xs px-2 py-1 rounded-lg bg-white/10 text-white/80">
          ID #{id}
        </div>
      </div>

      <div className="mt-3 text-sm text-white/70 space-y-1">
        <div><span className="text-white/50">Roll:</span> {roll || "-"}</div>
        <div><span className="text-white/50">Course:</span> {course || "-"}</div>
        <div className="truncate"><span className="text-white/50">CID:</span> {cid || "-"}</div>
      </div>
    </Link>
  );
}