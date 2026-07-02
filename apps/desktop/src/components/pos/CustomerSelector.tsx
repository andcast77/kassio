import { useEffect, useState } from 'react'
import { fetchCustomers, type Customer } from '../../api'
import { cartStore, useCartStore } from '../../store/cartStore'

export function CustomerSelector() {
  const customerId = useCartStore((s) => s.getState().customerId)
  const [customers, setCustomers] = useState<Customer[]>([])

  useEffect(() => {
    void fetchCustomers().then((res) => {
      if (res.success) setCustomers(res.data.customers)
    })
  }, [])

  return (
    <div className="pos-customer card">
      <label>
        Cliente (opcional)
        <select
          value={customerId ?? ''}
          onChange={(e) => cartStore.setCustomer(e.target.value || null)}
        >
          <option value="">Sin cliente</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
