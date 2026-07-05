import type { Sale } from '../../api'
import { formatCurrency } from '../../lib/formatCurrency'
import { paymentMethodLabel } from '../../lib/paymentLabels'

type Props = {
  sale: Sale
  businessName?: string
}

export function TicketPrint({ sale, businessName = 'Kassio' }: Props) {
  const paidAmount = sale.paidAmount != null ? Number(sale.paidAmount) : null
  const change = sale.change != null ? Number(sale.change) : null

  return (
    <div className="ticket">
      <header className="ticket-header">
        <strong>{businessName}</strong>
        <p>Ticket #{sale.ticketNumber}</p>
        {sale.voucherFormatted && (
          <p className="muted">{sale.voucherTypeName} {sale.voucherFormatted}</p>
        )}
        <p className="muted">{new Date(sale.createdAt).toLocaleString('es-AR')}</p>
        <p className="muted">Cajero: {sale.user?.name}</p>
        {sale.customer && (
          <p className="muted">
            Cliente: {sale.customer.name}
            {'taxId' in sale.customer && sale.customer.taxId ? ` · ${sale.customer.taxId}` : ''}
          </p>
        )}
      </header>

      <table className="ticket-lines">
        <tbody>
          {sale.items?.map((item) => (
            <tr key={item.id}>
              <td>
                {item.product?.name ?? 'Producto'} × {item.quantity}
              </td>
              <td>{formatCurrency(Number(item.lineTotal))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <footer className="ticket-footer">
        <div className="ticket-row">
          <span>Subtotal</span>
          <span>{formatCurrency(Number(sale.subtotal))}</span>
        </div>
        {Number(sale.discount) > 0 && (
          <div className="ticket-row">
            <span>Descuento</span>
            <span>-{formatCurrency(Number(sale.discount))}</span>
          </div>
        )}
        {Number(sale.tax) > 0 && (
          <div className="ticket-row">
            <span>IVA</span>
            <span>{formatCurrency(Number(sale.tax))}</span>
          </div>
        )}
        <div className="ticket-row ticket-total">
          <span>Total</span>
          <span>{formatCurrency(Number(sale.total))}</span>
        </div>
        <div className="ticket-row">
          <span>Pago</span>
          <span>{paymentMethodLabel(sale.paymentMethod)}</span>
        </div>
        {paidAmount != null && sale.paymentMethod === 'CASH' && (
          <>
            <div className="ticket-row">
              <span>Recibido</span>
              <span>{formatCurrency(paidAmount)}</span>
            </div>
            <div className="ticket-row">
              <span>Vuelto</span>
              <span>{formatCurrency(change ?? 0)}</span>
            </div>
          </>
        )}
        {sale.notes && (
          <p className="muted ticket-notes">Notas: {sale.notes}</p>
        )}
      </footer>

      <p className="ticket-thanks">¡Gracias por su compra!</p>
    </div>
  )
}

export function printTicket(sale: Sale, businessName = 'Kassio') {
  const win = window.open('', '_blank', 'width=400,height=600')
  if (!win) return

  const paidAmount = sale.paidAmount != null ? Number(sale.paidAmount) : null
  const change = sale.change != null ? Number(sale.change) : null
  const paidBlock =
    paidAmount != null && sale.paymentMethod === 'CASH'
      ? `<p>Recibido: ${paidAmount.toFixed(2)}</p><p>Vuelto: ${(change ?? 0).toFixed(2)}</p>`
      : ''

  const customerBlock = sale.customer
    ? `<p>Cliente: ${sale.customer.name}${'taxId' in sale.customer && sale.customer.taxId ? ` (${sale.customer.taxId})` : ''}</p>`
    : ''

  const taxBlock =
    Number(sale.tax) > 0 ? `<div class="line"><span>IVA</span><span>$${sale.tax}</span></div>` : ''

  win.document.write(`
    <!DOCTYPE html>
    <html><head><title>Ticket #${sale.ticketNumber}</title>
    <style>
      body { font-family: monospace; width: 280px; margin: 1rem auto; font-size: 12px; }
      h1 { font-size: 14px; margin: 0 0 4px; }
      .line { display: flex; justify-content: space-between; margin: 2px 0; }
      .total { font-weight: bold; border-top: 1px dashed #000; margin-top: 8px; padding-top: 4px; }
    </style></head><body>
    <h1>${businessName}</h1>
    <p>Ticket #${sale.ticketNumber}</p>
    ${sale.voucherFormatted ? `<p>${sale.voucherTypeName} ${sale.voucherFormatted}</p>` : ''}
    <p>${new Date(sale.createdAt).toLocaleString('es-AR')}</p>
    ${customerBlock}
    <hr/>
    ${sale.items?.map((i) => `<div class="line"><span>${i.product?.name} × ${i.quantity}</span><span>$${i.lineTotal}</span></div>`).join('') ?? ''}
    <div class="line total"><span>Total</span><span>$${sale.total}</span></div>
    ${taxBlock}
    <p>Pago: ${paymentMethodLabel(sale.paymentMethod)}</p>
    ${paidBlock}
    ${sale.notes ? `<p>Notas: ${sale.notes}</p>` : ''}
    <p>¡Gracias!</p>
    </body></html>
  `)
  win.document.close()
  win.focus()
  win.print()
}
