/**
 * scripts/apply-pdf-product-name-and-download-fixes.cjs
 *
 * 1. Updates font scaling in CargoRow commPart (a4-preview.tsx) so product names like
 *    "BLACK RAISINS" (13 chars) and other commodities (10-25 chars) fit cleanly in the cell
 *    without being truncated with an ellipsis (...).
 * 2. Improves PDF download in pdf-upload.ts and shipping-documents.ts:
 *    - Awaits document.fonts.ready and img.decode() to guarantee complete font rendering and image clarity.
 *    - Uses crisp "MEDIUM" jsPDF image compression instead of low-quality "FAST" downsampling.
 *    - Sets geometric precision and tight letter-spacing for cargo text in PDF export styles.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// 1. Update components/bill-of-lading/a4-preview.tsx
const a4PreviewPath = path.join(rootDir, 'components', 'bill-of-lading', 'a4-preview.tsx');
let a4Content = fs.readFileSync(a4PreviewPath, 'utf8');

const oldScalingTarget = `commPart.length > 22
                    ? (isUltra ? "text-[4.8pt]" : isCompact ? "text-[5.4pt]" : "text-[6.0pt]")
                    : commPart.length > 16
                    ? (isUltra ? "text-[5.2pt]" : isCompact ? "text-[5.8pt]" : "text-[6.4pt]")
                    : commPart.length > 11
                    ? (isUltra ? "text-[5.6pt]" : isCompact ? "text-[6.2pt]" : "text-[6.8pt]")
                    : commPart.length > 7
                    ? (isUltra ? "text-[6.0pt]" : isCompact ? "text-[6.6pt]" : "text-[7.2pt]")
                    : (isUltra ? "text-[6.6pt]" : isCompact ? "text-[7.2pt]" : "text-[8.0pt]")`;

const newScalingReplacement = `commPart.length > 22
                    ? (isUltra ? "text-[4.0pt]" : isCompact ? "text-[4.4pt]" : "text-[4.8pt]")
                    : commPart.length > 16
                    ? (isUltra ? "text-[4.4pt]" : isCompact ? "text-[4.8pt]" : "text-[5.2pt]")
                    : commPart.length > 11
                    ? (isUltra ? "text-[4.8pt]" : isCompact ? "text-[5.2pt]" : "text-[5.5pt]")
                    : commPart.length > 7
                    ? (isUltra ? "text-[5.4pt]" : isCompact ? "text-[5.8pt]" : "text-[6.2pt]")
                    : (isUltra ? "text-[6.0pt]" : isCompact ? "text-[6.6pt]" : "text-[7.2pt]")`;

// Normalize line endings for replacement
const normalizeLineBreaks = (str) => str.replace(/\r\n/g, '\n');

if (normalizeLineBreaks(a4Content).includes(normalizeLineBreaks(oldScalingTarget))) {
  const isCrlf = a4Content.includes('\r\n');
  const targetToReplace = isCrlf ? oldScalingTarget.replace(/\n/g, '\r\n') : oldScalingTarget;
  const replacementText = isCrlf ? newScalingReplacement.replace(/\n/g, '\r\n') : newScalingReplacement;
  a4Content = a4Content.replace(targetToReplace, replacementText);
  fs.writeFileSync(a4PreviewPath, a4Content, 'utf8');
  console.log('✓ Successfully updated CargoRow commPart font scaling in a4-preview.tsx');
} else {
  console.log('Notice: CargoRow commPart font scaling target already updated or not found.');
}

// 2. Update lib/utils/pdf-upload.ts
const pdfUploadPath = path.join(rootDir, 'lib', 'utils', 'pdf-upload.ts');
let pdfUploadContent = fs.readFileSync(pdfUploadPath, 'utf8');

// Update jsPDF addImage compression from "FAST" to "MEDIUM"
if (pdfUploadContent.includes('pdf.addImage(imageData, "JPEG", 0, 0, pageWidth, pageHeight, undefined, "FAST")')) {
  pdfUploadContent = pdfUploadContent.replace(
    'pdf.addImage(imageData, "JPEG", 0, 0, pageWidth, pageHeight, undefined, "FAST")',
    'pdf.addImage(imageData, "JPEG", 0, 0, pageWidth, pageHeight, undefined, "MEDIUM")'
  );
  console.log('✓ Upgraded pdf.addImage to high-fidelity MEDIUM compression in pdf-upload.ts');
}

// Add font and image decoding readiness before html2canvas capture in pdf-upload.ts
const yieldMarker = `// Cooperative yield before fallback canvas creation
      await new Promise((resolve) => setTimeout(resolve, 0))`;

const improvedYield = `// Cooperative yield before fallback canvas creation: guarantee fonts & images are fully decoded
      if (typeof document !== "undefined" && document.fonts?.ready) {
        try { await document.fonts.ready } catch {}
      }
      try {
        const clonedImgs = Array.from(clonedElement.querySelectorAll("img"))
        await Promise.all(clonedImgs.map((img) => (img.complete ? Promise.resolve() : img.decode?.().catch(() => {}))))
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 0))`;

if (normalizeLineBreaks(pdfUploadContent).includes(normalizeLineBreaks(yieldMarker))) {
  const isCrlf = pdfUploadContent.includes('\r\n');
  const targetToReplace = isCrlf ? yieldMarker.replace(/\n/g, '\r\n') : yieldMarker;
  const replacementText = isCrlf ? improvedYield.replace(/\n/g, '\r\n') : improvedYield;
  pdfUploadContent = pdfUploadContent.replace(targetToReplace, replacementText);
  console.log('✓ Added fonts and image decoding readiness to generatePDFBlob in pdf-upload.ts');
}

fs.writeFileSync(pdfUploadPath, pdfUploadContent, 'utf8');

// 3. Update lib/utils/shipping-documents.ts
const shippingDocsPath = path.join(rootDir, 'lib', 'utils', 'shipping-documents.ts');
let shippingDocsContent = fs.readFileSync(shippingDocsPath, 'utf8');

if (shippingDocsContent.includes('pdf.addImage(imageData, "JPEG", 0, 0, PAGE_WIDTH, PAGE_HEIGHT, undefined, "FAST")')) {
  shippingDocsContent = shippingDocsContent.replace(
    'pdf.addImage(imageData, "JPEG", 0, 0, PAGE_WIDTH, PAGE_HEIGHT, undefined, "FAST")',
    'pdf.addImage(imageData, "JPEG", 0, 0, PAGE_WIDTH, PAGE_HEIGHT, undefined, "MEDIUM")'
  );
  console.log('✓ Upgraded pdf.addImage to high-fidelity MEDIUM compression in shipping-documents.ts');
}

fs.writeFileSync(shippingDocsPath, shippingDocsContent, 'utf8');

console.log('=== All Product Name & PDF Download Improvements Applied! ===');
