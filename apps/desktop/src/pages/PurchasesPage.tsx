import { useEffect, useState } from 'react'
import {
  createPurchase,
  createSupplier,
  fetchProducts,
  fetchSuppliers,
  type Product,
  type Supplier,
} from '../api'

export function PurchasesPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [supplierId, setSupplierId] = useState('')
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unitCost, setUnitCost] = useState('')
  const [newSupplier, setNewSupplier] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const [s, p] = await Promise.all([fetchSuppliers(), fetchProducts()])
    if (s.success) setSuppliers(s.data.suppliers)
    if (p.success) setProducts(p.data.products)
  }

  useEffect(() => {
    void load()
  }, [])

  async function handleAddSupplier(e: React.FormEvent) {
    e.preventDefault()
    const res = await createSupplier({ name: newSupplier.trim() })
    if (!res.success) {
      setError(res.message)
      return
    }
    setNewSupplier('')
    await load()
  }

  async function handlePurchase(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    const res = await createPurchase({
      supplierId,
      items: [{ productId, quantity: Number(quantity), unitCost: Number(unitCost) }],
    })
    if (!res.success) {
      setError(res.message)
      return
    }
    setMessage('Compra registrada — stock actualizado')
    setQuantity('1')
    setUnitCost('')
    await load()
  }

  return (
    <div className="stack-lg">
      <section className="card">
        <h2>Proveedor rápido</h2>
        <form onSubmit={handleAddSupplier} className="row">
          <label className="grow">
            Nombre
            <input value={newSupplier} onChange={(e) => setNewSupplier(e.target.value)} required />
          </label>
          <button type="submit">Agregar</button>
        </form>
      </section>

      <section className="card">
        <h2>Registrar compra</h2>
        <form onSubmit={handlePurchase} className="form-grid">
          <label>
            Proveedor
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} required>
              <option value="">—</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
          <label>
            Producto
            <select value={productId} onChange={(e) => setProductId(e.target.value)} required>
              <option value="">—</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} (stock {p.stockQuantity})</option>
              ))}
            </select>
          </label>
          <label>Cantidad<input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required /></label>
          <label>Costo unit.<input type="number" min="0" step="0.01" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} required /></label>
          <div className="form-actions"><button type="submit">Confirmar compra</button></div>
        </form>
        {message && <p className="ok">{message}</p>}
        {error && <p className="error">{error}</p>}
      </section>
    </div>
  )
}
