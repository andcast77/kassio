import { useEffect, useState } from 'react'

const DISCOUNT_STEP = 5
const MAX_DISCOUNT = 100

type Props = {
  value: number
  onChange: (percent: number) => void
  disabled?: boolean
  className?: string
  ariaLabel?: string
}

function roundPercent(percent: number): number {
  return Math.round(percent * 100) / 100
}

function clampPercent(percent: number): number {
  return Math.min(MAX_DISCOUNT, Math.max(0, roundPercent(percent)))
}

function formatPercentInput(percent: number): string {
  const value = roundPercent(percent)
  if (Number.isInteger(value)) return String(value)
  return value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
}

function parseDraftPercent(raw: string): number | null {
  const trimmed = raw.trim().replace(',', '.')
  if (trimmed === '' || trimmed === '.') return 0
  const parsed = parseFloat(trimmed)
  if (!Number.isFinite(parsed)) return null
  return clampPercent(parsed)
}

export function DiscountPercentSpinbox({
  value,
  onChange,
  disabled = false,
  className,
  ariaLabel = 'Descuento en porcentaje',
}: Props) {
  const [draft, setDraft] = useState<string | null>(null)
  const percent = roundPercent(value)
  const downDisabled = disabled || percent <= 0

  useEffect(() => {
    setDraft(null)
  }, [value])

  function commit(raw: string) {
    setDraft(null)
    const parsed = parseDraftPercent(raw)
    if (parsed === null) return
    onChange(parsed)
  }

  function step(delta: number) {
    if (disabled) return
    setDraft(null)
    const base =
      draft !== null && draft !== '' && draft !== '.'
        ? parseDraftPercent(draft) ?? percent
        : percent
    onChange(clampPercent(base + delta))
  }

  return (
    <div className={`pos-qty-spinbox percent-spinbox${className ? ` ${className}` : ''}`}>
      <input
        type="text"
        inputMode="decimal"
        className="pos-qty-input percent-spinbox-input"
        aria-label={ariaLabel}
        disabled={disabled}
        value={draft ?? formatPercentInput(value)}
        onChange={(e) => {
          const next = e.target.value.replace(',', '.')
          if (next === '' || /^\d*(\.\d{0,2})?$/.test(next)) {
            setDraft(next)
          }
        }}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
        }}
      />
      <div className="pos-qty-spinners">
        <button
          type="button"
          className="pos-qty-spin"
          aria-label="Aumentar descuento"
          disabled={disabled || percent >= MAX_DISCOUNT}
          onClick={() => step(DISCOUNT_STEP)}
        >
          ▲
        </button>
        <button
          type="button"
          className="pos-qty-spin"
          aria-label="Disminuir descuento"
          disabled={downDisabled}
          onClick={() => step(-DISCOUNT_STEP)}
        >
          ▼
        </button>
      </div>
    </div>
  )
}
