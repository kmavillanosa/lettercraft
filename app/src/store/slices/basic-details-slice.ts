import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { type BasicDetails } from '../../types'
import { loadDefaults } from '../../utils/local-storage'

// Load defaults from localStorage on initialization
const savedDefaults = loadDefaults()

interface BasicDetailsState {
	details: BasicDetails
}

const initialState: BasicDetailsState = {
	details: {
		fullName: savedDefaults.fullName,
		email: savedDefaults.email,
		phone: savedDefaults.phone,
		address: '',
		city: '',
		state: '',
		zipCode: '',
		country: '',
		linkedIn: '',
		portfolio: '',
	},
}

const basicDetailsSlice = createSlice({
	name: 'basicDetails',
	initialState,
	reducers: {
		updateDetails: (state, action: PayloadAction<Partial<BasicDetails>>) => {
			state.details = {
				...state.details,
				...action.payload,
			}
		},
		resetDetails: (state) => {
			state.details = initialState.details
		},
	},
})

export const { updateDetails, resetDetails } = basicDetailsSlice.actions
export default basicDetailsSlice.reducer
