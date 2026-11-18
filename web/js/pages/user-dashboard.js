function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function formatMoney(amount) {
    return Number(amount || 0).toLocaleString("vi-VN") + "đ";
}

function formatDate(date) {
    if (!date) return "";
    return new Date(date).toLocaleDateString("vi-VN");
}

function getOrderStatus(status) {
    const statuses = {
        PENDING: {
            text: "Chờ xác nhận",
            className: "pending"
        },
        CONFIRMED: {
            text: "Đã xác nhận",
            className: "confirmed"
        },
        PREPARING: {
            text: "Đang chuẩn bị",
            className: "is-doing"
        },
        SHIPPING: {
            text: "Đang giao hàng",
            className: "delivery"
        },
        DELIVERED: {
            text: "Đã nhận hàng",
            className: "delivered"
        },
        CANCELLED: {
            text: "Đã hủy",
            className: "cancelled"
        }
    };
    return statuses[status] || {
        text: status || "Chưa xác định", className: ""
    };
}

function renderRecentOrders(orders) {
    const container = document.getElementById("recentOrders");
    if (!container) {
        return;
    }
    if (!Array.isArray(orders) || orders.length === 0) {
        container.innerHTML = `<p class="text-muted">Bạn chưa có đơn hàng nào.</p>`;
        return;
    }

    container.innerHTML = orders.map(order => {
        const order_status = getOrderStatus(order.status);
        const order_code = escapeHtml(order.order_code ?? order.id);
        const created_at = formatDate(order.created_at);
        const total_amount = formatMoney(order.total_amount);
        const item_names = Array.isArray(order.item_names) ? order.item_names : [];
        const item_html = item_names.length > 0 ? item_names.map(item => `
            <span class="item-name">${escapeHtml(item)}</span>`).join("") : `<span class="item-name">Chưa có thông tin sản phẩm</span>`;

        const status_html = `<span class="item-status ${order_status.className}">
            <i class="fa-solid fa-circle"></i>${escapeHtml(order_status.text)}</span>`;

        const row_class = order.status === "DELIVERED" ? "delivered" : "normal-design";
        return `<div class="list-item ${row_class}">
            <span class="order-id"><i class="fa-solid fa-fan"></i> #${order_code}</span>
            <span class="date-ordered">${created_at}</span>
            <span class="order-type normal-design">Mẫu có sẵn</span>
            <div class="order-name">${item_html}</div>
            <div class="total-money">
                <span class="money">${total_amount}</span>
            </div>
            <div class="product-statutes">${status_html}</div>
            <div class="action-buttons">
                <button class="detail-button"><i class="fa-solid fa-eye"></i> Chi tiết</button>
            </div>
        </div>`;}).join("");
}

function renderDesignRequests(requests) {
    const container = document.getElementById("designRequestsList");
    if (!container) {
        return;
    }
    if (!Array.isArray(requests) || requests.length === 0) {
        container.innerHTML = `<p class="text-muted">Bạn chưa có yêu cầu thiết kế nào.</p>`;
        return;
    }
    container.innerHTML = requests.slice(0, 3).map(request => {
        const request_id = request.id;
        const quote_count = request.quote_count ?? 0;
        const partner_names = Array.isArray(request.partner_names) ? request.partner_names : [];
        const florist_initials = partner_names.slice(0, 3).map(name => {
            return escapeHtml(name.trim().split(/\s+/).map(word => word[0]).join("").slice(0, 2).toUpperCase());
        });
        const florist_buttons = florist_initials.map(initial => ` <button class="florist" type="button">${initial}</button>`).join("");
        let florist_text = "Chưa có báo giá";
        if (partner_names.length > 0) {
            florist_text = partner_names.slice(0, 3).map(name => escapeHtml(name)).join(", ");
            if (partner_names.length > 3) {
                florist_text += "...";
            }
        }
        const budget = request.budget != null ? formatMoney(request.budget) : "Chưa xác định";
        const occasion = escapeHtml(request.occasion || "Chưa xác định");
        const color_preference = escapeHtml(request.color_preference || "Chưa xác định");
        const created_at = formatDate(request.created_at);
        let remaining_text = "Chưa xác định";
        if (request.desired_date) {
            const deadline = new Date(request.desired_date);
            const now = new Date();
            const remaining_ms = deadline - now;
            if (remaining_ms > 0) {
                const remaining_hours = Math.floor(remaining_ms / (1000 * 60 * 60));
                const remaining_days = Math.floor(remaining_hours / 24);
                const hours = remaining_hours % 24;
                remaining_text = remaining_days > 0 ? `Còn ${remaining_days} ngày ${hours} giờ` : `Còn ${remaining_hours} giờ`;
            } else {
                remaining_text = "Đã đến hạn";
            }
        }

        const request_title = escapeHtml(
            request.title || "Yêu cầu thiết kế hoa"
        );
        const is_selected = request.selected_quote_id != null;
        const button_text = is_selected ? "Xem báo giá đã chọn" : `Xem & Chọn báo giá (${quote_count})`;

        const button_link = `../design/compare-quotes.html?id=${encodeURIComponent(request_id)}`;
        return `
            <div class="design-request-item">
                <div class="upper-text">
                    <span class="order-id">MÃ #YC-${escapeHtml(request_id)}</span>
                    <span class="time-remain"><i class="fa-regular fa-clock"></i>Hạn chót: ${remaining_text}</span>
                </div>
                <h1 class="order-name">${request_title}</h1>

                <div class="order-specification">
                    <div class="order-spec">
                        <span class="spec-title">Ngân sách dự kiến</span>
                        <span class="spec-money">${budget}</span>
                    </div>
                    <div class="order-spec">
                        <span class="spec-title">Dịp tặng</span>
                        <span>${occasion}</span>
                    </div>
                    <div class="order-spec">
                        <span class="spec-title">Tone màu</span>
                        <span>${color_preference}</span>
                    </div>
                </div>

                <div class="potential-florists">
                    <div class="upper-text">
                        <span class="left-text">Đã nhận ${quote_count} đề xuất báo giá</span>
                        <span class="right-text">+${quote_count} báo giá</span>
                    </div>
                    <div class="list-florists">
                        <div class="lists">${florist_buttons}</div>
                        <span>${florist_text}</span>
                    </div>
                </div>
                <div class="final-texts">
                    <span class="date-created">Tạo ngày: ${created_at}</span>
                    <a class="choose-price-button" href="${button_link}">${button_text}</a>
                </div>
            </div>
        `;
    }).join("");
}

async function loadDashboard() {
    try {
        const data = await FW_API.dashboard();
        document.getElementById("totalOrders").textContent = data.total_orders ?? 0;
        document.getElementById("deliveringOrders").textContent = data.delivering_orders ?? 0;
        document.getElementById("headerDeliveringOrders").textContent = data.delivering_orders + " đơn hàng" ?? 0 + " đơn hàng";
        renderRecentOrders(data.recent_orders || []);
    } catch (error) {
        console.error("Lỗi tải dashboard:", error);
    }
}

async function loadDesignRequests() {
    try {
        const requests = await FW_API.getMyDesignRequests();
        renderDesignRequests(requests);
        const open_requests = requests.filter(request =>
            !["COMPLETED", "CANCELLED"].includes(request.status)
        );
        const open_element = document.getElementById("openDesignRequests");
        if (open_element) {
            open_element.textContent = open_requests.length;
        }
        const total_quotes = requests.reduce((total, request) => total + (request.quote_count ?? 0), 0);
        const quote_element = document.getElementById("newDesignQuotes");
        if (quote_element) {
            quote_element.textContent = total_quotes;
        }
        document.getElementById("headerNewQuotes").textContent = `${total_quotes} đề xuất báo giá`;
    } catch (error) {
        console.error("Lỗi tải yêu cầu thiết kế:", error);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadDashboard().then();
    loadDesignRequests().then();
});