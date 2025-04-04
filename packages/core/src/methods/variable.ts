import { Frame, top, WeakMap } from '../core'
import { variableContext } from '../core/context'
import { assert, identity } from '../utils'

export let find = <T>(
  cb: (frame: Frame) => undefined | T,
  frame = top(),
  // @ts-expect-error
): undefined | T => {
  frame ??= top()
  let result = cb(frame)
  if (result !== undefined) return result

  for (let i = 0; i < frame.pubs.length; i++) {
    let pub = frame.pubs[i]
    if (pub) {
      let result = find(cb, pub)
      if (result !== undefined) return result
    }
  }
}

export interface Variable<Params extends any[] = any[], Payload = any> {
  get(frame?: Frame): Payload
  set(...params: Params): Payload
  has(frame?: Frame): boolean
  read(frame?: Frame): undefined | Payload
}

/** Async Context Variable emulation
 * @link https://github.com/tc39/proposal-async-context?tab=readme-ov-file#asynccontextvariable
 */
export let variable: {
  <T>(): Variable<[T], T>

  <Params extends any[], Payload>(
    set: (...params: Params) => Payload,
  ): Variable<Params, Payload>
} = (set = identity) => {
  let key = {}

  let read = (frame = top()) => {
    let context = variableContext()
    let value = find((frame) => context.get(frame)?.get(key), frame)

    return value
  }

  return {
    read,
    get(frame?: Frame) {
      let value = read(frame)

      assert(value !== undefined, 'Variable not found')

      return value
    },
    set(...params: [any, ...any[]]) {
      let frame = top()
      let value = set(...params)
      assert(value !== undefined, `Variable can't be undefined`)
      let context = variableContext()
      context.create(frame, () => new WeakMap()).set(key, value)

      return value
    },
    has(frame?: Frame) {
      return read(frame) !== undefined
    },
  }
}
