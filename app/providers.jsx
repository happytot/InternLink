'use client'

import { ThemeProvider } from 'next-themes'

export function Providers({ children }) {
  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="dark" 
      enableSystem={false}
      value={{
        dark: 'dark-mode',  // This maps next-themes 'dark' to nothing (default) or 'dark'
        light: 'light-mode' // This maps next-themes 'light' to your .light-mode class
      }}
    >
      {children}
    </ThemeProvider>
  )
}