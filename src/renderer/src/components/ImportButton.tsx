import { useRef } from 'react'
import type { GuestInput } from '../../../preload/index.d'

interface ImportButtonProps {
  onImport: (guests: GuestInput[]) => Promise<void>
}

export default function ImportButton({ onImport }: ImportButtonProps): React.JSX.Element {
  const fileRef = useRef<HTMLInputElement>(null)

  const parseCsv = (text: string): GuestInput[] => {
    const lines = text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .trim()
      .split('\n')
    if (lines.length < 2) return []

    const parseRow = (line: string): string[] => {
      const result: string[] = []
      let cur = ''
      let inQuote = false
      for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (ch === '"') {
          if (inQuote && line[i + 1] === '"') {
            cur += '"'
            i++
          } else {
            inQuote = !inQuote
          }
        } else if (ch === ',' && !inQuote) {
          result.push(cur)
          cur = ''
        } else {
          cur += ch
        }
      }
      result.push(cur)
      return result
    }

    const parseAmount = (raw: string): number =>
      Number(raw.replace(/,/g, '').replace(/원/g, '').trim()) || 0

    // 헤더 행 탐색 — "이름" 컬럼이 있는 첫 번째 행
    let headerLineIdx = -1
    let headers: string[] = []
    for (let i = 0; i < lines.length; i++) {
      const cols = parseRow(lines[i]).map((h) => h.trim())
      if (cols.includes('이름')) {
        headerLineIdx = i
        headers = cols
        break
      }
    }
    if (headerLineIdx === -1) return []

    const idx = (name: string): number => headers.indexOf(name)
    const iIdx = idx('이름')
    const aIdx = idx('축의금')
    const tIdx = idx('식권')
    const dIdx = idx('전달방법')
    const rIdx = idx('관계')
    const mIdx = idx('메모')

    if (iIdx === -1 || aIdx === -1) return []

    const guests: GuestInput[] = []
    for (let i = headerLineIdx + 1; i < lines.length; i++) {
      const cols = parseRow(lines[i])
      const name = cols[iIdx]?.trim()
      const amount = parseAmount(cols[aIdx] ?? '')
      if (!name || amount <= 0) continue
      guests.push({
        name,
        amount,
        meal_tickets: Number(cols[tIdx]?.trim()) || 0,
        delivery_method: dIdx !== -1 ? cols[dIdx]?.trim() ?? '' : '',
        relationship: rIdx !== -1 ? cols[rIdx]?.trim() ?? '' : '',
        memo: mIdx !== -1 ? cols[mIdx]?.trim() ?? '' : '',
        gift: ''
      })
    }
    return guests
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const guests = parseCsv(text)
    if (guests.length > 0) await onImport(guests)
    e.target.value = ''
  }

  return (
    <>
      <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFile} />
      <button type="button" className="import-btn" onClick={() => fileRef.current?.click()}>
        📥 CSV 가져오기
      </button>
    </>
  )
}
