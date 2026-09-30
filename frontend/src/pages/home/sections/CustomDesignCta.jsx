import { Link } from 'react-router-dom'

// Dẫn sang KH05 - Đăng yêu cầu thiết kế riêng lên diễn đàn
export default function CustomDesignCta() {
  return (
    <section className="pb-5">
      <div className="container">
        <div
          className="rounded-4 p-4 p-md-5 d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-4"
          style={{ background: 'var(--fw-sage-soft)' }}
        >
          <div style={{ maxWidth: 640 }}>
            <div className="eyebrow mb-2"><i className="bi bi-stars me-1" />Bạn chưa tìm thấy mẫu hoa vừa ý?</div>
            <h2 className="h1 mb-3">Đặt nghệ nhân thiết kế riêng theo ý tưởng của bạn</h2>
            <p className="text-muted-fw mb-0">
              Tự do chọn loại hoa, màu sắc chủ đạo và ngân sách. Các cửa hàng trên Fw12 sẽ gửi báo giá
              kèm phác thảo để bạn lựa chọn — hoàn toàn miễn phí.
            </p>
          </div>
          <Link to="/thiet-ke-rieng" className="btn btn-forest flex-shrink-0">
            Tạo yêu cầu cắm hoa <i className="bi bi-arrow-right ms-1" />
          </Link>
        </div>
      </div>
    </section>
  )
}
