import type { Sale } from '../../api'
import { TicketPrint, printTicket } from './TicketPrint'

type Props = {
  open: boolean
  sale: Sale | null
  onClose: () => void
  onPrintAndContinue: () => void
}

export function ReceiptModal({ open, sale, onClose, onPrintAndContinue }: Props) {
  if (!open || !sale) return null

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal card ticket-modal">
        <TicketPrint sale={sale} />
        <div className="row pos-receipt-actions">
          <button type="button" onClick={() => printTicket(sale)}>
            Imprimir
          </button>
          <button type="button" onClick={onPrintAndContinue}>
            Imprimir y continuar
          </button>
          <button type="button" className="ghost" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
