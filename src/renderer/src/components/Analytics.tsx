import type { Guest } from '../../../preload/index.d'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

const CHART_COLORS = ['#3B5998', '#5B8DB8', '#7FB3D3', '#C9A84C', '#9E9E9E', '#607D8B', '#8D6E63']

interface AnalyticsProps {
    guests: Guest[]
}

export default function Analytics({ guests }: AnalyticsProps): React.JSX.Element {
    const totalAmount = guests.reduce((sum, g) => sum + g.amount, 0)
    const totalTickets = guests.reduce((sum, g) => sum + g.meal_tickets, 0)
    const totalCount = guests.length
    const overallAvg = totalCount > 0 ? Math.round(totalAmount / totalCount) : 0
    const median = (() => {
        if (totalCount === 0) return 0
        const sorted = [...guests].map((g) => g.amount).sort((a, b) => a - b)
        const mid = Math.floor(sorted.length / 2)
        return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    })()

    const relStats = (() => {
        const map: Record<string, { count: number; total: number; tickets: number }> = {}
        guests.forEach((g) => {
            const rel = g.relationship || '기타'
            if (!map[rel]) map[rel] = { count: 0, total: 0, tickets: 0 }
            map[rel].count++
            map[rel].total += g.amount
            map[rel].tickets += g.meal_tickets
        })

        const list = Object.entries(map).map(([name, data]) => ({
            name,
            ...data,
            avg: data.count > 0 ? Math.round(data.total / data.count) : 0
        }))

        return list.sort((a, b) => b.total - a.total || b.count - a.count)
    })()

    const relLabels = relStats.map((s) => s.name)
    const relAmounts = relStats.map((s) => s.total)
    const relCounts = relStats.map((s) => s.count)
    const relTickets = relStats.map((s) => s.tickets)
    const relAvgs = relStats.map((s) => s.avg)
    const chartColors = relLabels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length])

    const manWon = (v: number): string => (v / 10000).toLocaleString() + '만'

    const amountBarData = {
        labels: relLabels,
        datasets: [
            {
                label: '축의금 합계',
                data: relAmounts.map((v) => v / 10000),
                backgroundColor: chartColors,
                borderRadius: 4
            }
        ]
    }

    const countDoughnutData = {
        labels: relLabels,
        datasets: [
            {
                data: relCounts,
                backgroundColor: chartColors,
                borderWidth: 1,
                borderColor: '#ffffff'
            }
        ]
    }

    const ticketsBarData = {
        labels: relLabels,
        datasets: [
            {
                label: '식권 합계 (장)',
                data: relTickets,
                backgroundColor: chartColors,
                borderRadius: 4
            }
        ]
    }

    const avgBarData = {
        labels: relLabels,
        datasets: [
            {
                label: '1인 평균 축의금',
                data: relAvgs.map((v) => v / 10000),
                backgroundColor: chartColors,
                borderRadius: 4
            }
        ]
    }

    const top10 = (() => {
        return [...guests].sort((a, b) => b.amount - a.amount).slice(0, 10)
    })()

    const relRankings = (() => {
        const map: Record<string, Guest[]> = {}
        guests.forEach((g) => {
            const rel = g.relationship || '기타'
            if (!map[rel]) map[rel] = []
            map[rel].push(g)
        })
        return Object.entries(map)
            .sort((a, b) => {
                const totalA = a[1].reduce((s, g) => s + g.amount, 0)
                const totalB = b[1].reduce((s, g) => s + g.amount, 0)
                return totalB - totalA
            })
            .map(([rel, list]) => ({
                rel,
                guests: [...list].sort((a, b) => b.amount - a.amount)
            }))
    })()

    const maxTicketsGuest = (() => {
        if (guests.length === 0) return null
        return [...guests].reduce((max, g) => (g.meal_tickets > max.meal_tickets ? g : max), guests[0])
    })()

    if (guests.length === 0) {
        return (
            <div className="analytics-empty">아직 입력된 데이터가 없어요. 첫 손님을 추가해 보세요!</div>
        )
    }

    const toMan = (won: number): string => {
        const man = won / 10000
        return (Number.isInteger(man) ? man : parseFloat(man.toFixed(1))).toLocaleString() + '만원'
    }

    const exportRelCsv = (rel: string, relGuests: Guest[]): void => {
        const header = ['순위', '이름', '축의금', '식권', '전달방법', '관계', '메모']
        const rows = relGuests.map((g, i) => [
            i + 1,
            g.name,
            g.amount,
            g.meal_tickets,
            g.delivery_method || '',
            g.relationship || '',
            g.memo || ''
        ])
        const csv =
            '\uFEFF' +
            [header, ...rows]
                .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
                .join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `축의금_${rel}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    const getRankMedal = (rank: number): string => {
        if (rank === 1) return '🥇 1'
        if (rank === 2) return '🥈 2'
        if (rank === 3) return '🥉 3'
        return rank.toString()
    }

    return (
        <div className="analytics-root">
            <div className="analytics-summary-cards">
                <div className="analytics-card">
                    <p>총 축의금</p>
                    <h3>{toMan(totalAmount)}</h3>
                </div>
                <div className="analytics-card">
                    <p>총 인원</p>
                    <h3>{totalCount.toLocaleString()}명</h3>
                </div>
                <div className="analytics-card">
                    <p>총 식권</p>
                    <h3>{totalTickets.toLocaleString()}장</h3>
                </div>
                <div className="analytics-card">
                    <p>1인 평균</p>
                    <h3>{toMan(overallAvg)}</h3>
                </div>
                <div className="analytics-card">
                    <p>중위값</p>
                    <h3>{toMan(median)}</h3>
                </div>
            </div>

            <div className="analytics-panel table-panel">
                <h3>고마운 사람 Top 10</h3>
                <table className="analytics-table">
                    <thead>
                        <tr>
                            <th>순위</th>
                            <th>이름</th>
                            <th>관계</th>
                            <th className="right">축의금</th>
                        </tr>
                    </thead>
                    <tbody>
                        {top10.map((g) => {
                            const rank = top10.findIndex((x) => x.amount === g.amount) + 1
                            return (
                                <tr key={g.id} className={rank <= 3 ? 'rank-top' : ''}>
                                    <td>{getRankMedal(rank)}</td>
                                    <td>{g.name}</td>
                                    <td>{g.relationship || '-'}</td>
                                    <td className="amount right">{toMan(g.amount)}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            <div className="analytics-rel-rankings">
                {relRankings.map(({ rel, guests: relGuests }) => {
                    const total = relGuests.reduce((s, g) => s + g.amount, 0)
                    return (
                        <div key={rel} className="analytics-panel table-panel">
                            <div className="rel-ranking-header">
                                <h3>
                                    {rel}{' '}
                                    <span className="rel-ranking-meta">
                                        {relGuests.length}명 · 합계 {toMan(total)}
                                    </span>
                                </h3>
                                <button
                                    type="button"
                                    className="rel-export-btn"
                                    onClick={() => exportRelCsv(rel, relGuests)}
                                >
                                    CSV
                                </button>
                            </div>
                            <table className="analytics-table">
                                <thead>
                                    <tr>
                                        <th>순위</th>
                                        <th>이름</th>
                                        <th className="right">축의금</th>
                                        <th className="center">식권</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {relGuests.map((g, i) => (
                                        <tr key={g.id} className={i < 3 ? 'rank-top' : ''}>
                                            <td>{getRankMedal(i + 1)}</td>
                                            <td>{g.name}</td>
                                            <td className="amount right">{toMan(g.amount)}</td>
                                            <td className="center">{g.meal_tickets}장</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                })}
            </div>

            <div className="analytics-grid-2col">
                <div className="analytics-panel">
                    <h3>관계별 축의금 합계</h3>
                    <div className="chart-wrap">
                        <Bar
                            data={amountBarData}
                            options={{
                                maintainAspectRatio: false,
                                plugins: {
                                    tooltip: { callbacks: { label: (ctx) => manWon((ctx.parsed.y ?? 0) * 10000) } }
                                },
                                scales: { y: { ticks: { callback: (v) => v + '만' } } }
                            }}
                        />
                    </div>
                </div>

                <div className="analytics-panel">
                    <h3>관계별 인원 비율</h3>
                    <div className="doughnut-wrap">
                        <div className="chart-wrap">
                            <Doughnut
                                data={countDoughnutData}
                                options={{
                                    maintainAspectRatio: false,
                                    cutout: '65%',
                                    plugins: { legend: { display: false } }
                                }}
                            />
                        </div>
                        <ul className="doughnut-legend">
                            {relStats.map((s, i) => (
                                <li key={s.name} className="doughnut-legend-item">
                                    <span
                                        className="doughnut-legend-dot"
                                        style={{ background: chartColors[i % chartColors.length] }}
                                    />
                                    <span className="doughnut-legend-name">{s.name}</span>
                                    <span className="doughnut-legend-count">{s.count}명</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            <div className="analytics-grid-2col">
                <div className="analytics-panel">
                    <h3>식권 통계</h3>
                    <div className="analytics-tickets-summary">
                        <div className="tc-card">
                            <p>총 식권 수</p>
                            <h4>{totalTickets.toLocaleString()}장</h4>
                        </div>
                        <div className="tc-card">
                            <p>식권 1인 평균</p>
                            <h4>{totalCount > 0 ? (totalTickets / totalCount).toFixed(1) : 0}장</h4>
                        </div>
                        <div className="tc-card">
                            <p>최다 식권</p>
                            <h4>
                                {maxTicketsGuest
                                    ? `${maxTicketsGuest.name} (${maxTicketsGuest.meal_tickets}장)`
                                    : '-'}
                            </h4>
                        </div>
                    </div>
                    <div className="chart-wrap-small">
                        <Bar
                            data={ticketsBarData}
                            options={{
                                indexAxis: 'y',
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } }
                            }}
                        />
                    </div>
                </div>

                <div className="analytics-panel">
                    <h3>1인 평균 비교</h3>
                    <p className="chart-subtitle">전체 평균: {toMan(overallAvg)}</p>
                    <div className="chart-wrap-small">
                        <Bar
                            data={avgBarData}
                            options={{
                                indexAxis: 'y',
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { display: false },
                                    tooltip: { callbacks: { label: (ctx) => manWon((ctx.parsed.x ?? 0) * 10000) } }
                                },
                                scales: { x: { ticks: { callback: (v) => v + '만' } } }
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
