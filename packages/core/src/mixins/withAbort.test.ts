import { expect, test, vi } from 'test'

import { action, atom, computed } from '../core'
import { abortVar, effect, wrap } from '../methods'
import { sleep } from '../utils'
import { withAbort } from './withAbort'

test('abort propagation', async () => {
  const name = 'abortPropagation'
  const doSome = action((n: number) => doOther(n), `${name}.doSome`).extend(
    withAbort(),
  )
  const doOther = action(async (n: number) => {
    await wrap(sleep())
    track(n)
  }, `${name}.doOther`)
  const track = vi.fn()

  doSome(1)
  doSome(2)
  doSome(3)

  await wrap(sleep())

  expect(track).toBeCalledTimes(1)
  expect(track).toBeCalledWith(3)
})

test('abort computed propagation', async () => {
  const name = 'abortComputedPropagation'
  const count = atom(0, `${name}.count`)
  const double = computed(() => count() * 2, `${name}.double`)

  const logs: any[] = []
  computed(async () => {
    const state = double()
    let running = true
    logs.push(state + ' start')
    abortVar.subscribeAbort(() => {
      running = false
      logs.push(state + ' abort')
    })
    while (running) {
      logs.push(state + ' loop')
      await wrap(sleep())
    }
  }, `${name}.loop`).subscribe()

  await wrap(sleep())
  await wrap(sleep())
  expect(logs).toEqual(['0 start', '0 loop', '0 loop', '0 loop'])

  const { unsubscribe } = effect(() => {
    count.set((s) => s + 1)
  }, `${name}.setCountEffect`)
  await wrap(Promise.resolve())
  expect(logs).toEqual([
    '0 start',
    '0 loop',
    '0 loop',
    '0 loop',
    '2 start',
    '2 loop',
  ])

  unsubscribe()
  await wrap(sleep())
  await wrap(sleep())
  expect(logs).toEqual([
    '0 start',
    '0 loop',
    '0 loop',
    '0 loop',
    '2 start',
    '2 loop',
    '0 loop',
    '2 loop',
    '0 loop',
    '2 loop',
  ])
})

test('abortable model', async () => {
  const fn = vi.fn()
  const id = atom(0)
  const model = computed(() => {
    id()

    return action(async () => {
      await wrap(sleep())
      fn()
    }).extend(withAbort())
  }).extend(withAbort())

  const doSome1 = model()

  doSome1()
  doSome1()
  doSome1()
  await wrap(sleep())
  expect(fn).toBeCalledTimes(1)

  id.set(1)
  const doSome2 = model()
  doSome1()
  expect(fn).toBeCalledTimes(1)
})
