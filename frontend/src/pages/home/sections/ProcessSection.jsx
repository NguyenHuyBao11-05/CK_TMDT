// 3 bước của luồng đặc trưng: KH05 (đăng yêu cầu) → DT06/KH06 (báo giá & chọn) → KH07..KH12 (đặt & nhận hoa)
const STEPS = [
  {
    no: 'Bước 01', icon: 'bi-palette', tone: 'sage',
    title: 'Đăng yêu cầu & Ngân sách',
    desc: 'Mô tả ý tưởng: chất liệu, tông màu, dịp tặng hoa và mức giá mong muốn. Đính kèm ảnh tham khảo nếu có.',
    foot: 'Đăng lên diễn đàn trong 2 phút', footIcon: 'bi-check2-circle', footClass: 'text-forest',
  },
  {
    no: 'Bước 02', icon: 'bi-receipt', tone: 'peach',
    title: 'Nhận báo giá từ các shop',
    desc: 'Nhiều Đối tác xem yêu cầu và gửi báo giá kèm thời gian thực hiện, cách làm và ảnh mẫu. Bạn so sánh và chọn phương án ưng ý nhất.',
    foot: 'Minh bạch chi phí', footIcon: 'bi-bar-chart', footClass: 'text-rose',
  },
  {
    no: 'Bước 03', icon: 'bi-patch-check', tone: 'sage',
    title: 'Thanh toán & Nhận hoa',
    desc: 'Xác nhận đặt, thanh toán tiền mặt hoặc chuyển khoản. Đối tác gửi ảnh bó hoa hoàn thành trước khi giao tận tay bạn.',
    foot: 'Theo dõi đơn từng bước', footIcon: 'bi-geo-alt', footClass: 'text-forest',
  },
]

export default function ProcessSection() {
  return (
    <section className="section section-alt">
      <div className="container">
        <div className="text-center mx-auto mb-5" style={{ maxWidth: 620 }}>
          <div className="eyebrow mb-3">Quy trình đơn giản & minh bạch</div>
          <h2 className="display-6 mb-3">Trải nghiệm đặt hoa theo yêu cầu tại Fw12</h2>
          <p className="text-muted-fw mb-0">
            Chỉ với 3 bước, biến mọi cảm xúc thành một bó hoa được thiết kế riêng cho bạn.
          </p>
        </div>

        <div className="row g-4">
          {STEPS.map((step) => (
            <div className="col-md-4" key={step.no}>
              <div className="step-card">
                <div className={`step-icon ${step.tone}`}><i className={`bi ${step.icon}`} /></div>
                <div className="step-no">{step.no}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
                <div className={`step-foot ${step.footClass}`}>
                  {step.foot} <i className={`bi ${step.footIcon} ms-1`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
