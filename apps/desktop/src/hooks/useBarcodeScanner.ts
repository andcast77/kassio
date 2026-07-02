import { useCallback, useEffect, useRef } from 'react'
import { BarcodeScanner, type BarcodeScanResult } from '../lib/barcodeService'

export function useBarcodeScanner(onScan: (result: BarcodeScanResult) => void, enabled = true) {
  const scannerRef = useRef<BarcodeScanner | null>(null)
  const elementRef = useRef<HTMLInputElement | null>(null)

  const handleScan = useCallback(
    (result: BarcodeScanResult) => {
      onScan(result)
    },
    [onScan],
  )

  useEffect(() => {
    if (!enabled || !elementRef.current) return

    scannerRef.current = new BarcodeScanner(handleScan)
    scannerRef.current.start(elementRef.current)

    return () => {
      if (scannerRef.current && elementRef.current) {
        scannerRef.current.stop(elementRef.current)
      }
    }
  }, [enabled, handleScan])

  return { ref: elementRef }
}
