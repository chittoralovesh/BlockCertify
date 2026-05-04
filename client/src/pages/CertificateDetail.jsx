import { useWallet } from "../web3/WalletContext";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { getCertificateContract, getWeb3 } from "../web3/certContract";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import signatureImg from "../assets/signature.png";
import logoImg from "../assets/issuer-logo.png";

export default function CertificateDetail() {
  const { account, isWrongNetwork } = useWallet();
  const { id } = useParams();

  const [data, setData] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const certRef = useRef(null);

  const verifyUrl = useMemo(() => {
    const base = window.location.origin;
    return `${base}/verify?id=${encodeURIComponent(id)}`;
  }, [id]);

  useEffect(() => {
    async function load() {
      setMsg("");
      setLoading(true);
      try {
        const web3 = getWeb3();
        const contract = getCertificateContract(web3);
        const out = await contract.methods.getCertificate(id).call();
        setData(out);
      } catch (e) {
        setMsg(e?.message || "Failed to load certificate.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // ---- Read fields (supports both named + indexed returns) ----
  const name = getField(data, "studentName", 1);
  const roll = getField(data, "studentId", 2);
  const course = getField(data, "course", 3);
  const cid = getField(data, "ipfsHash", 4);
  const fileHash = getField(data, "fileHash", 5);
  const timestamp = Number(getField(data, "timestamp", 6));
  const issuer = getField(data, "issuer", 7);
  const revoked = toBool(getField(data, "revoked", 8));

  const ipfsLink = cid ? `https://ipfs.io/ipfs/${cid}` : "";
  const issuedAt = timestamp
    ? new Date(timestamp * 1000).toLocaleString()
    : "-";

  // ---- Branding / company style ----
  const brandName = "CertiChain Vault";
  const brandTagline = "Blockchain Credentialing Platform";
  const certificateTitle = "Certificate of Completion";
  const authorityName = "CertiChain Vault Authority";
  const signatoryRole = "Certification Director";
  const credentialId = `CCV-${String(id).padStart(6, "0")}`;

  async function onRevoke() {
    if (!account) return alert("Connect wallet first.");
    if (isWrongNetwork) return alert("Wrong network. Switch to Ganache Local.");
    try {
      const web3 = getWeb3();
      const contract = getCertificateContract(web3);
      await contract.methods.revokeCertificate(id).send({ from: account });
      window.location.reload();
    } catch (e) {
      alert(e?.message || "Revoke failed");
    }
  }

  async function onDownloadPDF() {
    try {
      if (!certRef.current) return;

      const canvas = await html2canvas(certRef.current, {
        scale: 2.3,
        useCORS: true,
        backgroundColor: "#0b1020",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("landscape", "pt", "a4");

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;

      const y = (pageH - imgH) / 2;
      pdf.addImage(imgData, "PNG", 0, y, imgW, imgH);

      pdf.save(`CertiChainVault_${credentialId}.pdf`);
    } catch (e) {
      alert(e?.message || "PDF export failed.");
    }
  }

  const isIssuer =
    !!account &&
    !!issuer &&
    account.toLowerCase() === issuer.toLowerCase();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 text-white">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">Certificate #{id}</h2>
          <p className="mt-1 text-white/70">
            Corporate-style certificate preview with QR verification & PDF export.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/certificates" className="text-white/70 hover:text-white">
            ← Back
          </Link>

          <button
            onClick={onDownloadPDF}
            disabled={loading || !data}
            className="rounded-xl bg-white text-slate-950 px-4 py-2 font-semibold hover:opacity-90 disabled:opacity-60"
          >
            Download PDF
          </button>
        </div>
      </div>

      {msg && (
        <div className="mt-6 rounded-xl bg-white/5 border border-white/10 p-4 text-white/85">
          {msg}
        </div>
      )}

      {loading ? (
        <div className="mt-6 text-white/70">Loading...</div>
      ) : data ? (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CERTIFICATE PREVIEW (export target) */}
          <div className="lg:col-span-2">
            <div
              ref={certRef}
              className="relative overflow-hidden rounded-3xl border border-white/10"
              style={{
                background:
                  "radial-gradient(1100px 520px at 10% 10%, rgba(99,102,241,0.28), transparent 60%), radial-gradient(900px 520px at 95% 95%, rgba(236,72,153,0.22), transparent 58%), linear-gradient(180deg, #0b1020, #0a0f1a)",
              }}
            >
              {/* subtle top bar */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

              {/* subtle watermark */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.04] flex items-center justify-center">
                <div className="text-[120px] font-black tracking-widest rotate-[-18deg]">
                  CERTICHAIN
                </div>
              </div>

              <div className="relative p-10 sm:p-12">
                {/* Header */}
                <div className="flex items-start justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
                      <img
                        src={logoImg}
                        alt="Issuer logo"
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div>
                      <div className="font-bold text-lg">{brandName}</div>
                      <div className="text-xs text-white/60">{brandTagline}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-white/60">Credential ID</div>
                    <div className="text-lg font-bold">{credentialId}</div>

                    <div
                      className={
                        revoked
                          ? "mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs border bg-red-500/15 border-red-400/25 text-red-200"
                          : "mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs border bg-emerald-500/15 border-emerald-400/25 text-emerald-200"
                      }
                    >
                      <span
                        className={
                          revoked
                            ? "h-2 w-2 rounded-full bg-red-300"
                            : "h-2 w-2 rounded-full bg-emerald-300"
                        }
                      />
                      {revoked ? "REVOKED" : "VALID"}
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div className="mt-10 text-center">
                  <div className="tracking-[0.22em] text-xs text-white/60 uppercase">
                    {certificateTitle}
                  </div>

                  <div className="mt-5 text-5xl sm:text-6xl font-black">
                    {name || "Student Name"}
                  </div>

                  <div className="mt-4 text-white/70">
                    is hereby recognized for successfully completing
                  </div>

                  <div className="mt-4 text-3xl sm:text-4xl font-extrabold">
                    {course || "Course / Credential"}
                  </div>
                </div>

                {/* Info cards */}
                <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <MiniCard label="Student / Roll ID" value={roll || "-"} />
                  <MiniCard label="Issued At" value={issuedAt} />
                  <MiniCard label="Issuer Address" value={issuer ? shortAddr(issuer) : "-"} mono />
                </div>

                {/* Bottom section */}
                <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-8">
                  <div className="text-xs text-white/55 max-w-md">
                    This credential is anchored on-chain for tamper-proof verification.
                    Validate using the QR code or verify link:
                    <div className="mt-2 text-white/60 break-words">{verifyUrl}</div>
                  </div>

                  <div className="flex items-end gap-10">
                    {/* QR */}
                    <div className="rounded-xl bg-white p-3 shadow-md">
                      <QRCodeCanvas value={verifyUrl} size={110} />
                    </div>

                    {/* Signature */}
                    <div className="text-right">
                      <div className="text-xs text-white/60 tracking-wide uppercase">
                        Authorized Signature
                      </div>

                      <div className="mt-3 h-12 w-56 flex items-center justify-end">
                        <img
                          src={signatureImg}
                          alt="Signature"
                          className="h-12 object-contain opacity-95"
                        />
                      </div>

                      <div className="mt-2 text-sm font-semibold text-white">
                        {authorityName}
                      </div>
                      <div className="mt-1 text-xs text-white/60">{signatoryRole}</div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-white/55">
                  <div>Network: Ganache Local (1337)</div>
                  <div className="text-white/60">Solidity • Web3.js • React</div>
                </div>
              </div>
            </div>
          </div>

          {/* SIDE PANEL */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
            <div className="font-semibold">Actions</div>
            <div className="mt-2 text-sm text-white/70">
              Download PDF, open IPFS upload, verify, and revoke (issuer-only).
            </div>

            <div className="mt-5 space-y-3">
              {ipfsLink ? (
                <a
                  href={ipfsLink}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-xl bg-white text-slate-950 px-4 py-3 font-semibold hover:opacity-90"
                >
                  Open Uploaded PDF (IPFS)
                </a>
              ) : (
                <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white/60">
                  No uploaded PDF linked
                </div>
              )}

              <a
                href={verifyUrl}
                className="block rounded-xl bg-slate-950 border border-white/10 px-4 py-3 font-semibold hover:border-white/25"
              >
                Open Verify Page
              </a>

              <button
                onClick={onDownloadPDF}
                className="w-full rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-4 py-3 font-semibold hover:opacity-95"
              >
                Download PDF
              </button>

              {!revoked && isIssuer && (
                <button
                  onClick={onRevoke}
                  className="w-full rounded-xl bg-red-500 text-white px-4 py-3 font-semibold hover:opacity-90"
                >
                  Revoke Certificate
                </button>
              )}
            </div>

            <div className="mt-6 rounded-xl bg-slate-950/50 border border-white/10 p-4">
              <div className="text-xs text-white/60">On-chain file hash</div>
              <div className="mt-2 font-mono text-xs text-white/75 break-all">
                {fileHash || "-"}
              </div>
            </div>

            <div className="mt-4 text-xs text-white/55">
              This PDF is generated from on-chain data and includes QR verification.
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MiniCard({ label, value, mono }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
      <div className="text-xs text-white/55">{label}</div>
      <div className={mono ? "mt-2 font-mono text-xs break-all text-white/85" : "mt-2 text-white/85"}>
        {value}
      </div>
    </div>
  );
}

function getField(obj, key, index) {
  if (!obj) return "";
  return obj?.[key] ?? obj?.[index] ?? "";
}

function toBool(v) {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return v === "true";
  if (typeof v === "number") return v === 1;
  return false;
}

function shortAddr(a) {
  if (!a) return "";
  return `${a.slice(0, 6)}...${a.slice(-4)}`;
}