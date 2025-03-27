import { expect, subscribe, test } from 'test'
import { atom } from 'src/core'
import { withComputed } from './withComputed'
import { notify } from 'src/methods'

test('withComputed', () => {
  const name = 'withComputed'
  const param = atom(1, `${name}.param`)
  const data = atom(0, `${name}.data`).mix(withComputed(() => param()))
  const track = subscribe(data)

  expect(track).toBeCalledWith(1)

  data(2)
  notify()
  expect(track).toBeCalledWith(2)

  param(3)
  notify()
  expect(track).toBeCalledWith(3)
})
