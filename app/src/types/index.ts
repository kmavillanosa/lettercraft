/**
 * Field types for template variables
 */
export const FieldType = {
	TEXT: 'text',
	EMAIL: 'email',
	PHONE: 'phone',
	DATE: 'date',
	NUMBER: 'number',
	TEXTAREA: 'textarea',
	MULTISELECT: 'multiselect',
} as const

export type FieldType = (typeof FieldType)[keyof typeof FieldType]

/**
 * Template variable definition
 */
export interface TemplateVariable {
	id: string
	name: string
	label: string
	fieldType: FieldType
	placeholder?: string
	required?: boolean
	defaultValue?: string
	options?: string[] // For multiselect and select fields
}

/**
 * Template for cover letter content
 */
export interface Template {
	id: string
	name: string
	content: string
	variables: string[] // Array of variable IDs used in this template
	createdAt: string
	updatedAt: string
}

/**
 * Basic details store for default values
 */
export interface BasicDetails {
	fullName: string
	email: string
	phone: string
	address: string
	city: string
	state: string
	zipCode: string
	country: string
	linkedIn?: string
	portfolio?: string
}
