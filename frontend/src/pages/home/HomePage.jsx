import { useEffect, useState } from 'react'
import HeroSection from './sections/HeroSection.jsx'
import ProcessSection from './sections/ProcessSection.jsx'
import ProductShowcase from './sections/ProductShowcase.jsx'
import CustomDesignCta from './sections/CustomDesignCta.jsx'
import PartnerCta from './sections/PartnerCta.jsx'
import { bestSellerProducts, newProducts } from '../../data/mockProducts.js'

export default function HomePage() {
  const [toast, setToast] = useState(null)

  // KH02 - Thêm vào giỏ hàng: hiện tại chỉ báo trên giao diện, chưa gọi API
  function handleAddToCart(product) {
    setToast(`Đã thêm "${product.name}" vào giỏ hàng`)
  }

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(t)
  }, [toast])

  return (
    <>
      <HeroSection />
      <ProcessSection />
      <ProductShowcase
        eyebrow="Được yêu thích nhất"
        title="Sản phẩm bán chạy"
        products={bestSellerProducts}
        withFilter
        onAddToCart={handleAddToCart}
      />
      <CustomDesignCta />
      <ProductShowcase
        eyebrow="Vừa lên kệ"
        title="Mẫu hoa mới"
        products={newProducts}
        onAddToCart={handleAddToCart}
      />
      <PartnerCta />

      {toast && (
        <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1080 }} role="status" aria-live="polite">
          <div className="toast show align-items-center border-0 text-white" style={{ background: 'var(--fw-forest)' }}>
            <div className="toast-body d-flex align-items-center gap-2">
              <i className="bi bi-check-circle" />{toast}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
