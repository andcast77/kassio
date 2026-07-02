import { useEffect, useState } from 'react'
import { createProduct, fetchCategories, fetchProducts, type Product } from '../api'

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('0')
  const [categoryId, setCategoryId] = useState('')

  async function load() {
    const [p, c] = await Promise.all([fetchProducts(search), fetchCategories()])
    if (p.success) setProducts(p.data.products)
    if (c.success) setCategories(c.data.categories.map((x) => ({ id: x.id, name: x.name })))
  }

  useEffect(() => {
    void load()
  }, [search])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const res = await createProduct({
      name,
      sku: sku || null,
      price: Number(price),
      stockQuantity: Number(stock),
      categoryId: categoryId || null,
    })
    if (!res.success) {
      setError(res.message)
      return
    }
    setName('')
    setSku('')
    setPrice('')
    setStock('0')
    setCategoryId('')
    await load()
  }

  return (
    <div className="stack-lg">
      <section className="card">
        <div className="row">
          <label className="grow">
            Buscar
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nombre, SKU, barras" />
          </label>
        </div>
      </section>

      <section className="card">
        <h2>Nuevo producto</h2>
        <form onSubmit={handleCreate} className="form-grid">
          <label>Nombre<input value={name} onChange={(e) => setName(e.target.value)} required /></label>
          <label>SKU<input value={sku} onChange={(e) => setSku(e.target.value)} /></label>
          <label>Precio<input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required /></label>
          <label>Stock<input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} /></label>
          <label>
            Categoría
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <div className="form-actions"><button type="submit">Guardar</button></div>
        </form>
        {error && <p className="error">{error}</p>}
      </section>

      <section className="card">
        <h2>Catálogo ({products.length})</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>SKU</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Categoría</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.sku ?? '—'}</td>
                <td>${p.price}</td>
                <td>{p.stockQuantity}</td>
                <td>{p.category?.name ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
