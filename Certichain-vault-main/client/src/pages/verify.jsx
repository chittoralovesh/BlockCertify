import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import { getCertificateContract, getWeb3 } from "../web3/certContract";
import { parseCertificate, generateAiExplanation } from "../ai/verifyAssistant";

const BACKEND = "http://localhost:5050";

async function fetchIssuerProfile(address) {
  const addr = (address || "").toLowerCase();
  if (!addr || addr === "0x0000000000000000000000000000000000000000") return null;

  const res = await fetch(`${BACKEND}/issuers/${addr}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data;
}

export default function Verify() {
  const [params] = useSearchParams();

  const [id, setId] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const [rawResult, setRawResult] = useState(null);
  const cert = useMemo(() => parseCertificate(rawResult), [rawResult]);
  const ai = useMemo(() => generateAiExplanation(cert), [cert]);

  // ✅ Issuer profile overlay
  const [issuerInfo, setIssuerInfo] = useState(null);
  const [issuerStatus, setIssuerStatus] = useState(""); // message like "Verified/Unverified"

  const verifyUrl = useMemo(() => {
    const base = window.location.origin;
    const vid = id ? encodeURIComponent(id) : "";
    return `${base}/verify?id=${vid}`;
  }, [id]);

  useEffect(() => {
    const fromUrl = params.get("id");
    if (fromUrl) setId(fromUrl);
    // eslint-disable-next-line
  }, []);

  // ✅ whenever cert changes, fetch issuer profile
  useEffect(() => {
    (async () => {
      try {
        setIssuerInfo(null);
        setIssuerStatus("");
        const issuerAddr = cert?.issuer;
        if (!issuerAddr) return;

        const info = await fetchIssuerProfile(issuerAddr);
        if (info?.verified) {
          setIssuerInfo(info);
          setIssuerStatus("VERIFIED");
        } else if (info) {
          setIssuerInfo(info);
          setIssuerStatus("UNVERIFIED");
        } else {
          setIssuerInfo(null);
          setIssuerStatus("UNKNOWN");
        }
      } catch {
        setIssuerInfo(null);
        setIssuerStatus("UNKNOWN");
      }
    })();
  }, [cert?.issuer]);

  async function onVerify() {
    setMsg("");
    setRawResult(null);
    setIssuerInfo(null);
    setIssuerStatus("");

    if (!id) {
      setMsg("Enter a certificate ID (try 1).");
      return;
    }

    try {
      setLoading(true);
      const web3 = getWeb3();
      const contract = getCertificateContract(web3);
      const data = await contract.methods.getCertificate(id).call();
      setRawResult(data);
    } catch (e) {
      setMsg(e?.message || "Verify failed.");
    } finally {
      setLoading(false);
    }
  }

  async function downloadVerificationReport() {
    try {
      const reportEl = document.getElementById("verification-report");
      if (!reportEl) return;

      const canvas = await html2canvas(reportEl, {
        scale: 2.2,
        useCORS: true,
        backgroundColor: "#0b1020",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("portrait", "pt", "a4");

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;

      const y = 20;
      pdf.addImage(imgData, "PNG", 0, y, imgW, Math.min(imgH, pageH - 40));
      pdf.save(`CertiChain_Verification_Report_ID_${id}.pdf`);
    } catch (e) {
      alert(e?.message || "Report export failed.");
    }
  }

  const ipfsLink = cert?.ipfsCid ? `https://ipfs.io/ipfs/${cert.ipfsCid}` : "";
  const issuedAt = cert?.timestamp ? new Date(cert.timestamp * 1000).toLocaleString() : "-";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 text-white">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">Verify Certificate</h2>
          <p className="mt-2 text-white/70">
            Verify authenticity by reading certificate data from blockchain and generating a verification report.
          </p>
        </div>

        <button
          onClick={downloadVerificationReport}
          disabled={!cert}
          className="rounded-xl bg-white text-slate-950 px-4 py-2 font-semibold hover:opacity-90 disabled:opacity-60"
        >
          Download Verification Report (PDF)
        </button>
      </div>

      {/* Input */}
      <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 p-6">
        <div className="flex gap-3">
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="Enter certificate ID (e.g., 1)"
            className="flex-1 rounded-xl bg-slate-950 border border-white/10 px-3 py-2 text-white outline-none focus:border-white/30"
          />
          <button
            onClick={onVerify}
            disabled={loading}
            className="rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-5 py-2 font-semibold hover:opacity-95 disabled:opacity-60"
          >
            {loading ? "Checking..." : "Verify"}
          </button>
        </div>

        {msg && (
          <div className="mt-4 text-sm text-white/85 bg-white/5 border border-white/10 rounded-xl p-3">
            {msg}
          </div>
        )}

        {cert && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Clean fields */}
            <div className="lg:col-span-2 rounded-2xl bg-white/5 border border-white/10 p-6">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="text-lg font-semibold">Certificate Details</div>
                <div
                  className={
                    ai.verdict === "VALID"
                      ? "px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/20 text-emerald-200 text-xs"
                      : ai.verdict === "REVOKED"
                      ? "px-3 py-1 rounded-full bg-red-500/15 border border-red-400/20 text-red-200 text-xs"
                      : "px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/80 text-xs"
                  }
                >
                  {ai.verdict}
                </div>
              </div>

              {/* ✅ Issuer Card (NEW) */}
              <IssuerCard issuerAddr={cert.issuer} issuerInfo={issuerInfo} issuerStatus={issuerStatus} />

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Student Name" value={cert.studentName || "-"} />
                <Field label="Roll / ID" value={cert.studentId || "-"} />
                <Field label="Course" value={cert.course || "-"} />
                <Field label="Issued At" value={issuedAt} />
                <Field label="Issuer Address" value={cert.issuer || "-"} mono />
                <Field label="IPFS CID" value={cert.ipfsCid || "-"} mono />
              </div>

              <div className="mt-5 flex gap-3 flex-wrap">
                {ipfsLink && (
                  <a
                    href={ipfsLink}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-white text-slate-950 px-4 py-2 font-semibold hover:opacity-90"
                  >
                    Open IPFS PDF
                  </a>
                )}
                <a
                  href={verifyUrl}
                  className="rounded-xl bg-slate-950 border border-white/10 px-4 py-2 font-semibold hover:border-white/25"
                >
                  Copy/Use Verify Link
                </a>
              </div>
            </div>

            {/* Right: QR */}
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
              <div className="font-semibold">QR Verification</div>
              <div className="text-sm text-white/70 mt-1">Scan to open the verify page.</div>

              <div className="mt-4 rounded-xl bg-white p-3 inline-block">
                <QRCodeCanvas value={verifyUrl} size={160} />
              </div>

              <div className="mt-4 text-xs text-white/60 break-words">{verifyUrl}</div>
            </div>
          </div>
        )}

        {/* AI section */}
        {cert && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="text-lg font-semibold">AI Verification Assistant</div>
              <div className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70">
                Risk: <span className="text-white">{ai.risk}</span>
              </div>
            </div>

            <div className="mt-3 text-white/80">{ai.summary}</div>

            <div className="mt-5 space-y-3">
              {ai.checks.map((c, idx) => (
                <div key={idx} className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{c.label}</div>
                    <div
                      className={
                        c.status === "PASS"
                          ? "text-emerald-200 text-xs"
                          : c.status === "FAIL"
                          ? "text-red-200 text-xs"
                          : "text-amber-200 text-xs"
                      }
                    >
                      {c.status}
                    </div>
                  </div>
                  <div className="mt-1 text-sm text-white/70">{c.detail}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hidden export section for PDF report */}
      {cert && (
        <div className="mt-8">
          <div
            id="verification-report"
            className="rounded-3xl border border-white/10 p-8"
            style={{
              background:
                "radial-gradient(900px 420px at 10% 10%, rgba(99,102,241,0.20), transparent 60%), radial-gradient(700px 420px at 95% 90%, rgba(236,72,153,0.16), transparent 58%), linear-gradient(180deg, #0b1020, #0a0f1a)",
            }}
          >
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="text-xs text-white/60 tracking-widest uppercase">CertiChain Vault</div>
                <div className="mt-2 text-2xl font-black">Verification Report</div>
                <div className="mt-2 text-white/70">
                  Certificate ID: <span className="text-white font-semibold">{id}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-white/60">Result</div>
                <div
                  className={
                    ai.verdict === "VALID"
                      ? "mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs border bg-emerald-500/15 border-emerald-400/25 text-emerald-200"
                      : "mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs border bg-red-500/15 border-red-400/25 text-red-200"
                  }
                >
                  <span
                    className={
                      ai.verdict === "VALID"
                        ? "h-2 w-2 rounded-full bg-emerald-300"
                        : "h-2 w-2 rounded-full bg-red-300"
                    }
                  />
                  {ai.verdict}
                </div>

                <div className="mt-3 text-xs text-white/60">
                  Verified at: <span className="text-white/80">{new Date().toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* ✅ Issuer block included in PDF export */}
            <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 p-5">
              <div className="text-sm font-semibold">Issuer</div>
              {issuerInfo ? (
                <div className="mt-3 flex items-center gap-3">
                  {issuerInfo.logoUrl ? (
                    <img src={issuerInfo.logoUrl} alt="logo" className="h-12 w-12 rounded-xl object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-white/10" />
                  )}
                  <div>
                    <div className="font-semibold">
                      {issuerInfo.orgName}{" "}
                      <span className="text-emerald-200 text-xs">
                        {issuerInfo.verified ? "✅ Verified Issuer" : "Unverified"}
                      </span>
                    </div>
                    <div className="text-xs text-white/60">{issuerInfo.location} • {issuerInfo.website}</div>
                    <div className="text-xs text-white/60 font-mono break-all">{cert.issuer}</div>
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-sm text-white/70">
                  Issuer: <span className="font-mono text-xs break-all">{cert.issuer || "-"}</span>{" "}
                  <span className="ml-2 text-xs text-white/60">
                    ({issuerStatus === "UNKNOWN" ? "Not in registry" : issuerStatus || "Unknown"})
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <ReportField label="Student Name" value={cert.studentName || "-"} />
              <ReportField label="Roll / ID" value={cert.studentId || "-"} />
              <ReportField label="Course" value={cert.course || "-"} />
              <ReportField label="Issued At" value={issuedAt} />
              <ReportField label="Issuer Address" value={cert.issuer || "-"} mono />
              <ReportField label="IPFS CID" value={cert.ipfsCid || "-"} mono />
            </div>

            <div className="mt-6 rounded-2xl bg-slate-950/40 border border-white/10 p-5">
              <div className="font-semibold">AI Summary</div>
              <div className="mt-2 text-sm text-white/75">{ai.summary}</div>
              <div className="mt-3 text-xs text-white/60">
                Risk Level: <span className="text-white/80">{ai.risk}</span>
              </div>
            </div>

            <div className="mt-6 flex items-end justify-between gap-6">
              <div className="text-xs text-white/60 break-words">
                Verify link: <span className="text-white/80">{verifyUrl}</span>
              </div>

              <div className="rounded-xl bg-white p-3">
                <QRCodeCanvas value={verifyUrl} size={120} />
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-white/10 text-xs text-white/55">
              This report is generated from on-chain data. Any mismatch indicates tampering or invalid record.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IssuerCard({ issuerAddr, issuerInfo, issuerStatus }) {
  return (
    <div className="mt-4 rounded-2xl bg-white/5 border border-white/10 p-4">
      <div className="text-xs text-white/60">Issued by</div>

      {issuerInfo ? (
        <div className="mt-2 flex items-center gap-3">
          {issuerInfo.logoUrl ? (
            <img src={issuerInfo.logoUrl} alt="logo" className="h-12 w-12 rounded-xl object-cover" />
          ) : (
            <div className="h-12 w-12 rounded-xl bg-white/10" />
          )}

          <div className="flex-1">
            <div className="font-semibold flex items-center gap-2 flex-wrap">
              {issuerInfo.orgName}
              <span className="text-emerald-200 text-xs px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/20">
                ✅ Verified Issuer
              </span>
            </div>
            <div className="mt-1 text-xs text-white/60">
              {issuerInfo.location} • {issuerInfo.website}
            </div>
            <div className="mt-1 font-mono text-xs text-white/70 break-all">{issuerInfo.address}</div>
          </div>
        </div>
      ) : (
        <div className="mt-2 text-sm text-white/75">
          <div className="font-mono text-xs break-all">{issuerAddr || "-"}</div>
          <div className="mt-1 text-xs text-white/60">
            Status:{" "}
            {issuerStatus === "UNKNOWN"
              ? "Not in issuer registry"
              : issuerStatus === "UNVERIFIED"
              ? "Unverified issuer"
              : issuerStatus || "Unknown"}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, mono }) {
  return (
    <div className="rounded-xl bg-slate-950/40 border border-white/10 p-4">
      <div className="text-xs text-white/60">{label}</div>
      <div className={mono ? "mt-1 font-mono text-xs text-white/80 break-all" : "mt-1 text-white/80"}>
        {value}
      </div>
    </div>
  );
}

function ReportField({ label, value, mono }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-4">
      <div className="text-xs text-white/60">{label}</div>
      <div className={mono ? "mt-1 font-mono text-xs text-white/85 break-all" : "mt-1 text-white/85"}>
        {value}
      </div>
    </div>
  );
}