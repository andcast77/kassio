import { useState } from 'react'
import { cartStore, useCartStore } from '../../store/cartStore'
import { formatCurrency } from '../../lib/formatCurrency'

/** Collapsible discount (% | $). */
export function SaleAdjustments() {
  const [expanded, setExpanded] = useState(false)
  const discountMode = useCartStore((s) => s.getState().discountMode)
  const discountValue = useCartStore((s) => s.getState().discountValue)
  const subtotalBeforeGlobal = useCartStore((s) => s.getSubtotalBeforeGlobal())
  const discountAmount = useCartStore((s) => s.getGlobalDiscountAmount())

  const previewText =
    subtotalBeforeGlobal > 0 && discountValue > 0
      ? discountMode === 'percent'
        ? `= ${formatCurrency(discountAmount)}`
        : `= ${((discountAmount / subtotalBeforeGlobal) * 100).toFixed(1)}%`
      : null

  return (
    <div className="pos-adjustments">
      <button
        type="button"
        className="ghost pos-adjustments-toggle"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        {expanded ? '▾' : '▸'} Ajustes
      </button>

      {expanded && (
        <div className="pos-adjustments-body">
          <div className="pos-adjustments-row">
            <span className="pos-adjustments-label">Descuento</span>
            <div className="pos-mode-toggle" role="group" aria-label="Modo de descuento">
              <button
                type="button"
                className={`ghost${discountMode === 'percent' ? ' active' : ''}`}
                onClick={() => cartStore.setDiscountMode('percent')}
              >
                %
              </button>
              <button
                type="button"
                className={`ghost${discountMode === 'amount' ? ' active' : ''}`}
                onClick={() => cartStore.setDiscountMode('amount')}
              >
                $
              </button>
            </div>
            <input
              type="number"
              min={0}
              max={discountMode === 'percent' ? 100 : undefined}
              step={discountMode === 'percent' ? 0.1 : 1}
              placeholder="0"
              value={discountValue === 0 ? '' : String(discountValue)}
              onChange={(e) => cartStore.setDiscountValue(parseFloat(e.target.value) || 0)}
            />
            {previewText && <span className="muted pos-adjustments-preview">{previewText}</span>}
          </div>
        </div>
      )}
    </div>
  )
}
