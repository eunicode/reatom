import type { AtomLike, AtomState } from 'src/core'
import { top } from 'src/core'
import { isShallowEqual } from 'src/utils'

export let withMemo =
  <T extends AtomLike>(
    isEqual: (
      prevState: AtomState<T>,
      nextState: AtomState<T>,
    ) => boolean = isShallowEqual,
  ): ((target: T) => {}) =>
  (target) => {
    target.__reatom.push((next, ...params) => {
      let prevState = top().state
      let nextState = next(...params)
      return isEqual(prevState, nextState) ? prevState : nextState
    })
    return {}
  }
