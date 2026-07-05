import { useEffect, useMemo, useRef, useState } from 'react'
import { CategoryMultiSelect } from './CategoryMultiSelect'
import { fetchCategories, fetchProductsPage, type Category, type Product } from '../../api'
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner'
import { cartStore, type CartProduct } from '../../store/cartStore'
import { formatCurrency } from '../../lib/formatCurrency'
import { productSalePrice } from '../../lib/taxPrice'

type Props = {
  onNotify?: (message: { type: 'ok' | 'error'; text: string }) => void
  refreshKey?: number
  onSearchRef?: (el: HTMLInputElement | null) => void
}

const SCROLL_GAP_X = 12
const SCROLL_GAP_Y = 12
const CARD_MIN_WIDTH = 150
const CARD_HEIGHT = 120
const OVERSCAN_ROWS = 2
const PAGE_LIMIT = 100

function toCartProduct(p: Product): CartProduct {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    stockQuantity: p.stockQuantity,
    sku: p.sku,
    taxRate: Number(p.taxRate),
  }
}

export function ProductPanel({ onNotify, refreshKey = 0, onSearchRef }: Props) {
  const [search, setSearch] = useState('')
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [scanPendingCode, setScanPendingCode] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [products, setProducts] = useState<Product[]>([])
  const [totalPages, setTotalPages] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const appendedPagesRef = useRef<Record<number, boolean>>({})
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)
  const [containerWidth, setContainerWidth] = useState(0)

  const { ref: barcodeRef } = useBarcodeScanner((result) => {
    setSearch(result.code)
    setScanPendingCode(result.code)
  })

  useEffect(() => {
    if (searchInputRef.current) barcodeRef.current = searchInputRef.current
    onSearchRef?.(searchInputRef.current)
  }, [barcodeRef, onSearchRef])

  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  useEffect(() => {
    void fetchCategories().then((res) => {
      if (res.success) setCategories(res.data.categories.filter((c) => c.active))
    })
  }, [])

  const categoryFilterKey = selectedCategoryIds.slice().sort().join(',')

  useEffect(() => {
    setPage(1)
    setProducts([])
    setTotalPages(null)
    appendedPagesRef.current = {}
    setScrollTop(0)
  }, [search, categoryFilterKey, refreshKey])

  useEffect(() => {
    void loadPage(page)
  }, [page, search, categoryFilterKey, refreshKey])

  async function loadPage(pageNum: number) {
    if (pageNum === 1) setLoading(true)
    else setFetching(true)

    const res = await fetchProductsPage({
      search,
      categoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
      page: pageNum,
      limit: PAGE_LIMIT,
      active: true,
    })
    if (res.success) {
      setTotalPages(res.data.pagination.totalPages)
      const batch = res.data.products
      if (!appendedPagesRef.current[pageNum]) {
        appendedPagesRef.current[pageNum] = true
        setProducts((prev) => (pageNum === 1 ? batch : [...prev, ...batch]))
      }
      if (pageNum === 1) {
        const stockMap = Object.fromEntries(batch.map((p) => [p.id, p.stockQuantity]))
        cartStore.syncProductStocks(stockMap)
      }
    }

    setLoading(false)
    setFetching(false)
  }

  useEffect(() => {
    if (!scanPendingCode) return

    const match = products.find((p) => p.barcode === scanPendingCode || p.sku === scanPendingCode)
    if (match) {
      if (match.stockQuantity > 0) {
        const added = cartStore.addItem(toCartProduct(match), 1)
        if (added) {
          setSearch('')
          setScanPendingCode(null)
        } else {
          onNotify?.({ type: 'error', text: `Stock máximo: ${match.stockQuantity}` })
          setScanPendingCode(null)
        }
      } else {
        onNotify?.({ type: 'error', text: 'El producto no tiene stock disponible' })
        setScanPendingCode(null)
      }
      return
    }

    if (!loading && !fetching) {
      const loadedAll = totalPages == null || page >= totalPages
      if (products.length === 0 || loadedAll) {
        onNotify?.({ type: 'error', text: `No se encontró producto con código «${scanPendingCode}»` })
        setScanPendingCode(null)
      }
    }
  }, [scanPendingCode, products, loading, fetching, totalPages, page, onNotify])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const update = () => {
      setViewportHeight(el.clientHeight)
      setContainerWidth(el.clientWidth)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const canLoadMore = totalPages != null && page < totalPages

  useEffect(() => {
    if (!scrollRef.current || !sentinelRef.current || !canLoadMore || fetching) return
    const root = scrollRef.current
    const sentinel = sentinelRef.current
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setPage((p) => p + 1)
      },
      { root, rootMargin: '300px', threshold: 0 },
    )
    io.observe(sentinel)
    return () => io.disconnect()
  }, [canLoadMore, fetching])

  const columns = useMemo(() => {
    if (containerWidth <= 0) return 2
    return Math.max(1, Math.floor((containerWidth + SCROLL_GAP_X) / (CARD_MIN_WIDTH + SCROLL_GAP_X)))
  }, [containerWidth])

  const cardWidth = useMemo(() => {
    if (containerWidth <= 0) return CARD_MIN_WIDTH
    const available = containerWidth - SCROLL_GAP_X * (columns - 1)
    return Math.max(120, available / columns)
  }, [containerWidth, columns])

  const rowHeight = CARD_HEIGHT + SCROLL_GAP_Y
  const totalRows = Math.ceil(products.length / columns)
  const totalHeight = totalRows <= 0 ? 0 : totalRows * CARD_HEIGHT + (totalRows - 1) * SCROLL_GAP_Y

  const visibleRange = useMemo(() => {
    if (products.length === 0) return { startIndex: 0, endIndex: 0 }
    const firstRow = viewportHeight > 0 ? Math.floor(scrollTop / rowHeight) : 0
    const startRow = Math.max(0, firstRow - OVERSCAN_ROWS)
    const visibleRows =
      viewportHeight > 0 ? Math.ceil(viewportHeight / rowHeight) + OVERSCAN_ROWS * 2 : 9
    const endRow = Math.min(totalRows, startRow + visibleRows)
    return { startIndex: startRow * columns, endIndex: Math.min(products.length, endRow * columns) }
  }, [columns, products.length, scrollTop, rowHeight, totalRows, viewportHeight])

  function handleAdd(product: Product) {
    if (product.stockQuantity <= 0) {
      onNotify?.({ type: 'error', text: 'Sin stock' })
      return
    }
    const inCart = cartStore.getState().items.find((l) => l.product.id === product.id)
    const qty = (inCart?.quantity ?? 0) + 1
    if (qty > product.stockQuantity) {
      onNotify?.({ type: 'error', text: `Stock máximo: ${product.stockQuantity}` })
      return
    }
    cartStore.addItem(toCartProduct(product), 1)
  }

  return (
    <div className="pos-product-panel">
      <div className="pos-search-row">
        <div className="pos-search-wrap">
          <input
            ref={searchInputRef}
            type="text"
            className="pos-search-input"
            placeholder="Buscar productos o escanear código de barras… (F2)"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              if (scanPendingCode && e.target.value !== scanPendingCode) setScanPendingCode(null)
            }}
          />
        </div>
        {categories.length > 0 && (
          <CategoryMultiSelect
            categories={categories}
            selectedIds={selectedCategoryIds}
            onChange={setSelectedCategoryIds}
          />
        )}
      </div>
      {scanPendingCode && (
        <p className="pos-scan-status" role="status">
          Buscando producto por código…
        </p>
      )}

      <div
        ref={scrollRef}
        className="pos-product-scroll"
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      >
        {loading && products.length === 0 ? (
          <p className="muted pos-empty">Cargando productos…</p>
        ) : products.length === 0 ? (
          <p className="muted pos-empty">No se encontraron productos</p>
        ) : (
          <div className="pos-virtual-grid" style={{ height: totalHeight }}>
            <div
              ref={sentinelRef}
              className="pos-scroll-sentinel"
              style={{ top: Math.max(0, totalHeight - 1) }}
            />
            {products.slice(visibleRange.startIndex, visibleRange.endIndex).map((product, i) => {
              const absoluteIndex = visibleRange.startIndex + i
              const row = Math.floor(absoluteIndex / columns)
              const col = absoluteIndex % columns
              const lowStock = product.stockQuantity > 0 && product.stockQuantity <= 5
              return (
                <button
                  key={product.id}
                  type="button"
                  className={`pos-product-card${lowStock ? ' pos-product-low-stock' : ''}`}
                  disabled={product.stockQuantity <= 0}
                  style={{
                    width: cardWidth,
                    height: CARD_HEIGHT,
                    transform: `translate(${col * (cardWidth + SCROLL_GAP_X)}px, ${row * rowHeight}px)`,
                  }}
                  onClick={() => handleAdd(product)}
                >
                  <strong>{product.name}</strong>
                  <span className="muted pos-product-sku">{product.sku ?? '—'}</span>
                  <span className={`muted${lowStock ? ' pos-stock-warn' : ''}`}>
                    Stock: {product.stockQuantity}
                    {lowStock ? ' ⚠' : ''}
                  </span>
                  <span className="pos-product-price">
                    {formatCurrency(productSalePrice(product.price))}
                  </span>
                </button>
              )
            })}
          </div>
        )}
        {fetching && page > 1 && <p className="muted pos-loading-more">Cargando más…</p>}
      </div>
    </div>
  )
}
