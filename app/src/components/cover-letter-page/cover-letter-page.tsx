import { useState, useMemo, useEffect, useRef } from 'react'
import { useAppSelector, useAppDispatch } from '../../store/hooks'
import { setActiveTemplate } from '../../store/slices/templates-slice'
import { updateDetails } from '../../store/slices/basic-details-slice'
import { processTemplate } from '../../utils/template-processor'
import { generatePDF, generateMarkdownPDF } from '../../utils/pdf-generator'
import { downloadText } from '../../utils/text-download'
import { getQueryParams, updateUrlParams } from '../../utils/query-params'
import { saveDefaults, clearDefaults } from '../../utils/local-storage'
import { FieldType } from '../../types'
import { SignaturePad } from '../signature-pad/signature-pad'
import './cover-letter-page.css'

export function CoverLetterPage() {
	const dispatch = useAppDispatch()
	const { variables } = useAppSelector((state) => state.templateVariables)
	const { templates, activeTemplateId } = useAppSelector((state) => state.templates)
	const { details } = useAppSelector((state) => state.basicDetails)

	const activeTemplate = useMemo(
		() => templates.find((t) => t.id === activeTemplateId) || templates[0],
		[templates, activeTemplateId]
	)

	const templateVariables = useMemo(
		() => variables.filter((v) => activeTemplate.variables.includes(v.id)),
		[variables, activeTemplate]
	)

	const [formValues, setFormValues] = useState<Record<string, string>>(() => {
		const initial: Record<string, string> = {}
		templateVariables.forEach((variable) => {
			// For techStack, use saved value from details if available
			if (variable.id === 'techStack' && details.techStack) {
				initial[variable.id] = details.techStack
			} else {
				initial[variable.id] = details[variable.id as keyof typeof details] || variable.defaultValue || ''
			}
		})
		return initial
	})

	const [searchTerms, setSearchTerms] = useState<Record<string, string>>({})
	const [showSuggestions, setShowSuggestions] = useState<Record<string, boolean>>({})
	const [highlightedIndex, setHighlightedIndex] = useState<Record<string, number>>({})
	const [showSettings, setShowSettings] = useState(false)
	const [settingsValues, setSettingsValues] = useState({
		fullName: details.fullName,
		email: details.email,
		phone: details.phone,
		techStack: details.techStack || '',
	})
	const [signature, setSignature] = useState<string | null>(() => {
		const saved = localStorage.getItem('lettercraft_signature')
		return saved || null
	})
	const [showExportDropdown, setShowExportDropdown] = useState(false)
	const exportDropdownRef = useRef<HTMLDivElement>(null)
	const isInitialMount = useRef(true)
	const updateUrlTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

	// Read query parameters on initial mount only
	useEffect(() => {
		if (isInitialMount.current && templates.length > 0 && variables.length > 0) {
			const queryParams = getQueryParams()
			
			// Set template from query params if provided
			if (queryParams.template && templates.some((t) => t.id === queryParams.template)) {
				dispatch(setActiveTemplate(queryParams.template))
			}
			
			// Pre-fill form values from query params
			// We need to wait for templateVariables to be available
			const currentTemplate = templates.find((t) => t.id === (queryParams.template || activeTemplateId)) || templates[0]
			const currentVariables = variables.filter((v) => currentTemplate.variables.includes(v.id))
			
			const initial: Record<string, string> = {}
			currentVariables.forEach((variable) => {
				// Prefer query param, then details, then default value
				const queryValue = queryParams[variable.id]
				const detailValue = details[variable.id as keyof typeof details]
				const defaultValue = variable.defaultValue || ''
				initial[variable.id] = queryValue || detailValue || defaultValue
			})
			setFormValues(initial)
			
			isInitialMount.current = false
		}
	}, [templates, variables, activeTemplateId, details, dispatch])

	// Reset form values when template changes (but not on initial mount)
	// Preserve existing values for fields that exist in both templates
	useEffect(() => {
		if (!isInitialMount.current) {
			const updated: Record<string, string> = {}
			templateVariables.forEach((variable) => {
				// Preserve existing form value if it exists, otherwise use details or default
				const existingValue = formValues[variable.id]
				if (existingValue && existingValue.trim()) {
					updated[variable.id] = existingValue
				} else {
					// For techStack, prefer saved details value
					if (variable.id === 'techStack' && details.techStack) {
						updated[variable.id] = details.techStack
					} else {
						updated[variable.id] = details[variable.id as keyof typeof details] || variable.defaultValue || ''
					}
				}
			})
			setFormValues(updated)
			// Reset search terms and suggestions when template changes
			setSearchTerms({})
			setShowSuggestions({})
			setHighlightedIndex({})
		}
	}, [activeTemplateId, templateVariables, details, dispatch])

	// Update settings values when details change
	useEffect(() => {
		setSettingsValues({
			fullName: details.fullName,
			email: details.email,
			phone: details.phone,
			techStack: details.techStack || '',
		})
	}, [details.fullName, details.email, details.phone, details.techStack])

	// Update URL with form values (debounced)
	useEffect(() => {
		if (!isInitialMount.current) {
			// Clear existing timeout
			if (updateUrlTimeoutRef.current) {
				clearTimeout(updateUrlTimeoutRef.current)
			}
			
			// Debounce URL updates
			updateUrlTimeoutRef.current = setTimeout(() => {
				const params: Record<string, string> = {
					...formValues,
					template: activeTemplateId || '',
				}
				updateUrlParams(params)
			}, 500) // Wait 500ms after user stops typing
		}
		
		return () => {
			if (updateUrlTimeoutRef.current) {
				clearTimeout(updateUrlTimeoutRef.current)
			}
		}
	}, [formValues, activeTemplateId])

	const processedContent = useMemo(() => {
		return processTemplate(activeTemplate.content, templateVariables, formValues)
	}, [activeTemplate.content, templateVariables, formValues])

	// Check which required fields are missing (check all variables, including those with defaults)
	const missingRequiredFields = useMemo(() => {
		const missing: string[] = []
		templateVariables.forEach((variable) => {
			if (variable.required) {
				// Get value from form or from details (for fields with defaults)
				const formValue = formValues[variable.id] || ''
				const detailValue = details[variable.id as keyof typeof details] || ''
				const value = formValue.trim() || (typeof detailValue === 'string' ? detailValue.trim() : '')
				if (!value) {
					missing.push(variable.label)
				}
			}
		})
		return missing
	}, [templateVariables, formValues, details])

	const isFormValid = missingRequiredFields.length === 0

	const handleInputChange = (variableId: string, value: string) => {
		setFormValues((prev) => ({
			...prev,
			[variableId]: value,
		}))
	}

	const handleMultiselectChange = (variableId: string, selectedOptions: string[]) => {
		setFormValues((prev) => ({
			...prev,
			[variableId]: selectedOptions.join(', '),
		}))
	}

	const handleExportPDF = () => {
		if (!isFormValid) return
		const companyName = formValues.companyName || formValues.position || 'application'
		const filename = `cover-letter-${companyName}-${Date.now()}.pdf`
		generatePDF(processedContent, filename, {
			fullName: formValues.fullName || details.fullName,
			email: formValues.email || details.email,
			phone: formValues.phone || details.phone,
			companyName: formValues.companyName,
			position: formValues.position,
			signature: signature,
		})
		setShowExportDropdown(false)
	}

	const handleSignatureChange = (signatureData: string | null) => {
		setSignature(signatureData)
		if (signatureData) {
			localStorage.setItem('lettercraft_signature', signatureData)
		} else {
			localStorage.removeItem('lettercraft_signature')
		}
	}

	const handleExportText = () => {
		if (!isFormValid) return
		const companyName = formValues.companyName || formValues.position || 'application'
		const filename = `cover-letter-${companyName}-${Date.now()}.txt`
		downloadText(processedContent, filename)
		setShowExportDropdown(false)
	}

	const handleExportMarkdownPDF = () => {
		if (!isFormValid) return
		const companyName = formValues.companyName || formValues.position || 'application'
		const filename = `cover-letter-${companyName}-${Date.now()}.md.pdf`
		generateMarkdownPDF(processedContent, filename, {
			fullName: formValues.fullName || details.fullName,
			email: formValues.email || details.email,
			phone: formValues.phone || details.phone,
			companyName: formValues.companyName,
			position: formValues.position,
			signature: signature,
		})
		setShowExportDropdown(false)
	}

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
				setShowExportDropdown(false)
			}
		}

		if (showExportDropdown) {
			// Use a longer delay to ensure dropdown menu is rendered and click handlers are set up
			const timeoutId = setTimeout(() => {
				document.addEventListener('mousedown', handleClickOutside)
			}, 200)

			return () => {
				clearTimeout(timeoutId)
				document.removeEventListener('mousedown', handleClickOutside)
			}
		}
	}, [showExportDropdown])

	// Close dropdown when form becomes invalid
	useEffect(() => {
		if (!isFormValid && showExportDropdown) {
			setShowExportDropdown(false)
		}
	}, [isFormValid, showExportDropdown])

	const handleTemplateChange = (templateId: string) => {
		dispatch(setActiveTemplate(templateId))
	}

	const handleSaveSettings = () => {
		// Save to localStorage
		saveDefaults({
			fullName: settingsValues.fullName,
			email: settingsValues.email,
			phone: settingsValues.phone,
			techStack: settingsValues.techStack,
		})
		
		// Update Redux store
		dispatch(updateDetails({
			fullName: settingsValues.fullName,
			email: settingsValues.email,
			phone: settingsValues.phone,
			techStack: settingsValues.techStack,
		}))
		
		// Update form values if they're empty
		setFormValues((prev) => ({
			...prev,
			fullName: prev.fullName || settingsValues.fullName,
			email: prev.email || settingsValues.email,
			phone: prev.phone || settingsValues.phone,
			techStack: prev.techStack || settingsValues.techStack,
		}))
		
		setShowSettings(false)
	}

	const handleCancelSettings = () => {
		// Reset to current details
		setSettingsValues({
			fullName: details.fullName,
			email: details.email,
			phone: details.phone,
			techStack: details.techStack || '',
		})
		setShowSettings(false)
	}

	const handleResetSettings = () => {
		// Confirm reset action
		if (window.confirm('Are you sure you want to reset all saved data? This will clear your name, email, phone, and tech stack defaults.')) {
			// Clear localStorage
			clearDefaults()
			
			// Reset Redux store
			dispatch(updateDetails({
				fullName: '',
				email: '',
				phone: '',
				techStack: '',
			}))
			
			// Reset settings form values
			setSettingsValues({
				fullName: '',
				email: '',
				phone: '',
				techStack: '',
			})
			
			// Clear form values for personal info fields
			setFormValues((prev) => ({
				...prev,
				fullName: '',
				email: '',
				phone: '',
				techStack: '',
			}))
			
			// Clear signature if exists
			localStorage.removeItem('lettercraft_signature')
			setSignature(null)
		}
	}

	// Group and filter variables based on defaults
	const groupedVariables = useMemo(() => {
		// Application details - includes techStack (but techStack can be hidden if default exists)
		const allApplicationFields = templateVariables.filter(v => 
			['companyName', 'position', 'date', 'techStack'].includes(v.id)
		)
		
		// Application fields to show (exclude techStack if it has a default)
		const applicationFields = allApplicationFields.filter(v => {
			if (v.id === 'techStack' && details.techStack?.trim()) {
				return false // Hide techStack if default exists
			}
			return true
		})
		
		// Template-specific fields (always show)
		const templateSpecificFields = templateVariables.filter(v => 
			!['fullName', 'email', 'phone', 'techStack'].includes(v.id) && 
			!['companyName', 'position', 'date'].includes(v.id)
		)
		
		// Fields to show (exclude personal info and techStack if defaults exist)
		const fieldsToShow = [
			...applicationFields,
			...templateSpecificFields,
			// Only include personal info fields if they don't have defaults
			...templateVariables.filter(v => 
				['fullName', 'email', 'phone'].includes(v.id) && !details[v.id as keyof typeof details]?.trim()
			)
		]
		
		return {
			personalInfo: templateVariables.filter(v => ['fullName', 'email', 'phone'].includes(v.id)),
			applicationDetails: allApplicationFields, // All application fields for grouping
			templateSpecific: templateSpecificFields,
			visible: fieldsToShow
		}
	}, [templateVariables, details])

	// Calculate form completion percentage based on visible fields
	const formCompletion = useMemo(() => {
		const totalFields = groupedVariables.visible.length
		const filledFields = groupedVariables.visible.filter((variable) => {
			const value = formValues[variable.id] || ''
			return value.trim().length > 0
		}).length
		return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0
	}, [groupedVariables, formValues])

	// Validate individual field
	const validateField = (variable: typeof templateVariables[0], value: string): string | null => {
		if (variable.fieldType === FieldType.MULTISELECT) {
			const selectedValues = value ? value.split(', ').filter(Boolean) : []
			if (variable.required && selectedValues.length === 0) {
				return `${variable.label} is required`
			}
			return null
		}
		
		if (variable.required && !value.trim()) {
			return `${variable.label} is required`
		}
		
		if (value.trim()) {
			if (variable.fieldType === FieldType.EMAIL) {
				const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
				if (!emailRegex.test(value.trim())) {
					return 'Please enter a valid email address'
				}
			}
			
			if (variable.fieldType === FieldType.PHONE) {
				const phoneRegex = /^[\d\s\-\+\(\)]+$/
				if (!phoneRegex.test(value.trim()) || value.trim().replace(/\D/g, '').length < 10) {
					return 'Please enter a valid phone number'
				}
			}
		}
		
		return null
	}

	const handleCopyToClipboard = async () => {
		try {
			await navigator.clipboard.writeText(processedContent)
			// Show success feedback (you could add a toast notification here)
			const button = document.querySelector('.btn-copy') as HTMLButtonElement
			if (button) {
				const originalText = button.innerHTML
				button.innerHTML = '<span>✓</span><span>Copied!</span>'
				button.disabled = true
				setTimeout(() => {
					button.innerHTML = originalText
					button.disabled = false
				}, 2000)
			}
		} catch (err) {
			console.error('Failed to copy to clipboard:', err)
		}
	}

	const renderInput = (variable: typeof templateVariables[0]) => {
		const value = formValues[variable.id] || ''
		const error = validateField(variable, value)
		const hasError = error !== null
		const isFilled = value.trim().length > 0
		const isValid = !hasError && isFilled

		switch (variable.fieldType) {
			case FieldType.MULTISELECT:
				const selectedValues = value ? value.split(', ').filter(Boolean) : []
				const searchTerm = searchTerms[variable.id] || ''
				const isSuggestionsVisible = showSuggestions[variable.id] || false
				const currentHighlightedIndex = highlightedIndex[variable.id] ?? -1
				
				// Filter options based on search term, excluding already selected items
				let filteredOptions: string[] = []
				let canAddCustom = false
				let customSkillText = ''
				
				if (variable.options) {
					const term = searchTerm.toLowerCase().trim()
					
					if (term) {
						// Check if search term matches any existing option
						const exactMatch = variable.options.find(
							(option) => option.toLowerCase() === term
						)
						
						// Check if it's already selected
						const isAlreadySelected = selectedValues.some(
							(selected) => selected.toLowerCase() === term
						)
						
						// If no exact match and not already selected, allow custom skill
						if (!exactMatch && !isAlreadySelected && term.length > 0) {
							canAddCustom = true
							customSkillText = searchTerm.trim()
						}
						
						// Filter matching options
						filteredOptions = variable.options
							.filter((option) => {
								// Don't show already selected items
								if (selectedValues.includes(option)) return false
								// Filter by search term
								return option.toLowerCase().includes(term)
							})
							.slice(0, 10) // Limit to 10 suggestions
					} else {
						// If no search term, show all (up to a limit)
						filteredOptions = variable.options
							.filter((option) => !selectedValues.includes(option))
							.slice(0, 10)
					}
				}
				
				// Add custom skill option at the end if applicable
				const displayOptions = canAddCustom
					? [...filteredOptions, `+ Add "${customSkillText}"`]
					: filteredOptions
				
				const handleAddTech = (tech: string) => {
					// Handle custom skill addition
					let techToAdd = tech
					if (tech.startsWith('+ Add "')) {
						techToAdd = customSkillText
					}
					
					if (techToAdd && !selectedValues.includes(techToAdd)) {
						const updated = [...selectedValues, techToAdd]
						handleMultiselectChange(variable.id, updated)
						setSearchTerms((prev) => ({
							...prev,
							[variable.id]: '',
						}))
						setShowSuggestions((prev) => ({
							...prev,
							[variable.id]: false,
						}))
						setHighlightedIndex((prev) => ({
							...prev,
							[variable.id]: -1,
						}))
					}
				}
				
				const handleRemoveTech = (techToRemove: string) => {
					const updated = selectedValues.filter((tech) => tech !== techToRemove)
					handleMultiselectChange(variable.id, updated)
				}
				
				const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
					if (e.key === 'Enter') {
						e.preventDefault()
						
						// If there's a highlighted option, add it
						if (currentHighlightedIndex >= 0 && displayOptions[currentHighlightedIndex]) {
							handleAddTech(displayOptions[currentHighlightedIndex])
						} else if (canAddCustom && searchTerm.trim()) {
							// If no highlight but custom skill can be added, add it
							handleAddTech(`+ Add "${customSkillText}"`)
						} else if (filteredOptions.length === 1 && !canAddCustom) {
							// If only one option, add it
							handleAddTech(filteredOptions[0])
						}
					} else if (e.key === 'ArrowDown') {
						e.preventDefault()
						if (displayOptions.length > 0) {
							const nextIndex = currentHighlightedIndex < displayOptions.length - 1 
								? currentHighlightedIndex + 1 
								: 0
							setHighlightedIndex((prev) => ({
								...prev,
								[variable.id]: nextIndex,
							}))
							setShowSuggestions((prev) => ({
								...prev,
								[variable.id]: true,
							}))
						}
					} else if (e.key === 'ArrowUp') {
						e.preventDefault()
						if (displayOptions.length > 0) {
							const prevIndex = currentHighlightedIndex > 0 
								? currentHighlightedIndex - 1 
								: displayOptions.length - 1
							setHighlightedIndex((prev) => ({
								...prev,
								[variable.id]: prevIndex,
							}))
						}
					} else if (e.key === 'Escape') {
						setShowSuggestions((prev) => ({
							...prev,
							[variable.id]: false,
						}))
						setHighlightedIndex((prev) => ({
							...prev,
							[variable.id]: -1,
						}))
					} else if (e.key === 'Backspace' && !searchTerm && selectedValues.length > 0) {
						// Remove last selected item when backspace is pressed on empty input
						handleRemoveTech(selectedValues[selectedValues.length - 1])
					}
				}
				
				return (
					<div className="input-wrapper">
						<div className={`autocomplete-container ${hasError ? 'input-error' : ''} ${isValid ? 'input-valid' : ''} ${isFilled ? 'input-filled' : ''}`}>
							{selectedValues.length > 0 && (
								<div className="autocomplete-tags">
									{selectedValues.map((val) => (
										<span key={val} className="autocomplete-tag">
											{val}
											<button
												type="button"
												onClick={() => handleRemoveTech(val)}
												className="autocomplete-tag-remove"
												aria-label={`Remove ${val}`}
											>
												×
											</button>
										</span>
									))}
								</div>
							)}
							<div className="autocomplete-input-wrapper">
								<input
									type="text"
									id={variable.id}
									placeholder="Type to search technologies..."
									value={searchTerm}
									onChange={(e) => {
										const newValue = e.target.value
										setSearchTerms((prev) => ({
											...prev,
											[variable.id]: newValue,
										}))
										setShowSuggestions((prev) => ({
											...prev,
											[variable.id]: true,
										}))
										setHighlightedIndex((prev) => ({
											...prev,
											[variable.id]: -1,
										}))
									}}
									onFocus={() => {
										setShowSuggestions((prev) => ({
											...prev,
											[variable.id]: true,
										}))
									}}
									onBlur={() => {
										// Delay hiding suggestions to allow clicks
										setTimeout(() => {
											setShowSuggestions((prev) => ({
												...prev,
												[variable.id]: false,
											}))
										}, 200)
									}}
									onKeyDown={handleKeyDown}
									className={`autocomplete-input ${hasError ? 'input-error' : ''}`}
									aria-invalid={hasError}
									aria-describedby={hasError ? `${variable.id}-error` : undefined}
								/>
								{isSuggestionsVisible && displayOptions.length > 0 && (
									<ul className="autocomplete-suggestions">
										{displayOptions.map((option, index) => {
											const isCustomOption = option.startsWith('+ Add "')
											return (
												<li
													key={option}
													className={`autocomplete-suggestion ${
														index === currentHighlightedIndex ? 'highlighted' : ''
													} ${isCustomOption ? 'custom-option' : ''}`}
													onMouseDown={(e) => {
														e.preventDefault()
														handleAddTech(option)
													}}
													onMouseEnter={() => {
														setHighlightedIndex((prev) => ({
															...prev,
															[variable.id]: index,
														}))
													}}
												>
													{isCustomOption && <span className="custom-icon">✨</span>}
													{option}
												</li>
											)
										})}
									</ul>
								)}
								{isValid && (
									<div className="field-success">
										<span className="success-icon">✓</span>
									</div>
								)}
							</div>
						</div>
						{hasError && (
							<div id={`${variable.id}-error`} className="field-error" role="alert">
								<span className="error-icon">⚠️</span>
								<span>{error}</span>
							</div>
						)}
					</div>
				)
			case FieldType.TEXTAREA:
				return (
					<div className="input-wrapper">
						<textarea
							id={variable.id}
							value={value}
							onChange={(e) => handleInputChange(variable.id, e.target.value)}
							placeholder={variable.placeholder}
							required={variable.required}
							rows={4}
							className={`form-textarea ${hasError ? 'input-error' : ''} ${isValid ? 'input-valid' : ''} ${isFilled ? 'input-filled' : ''}`}
							aria-invalid={hasError}
							aria-describedby={hasError ? `${variable.id}-error` : undefined}
						/>
						{hasError && (
							<div id={`${variable.id}-error`} className="field-error" role="alert">
								<span className="error-icon">⚠️</span>
								<span>{error}</span>
							</div>
						)}
						{isValid && variable.fieldType === FieldType.TEXTAREA && (
							<div className="field-hint">
								<span className="char-count">{value.length} characters</span>
							</div>
						)}
					</div>
				)
			case FieldType.EMAIL:
				return (
					<div className="input-wrapper">
						<input
							type="email"
							id={variable.id}
							value={value}
							onChange={(e) => handleInputChange(variable.id, e.target.value)}
							placeholder={variable.placeholder}
							required={variable.required}
							autoComplete="email"
							className={`form-input ${hasError ? 'input-error' : ''} ${isValid ? 'input-valid' : ''} ${isFilled ? 'input-filled' : ''}`}
							aria-invalid={hasError}
							aria-describedby={hasError ? `${variable.id}-error` : undefined}
						/>
						{hasError && (
							<div id={`${variable.id}-error`} className="field-error" role="alert">
								<span className="error-icon">⚠️</span>
								<span>{error}</span>
							</div>
						)}
						{isValid && (
							<div className="field-success">
								<span className="success-icon">✓</span>
							</div>
						)}
					</div>
				)
			case FieldType.PHONE:
				return (
					<div className="input-wrapper">
						<input
							type="tel"
							id={variable.id}
							value={value}
							onChange={(e) => handleInputChange(variable.id, e.target.value)}
							placeholder={variable.placeholder}
							required={variable.required}
							autoComplete="tel"
							className={`form-input ${hasError ? 'input-error' : ''} ${isValid ? 'input-valid' : ''} ${isFilled ? 'input-filled' : ''}`}
							aria-invalid={hasError}
							aria-describedby={hasError ? `${variable.id}-error` : undefined}
						/>
						{hasError && (
							<div id={`${variable.id}-error`} className="field-error" role="alert">
								<span className="error-icon">⚠️</span>
								<span>{error}</span>
							</div>
						)}
						{isValid && (
							<div className="field-success">
								<span className="success-icon">✓</span>
							</div>
						)}
					</div>
				)
			case FieldType.DATE:
				return (
					<div className="input-wrapper">
						<input
							type="date"
							id={variable.id}
							value={value}
							onChange={(e) => handleInputChange(variable.id, e.target.value)}
							required={variable.required}
							className={`form-input ${hasError ? 'input-error' : ''} ${isValid ? 'input-valid' : ''} ${isFilled ? 'input-filled' : ''}`}
							aria-invalid={hasError}
							aria-describedby={hasError ? `${variable.id}-error` : undefined}
						/>
						{hasError && (
							<div id={`${variable.id}-error`} className="field-error" role="alert">
								<span className="error-icon">⚠️</span>
								<span>{error}</span>
							</div>
						)}
					</div>
				)
			case FieldType.NUMBER:
				return (
					<input
						type="number"
						id={variable.id}
						value={value}
						onChange={(e) => handleInputChange(variable.id, e.target.value)}
						placeholder={variable.placeholder}
						required={variable.required}
						className="form-input"
					/>
				)
			default:
				return (
					<div className="input-wrapper">
						<input
							type="text"
							id={variable.id}
							value={value}
							onChange={(e) => handleInputChange(variable.id, e.target.value)}
							placeholder={variable.placeholder}
							required={variable.required}
							autoComplete={variable.id === 'fullName' ? 'name' : variable.id === 'companyName' ? 'organization' : 'off'}
							className={`form-input ${hasError ? 'input-error' : ''} ${isValid ? 'input-valid' : ''} ${isFilled ? 'input-filled' : ''}`}
							aria-invalid={hasError}
							aria-describedby={hasError ? `${variable.id}-error` : undefined}
						/>
						{hasError && (
							<div id={`${variable.id}-error`} className="field-error" role="alert">
								<span className="error-icon">⚠️</span>
								<span>{error}</span>
							</div>
						)}
						{isValid && (
							<div className="field-success">
								<span className="success-icon">✓</span>
							</div>
						)}
					</div>
				)
		}
	}

	return (
		<div className="cover-letter-page">
			<header className="cover-letter-header">
				<div className="header-title-section">
					<h1>
						<span className="title-main">Letter</span>
						<span className="title-accent">Craft</span>
					</h1>
					<p className="header-tagline">Craft professional cover letters with ease</p>
				</div>
				<div className="header-actions">
					<button
						onClick={() => setShowSettings(!showSettings)}
						className="btn btn-settings"
						aria-label="Settings"
					>
						<span>⚙️</span>
						<span>Settings</span>
					</button>
				</div>
			</header>

			{showSettings && (
				<div className="settings-panel">
					<h3>Default Information</h3>
					<p className="settings-description">
						Configure your default name, email, phone, tech stack, and e-signature. These will be used to pre-fill forms and add to your cover letters.
					</p>
					<div className="settings-form">
						<div className="form-group">
							<label htmlFor="settings-fullName" className="form-label">
								Full Name
							</label>
							<input
								type="text"
								id="settings-fullName"
								value={settingsValues.fullName}
								onChange={(e) =>
									setSettingsValues((prev) => ({
										...prev,
										fullName: e.target.value,
									}))
								}
								className="form-input"
								placeholder="Enter your full name"
							/>
						</div>
						<div className="form-group">
							<label htmlFor="settings-email" className="form-label">
								Email
							</label>
							<input
								type="email"
								id="settings-email"
								value={settingsValues.email}
								onChange={(e) =>
									setSettingsValues((prev) => ({
										...prev,
										email: e.target.value,
									}))
								}
								className="form-input"
								placeholder="Enter your email"
							/>
						</div>
						<div className="form-group">
							<label htmlFor="settings-phone" className="form-label">
								Phone
							</label>
							<input
								type="tel"
								id="settings-phone"
								value={settingsValues.phone}
								onChange={(e) =>
									setSettingsValues((prev) => ({
										...prev,
										phone: e.target.value,
									}))
								}
								className="form-input"
								placeholder="Enter your phone number"
							/>
						</div>
						<div className="form-group">
							<label htmlFor="settings-techStack" className="form-label">
								Tech Stack (comma-separated)
							</label>
							<textarea
								id="settings-techStack"
								value={settingsValues.techStack}
								onChange={(e) =>
									setSettingsValues((prev) => ({
										...prev,
										techStack: e.target.value,
									}))
								}
								className="form-textarea"
								placeholder="e.g., React, TypeScript, Node.js"
								rows={3}
							/>
							<p className="field-hint" style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#9d9588' }}>
								Enter your commonly used technologies separated by commas. This will be pre-filled in forms.
							</p>
						</div>
						<div className="form-group">
							<SignaturePad
								onSignatureChange={handleSignatureChange}
								initialSignature={signature}
							/>
						</div>
						<div className="settings-actions">
							<button 
								onClick={handleResetSettings} 
								className="btn btn-reset"
								type="button"
							>
								<span>🗑️</span>
								<span>Reset All</span>
							</button>
							<div className="settings-actions-right">
								<button onClick={handleCancelSettings} className="btn btn-secondary">
									Cancel
								</button>
								<button onClick={handleSaveSettings} className="btn btn-primary">
									Save Defaults
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			<div className="template-selector-section">
				<label htmlFor="template-select" className="template-selector-label">
					Select Template:
				</label>
				<select
					id="template-select"
					value={activeTemplateId || ''}
					onChange={(e) => handleTemplateChange(e.target.value)}
					className="template-selector"
				>
					{templates.map((template) => (
						<option key={template.id} value={template.id}>
							{template.name}
						</option>
					))}
				</select>
			</div>

			{missingRequiredFields.length > 0 && (
				<div className="missing-fields-alert">
					<span className="alert-icon">⚠️</span>
					<div className="alert-content">
						<strong>Missing required fields:</strong>
						<span>{missingRequiredFields.join(', ')}</span>
					</div>
				</div>
			)}

			<div className="cover-letter-container">
				<div className="form-section">
					<div className="form-header">
						<h2>
							<span>✍️</span>
							<span>Fill in the Details</span>
						</h2>
						<div className="form-progress">
							<div className="progress-bar">
								<div 
									className="progress-fill" 
									style={{ width: `${formCompletion}%` }}
									role="progressbar"
									aria-valuenow={formCompletion}
									aria-valuemin={0}
									aria-valuemax={100}
								></div>
							</div>
							<span className="progress-text">{formCompletion}% complete</span>
						</div>
					</div>
					<form className="cover-letter-form">
						{/* Application Details Section */}
						{groupedVariables.applicationDetails.filter(v => 
							// Show techStack if no default, or if it's in visible fields
							v.id !== 'techStack' || !details.techStack?.trim() || groupedVariables.visible.includes(v)
						).length > 0 && (
							<div className="form-field-group">
								<h3 className="field-group-title">Application Details</h3>
								{groupedVariables.applicationDetails
									.filter(v => groupedVariables.visible.includes(v))
									.map((variable) => (
										<div key={variable.id} className="form-group">
											<label htmlFor={variable.id} className="form-label">
												{variable.label}
												{variable.required && <span className="required">*</span>}
											</label>
											{renderInput(variable)}
										</div>
									))}
							</div>
						)}
						
						{/* Template-Specific Fields Section */}
						{groupedVariables.templateSpecific.length > 0 && (
							<div className="form-field-group">
								<h3 className="field-group-title">Additional Information</h3>
								{groupedVariables.templateSpecific.map((variable) => (
									<div key={variable.id} className="form-group">
										<label htmlFor={variable.id} className="form-label">
											{variable.label}
											{variable.required && <span className="required">*</span>}
										</label>
										{renderInput(variable)}
									</div>
								))}
							</div>
						)}
						
						{/* Personal Info Fields (only show if no defaults) */}
						{groupedVariables.personalInfo.filter(v => 
							!details[v.id as keyof typeof details]?.trim()
						).length > 0 && (
							<div className="form-field-group">
								<h3 className="field-group-title">Personal Information</h3>
								<p className="field-group-hint">
									Configure these in Settings to auto-fill for future applications.
								</p>
								{groupedVariables.personalInfo
									.filter(v => !details[v.id as keyof typeof details]?.trim())
									.map((variable) => (
										<div key={variable.id} className="form-group">
											<label htmlFor={variable.id} className="form-label">
												{variable.label}
												{variable.required && <span className="required">*</span>}
											</label>
											{renderInput(variable)}
										</div>
									))}
							</div>
						)}
					</form>
				</div>

				<div className="preview-section">
					<div className="preview-header">
						<h2>
							<span>👁️</span>
							<span>Preview</span>
						</h2>
						<div className="preview-actions">
							<button
								onClick={handleCopyToClipboard}
								disabled={!isFormValid}
								className="btn btn-copy"
								title={isFormValid ? 'Copy to clipboard' : 'Fill in all required fields first'}
							>
								<span>📋</span>
								<span>Copy to Clipboard</span>
							</button>
							<div className="export-dropdown" ref={exportDropdownRef} data-open={showExportDropdown}>
								<button
									onClick={handleExportPDF}
									disabled={!isFormValid}
									className="btn btn-primary btn-export-main"
									title={isFormValid ? 'Export as PDF' : 'Fill in all required fields first'}
								>
									<span>📥</span>
									<span>Export</span>
								</button>
								<button
									onClick={(e) => {
										e.stopPropagation()
										if (isFormValid) {
											setShowExportDropdown(!showExportDropdown)
										}
									}}
									onMouseDown={(e) => e.stopPropagation()}
									disabled={!isFormValid}
									className="btn btn-primary btn-export-toggle"
									aria-label="Toggle export options"
									title={isFormValid ? 'More export options' : 'Fill in all required fields first'}
									aria-expanded={showExportDropdown}
								>
									<span>▼</span>
								</button>
								{showExportDropdown && (
									<div 
										className="export-dropdown-menu"
										onMouseDown={(e) => e.stopPropagation()}
									>
										<button
											onClick={(e) => {
												e.stopPropagation()
												handleExportPDF()
											}}
											disabled={!isFormValid}
											className="export-dropdown-item"
										>
											<span>📥</span>
											<span>Export as PDF</span>
										</button>
										<button
											onClick={(e) => {
												e.stopPropagation()
												handleExportText()
											}}
											disabled={!isFormValid}
											className="export-dropdown-item"
										>
											<span>📄</span>
											<span>Export as Text</span>
										</button>
										<button
											onClick={(e) => {
												e.stopPropagation()
												handleExportMarkdownPDF()
											}}
											disabled={!isFormValid}
											className="export-dropdown-item"
										>
											<span>📝</span>
											<span>Export as Markdown PDF</span>
										</button>
									</div>
								)}
							</div>
						</div>
					</div>
					<div className="preview-content">
						<pre className="preview-text">{processedContent}</pre>
					</div>
				</div>
			</div>

			<footer className="page-footer">
				<p className="footer-text">
					Created by{' '}
					<a
						href="https://kmavillanosa.github.io/kmavillanosa"
						target="_blank"
						rel="noopener noreferrer"
						className="footer-link"
					>
						Kim Cyriel S. Avillanosa
					</a>
				</p>
			</footer>
		</div>
	)
}
