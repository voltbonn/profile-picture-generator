import React, { useEffect, useState } from 'react'

// https://projectfluent.org/play/

// import {LocalizationProvider,Localized} from '@fluent/react' // '@fluent/react/compat'
import { ReactLocalization, LocalizationProvider } from '@fluent/react'
import { FluentBundle, FluentResource } from '@fluent/bundle'
import { negotiateLanguages } from '@fluent/langneg'


export const locales = {
    de: 'Deutsch',
    en: 'English',
    es: 'Español',
    pt: 'Português',
    fr: 'Français',
    it: 'Italiano',
    nl: 'Dutch',
    pl: 'Polska',
    ru: 'Pусский',
}

const _supportedLocales_ = Object.keys(locales)
const _defaultLocale_ = 'en'


async function fetchMessages(locale) {
    const path = await import('./locales/' + locale + '.ftl')

    const response = await fetch(path.default)
    const messages = await response.text()

    return { [locale]: new FluentResource(messages) }
}

function getDefaultBundles() {
    const bundle = new FluentBundle('')
    bundle.addResource(new FluentResource(''))
    return new ReactLocalization([bundle])
}

async function createMessagesGenerator(currentLocales) {
    const fetched = await Promise.all(
        currentLocales.map(fetchMessages)
    )
    const messages = fetched.reduce(
        (obj, cur) => Object.assign(obj, cur)
    )

    return function* generateBundles() {
        for (const locale of currentLocales) {
            const bundle = new FluentBundle(locale)
            bundle.addResource(messages[locale])
            yield bundle
        }
    }
}

export function AppLocalizationProvider({ userLocales, children, onLocaleChange }){
    const [bundles, setBundles] = useState(getDefaultBundles())

    useEffect(() => {
        async function loadBundles() {
            const currentLocales = negotiateLanguages(
                userLocales,
                _supportedLocales_,
                { defaultLocale: _defaultLocale_ }
            )

            if (!!onLocaleChange) {
                onLocaleChange(currentLocales)
            }

            const generateBundles = await createMessagesGenerator(currentLocales)
            setBundles( new ReactLocalization(generateBundles()) )
        }
        loadBundles()
    }, [userLocales, onLocaleChange])

    if (!bundles) {
        // Show a loader.
        return <div>Loading texts…</div>
    }

    return <LocalizationProvider l10n={bundles}>
        {children}
    </LocalizationProvider>
}

