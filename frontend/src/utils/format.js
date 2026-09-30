// Giá trong DB là DECIMAL(12,0) — đơn vị đồng, không có phần lẻ
export function formatVnd(amount) {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ'
}
