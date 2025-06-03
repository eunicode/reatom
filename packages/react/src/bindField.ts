import type { FieldAtom, Rec } from '@reatom/core'
import { wrap } from '@reatom/core'
import type { ChangeEvent } from 'react'

export function bindField<T = any>(
  field: FieldAtom<any, T>,
): {
  value: T
  checked: T extends boolean ? boolean : undefined
  onChange: (
    value:
      | T
      | { currentTarget: T extends boolean ? { checked: T } : { value: T } }
      | ChangeEvent<{ value: T }>,
  ) => void
  onBlur: () => void
  onFocus: () => void
  error: undefined | string
} {
  const value = field()

  const onChange = wrap((event: any) => {
    const isEvent = !!event?.currentTarget?.addEventListener
    const value = isEvent
      ? event.currentTarget.type === 'checkbox'
        ? event.currentTarget.checked
        : event.currentTarget.value
      : event

    field.change(value)
  })

  const onBlur = wrap(field.focus.out)
  const onFocus = wrap(field.focus.in)

  const error = field.validation().errors[0]?.message

  const result: Rec = {
    onChange,
    onBlur,
    onFocus,
    error,
  }

  if (typeof value === 'boolean') {
    result.checked = value
  } else {
    result.value = value
  }

  // @ts-expect-error generic overloads
  return result
}
