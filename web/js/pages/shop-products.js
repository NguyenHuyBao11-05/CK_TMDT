(function () {
  'use strict';

  const form = document.getElementById('filterForm');
  const sortSel = document.getElementById('sortSelect');
  const listBox = document.getElementById('productList');
  const resultInfo = document.getElementById('resultInfo');

  let page = 0;
  let lastList = [];
  let q = new URLSearchParams(window.location.search).get('q') || '';

  // Hiển thị danh sách chất liệu để lọc sản phẩm.
  document.getElementById('materialChecks').innerHTML =
    FW_API.MATERIALS.map((material, index) => `
<div class="form-check">
    <input
class="form-check-input"
type="checkbox"
name="material"
value="${FW.escapeHtml(material)}"
id="mat${index}"
    >
    <label
class="form-check-label"
for="mat${index}"
    >${FW.escapeHtml(material)}</label>
</div>
`).join('');

  async function load() {
    const [min, max] = form.price.value.split('-').map(Number);

    const materials = [
      ...form.querySelectorAll('[name="material"]:checked')
    ].map((checkbox) => checkbox.value);

    listBox.innerHTML =
      '<p class="text-muted-fw text-center py-5">Đang tải sản phẩm...</p>';

    try {
      lastList = await FW_API.getProducts({
        q,
        materials,
        min,
        max,
        sort: sortSel.value,
        page
      });

      resultInfo.textContent =
        (q ? `Kết quả cho "${q}": ` : '') +
        `${lastList.length} mẫu hoa ở trang ${page + 1}`;

      listBox.innerHTML = lastList.length
        ? lastList
            .map(
              (product) =>
                `<div class="col-6 col-xl-4">${FW.renderProductCard(product)}</div>`
            )
            .join('')
        : '<p class="text-muted-fw text-center py-5">Không tìm thấy bó hoa phù hợp.</p>';

      const pager = document.getElementById('productPager');

      if (pager) {
        pager.innerHTML = `
<button
type="button"
class="btn btn-ghost"
data-page="prev"
${page === 0 ? 'disabled' : ''}
>Trang trước</button>

<span class="small text-muted-fw">Trang ${page + 1}</span>

<button
    type="button"
    class="btn btn-ghost"
    data-page="next"
    ${lastList.length < 12 ? 'disabled' : ''}
>Trang sau</button>
    `;
      }
    } catch (error) {
      console.error('Không tải được sản phẩm:', error);

      resultInfo.textContent = 'Không thể tải danh sách sản phẩm.';

      listBox.innerHTML = `
<p class="text-rose text-center py-5">
    ${FW.escapeHtml(
    error.message || 'Kiểm tra backend và kết nối cơ sở dữ liệu.'
)}
</p>
`;
    }
  }

  function setupHeaderSearch() {
    const searchForm = document.getElementById('headerSearch');
    const searchInput = searchForm?.querySelector('[name="q"]');

    if (!searchInput) {
      return;
    }

    searchInput.value = q;

    if (searchInput.dataset.productsSearchBound === 'true') {
      return;
    }

    searchInput.dataset.productsSearchBound = 'true';

    function clearSearchIfEmpty() {
      if (searchInput.value.trim() !== '' || q === '') {
        return;
      }

      q = '';
      page = 0;

      const url = new URL(window.location.href);
      url.searchParams.delete('q');

      window.history.replaceState(
        {},
        '',
        url.pathname + url.search + url.hash
      );

      load();
    }

    searchInput.addEventListener('input', clearSearchIfEmpty);
    searchInput.addEventListener('search', clearSearchIfEmpty);
  }

  form.addEventListener('change', () => {
    page = 0;
    load();
  });

  form.addEventListener('reset', () => {
    page = 0;
    setTimeout(load);
  });

  sortSel.addEventListener('change', () => {
    page = 0;
    load();
  });

  document.getElementById('productPager')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-page]');

    if (!button || button.disabled) {
      return;
    }

    page += button.dataset.page === 'next' ? 1 : -1;

    if (page < 0) {
      page = 0;
    }

    load();

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
  setupHeaderSearch();

  document.addEventListener(
    'fw:partials-loaded',
    setupHeaderSearch
  );

  load();
})();