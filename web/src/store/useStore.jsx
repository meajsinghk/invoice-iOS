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
  stampImageUrl: '/stamp.png',
}

const initialState = {
  clients: [],
  operators: [],
  workRates: [],
  invoices: [],
  ledgerEntries: [],
  companyProfile: defaultCompanyProfile,
}

function reducer(state, action) {
  switch (action.type) {
    // LOAD merges DB data while preserving keys not returned by DB (e.g. pdfBase64 from localStorage)
    case 'LOAD': {
      const incoming = action.payload

      // Union-merge by ID: keep ALL local entries, override with DB version if it exists.
      // This prevents DB returning an empty/partial list from wiping local-only data.
      function mergeById(localArr, incomingArr) {
        if (!incomingArr || incomingArr.length === 0) return localArr || []
        const dbMap = {}
        incomingArr.forEach(item => { dbMap[item.id] = item })
        const localMap = {}
        ;(localArr || []).forEach(item => { localMap[item.id] = item })
        // Union of all IDs, DB wins for conflicts
        const allIds = new Set([...(localArr || []).map(i => i.id), ...incomingArr.map(i => i.id)])
        return Array.from(allIds).map(id => dbMap[id] || localMap[id])
      }

      const localInvoiceMap = {}
      ;(state.invoices || []).forEach(i => { localInvoiceMap[i.id] = i })
      const mergedInvoices = mergeById(state.invoices, incoming.invoices).map(inv => ({
        ...inv,
        // Always preserve pdfBase64 from local cache if DB doesn't have it
        pdfBase64: inv.pdfBase64 || (localInvoiceMap[inv.id] && localInvoiceMap[inv.id].pdfBase64) || null,
      }))

      return {
        ...state,
        clients: mergeById(state.clients, incoming.clients),
        operators: mergeById(state.operators, incoming.operators),
        workRates: mergeById(state.workRates, incoming.workRates),
        invoices: mergedInvoices,
        ledgerEntries: mergeById(state.ledgerEntries, incoming.ledgerEntries),
        companyProfile: incoming.companyProfile
          ? {
              ...defaultCompanyProfile,
              ...incoming.companyProfile,
              // Always preserve stampImageUrl — DB rows saved before this field was added may have null
              stampImageUrl: incoming.companyProfile.stampImageUrl || defaultCompanyProfile.stampImageUrl,
            }
          : state.companyProfile,
      }
    }

    case 'ADD_CLIENT':
      return { ...state, clients: [...state.clients, action.payload] }
    case 'UPDATE_CLIENT':
      return { ...state, clients: state.clients.map(c => c.id === action.payload.id ? action.payload : c) }
    case 'DELETE_CLIENT':
      return { ...state, clients: state.clients.filter(c => c.id !== action.payload) }

    case 'ADD_OPERATOR':
      return { ...state, operators: [...(state.operators || []), action.payload] }
    case 'UPDATE_OPERATOR':
      return { ...state, operators: (state.operators || []).map(o => o.id === action.payload.id ? action.payload : o) }
    case 'DELETE_OPERATOR':
      return { ...state, operators: (state.operators || []).filter(o => o.id !== action.payload) }

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

    case 'ADD_LEDGER_ENTRY':
      return { ...state, ledgerEntries: [action.payload, ...(state.ledgerEntries || [])] }
    case 'UPDATE_LEDGER_ENTRY':
      return { ...state, ledgerEntries: (state.ledgerEntries || []).map(e => e.id === action.payload.id ? action.payload : e) }
    case 'DELETE_LEDGER_ENTRY':
      return { ...state, ledgerEntries: (state.ledgerEntries || []).filter(e => e.id !== action.payload) }

    case 'UPDATE_COMPANY_PROFILE':
      return { ...state, companyProfile: { ...state.companyProfile, ...action.payload } }

    default: return state
  }
}

const StoreContext = createContext(null)

function syncActionToRemote(action, priorState) {
  switch (action.type) {
    case 'ADD_CLIENT':
    case 'UPDATE_CLIENT':
      return api.saveClient(action.payload)
    case 'DELETE_CLIENT':
      return api.deleteClient(action.payload)

    case 'ADD_OPERATOR':
    case 'UPDATE_OPERATOR':
      return api.saveOperator(action.payload)
    case 'DELETE_OPERATOR':
      return api.deleteOperator(action.payload)

    case 'ADD_WORK_RATE':
    case 'UPDATE_WORK_RATE':
      return api.saveWorkRate(action.payload)
    case 'DELETE_WORK_RATE':
      return api.deleteWorkRate(action.payload)

    case 'ADD_INVOICE':
      return api.saveInvoice(action.payload)
    case 'UPDATE_INVOICE': {
      // Send only metadata (no pdfBase64) so status updates don't hit Vercel's 4.5MB body limit
      const { pdfBase64, ...meta } = action.payload
      return api.saveInvoice({ ...meta, _metaOnly: true })
    }
    case 'DELETE_INVOICE':
      return api.deleteInvoice(action.payload)

    case 'ADD_LEDGER_ENTRY':
    case 'UPDATE_LEDGER_ENTRY':
      return api.saveLedgerEntry(action.payload)
    case 'DELETE_LEDGER_ENTRY':
      return api.deleteLedgerEntry(action.payload)

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
    ;(async () => {
      try {
        const [clients, operators, workRates, invoices, ledgerEntries, companyProfile] = await Promise.all([
          api.fetchClients(),
          api.fetchOperators(),
          api.fetchWorkRates(),
          api.fetchInvoices(),
          api.fetchLedgerEntries(),
          api.fetchCompanyProfile(),
        ])
        setDbConnected(true)
        dispatch({
          type: 'LOAD',
          payload: {
            clients,
            operators,
            workRates,
            invoices,
            ledgerEntries,
            companyProfile: companyProfile || defaultCompanyProfile,
          },
        })
      } catch (err) {
        setDbConnected(false)
        console.warn('[SimpleInvoice] Remote DB unavailable, using localStorage only:', err.message)
      }
    })()
  }, [])

  // Always mirror state to localStorage as a backup.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {}
  }, [state])

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
