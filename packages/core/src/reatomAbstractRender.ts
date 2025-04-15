import { _read, atom, computed, type Frame } from './core'
import { getPrevPubs } from './methods/context'
import { AbortAtom, abortVar, variable, wrap } from './methods'
import { toAbortError, Unsubscribe } from './utils'

export interface AbstractRender<Props, Result> {
  render: (props: Props) => { result: Result }
  mount: () => Unsubscribe
}

/** This is a low-level reatom renderer which helped to connect two different reactive systems.
 * To archive a user render function running only in a context of adapted reactive system,
 * this method decorate computed render to prevent extra rerenders or outdated rerenders.
 */
export let reatomAbstractRender = <Props, Result>({
  frame,
  render,
  rerender,
  mount,
  name,
}: {
  frame: Frame
  render: (props: Props) => Result
  // Exclude for correct type inference
  rerender: (param: { result: Exclude<Result, never> }) => any
  mount?: () => void
  name: string
}): AbstractRender<Props, Result> =>
  frame.run(() => {
    let rendering = false

    let changedVar = variable<boolean>()

    let propsAtom = atom({} as Props, `${name}._propsAtom`)

    let abortAtom: AbortAtom

    let renderAtom = computed(
      (state?: { result: Result }): { result: Result } => {
        let pubs = getPrevPubs()

        let props = propsAtom()

        if (rendering) {
          abortAtom = abortVar.set(abortAtom ?? `${name}.abort`)
          return { result: render(props) }
        }

        changedVar.set(true)

        // do not drop subscriptions from the render
        for (
          // skip actualization pub and `propsAtom`
          let i = 2;
          i < pubs.length;
          i++
        ) {
          pubs[i]!.atom()
        }

        return { result: state!.result }
      },
      `${name}._renderAtom`,
    )

    let _render = frame.run.bind(frame, (props: Props) => {
      try {
        rendering = true
        propsAtom({ ...props })
        return renderAtom()
      } finally {
        rendering = false
      }
    }) as (props: Props) => { result: Result }

    let _mount = wrap(() => {
      mount?.()
      let unsubscribe = renderAtom.subscribe((state) => {
        if (changedVar.read()) {
          changedVar.set(false)
          rerender(state)
        }
      })

      return wrap(() => {
        unsubscribe()
        abortVar.get()?.(toAbortError('unmount ' + name))
      })
    })

    return { render: _render, mount: _mount }
  })
