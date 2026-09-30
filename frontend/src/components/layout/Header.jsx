import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/', label: 'Trang chủ', end: true },
  { to: '/san-pham', label: 'Mẫu hoa có sẵn' },       // KH01
  { to: '/thiet-ke-rieng', label: 'Tạo yêu cầu cắm hoa' }, // KH05
]

export default function Header() {
  const [open, setOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const navigate = useNavigate()
  // TODO: lấy số lượng thật từ giỏ hàng (KH02) khi có API cart
  const cartCount = 2

  // KH01 - Tìm kiếm bó hoa: chuyển sang trang danh sách kèm từ khoá
  function handleSearch(e) {
    e.preventDefault()
    const q = keyword.trim()
    navigate(q ? `/san-pham?q=${encodeURIComponent(q)}` : '/san-pham')
    setOpen(false)
  }

  return (
    <header className="site-header sticky-top">
      <nav className="navbar navbar-expand-lg py-3">
        <div className="container">
          <Link to="/" className="navbar-brand d-flex align-items-center gap-2">
            <span className="brand-mark"><i className="bi bi-flower1" /></span>
            <span className="brand-name">Fw12</span>
          </Link>

          <button
            className="navbar-toggler border-0 shadow-none"
            type="button"
            aria-label="Mở menu"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div className={`collapse navbar-collapse ${open ? 'show' : ''}`}>
            <ul className="navbar-nav mx-lg-auto gap-2 my-3 my-lg-0">
              {NAV_ITEMS.map((item) => (
                <li className="nav-item" key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => `nav-pill d-inline-block ${isActive ? 'active' : ''}`}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-3">
              <form className="header-search d-flex align-items-center gap-2" role="search" onSubmit={handleSearch}>
                <i className="bi bi-search text-muted-fw" />
                <input
                  type="search"
                  placeholder="Tìm hoa tươi, florist..."
                  aria-label="Tìm kiếm bó hoa"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </form>

              <div className="d-flex align-items-center gap-3">
                <Link to="/gio-hang" className="position-relative text-body fs-5" aria-label="Giỏ hàng">
                  <i className="bi bi-bag" />
                  {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                </Link>
                <Link to="/dang-nhap" className="text-body fw-semibold text-decoration-none small">
                  Đăng nhập
                </Link>
                <Link to="/dang-ky" className="btn btn-peach btn-sm px-3">
                  Đăng ký
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}
