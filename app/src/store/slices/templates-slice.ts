import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { type Template } from '../../types'

interface TemplatesState {
	templates: Template[]
	activeTemplateId: string | null
}

const initialState: TemplatesState = {
	templates: [
		{
			id: 'regular',
			name: 'Regular Job Application',
			content: `Dear Hiring Manager,

I am writing to express my strong interest in the {{position}} position at {{companyName}}. With my background and experience{{techStack}}, I am confident that I would be a valuable addition to your team.

I am excited about the opportunity to contribute to {{companyName}} and would welcome the chance to discuss how my skills and experience align with your needs.

Thank you for considering my application.

Sincerely,
{{fullName}}
{{email}}
{{phone}}`,
			variables: [
				'fullName',
				'email',
				'phone',
				'companyName',
				'position',
				'techStack',
			],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		},
		{
			id: 'regular-with-resume',
			name: 'Regular Job Application (with Resume)',
			content: `Dear Hiring Manager,

I am writing to express my strong interest in the {{position}} position at {{companyName}}. With my background and experience{{techStack}}, I am confident that I would be a valuable addition to your team.

I have attached my resume for your review, which provides further details about my qualifications and achievements. I am excited about the opportunity to contribute to {{companyName}} and would welcome the chance to discuss how my skills and experience align with your needs.

Thank you for considering my application.

Sincerely,
{{fullName}}
{{email}}
{{phone}}`,
			variables: [
				'fullName',
				'email',
				'phone',
				'companyName',
				'position',
				'techStack',
			],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		},
		{
			id: 'upwork',
			name: 'Upwork Proposal',
			content: `Hi there,

I came across your job posting for {{position}} and I'm excited to submit my proposal. I believe my skills and experience{{techStack}} make me an ideal candidate for this project.

I am confident that I can deliver high-quality results and would love to discuss how I can help you achieve your goals.

Thank you for your consideration.

Best regards,
{{fullName}}
{{email}}
{{phone}}`,
			variables: [
				'fullName',
				'email',
				'phone',
				'position',
				'techStack',
			],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		},
	],
	activeTemplateId: 'regular',
}

const templatesSlice = createSlice({
	name: 'templates',
	initialState,
	reducers: {
		addTemplate: (state, action: PayloadAction<Template>) => {
			state.templates.push(action.payload)
		},
		updateTemplate: (
			state,
			action: PayloadAction<{ id: string; template: Partial<Template> }>
		) => {
			const index = state.templates.findIndex(
				(t) => t.id === action.payload.id
			)
			if (index !== -1) {
				state.templates[index] = {
					...state.templates[index],
					...action.payload.template,
					updatedAt: new Date().toISOString(),
				}
			}
		},
		removeTemplate: (state, action: PayloadAction<string>) => {
			state.templates = state.templates.filter(
				(t) => t.id !== action.payload
			)
			if (state.activeTemplateId === action.payload) {
				state.activeTemplateId =
					state.templates.length > 0 ? state.templates[0].id : null
			}
		},
		setActiveTemplate: (state, action: PayloadAction<string>) => {
			state.activeTemplateId = action.payload
		},
	},
})

export const { addTemplate, updateTemplate, removeTemplate, setActiveTemplate } =
	templatesSlice.actions
export default templatesSlice.reducer
