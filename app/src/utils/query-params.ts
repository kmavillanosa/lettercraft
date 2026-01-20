/**
 * Utility functions for handling URL query parameters
 */

/**
 * Parse query parameters from the current URL
 */
export function getQueryParams(): Record<string, string> {
	const params = new URLSearchParams(window.location.search)
	const result: Record<string, string> = {}
	
	params.forEach((value, key) => {
		result[key] = decodeURIComponent(value)
	})
	
	return result
}

/**
 * Build a URL with query parameters
 */
export function buildUrlWithParams(baseUrl: string, params: Record<string, string>): string {
	const url = new URL(baseUrl, window.location.origin)
	
	Object.entries(params).forEach(([key, value]) => {
		if (value && value.trim()) {
			url.searchParams.set(key, encodeURIComponent(value.trim()))
		}
	})
	
	return url.toString()
}

/**
 * Update the URL with query parameters without reloading the page
 */
export function updateUrlParams(params: Record<string, string>, replace: boolean = true): void {
	try {
		const url = new URL(window.location.href)
		
		// Clear existing params or merge
		if (replace) {
			url.search = ''
		}
		
		// Only add non-empty values to reduce URL size
		Object.entries(params).forEach(([key, value]) => {
			if (value && value.trim()) {
				// Limit value length to prevent extremely long URLs
				const trimmedValue = value.trim()
				if (trimmedValue.length <= 200) {
					url.searchParams.set(key, encodeURIComponent(trimmedValue))
				}
			} else {
				url.searchParams.delete(key)
			}
		})
		
		const newUrl = url.toString()
		// Only update if URL actually changed to avoid unnecessary history updates
		if (newUrl !== window.location.href) {
			if (replace) {
				window.history.replaceState({}, '', newUrl)
			} else {
				window.history.pushState({}, '', newUrl)
			}
		}
	} catch (error) {
		// Silently fail if URL update causes issues (e.g., URL too long)
		console.warn('Failed to update URL params:', error)
	}
}

/**
 * Get a shareable URL with current form values
 */
export function getShareableUrl(formValues: Record<string, string>, templateId?: string): string {
	const params: Record<string, string> = { ...formValues }
	if (templateId) {
		params.template = templateId
	}
	return buildUrlWithParams(window.location.pathname, params)
}
