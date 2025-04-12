import { assert, Fn } from '../utils'
import { top, context, STACK, ReatomError } from '../core'

export let wrap = <T extends Promise<any> | Fn>(
  target: T,
  frame = top(),
): T => {
  let contextFrame = context()

  if (typeof target === 'function') {
    return function wrap(...params: any) {
      assert(
        STACK.length === 0 || STACK[0] === contextFrame,
        'context collision',
        ReatomError,
      )

      STACK.push(contextFrame, frame)
      try {
        return target(...params)
      } finally {
        STACK.pop()
        STACK.pop()
      }
    } as T
  }

  assert(target instanceof Promise, 'target should be promise', ReatomError)

  return new Promise(async (resolve, reject) => {
    try {
      let value = await target
      var seal = () => resolve(value)
    } catch (error) {
      seal = () => reject(error)
    }
    Promise.resolve().then(() => {
      assert(
        STACK.length === 0 || STACK[0] === contextFrame,
        'context collision',
        ReatomError,
      )
      STACK.push(contextFrame, frame)
    })
    seal()
    Promise.resolve().then(() => {
      STACK.pop()
      STACK.pop()
    })
  }) as T
}
