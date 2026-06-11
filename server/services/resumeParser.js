const mammoth = require("mammoth");

async function extractResumeText(file) {
  const { mimetype, buffer } = file;

  if (!buffer) {
    throw new Error("File buffer missing");
  }

  // ✅ PDF (Node 23 + pdfjs)
  if (mimetype === "application/pdf") {
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

    const uint8Array = new Uint8Array(buffer);
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;

    let text = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = buildPdfPageText(content.items);
      text += pageText + "\n";
    }

    return text;
  }

  // ✅ DOCX
  if (
    mimetype ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  // ⚠️ DOC
  if (mimetype === "application/msword") {
    throw new Error("Please upload DOCX instead of DOC");
  }

  throw new Error(`Unsupported file type: ${mimetype}`);
}

function buildPdfPageText(items = []) {
  const rows = [];
  const rowTolerance = 3;

  for (const item of items) {
    const value = item.str?.trim();

    if (!value) {
      continue;
    }

    const x = item.transform?.[4] || 0;
    const y = item.transform?.[5] || 0;

    let row = rows.find(existing =>
      Math.abs(existing.y - y) <= rowTolerance
    );

    if (!row) {
      row = { y, items: [] };
      rows.push(row);
    }

    row.items.push({ x, value });
  }

  return rows
    .sort((a, b) => b.y - a.y)
    .map(row =>
      row.items
        .sort((a, b) => a.x - b.x)
        .map(item => item.value)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean)
    .join("\n");
}

module.exports = { extractResumeText };
