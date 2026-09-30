import { formatVnd } from '../../utils/format.js'

const BADGE_LABEL = {
  best: 'Bán chạy nhất',
  new: 'Mới',
  sale: 'Tiết kiệm',
}

export default function ProductCard({ product, onAddToCart }) {
  const { name, partner_name, rating, price, discount_price, thumbnail_url, badge, material } = product
  const hasDiscount = discount_price != null && discount_price < price
  const salePercent = hasDiscount ? Math.round((1 - discount_price / price) * 100) : 0

  return (
    <article className="product-card">
      <div className="product-thumb">
        <img src={thumbnail_url} alt={name} loading="lazy" />
        {badge && (
          <span className={`product-badge ${badge}`}>
            {badge === 'sale' ? `${BADGE_LABEL.sale} ${salePercent}%` : BADGE_LABEL[badge]}
          </span>
        )}
        <span className="product-rating">
          <i className="bi bi-star-fill text-rose me-1" />{rating.toFixed(1)}
        </span>
      </div>

      <div className="product-body">
        <div className="product-partner d-flex justify-content-between">
          <span><i className="bi bi-shop me-1" />{partner_name}</span>
          <span>{material}</span>
        </div>
        <h3 className="product-name">{name}</h3>

        <div className="mt-auto d-flex align-items-end justify-content-between">
          <div>
            <div className="product-price-label">{hasDiscount ? 'Giá ưu đãi' : 'Giá niêm yết'}</div>
            <span className="product-price">{formatVnd(hasDiscount ? discount_price : price)}</span>
            {hasDiscount && <span className="product-old-price">{formatVnd(price)}</span>}
          </div>
          {/* KH02 - Thêm vào giỏ hàng */}
          <button
            type="button"
            className="btn btn-cart"
            aria-label={`Thêm ${name} vào giỏ`}
            onClick={() => onAddToCart?.(product)}
          >
            <i className="bi bi-cart-plus" />
          </button>
        </div>
      </div>
    </article>
  )
}
