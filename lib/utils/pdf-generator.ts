import { BillOfLadingFormData } from "@/lib/types/bill-of-lading"

/**
 * Generate a PDF document from HTML element.
 * Note: html2pdf.js and DOMParser are client-side only APIs.
 */
export async function generatePDFFromHTML(htmlElement: string, fileName: string): Promise<Buffer> {
  if (typeof window === "undefined") {
    throw new Error("generatePDFFromHTML is a client-only utility and cannot be executed on the server.")
  }

  // Dynamic import to ensure browser execution only
  const html2pdf = (await import("html2pdf.js")).default

  return new Promise((resolve, reject) => {
    try {
      const element = new DOMParser().parseFromString(htmlElement, "text/html").body

      const opt = {
        margin: 0,
        filename: fileName,
        image: { type: "png", quality: 1.0 },
        html2canvas: { scale: 4, useCORS: true, backgroundColor: "#ffffff" },
        jsPDF: { orientation: "portrait", unit: "mm", format: "a4", precision: 16 },
      } as const

      html2pdf()
        .set(opt)
        .from(element)
        .save()
        .catch((error: Error) => reject(error))
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * Generate PDF metadata for storage
 */
export function generatePDFMetadata(bolData: BillOfLadingFormData) {
  return {
    bolNumber: bolData.bol_number,
    shipper: bolData.shipper_name,
    consignee: bolData.consignee_name,
    truckNumber: bolData.truck_number,
    issueDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  }
}
