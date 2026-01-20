import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { type TemplateVariable, FieldType } from '../../types'
import { TECH_STACK_OPTIONS } from '../../constants/tech-stack-options'

interface TemplateVariablesState {
	variables: TemplateVariable[]
}

const initialState: TemplateVariablesState = {
	variables: [
		{
			id: 'fullName',
			name: 'fullName',
			label: 'Full Name',
			fieldType: FieldType.TEXT,
			required: true,
		},
		{
			id: 'email',
			name: 'email',
			label: 'Email',
			fieldType: FieldType.EMAIL,
			required: true,
		},
		{
			id: 'phone',
			name: 'phone',
			label: 'Phone',
			fieldType: FieldType.PHONE,
		},
		{
			id: 'companyName',
			name: 'companyName',
			label: 'Company Name',
			fieldType: FieldType.TEXT,
			required: true,
		},
		{
			id: 'techStack',
			name: 'techStack',
			label: 'Relevant Tech Stack',
			fieldType: FieldType.MULTISELECT,
			options: TECH_STACK_OPTIONS,
		},
		{
			id: 'position',
			name: 'position',
			label: 'Position Applied For',
			fieldType: FieldType.TEXT,
			required: true,
		},
		{
			id: 'date',
			name: 'date',
			label: 'Date',
			fieldType: FieldType.DATE,
		},
	],
}

const templateVariablesSlice = createSlice({
	name: 'templateVariables',
	initialState,
	reducers: {
		addVariable: (state, action: PayloadAction<TemplateVariable>) => {
			state.variables.push(action.payload)
		},
		updateVariable: (
			state,
			action: PayloadAction<{ id: string; variable: Partial<TemplateVariable> }>
		) => {
			const index = state.variables.findIndex(
				(v) => v.id === action.payload.id
			)
			if (index !== -1) {
				state.variables[index] = {
					...state.variables[index],
					...action.payload.variable,
				}
			}
		},
		removeVariable: (state, action: PayloadAction<string>) => {
			state.variables = state.variables.filter((v) => v.id !== action.payload)
		},
	},
})

export const { addVariable, updateVariable, removeVariable } =
	templateVariablesSlice.actions
export default templateVariablesSlice.reducer
