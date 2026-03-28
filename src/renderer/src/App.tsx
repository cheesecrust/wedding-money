import { useState, useEffect, useMemo } from 'react'
import type { Guest, GuestInput } from '../../preload/index.d'
import Summary from './components/Summary'
import SearchFilter from './components/SearchBar'
import GuestForm from './components/GuestForm'
import GuestTable from './components/GuestList'
import ExportButton from './components/ExportButton'
import ImportButton from './components/ImportButton'
import Toast from './components/Toast'
import Analytics from './components/Analytics'

function App(): React.JSX.Element {
  const [guests, setGuests] = useState<Guest[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [relationFilter, setRelationFilter] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'input' | 'analytics'>('input')

  const loadGuests = (): void => {
    window.api.getGuests().then(setGuests)
  }

  useEffect(() => {
    let ignore = false
    window.api.getGuests().then((data) => {
      if (!ignore) setGuests(data)
    })
    return () => {
      ignore = true
    }
  }, [])

  const filteredGuests = useMemo(() => {
    let result = guests
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter((g) => g.name.toLowerCase().includes(q))
    }
    if (relationFilter) {
      result = result.filter((g) => g.relationship === relationFilter)
    }
    return result
  }, [guests, searchQuery, relationFilter])

  const handleAdd = async (input: GuestInput): Promise<void> => {
    await window.api.addGuest(input)
    await loadGuests()
    setToast(`✅ ${input.name}님이 등록되었습니다`)
  }

  const handleUpdate = async (id: number, partial: Partial<GuestInput>): Promise<void> => {
    await window.api.updateGuest(id, partial)
    await loadGuests()
  }

  const handleDelete = async (id: number): Promise<void> => {
    await window.api.deleteGuest(id)
    await loadGuests()
    setToast('🗑️ 삭제되었습니다')
  }

  const handleImport = async (inputs: GuestInput[]): Promise<void> => {
    await Promise.all(inputs.map((g) => window.api.addGuest(g)))
    await loadGuests()
    setToast(`✅ ${inputs.length}명 가져오기 완료`)
  }

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-header-left">
          <h1 className="app-title">축의금</h1>
          <div className="app-tabs">
            <button
              className={`app-tab ${activeTab === 'input' ? 'app-tab--active' : ''}`}
              onClick={() => setActiveTab('input')}
            >
              입력
            </button>
            <button
              className={`app-tab ${activeTab === 'analytics' ? 'app-tab--active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              분석
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <ImportButton onImport={handleImport} />
          <ExportButton guests={guests} />
        </div>
      </header>

      <div className="app-body">
        {activeTab === 'input' ? (
          <>
            <div className="app-left-panel">
              <GuestForm onSave={handleAdd} />
              <Summary guests={filteredGuests} />
            </div>

            <div className="app-right-panel">
              <SearchFilter
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                activeFilter={relationFilter}
                onFilterChange={setRelationFilter}
              />
              <div className="app-table-wrap">
                <GuestTable
                  guests={filteredGuests}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="app-analytics-panel">
            <Analytics guests={guests} />
          </div>
        )}
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}

export default App
