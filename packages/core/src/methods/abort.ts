import { Atom, atom, named } from '../core'
import { AbortError } from '../utils'
import { variable } from './variable'

export type AbortAtom = Atom<null | AbortError>

export let abortVar = variable(
  (abort: AbortAtom = atom<null | AbortError>(null, named('abort'))) => abort,
)
