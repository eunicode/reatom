import { Frame, isConnected, root, top } from './core/atom'
import { withCallHook, withChangeHook } from './mixins'

export const getStackTrace = (acc = '', frame = top()): string => {
  if (acc.length > 500) throw new Error('RECURSION')
  if (!acc) acc = `<-- ${frame.atom.name}`
  const cause = frame.pubs.find((pub: Frame | null) => pub && pub.atom !== root)
  return cause ? getStackTrace(`${acc}\n<-- ${cause.atom.name}`, cause) : acc
}

export const connectLogger = () => {
  globalThis.__REATOM.push((target) => {
    if (target.name.startsWith('_') || /\._/.test(target.name)) {
      return {}
    }

    const color = target.__reatom.reactive
      ? 'background: #151134; color: white;'
      : 'background: #ffff80; color: #151134;'
    const style = `${color}font-size: 12px; font-weight: 600; padding: 0.15em;  padding-right: 1ch;`
    const title = `%c ${target.name}`

    return target.__reatom.reactive
      ? withChangeHook((state, prevState) => {
          console.groupCollapsed(title, style)
          console.log('previous state:', prevState)
          console.log('stack:')
          console.log(getStackTrace())
          console.log('connected:', isConnected(target))
          console.log('frame:', top())
          console.groupEnd()
          console.log(state)
        })(target)
      : withCallHook((payload, params) => {
          console.groupCollapsed(title, style)
          params.forEach((param, i) => console.log(`param ${i + 1}:`, param))
          console.log('stack:')
          console.log(getStackTrace())
          console.log('frame:', top())
          console.groupEnd()
          console.log(payload)
        })(target)
  })
}
