import React, { createContext, useContext, useReducer, useEffect, useState } from 'react'
import { api } from '../utils/api'

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

// Maps a reducer action to the matching background sync call to the
// Postgres-backed API. Errors are swallowed by the caller — localStorage
// always remains the source of truth for offline/DB-unavailable use.
function syncActionToRemote(action, priorState) {
  switch (action.type) {
    case 'ADD_CLIENT':
    case 'UPDATE_CLIENT':
      return api.saveClient(action.payload)
    case 'DELETE_CLIENT':
      return api.deleteClient(action.payload)

    case 'ADD_WORK_RATE':
    case 'UPDATE_WORK_RATE':
      return api.saveWorkRate(action.payload)
    case 'DELETE_WORK_RATE':
      return api.deleteWorkRate(action.payload)

    case 'ADD_INVOICE':
    case 'UPDATE_INVOICE':
      return api.saveInvoice(action.payload)
    case 'DELETE_INVOICE':
      return api.deleteInvoice(action.payload)

    case 'UPDATE_COMPANY_PROFILE':
      return api.saveCompanyProfile({ ...priorState.companyProfile, ...action.payload })

    default:
      return null
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [dbConnected, setDbConnected] = useState(false)

  // 1. Load instantly from localStorage (works fully offline).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) dispatch({ type: 'LOAD', payload: JSON.parse(saved) })
    } catch {}

    // 2. Then try the remote Postgres-backed API in the background.
    //    If it's reachable, treat it as the source of truth and mirror
    //    it into localStorage as a backup. If not configured / offline,
    //    fail silently and keep using localStorage only.
    ;(async () => {
      try {
        const [clients, workRates, invoices, companyProfile] = await Promise.all([
          api.fetchClients(), api.fetchWorkRates(), api.fetchInvoices(), api.fetchCompanyProfile(),
        ])
        setDbConnected(true)
        dispatch({
          type: 'LOAD',
          payload: {
            clients, workRates, invoices,
            companyProfile: companyProfile || defaultCompanyProfile,
          },
        })
      } catch (err) {
        setDbConnected(false)
        console.warn('[SimpleInvoice] Remote DB unavailable, using localStorage only:', err.message)
      }
    })()
  }, [])

  // Always mirror state to localStorage as a backup, regardless of DB status.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {}
  }, [state])

  // Wrapped dispatch: applies the local reducer update immediately, then
  // fires a background sync to the remote DB (best-effort, non-blocking).
  function syncedDispatch(action) {
    dispatch(action)
    const remoteCall = syncActionToRemote(action, state)
    if (remoteCall) {
      remoteCall
        .then(() => setDbConnected(true))
        .catch(err => {
          setDbConnected(false)
          console.warn('[SimpleInvoice] Remote sync failed, change kept in localStorage:', err.message)
        })
    }
  }

  return (
    <StoreContext.Provider value={{ state, dispatch: syncedDispatch, dbConnected }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  return useContext(StoreContext)
}

export function uuid() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36)
}
