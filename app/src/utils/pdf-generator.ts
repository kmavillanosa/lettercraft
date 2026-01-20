import jsPDF from 'jspdf'

/**
 * Generates a PDF from text content
 */
export function generatePDF(content: string, filename: string = 'cover-letter.pdf'): void {
	const doc = new jsPDF()
	const pageWidth = doc.internal.pageSize.getWidth()
	const pageHeight = doc.internal.pageSize.getHeight()
	const margin = 20
	const maxWidth = pageWidth - 2 * margin
	const lineHeight = 7

	// Split content into lines, handling word wrapping
	const lines = doc.splitTextToSize(content, maxWidth)

	let y = margin
	const pageBreakHeight = pageHeight - margin

	lines.forEach((line: string) => {
		if (y + lineHeight > pageBreakHeight) {
			doc.addPage()
			y = margin
		}
		doc.text(line, margin, y)
		y += lineHeight
	})

	doc.save(filename)
}
