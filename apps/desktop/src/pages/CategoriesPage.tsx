import { useEffect, useState } from 'react'
import { createCategory, fetchCategories, type Category } from '../api'

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const res = await fetchCategories()
    if (res.success) setCategories(res.data.categories)
  }

  useEffect(() => {
    void load()
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const res = await createCategory(name.trim())
    if (!res.success) {
      setError(res.message)
      return
    }
    setName('')
    await load()
  }

  return (
    <div className="stack-lg">
      <section className="card">
        <h2>Nueva categoría</h2>
        <form onSubmit={handleCreate} className="row">
          <label className="grow">
            Nombre
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <button type="submit">Crear</button>
        </form>
        {error && <p className="error">{error}</p>}
      </section>

      <section className="card">
        <table className="data-table">
          <thead>
            <tr><th>Nombre</th><th>Productos</th><th>Activa</th></tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c._count?.products ?? 0}</td>
                <td>{c.active ? 'Sí' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
