let allComplaints = [];
let currentFilter = "ALL";
let selectedComplaintId = null;

// ============================= DOMContentLoaded =============================
document.addEventListener("DOMContentLoaded", () => {
    loadPartnerComplaints().then(() => {
    });
    document.querySelectorAll(".list-filters .filter").forEach(tab => {
        tab.addEventListener("click", event => {
            event.preventDefault();
            document.querySelectorAll(".list-filters .filter").forEach(item => {
                item.classList.remove("active");
            });
            tab.classList.add("active");
            currentFilter = tab.dataset.filter;
            renderComplaints();
        });
    });

    document.getElementById("searchInput").addEventListener("input", () => {
        renderComplaints();
    });

    document.getElementById("backToListBtn").addEventListener("click", () => {
        document.querySelector(".left-container").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });

    const historyButton = document.querySelector(".button-box .see-history-button");

    if (historyButton) {
        historyButton.addEventListener("click", () => {
            currentFilter = "RESOLVED";
            document.querySelectorAll(".list-filters .filter").forEach(item => {
                item.classList.toggle("active", item.dataset.filter === currentFilter);
            });
            renderComplaints();
        });
    }

    const pendingButton = document.querySelector(".button-box .create-req-button");

    if (pendingButton) {
        pendingButton.addEventListener("click", () => {
            currentFilter = "NEED_REPLY";
            document.querySelectorAll(".list-filters .filter").forEach(item => {
                item.classList.toggle("active", item.dataset.filter === currentFilter);
            });
            renderComplaints();
        });
    }

    document.getElementById("responseContent").addEventListener("input", () => {
        document.getElementById("responseContentCount").textContent = `${document.getElementById("responseContent").value.length}/2000 ký tự`;
    });
    document.getElementById("complaintResponseForm").addEventListener("submit", submitComplaintResponse);
});

// ============================= load complaints =============================
async function loadPartnerComplaints() {
    const container = document.getElementById("complaintsList");
    container.innerHTML = `
        <div class="text-center py-4">
            Đang tải danh sách khiếu nại...
        </div>
    `;
    try {
        allComplaints = await FW_API.getPartnerComplaints();

        console.log("Complaint đầu tiên:", allComplaints[0]);
        console.log("Tên sản phẩm:", allComplaints[0]?.product_name);
        console.log("Số lượng:", allComplaints[0]?.quantity);
        if (!Array.isArray(allComplaints)) {
            throw new Error("Dữ liệu API không phải danh sách khiếu nại.");
        }
        allComplaints.sort((a, b) =>
            new Date(b.created_at) - new Date(a.created_at)
        );
        updateComplaintCounts();
        renderComplaints();
        if (allComplaints.length > 0) {
            const selected = allComplaints.find(item => String(item.id) === String(selectedComplaintId));
            selectComplaint(selected || allComplaints[0]);
        } else {
            selectedComplaintId = null;
            container.innerHTML = `
                <div class="text-center py-4">
                    Chưa có khiếu nại nào.
                </div>
            `;
            clearComplaintDetail();
        }

    } catch (error) {
        console.error("Lỗi tải danh sách khiếu nại:", error);
        container.innerHTML = `
            <div class="text-center text-danger py-4">
                Không thể tải danh sách khiếu nại.
                <p class="small">${escapeComplaintHtml(error.message)}</p>
            </div>
        `;
    }
}

// ============================= update counts =============================
function updateComplaintCounts() {
    const countAll = document.getElementById("countAll");
    const countNeedReply = document.getElementById("countNeedReply");
    const countReview = document.getElementById("countReview");
    const countResolved = document.getElementById("countResolved");

    const needReplyCount = allComplaints.filter(c => ["PENDING_PARTNER", "NEEDS_REWORK"].includes(c.moderation_status)).length;
    const reviewCount = allComplaints.filter(c => c.moderation_status === "PENDING_REVIEW").length;
    const resolvedCount = allComplaints.filter(c => c.moderation_status === "RESOLVED").length;

    if (countAll) countAll.textContent = allComplaints.length;
    if (countNeedReply) countNeedReply.textContent = needReplyCount;
    if (countReview) countReview.textContent = reviewCount;
    if (countResolved) countResolved.textContent = resolvedCount;
}

// ============================= filter complaints =============================
function getComplaintsByStatus() {
    switch (currentFilter) {
        case "NEED_REPLY":
            return allComplaints.filter(complaint => ["PENDING_PARTNER", "NEEDS_REWORK"].includes(complaint.moderation_status));
        case "PENDING_REVIEW":
            return allComplaints.filter(complaint => complaint.moderation_status === "PENDING_REVIEW");
        case "RESOLVED":
            return allComplaints.filter(complaint => complaint.moderation_status === "RESOLVED");
        default:
            return allComplaints;
    }
}

function searchComplaints(complaints) {
    const keyword = document.getElementById("searchInput").value.trim().toLowerCase();
    if (!keyword) return complaints;
    return complaints.filter(complaint => {
        const id = String(complaint.id || "").toLowerCase();
        const orderCode = (complaint.order_code || "").toLowerCase();
        const customerName = (complaint.customer_name || "").toLowerCase();
        const description = (complaint.description || "").toLowerCase();
        return id.includes(keyword) || orderCode.includes(keyword) || customerName.includes(keyword) || description.includes(keyword);
    });
}

// ============================= render complaints =============================

function renderComplaints() {
    const container = document.getElementById("complaintsList");

    let complaints = getComplaintsByStatus();
    complaints = searchComplaints(complaints);

    if (complaints.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fa-regular fa-folder-open fa-2x mb-3"></i>
                <p>Không tìm thấy khiếu nại phù hợp.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = complaints.map(renderComplaintCard).join("");
}

// ============================= render complaint card =============================

function renderComplaintCard(complaint) {
    const status = getComplaintStatus(complaint.moderation_status);
    const isSelected = String(complaint.id) === String(selectedComplaintId);
    const complaintClass = ["complaint-item",
        ["PENDING_PARTNER", "NEEDS_REWORK"].includes(complaint.moderation_status) ? "important" : "", isSelected ? "selected" : ""
    ].filter(Boolean).join(" ");

    return `
        <div class="${complaintClass}" data-id="${complaint.id}">
            <div class="upper-texts">
                <div class="left-texts">
                    <span class="complaint-id">#KN-${complaint.id}</span>
                    <i class="fa-solid fa-circle"></i>
                    <span class="order-id">${escapeComplaintHtml(complaint.order_code)}</span>
                </div>
                <span class="complaint-status ${status.className}">${status.label}</span>
            </div>
            <span class="complaint-title">${escapeComplaintHtml(complaint.description)}</span>
            <div class="complaint-info-box">
                <span class="user"><i class="fa-solid fa-user"></i> Khách: ${escapeComplaintHtml(complaint.customer_name)}</span>
            </div>
            <div class="down-texts">
                <span class="time"><i class="fa-regular fa-clock"></i> ${formatComplaintDate(complaint.created_at)}</span>
            </div>
        </div>
    `;
}

// ============================= click complaint =============================
document.addEventListener("click", event => {
    const item = event.target.closest(".complaint-item");
    if (!item) return;
    const complaint = allComplaints.find(item =>
        String(item.id) === String(event.target.closest(".complaint-item").dataset.id)
    );
    if (complaint) {
        selectComplaint(complaint);
    }
});

// ============================= complaint detail =============================
function selectComplaint(complaint) {
    selectedComplaintId = complaint.id;
    renderComplaints();
    const status = getComplaintStatus(complaint.moderation_status);
    const statusElement = document.getElementById("detailStatus");

    statusElement.textContent = status.label;
    statusElement.className = `complaint-status ${status.className}`;

    document.getElementById("detailComplaintId").textContent = `Mã khiếu nại: #KN-${complaint.id}`;
    document.getElementById("detailTitle").textContent = `Đơn ${complaint.order_code} • Nội dung khiếu nại`;
    document.getElementById("detailCustomerName").textContent = complaint.customer_name || "Khách hàng";
    document.getElementById("detailOrderCode").textContent = `Mã đơn: ${complaint.order_code}`;
    document.getElementById("detailDescription").textContent = complaint.description || "";
    document.getElementById("detailCreatedAt").textContent = `Gửi lúc: ${formatComplaintDate(complaint.created_at)}`;
    document.getElementById("detailOrderTotal").textContent = formatComplaintMoney(complaint.order_total);

    renderComplaintProducts(complaint);

    const deadlineElement = document.getElementById("deadline");

    if (["PENDING_PARTNER", "NEEDS_REWORK"].includes(complaint.moderation_status)) {
        deadlineElement.style.display = "";
        deadlineElement.innerHTML = `<i class="fa-regular fa-clock"></i>Hạn phản hồi: ${formatComplaintDeadline(complaint.created_at)}`;
    } else {
        deadlineElement.style.display = "none";
    }

    const evidenceBox = document.getElementById("detailEvidenceBox");
    const evidenceImage = document.getElementById("detailEvidenceImage");
    if (complaint.evidence_image_url) {
        evidenceImage.src = "../.." + complaint.evidence_image_url;
        evidenceBox.style.display = "";
    } else {
        evidenceImage.removeAttribute("src");
        evidenceBox.style.display = "none";
    }
    const previousResponse = document.getElementById("previousPartnerResponse");
    const previousResponseContent = document.getElementById("previousPartnerResponseContent");

    if (complaint.partner_response) {
        previousResponse.style.display = "";
        previousResponseContent.textContent = complaint.partner_response;
    } else {
        previousResponse.style.display = "none";
        previousResponseContent.textContent = "";
    }
    document.getElementById("complaintResponseForm").style.display = ["PENDING_PARTNER", "NEEDS_REWORK"].includes(complaint.moderation_status) ? "" : "none";
    document.getElementById("complaintResponseForm").reset();
    document.getElementById("responseError").textContent = "";
    document.getElementById("responseContentCount").textContent = "0/2000 ký tự";
}

// ============================= clear complaint detail =============================
function clearComplaintDetail() {
    document.getElementById("detailTitle").textContent = "Chọn một khiếu nại để xem chi tiết";
    document.getElementById("detailComplaintId").textContent = "";
    document.getElementById("detailCustomerName").textContent = "—";
    document.getElementById("detailOrderCode").textContent = "Mã đơn: —";
    document.getElementById("detailDescription").textContent = "";
    document.getElementById("detailCreatedAt").textContent = "";
    document.getElementById("detailStatus").textContent = "—";
    document.getElementById("detailOrderTotal").textContent = "—";
    document.getElementById("detailEvidenceBox").style.display = "none";
    document.getElementById("previousPartnerResponse").style.display = "none";
    document.getElementById("deadline").style.display = "none";
    document.getElementById("complaintResponseForm").style.display = "none";
    document.getElementById("detailProducts").innerHTML = "";
    document.getElementById("detailProductQuantity").textContent = "Số lượng: —";
}

// ============================= submit response =============================
async function submitComplaintResponse(event) {
    event.preventDefault();
    const complaint = allComplaints.find(item => String(item.id) === String(selectedComplaintId));
    if (!complaint || !["PENDING_PARTNER", "NEEDS_REWORK"].includes(complaint.moderation_status)) {
        return;
    }
    const responseType = document.getElementById("responseType").value;
    const content = document.getElementById("responseContent").value.trim();

    const errorElement = document.getElementById("responseError");
    const submitButton = document.getElementById("submitResponseBtn");

    errorElement.textContent = "";
    if (!responseType) {
        errorElement.textContent = "Vui lòng chọn phương án xử lý.";
        return;
    }
    if (content.length < 20) {
        errorElement.textContent = "Nội dung phản hồi phải có ít nhất 20 ký tự.";
        return;
    }
    if (content.length > 2000) {
        errorElement.textContent = "Nội dung phản hồi không được vượt quá 2000 ký tự.";
        return;
    }
    submitButton.disabled = true;
    try {
        await FW_API.respondToComplaint(complaint.id, {response_type: responseType, content: content});
        alert("Gửi phản hồi khiếu nại thành công.");
        await loadPartnerComplaints();
    } catch (error) {
        console.error("Lỗi gửi phản hồi khiếu nại:", error);
        errorElement.textContent = error.message || "Không thể gửi phản hồi. Vui lòng thử lại.";
    } finally {
        submitButton.disabled = false;
    }
}

// ============================= status =============================
function getComplaintStatus(status) {
    const statuses = {
        PENDING_PARTNER: {label: "Cần phản hồi", className: "important"},
        NEEDS_REWORK: {label: "Cần xử lý lại", className: "important"},
        PENDING_REVIEW: {label: "Chờ Quản lý", className: "mediation"},
        RESOLVED: {label: "Đã giải quyết", className: "resolved"}
    };
    return statuses[status] || {label: "Không xác định", className: ""};
}

// ============================= format =============================
function formatComplaintDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("vi-VN", {dateStyle: "short", timeStyle: "short"});
}

function formatComplaintMoney(value) {
    if (value == null || value === "") return "—";
    return Number(value).toLocaleString("vi-VN") + " đ";
}

function formatComplaintDeadline(createdAt) {
    if (!createdAt) return "Không xác định";
    const createdDate = new Date(createdAt);
    if (Number.isNaN(createdDate.getTime())) return "Không xác định";
    const deadline = new Date(createdDate.getTime() + 2 * 24 * 60 * 60 * 1000);
    return deadline.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function escapeComplaintHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function renderComplaintProducts(complaint) {
    const container = document.getElementById("detailProducts");
    const quantityElement = document.getElementById("detailProductQuantity");
    if (!container || !quantityElement) return;
    const productNames = (complaint.product_name || "")
        .split(",")
        .map(name => name.trim())
        .filter(Boolean);
    const productImages = (complaint.product_image || "")
        .split(",")
        .map(image => image.trim());
    if (productNames.length === 0) {
        container.innerHTML = `
            <div class="inner-texts">
                <span class="order-id">THÔNG TIN SẢN PHẨM</span>
                <h2 class="order-name">Không có thông tin sản phẩm</h2>
            </div>
        `;
    } else {
        container.innerHTML = productNames.map((name, index) => {
            const image = productImages[index];
            return `
                <div class="product-item">
                    <img src="${"../" + image}" alt="${escapeComplaintHtml(name)}">
                    <div class="inner-texts">
                        <span class="order-id">THÔNG TIN SẢN PHẨM</span>
                        <h2 class="order-name">${escapeComplaintHtml(name)}</h2>
                    </div>
                </div>
            `;
        }).join("");
    }
    quantityElement.textContent = `Tổng số lượng: ${complaint.quantity ?? 0}`;
}
