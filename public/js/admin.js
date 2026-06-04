// Admin.js - Playce Admin Dashboard Core

let localData = null; // Local copy of database

document.addEventListener('DOMContentLoaded', () => {
  loadAdminData();
  loadBookings();
});


// Switch active panel tab
function switchTab(tabId) {
  // Toggle buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeBtn = Array.from(document.querySelectorAll('.tab-btn')).find(btn => 
    btn.getAttribute('onclick').includes(`'${tabId}'`)
  );
  if (activeBtn) activeBtn.classList.add('active');

  // Toggle panels
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.remove('active');
  });
  const activePanel = document.getElementById(`panel-${tabId}`);
  if (activePanel) activePanel.classList.add('active');
}

// Fetch database and load form values
async function loadAdminData() {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) throw new Error('Could not fetch data');
    localData = await response.json();
    
    populateHero(localData.hero);
    populateSpaces(localData.spaces);
    populateAfisha(localData.afisha);
    populateGallery(localData.gallery);
    populateSmtp(localData.smtp);
  } catch (err) {
    console.error(err);
    showToast('Ошибка загрузки данных сайта', true);
  }
}

// Show feedback toasts
function showToast(message, isError = false) {
  const toast = document.getElementById('admin-toast');
  toast.textContent = message;
  toast.className = 'toast'; // reset classes
  if (isError) toast.classList.add('error');
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

/* ==========================================================================
   HERO / BANNER SECTION
   ========================================================================== */

function populateHero(hero) {
  if (!hero) return;
  document.getElementById('hero-title').value = hero.title || '';
  document.getElementById('hero-subtitle').value = hero.subtitle || '';
  document.getElementById('hero-desc').value = hero.description || '';
  document.getElementById('hero-hours').value = hero.workingHours || '';
  document.getElementById('hero-address').value = hero.address || '';
  document.getElementById('hero-rating').value = hero.rating || '';
  document.getElementById('hero-email').value = hero.email || '';

  // Update image preview
  const preview = document.getElementById('hero-preview');
  const status = document.getElementById('hero-preview-status');
  if (hero.bannerUrl) {
    preview.innerHTML = `<img src="${hero.bannerUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:6px;">`;
    status.innerHTML = `<a href="${hero.bannerUrl}" target="_blank" style="color:var(--accent)">Файл загружен (${hero.bannerUrl.split('/').pop()})</a>`;
  } else {
    preview.innerHTML = '🖼️';
    status.innerHTML = 'Не загружен (используется стандартный градиент)';
  }
}

async function uploadBanner(target, spaceId = null) {
  const fileInput = spaceId ? document.getElementById(`upload-${spaceId}`) : document.getElementById('hero-upload');
  const file = fileInput.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('image', file);
  formData.append('target', target);
  if (spaceId) formData.append('spaceId', spaceId);

  try {
    const response = await fetch('/api/upload-banner', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Upload failed');
    }
    
    const result = await response.json();
    localData = result.data;
    
    // Refresh display
    populateHero(localData.hero);
    populateSpaces(localData.spaces);
    
    showToast('Баннер успешно обновлен!');
  } catch (err) {
    console.error(err);
    showToast(`Ошибка загрузки: ${err.message}`, true);
  }
}

async function saveHero(e) {
  e.preventDefault();
  
  const heroData = {
    title: document.getElementById('hero-title').value.trim(),
    subtitle: document.getElementById('hero-subtitle').value.trim(),
    description: document.getElementById('hero-desc').value.trim(),
    workingHours: document.getElementById('hero-hours').value.trim(),
    address: document.getElementById('hero-address').value.trim(),
    rating: document.getElementById('hero-rating').value.trim(),
    email: document.getElementById('hero-email').value.trim()
  };

  try {
    const response = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hero: heroData })
    });
    
    if (!response.ok) throw new Error('Save failed');
    const result = await response.json();
    localData = result.data;
    showToast('Тексты баннера успешно сохранены!');
  } catch (err) {
    console.error(err);
    showToast('Не удалось сохранить изменения', true);
  }
}

/* ==========================================================================
   SPACES SECTION
   ========================================================================== */

function populateSpaces(spaces) {
  const container = document.getElementById('spaces-list');
  if (!container || !spaces) return;

  container.innerHTML = spaces.map((space, idx) => {
    const previewHtml = space.imageUrl
      ? `<img src="${space.imageUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:6px;">`
      : `<span style="font-size:32px">${space.emoji || '🏠'}</span>`;
    
    return `
      <div class="admin-card" data-space-id="${space.id}">
        <div class="card-title">🚪 Пространство ${idx + 1}: ${space.title}</div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Название зоны</label>
            <input type="text" class="space-title-input" value="${space.title}" required>
          </div>
          <div class="form-group">
            <label>Категория (Tag)</label>
            <input type="text" class="space-tag-input" value="${space.tag}" required>
          </div>
        </div>

        <div class="form-group">
          <label>Описание пространства</label>
          <textarea class="space-desc-input" required>${space.description}</textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Стоимость аренды</label>
            <input type="text" class="space-price-input" value="${space.price}" required>
          </div>
          <div class="form-group">
            <label>Вместимость</label>
            <input type="text" class="space-cap-input" value="${space.capacity}" required>
          </div>
          <div class="form-group">
            <label>Эмодзи-заглушка</label>
            <input type="text" class="space-emoji-input" value="${space.emoji || ''}">
          </div>
        </div>

        <!-- Banner for Space -->
        <div style="border-top: 1px solid rgba(255,255,255,0.03); padding-top:16px; margin-top:10px;">
          <label>Фотография / Баннер пространства</label>
          <div class="upload-zone" style="padding: 12px;">
            <span class="upload-icon" style="font-size:20px; margin-bottom:2px;">🖼️</span>
            <span class="upload-text" style="font-size:12px;">Загрузить фото для этой зоны</span>
            <input type="file" id="upload-${space.id}" accept="image/*" onchange="uploadBanner('space', '${space.id}')">
          </div>
          <div class="preview-container" style="margin-top:10px;">
            <div class="img-preview" style="width:90px; height:60px;">${previewHtml}</div>
            <div class="upload-text" style="font-size:12px;">
              <span>${space.imageUrl ? `Загружено: ${space.imageUrl.split('/').pop()}` : 'Используется эмодзи по умолчанию'}</span>
            </div>
          </div>
        </div>

        <div style="margin-top: 20px; display:flex; justify-content:flex-end;">
          <button type="button" class="btn-save" onclick="saveSpace('${space.id}')">Сохранить только эту зону</button>
        </div>
      </div>
    `;
  }).join('');
}

async function saveSpace(spaceId) {
  const card = document.querySelector(`.admin-card[data-space-id="${spaceId}"]`);
  if (!card) return;

  const spaceTitle = card.querySelector('.space-title-input').value.trim();
  const spaceTag = card.querySelector('.space-tag-input').value.trim();
  const spaceDesc = card.querySelector('.space-desc-input').value.trim();
  const spacePrice = card.querySelector('.space-price-input').value.trim();
  const spaceCap = card.querySelector('.space-cap-input').value.trim();
  const spaceEmoji = card.querySelector('.space-emoji-input').value.trim();

  // Find and update item in array
  const updatedSpaces = localData.spaces.map(s => {
    if (s.id === spaceId) {
      return {
        ...s,
        title: spaceTitle,
        tag: spaceTag,
        description: spaceDesc,
        price: spacePrice,
        capacity: spaceCap,
        emoji: spaceEmoji
      };
    }
    return s;
  });

  try {
    const response = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spaces: updatedSpaces })
    });

    if (!response.ok) throw new Error('Save space failed');
    const result = await response.json();
    localData = result.data;
    showToast(`Зона "${spaceTitle}" успешно сохранена!`);
  } catch (err) {
    console.error(err);
    showToast('Не удалось сохранить изменения зоны', true);
  }
}

/* ==========================================================================
   AFISHA SECTION
   ========================================================================== */

function populateAfisha(afisha) {
  const container = document.getElementById('afisha-list');
  if (!container || !afisha) return;

  container.innerHTML = afisha.map((item, idx) => `
    <div class="admin-card" data-afisha-id="${item.id}">
      <div class="card-title">📅 Мероприятие ${idx + 1}</div>
      <div class="form-row">
        <div class="form-group">
          <label>Дата и время</label>
          <input type="text" class="afisha-date-input" value="${item.date}" required placeholder="Пример: 7 июня, пятница · 20:00">
        </div>
        <div class="form-group">
          <label>Название события</label>
          <input type="text" class="afisha-title-input" value="${item.title}" required>
        </div>
      </div>
      <div class="form-group">
        <label>Краткое описание</label>
        <textarea class="afisha-desc-input" required>${item.description}</textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Текст бейджа (ярлыка)</label>
          <input type="text" class="afisha-badge-input" value="${item.badge}" required placeholder="Пример: 🔥 Хит, ✦ Новинка, ★ Бесплатно">
        </div>
        <div class="form-group">
          <label>Стиль бейджа</label>
          <select class="afisha-badge-class-input">
            <option value="badge-hot" ${item.badgeClass === 'badge-hot' ? 'selected' : ''}>🔥 Оранжевый (Хит)</option>
            <option value="badge-new" ${item.badgeClass === 'badge-new' ? 'selected' : ''}>✦ Фиолетовый (Новинка)</option>
            <option value="badge-free" ${item.badgeClass === 'badge-free' ? 'selected' : ''}>★ Зеленый (Бесплатно)</option>
          </select>
        </div>
      </div>
    </div>
  `).join('');
}

async function saveAfisha(e) {
  e.preventDefault();

  const cards = document.querySelectorAll('#afisha-list .admin-card');
  const updatedAfisha = Array.from(cards).map(card => {
    const id = card.dataset.afishaId;
    const date = card.querySelector('.afisha-date-input').value.trim();
    const title = card.querySelector('.afisha-title-input').value.trim();
    const description = card.querySelector('.afisha-desc-input').value.trim();
    const badge = card.querySelector('.afisha-badge-input').value.trim();
    const badgeClass = card.querySelector('.afisha-badge-class-input').value;

    return { id, date, title, description, badge, badgeClass };
  });

  try {
    const response = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ afisha: updatedAfisha })
    });

    if (!response.ok) throw new Error('Afisha save failed');
    const result = await response.json();
    localData = result.data;
    showToast('Афиша мероприятий успешно обновлена!');
  } catch (err) {
    console.error(err);
    showToast('Не удалось сохранить афишу', true);
  }
}

/* ==========================================================================
   GALLERY SECTION
   ========================================================================== */

function populateGallery(gallery) {
  const container = document.getElementById('admin-gallery-list');
  if (!container) return;

  if (gallery && gallery.length > 0) {
    container.innerHTML = gallery.map(imgUrl => `
      <div class="admin-gallery-item">
        <img src="${imgUrl}" alt="Фото галереи">
        <div class="delete-overlay">
          <button type="button" class="btn-danger-outline" onclick="deleteGalleryImage('${imgUrl}')">Удалить 🗑️</button>
        </div>
      </div>
    `).join('');
  } else {
    container.innerHTML = `<div style="color: var(--muted); text-align: center; grid-column: 1/-1; padding: 40px;">В галерее пока нет загруженных фото. Загрузите их выше!</div>`;
  }
}

async function uploadGalleryImage() {
  const fileInput = document.getElementById('gallery-upload');
  const file = fileInput.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch('/api/upload-gallery', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Upload failed');
    }

    const result = await response.json();
    localData.gallery = result.gallery;
    
    // Clear file selection & update list
    fileInput.value = '';
    populateGallery(localData.gallery);
    showToast('Фото успешно добавлено в галерею!');
  } catch (err) {
    console.error(err);
    showToast(`Ошибка загрузки: ${err.message}`, true);
  }
}

async function deleteGalleryImage(imageUrl) {
  if (!confirm('Вы уверены, что хотите удалить эту фотографию из галереи?')) return;

  try {
    const response = await fetch('/api/delete-gallery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl })
    });

    if (!response.ok) throw new Error('Deletion failed');
    const result = await response.json();
    localData.gallery = result.gallery;

    populateGallery(localData.gallery);
    showToast('Фото удалено из галереи.');
  } catch (err) {
    console.error(err);
    showToast('Не удалось удалить фото', true);
  }
}

/* ==========================================================================
   SMTP SECTION
   ========================================================================== */

function populateSmtp(smtp) {
  if (!smtp) return;
  document.getElementById('smtp-enabled').checked = smtp.enabled || false;
  document.getElementById('smtp-host').value = smtp.host || '';
  document.getElementById('smtp-port').value = smtp.port || '';
  document.getElementById('smtp-user').value = smtp.user || '';
  document.getElementById('smtp-pass').value = smtp.pass || '';
  document.getElementById('smtp-from').value = smtp.from || '';
}

async function saveSmtp(e) {
  e.preventDefault();

  const smtpData = {
    enabled: document.getElementById('smtp-enabled').checked,
    host: document.getElementById('smtp-host').value.trim(),
    port: parseInt(document.getElementById('smtp-port').value),
    secure: parseInt(document.getElementById('smtp-port').value) === 465,
    user: document.getElementById('smtp-user').value.trim(),
    pass: document.getElementById('smtp-pass').value.trim(),
    from: document.getElementById('smtp-from').value.trim()
  };

  try {
    const response = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ smtp: smtpData })
    });

    if (!response.ok) throw new Error('Save SMTP failed');
    const result = await response.json();
    localData = result.data;
    showToast('Настройки почты успешно сохранены!');
  } catch (err) {
    console.error(err);
    showToast('Не удалось сохранить настройки почты', true);
  }
}

// Fetch and render bookings
async function loadBookings() {
  const container = document.getElementById('bookings-list');
  if (!container) return;

  try {
    const response = await fetch('/api/bookings');
    if (!response.ok) throw new Error('Could not fetch bookings');
    const bookings = await response.json();
    
    renderBookings(bookings);
  } catch (err) {
    console.error(err);
    container.innerHTML = `<div style="color: var(--danger); text-align: center; padding: 40px;">Ошибка загрузки заявок: ${err.message}</div>`;
  }
}

// Render bookings list
function renderBookings(bookings) {
  const container = document.getElementById('bookings-list');
  if (!container) return;

  if (!bookings || bookings.length === 0) {
    container.innerHTML = `<div style="color: var(--muted); text-align: center; padding: 40px;">Пока нет ни одной заявки на бронирование.</div>`;
    return;
  }

  // Sort bookings so newest are first
  const sortedBookings = [...bookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  container.innerHTML = sortedBookings.map(b => {
    const createdDate = new Date(b.createdAt).toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const bookingDate = new Date(b.date).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const commentHtml = b.comment 
      ? `<div class="booking-comment"><strong>Комментарий:</strong> ${b.comment}</div>`
      : '';

    return `
      <div class="booking-card" data-booking-id="${b.id}">
        <div class="booking-card-header">
          <h3>👤 ${b.name}</h3>
          <span class="booking-date-badge">📅 ${bookingDate} в ${b.time}</span>
        </div>
        <div class="booking-grid">
          <div class="booking-meta-item">📞 Телефон: <a href="tel:${b.phone}" style="color:var(--accent); text-decoration:none; font-weight:600;">${b.phone}</a></div>
          <div class="booking-meta-item">🎉 Событие: <strong>${b.type}</strong></div>
          <div class="booking-meta-item">👥 Гостей: <strong>${b.guests} чел.</strong></div>
          <div class="booking-meta-item">🏠 Зона / Зал: <strong>${b.space || 'не указано'}</strong></div>
        </div>
        ${commentHtml}
        <div class="booking-card-footer">
          <span>Получено: ${createdDate}</span>
          <button type="button" class="btn-danger-outline" onclick="deleteBooking('${b.id}')">Удалить заявку 🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

// Delete booking
async function deleteBooking(id) {
  if (!confirm('Вы действительно хотите удалить эту заявку?')) return;

  try {
    const response = await fetch('/api/delete-booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });

    if (!response.ok) throw new Error('Deletion failed');
    const result = await response.json();
    
    // Re-render
    renderBookings(result.bookings);
    showToast('Заявка успешно удалена');
  } catch (err) {
    console.error(err);
    showToast('Не удалось удалить заявку', true);
  }
}

