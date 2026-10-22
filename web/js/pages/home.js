(function () {
  'use strict';

  const ALL = 'Tất cả';
  let bestSellers = [];
  let currentMaterial = ALL;

  function renderList(containerId, products) {
    const box = document.getElementById(containerId);
    if (!box) return;
    if (!products.length) {
      box.innerHTML = '<p class="text-muted-fw text-center py-5 mb-0">Không tìm thấy bó hoa phù hợp.</p>';
      return;
    }
    box.innerHTML = products.map((p) => `<div class="col-6 col-lg-3">${FW.renderProductCard(p)}</div>`).join('');
  }

  function renderMaterialTabs() {
    const tabs = document.getElementById('materialTabs');
    tabs.innerHTML = [ALL, ...FW_API.MATERIALS]
        .map((m) => `<button type="button" role="tab" class="btn btn-ghost${m === currentMaterial ? ' active' : ''}"
                    aria-selected="${m === currentMaterial}" data-material="${FW.escapeHtml(m)}">${FW.escapeHtml(m)}</button>`)
        .join('');
  }

  function applyFilter() {
    const filtered = currentMaterial === ALL ? bestSellers : bestSellers.filter((p) => p.material === currentMaterial);
    renderList('bestSellerList', filtered);
  }

  document.getElementById('materialTabs').addEventListener('click', (event) => {
    const button = event.target.closest('[data-material]');
    if (!button) return;
    currentMaterial = button.dataset.material;
    renderMaterialTabs();
    applyFilter();
  });

  async function init() {
    renderMaterialTabs();
    const tasks = [
      FW_API.getBestSellers(),
      FW_API.getNewProducts()
    ];

    try {
      const [best, fresh] = await Promise.all(tasks);
      bestSellers = best;
      applyFilter();
      renderList('newProductList', fresh);
    } catch (error) {
      console.error(error);
      document.getElementById('bestSellerList').innerHTML =
          `<p class="text-rose text-center py-5 mb-0">${FW.escapeHtml(error.message || 'Không tải được sản phẩm, vui lòng thử lại.')}</p>`;
    }

    let userId = null;
    try { userId = localStorage.getItem('fw_user_id'); } catch (_) {}
    if (userId) {
      try {
        const recommendations = await FW_API.getRecommendations();
        if (recommendations.length) {
          document.getElementById('recommendationSection').hidden = false;
          renderList('recommendationList', recommendations);
        }
      } catch (error) {
        console.debug('Không tải được gợi ý cá nhân:', error.message);
      }
    }
  }

  init();
})();
