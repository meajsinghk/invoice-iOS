import React, { createContext, useContext, useReducer, useEffect } from 'react'

const STORAGE_KEY = 'simpleinvoice_data'

const defaultCompanyProfile = {
  companyName: 'MILAN CONSTRUCTION',
  businessTagline: 'WORK CONTRACTOR & CIVIL CONTRACTOR',
  businessServices: 'ALL TYPES OF EARTH WORK & CIVIL MAINTENANCE WORKS',
  addressLine1: 'Manpura, Village Jalalpur',
  addressLine2: 'Morena Road Gwalior, Madhya Pradesh, India 474010',
  companyGSTIN: '23AWKPV3941M1ZY',
  companyPAN: 'AWKP3941M',
  companyPhone: '+917770855666',
  bankNameAndBranch: 'HDFC BANK GWALIOR',
  bankAccountNo: '50200048493635',
  bankIFSCCode: 'HDFC0003707',
  termsAndConditions: [
    'Certified that the particulars given above are true and correct.',
    'E.&O.E.',
    'Subject to Gwalior jurisdiction only.',
    'Goods once sold will not be taken back.',
  ],
  authorizedSignatoryName: 'Milandeep Virk',
}

const initialState = {
  clients: [],
  workRates: [],
  invoices: [],
  companyProfile: defaultCompanyProfile,
}

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD': return action.payload

    case 'ADD_CLIENT':
      return { ...state, clients: [...state.clients, action.payload] }
    case 'UPDATE_CLIENT':
      return { ...state, clients: state.clients.map(c => c.id === action.payload.id ? action.payload : c) }
    case 'DELETE_CLIENT':
      return { ...state, clients: state.clients.filter(c => c.id !== action.payload) }

    case 'ADD_WORK_RATE':
      return { ...state, workRates: [...state.workRates, action.payload] }
    case 'UPDATE_WORK_RATE':
      return { ...state, workRates: state.workRates.map(r => r.id === action.payload.id ? action.payload : r) }
    case 'DELETE_WORK_RATE':
      return { ...state, workRates: state.workRates.filter(r => r.id !== action.payload) }

    case 'ADD_INVOICE':
      return { ...state, invoices: [action.payload, ...state.invoices] }
    case 'UPDATE_INVOICE':
      return { ...state, invoices: state.invoices.map(i => i.id === action.payload.id ? action.payload : i) }
    case 'DELETE_INVOICE':
      return { ...state, invoices: state.invoices.filter(i => i.id !== action.payload) }

    case 'UPDATE_COMPANY_PROFILE':
      return { ...state, companyProfile: { ...state.companyProfile, ...action.payload } }

    default: return state
  }
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) dispatch({ type: 'LOAD', payload: JSON.parse(saved) })
    } catch {}
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>
}

export function useStore() {
  return useContext(StoreContext)
}

export function uuid() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36)
}
