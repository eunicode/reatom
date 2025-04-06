import {
  action,
  Action,
  Assigner,
  atom,
  Atom,
  AtomLike,
  Computed,
  ReatomError,
  root,
  STACK,
  top,
} from '../core'
import { ifCalled, ifChanged, wrap } from '../methods'
import { withAbort, withCallHook } from '../mixins'
import { assert, Fn, identity } from '../utils'
import { withComputed } from '../mixins/withComputed'

type AsyncMethods<Params extends any[] = any[], Payload = any, Error = any> = {
  ready: Computed<boolean>
  onFulfill: Action<
    [payload: Payload, params: Params],
    { payload: Payload; params: Params }
  >
  onReject: Action<
    [error: Error, params: Params],
    { error: Error; params: Params }
  >
  onSettle: Action<
    [{ payload: Payload; params: Params } | { error: Error; params: Params }],
    { payload: Payload; params: Params } | { error: Error; params: Params }
  >
  pending: Computed<number>
}

export let withAsync: {
  <T>(): {
    <Params extends any[]>(
      target: Action<Params, Promise<T>>,
    ): AsyncMethods<Params, T>

    <T extends AtomLike<Promise<T>>>(target: T): AsyncMethods<Array<unknown>, T>
  }
} = () => (target: AtomLike<Promise<any>> | Action<any[], Promise<any>>) => {
  let onFulfill: AsyncMethods['onFulfill'] = action((payload, params) => {
    return onSettle({ payload, params }) as any // TODO
  }, `${target.name}.onFulfill`)
  let onReject: AsyncMethods['onReject'] = action((error, params) => {
    return onSettle({ error, params }) as any // TODO
  }, `${target.name}.onReject`)
  let onSettle: AsyncMethods['onSettle'] = action((call) => {
    pending((state) => state - 1)
    ready()
    return call
  }, `${target.name}._onSettle`)

  let pending = atom(0, `${target.name}._pending`)
  // computed needed to ensure that `pending` (and `ready`) connection will connect the target
  .mix(
    withComputed((state) => {
      if (target.__reatom.reactive) {
        ifChanged(target, () => state++)
      } else {
        ifCalled(target as Action, () => state++)
      }
      return state
    }),
  )

  let ready = atom(() => pending() === 0, `${target.name}.ready`)

  let touched = new WeakSet<Promise<any>>()

  // @ts-expect-error TODO
  target.mix(() => (next: Fn, ...params: any[]) => {
    let state = next(...params)
    let promise = state

    if (target.__reatom.reactive) {
      for (let pub of top().pubs) {
        if (pub !== null && pub.atom !== root) params.push(pub.state)
      }
    } else {
      promise = state.at(-1)?.payload
    }

    assert(promise instanceof Promise, 'promise expected', ReatomError)

    if (touched.has(promise)) return state
    touched.add(promise)

    // outer promise handlers should tick after the async handlers
    promise = promise.then(
      wrap((payload) => onFulfill(payload, params)),
      wrap((error) => onReject(error, params)),
    )

    if (!target.__reatom.reactive) {
      state.at(-1)!.payload = promise
    }

    // FIXME pretty dirty hack, we need a general solution
    if (STACK[STACK.length - 2]?.atom !== pending) {
      pending()
    }

    return state
  })

  return {
    ready,
    onFulfill,
    onReject,
    onSettle,
    pending,
  } as AsyncMethods
}

type AsyncDataMethods<Params extends any[], Payload, State> = AsyncMethods<
  Params,
  Payload
> & {
  data: Atom<State>
}

// @ts-ignore TODO
export let withAsyncData: {
  <Payload>(
    initState: Payload,
  ): Assigner<
    AtomLike<Promise<Payload>>,
    AsyncDataMethods<Array<unknown>, Payload, Payload>
  >
  <Params extends any[], Payload>(
    initState: Payload,
  ): Assigner<
    Action<Params, Promise<Payload>>,
    AsyncDataMethods<Params, Payload, Payload>
  >

  <Params extends any[], Payload, State>(
    initState: State,
    map: (payload: Payload, params: Params, state: State) => State,
  ): Assigner<
    Action<Params, Promise<Payload>>,
    AsyncDataMethods<Params, Payload, State>
  >
  <Payload, State>(
    initState: State,
    map: (payload: Payload, params: Array<unknown>, state: State) => State,
  ): Assigner<
    AtomLike<Promise<Payload>>,
    AsyncDataMethods<Array<unknown>, Payload, State>
  >

  <Params extends any[], Payload>(
    initState: Payload,
    map: (payload: Payload, params: Params, state: Payload) => Payload,
  ): Assigner<
    Action<Params, Promise<Payload>>,
    AsyncDataMethods<Params, Payload, Payload>
  >
  <Payload>(
    initState: Payload,
    map: (payload: Payload, params: Array<unknown>, state: Payload) => Payload,
  ): Assigner<
    AtomLike<Promise<Payload>>,
    AsyncDataMethods<Array<unknown>, Payload, Payload>
  >

  <Params extends any[], Payload>(): Assigner<
    Action<Params, Promise<Payload>>,
    AsyncDataMethods<Params, Payload, Payload | undefined>
  >
  <Payload>(): Assigner<
    AtomLike<Promise<Payload>>,
    AsyncDataMethods<Array<unknown>, Payload, Payload | undefined>
  >

  <Params extends any[], Payload, State>(
    initState: State,
  ): Assigner<
    Action<Params, Promise<Payload>>,
    AsyncDataMethods<Params, Payload, Payload | State>
  >
  <Payload, State>(
    initState: State,
  ): Assigner<
    AtomLike<Promise<Payload>>,
    AsyncDataMethods<Array<unknown>, Payload, Payload | State>
  >
} =
  (
    initState: any,
    map: (payload: any, params: any, state: any) => any = identity,
  ) =>
  (target: AtomLike<Promise<any>>) => {
    let asyncTarget = target.mix(withAbort(), withAsync())

    let data = atom(initState, `${target.name}.data`).mix(
      withComputed((state) => {
        if (target.__reatom.reactive) target()
        ifCalled(asyncTarget.onFulfill, ({ payload, params }) => {
          state = map(payload, params, state)
        })
        return state
      }),
      () => ({
        reset: () => data(initState),
      }),
    )

    asyncTarget.onFulfill.mix(withCallHook(() => data()))

    return { data }
  }
