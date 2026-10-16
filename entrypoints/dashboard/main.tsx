import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { LOCALE } from '../../lib/i18n'
import { App } from './App'
import './style.css'

const rootElement = document.getElementById('root')

document.documentElement.lang = LOCALE

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
