import type { Sale } from '../../api'
import { TicketPrint, printTicket } from './TicketPrint'

type Props = {
  open: boolean
  sale: Sale | null
  paidAmount?: number
  onClose: () => void
}

export function ReceiptModal({ open, sale, paidAmount, onClose }: Props) {
  if (!open || !sale) return null

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal card ticket-modal">
        <TicketPrint sale={sale} paidAmount={paidAmount} />
        <div className="row">
          <button type="button" onClick={() => printTicket(sale, paidAmount)}>
            Imprimir
          </button>
          <button type="button" className="ghost" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
