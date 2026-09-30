import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../../../components/common/ProductCard.jsx'
import { MATERIALS } from '../../../data/mockProducts.js'

const ALL = 'Tất cả'

// Khối hiển thị danh sách sản phẩm trên trang chủ.
// Dùng cho cả "Bán chạy" (v_best_seller_products) và "Mới" (v_new_products).
// withFilter: bật lọc nhanh theo chất liệu (KH01 - lọc theo loại hoa).
export default function ProductShowcase({ eyebrow, title, products, withFilter = false, onAddToCart }) {
  const [material, setMaterial] = useState(ALL)

  const visible = useMemo(
    () => (material === ALL ? products : products.filter((p) => p.material === material)),
    [material, products],
  )

  return (
    <section className="section">
      <div className="container">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 mb-4">
          <div>
            <div className="eyebrow mb-2">{eyebrow}</div>
            <h2 className="display-6 mb-0">{title}</h2>
          </div>
          <Link to="/san-pham" className="fw-semibold text-decoration-none text-forest small">
            Xem toàn bộ mẫu hoa <i className="bi bi-arrow-right" />
          </Link>
        </div>

        {withFilter && (
          <div className="material-tabs d-flex flex-wrap gap-2 mb-4" role="tablist" aria-label="Lọc theo chất liệu">
            {[ALL, ...MATERIALS].map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={material === m}
                className={`btn btn-ghost ${material === m ? 'active' : ''}`}
                onClick={() => setMaterial(m)}
              >
                {m}
              </button>
            ))}
          </div>
        )}

        {visible.length > 0 ? (
          <div className="row g-4">
            {visible.map((p) => (
              <div className="col-6 col-lg-3" key={p.id}>
                <ProductCard product={p} onAddToCart={onAddToCart} />
              </div>
            ))}
          </div>
        ) : (
          // KH01 - luồng thay thế
          <p className="text-muted-fw py-5 text-center mb-0">Không tìm thấy bó hoa phù hợp.</p>
        )}
      </div>
    </section>
  )
}
