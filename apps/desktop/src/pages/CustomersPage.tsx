import { useEffect, useState } from 'react'
import {
  createCustomer,
  deleteCustomer,
  fetchCustomersPage,
  updateCustomer,
  type Customer,
} from '../api'
import { CustomerFormFields } from '../components/customers/CustomerFormFields'
import {
  customerFormFromApi,
  customerFormToPayload,
  customerLocationLabel,
  emptyCustomerForm,
} from '../lib/customerForm'
import type { CustomerFormValues } from '../components/customers/CustomerFormFields'

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CustomerFormValues>(emptyCustomerForm())

  useEffect(() => {
    setPage(1)
  }, [search])

  useEffect(() => {
    void load()
  }, [search, page])

  async function load() {
    setLoading(true)
    setError(null)
    const res = await fetchCustomersPage({ search, page, limit: 20 })
    if (res.success) {
      setCustomers(res.data.customers)
      setTotalPages(res.data.pagination.totalPages)
    } else {
      setError(res.message)
    }
    setLoading(false)
  }

  function startEdit(customer: Customer) {
    setEditingId(customer.id)
    setForm(customerFormFromApi(customer))
    setError(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyCustomerForm())
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload = customerFormToPayload(form)
    const res = editingId
      ? await updateCustomer(editingId, payload)
      : await createCustomer(payload)

    setSaving(false)
    if (!res.success) {
      setError(res.message)
      return
    }

    cancelEdit()
    await load()
  }

  async function handleDelete(customer: Customer) {
    if (!window.confirm(`¿Eliminar a ${customer.name}?`)) return
    setError(null)
    const res = await deleteCustomer(customer.id)
    if (!res.success) {
      setError(res.message)
      return
    }
    if (editingId === customer.id) cancelEdit()
    await load()
  }

  return (
    <div className="stack-lg">
      <section className="card">
        <div className="crud-toolbar">
          <label className="grow">
            Buscar cliente
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nombre, email, teléfono, CUIT/DNI o ciudad"
            />
          </label>
          {editingId && (
            <button type="button" className="ghost" onClick={cancelEdit}>
              Cancelar edición
            </button>
          )}
        </div>
      </section>

      <section className="card">
        <h2>{editingId ? 'Editar cliente' : 'Nuevo cliente'}</h2>
        <form onSubmit={handleSubmit} className="stack">
          <CustomerFormFields values={form} onChange={setForm} />
          <div className="form-actions">
            <button type="submit" disabled={saving}>
              {saving ? 'Guardando…' : editingId ? 'Actualizar' : 'Guardar cliente'}
            </button>
          </div>
        </form>
        {error && <p className="error">{error}</p>}
      </section>

      <section className="card">
        <h2>Clientes</h2>
        {loading ? (
          <p className="muted">Cargando…</p>
        ) : customers.length === 0 ? (
          <p className="muted">No hay clientes{search ? ' para esa búsqueda' : ''}.</p>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Contacto</th>
                  <th>CUIT/DNI</th>
                  <th>Ubicación</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.name}</strong>
                      {c.address && <div className="muted table-sub">{c.address}</div>}
                    </td>
                    <td>
                      {c.email && <div>{c.email}</div>}
                      {c.phone && <div className="muted">{c.phone}</div>}
                      {!c.email && !c.phone && '—'}
                    </td>
                    <td>{c.taxId ?? '—'}</td>
                    <td>{customerLocationLabel(c) ?? '—'}</td>
                    <td>
                      <div className="row-actions">
                        <button type="button" className="ghost" onClick={() => startEdit(c)}>
                          Editar
                        </button>
                        <button type="button" className="ghost" onClick={() => void handleDelete(c)}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  type="button"
                  className="ghost"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Anterior
                </button>
                <span className="muted">
                  Página {page} de {totalPages}
                </span>
                <button
                  type="button"
                  className="ghost"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
