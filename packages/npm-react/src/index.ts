import React from 'react'
import {
  _read,
  assert,
  Fn,
  Frame,
  named,
  ReatomError,
  reatomAbstractRender,
  Rec,
  STACK,
} from '@reatom/core'

// useLayoutEffect will show warning if used during ssr, e.g. with Next.js
// useIsomorphicEffect removes it by replacing useLayoutEffect with useEffect during ssr
export let useIsomorphicEffect =
  typeof document !== 'undefined' ? React.useLayoutEffect : React.useEffect

// https://github.com/webpack/webpack/issues/12960#issuecomment-1086272918
let {
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: oldInternals,
  __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE: newInternals,
} = React as any

export let getComponentDebugName = (fallback?: string): string => {
  let Component =
    oldInternals?.ReactCurrentOwner?.current?.type ??
    newInternals?.A?.getOwner?.()?.type

  let name = (Component?.displayName ?? Component?.name) || fallback
  return name ? `Component.${name}` : named('Component')
}

let batch = (cb: Fn) => cb()

export let setupBatch = (newBatch: typeof batch) => {
  batch = newBatch
}

let anonFnName = (() => () => {})().name

export let reatomContext = React.createContext<null | Frame>(null)

export let useFrame = (): Frame => {
  let frame = React.useContext(reatomContext) ?? STACK[0]

  assert(
    frame,
    'the root is not set, you probably forgot to specify the  provider',
    ReatomError,
  )

  return frame
}

let isSuspense = (thing: unknown) =>
  thing instanceof Promise ||
  (thing instanceof Error && thing.message.startsWith('Suspense Exception'))

export let reatomComponent = <Props extends Rec>(
  Component: (props: Props) => React.ReactNode,
  name?: string,
): ((props: Props) => React.ReactNode) => {
  if (name) {
    name = `Component.${name}`
  } else if (Component.name && Component.name !== anonFnName) {
    name = `Component.${Component.name}`
  } else {
    name = named('Component')
  }

  return {
    [name](props: Props): React.ReactNode {
      let frame = useFrame()

      let [, rerender] = React.useState({ result: null as React.ReactNode })

      let { render, mount, abort } = React.useMemo(
        () =>
          reatomAbstractRender({
            frame,
            render(props: Props) {
              try {
                return Component(props)
              } catch (error) {
                if (isSuspense(error)) {
                  return error as never
                }
                throw error
              }
            },
            mount() {
              // Drop abort if remount appears (strict mode or so on)
              if (abort()) abort(null)
            },
            rerender,
            name,
          }),
        [frame],
      )

      React.useEffect(mount, [mount])

      let { result } = render(props)
      if (isSuspense(result)) throw result
      return result
    },
  }[name]!
}
