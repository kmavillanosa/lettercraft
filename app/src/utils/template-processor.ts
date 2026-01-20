import { type TemplateVariable } from '../types'

/**
 * Processes a template string by replacing variables with their values
 */
export function processTemplate(
	template: string,
	variables: TemplateVariable[],
	values: Record<string, string>
): string {
	let processed = template

	variables.forEach((variable) => {
		const value = values[variable.id] || variable.defaultValue || ''
		const regex = new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g')
		
		// Special handling for techStack - format it nicely when present
		if (variable.id === 'techStack' && value.trim()) {
			const formattedValue = `, particularly in ${value.trim()}`
			processed = processed.replace(regex, formattedValue)
		} else if (variable.id === 'techStack' && !value.trim()) {
			// Remove the placeholder if techStack is empty
			processed = processed.replace(regex, '')
		} else {
			processed = processed.replace(regex, value)
		}
	})

	return processed
}

/**
 * Extracts variable names from template content
 */
export function extractVariables(template: string): string[] {
	const regex = /\{\{(\w+)\}\}/g
	const matches = template.matchAll(regex)
	const variables = new Set<string>()

	for (const match of matches) {
		variables.add(match[1])
	}

	return Array.from(variables)
}
