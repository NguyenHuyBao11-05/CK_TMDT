import { Link } from 'react-router-dom'
import heroBouquet from '../../../assets/flowers/hero-bouquet.jpg'
import whiteTulips from '../../../assets/flowers/white-tulips.jpg'

const TRUST_ITEMS = [
  { icon: 'bi-patch-check', text: 'Đối tác đã được kiểm duyệt' },
  { icon: 'bi-chat-square-quote', text: 'Nhận nhiều báo giá, tự chọn' },
  { icon: 'bi-truck', text: 'Theo dõi đơn tới khi nhận hoa' },
]

export default function HeroSection() {
  return (
    <section className="hero">
      <div className="container">
        <div className="row align-items-center g-4 g-lg-5">
          <div className="col-lg-6">
            <span className="eyebrow d-inline-flex align-items-center gap-2 mb-3">
              <i className="bi bi-circle-fill" style={{ fontSize: 6 }} />
              Nền tảng đặt hoa & thiết kế hoa theo yêu cầu
            </span>
            <h1 className="hero-title mb-4">
              Fw12 — Nơi ý tưởng hoa của bạn trở thành <em>hiện thực</em>
            </h1>
            <p className="hero-lead mb-4">
              Kết nối trực tiếp với các thợ cắm hoa tài năng. Đặt mẫu có sẵn hoặc đăng yêu cầu thiết kế
              riêng theo ngân sách và phong cách của chính bạn.
            </p>

            <div className="d-flex flex-wrap gap-3 mb-4">
              <Link to="/thiet-ke-rieng" className="btn btn-peach">
                Tạo yêu cầu thiết kế ngay <i className="bi bi-palette ms-1" />
              </Link>
              <Link to="/san-pham" className="btn btn-ghost">
                Khám phá mẫu có sẵn <i className="bi bi-arrow-right ms-1" />
              </Link>
            </div>

            <div className="d-flex flex-wrap gap-2">
              {TRUST_ITEMS.map((item) => (
                <span className="trust-chip" key={item.text}>
                  <i className={`bi ${item.icon}`} />{item.text}
                </span>
              ))}
            </div>
          </div>

          <div className="col-lg-6">
            <div className="hero-media">
              <img src={heroBouquet} alt="Bó hoa hồng pastel trên bàn gỗ" />
              <span className="hero-tag">Tác phẩm của tháng</span>

              <div className="hero-product-card">
                <img src={whiteTulips} alt="" />
                <div>
                  <div className="small">
                    <i className="bi bi-star-fill text-rose me-1" />
                    <strong>4.9</strong> <span className="text-muted-fw">(340 đánh giá)</span>
                  </div>
                  <div className="font-serif fw-semibold">Bình Tulip Trắng Royal Classic</div>
                  <div className="small text-muted-fw">Florist Thảo Điền Atelier</div>
                  <div className="product-price small">1.450.000 đ</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
