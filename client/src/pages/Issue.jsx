import { useState } from "react";
import { useWallet } from "../web3/WalletContext";
import { getCertificateContract, getWeb3 } from "../web3/certContract";
import { extractTextFromPdf, guessFieldsFromText } from "../ai/pdfOcr";

const BACKEND = "http://localhost:5050";

export default function Issue() {
  const { account, isWrongNetwork } = useWallet();

  const [pdfFile, setPdfFile] = useState(null);

  const [name, setName] = useState("");
  const [roll, setRoll] = useState("");
  const [course, setCourse] = useState("");
  const [certNo, setCertNo] = useState("");

  const [ipfsCid, setIpfsCid] = useState("");
  const [sha256, setSha256] = useState("");

  const [loading, setLoading] = useState(false);
  const [processingPdf, setProcessingPdf] = useState(false);
  const [msg, setMsg] = useState("");
  const [ocrPreview, setOcrPreview] = useState("");

  async function uploadToIPFS(file) {
    const form = new FormData();
    form.append("file", file);

    const res = await fetch(`${BACKEND}/upload`, {
      method: "POST",
      body: form,
    });

    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Backend returned non-JSON (status ${res.status}): ${text}`);
    }

    if (!res.ok) {
      throw new Error(`Upload failed (${res.status}): ${data?.error || "Unknown backend error"}`);
    }

    const cid = data?.cid;
    const sha = data?.sha256;

    if (!cid) {
      throw new Error(`Upload succeeded but cid missing. Backend response: ${JSON.stringify(data)}`);
    }

    if (!sha) {
      throw new Error(`Upload succeeded but sha256 missing. Backend response: ${JSON.stringify(data)}`);
    }

    return { cid, sha256: sha };
  }

  async function onPickPdf(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfFile(file);
    setMsg("");
    setOcrPreview("");
    setIpfsCid("");
    setSha256("");

    setProcessingPdf(true);
    try {
      const rawText = await extractTextFromPdf(file);
      const guessed = guessFieldsFromText(rawText);

      if (guessed?.rawPreview) setOcrPreview(guessed.rawPreview);
      if (guessed?.studentName) setName(guessed.studentName);
      if (guessed?.studentId) setRoll(guessed.studentId);
      if (guessed?.course) setCourse(guessed.course);
      if (guessed?.certNo) setCertNo(guessed.certNo);

      setMsg("Uploading PDF to IPFS...");
      const out = await uploadToIPFS(file);

      setIpfsCid(out.cid);
      setSha256(out.sha256);

      setMsg(`✅ PDF uploaded. CID: ${out.cid}`);
    } catch (err) {
      setMsg(err?.message || "PDF processing failed");
    } finally {
      setProcessingPdf(false);
    }
  }

  async function onIssue() {
    setMsg("");

    if (!account) return setMsg("Please connect wallet first.");
    if (isWrongNetwork) return setMsg("Wrong network. Switch MetaMask to Ganache Local (1337).");

    if (!pdfFile) return setMsg("Upload ONE certificate PDF first.");
    if (!name || !roll || !course) return setMsg("Please confirm Name, Roll/ID, Course.");
    if (!ipfsCid) return setMsg("Missing IPFS CID. Upload failed, try again.");
    if (!sha256 || sha256.length !== 64) return setMsg("Missing/invalid SHA-256 hash.");

    try {
      setLoading(true);

      const web3 = getWeb3();
      const contract = getCertificateContract(web3);

      const fileHashBytes32 = "0x" + sha256;
      const ipfsCidBytes32 = web3.utils.keccak256(ipfsCid);

      const tryOrders = [
        () =>
          contract.methods.issueCertificate(
            name,
            roll,
            course,
            certNo || "",
            ipfsCidBytes32,
            fileHashBytes32
          ),
        () =>
          contract.methods.issueCertificate(
            name,
            roll,
            course,
            certNo || "",
            fileHashBytes32,
            ipfsCidBytes32
          ),
      ];

      let chosenMethod = null;
      let lastErr = null;

      for (const build of tryOrders) {
        const m = build();
        try {
          await m.call({ from: account });
          chosenMethod = m;
          break;
        } catch (e) {
          lastErr = e;
        }
      }

      if (!chosenMethod) {
        const hint = lastErr?.reason || lastErr?.message || "revert";
        setMsg(`❌ Contract reverted for both parameter orders.\n${hint}`);
        return;
      }

      const gas = await chosenMethod.estimateGas({ from: account });
      const tx = await chosenMethod.send({ from: account, gas });

      setMsg(`✅ Issued on-chain! Tx: ${tx.transactionHash}`);
    } catch (err) {
      setMsg(err?.message || "Issue failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 text-white">
      <h2 className="text-3xl font-bold">Issue Certificate</h2>
      <p className="mt-2 text-white/70">
        Upload one PDF → store it on IPFS → anchor CID + SHA-256 hash on-chain.
      </p>

      <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 p-6">
        <div>
          <div className="text-sm text-white/70 mb-2">Certificate PDF</div>
          <input
            id="pdfInput"
            type="file"
            accept="application/pdf"
            onChange={onPickPdf}
            className="w-full rounded-xl bg-slate-950 border border-white/10 px-3 py-2 text-white"
          />
        </div>

        {ocrPreview && (
          <div className="mt-3 text-sm text-white/80 bg-white/5 border border-white/10 rounded-xl p-3">
            Autofill preview: “{ocrPreview}”
          </div>
        )}

        {(ipfsCid || sha256) && (
          <div className="mt-4 space-y-2">
            <div className="rounded-xl bg-white/5 border border-white/10 p-3">
              <div className="text-xs text-white/60">IPFS CID</div>
              <div className="mt-1 font-mono text-xs break-all">{ipfsCid || "-"}</div>
            </div>

            <div className="rounded-xl bg-white/5 border border-white/10 p-3">
              <div className="text-xs text-white/60">SHA-256 Hash</div>
              <div className="mt-1 font-mono text-xs break-all">{sha256 || "-"}</div>
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Student Name" value={name} onChange={setName} placeholder="e.g., ANSHIKA JAIN" />
          <Field label="Roll / ID" value={roll} onChange={setRoll} placeholder="e.g., 22MIM10093" />
          <Field label="Course" value={course} onChange={setCourse} placeholder="e.g., MERN Full Stack Developer" />
          <Field label="Certificate No (optional)" value={certNo} onChange={setCertNo} placeholder="e.g., JL28H8DZ" />
        </div>

        <button
          onClick={onIssue}
          disabled={loading || processingPdf}
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-5 py-3 font-semibold hover:opacity-95 disabled:opacity-60"
        >
          {processingPdf ? "Processing PDF..." : loading ? "Issuing..." : "Issue Certificate"}
        </button>

        {msg && (
          <div className="mt-4 text-sm text-white/85 bg-white/5 border border-white/10 rounded-xl p-3 whitespace-pre-wrap">
            {msg}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <div className="text-sm text-white/70 mb-1">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl bg-slate-950 border border-white/10 px-3 py-2 text-white outline-none focus:border-white/30"
      />
    </div>
  );
}