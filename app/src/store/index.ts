import { configureStore } from '@reduxjs/toolkit'
import templateVariablesReducer from './slices/template-variables-slice'
import templatesReducer from './slices/templates-slice'
import basicDetailsReducer from './slices/basic-details-slice'

export const store = configureStore({
	reducer: {
		templateVariables: templateVariablesReducer,
		templates: templatesReducer,
		basicDetails: basicDetailsReducer,
	},
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
