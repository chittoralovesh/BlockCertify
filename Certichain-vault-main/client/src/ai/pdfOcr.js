import * as pdfjsLib from "pdfjs-dist";
import { GlobalWorkerOptions } from "pdfjs-dist";

// ✅ Correct worker path for newer pdfjs versions
GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

/**
 * Extract raw text from a PDF file (client-side).
 */
export async function extractTextFromPdf(file) {
  const arrayBuffer = await file.arrayBuffer();

  const pdf = await pdfjsLib.getDocument({
    data: arrayBuffer,
  }).promise;

  let text = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((it) => it.str).join(" ");
    text += "\n" + strings;
  }

  return text;
}

/**
 * Smart-ish parsing rules (lightweight AI style)
 */
export function guessFieldsFromText(raw) {
  const t = raw.replace(/\s+/g, " ").trim();

  const certNoMatch = t.match(/Certificate\s*ID\s*[:#]?\s*([A-Z0-9-]{5,20})/i);
  const nameMatch =
    t.match(/(?:awarded to|presented to|certify that)\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,3})/i) ||
    t.match(/\b([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){1,3})\b/);

  const courseMatch =
    t.match(/(?:completed|completion of|successfully completed)\s+(the\s+)?(.{3,60}?)(?:\s+on|\s+dated|\s+in\s+\d{4}|$)/i) ||
    t.match(/(?:course|program|training)\s*:\s*(.{3,60})/i);

  const idMatch =
    t.match(/\b(22[A-Z]{2,5}\d{4,6}|23[A-Z]{2,5}\d{4,6}|[A-Z]{2,6}\d{4,10})\b/) ||
    t.match(/(?:roll|id|registration)\s*(?:no)?\s*[:#]?\s*([A-Za-z0-9-]{5,20})/i);

  return {
    studentName: nameMatch?.[1]?.trim() || "",
    certNo: certNoMatch?.[1]?.trim() || "",
    course: (courseMatch?.[2] || courseMatch?.[1] || "").trim(),
    studentId: idMatch?.[1]?.trim() || "",
    rawPreview: t.slice(0, 240),
  };
}