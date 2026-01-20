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
	const url = new URL(window.location.href)
	
	// Clear existing params or merge
	if (replace) {
		url.search = ''
	}
	
	Object.entries(params).forEach(([key, value]) => {
		if (value && value.trim()) {
			url.searchParams.set(key, encodeURIComponent(value.trim()))
		} else {
			url.searchParams.delete(key)
		}
	})
	
	const newUrl = url.toString()
	if (replace) {
		window.history.replaceState({}, '', newUrl)
	} else {
		window.history.pushState({}, '', newUrl)
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
