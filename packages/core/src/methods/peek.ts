import { top } from '../core'

/**
 * Executes a callback in the current context without reactive bindings
 * (dependencies tracking)
 *
 * @example
 *   // Read an atom's value without establishing a dependency
 *   const currentCount = peek(() => counter())
 *   console.log(`Current count is ${currentCount} (without subscribing)`)
 */
export let peek = <Params extends any[], Result>(
  cb: (...params: Params) => Result,
  ...params: Params
): Result => {
  let frame = top()
  let { linking } = frame.atom.__reatom
  try {
    frame.atom.__reatom.linking = false
    return cb(...params)
  } finally {
    frame.atom.__reatom.linking = linking
  }
}
