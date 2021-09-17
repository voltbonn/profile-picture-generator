import React, { useState, useEffect, useCallback } from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import reportWebVitals from './reportWebVitals'

import 'intl-pluralrules'
import { AppLocalizationProvider, locales } from './l10n.js'

function AppLanguageWrapper() {
  const [userLocales, setUserLocales] = useState(navigator.languages)
  const [currentLocale, setCurrentLocale] = useState(null)

  useEffect(() => {
    let systemLocales = navigator.languages
    if (window.umami && (!!systemLocales || Array.isArray(systemLocales))) {
      for (const locale of systemLocales) {
        window.umami.trackEvent('L: ' + locale) // Log Locale / Languages
      }
    }
  }, [])

  const handleLanguageChange = useCallback(event => {
    setUserLocales([event.target.dataset.locale])
  }, [setUserLocales])

  const handleCurrentLocalesChange = useCallback(currentLocales => {
    setCurrentLocale(currentLocales.length > 0 ? currentLocales[0] : '')
  }, [setCurrentLocale])

  return <AppLocalizationProvider
    key="AppLocalizationProvider"
    userLocales={userLocales}
    onLocaleChange={handleCurrentLocalesChange}
  >
    <App locales={locales} currentLocale={currentLocale} onLanguageChange={handleLanguageChange} />
  </AppLocalizationProvider>
}


ReactDOM.render(
  <React.StrictMode>
    <AppLanguageWrapper />
  </React.StrictMode>,
  document.getElementById('root')
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
