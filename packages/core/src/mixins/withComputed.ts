import type { AtomLike, AtomState } from 'src/core'
import { top } from 'src/core'

export let withComputed =
  <T extends AtomLike>(
    computed: (state: AtomState<T>) => AtomState<T>,
  ): ((target: T) => {}) =>
  (target) => {
    target.__reatom.unshift(function withComputedHandler(next) {
      return next(computed(top().state))
    })
    return {}
  }