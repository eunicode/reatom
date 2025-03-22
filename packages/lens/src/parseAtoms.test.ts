import { createTestCtx } from '@reatom/testing'
import { it, expectTypeOf } from 'vitest'
import {
  LL_NEXT,
  LL_PREV,
  reatomEnum,
  reatomLinkedList,
} from '@reatom/primitives'
import { test, describe, expect } from 'vitest'
import { action, atom } from '@reatom/core'
import { parseAtoms } from './parseAtoms'
import { reatomZod } from '@reatom/npm-zod'
import { z } from 'zod'

describe('runtime', () => {
  test('should return value', () => {
    const ctx = createTestCtx()

    expect(parseAtoms(ctx, 'some bare value')).toBe('some bare value')
    expect(parseAtoms(ctx, 10)).toBe(10)
    expect(parseAtoms(ctx, Symbol.for('specialSymbol'))).toBe(
      Symbol.for('specialSymbol'),
    )
  })

  test('should parse deep atoms', () => {
    const ctx = createTestCtx()

    expect(
      parseAtoms(
        ctx,
        atom(() => atom('deep')),
      ),
    ).toBe('deep')

    expect(
      parseAtoms(
        ctx,
        atom(() => [atom(['deep'])]),
      ),
    ).toEqual([['deep']])
  })

  test('should parse records', () => {
    const ctx = createTestCtx()

    expect(
      parseAtoms(ctx, {
        someValue: atom(1),
        someDeep: {
          deep: {
            deep: atom('value'),
          },
        },
      }),
    ).toEqual({
      someValue: 1,
      someDeep: {
        deep: {
          deep: 'value',
        },
      },
    })
  })

  test('should parse maps', () => {
    const ctx = createTestCtx()

    const atomized = new Map()
    const keyObj = {}
    const keyAtom = atom('')
    atomized.set(1, atom(1))
    atomized.set(keyObj, atom({ someKey: atom('someValue') }))
    atomized.set(keyAtom, 'someRawValue')

    const parsed = parseAtoms(ctx, atomized)
    expect(parsed.get(1)).toBe(1)
    expect(parsed.get(keyObj)).toEqual({ someKey: 'someValue' })
    expect(parsed.get(keyAtom)).toBe('someRawValue')
    expect(parsed.size).toBe(3)
  })

  test('should spy if inside atom', () => {
    const ctx = createTestCtx()

    const valueAtom = atom('default')
    const parsedAtom = atom((ctx) => parseAtoms(ctx, { key: valueAtom }))

    expect(ctx.get(parsedAtom)).toEqual({ key: 'default' })

    valueAtom(ctx, 'new')
    expect(ctx.get(parsedAtom)).toEqual({ key: 'new' })
  })

  test('should parse sets', () => {
    const ctx = createTestCtx()

    const atomized = new Set()
    const symbol = Symbol()
    const keyObj = { __id__: symbol }
    atomized.add(atom(1))
    atomized.add(atom(1))
    atomized.add(atom(1))
    atomized.add(atom(1))
    atomized.add(keyObj)
    atomized.add('someRawValue')

    const parsed = parseAtoms(ctx, atomized)
    const values = Array.from(parsed.values())
    expect(parsed.has(1)).toBe(true)
    expect(parsed.has('someRawValue')).toBe(true)

    expect(parsed.has(keyObj)).toBe(false)
    expect(values.some((a: any) => a?.__id__ === symbol)).toBe(true)

    // expect(parsed.size).toBe(3)
  })

  test('should parse mixed values', () => {
    const ctx = createTestCtx()

    expect(
      parseAtoms(ctx, {
        someValue: atom(1),
        someDeep: {
          deep: {
            deep: atom('value'),
          },
        },
      }),
    ).toEqual({
      someValue: 1,
      someDeep: {
        deep: {
          deep: 'value',
        },
      },
    })
  })

  test('should parse deep structures', () => {
    const ctx = createTestCtx()

    expect(parseAtoms(ctx, [[[[[atom('deepStruct')]]]]])).toEqual([
      [[[['deepStruct']]]],
    ])
  })

  test('should parse linked list as array', () => {
    const ctx = createTestCtx()
    const model = reatomZod(
      z.object({
        kind: z.literal('TEST'),
        bool1: z.boolean().optional().nullable(),
        arr: z.array(
          z.object({
            type: z.enum(['A', 'B', 'C']).readonly(),
            str1: z.string().optional(),
            bool: z.boolean().optional(),
          }),
        ),
        bool2: z.boolean().nullish(),
      }),
    )

    model.arr.create(ctx, {
      type: 'A',
      str1: 'a',
      bool: true,
    })
    model.arr.create(ctx, {
      type: 'B',
      str1: 'b',
      bool: true,
    })
    model.arr.create(ctx, {
      type: 'C',
      str1: 'c',
      bool: false,
    })
    const snapshot = parseAtoms(ctx, model)
    expect(snapshot.arr).toEqual([
      {
        type: 'A',
        str1: 'a',
        bool: true,
      },
      {
        type: 'B',
        str1: 'b',
        bool: true,
      },
      {
        type: 'C',
        str1: 'c',
        bool: false,
      },
    ])
  })

  test('should ignore constructor', () => {
    const ctx = createTestCtx()

    const constructObject = new AbortController()

    expect(parseAtoms(ctx, { constructObject }).constructObject).toBe(
      constructObject,
    )
  })
})

describe('types', () => {
  it('should return value', () => {
    const ctx = createTestCtx()

    expectTypeOf(parseAtoms(ctx, 'some bare value')).toEqualTypeOf<string>()
    expectTypeOf(parseAtoms(ctx, 10)).toEqualTypeOf<number>()
    expectTypeOf(
      parseAtoms(ctx, Symbol.for('specialSymbol')),
    ).toEqualTypeOf<symbol>()
  })

  it('should parse deep atoms', () => {
    const ctx = createTestCtx()
    expectTypeOf(
      parseAtoms(
        ctx,
        atom(() => atom('deep')),
      ),
    ).toEqualTypeOf<string>()
    expectTypeOf(
      parseAtoms(
        ctx,
        atom(() => [atom(['deep'])]),
      ),
    ).toEqualTypeOf<string[][]>()
  })

  it('should parse records', () => {
    const ctx = createTestCtx()
    expectTypeOf(
      parseAtoms(ctx, {
        someValue: atom(1),
        someDeep: {
          deep: {
            deep: atom('value'),
          },
        },
      }),
    ).toEqualTypeOf<{
      someValue: number
      someDeep: {
        deep: {
          deep: string
        }
      }
    }>()
  })

  it('should parse maps', () => {
    const ctx = createTestCtx()
    const atomized = new Map<any, any>()
    const keyObj = {}
    const keyAtom = atom('')
    atomized.set(1, atom(1))
    atomized.set(keyObj, atom({ someKey: atom('someValue') }))
    atomized.set(keyAtom, 'someRawValue')

    expectTypeOf(parseAtoms(ctx, atomized)).toEqualTypeOf<Map<any, any>>()
  })

  it('should parse sets', () => {
    const ctx = createTestCtx()
    const atomized = new Set<any>()
    atomized.add(atom(1))
    atomized.add('someRawValue')

    expectTypeOf(parseAtoms(ctx, atomized)).toEqualTypeOf<Set<any>>()
  })

  it('should parse mixed values', () => {
    const ctx = createTestCtx()
    expectTypeOf(
      parseAtoms(ctx, {
        someValue: atom(1),
        someDeep: {
          deep: {
            deep: atom('value'),
          },
        },
      }),
    ).toEqualTypeOf<{
      someValue: number
      someDeep: {
        deep: {
          deep: string
        }
      }
    }>()
  })

  it('should parse deep structures', () => {
    const ctx = createTestCtx()
    expectTypeOf(parseAtoms(ctx, [[[[[atom('deepStruct')]]]]])).toEqualTypeOf<
      string[][][][][]
    >()
  })

  it('should parse linked list as array', () => {
    const ctx = createTestCtx()

    const model = reatomLinkedList((ctx, value: number) => ({
      kind: 'TEST' as const,
      bool1: atom(true),
      array: atom([
        atom({
          type: reatomEnum(['A', 'B', 'C']),
          str1: atom(''),
          bool: atom(false),
        }),
      ]),
    }))

    const test = parseAtoms(ctx, model)

    type ToMatchTypeOf = {
      kind: 'TEST'
      bool1: boolean
      array: {
        type: 'A' | 'B' | 'C'
        str1: string
        bool: boolean
      }[]
      [LL_PREV]: ToMatchTypeOf | null
      [LL_NEXT]: ToMatchTypeOf | null
    }

    expectTypeOf(test).toMatchTypeOf<ToMatchTypeOf[]>()
  })

  it('should parse File and other classes properly', () => {
    const ctx = createTestCtx()

    expectTypeOf(
      parseAtoms(ctx, {
        file: new File([''], 'test.txt'),
        someDeep: {
          abortController: new AbortController(),
        },
      }),
    ).toEqualTypeOf<{
      file: File
      someDeep: {
        abortController: AbortController
      }
    }>()
  })
})
