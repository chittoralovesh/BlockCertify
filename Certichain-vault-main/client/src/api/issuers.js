const BACKEND = "http://localhost:5051";
export async function fetchIssuer(address) {
  const addr = (address || "").toLowerCase();
  const res = await fetch(`${BACKEND}/issuers/${addr}`);

  // ✅ If backend returns HTML or text, don't crash JSON parse
  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Backend returned non-JSON. Check backend on ${BACKEND} is running.`);
  }

  if (!res.ok) throw new Error(data?.error || "Issuer not found");
  return data;
}