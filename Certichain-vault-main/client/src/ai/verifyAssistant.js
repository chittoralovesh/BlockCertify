function normalize(s) {
  return (s || "").toString().trim().toLowerCase().replace(/\s+/g, " ");
}

function safe(val) {
  if (val === undefined || val === null) return "";
  return val.toString();
}

/**
 * Tries to read certificate fields from either:
 * - named return (data.studentName etc)
 * - or indexed return (data[1], data[2] ...)
 */
export function parseCertificate(data) {
  if (!data) return null;

  const id =
    safe(data.id ?? data[0]) ||
    ""; // sometimes id can be missing in struct returns

  const studentName = safe(data.studentName ?? data[1]);
  const studentId = safe(data.studentId ?? data[2]);
  const course = safe(data.course ?? data[3]);

  // CID could be ipfsHash or cid depending on contract version
  const ipfsCid = safe(data.ipfsHash ?? data.cid ?? data[4]);

  // optional fields if you added them
  const fileHash = safe(data.fileHash ?? data[5]);
  const timestampRaw = data.timestamp ?? data[6];
  const timestamp = timestampRaw ? Number(timestampRaw) : null;

  const issuer = safe(data.issuer ?? data[7]);

  // revoked may be boolean or "true"/"false" or 0/1
  const revokedRaw = data.revoked ?? data[8];
  const revoked =
    revokedRaw === true ||
    revokedRaw === "true" ||
    revokedRaw === 1 ||
    revokedRaw === "1";

  return {
    id,
    studentName,
    studentId,
    course,
    ipfsCid,
    fileHash,
    timestamp,
    issuer,
    revoked,
  };
}

/**
 * AI-like explanation from on-chain record.
 * No paid API needed — but reads like an assistant.
 */
export function generateAiExplanation(cert) {
  if (!cert) {
    return {
      verdict: "NOT_FOUND",
      summary:
        "I couldn’t find an on-chain certificate record for this ID. Please re-check the ID or try again.",
      checks: [],
      risk: "Unknown",
    };
  }

  const checks = [];

  // basic validity
  checks.push({
    label: "On-chain record",
    status: "PASS",
    detail: "Certificate data was successfully read from the blockchain.",
  });

  // revoked
  if (cert.revoked) {
    checks.push({
      label: "Revocation status",
      status: "FAIL",
      detail:
        "This certificate has been revoked by the issuer. Treat it as invalid.",
    });
  } else {
    checks.push({
      label: "Revocation status",
      status: "PASS",
      detail: "This certificate is not marked as revoked.",
    });
  }

  // completeness
  const missing = [];
  if (!cert.studentName) missing.push("studentName");
  if (!cert.studentId) missing.push("studentId");
  if (!cert.course) missing.push("course");

  if (missing.length) {
    checks.push({
      label: "Data completeness",
      status: "WARN",
      detail: `Some fields are empty: ${missing.join(", ")}. This may indicate incomplete issuance.`,
    });
  } else {
    checks.push({
      label: "Data completeness",
      status: "PASS",
      detail: "Key fields (name, ID, course) are present.",
    });
  }

  // IPFS presence (optional)
  if (cert.ipfsCid) {
    checks.push({
      label: "IPFS attachment",
      status: "PASS",
      detail: "An IPFS CID is associated with this certificate.",
    });
  } else {
    checks.push({
      label: "IPFS attachment",
      status: "WARN",
      detail:
        "No IPFS CID is attached. Verification is still possible, but there is no linked PDF.",
    });
  }

  // simple risk score (looks AI, but deterministic)
  let riskPoints = 0;
  if (cert.revoked) riskPoints += 4;
  if (missing.length) riskPoints += 2;
  if (!cert.ipfsCid) riskPoints += 1;

  // suspicious patterns
  const idNorm = normalize(cert.studentId);
  if (idNorm && idNorm.length < 5) riskPoints += 1;
  if (normalize(cert.studentName).split(" ").length === 1) riskPoints += 1;

  let risk = "Low";
  if (riskPoints >= 5) risk = "High";
  else if (riskPoints >= 3) risk = "Medium";

  const verdict = cert.revoked ? "REVOKED" : "VALID";

  const dateStr = cert.timestamp
    ? new Date(cert.timestamp * 1000).toLocaleString()
    : "unknown time";

  const summary =
    verdict === "VALID"
      ? `This certificate looks valid. It was issued for ${cert.studentName || "the student"} (${cert.studentId || "ID not shown"}) in ${cert.course || "the course"}, recorded on-chain at ${dateStr}.`
      : `This certificate record exists on-chain, but it is revoked. You should treat it as invalid even if the details look correct.`;

  return { verdict, summary, checks, risk };
}