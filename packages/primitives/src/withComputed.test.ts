import { Atom, atom, AtomState, CtxSpy } from '@reatom/core'
import { test, expect } from 'vitest'

import { withComputed } from './withComputed'
import { concurrent } from '@reatom/effects'
import { noop, sleep } from '@reatom/utils'
import { isInit } from '@reatom/hooks'
import { createTestCtx } from '@reatom/testing'

test('should compute value based on dependencies', () => {
  const a = atom(0)
  const b = atom(0).pipe(withComputed((ctx) => ctx.spy(a)))
  const ctx = createTestCtx()

  expect(ctx.get(b)).toBe(0) // Initial value of b should be 0
  b(ctx, 1) // Set b to 1
  expect(ctx.get(b)).toBe(1) // b should now be 1
  a(ctx, 2) // Update a to 2
  expect(ctx.get(b)).toBe(2) // b should now reflect the updated value of a
})

const withDebounced =
  <T extends Atom>(delay: number) =>
  (target: T): T & { debounced: Atom<AtomState<T>> } => {
    const debounced = atom(undefined as AtomState<T>).pipe(
      withComputed(
        concurrent((ctx: CtxSpy, state?: AtomState<T>) => {
          const next = ctx.spy(target)

          if (isInit(ctx)) return next

          ctx
            .schedule(() => sleep(delay))
            .then(() => debounced(ctx, next))
            .catch(noop)

          return state!
        }),
      ),
    )

    return Object.assign(target, { debounced })
  }

test('debounced computed example', async () => {
  const a = atom(1).pipe(withDebounced(0))
  const b = atom((ctx) => ctx.spy(a.debounced))
  const ctx = createTestCtx()
  const track = ctx.subscribeTrack(b)

  expect(ctx.get(a)).toBe(1)
  expect(ctx.get(a.debounced)).toBe(1)
  expect(ctx.get(b)).toBe(1)
  expect(track.calls.length).toBe(1)

  a(ctx, 2)
  expect(ctx.get(a)).toBe(2)
  expect(ctx.get(a.debounced)).toBe(1)
  expect(ctx.get(b)).toBe(1)
  expect(track.calls.length).toBe(1)
  await sleep()
  expect(ctx.get(a.debounced)).toBe(2)
  expect(ctx.get(b)).toBe(2)
  expect(track.calls.length).toBe(2)

  a(ctx, 3)
  a(ctx, 4)
  await null
  a(ctx, 5)
  expect(ctx.get(a)).toBe(5)
  expect(ctx.get(a.debounced)).toBe(2)
  expect(ctx.get(b)).toBe(2)
  expect(track.calls.length).toBe(2)
  await sleep()
  expect(ctx.get(a.debounced)).toBe(5)
  expect(ctx.get(b)).toBe(5)
  expect(track.calls.length).toBe(3)

  track.unsubscribe()
  a(ctx, 10)
  await sleep()
  expect(ctx.get(a.debounced)).toBe(5)
  expect(ctx.get(b)).toBe(5)
  expect(track.calls.length).toBe(3)
})
