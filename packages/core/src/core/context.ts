import { top, Frame, context } from './'

/** @internal */
export let getPrevPubs = (frame = top()) => {
  let meta = context().state.meta.pubs
  let rec = meta.get(frame.atom)

  if (!rec) {
    meta.set(
      frame.atom,
      (rec = {
        prev: [null],
        next: frame.pubs,
      }),
    )
  }

  if (rec.next !== frame.pubs) {
    rec.prev = rec.next
    rec.next = frame.pubs
  }
  return rec.prev
}

export let findInPubs = <T>(
  stack: Array<Frame['pubs']>,
  cb: (frame: Frame) => undefined | null | T,
): void | T => {
  for (let i = 0; i < stack.length; i++) {
    let pubs = stack[i]!
    for (let j = 0; j < pubs.length; j++) {
      let pub = pubs[j] as null | Frame
      if (pub !== null && pub.atom !== context) {
        let result = cb(pub)
        if (result != undefined) return
        stack.push(pub.pubs)
      }
    }
  }
}
