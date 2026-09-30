// DỮ LIỆU GIẢ cho trang chủ — dùng tạm tới khi có API backend.
// Tên field bám theo view v_best_seller_products / v_new_products trong docs/schema.sql
// (id, name, material, price, discount_price, thumbnail_url, total_sold/created_at),
// cộng thêm partner_name & rating mà API sẽ join từ users / reviews.
import lilyOfValley from '../assets/flowers/lily-of-valley.jpg'
import whiteTulips from '../assets/flowers/white-tulips.jpg'
import sunshineBasket from '../assets/flowers/sunshine-basket.jpg'
import grandOpening from '../assets/flowers/grand-opening.jpg'
import autumnBowl from '../assets/flowers/autumn-bowl.jpg'
import pinkVase from '../assets/flowers/pink-vase.jpg'
import weddingSerenade from '../assets/flowers/wedding-serenade.jpg'
import yellowBasket from '../assets/flowers/yellow-basket.jpg'
import redRoses from '../assets/flowers/red-roses.jpg'
import eventStand from '../assets/flowers/event-stand.jpg'
import greenHydrangea from '../assets/flowers/green-hydrangea.jpg'

// material khớp giá trị gợi ý trong schema: 'Hoa thật' | 'Hoa nhung' | 'Hoa giấy'
export const MATERIALS = ['Hoa thật', 'Hoa nhung', 'Hoa giấy']

export const bestSellerProducts = [
  {
    id: 1, name: 'Bó Hoa Cưới Mẫu Đơn White Peony & Linh Lan', material: 'Hoa thật',
    price: 2150000, discount_price: null, thumbnail_url: lilyOfValley,
    partner_name: 'Florist Thảo Điền Atelier', rating: 4.9, total_sold: 128, badge: 'best',
  },
  {
    id: 2, name: 'Bình Tulip Trắng Hà Lan Royal Classic (15 cành)', material: 'Hoa thật',
    price: 1870000, discount_price: null, thumbnail_url: whiteTulips,
    partner_name: 'Florist Thảo Điền Atelier', rating: 4.9, total_sold: 97, badge: 'new',
  },
  {
    id: 3, name: 'Giỏ Hoa Để Bàn Sunshine Rose Tone Vàng Cam', material: 'Hoa nhung',
    price: 1000000, discount_price: 850000, thumbnail_url: sunshineBasket,
    partner_name: 'Nhiên Floral Art', rating: 4.8, total_sold: 85, badge: 'sale',
  },
  {
    id: 4, name: 'Lẵng Hoa Khai Trương Phát Tài Sang Trọng', material: 'Hoa thật',
    price: 2450000, discount_price: null, thumbnail_url: grandOpening,
    partner_name: "L'Amour Atelier", rating: 5.0, total_sold: 76, badge: 'best',
  },
  {
    id: 5, name: "Bó Hoa 'Hương Sắc Mùa Thu'", material: 'Hoa giấy',
    price: 1450000, discount_price: null, thumbnail_url: autumnBowl,
    partner_name: "Atelier L'Amour", rating: 4.9, total_sold: 64, badge: null,
  },
  {
    id: 6, name: "Bình Gốm 'Dạ Khúc Bình Yên'", material: 'Hoa thật',
    price: 1890000, discount_price: null, thumbnail_url: pinkVase,
    partner_name: 'Botanica Flora', rating: 5.0, total_sold: 58, badge: null,
  },
  {
    id: 7, name: "Bó Cưới 'Pure Serenade'", material: 'Hoa nhung',
    price: 2150000, discount_price: null, thumbnail_url: weddingSerenade,
    partner_name: 'Maison de Fleur', rating: 4.9, total_sold: 51, badge: null,
  },
  {
    id: 8, name: "Lẵng Mây 'Ánh Nắng Ban Mai'", material: 'Hoa giấy',
    price: 1250000, discount_price: null, thumbnail_url: yellowBasket,
    partner_name: 'Florist Hoàng Gia', rating: 4.8, total_sold: 47, badge: null,
  },
]

export const newProducts = [
  {
    id: 9, name: "Hộp Hoa 'Nồng Nàn Kỷ Niệm'", material: 'Hoa nhung',
    price: 1680000, discount_price: null, thumbnail_url: redRoses,
    partner_name: 'Tiệm Hoa Mộc Lan', rating: 4.9, badge: 'new',
  },
  {
    id: 10, name: "Kệ Hoa 'Vươn Tầm Khởi Sắc'", material: 'Hoa thật',
    price: 3200000, discount_price: null, thumbnail_url: eventStand,
    partner_name: 'Florist Atelier K', rating: 5.0, badge: 'new',
  },
  {
    id: 11, name: "Bình Thủy Tinh 'Thanh Phong'", material: 'Hoa giấy',
    price: 1100000, discount_price: 990000, thumbnail_url: greenHydrangea,
    partner_name: 'Serene Botanic Studio', rating: 4.9, badge: 'sale',
  },
  {
    id: 12, name: "Bó Hoa 'Hương Sắc Mùa Thu' — bản mini", material: 'Hoa thật',
    price: 890000, discount_price: null, thumbnail_url: autumnBowl,
    partner_name: "Atelier L'Amour", rating: 4.8, badge: 'new',
  },
]
