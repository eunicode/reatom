import { assert, Fn, isAbort, noop, Overloads } from '../utils'
import { top, context, STACK, ReatomError, Frame } from '../core'
import { abortVar } from './abort'

/** Bind reatom context to function or promise (for await) */
export let wrap: {
  <Params extends any[], Payload>(
    target: (...params: Params) => Payload,
    frame?: Frame,
  ): (...params: Params) => Payload

  <T extends Promise<any>>(target: T, frame?: Frame): T
} = <T extends Promise<any> | Fn>(
  target: T,
  frame = top(),
): T extends Fn ? (Fn extends T ? T : Overloads<T>) : T => {
  if (typeof target === 'function') {
    return function wrap(...params: any) {
      return frame.run(target, ...params)
    } as any
  }

  let contextFrame = context()

  assert(target instanceof Promise, 'target should be promise', ReatomError)

  let promise = new Promise(async (resolve, reject) => {
    try {
      let value = await target

      frame.run(() => abortVar.read()?.throwIfAborted())

      var seal = () => resolve(value)
    } catch (error) {
      // prevent unhandled error for abort
      if (isAbort(error)) promise.catch(noop)
      seal = () => reject(error)
    }
    queueMicrotask(() => {
      // check context collision
      frame.run(noop)

      STACK.push(contextFrame, frame)
    })
    seal()
    queueMicrotask(() => {
      STACK.pop()
      STACK.pop()
    })
  })

  return promise as any
}
