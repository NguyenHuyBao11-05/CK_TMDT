import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="row g-4 g-lg-5">
          <div className="col-lg-3 col-md-6">
            <div className="footer-brand mb-3">Fw12 Floral</div>
            <p>
              Nền tảng kết nối nghệ nhân cắm hoa và khách hàng. Đặt mẫu có sẵn hoặc đăng yêu cầu
              thiết kế riêng để nhận báo giá từ nhiều cửa hàng.
            </p>
          </div>

          <div className="col-lg-3 col-md-6">
            <h5>Hỗ trợ khách hàng</h5>
            <ul>
              <li><i className="bi bi-chevron-right small" /><Link to="/thiet-ke-rieng">Hướng dẫn đặt hoa thiết kế riêng</Link></li>
              <li><i className="bi bi-chevron-right small" /><Link to="/san-pham">Theo dõi đơn hàng</Link></li>
              <li><i className="bi bi-chevron-right small" /><Link to="/san-pham">Chính sách khiếu nại</Link></li>
              <li><i className="bi bi-chevron-right small" />Hotline hỗ trợ: 1900 1289</li>
            </ul>
          </div>

          <div className="col-lg-3 col-md-6">
            <h5>Cam kết của Fw12</h5>
            <ul>
              <li><i className="bi bi-patch-check" />Đối tác được Quản lý kiểm duyệt hồ sơ trước khi bán</li>
              <li><i className="bi bi-camera" />Ảnh bó hoa hoàn thành được gửi trước khi giao</li>
              <li><i className="bi bi-wallet2" />Thanh toán tiền mặt hoặc chuyển khoản</li>
            </ul>
          </div>

          <div className="col-lg-3 col-md-6">
            <h5>Đăng ký bản tin Fw12</h5>
            <p>Nhận cảm hứng cắm hoa mỗi tuần cùng ưu đãi voucher dành riêng cho thành viên.</p>
            {/* Chưa nối API — chỉ là giao diện */}
            <form className="d-grid gap-2" onSubmit={(e) => e.preventDefault()}>
              <input type="email" className="form-control footer-input" placeholder="Địa chỉ email của bạn..." aria-label="Email" />
              <button type="submit" className="btn btn-peach">Đăng ký nhận tin</button>
            </form>
          </div>
        </div>

        <div className="footer-bottom d-flex flex-column flex-md-row justify-content-between gap-2 text-muted-fw">
          <span>© 2026 Fw12 Floral — Đồ án môn Thương mại điện tử.</span>
          <span className="d-flex gap-3">
            <a href="#">Điều khoản dịch vụ</a>
            <a href="#">Chính sách quyền riêng tư</a>
            <a href="#">Quy chuẩn Đối tác</a>
          </span>
        </div>
      </div>
    </footer>
  )
}
