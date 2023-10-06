import './globals.css'

import { Manrope } from 'next/font/google'
import { Inter } from 'next/font/google'
import localFont from 'next/font/local'

// If loading a variable font, you don't need to specify the font weight
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', })
const inter = Inter({ subsets: ['latin'], variable: '--font-inter',  })
const pragmata = localFont({src: "../fonts/PragmataProR_0829.woff2", subsets: ['latin'], variable: '--font-pragmata'})

// This default export is required in a new `pages/_app.js` file.
export default function MyApp({ Component, pageProps }) {
  return <div className={manrope.variable + " " + pragmata.variable + " " + inter.className + " font-[450]"}><Component {...pageProps} /></div>
}