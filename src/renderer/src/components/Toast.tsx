import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  onClose: () => void
}

export default function Toast({ message, onClose }: ToastProps): React.JSX.Element | null {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300)
    }, 2000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={`toast-wrapper ${visible ? 'toast-wrapper--visible' : 'toast-wrapper--hidden'}`}
    >
      <div className="toast-body">{message}</div>
    </div>
  )
}
