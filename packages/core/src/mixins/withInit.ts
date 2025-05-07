import {
  AtomLike,
  AtomState,
  Ext,
  context,
  _enqueue,
  top,
  withMiddleware,
} from '../core'

export let withInit = <Target extends AtomLike>(
  init: AtomState<Target> | ((state: AtomState<Target>) => AtomState<Target>),
): Ext<Target> => {
  let key = {} // Symbol(`${target.name}.init`)

  return withMiddleware(
    () =>
      function withInit(next, ...params) {
        let meta = context().state.meta.init
        if (!meta.has(key)) {
          meta.set(key, null)
          let frame = top()
          frame.state =
            typeof init === 'function'
              ? (init as (state: Target) => Target)(frame.state)
              : init
        }

        return next(...params)
      },
  )
}

export let withInitHook = <Target extends AtomLike>(
  hook: (initState: AtomState<Target>) => any,
): Ext<Target> =>
  withInit((state) => {
    let frame = top()
    _enqueue(() => frame.run(hook, frame.state), 'hook')
    return state
  })
