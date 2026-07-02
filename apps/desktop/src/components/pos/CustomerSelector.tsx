import { useEffect, useRef, useState } from 'react'
import { createCustomer, fetchCustomersPage, type Customer } from '../../api'
import { CustomerFormFields } from '../customers/CustomerFormFields'
import { customerFormToPayload, customerLocationLabel, emptyCustomerForm } from '../../lib/customerForm'
import type { CustomerFormValues } from '../customers/CustomerFormFields'
import { cartStore, useCartStore } from '../../store/cartStore'

type Props = {
  onNotify?: (message: { type: 'ok' | 'error'; text: string }) => void
}

const DEBOUNCE_MS = 300

function customerHint(c: Customer): string {
  const parts = [c.taxId, c.phone, c.email, customerLocationLabel(c)].filter(Boolean)
  return parts.join(' · ')
}

export function CustomerSelector({ onNotify }: Props) {
  const customerId = useCartStore((s) => s.getState().customerId)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [form, setForm] = useState<CustomerFormValues>(emptyCustomerForm())
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [search])

  useEffect(() => {
    if (!open) return
    void loadResults(debouncedSearch)
  }, [debouncedSearch, open])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function loadResults(term: string) {
    setLoading(true)
    const res = await fetchCustomersPage({ search: term || undefined, limit: 10 })
    if (res.success) setResults(res.data.customers)
    setLoading(false)
  }

  function clearSelection() {
    cartStore.setCustomer(null)
    setSelectedLabel('')
    setSearch('')
    setOpen(false)
  }

  function selectCustomer(customer: Customer) {
    cartStore.setCustomer(customer.id)
    setSelectedLabel(customer.name)
    setSearch('')
    setOpen(false)
    setShowCreate(false)
  }

  function beginSearch() {
    if (customerId) {
      cartStore.setCustomer(null)
      setSelectedLabel('')
      setSearch('')
    }
    setOpen(true)
  }

  function openCreate() {
    setFormError(null)
    setForm({ ...emptyCustomerForm(), name: search.trim() })
    setShowCreate(true)
    setOpen(false)
  }

  function closeCreate() {
    setShowCreate(false)
    setFormError(null)
    setForm(emptyCustomerForm())
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)

    const res = await createCustomer(customerFormToPayload(form))

    setSaving(false)
    if (!res.success) {
      setFormError(res.message)
      return
    }

    selectCustomer(res.data.customer)
    closeCreate()
    onNotify?.({ type: 'ok', text: `${res.data.customer.name} agregado y seleccionado` })
  }

  const inputValue = customerId ? selectedLabel : search
  const showDropdown = open

  return (
    <>
      <div className="pos-customer card" ref={containerRef}>
        <label className="pos-customer-label">Cliente (opcional)</label>

        <div className="pos-customer-row">
          <div className="pos-customer-autocomplete">
            <input
              type="text"
              className="pos-customer-input"
              placeholder="Buscar por nombre, CUIT/DNI, email, teléfono o ciudad…"
              value={inputValue}
              onChange={(e) => {
                setSearch(e.target.value)
                if (customerId) {
                  cartStore.setCustomer(null)
                  setSelectedLabel('')
                }
                setOpen(true)
              }}
              onFocus={beginSearch}
              onClick={beginSearch}
              autoComplete="off"
              spellCheck={false}
            />

            {showDropdown && (
              <ul className="pos-customer-dropdown" role="listbox">
                <li>
                  <button type="button" className="pos-customer-option muted" onClick={clearSelection}>
                    Sin cliente
                  </button>
                </li>
                {loading && <li className="pos-customer-hint">Buscando…</li>}
                {!loading && results.length === 0 && debouncedSearch.length > 0 && (
                  <li className="pos-customer-hint">Sin resultados</li>
                )}
                {!loading &&
                  results.map((c) => {
                    const hint = customerHint(c)
                    return (
                      <li key={c.id}>
                        <button
                          type="button"
                          className="pos-customer-option"
                          onClick={() => selectCustomer(c)}
                        >
                          <strong>{c.name}</strong>
                          {hint && <span className="muted">{hint}</span>}
                        </button>
                      </li>
                    )
                  })}
              </ul>
            )}
          </div>

          {customerId && (
            <button
              type="button"
              className="ghost pos-customer-clear"
              onClick={clearSelection}
              title="Quitar cliente"
            >
              ✕
            </button>
          )}

          <button type="button" className="ghost pos-customer-new" onClick={openCreate}>
            + Nuevo
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="modal-backdrop" role="presentation" onClick={closeCreate}>
          <form
            className="modal card pos-customer-modal pos-customer-modal-scroll"
            onSubmit={handleCreate}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Nuevo cliente</h2>
            <CustomerFormFields values={form} onChange={setForm} compact />
            {formError && <p className="error">{formError}</p>}
            <div className="row">
              <button type="button" className="ghost" onClick={closeCreate}>
                Cancelar
              </button>
              <button type="submit" disabled={saving}>
                {saving ? 'Guardando…' : 'Crear y seleccionar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
