import { Route, Routes } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout.jsx'
import HomePage from './pages/home/HomePage.jsx'
import ComingSoonPage from './pages/ComingSoonPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        {/* Các trang dưới đây sẽ làm ở các sprint sau — tạm hiển thị "Đang phát triển" */}
        <Route path="san-pham" element={<ComingSoonPage title="Mẫu hoa có sẵn" useCase="KH01" />} />
        <Route path="thiet-ke-rieng" element={<ComingSoonPage title="Tạo yêu cầu cắm hoa" useCase="KH05" />} />
        <Route path="gio-hang" element={<ComingSoonPage title="Giỏ hàng" useCase="KH03" />} />
        <Route path="dang-nhap" element={<ComingSoonPage title="Đăng nhập" />} />
        <Route path="dang-ky" element={<ComingSoonPage title="Đăng ký" />} />
        <Route path="dang-ky-doi-tac" element={<ComingSoonPage title="Đăng ký làm Đối tác" useCase="DT01" />} />
        <Route path="*" element={<ComingSoonPage title="Không tìm thấy trang" />} />
      </Route>
    </Routes>
  )
}
