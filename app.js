document.addEventListener('DOMContentLoaded', () => {
  // === State ===
  let items = [];
  let currentFilter = { category: '', minPrice: '', maxPrice: '', eceranOnly: false, search: '' };

  // === DOM elements ===
  const itemsContainer = document.getElementById('itemsContainer');
  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');
  const priceMin = document.getElementById('priceMin');
  const priceMax = document.getElementById('priceMax');
  const eceranOnly = document.getElementById('eceranOnly');
  const clearFilterBtn = document.getElementById('clearFilter');
  const categoryList = document.getElementById('categoryList');
  const newCategoryInput = document.getElementById('newCategoryInput');
  const addCategoryBtn = document.getElementById('addCategoryBtn');
  const addItemBtn = document.getElementById('addItemBtn');
  const themeToggle = document.getElementById('themeToggle');
  const backupBtn = document.getElementById('backupBtn');
  const restoreBtn = document.getElementById('restoreBtn');
  const restoreFile = document.getElementById('restoreFile');
  const itemModal = document.getElementById('itemModal');
  const modalTitle = document.getElementById('modalTitle');
  const itemForm = document.getElementById('itemForm');
  const itemId = document.getElementById('itemId');
  const itemName = document.getElementById('itemName');
  const itemCategory = document.getElementById('itemCategory');
  const itemPrice = document.getElementById('itemPrice');
  const itemIsEceran = document.getElementById('itemIsEceran');
  const itemEceranPrice = document.getElementById('itemEceranPrice');
  const eceranPriceGroup = document.getElementById('eceranPriceGroup');
  const deleteItemBtn = document.getElementById('deleteItemBtn');
  const closeModalBtn = document.querySelector('.close');
  const itemCountSpan = document.getElementById('itemCount');

  // === Load data ===
  function loadData() {
    try {
      const saved = localStorage.getItem('shopData');
      if (saved) {
        items = JSON.parse(saved);
      } else {
        items = [
          { id: 1, name: 'Beras', category: 'Sembako', price: 12000, isEceran: false, eceranPrice: 0 },
          { id: 2, name: 'Minyak Goreng', category: 'Sembako', price: 15000, isEceran: true, eceranPrice: 16000 },
          { id: 3, name: 'Sabun Mandi', category: 'Kebersihan', price: 3500, isEceran: false, eceranPrice: 0 },
          { id: 4, name: 'Shampoo', category: 'Kebersihan', price: 12000, isEceran: true, eceranPrice: 13000 },
          { id: 5, name: 'Rokok', category: 'Lainnya', price: 20000, isEceran: true, eceranPrice: 22000 }
        ];
        saveData();
      }
    } catch (e) {
      console.error('Gagal memuat data:', e);
      items = [];
    }
  }

  function saveData() {
    try {
      localStorage.setItem('shopData', JSON.stringify(items));
    } catch (e) {
      alert('Gagal menyimpan data: penyimpanan browser penuh atau tidak diizinkan.');
    }
  }

  function generateId() {
    return items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
  }

  // === Get unique categories ===
  function getCategories() {
    return [...new Set(items.map(i => i.category))];
  }

  // === Render ===
  function renderCategories() {
    const cats = getCategories();
    // Update dropdown filter
    categoryFilter.innerHTML = '<option value="">Semua Kategori</option>';
    cats.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      categoryFilter.appendChild(opt);
    });

    // Render list kategori di sidebar
    if (categoryList) {
      categoryList.innerHTML = '';
      cats.forEach(cat => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${cat}</span> <button class="del-cat" data-cat="${cat}">×</button>`;
        li.querySelector('span').addEventListener('click', () => {
          categoryFilter.value = cat;
          applyFilters();
        });
        li.querySelector('.del-cat').addEventListener('click', (e) => {
          e.stopPropagation();
          deleteCategory(cat);
        });
        categoryList.appendChild(li);
      });
    }

    // Update dropdown di modal
    const modalCatSelect = document.getElementById('itemCategory');
    if (modalCatSelect) {
      modalCatSelect.innerHTML = '';
      cats.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        modalCatSelect.appendChild(opt);
      });
    }
  }

  function applyFilters() {
    currentFilter.category = categoryFilter.value;
    currentFilter.minPrice = priceMin.value;
    currentFilter.maxPrice = priceMax.value;
    currentFilter.eceranOnly = eceranOnly.checked;
    currentFilter.search = searchInput.value.trim().toLowerCase();
    renderItems();
  }

  function renderItems() {
    let filtered = items.filter(item => {
      if (currentFilter.category && item.category !== currentFilter.category) return false;
      if (currentFilter.minPrice !== '' && item.price < Number(currentFilter.minPrice)) return false;
      if (currentFilter.maxPrice !== '' && item.price > Number(currentFilter.maxPrice)) return false;
      if (currentFilter.eceranOnly && !item.isEceran) return false;
      if (currentFilter.search && !item.name.toLowerCase().includes(currentFilter.search)) return false;
      return true;
    });

    if (itemsContainer) {
      itemsContainer.innerHTML = '';
      if (filtered.length === 0) {
        itemsContainer.innerHTML = '<p style="grid-column:1/-1; text-align:center; padding: 40px; color: var(--text-secondary);">Tidak ada barang ditemukan.</p>';
        if (itemCountSpan) itemCountSpan.textContent = '';
      } else {
        if (itemCountSpan) itemCountSpan.textContent = `Menampilkan ${filtered.length} barang`;
        filtered.forEach(item => {
          const card = document.createElement('div');
          card.className = 'item-card';
          card.innerHTML = `
            <h3>${escapeHTML(item.name)}</h3>
            <span class="category-tag">${escapeHTML(item.category)}</span>
            <div class="price">
              Rp ${item.price.toLocaleString('id-ID')}
              ${item.isEceran ? `<br><span class="eceran">Eceran: Rp ${item.eceranPrice.toLocaleString('id-ID')}</span>` : ''}
            </div>
            <button class="btn-small edit-item" data-id="${item.id}">Edit</button>
          `;
          card.querySelector('.edit-item').addEventListener('click', () => openEditModal(item.id));
          itemsContainer.appendChild(card);
        });
      }
    }
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // === Category management ===
  function deleteCategory(category) {
    const itemsInCat = items.filter(i => i.category === category).length;
    if (itemsInCat > 0) {
      alert(`Kategori "${category}" masih memiliki ${itemsInCat} barang. Pindahkan atau hapus barang terlebih dahulu.`);
      return;
    }
    // Hapus dari dropdown modal jika ada (tidak perlu aksi khusus)
    renderCategories();
  }

  // === Modal handlers ===
  function openAddModal() {
    modalTitle.textContent = 'Tambah Barang';
    itemForm.reset();
    itemId.value = '';
    deleteItemBtn.style.display = 'none';
    eceranPriceGroup.style.display = 'none';
    itemIsEceran.checked = false;
    itemModal.style.display = 'flex';
  }

  function openEditModal(id) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    modalTitle.textContent = 'Edit Barang';
    itemId.value = item.id;
    itemName.value = item.name;
    itemCategory.value = item.category;
    itemPrice.value = item.price;
    itemIsEceran.checked = item.isEceran;
    itemEceranPrice.value = item.eceranPrice || '';
    eceranPriceGroup.style.display = item.isEceran ? 'block' : 'none';
    deleteItemBtn.style.display = 'inline-block';
    itemModal.style.display = 'flex';
  }

  function closeModal() {
    itemModal.style.display = 'none';
  }

  // Event checkbox eceran di modal
  itemIsEceran.addEventListener('change', () => {
    eceranPriceGroup.style.display = itemIsEceran.checked ? 'block' : 'none';
  });

  // Close modal
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
  }
  window.addEventListener('click', (e) => {
    if (e.target === itemModal) closeModal();
  });

  // Form submit
  itemForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = itemName.value.trim();
    const category = itemCategory.value;
    const priceStr = itemPrice.value.trim();
    const price = parseInt(priceStr);
    const isEceran = itemIsEceran.checked;
    const eceranPrice = isEceran ? parseInt(itemEceranPrice.value.trim()) || 0 : 0;

    // Validasi
    if (!name) {
      alert('Nama barang wajib diisi.');
      return;
    }
    if (!category) {
      alert('Silakan pilih kategori. Jika belum ada, tambahkan kategori terlebih dahulu.');
      return;
    }
    if (!priceStr || isNaN(price) || price < 0) {
      alert('Harga harus diisi dengan angka yang valid (minimal 0).');
      return;
    }
    if (isEceran && (isNaN(eceranPrice) || eceranPrice < 0)) {
      alert('Harga eceran harus diisi dengan angka valid (minimal 0).');
      return;
    }

    if (itemId.value) {
      // Edit existing item
      const id = parseInt(itemId.value);
      const idx = items.findIndex(i => i.id === id);
      if (idx !== -1) {
        items[idx] = { ...items[idx], name, category, price, isEceran, eceranPrice };
      }
    } else {
      // Add new item
      const id = generateId();
      items.push({ id, name, category, price, isEceran, eceranPrice });
    }
    saveData();
    renderCategories();
    applyFilters();
    closeModal();
  });

  // Hapus barang dari modal
  deleteItemBtn.addEventListener('click', () => {
    if (!confirm('Hapus barang ini?')) return;
    const id = parseInt(itemId.value);
    items = items.filter(i => i.id !== id);
    saveData();
    renderCategories();
    applyFilters();
    closeModal();
  });

  // === Add category button ===
  addCategoryBtn.addEventListener('click', () => {
    const newCat = newCategoryInput.value.trim();
    if (!newCat) {
      alert('Nama kategori tidak boleh kosong.');
      return;
    }
    if (getCategories().includes(newCat)) {
      alert('Kategori sudah ada!');
      return;
    }
    alert(`Kategori "${newCat}" siap digunakan. Silakan tambahkan barang dengan kategori ini melalui tombol "Tambah Barang".`);
    newCategoryInput.value = '';
    // Tidak perlu render karena kategori diambil dari items
  });

  // === Filter events ===
  categoryFilter.addEventListener('change', applyFilters);
  priceMin.addEventListener('input', applyFilters);
  priceMax.addEventListener('input', applyFilters);
  eceranOnly.addEventListener('change', applyFilters);
  searchInput.addEventListener('input', applyFilters);
  clearFilterBtn.addEventListener('click', () => {
    searchInput.value = '';
    categoryFilter.value = '';
    priceMin.value = '';
    priceMax.value = '';
    eceranOnly.checked = false;
    applyFilters();
  });

  // === Theme toggle ===
  const body = document.body;
  const lightScene = document.querySelector('.light-scene');
  const darkScene = document.querySelector('.dark-scene');

  function setTheme(theme) {
    if (theme === 'dark') {
      body.classList.remove('theme-light');
      body.classList.add('theme-dark');
      if (lightScene) lightScene.style.display = 'none';
      if (darkScene) darkScene.style.display = 'block';
    } else {
      body.classList.remove('theme-dark');
      body.classList.add('theme-light');
      if (lightScene) lightScene.style.display = 'block';
      if (darkScene) darkScene.style.display = 'none';
    }
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {}
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = body.classList.contains('theme-dark') ? 'dark' : 'light';
      setTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  // Load tema tersimpan
  const savedTheme = (() => { try { return localStorage.getItem('theme'); } catch(e) { return null; } })() || 'light';
  setTheme(savedTheme);

  // === Backup & Restore ===
  backupBtn.addEventListener('click', () => {
    const dataStr = JSON.stringify(items, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shop_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  restoreBtn.addEventListener('click', () => {
    restoreFile.click();
  });

  restoreFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (!Array.isArray(data)) throw new Error('Format bukan array');
        data.forEach((item, index) => {
          if (!item.id || !item.name || !item.category || typeof item.price !== 'number') {
            throw new Error(`Barang ke-${index+1} tidak valid`);
          }
        });
        items = data;
        saveData();
        renderCategories();
        applyFilters();
        alert('Data berhasil dipulihkan!');
      } catch (err) {
        alert('File JSON tidak valid: ' + err.message);
      }
    };
    reader.readAsText(file);
  });

  // === Initialize ===
  loadData();
  renderCategories();
  applyFilters();

  addItemBtn.addEventListener('click', openAddModal);

  // Daftarkan service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js');
  }
});