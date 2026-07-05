import { useEffect, useMemo, useRef, useState } from 'react'
import type { Category } from '../../api'

type Props = {
  categories: Category[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

export function CategoryMultiSelect({ categories, selectedIds, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const count = selectedIds.length

  const filteredCategories = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return categories
    return categories.filter((c) => c.name.toLowerCase().includes(term))
  }, [categories, search])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!open) {
      setSearch('')
      return
    }
    window.setTimeout(() => searchInputRef.current?.focus(), 0)
  }, [open])

  function toggle(id: string) {
    onChange(
      selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id],
    )
  }

  return (
    <div className="pos-category-filter" ref={containerRef}>
      <button
        type="button"
        className={`pos-category-filter-trigger${open ? ' is-open' : ''}${count > 0 ? ' has-filters' : ''}`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={
          count > 0 ? `Categorías, ${count} filtros activos` : 'Filtrar por categorías'
        }
        onClick={() => setOpen((v) => !v)}
      >
        <span className="pos-category-filter-label">Categorías</span>
        {count > 0 && (
          <span className="pos-category-filter-badge" aria-hidden>
            {count}
          </span>
        )}
        <span className="pos-category-filter-chevron" aria-hidden />
      </button>

      {open && (
        <div className="pos-category-filter-menu" role="listbox" aria-multiselectable="true">
          <div className="pos-category-filter-search-wrap">
            <input
              ref={searchInputRef}
              type="search"
              className="pos-category-filter-search"
              placeholder="Buscar categoría…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
          <div className="pos-category-filter-toolbar">
            <span className="pos-category-filter-summary">
              {count === 0 ? 'Sin filtros' : `${count} seleccionada${count === 1 ? '' : 's'}`}
            </span>
            <div className="pos-category-filter-toolbar-actions">
              <button
                type="button"
                className="pos-category-filter-link"
                onClick={() => onChange(categories.map((c) => c.id))}
              >
                Todas
              </button>
              <button
                type="button"
                className="pos-category-filter-link"
                disabled={count === 0}
                onClick={() => onChange([])}
              >
                Limpiar
              </button>
            </div>
          </div>
          <ul className="pos-category-filter-list">
            {filteredCategories.length === 0 ? (
              <li className="pos-category-filter-empty muted">Sin resultados</li>
            ) : (
              filteredCategories.map((cat) => {
                const selected = selectedIds.includes(cat.id)
                return (
                  <li key={cat.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={`pos-category-filter-option${selected ? ' is-selected' : ''}`}
                      onClick={() => toggle(cat.id)}
                    >
                      <span className="pos-category-filter-check" aria-hidden>
                        {selected ? '✓' : ''}
                      </span>
                      <span className="pos-category-filter-name">{cat.name}</span>
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
