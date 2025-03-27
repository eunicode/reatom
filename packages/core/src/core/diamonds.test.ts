import { expect, subscribe, test } from 'test'
import { atom, isConnected, root } from './atom'
import { notify } from '../methods'

test('diamonds', () => {
  const name = 'diamonds'
  const a1 = atom(0, `${name}.a1`)
  const a2 = atom(() => {
    // console.log('a2')
    return a1() + a1() - a1()
  }, `${name}.a2`)
  const a3 = atom(() => {
    // console.log('a3')
    return a1()
  }, `${name}.a3`)
  const a4 = atom(() => {
    // console.log('a4')
    return a2() + a3()
  }, `${name}.a4`)
  const a5 = atom(() => {
    // console.log('a5')
    return a2() + a3()
  }, `${name}.a5`)
  const a6 = atom(() => {
    // console.log('a6')
    return a4() + a5()
  }, `${name}.a6`)
  const track = subscribe(a6)

  for (const a of [a1, a2, a3, a4, a5, a6]) {
    expect(isConnected(a), `"${a.name}" should not be stale`).toBe(true)
  }

  expect(track).toBeCalledTimes(1)
  expect(root().state.store.get(a1)!.subs).toEqual([a2, a2, a2, a3])
  expect(root().state.store.get(a2)!.subs).toEqual([a4, a5])
  expect(root().state.store.get(a3)!.subs).toEqual([a4, a5])

  a1(1)
  notify()
  expect(track).toBeCalledTimes(2)
  // expect(touchedAtoms.length, new Set(touchedAtoms).size)

  track.unsubscribe()
  for (const a of [a1, a2, a3, a4, a5, a6]) {
    expect(isConnected(a), `"${a.name}" should not be stale`).toBe(false)
  }
})
