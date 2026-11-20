let allComplaints = [];
let eligibleOrders = [];

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("complaintsList")) {
        loadMyComplaints();
    }
    document.getElementById("createComplaintBtn")?.addEventListener("click", openCreateComplaintModal);
    document.addEventListener("click", (event) => {
        const button = event.target.closest(".send-complaint-button");
        if (!button) return;
        openCreateComplaintModal();
    });

    document.getElementById("seeHistoryBtn")?.addEventListener("click", () => {
        document.getElementById("complaintsList").scrollIntoView({behavior: "smooth", block: "start"});
    });

    document.getElementById("complaintDescription")?.addEventListener("input", () => {
        const description = document.getElementById("complaintDescription").value;
        document.getElementById("complaintDescriptionCount").textContent = description.length;
        document.getElementById("complaintDescriptionError").textContent = "";
    });
    document.getElementById("complaintOrderId")?.addEventListener("change", () => {
        document.getElementById("complaintOrderError").textContent = "";
    });
    document.getElementById("submitComplaintBtn")?.addEventListener("click", createComplaint);
});

// =====================================================================================
// ================================== Load complaints ==================================
// =====================================================================================
async function loadMyComplaints() {
    const container = document.getElementById("complaintsList");
    container.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-secondary"></div>
            <p class="mt-2">Đang tải lịch sử khiếu nại...</p>
        </div>
    `;
    try {
        allComplaints = await FW_API.getMyComplaints();
        if (!Array.isArray(allComplaints)) {
            throw new Error("Dữ liệu API không phải danh sách khiếu nại");
        }
        allComplaints.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        renderComplaints();
    } catch (error) {
        console.error("Lỗi tải lịch sử khiếu nại:", error);
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fa-solid fa-triangle-exclamation text-danger fa-2x"></i>
                <p class="mt-3 text-danger">Không thể tải lịch sử khiếu nại. Vui lòng thử lại.</p>
                <button class="btn btn-outline-secondary btn-sm" type="button" onclick="loadMyComplaints()">Thử lại</button>
            </div>
        `;
    }
}

// =====================================================================================
// ================================= render complaints =================================
// =====================================================================================
function renderComplaints() {
    const container = document.getElementById("complaintsList");
    if (allComplaints.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fa-regular fa-folder-open fa-3x text-muted mb-3"></i>
                <h5>Chưa có khiếu nại nào</h5>
                <p class="text-muted">Những khiếu nại bạn đã gửi sẽ được hiển thị tại đây.</p>
            </div>
        `;
        return;
    }
    container.innerHTML = allComplaints.map(complaint => renderComplaintCard(complaint)).join("");
}

function renderComplaintCard(complaint) {
    const status = getComplaintStatus(complaint.moderation_status);
    const evidenceImage = complaint.evidence_image_url ? `
            <div class="images-box">
                <span>Ảnh minh chứng</span>
                <div class="mt-2">
                    <a href="${complaint.evidence_image_url}"target="_blank" rel="noopener noreferrer">
                        <img src="${complaint.evidence_image_url}" alt="Ảnh minh chứng" style="width:120px;height:120px;object-fit:cover;border-radius:8px;">
                    </a>
                </div>
            </div>`
        : "";

    const partnerResponse = complaint.partner_response ? `
            <div class="your-req-box">
                <span>Phản hồi từ Đối tác</span>
                <p class="mt-2">${escapeComplaintHtml(complaint.partner_response)}</p>
                <small class="text-muted">${formatComplaintDate(complaint.partner_responded_at)}</small>
            </div>`
        : "";
    const moderationNote = complaint.moderation_note ? `
            <div class="your-req-box">
                <span>Ý kiến từ Quản lý</span>
                <p class="mt-2">${escapeComplaintHtml(complaint.moderation_note)}</p>
                <small class="text-muted">${formatComplaintDate(complaint.moderated_at)}</small>
            </div>`
        : "";
    return `
        <div class="complaint-item">
            <div class="complaint-id-box">
                <div>
                    <span>Khiếu nại #${complaint.id}</span>
                    <p class="text-muted small mb-0">Ngày gửi: ${formatComplaintDate(complaint.created_at)}</p>
                </div>
                <span class="badge ${status.className}">${status.label}</span>
            </div>
            <div class="order-box">
                <span>Đơn hàng</span>
                <p class="mt-2">${escapeComplaintHtml(complaint.order_code || "Đơn hàng #" + complaint.order_id)}</p>
            </div>
            <div class="reason-box">
                <span>Nội dung khiếu nại</span>
                <p class="mt-2">${escapeComplaintHtml(complaint.description)}</p>
            </div>
            ${evidenceImage}
            ${partnerResponse}
            ${moderationNote}
            <div class="steps-box">
                <span>Trạng thái xử lý</span>
                <p class="mt-2 mb-0">${status.label}</p>
            </div>
        </div>
    `;
}

// =====================================================================================
// =================================  complaints state =================================
// =====================================================================================
function getComplaintStatus(status) {
    const statuses = {
        PENDING_PARTNER: {label: "Chờ Đối tác phản hồi", className: "text-bg-warning"},
        PENDING_REVIEW: {label: "Chờ Quản lý xem xét", className: "text-bg-info"},
        NEEDS_REWORK: {label: "Đối tác đang xử lý lại", className: "text-bg-primary"},
        RESOLVED: {label: "Đã giải quyết", className: "text-bg-success"}
    };
    return statuses[status] || {label: "Không xác định", className: "text-bg-secondary"};
}

// =====================================================================================
// ============================= Load can complaint orders =============================
// =====================================================================================
async function loadCanComplaintOrders() {
    const select = document.getElementById("complaintOrderId");
    const errorBox = document.getElementById("complaintOrderError");

    select.innerHTML = `<option value="">Đang tải đơn hàng...</option>`;
    select.disabled = true;
    errorBox.textContent = "";

    try {
        eligibleOrders = await FW_API.getCanComplaintOrders();
        if (!Array.isArray(eligibleOrders)) {
            throw new Error("Dữ liệu API không hợp lệ");
        }
        if (eligibleOrders.length === 0) {
            select.innerHTML = `<option value="">Không có đơn hàng đủ điều kiện</option>`;
            return;
        }
        select.innerHTML = `
            <option value="">-- Chọn đơn hàng --</option>
            ${eligibleOrders.map(order => `
                <option value="${order.id}">
                    ${escapeComplaintHtml(order.order_code)}
                    - ${order.status === "SHIPPING" ? "Đang giao" : "Đã nhận"}
                    - ${formatComplaintMoney(order.total_amount)}
                </option>
            `).join("")}
        `;
    } catch (error) {
        console.error("Lỗi tải đơn hàng đủ điều kiện:", error);
        select.innerHTML = `<option value="">Không thể tải đơn hàng</option>`;
        errorBox.textContent = "Không thể tải danh sách đơn hàng. Vui lòng thử lại.";
    } finally {
        select.disabled = false;
    }
}

// =====================================================================================
// ================================= create complaints =================================
// =====================================================================================
async function createComplaint() {
    const orderId = document.getElementById("complaintOrderId").value;
    const description = document.getElementById("complaintDescription").value.trim();
    const imageFile = document.getElementById("complaintImage").files[0];

    const orderError = document.getElementById("complaintOrderError");
    const descriptionError = document.getElementById("complaintDescriptionError");
    const createError = document.getElementById("createComplaintError");
    const submitBtn = document.getElementById("submitComplaintBtn");

    orderError.textContent = "";
    descriptionError.textContent = "";
    createError.textContent = "";
    let hasError = false;
    if (!orderId) {
        orderError.textContent = "Vui lòng chọn đơn hàng.";
        hasError = true;
    }
    if (description.length < 20) {
        descriptionError.textContent = "Nội dung khiếu nại phải có ít nhất 20 ký tự.";
        hasError = true;
    } else if (description.length > 2000) {
        descriptionError.textContent = "Nội dung không được vượt quá 2000 ký tự.";
        hasError = true;
    }
    if (imageFile) {
        const allowedTypes = ["image/jpeg", "image/png"];
        if (!allowedTypes.includes(imageFile.type)) {
            createError.textContent = "Chỉ chấp nhận ảnh JPG hoặc PNG.";
            hasError = true;
        } else if (imageFile.size > 5 * 1024 * 1024) {
            createError.textContent = "Ảnh không được vượt quá 5MB.";
            hasError = true;
        }
    }
    if (hasError) return;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span>Đang gửi...`;
    try {
        let imageUrl = null;
        if (imageFile) {
            const uploadResult = await FW_API.uploadImage(imageFile);
            imageUrl = uploadResult.url;
        }
        await FW_API.createComplaint({order_id: Number(orderId), description: description, evidence_image_url: imageUrl});
        alert("Gửi khiếu nại thành công!");
        const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById("createComplaintModal"));
        modal.hide();
        resetComplaintForm();
        if (document.getElementById("complaintsList")) {
            await loadMyComplaints();
        }
    } catch (error) {
        console.error("Lỗi tạo khiếu nại:", error);
        createError.textContent = error.message || "Không thể gửi khiếu nại. Vui lòng thử lại.";
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fa-solid fa-paper-plane me-1"></i> Gửi khiếu nại`;
    }
}

function resetComplaintForm() {
    document.getElementById("complaintOrderId").value = "";
    document.getElementById("complaintDescription").value = "";
    document.getElementById("complaintImage").value = "";
    document.getElementById("complaintDescriptionCount").textContent = "0";

    document.getElementById("complaintOrderError").textContent = "";
    document.getElementById("complaintDescriptionError").textContent = "";
    document.getElementById("createComplaintError").textContent = "";
}

function formatComplaintMoney(amount) {
    return new Intl.NumberFormat("vi-VN").format(amount || 0) + " đ";
}

function formatComplaintDate(date) {
    if (!date) return "Chưa có";
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

function escapeComplaintHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

async function openCreateComplaintModal() {
    resetComplaintForm();
    await loadCanComplaintOrders();
    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById("createComplaintModal"));
    modal.show();
}