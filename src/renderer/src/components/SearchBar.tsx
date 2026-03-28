const RELATIONSHIPS = [
  '전체',
  '친구',
  '직장동료',
  '친척',
  '선후배',
  '어머니 지인',
  '아버지 지인',
  '기타'
] as const

interface SearchFilterProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  activeFilter: string
  onFilterChange: (value: string) => void
}

export default function SearchFilter({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange
}: SearchFilterProps): React.JSX.Element {
  return (
    <div className="search-container">
      <input
        type="text"
        placeholder="🔍 이름으로 검색..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="search-input"
      />
      <div className="filter-buttons">
        {RELATIONSHIPS.map((rel) => (
          <button
            key={rel}
            type="button"
            onClick={() => onFilterChange(rel === '전체' ? '' : rel)}
            className={`filter-btn ${
              (rel === '전체' && activeFilter === '') || activeFilter === rel
                ? 'filter-btn--active'
                : 'filter-btn--inactive'
            }`}
          >
            {rel}
          </button>
        ))}
      </div>
    </div>
  )
}
