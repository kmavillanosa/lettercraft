import { useRef, useEffect, useState } from 'react'
import './signature-pad.css'

interface SignaturePadProps {
	onSignatureChange: (signatureData: string | null) => void
	initialSignature?: string | null
}

export function SignaturePad({ onSignatureChange, initialSignature }: SignaturePadProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const [isDrawing, setIsDrawing] = useState(false)
	const [hasSignature, setHasSignature] = useState(!!initialSignature)

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return

		const ctx = canvas.getContext('2d')
		if (!ctx) return

		// Set canvas size to match display size
		const rect = canvas.getBoundingClientRect()
		const dpr = window.devicePixelRatio || 1
		
		// Set actual canvas size (accounting for device pixel ratio)
		canvas.width = rect.width * dpr
		canvas.height = rect.height * dpr
		
		// Scale context to match device pixel ratio
		ctx.scale(dpr, dpr)
		
		// Set canvas display size (CSS pixels)
		canvas.style.width = rect.width + 'px'
		canvas.style.height = rect.height + 'px'

		// Set drawing style
		ctx.strokeStyle = '#3d3529'
		ctx.lineWidth = 2.5
		ctx.lineCap = 'round'
		ctx.lineJoin = 'round'

		// Load initial signature if provided
		if (initialSignature) {
			const img = new Image()
			img.onload = () => {
				ctx.clearRect(0, 0, rect.width, rect.height)
				ctx.drawImage(img, 0, 0, rect.width, rect.height)
				setHasSignature(true)
			}
			img.src = initialSignature
		}
	}, [initialSignature])

	const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current
		if (!canvas) return { x: 0, y: 0 }

		const rect = canvas.getBoundingClientRect()
		let clientX: number, clientY: number
		
		if ('touches' in e) {
			clientX = e.touches[0].clientX
			clientY = e.touches[0].clientY
		} else {
			clientX = e.clientX
			clientY = e.clientY
		}
		
		// Get coordinates relative to canvas (already scaled by devicePixelRatio in useEffect)
		return {
			x: clientX - rect.left,
			y: clientY - rect.top,
		}
	}

	const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
		e.preventDefault()
		const canvas = canvasRef.current
		if (!canvas) return

		const ctx = canvas.getContext('2d')
		if (!ctx) return

		// Ensure context settings are applied
		ctx.strokeStyle = '#3d3529'
		ctx.lineWidth = 2.5
		ctx.lineCap = 'round'
		ctx.lineJoin = 'round'

		const { x, y } = getCoordinates(e)
		ctx.beginPath()
		ctx.moveTo(x, y)
		setIsDrawing(true)
		setHasSignature(true)
	}

	const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
		if (!isDrawing) return
		e.preventDefault()

		const canvas = canvasRef.current
		if (!canvas) return

		const ctx = canvas.getContext('2d')
		if (!ctx) return

		// Ensure context settings are applied
		ctx.strokeStyle = '#3d3529'
		ctx.lineWidth = 2.5
		ctx.lineCap = 'round'
		ctx.lineJoin = 'round'

		const { x, y } = getCoordinates(e)
		ctx.lineTo(x, y)
		ctx.stroke()
	}

	const stopDrawing = () => {
		if (isDrawing) {
			setIsDrawing(false)
			// Save signature when drawing stops
			saveSignature()
		}
	}

	const saveSignature = () => {
		const canvas = canvasRef.current
		if (!canvas) return

		const dataURL = canvas.toDataURL('image/png')
		onSignatureChange(dataURL)
	}

	const clearSignature = () => {
		const canvas = canvasRef.current
		if (!canvas) return

		const ctx = canvas.getContext('2d')
		if (!ctx) return

		const rect = canvas.getBoundingClientRect()
		const dpr = window.devicePixelRatio || 1
		
		// Clear the entire canvas (accounting for device pixel ratio)
		ctx.clearRect(0, 0, rect.width * dpr, rect.height * dpr)
		setHasSignature(false)
		onSignatureChange(null)
	}

	return (
		<div className="signature-pad-container">
			<div className="signature-pad-header">
				<label className="signature-label">E-Signature</label>
				{hasSignature && (
					<button
						type="button"
						onClick={clearSignature}
						className="signature-clear-btn"
						aria-label="Clear signature"
					>
						Clear
					</button>
				)}
			</div>
			<div className="signature-pad-wrapper">
				<canvas
					ref={canvasRef}
					className="signature-canvas"
					onMouseDown={startDrawing}
					onMouseMove={draw}
					onMouseUp={stopDrawing}
					onMouseLeave={stopDrawing}
					onTouchStart={startDrawing}
					onTouchMove={draw}
					onTouchEnd={stopDrawing}
				/>
				{!hasSignature && (
					<div className="signature-placeholder">
						<span>Draw your signature here</span>
					</div>
				)}
			</div>
		</div>
	)
}
