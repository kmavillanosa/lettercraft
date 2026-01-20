/**
 * Utility functions for localStorage operations
 */

const STORAGE_KEY = 'cover-letter-defaults'

export interface DefaultsConfig {
	fullName: string
	email: string
	phone: string
}

/**
 * Load defaults from localStorage
 */
export function loadDefaults(): DefaultsConfig {
	try {
		const stored = localStorage.getItem(STORAGE_KEY)
		if (stored) {
			return JSON.parse(stored)
		}
	} catch (err) {
		console.error('Failed to load defaults from localStorage:', err)
	}
	
	return {
		fullName: '',
		email: '',
		phone: '',
	}
}

/**
 * Save defaults to localStorage
 */
export function saveDefaults(defaults: DefaultsConfig): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults))
	} catch (err) {
		console.error('Failed to save defaults to localStorage:', err)
	}
}
