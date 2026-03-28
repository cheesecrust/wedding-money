import type { Guest } from '../../../preload/index.d'

interface SummaryProps {
  guests: Guest[]
}

export default function Summary({ guests }: SummaryProps): React.JSX.Element {
  const totalAmount = guests.reduce((sum, g) => sum + g.amount, 0)
  const totalTickets = guests.reduce((sum, g) => sum + g.meal_tickets, 0)
  const totalCount = guests.length
  const avgAmount = totalCount > 0 ? Math.round(totalAmount / totalCount) : 0

  const sortedAmounts = guests.map((g) => g.amount).sort((a, b) => a - b)
  const medianAmount = totalCount > 0 ? sortedAmounts[Math.floor((totalCount - 1) / 2)] : 0

  const cards = [
    { label: '총 축의금', value: `${totalAmount.toLocaleString()}원`, highlight: true },
    { label: '총 식권', value: `${totalTickets.toLocaleString()}장`, highlight: false },
    { label: '총 인원', value: `${totalCount.toLocaleString()}명`, highlight: false },
    { label: '1인 평균', value: `${avgAmount.toLocaleString()}원`, highlight: true },
    { label: '중위 축의금', value: `${medianAmount.toLocaleString()}원`, highlight: true }
  ]

  return (
    <div className="summary-container">
      <h2 className="summary-heading">요약</h2>
      <table className="summary-table">
        <tbody>
          {cards.map((card) => (
            <tr key={card.label} className="summary-table-row">
              <th className="summary-table-label">{card.label}</th>
              <td
                className={`summary-table-value ${card.highlight ? 'summary-table-value--highlight' : 'summary-table-value--normal'}`}
              >
                {card.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
