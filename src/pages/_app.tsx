import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { DomainProvider } from '../context/DomainContext'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <DomainProvider>
      <Component {...pageProps} />
    </DomainProvider>
  )
}
