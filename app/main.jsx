// src/main.jsx (FINAL CORRECT VERSION)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css' // Global styles import
import App from './App.jsx'
// 🌟 Import AuthProvider without curly braces
import AuthProvider from './context/AuthContext'; 

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)