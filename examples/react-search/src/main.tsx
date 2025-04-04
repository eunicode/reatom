import ReactDOM from 'react-dom/client'
import { root as reatomRoot, clearStack } from '@reatom/core'
import { type Devtools } from '@reatom/devtools'
import { reatomContext } from '@reatom/npm-react'
import './debug'
import { App } from './app'

clearStack()

// declare global {
//   var DEVTOOLS: undefined | Devtools
// }
// if (import.meta.env.DEV) {
//   const { createDevtools } = await import('@reatom/devtools')
//   globalThis.DEVTOOLS = createDevtools({ ctx, initVisibility: true })
// } else {
//   globalThis.DEVTOOLS = undefined
// }

const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(
  <reatomContext.Provider value={reatomRoot.start()}>
    <App />
  </reatomContext.Provider>,
)
