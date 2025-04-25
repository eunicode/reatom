import { action, AtomLike, bind, computed, top } from '../core'
import { Fn, isAbort, noop } from '../utils'
import { abortVar } from './abort'
import { ifCalled } from './ifChanged'

let i = 0

/** Wait some atom change or action call */
export let take = <T>(
  target: AtomLike<any, any, T>,
  name?: string,
): Promise<Awaited<T>> => {
  name = `${top().atom.name}.take${name ? `.${name}` : `#${++i}`}`

  let log = bind(action((_message: string, payload: any) => payload, name))

  let cleanups: Array<Fn> = []

  let abort = abortVar.read()

  let promise = new Promise<Awaited<T>>((res, rej) => {
    log('start', target.name)

    cleanups.push(
      abort?.subscribeAbort(rej) ?? noop,
      computed(async () => {
        try {
          let value: any

          if (target.__reatom.reactive) {
            value = target()
          } else {
            let taken = false
            ifCalled(target, (payload) => {
              // get the first call, not the last
              if (!taken) {
                taken = true
                value = payload
              }
            })
          }

          // skip the first sync call
          if (!cleanups.length) return

          if (value instanceof Promise) value = await value

          res(value)
        } catch (error) {
          // skip the first sync call
          if (!cleanups.length) return

          if (isAbort(error)) return

          rej(error)
        }
      }, `${name}.computed`).subscribe(),
    )
  })

  promise
    .then((value) => {
      cleanups.forEach((fn) => fn())
      log('resolve', value)
    })
    .catch((error) => {
      if (isAbort(error)) promise.catch(noop)
      cleanups.forEach((fn) => fn())
      log('reject', error)
    })

  return promise
}
