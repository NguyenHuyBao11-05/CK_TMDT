let errorBox;
document.addEventListener("DOMContentLoaded", () => {
    loadOrderDetail().then(() => {});
});

async function loadOrderDetail() {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("id");

    const loading = document.getElementById("loadingOrder");
    const content = document.getElementById("orderDetailContent");

    if (!orderId || !/^\d+$/.test(orderId)) {
        showOrderError("Mã đơn hàng không hợp lệ.");
        return;
    }

    try {
        const order = await FW_API.getOrderDetail(orderId);
        renderOrderDetail(order);
        loading.classList.add("d-none");
        content.classList.remove("d-none");
    } catch (error) {
        console.error("Lỗi tải chi tiết đơn hàng:", error);
        loading.classList.add("d-none");
        if (error.status === 404) {
            showOrderError("Không tìm thấy đơn hàng hoặc bạn không có quyền xem đơn hàng này.");
        } else {
            showOrderError("Không thể tải chi tiết đơn hàng. Vui lòng thử lại.");
        }
    }
}

function renderOrderDetail(order) {
    setText("orderCode", order.order_code);
    setText("createdAt", formatDate(order.created_at));

    setText("recipientName", order.recipient_name);
    setText("recipientPhone", order.recipient_phone);
    setText("deliveryAddress", order.delivery_address);
    setText("deliveryNote", order.delivery_note || "Không có");

    setText("subtotalAmount", formatMoney(order.subtotal_amount));
    setText("shippingFee", formatMoney(order.shipping_fee));
    setText("discountAmount", formatMoney(order.discount_amount));
    setText("totalAmount", formatMoney(order.total_amount));

    setText("paymentMethod", getPaymentMethod(order.payment_method));
    setText("paymentStatus", getPaymentStatus(order.payment_status));

    setText("shippedAt", formatDate(order.shipped_at));
    setText("receivedAt", formatDate(order.received_at));

    const statusElement = document.getElementById("orderStatus");
    statusElement.textContent = getOrderStatus(order.status);
    statusElement.className = "order-status " + order.status.toLowerCase();

    renderOrderItems(order.items || []);

    const cancelButton = document.getElementById("cancelOrderBtn");
    if (order.status === "PENDING" && order.payment_status !== "PAID") {
        cancelButton.classList.remove("d-none");
    } else {
        cancelButton.classList.add("d-none");
    }

    const receivedButton = document.getElementById("receivedOrderBtn");
    if (order.status === "SHIPPING") {
        receivedButton.classList.remove("d-none");
    } else {
        receivedButton.classList.add("d-none");
    }

    const reviewBtn = document.getElementById("reviewOrderBtn");
    if (order.status === "RECEIVED" && !order.is_reviewed) {
        reviewBtn.classList.remove("d-none");
    } else {
        reviewBtn.classList.add("d-none");
    }
}

function renderOrderItems(items) {
    const container = document.getElementById("orderItems");
    if (items.length === 0) {
        container.innerHTML = "<p>Đơn hàng chưa có sản phẩm.</p>";
        return;
    }
    container.innerHTML = items.map(item => {const imageUrl = item.thumbnail_url ? item.thumbnail_url : "";
        return `
            <div class="detail-item">
                <div class="detail-item-image">
                    ${imageUrl ? `<img src="../${imageUrl}" alt="${escapeHtml(item.item_name)}">` : `<i class="fa-solid fa-gift"></i>`}
                </div>

                <div class="detail-item-info">
                    <strong>${escapeHtml(item.item_name)}</strong>
                    <p>${escapeHtml(item.item_description || "")}</p>
                    <p>Chất liệu: ${escapeHtml(item.material || "Không có thông tin")}</p>
                    <p>Số lượng: ${item.quantity}</p>
                </div>

                <div class="detail-item-price">
                    <strong>${formatMoney(item.subtotal)}</strong>
                    <small>${formatMoney(item.unit_price)} / sản phẩm</small>
                </div>
            </div>
        `;
    }).join("");
}

function setText(id, value) {
    document.getElementById(id).textContent = value === null || value === undefined || value === "" ? "—" : value;
}

function formatMoney(value) {
    return Number(value || 0).toLocaleString("vi-VN") + " ₫";
}

function formatDate(value) {
    if (!value) return "Chưa có";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("vi-VN");
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
        CASH: "Tiền mặt / COD",
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
    return statuses[status] || status || "Chưa xác định";
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function showOrderError(message) {
    const errorBox = document.getElementById("orderError");
    errorBox.textContent = message;
    errorBox.classList.remove("d-none");
}

// ====================================================================================
// ====================================== CANCEL ======================================
// =====================================================================================
let cancelOrderModal;
document.addEventListener("DOMContentLoaded", () => {
    cancelOrderModal = new bootstrap.Modal(
        document.getElementById("cancelOrderModal")
    );
    document.getElementById("cancelOrderBtn")?.addEventListener("click", openCancelModal);
    document.getElementById("confirmCancelOrderBtn")?.addEventListener("click", confirmCancelOrder);
    document.getElementById("cancelReason")?.addEventListener("input", updateCancelReasonCount);
});

function openCancelModal() {
    const reasonInput = document.getElementById("cancelReason");
    const error = document.getElementById("cancelReasonError");

    reasonInput.value = "";
    error.textContent = "";
    error.classList.add("d-none");

    updateCancelReasonCount();
    cancelOrderModal.show();
}

function updateCancelReasonCount() {
    const reason = document.getElementById("cancelReason").value;
    document.getElementById("cancelReasonCount").textContent = reason.length;
}

async function confirmCancelOrder() {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("id");
    const reason = document.getElementById("cancelReason").value.trim();
    const error = document.getElementById("cancelReasonError");
    const button = document.getElementById("confirmCancelOrderBtn");
    if (!reason) {
        error.textContent = "Vui lòng nhập lý do huỷ đơn.";
        error.classList.remove("d-none");
        return;
    }
    if (reason.length > 300) {
        error.textContent = "Lý do huỷ không được vượt quá 300 ký tự.";
        error.classList.remove("d-none");
        return;
    }
    button.disabled = true;
    button.textContent = "Đang xử lý...";
    try {
        const result = await FW_API.cancelOrder(orderId, {
            reason: reason
        });
        cancelOrderModal.hide();
        let message = result.message || "Huỷ đơn hàng thành công.";
        if (result.refund_message) {
            message += "\n" + result.refund_message;
        }
        alert(message);
        await loadOrderDetail();
    } catch (error) {
        console.error("Lỗi huỷ đơn:", error);
        errorBox = document.getElementById("cancelReasonError");
        errorBox.textContent = error.message || "Không thể huỷ đơn hàng.";
        errorBox.classList.remove("d-none");
    } finally {
        button.disabled = false;
        button.textContent = "Xác nhận huỷ";
    }
}

// =====================================================================================
// ====================================== RECEIVE ======================================
// =====================================================================================
document.getElementById("receivedOrderBtn")?.addEventListener("click", confirmReceivedOrder);
async function confirmReceivedOrder() {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("id");
    if (!confirm("Bạn xác nhận đã nhận được đơn hàng này?")) {
        return;
    }
    const button = document.getElementById("receivedOrderBtn");
    button.disabled = true;
    try {
        const result = await FW_API.receivedOrder(orderId);
        alert(result.message || "Xác nhận đã nhận hàng thành công.");
        await loadOrderDetail();
    } catch (error) {
        console.error("Lỗi xác nhận nhận hàng:", error);
        alert(error.message || "Không thể xác nhận nhận hàng.");
    } finally {
        button.disabled = false;
    }
}

// =====================================================================================
// ====================================== REVIEW =======================================
// =====================================================================================
const reviewModalElement = document.getElementById("reviewOrderModal");
const reviewModal = new bootstrap.Modal(reviewModalElement);

document.getElementById("reviewOrderBtn").addEventListener("click", () => {
    document.getElementById("reviewRating").value = "";
    document.getElementById("reviewComment").value = "";
    document.getElementById("reviewImage").value = "";
    document.getElementById("reviewCommentCount").textContent = "0";
    document.getElementById("reviewRatingError").textContent = "";
    document.getElementById("reviewError").textContent = "";
    reviewModal.show();
});

document.getElementById("reviewComment").addEventListener("input", function () {
    document.getElementById("reviewCommentCount").textContent = this.value.length;
});

document.getElementById("submitReviewBtn").addEventListener("click", async () => {
    const rating = document.getElementById("reviewRating").value;
    const comment = document.getElementById("reviewComment").value.trim();
    const imageFile = document.getElementById("reviewImage").files[0];
    const ratingError = document.getElementById("reviewRatingError");
    const errorBox = document.getElementById("reviewError");
    ratingError.textContent = "";
    errorBox.textContent = "";

    if (!rating) {
        ratingError.textContent = "Vui lòng chọn số sao.";
        return;
    }

    if (comment.length > 1000) {
        errorBox.textContent = "Nhận xét không được vượt quá 1000 ký tự.";
        return;
    }

    try {
        let imageUrl = null;
        if (imageFile) {
            if (!["image/jpeg", "image/png"].includes(imageFile.type)) {
                errorBox.textContent = "Chỉ nhận ảnh JPG hoặc PNG.";
                return;
            }
            const uploadResult = await FW_API.uploadImage(imageFile);
            imageUrl = uploadResult.url;
        }
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get("id");
        await FW_API.createOrderReview(orderId, {
            rating: Number(rating),
            comment: comment || null,
            image_url: imageUrl
        });
        alert("Gửi đánh giá thành công!");
        reviewModal.hide();
        await loadOrderDetail();
    } catch (error) {
        console.error(error);
        errorBox.textContent = error.message || "Không thể gửi đánh giá.";
    }
});