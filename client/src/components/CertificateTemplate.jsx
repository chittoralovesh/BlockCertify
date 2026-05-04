import React from "react";

export default function CertificateTemplate({
  certId,
  studentName,
  studentId,
  course,
  issuer,
  issuedAt,
  status, // "VALID" | "REVOKED"
}) {
  const isRevoked = status === "REVOKED";

  return (
    <div
      id="certificate-preview"
      className="relative w-full overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-slate-950 via-indigo-950 to-fuchsia-950 p-10 text-white shadow-2xl"
    >
      {/* Background accents */}
      <div className="pointer-events-none absolute -top-32 -right-32 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_55%)]" />

      {/* Border frame */}
      <div className="pointer-events-none absolute inset-3 rounded-[22px] border border-white/10" />

      {/* Header */}
      <div className="relative flex items-start justify-between gap-8">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl border border-white/10 bg-white/10 flex items-center justify-center text-2xl">
            🎓
          </div>
          <div>
            <div className="text-lg font-semibold tracking-wide">
              CertiChain Vault
            </div>
            <div className="text-xs text-white/60">
              Blockchain Certificate Authority
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-white/60">Certificate ID</div>
          <div className="mt-1 font-mono text-sm text-white/90">#{certId}</div>

          <div
            className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${
              isRevoked
                ? "border-red-400/30 bg-red-500/15 text-red-200"
                : "border-emerald-400/30 bg-emerald-500/15 text-emerald-200"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isRevoked ? "bg-red-400" : "bg-emerald-400"
              }`}
            />
            {status}
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="relative mt-10 text-center">
        <div className="text-xs uppercase tracking-[0.35em] text-white/65">
          Certificate of Completion
        </div>

        <div className="mt-5 text-4xl md:text-5xl font-extrabold tracking-tight">
          {studentName || "Student Name"}
        </div>

        <div className="mt-3 text-white/70">
          has successfully completed the course
        </div>

        <div className="mt-3 text-2xl md:text-3xl font-bold text-white/90">
          {course || "Course Name"}
        </div>

        <div className="mx-auto mt-6 h-px w-40 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      </div>

      {/* Info grid */}
      <div className="relative mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Info label="Student / Roll ID" value={studentId || "-"} />
        <Info label="Issued At" value={issuedAt || "-"} />
        <Info label="Issuer Address" value={issuer || "-"} mono />
      </div>

      {/* Footer */}
      <div className="relative mt-10 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
        <div className="text-xs text-white/60 max-w-xl leading-relaxed">
          This credential is anchored on-chain for tamper-proof verification.
          Validate anytime using the Certificate ID / QR link.
        </div>

        <div className="text-right">
          <div className="text-xs text-white/60">Authorized Signature</div>
          <div className="mt-2 h-11 w-60 rounded-xl border border-white/10 bg-white/10" />
          <div className="mt-2 text-xs text-white/70">
            CertiChain Vault Authority
          </div>
        </div>
      </div>

      <div className="relative mt-8 border-t border-white/10 pt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs text-white/60">
        <div className="font-mono">Network: Ganache Local (1337)</div>
        <div className="font-mono">Solidity • Web3.js • React</div>
      </div>
    </div>
  );
}

function Info({ label, value, mono }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs text-white/55">{label}</div>
      <div className={mono ? "mt-2 font-mono text-xs break-all" : "mt-2 text-sm"}>
        {value}
      </div>
    </div>
  );
}