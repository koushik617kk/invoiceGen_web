import React from 'react'

type Toast = { id: number; message: string; type?: 'success' | 'error' }

let idSeq = 1

export function showToast(message: string, type: 'success' | 'error' = 'success') {
  const detail = { id: idSeq++, message, type }
  window.dispatchEvent(new CustomEvent('toast', { detail }))
}

export default function ToastHost() {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  React.useEffect(() => {
    function onToast(e: Event) {
      const ev = e as CustomEvent<Toast>
      const t = ev.detail
      setToasts((arr) => [...arr, t])
      setTimeout(() => {
        setToasts((arr) => arr.filter((x) => x.id !== t.id))
      }, 2500)
    }
    window.addEventListener('toast', onToast as any)
    return () => window.removeEventListener('toast', onToast as any)
  }, [])

  return (
    <div className="toast-host">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type === 'error' ? 'error' : 'success'}`}>{t.message}</div>
      ))}
    </div>
  )
}


