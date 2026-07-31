import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// --vh trick: gives every viewport the REAL inner height so iOS Safari toolbar
// doesn't crop the app. Update on resize and orientation change.
function updateVH() {
  document.documentElement.style.setProperty('--vh', (window.innerHeight * 0.01) + 'px')
}
updateVH()
window.addEventListener('resize', updateVH)
window.addEventListener('orientationchange', () => setTimeout(updateVH, 200))

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
