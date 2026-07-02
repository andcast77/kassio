import type { CustomerFormValues } from '../components/customers/CustomerFormFields'

export function emptyCustomerForm(): CustomerFormValues {
  return {
    name: '',
    email: '',
    phone: '',
    taxId: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Argentina',
  }
}

export function customerFormFromApi(c: {
  name: string
  email?: string | null
  phone?: string | null
  taxId?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  postalCode?: string | null
  country?: string | null
}): CustomerFormValues {
  return {
    name: c.name,
    email: c.email ?? '',
    phone: c.phone ?? '',
    taxId: c.taxId ?? '',
    address: c.address ?? '',
    city: c.city ?? '',
    state: c.state ?? '',
    postalCode: c.postalCode ?? '',
    country: c.country ?? '',
  }
}

export function customerFormToPayload(form: CustomerFormValues) {
  return {
    name: form.name.trim(),
    email: form.email.trim() || null,
    phone: form.phone.trim() || null,
    taxId: form.taxId.trim() || null,
    address: form.address.trim() || null,
    city: form.city.trim() || null,
    state: form.state.trim() || null,
    postalCode: form.postalCode.trim() || null,
    country: form.country.trim() || null,
  }
}

export function customerLocationLabel(c: {
  city?: string | null
  state?: string | null
  country?: string | null
}): string | null {
  const parts = [c.city, c.state, c.country].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : null
}
