import { Link } from 'react-router-dom'

// Dẫn sang DT01 - Đăng ký làm Đối tác
export default function PartnerCta() {
  return (
    <section className="section pt-4">
      <div className="container">
        <div className="partner-cta">
          <i className="bi bi-flower3 deco" aria-hidden="true" />
          <span className="eyebrow-chip"><i className="bi bi-shop" />Dành cho nhà cung cấp & thợ cắm hoa</span>
          <h2 className="mb-3">Bạn là thợ cắm hoa hay chủ shop?<br />Hãy gia nhập Fw12</h2>
          <p className="mb-4">
            Tiếp cận hàng ngàn khách hàng yêu hoa, đăng mẫu bán sẵn và nhận báo giá cho các yêu cầu
            thiết kế riêng mỗi ngày. Hồ sơ được duyệt nhanh, quản lý đơn hàng và doanh thu ngay trên một trang.
          </p>
          <Link to="/dang-ky-doi-tac" className="btn btn-ghost border-0">
            Đăng ký trở thành Đối tác <i className="bi bi-arrow-right ms-1" />
          </Link>
        </div>
      </div>
    </section>
  )
}
