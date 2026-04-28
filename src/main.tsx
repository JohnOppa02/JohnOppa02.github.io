import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Newui from './components/Component1/New_ui_main.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Newui />
  </StrictMode>,
)
