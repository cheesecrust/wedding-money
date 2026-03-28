import { useRef } from 'react'
import type { GuestInput } from '../../../preload/index.d'

interface GuestFormProps {
  onSave: (guest: GuestInput) => void
}

export default function GuestForm({ onSave }: GuestFormProps): React.JSX.Element {
  const nameRef = useRef<HTMLInputElement>(null)
  const amountRef = useRef<HTMLInputElement>(null)
  const ticketsRef = useRef<HTMLInputElement>(null)
  const submitRef = useRef<HTMLButtonElement>(null)

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    nextRef: React.RefObject<HTMLElement | null> | null
  ): void => {
    if (e.key === 'Enter') {
      if (!e.nativeEvent.isComposing) {
        e.preventDefault()
      }
      setTimeout(() => {
        if (nextRef && nextRef.current) {
          nextRef.current.focus()
        } else {
          handleSubmit()
        }
      }, 10)
    }
  }

  const handleSubmit = (): void => {
    const name = nameRef.current?.value.trim() ?? ''
    const amount = (Number(amountRef.current?.value) || 0) * 10000
    const tickets = Number(ticketsRef.current?.value) || 0
    if (!name || amount <= 0) return

    onSave({
      name,
      amount,
      meal_tickets: tickets,
      relationship: '기타',
      gift: '',
      delivery_method: '직접전달',
      memo: ''
    })

    if (nameRef.current) nameRef.current.value = ''
    if (amountRef.current) amountRef.current.value = ''
    if (ticketsRef.current) ticketsRef.current.value = ''
    nameRef.current?.focus()
  }

  return (
    <div className="form-container">
      <h2 className="form-heading">축의금 입력</h2>
      <div className="form-fields">
        <div>
          <label className="form-label">이름</label>
          <input
            ref={nameRef}
            type="text"
            placeholder="이름 입력"
            onKeyDown={(e) => handleKeyDown(e, ticketsRef)}
            className="form-input"
          />
        </div>
        <div>
          <label className="form-label">식권 개수</label>
          <input
            ref={ticketsRef}
            type="number"
            placeholder="식권 수"
            min="0"
            onKeyDown={(e) => handleKeyDown(e, amountRef)}
            className="form-input"
          />
        </div>
        <div>
          <label className="form-label">축의금 (만원)</label>
          <input
            ref={amountRef}
            type="number"
            placeholder="예: 5 (5만원)"
            min="0"
            onKeyDown={(e) => handleKeyDown(e, submitRef)}
            className="form-input"
          />
        </div>
      </div>
      <button ref={submitRef} type="button" onClick={handleSubmit} className="form-submit">
        추가
      </button>
    </div>
  )
}
