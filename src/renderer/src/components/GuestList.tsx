import { useState, useMemo } from 'react'
import type { Guest, GuestInput } from '../../../preload/index.d'

type SortKey = 'index' | 'name' | 'amount' | 'meal_tickets'
type SortDir = 'asc' | 'desc'

const RELATIONSHIPS = [
  '친구',
  '직장동료',
  '친척',
  '선후배',
  '어머니 지인',
  '아버지 지인',
  '기타'
] as const
const DELIVERY_METHODS = ['직접전달', '계좌이체', '모바일'] as const

interface GuestTableProps {
  guests: Guest[]
  onUpdate: (id: number, guest: Partial<GuestInput>) => void
  onDelete: (id: number) => void
}

export default function GuestTable({
  guests,
  onUpdate,
  onDelete
}: GuestTableProps): React.JSX.Element {
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('index')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const totalAmount = guests.reduce((sum, g) => sum + g.amount, 0)
  const totalTickets = guests.reduce((sum, g) => sum + g.meal_tickets, 0)

  const handleSort = (key: SortKey): void => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sortedGuests = useMemo(() => {
    const arr = guests.map((g, i) => ({ ...g, _origIdx: i }))
    arr.sort((a, b) => {
      let diff = 0
      if (sortKey === 'index') diff = a._origIdx - b._origIdx
      else if (sortKey === 'name') diff = a.name.localeCompare(b.name, 'ko')
      else if (sortKey === 'amount') diff = a.amount - b.amount
      else if (sortKey === 'meal_tickets') diff = a.meal_tickets - b.meal_tickets
      return sortDir === 'asc' ? diff : -diff
    })
    return arr
  }, [guests, sortKey, sortDir])

  const arrow = (key: SortKey): string => {
    if (sortKey !== key) return ' ↕'
    return sortDir === 'asc' ? ' ↑' : ' ↓'
  }

  const handleDelete = (id: number): void => {
    if (deleteConfirm === id) {
      onDelete(id)
      setDeleteConfirm(null)
    } else {
      setDeleteConfirm(id)
      setTimeout(() => setDeleteConfirm(null), 3000)
    }
  }

  if (guests.length === 0) {
    return (
      <div className="table-empty">
        <p className="table-empty-text">등록된 축의금이 없습니다.</p>
        <p className="table-empty-sub">좌측 입력 패널에서 축의금을 등록해주세요</p>
      </div>
    )
  }

  return (
    <div className="table-container">
      <div className="table-scroll">
        <table className="guest-table">
          <thead>
            <tr className="sum-row">
              <th className="foot-label" colSpan={2}>
                합계
              </th>
              <th className="foot-value foot-value--right">{totalAmount.toLocaleString()}원</th>
              <th className="foot-value foot-value--center">{totalTickets}</th>
              <th className="foot-value" colSpan={4}>
                총 {guests.length.toLocaleString()}명
              </th>
            </tr>
            <tr>
              <th className="col-num col-left col-sortable" onClick={() => handleSort('index')}>
                #{arrow('index')}
              </th>
              <th className="col-left col-sortable" onClick={() => handleSort('name')}>
                이름{arrow('name')}
              </th>
              <th className="col-right col-sortable" onClick={() => handleSort('amount')}>
                축의금{arrow('amount')}
              </th>
              <th className="col-center col-sortable" onClick={() => handleSort('meal_tickets')}>
                식권{arrow('meal_tickets')}
              </th>
              <th className="col-left">전달방법</th>
              <th className="col-left">관계</th>
              <th className="col-left">메모</th>
              <th className="col-delete col-center">삭제</th>
            </tr>
          </thead>
          <tbody>
            {sortedGuests.map((guest, idx) => (
              <tr key={guest.id} className={idx % 2 === 1 ? 'row-even' : 'row-odd'}>
                <td className="cell cell-num">{guests.length - guest._origIdx}</td>
                <td className="cell cell-name">{guest.name}</td>
                <td className="cell cell-amount">{guest.amount.toLocaleString()}원</td>
                <td className="cell cell-tickets">{guest.meal_tickets}</td>
                <td className="cell">
                  <select
                    value={guest.delivery_method}
                    onChange={(e) => onUpdate(guest.id, { delivery_method: e.target.value })}
                    className="cell-select"
                  >
                    <option value="">-</option>
                    {DELIVERY_METHODS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="cell">
                  <select
                    value={guest.relationship}
                    onChange={(e) => onUpdate(guest.id, { relationship: e.target.value })}
                    className="cell-select"
                  >
                    <option value="">-</option>
                    {RELATIONSHIPS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="cell">
                  <input
                    type="text"
                    value={guest.memo}
                    onChange={(e) => onUpdate(guest.id, { memo: e.target.value })}
                    placeholder="메모"
                    className="cell-memo-input"
                  />
                </td>
                <td className="cell cell-center">
                  <button
                    type="button"
                    onClick={() => handleDelete(guest.id)}
                    className={`delete-btn ${
                      deleteConfirm === guest.id ? 'delete-btn--confirm' : 'delete-btn--idle'
                    }`}
                  >
                    {deleteConfirm === guest.id ? '확인' : '✕'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
