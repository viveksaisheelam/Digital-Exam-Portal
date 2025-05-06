import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Signin from './Signin'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Signin/>
  </StrictMode>,
)
