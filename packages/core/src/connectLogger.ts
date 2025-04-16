import { AtomLike, Frame, isConnected, context, top } from './core'
import { withCallHook, withChangeHook } from './mixins'
import { isBrowser } from './utils'

let isSkip = (target: AtomLike) =>
  target.name.startsWith('_') || /\._/.test(target.name)

let serialCount = 0
let serialNumbers = new WeakMap<Frame, number>()

let getSerial = (frame = top()) => {
  if (isSkip(frame.atom)) return ''

  let serial = serialNumbers.get(frame)
  if (serial === undefined) {
    serialNumbers.set(frame, (serial = ++serialCount))
  }

  return `[#${serial}]`
}

export let getStackTrace = (
  acc = '',
  steps = acc && ' '.repeat(acc.length),
  frame = top(),
): string => {
  if (acc.length > 1000) throw new Error('RECURSION')

  let name = ` < ${frame.atom.name}${getSerial(frame)}`
  acc += name
  steps += ' '.repeat(name.length)

  let nextPub = false
  for (const pub of frame.pubs) {
    if (pub === null || pub.atom === context) continue
    if (nextPub) acc += `\n\n${steps}`
    nextPub = true
    acc += getStackTrace('', steps, pub)
  }

  return acc
}

let logStackTrace = () => {
  console.log('stack:')
  console.log(
    top().pubs.reduce(
      (acc, frame) =>
        acc +
        (frame === null || frame.atom === context
          ? ''
          : getStackTrace('', '', frame) + '\n\n'),
      '',
    ),
  )
}

export let connectLogger = () => {
  let isNodeEnv = !isBrowser()

  globalThis.__REATOM.push(<T extends AtomLike>(target: T): T => {
    if (isSkip(target)) return target

    let title = `%c ${target.name}`
    let style = ''
    if (isNodeEnv) {
      let nodeReactiveStyle = '\x1b[44m\x1b[37m' // blue background, white text
      let nodeActionStyle = '\x1b[43m\x1b[30m' // yellow background, black text
      let nodeResetStyle = '\x1b[0m'
      title = `${target.__reatom.reactive ? nodeReactiveStyle : nodeActionStyle} ${target.name} ${nodeResetStyle}`
    } else {
      let color = target.__reatom.reactive
        ? 'background: #151134; color: white;'
        : 'background: #ffff80; color: #151134;'
      style = `${color}font-size: 12px; font-weight: 600; padding: 0.15em;  padding-right: 1ch;`
    }

    return target.__reatom.reactive
      ? withChangeHook<T>((state, prevState) => {
          console.groupCollapsed(`${title}${getSerial()}`, style)
          if (isNodeEnv) console.log(state)
          console.log('prev:', prevState)
          logStackTrace()
          console.log('connected:', isConnected(target))
          if (!isNodeEnv) console.log('frame:', top())
          console.groupEnd()
          if (!isNodeEnv) console.log(state)
        })(target)
      : withCallHook<T>((payload, params) => {
          console.groupCollapsed(`${title}${getSerial()}`, style)
          if (isNodeEnv) console.log(payload)
          params.forEach((param, i) => console.log(`param ${i + 1}:`, param))
          logStackTrace()
          if (!isNodeEnv) console.log('frame:', top())
          console.groupEnd()
          if (!isNodeEnv) console.log(payload)
        })(target)
  })
}
