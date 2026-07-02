import type { Sale } from '../../api'

type Props = {
  sale: Sale
  businessName?: string
  paidAmount?: number
}

export function TicketPrint({ sale, businessName = 'Kassio', paidAmount }: Props) {
  const change =
    paidAmount != null && sale.paymentMethod === 'CASH'
      ? Math.max(0, paidAmount - Number(sale.total))
      : null

  return (
    <div className="ticket">
      <header className="ticket-header">
        <strong>{businessName}</strong>
        <p>Ticket #{sale.ticketNumber}</p>
        <p className="muted">{new Date(sale.createdAt).toLocaleString('es-AR')}</p>
        <p className="muted">Cajero: {sale.user?.name}</p>
      </header>

      <table className="ticket-lines">
        <tbody>
          {sale.items?.map((item) => (
            <tr key={item.id}>
              <td>
                {item.product?.name ?? 'Producto'} × {item.quantity}
              </td>
              <td>${item.lineTotal}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <footer className="ticket-footer">
        <div className="ticket-row">
          <span>Subtotal</span>
          <span>${sale.subtotal}</span>
        </div>
        {Number(sale.discount) > 0 && (
          <div className="ticket-row">
            <span>Descuento</span>
            <span>-${sale.discount}</span>
          </div>
        )}
        <div className="ticket-row ticket-total">
          <span>Total</span>
          <span>${sale.total}</span>
        </div>
        <div className="ticket-row">
          <span>Pago</span>
          <span>{sale.paymentMethod}</span>
        </div>
        {paidAmount != null && sale.paymentMethod === 'CASH' && (
          <>
            <div className="ticket-row">
              <span>Recibido</span>
              <span>${paidAmount.toFixed(2)}</span>
            </div>
            <div className="ticket-row">
              <span>Vuelto</span>
              <span>${change?.toFixed(2)}</span>
            </div>
          </>
        )}
      </footer>

      <p className="ticket-thanks">¡Gracias por su compra!</p>
    </div>
  )
}

export function printTicket(sale: Sale, paidAmount?: number) {
  const win = window.open('', '_blank', 'width=400,height=600')
  if (!win) return

  const paidBlock =
    paidAmount != null && sale.paymentMethod === 'CASH'
      ? `<p>Recibido: $${paidAmount.toFixed(2)}</p><p>Vuelto: $${Math.max(0, paidAmount - Number(sale.total)).toFixed(2)}</p>`
      : ''

  win.document.write(`
    <!DOCTYPE html>
    <html><head><title>Ticket #${sale.ticketNumber}</title>
    <style>
      body { font-family: monospace; width: 280px; margin: 1rem auto; font-size: 12px; }
      h1 { font-size: 14px; margin: 0 0 4px; }
      .line { display: flex; justify-content: space-between; margin: 2px 0; }
      .total { font-weight: bold; border-top: 1px dashed #000; margin-top: 8px; padding-top: 4px; }
    </style></head><body>
    <h1>Kassio</h1>
    <p>Ticket #${sale.ticketNumber}</p>
    <p>${new Date(sale.createdAt).toLocaleString('es-AR')}</p>
    <hr/>
    ${sale.items?.map((i) => `<div class="line"><span>${i.product?.name} × ${i.quantity}</span><span>$${i.lineTotal}</span></div>`).join('') ?? ''}
    <div class="line total"><span>Total</span><span>$${sale.total}</span></div>
    <p>Pago: ${sale.paymentMethod}</p>
    ${paidBlock}
    <p>¡Gracias!</p>
    </body></html>
  `)
  win.document.close()
  win.focus()
  win.print()
}
