import { useEffect, useRef } from 'react'

// Makes the phone's back button close a screen/modal instead of leaving the app.
export function useBackClose(open: boolean, onClose: () => void) {
  const cb = useRef(onClose)
  cb.current = onClose
  useEffect(() => {
    if (!open) return
    history.pushState({ bc: true }, '')
    let popped = false
    const h = () => { popped = true; cb.current() }
    window.addEventListener('popstate', h)
    return () => {
      window.removeEventListener('popstate', h)
      if (!popped) history.back()
    }
  }, [open])
}
