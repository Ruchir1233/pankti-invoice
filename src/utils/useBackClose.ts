import { useEffect, useRef } from 'react'

// Phone back button closes the top-most screen/modal instead of leaving the app.
type Entry = { close: () => void }
const stack: Entry[] = []
let suppress = 0
let pendingPush = 0
let listening = false

function ensureListener() {
  if (listening) return
  listening = true
  window.addEventListener('popstate', () => {
    if (suppress > 0) {
      suppress--
      if (suppress === 0) while (pendingPush > 0) { pendingPush--; history.pushState({ bc: true }, '') }
      return
    }
    const top = stack.pop()
    top?.close()
  })
}

export function useBackClose(open: boolean, onClose: () => void) {
  const cb = useRef(onClose)
  cb.current = onClose
  useEffect(() => {
    if (!open) return
    ensureListener()
    const entry: Entry = { close: () => cb.current() }
    stack.push(entry)
    if (suppress > 0) pendingPush++      // a history.back() is still in flight: push after it lands
    else history.pushState({ bc: true }, '')
    return () => {
      const i = stack.indexOf(entry)
      if (i !== -1) {          // closed by UI (not by back button): remove our history entry
        stack.splice(i, 1)
        suppress++
        history.back()
      }
    }
  }, [open])
}
