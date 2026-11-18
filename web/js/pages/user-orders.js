let allOrders = [];
let currentFilter = "all";
let currentPage = 1;

const ORDERS_PER_PAGE = 4;

document.addEventListener("DOMContentLoaded", () => {
    loadMyOrders();
    document.querySelectorAll(".list-filters .filter").forEach(tab => {
        tab.addEventListener("click", event => {
            event.preventDefault();
            document.querySelectorAll(".list-filters .filter").forEach(item => item.classList.remove("active"));
            tab.classList.add("active");
            currentFilter = tab.dataset.filter;
            currentPage = 1;
            renderOrders();
        });
    });

    document.getElementById("btnSearch").addEventListener("click", () => {
        currentPage = 1;
        renderOrders();
    });

    document.getElementById("searchOrder").addEventListener("keydown", event => {
        if (event.key === "Enter") {
            currentPage = 1;
            renderOrders();
        }
    });

    document.getElementById("filterDate").addEventListener("change", () => {
        currentPage = 1;
        renderOrders();
    });

    document.getElementById("prevPage").addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            renderOrders();
        }
    });

    document.getElementById("nextPage").addEventListener("click", () => {
        const totalPages = getTotalPages();
        if (currentPage < totalPages) {
            currentPage++;
            renderOrders();
        }
    });
});

async function loadMyOrders() {
    const container = document.getElementById("orderList");
    try {
        allOrders = await FW_API.getMyOrders();
        if (!Array.isArray(allOrders)) {
            throw new Error("Dữ liệu API không phải danh sách đơn hàng");
        }

        allOrders.sort((a, b) =>
            new Date(b.created_at) - new Date(a.created_at)
        );

        updateOrderCounts();
        renderOrders();
    } catch (error) {
        console.error("Lỗi tải danh sách đơn hàng:", error);
        container.innerHTML = `<p class="text-center text-danger">Không thể tải danh sách đơn hàng. Vui lòng thử lại.</p>`;
    }
}

function updateOrderCounts() {
    const doing = allOrders.filter(order =>
        ["PENDING", "PROCESSING"].includes(order.status)
    );
    const delivery = allOrders.filter(order =>
        order.status === "SHIPPING"
    );
    const finished = allOrders.filter(order =>
        order.status === "RECEIVED"
    );
    const cancelled = allOrders.filter(order =>
        order.status === "CANCELLED"
    );
    document.getElementById("totalOrders").textContent = `${allOrders.length} đơn`;
    document.getElementById("receivedOrders").textContent = `${finished.length} đơn`;

    document.getElementById("countAll").textContent = allOrders.length;
    document.getElementById("countDoing").textContent = doing.length;
    document.getElementById("countDelivery").textContent = delivery.length;
    document.getElementById("countFinished").textContent = finished.length;
    document.getElementById("countCancelled").textContent = cancelled.length;
}

function getOrdersByStatus() {
    switch (currentFilter) {
        case "doing":
            return allOrders.filter(order => ["PENDING", "PROCESSING"].includes(order.status));
        case "delivery":
            return allOrders.filter(order => order.status === "SHIPPING");
        case "finished":
            return allOrders.filter(order => order.status === "RECEIVED");
        case "cancelled":
            return allOrders.filter(order => order.status === "CANCELLED");
        default:
            return allOrders;
    }
}

function filterOrdersByDate(orders) {
    const filter = document.getElementById("filterDate").value;
    if (filter === "all") return orders;
    const now = new Date();
    const start = new Date();
    if (filter === "7days") {
        start.setDate(now.getDate() - 7);
    } else if (filter === "30days") {
        start.setDate(now.getDate() - 30);
    } else if (filter === "thisMonth") {
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
    } else if (filter === "thisYear") {
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
    }
    return orders.filter(order => {
        const createdAt = new Date(order.created_at);
        return createdAt >= start && createdAt <= now;
    });
}

function searchOrders(orders) {
    const keyword = document.getElementById("searchOrder").value.trim().toLowerCase();
    if (!keyword) return orders;
    return orders.filter(order => {
        const orderCode = (order.order_code || "").toLowerCase();
        const itemNames = (order.item_names || []).join(" ").toLowerCase();
        return orderCode.includes(keyword) || itemNames.includes(keyword);
    });
}

function renderOrders() {
    const container = document.getElementById("orderList");
    let orders = getOrdersByStatus();
    orders = filterOrdersByDate(orders);
    orders = searchOrders(orders);
    const total = orders.length;
    const totalPages = getTotalPages(total);
    if (currentPage > totalPages) {
        currentPage = totalPages;
    }
    const startIndex = (currentPage - 1) * ORDERS_PER_PAGE;
    const pageOrders = orders.slice(
        startIndex,
        startIndex + ORDERS_PER_PAGE
    );
    if (pageOrders.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fa-regular fa-folder-open fa-2x mb-3"></i>
                <p>Không tìm thấy đơn hàng phù hợp.</p>
            </div>
        `;
    } else {
        container.innerHTML = pageOrders.map(renderOrderCard).join("");
    }
    updatePagination(total);
}

function getTotalPages(total = null) {
    const count = total === null ? searchOrders(filterOrdersByDate(getOrdersByStatus())).length : total;
    return Math.max(1, Math.ceil(count / ORDERS_PER_PAGE));
}

function renderOrderCard(order) {
    const itemNames = order.item_names?.length ? order.item_names : ["Đơn hàng chưa có thông tin sản phẩm"];
    const orderName = itemNames.join(", ");
    const status = getOrderStatus(order.status);
    const paymentMethod = getPaymentMethod(order.payment_method);
    const paymentStatus = getPaymentStatus(order.payment_status);
    const createdAt = formatOrderDate(order.created_at);
    const totalAmount = formatOrderMoney(order.total_amount);
    const paymentButton = order.can_continue_payment ? `
            <a class="see-order-button" href="../shop/payment-success.html?code=${encodeURIComponent(order.order_code)}">
                <i class="fa-solid fa-credit-card"></i>
                Thanh toán tiếp
            </a>
        ` : "";

    const orderClass = order.status === "CANCELLED" ? "order cancelled-order" : "order";

    return `
        <div class="${orderClass}">
            <div class="upper-texts">
                <div class="left-texts">
                    <span class="order-id">#${escapeOrderHtml(order.order_code || order.id)}</span>
                    <span class="order-date">Đặt lúc ${createdAt}</span>
                    <span class="order-state ${order.status === "CANCELLED" ? "cancelled-status" : ""}">${status}</span>
                </div>
                <span class="right-text">
                    <i class="${order.payment_method === "BANK_TRANSFER" 
                    ? "fa-solid fa-building-columns" : "fa-solid fa-money-bill-wave"}"></i>${paymentMethod}
                </span>
            </div>
            <div class="order-content">
                <div class="order-image">
                    ${order.thumbnail_url ? `<img src="../${order.thumbnail_url}" alt="Sản phẩm">` : `<i class="fa-solid fa-gift"></i>`}
                </div>
                <div class="right-box">
                    <div class="upper-texts">
                        <div class="left-texts">
                            <h1 class="order-name">${escapeOrderHtml(orderName)}</h1>
                        </div>
                        <div class="right-texts">
                            <span class="money-title">Tổng thanh toán</span>
                            <span class="total-money">${totalAmount}</span>
                            <span class="paid-state">${paymentStatus}</span>
                        </div>
                    </div>
                    <div class="action-box">
                        ${paymentButton}
                        <button class="see-order-button" type="button" onclick="viewOrderDetail(${Number(order.id)})">
                            <i class="fa-regular fa-file-lines"></i>Xem chi tiết hóa đơn
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getOrderStatus(status) {
    const statuses = {
        PENDING: "Chờ xác nhận",
        PROCESSING: "Đang xử lý / Cắm hoa",
        SHIPPING: "Đang giao hàng",
        RECEIVED: "Đã hoàn thành",
        CANCELLED: "Đã hủy"
    };
    return statuses[status] || status || "Không xác định";
}

function getPaymentMethod(method) {
    const methods = {
        CASH: "Tiền mặt",
        BANK_TRANSFER: "Chuyển khoản"
    };
    return methods[method] || "Chưa xác định";
}

function getPaymentStatus(status) {
    const statuses = {
        UNPAID: "Chưa thanh toán",
        PAID: "Đã thanh toán",
        FAILED: "Thanh toán thất bại"
    };
    return statuses[status] || "Chưa xác định";
}

function formatOrderMoney(amount) {
    return new Intl.NumberFormat("vi-VN").format(amount || 0) + " đ";
}

function formatOrderDate(date) {
    if (!date) return "";
    const value = new Date(date);
    if (Number.isNaN(value.getTime())) return "";
    return value.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

function escapeOrderHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function updatePagination(total) {
    const totalPages = getTotalPages(total);
    const start = total === 0 ? 0 : (currentPage - 1) * ORDERS_PER_PAGE + 1;
    const end = Math.min(currentPage * ORDERS_PER_PAGE, total);

    document.getElementById("totalPages").textContent = `Hiển thị ${start}–${end} trên tổng số ${total} đơn hàng`;
    document.getElementById("prevPage").disabled = currentPage <= 1;
    document.getElementById("nextPage").disabled = currentPage >= totalPages;
    const pageNumbers = document.getElementById("pageNumbers");
    pageNumbers.innerHTML = Array.from(
        {length: totalPages},
        (_, index) => {
            const page = index + 1;
            return `
                <button
                    class="number-button ${page === currentPage ? "active" : ""}"type="button" onclick="goToOrderPage(${page})">${page}
                </button>
            `;
        }
    ).join("");
}

function goToOrderPage(page) {
    currentPage = page;
    renderOrders();
}

function viewOrderDetail(orderId) {
    window.location.href = `order-detail.html?id=${orderId}`;
}