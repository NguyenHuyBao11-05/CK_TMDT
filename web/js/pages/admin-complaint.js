let allComplaints = [];
let selectedComplaint = null;

const complaintList = document.querySelector(".list-complaints");
const pendingComplaintCount = document.getElementById("pendingComplaintCount");

// Tải danh sách khiếu nại
async function loadAdminComplaints() {
    try {
        complaintList.innerHTML = `<div class="text-center py-4">Đang tải danh sách khiếu nại...</div>`;
        allComplaints = await FW_API.getAdminComplaints();
        if (!Array.isArray(allComplaints)) {
            throw new Error("Dữ liệu khiếu nại không hợp lệ");
        }
        renderComplaintList();
    } catch (error) {
        console.error("Lỗi tải danh sách khiếu nại:", error);
        complaintList.innerHTML = `<div class="text-center py-4 text-danger">Không thể tải danh sách khiếu nại.</div>`;
    }
}

function renderComplaintList() {
    pendingComplaintCount.textContent = `${allComplaints.length} Khiếu nại`;
    if (allComplaints.length === 0) {
        complaintList.innerHTML = `<div class="text-center py-4">Hiện không có khiếu nại cần kiểm duyệt.</div>`;
        return;
    }

    complaintList.innerHTML = allComplaints.map(complaint => `
        <div class="complaint-item" data-id="${complaint.id}">
            <div class="complaint-item-header">
                <span class="complaint-id">Khiếu nại #${complaint.id}</span>
                <span class="complaint-status">Chờ kiểm duyệt</span>
            </div>

            <div class="complaint-item-body">
                <h3>${escapeComplaintHTML(complaint.order_code || "Chưa có mã đơn")}</h3>
                <p>Khách hàng: ${escapeComplaintHTML(complaint.customer_name || "Không rõ")}</p>
                <p>Đối tác: ${escapeComplaintHTML(complaint.partner_name || "Không rõ")}</p>
            </div>
        </div>
    `).join("");
}

function escapeComplaintHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function selectComplaint(id) {
    selectedComplaint = allComplaints.find(complaint => complaint.id === Number(id));
    if (!selectedComplaint) return;

    const complaint = selectedComplaint;

    document.getElementById("detailStatus").textContent = getComplaintStatus(complaint.moderation_status);
    document.getElementById("detailComplaintId").textContent = `Mã khiếu nại: #${complaint.id}`;
    document.getElementById("detailTitle").textContent = `Khiếu nại đơn hàng ${complaint.order_code || "—"}`;
    document.getElementById("detailOrderTotal").textContent = complaint.order_total != null ? Number(complaint.order_total).toLocaleString("vi-VN") + " đ" : "—";
    document.getElementById("detailCustomerName").textContent = complaint.customer_name || "Không rõ";
    document.getElementById("detailPartnerName").textContent = complaint.partner_name || "Không rõ";
    document.getElementById("detailDescription").textContent = complaint.description || "Không có nội dung khiếu nại.";
    document.getElementById("detailPartnerResponse").textContent = complaint.partner_response || "Đối tác chưa có phản hồi.";

    const evidenceImage = document.getElementById("detailEvidenceImage");
    const noEvidence = document.getElementById("noEvidence");

    if (complaint.evidence_image_url) {
        evidenceImage.src = "../.." + complaint.evidence_image_url;
        evidenceImage.style.display = "block";
        noEvidence.style.display = "none";
    } else {
        evidenceImage.removeAttribute("src");
        evidenceImage.style.display = "none";
        noEvidence.style.display = "block";
    }

    document.querySelectorAll(".complaint-item").forEach(item => {
        item.classList.toggle("active", Number(item.dataset.id) === complaint.id);
    });
}

function getComplaintStatus(status) {
    const statusMap = {
        PENDING_REVIEW: "Chờ kiểm duyệt",
        PENDING_PARTNER: "Chờ đối tác phản hồi",
        NEEDS_REWORK: "Yêu cầu xử lý lại",
        RESOLVED: "Đã giải quyết"
    };
    return statusMap[status] || status || "Không rõ";
}

async function resolveComplaint() {
    if (!selectedComplaint) {
        alert("Vui lòng chọn khiếu nại.");
        return;
    }
    if (!confirm(`Bạn có chắc chắn muốn đóng khiếu nại #${selectedComplaint.id}?`)) return;
    try {
        const moderationNote = document.getElementById("moderationNote").value.trim();
        await FW_API.resolveComplaint(selectedComplaint.id, {moderation_note: moderationNote} || null);
        alert("Đã đóng khiếu nại thành công.");
        selectedComplaint = null;
        document.getElementById("moderationNote").value = "";
        await loadAdminComplaints();

        document.getElementById("detailStatus").textContent = "Chưa chọn";
        document.getElementById("detailComplaintId").textContent = "Mã khiếu nại: —";
        document.getElementById("detailTitle").textContent = "Chọn một khiếu nại để xem chi tiết";
        document.getElementById("detailOrderTotal").textContent = "—";
        document.getElementById("detailCustomerName").textContent = "—";
        document.getElementById("detailPartnerName").textContent = "—";
        document.getElementById("detailDescription").textContent = "Chưa chọn khiếu nại.";
        document.getElementById("detailPartnerResponse").textContent = "Chưa có phản hồi.";
        const image = document.getElementById("detailEvidenceImage");
        image.removeAttribute("src");
        image.style.display = "none";
        document.getElementById("noEvidence").style.display = "block";
    } catch (error) {
        console.error("Lỗi đóng khiếu nại:", error);
        alert("Không thể đóng khiếu nại. Vui lòng thử lại.");
    }
}

async function reworkComplaint() {
    if (!selectedComplaint) {
        alert("Vui lòng chọn khiếu nại.");
        return;
    }
    const moderationNote = document.getElementById("moderationNote").value.trim();
    if (!moderationNote) {
        alert("Vui lòng nhập lý do yêu cầu xử lý lại.");
        return;
    }
    if (!confirm(`Bạn có chắc chắn muốn yêu cầu xử lý lại khiếu nại #${selectedComplaint.id}?`)) return;
    try {
        await FW_API.reworkComplaint(selectedComplaint.id, {moderation_note: moderationNote} || null);
        alert("Đã yêu cầu xử lý lại khiếu nại.");
        selectedComplaint = null;
        document.getElementById("moderationNote").value = "";
        await loadAdminComplaints();
    } catch (error) {
        console.error("Lỗi yêu cầu xử lý lại:", error);
        alert(error.message || "Không thể yêu cầu xử lý lại.");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadAdminComplaints();
    complaintList.addEventListener("click", event => {
        const item = event.target.closest(".complaint-item");
        if (!item) return;
        selectComplaint(item.dataset.id);
    });
    document.getElementById("resolveComplaintBtn").addEventListener("click", resolveComplaint);
    document.getElementById("reworkComplaintBtn").addEventListener("click", reworkComplaint);
});