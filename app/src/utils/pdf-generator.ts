import jsPDF from 'jspdf'

interface PDFOptions {
	fullName?: string
	email?: string
	phone?: string
	companyName?: string
	position?: string
	signature?: string | null
}

/**
 * Generates a professional PDF cover letter with proper formatting
 */
export function generatePDF(
	content: string,
	filename: string = 'cover-letter.pdf',
	options: PDFOptions = {}
): void {
	const doc = new jsPDF()
	const pageWidth = doc.internal.pageSize.getWidth()
	const pageHeight = doc.internal.pageSize.getHeight()
	
	// Professional margins (standard business letter format)
	const topMargin = 30
	const leftMargin = 25
	const rightMargin = 25
	const bottomMargin = 25
	const maxWidth = pageWidth - leftMargin - rightMargin
	
	// Typography settings
	const headerFontSize = 11
	const bodyFontSize = 11
	const lineHeight = 5.5
	const paragraphSpacing = 6
	
	let y = topMargin
	
	// Sender information (top left) - Standard business letter format
	if (options.fullName || options.email || options.phone) {
		doc.setFontSize(headerFontSize)
		doc.setFont('helvetica', 'bold')
		
		if (options.fullName) {
			doc.text(options.fullName, leftMargin, y)
			y += lineHeight + 1
		}
		
		doc.setFont('helvetica', 'normal')
		doc.setTextColor(60, 60, 60)
		
		if (options.email) {
			doc.text(options.email, leftMargin, y)
			y += lineHeight
		}
		
		if (options.phone) {
			doc.text(options.phone, leftMargin, y)
			y += lineHeight
		}
		
		// Reset text color
		doc.setTextColor(0, 0, 0)
		y += paragraphSpacing + 2
	}
	
	// Date (below sender info, right-aligned or left-aligned - using left for block style)
	const today = new Date()
	const dateStr = today.toLocaleDateString('en-US', { 
		year: 'numeric', 
		month: 'long', 
		day: 'numeric' 
	})
	
	doc.setFont('helvetica', 'normal')
	doc.setFontSize(bodyFontSize)
	doc.text(dateStr, leftMargin, y)
	y += paragraphSpacing + 4
	
	// Recipient information (below date, standard format)
	// Note: We show company name only, salutation will be in content
	if (options.companyName) {
		doc.setFont('helvetica', 'normal')
		doc.setFontSize(bodyFontSize)
		doc.text(options.companyName, leftMargin, y)
		y += paragraphSpacing + 4
	} else {
		y += paragraphSpacing
	}
	
	// Clean content: remove duplicate contact information that's already in header
	let cleanedContent = content
	
	// Ensure proper salutation format (standard uses colon, not comma)
	// Don't remove salutation - it's required in standard format
	// But ensure it's properly formatted
	const lines = cleanedContent.split('\n')
	if (lines.length > 0) {
		const firstLine = lines[0].trim()
		const salutationPatterns = [
			/^Dear\s+(Hiring\s+Manager|Sir|Madam|Mr\.|Mrs\.|Ms\.|Dr\.)[,\s]*$/i,
			/^Dear\s+Hiring\s+Manager[,]?$/i,
			/^Hi\s+there[,]?$/i,
		]
		
		// If salutation exists but doesn't end with colon, fix it
		if (salutationPatterns.some(pattern => pattern.test(firstLine))) {
			if (!firstLine.endsWith(':')) {
				// Replace comma with colon for standard format
				lines[0] = firstLine.replace(/[,]?\s*$/, ':')
				cleanedContent = lines.join('\n')
			}
		} else if (options.companyName) {
			// If no salutation but we have recipient info, add standard salutation
			cleanedContent = 'Dear Hiring Manager:\n\n' + cleanedContent
		}
	}
	
	// Remove contact info from the end of content if it matches header info
	if (options.fullName || options.email || options.phone) {
		const lines = cleanedContent.split('\n')
		
		// Find the closing line (Sincerely, Best regards, etc.)
		let closingIndex = -1
		for (let i = 0; i < lines.length; i++) {
			const trimmed = lines[i].trim()
			const closingPatterns = /^(Sincerely|Best regards|Regards|Yours sincerely|Yours truly|Respectfully),?$/i
			if (closingPatterns.test(trimmed)) {
				closingIndex = i
				break
			}
		}
		
		// Remove contact info lines after closing
		if (closingIndex >= 0) {
			const beforeClosing = lines.slice(0, closingIndex + 1)
			const afterClosing = lines.slice(closingIndex + 1)
			
			// Filter out lines that match contact info (exact or contains)
			const filteredAfterClosing = afterClosing.filter(line => {
				const trimmed = line.trim()
				if (!trimmed) return false
				
				const trimmedLower = trimmed.toLowerCase()
				
				// Check against each contact field
				if (options.fullName) {
					const nameLower = options.fullName.toLowerCase()
					if (trimmedLower === nameLower || trimmedLower.includes(nameLower)) {
						return false
					}
				}
				
				if (options.email) {
					const emailLower = options.email.toLowerCase()
					if (trimmedLower === emailLower || trimmedLower.includes(emailLower)) {
						return false
					}
				}
				
				if (options.phone) {
					const phoneLower = options.phone.toLowerCase().replace(/\s+/g, '')
					const trimmedPhone = trimmedLower.replace(/\s+/g, '')
					if (trimmedPhone === phoneLower || trimmedPhone.includes(phoneLower) || phoneLower.includes(trimmedPhone)) {
						return false
					}
				}
				
				return true
			})
			
			cleanedContent = [...beforeClosing, ...filteredAfterClosing].join('\n')
		}
	}
	
	// Process content with proper paragraph formatting
	doc.setFontSize(bodyFontSize)
	doc.setFont('helvetica', 'normal')
	
	// Split content into paragraphs (double newlines)
	const paragraphs = cleanedContent.split(/\n\s*\n/).filter(p => p.trim())
	
	paragraphs.forEach((paragraph, paraIndex) => {
		const lines = paragraph.split('\n').map(l => l.trim()).filter(l => l)
		
		lines.forEach((line) => {
			// Check if this is a closing line (Sincerely, Best regards, etc.)
			const closingPatterns = /^(Sincerely|Best regards|Regards|Yours sincerely|Yours truly|Respectfully),?$/i
			const isClosing = closingPatterns.test(line)
			
			if (isClosing) {
				// Add extra spacing before closing
				y += paragraphSpacing
			}
			
			// Wrap text to fit page width
			const wrappedLines = doc.splitTextToSize(line, maxWidth)
			
			wrappedLines.forEach((wrappedLine: string) => {
				// Check for page break
				if (y + lineHeight > pageHeight - bottomMargin) {
					doc.addPage()
					y = topMargin
				}
				
				doc.text(wrappedLine, leftMargin, y)
				y += lineHeight
			})
			
			// Add spacing after closing
			if (isClosing) {
				y += lineHeight * 2
			}
		})
		
		// Add spacing between paragraphs (except after last one)
		if (paraIndex < paragraphs.length - 1) {
			y += paragraphSpacing
		}
	})
	
	// Add signature block after closing (standard format: e-signature image, then typed name)
	// Check if there's already a signature in the cleaned content
	const cleanedContentLower = cleanedContent.toLowerCase()
	const nameLower = options.fullName?.toLowerCase() || ''
	const hasNameInContent = nameLower && cleanedContentLower.includes(nameLower)
	
	// Check if the last line was a closing
	const lastLines = cleanedContent.split('\n').filter(l => l.trim())
	const lastLine = lastLines[lastLines.length - 1]?.trim() || ''
	const closingPatterns = /^(Sincerely|Best regards|Regards|Yours sincerely|Yours truly|Respectfully),?$/i
	const hasClosing = closingPatterns.test(lastLine)
	
	// Add signature block if we have closing and name, and space available
	if (options.fullName && hasClosing && !hasNameInContent && y < pageHeight - bottomMargin - lineHeight * 3) {
		// Add spacing after closing
		if (y + lineHeight * 5 > pageHeight - bottomMargin) {
			doc.addPage()
			y = topMargin
		} else {
			y += lineHeight * 1.5
		}
		
		// Add e-signature image if available
		if (options.signature && typeof options.signature === 'string' && options.signature.trim()) {
			try {
				// Use wider signature dimensions for better visibility
				// Signature pad is 120px height, typically wider (around 3:1 or 4:1 aspect ratio)
				// For PDF: 1 inch = 25.4mm, making it wider for better appearance
				const signatureWidth = 80 // mm (about 3.1 inches - wider signature width)
				const signatureHeight = 20 // mm (about 0.8 inches - proportional height)
				
				// Add signature image with pleasant, readable dimensions
				doc.addImage(
					options.signature,
					'PNG',
					leftMargin,
					y,
					signatureWidth,
					signatureHeight
				)
				
				y += signatureHeight + lineHeight * 1.5
			} catch (error) {
				console.error('Error adding signature to PDF:', error)
				// Fallback: just add spacing
				y += lineHeight * 2
			}
		} else {
			// No signature, add space for handwritten signature
			y += lineHeight * 2
		}
		
		// Add typed name below signature
		doc.setFont('helvetica', 'normal')
		if (options.fullName && typeof options.fullName === 'string') {
			doc.text(options.fullName, leftMargin, y)
		}
	}
	
	doc.save(filename)
}
