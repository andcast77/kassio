export type CustomerFormValues = {
  name: string
  email: string
  phone: string
  taxId: string
  address: string
  city: string
  state: string
  postalCode: string
  country: string
}

type Props = {
  values: CustomerFormValues
  onChange: (values: CustomerFormValues) => void
  compact?: boolean
}

export function CustomerFormFields({ values, onChange, compact }: Props) {
  function set<K extends keyof CustomerFormValues>(key: K, value: CustomerFormValues[K]) {
    onChange({ ...values, [key]: value })
  }

  return (
    <div className={compact ? 'customer-form customer-form-compact' : 'customer-form'}>
      <label>
        Nombre *
        <input
          value={values.name}
          onChange={(e) => set('name', e.target.value)}
          required
          placeholder="Ej: Juan Pérez"
        />
      </label>
      <label>
        CUIT / DNI
        <input
          value={values.taxId}
          onChange={(e) => set('taxId', e.target.value)}
          placeholder="20-12345678-9"
        />
      </label>
      <label>
        Email
        <input
          type="email"
          value={values.email}
          onChange={(e) => set('email', e.target.value)}
          placeholder="juan@example.com"
        />
      </label>
      <label>
        Teléfono
        <input
          value={values.phone}
          onChange={(e) => set('phone', e.target.value)}
          placeholder="+54 11 1234 5678"
        />
      </label>
      <label className="customer-form-span-2">
        Dirección
        <input
          value={values.address}
          onChange={(e) => set('address', e.target.value)}
          placeholder="Calle 123, piso/depto"
        />
      </label>
      <label>
        Ciudad
        <input value={values.city} onChange={(e) => set('city', e.target.value)} placeholder="Buenos Aires" />
      </label>
      <label>
        Provincia
        <input value={values.state} onChange={(e) => set('state', e.target.value)} placeholder="CABA" />
      </label>
      <label>
        Código postal
        <input value={values.postalCode} onChange={(e) => set('postalCode', e.target.value)} placeholder="1425" />
      </label>
      <label>
        País
        <input value={values.country} onChange={(e) => set('country', e.target.value)} placeholder="Argentina" />
      </label>
    </div>
  )
}
