export type BarcodeScanResult = {
  code: string
  format?: string
  timestamp: Date
}

export class BarcodeScanner {
  private buffer = ''
  private timeout: ReturnType<typeof setTimeout> | null = null
  private readonly TIMEOUT_MS = 100

  constructor(private onScan: (result: BarcodeScanResult) => void) {}

  start(element: HTMLElement): void {
    element.addEventListener('keydown', this.handleKeyDown)
    element.setAttribute('tabindex', '0')
    element.focus()
  }

  stop(element: HTMLElement): void {
    element.removeEventListener('keydown', this.handleKeyDown)
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (this.timeout) clearTimeout(this.timeout)

    if (event.key === 'Enter' && this.buffer.length > 0) {
      event.preventDefault()
      this.processBarcode(this.buffer)
      this.buffer = ''
      return
    }

    if (event.key.length > 1 && event.key !== 'Enter') return

    this.buffer += event.key
    this.timeout = setTimeout(() => {
      this.buffer = ''
    }, this.TIMEOUT_MS)
  }

  private processBarcode(code: string): void {
    const trimmed = code.trim()
    const result: BarcodeScanResult = { code: trimmed, timestamp: new Date() }
    if (/^\d{8,14}$/.test(trimmed)) result.format = 'EAN/UPC'
    else if (/^[0-9A-Z]{8,}$/i.test(trimmed)) result.format = 'CODE128'
    this.onScan(result)
  }
}
