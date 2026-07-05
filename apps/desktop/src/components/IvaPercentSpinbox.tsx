import { useEffect, useState } from 'react'

const IVA_STEP_PERCENT = 10.5
const MAX_IVA_PERCENT = 100

type Props = {
  value: number
  onChange: (decimalRate: number) => void
  disabled?: boolean
  className?: string
  ariaLabel?: string
  /** Si se define, valor al borrar o ingresar dato inválido (ej. IVA del catálogo). */
  resetRate?: number
}

export function roundIvaPercent(percent: number): number {
  return Math.round(percent * 100) / 100
}

export function clampIvaPercent(percent: number): number {
  return Math.min(MAX_IVA_PERCENT, Math.max(0, roundIvaPercent(percent)))
}

export function formatIvaPercentInput(decimalRate: number): string {
  const percent = roundIvaPercent(decimalRate * 100)
  if (Number.isInteger(percent)) return String(percent)
  return percent.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
}

function parseDraftPercent(raw: string): number | null {
  const trimmed = raw.trim().replace(',', '.')
  if (trimmed === '' || trimmed === '.') return 0
  const parsed = parseFloat(trimmed)
  if (!Number.isFinite(parsed)) return null
  return clampIvaPercent(parsed)
}

export function IvaPercentSpinbox({
  value,
  onChange,
  disabled = false,
  className,
  ariaLabel = 'IVA en porcentaje',
  resetRate,
}: Props) {
  const [draft, setDraft] = useState<string | null>(null)
  const percent = roundIvaPercent(value * 100)
  const downDisabled = disabled || percent <= 0

  useEffect(() => {
    setDraft(null)
  }, [value])

  function commit(raw: string) {
    setDraft(null)
    const trimmed = raw.trim().replace(',', '.')
    if (trimmed === '' || trimmed === '.') {
      onChange(resetRate ?? 0)
      return
    }
    const parsed = parseDraftPercent(raw)
    if (parsed === null) {
      if (resetRate != null) onChange(resetRate)
      return
    }
    onChange(parsed / 100)
  }

  function step(delta: number) {
    if (disabled) return
    setDraft(null)
    const base =
      draft !== null && draft !== '' && draft !== '.'
        ? parseDraftPercent(draft) ?? percent
        : percent
    onChange(clampIvaPercent(base + delta) / 100)
  }

  return (
    <div className={`pos-qty-spinbox iva-percent-spinbox${className ? ` ${className}` : ''}`}>
      <input
        type="text"
        inputMode="decimal"
        className="pos-qty-input iva-percent-input"
        aria-label={ariaLabel}
        disabled={disabled}
        value={draft ?? formatIvaPercentInput(value)}
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
          aria-label="Aumentar IVA"
          disabled={disabled}
          onClick={() => step(IVA_STEP_PERCENT)}
        >
          ▲
        </button>
        <button
          type="button"
          className="pos-qty-spin"
          aria-label="Disminuir IVA"
          disabled={downDisabled}
          onClick={() => step(-IVA_STEP_PERCENT)}
        >
          ▼
        </button>
      </div>
    </div>
  )
}
