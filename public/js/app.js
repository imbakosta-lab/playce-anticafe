// App.js - Playce Frontend Core

document.addEventListener('DOMContentLoaded', () => {
  // Navigation scroll behavior
  const nav = document.querySelector('nav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  });

  // Set booking date min to today
  const dateInput = document.getElementById('f-date');
  if (dateInput) {
    dateInput.min = new Date().toISOString().split('T')[0];
  }

  // Load and render all content
  loadSiteData();
  setupLightbox();
});

// Fetch data from server
async function loadSiteData() {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) throw new Error('Failed to load database');
    const data = await response.ok ? await response.json() : null;
    
    if (data) {
      renderHero(data.hero);
      renderSpaces(data.spaces);
      renderAfisha(data.afisha);
      renderGallery(data.gallery);
    }
  } catch (error) {
    console.error('Error loading site data:', error);
  }
}

// Render Hero section
function renderHero(hero) {
  if (!hero) return;

  // Set booking email dynamically
  window.contactEmail = hero.email || 'tamarena1991@gmail.com';

  // Background Banner
  const heroSection = document.querySelector('.hero');
  if (heroSection) {
    if (hero.bannerUrl) {
      heroSection.style.backgroundImage = `url('${hero.bannerUrl}')`;
    } else {
      // Use fallback gradient style
      heroSection.style.backgroundImage = 'none';
    }
  }

  // Badges & Texts
  const badge = document.querySelector('.hero-badge');
  if (badge) badge.innerHTML = hero.subtitle || '✦ Антикафе в Алматы';

  const title = document.querySelector('.hero h1');
  if (title) {
    // If the title contains HTML tags or specific parts, render as HTML. Let's keep support for <span>
    title.innerHTML = hero.title || 'Твоё место для встреч и событий';
  }

  const desc = document.querySelector('.hero p');
  if (desc) desc.textContent = hero.description || '';

  // Meta items
  const metaContainer = document.querySelector('.hero-meta');
  if (metaContainer) {
    metaContainer.innerHTML = `
      <div class="hero-meta-item"><strong>${hero.workingHours || '14:00 – 02:00'}</strong><span>Ежедневно</span></div>
      <div class="hero-meta-item"><strong>${hero.address || 'пр. Абая, 139'}</strong><span>Алматы</span></div>
      <div class="hero-meta-item"><strong>${hero.rating || '5.0 ★'}</strong><span>Рейтинг 2GIS</span></div>
    `;
  }
  
  // Footer text
  const footerText = document.querySelector('footer p');
  if (footerText) {
    footerText.innerHTML = `<span class="brand">Playce</span> — антикафе в Алматы · ${hero.address || 'пр. Абая, 139'} · © 2026 · <a href="/admin" class="admin-link">🗝️ Админ-панель</a>`;
  }
}

// Render Spaces catalog
function renderSpaces(spaces) {
  const container = document.querySelector('.spaces-grid');
  if (!container || !spaces) return;

  container.innerHTML = spaces.map(space => {
    // Determine image or fallback emoji
    const mediaHtml = space.imageUrl 
      ? `<img src="${space.imageUrl}" class="space-img" alt="${space.title}" loading="lazy">`
      : `<span class="space-emoji">${space.emoji || '🏠'}</span>`;

    return `
      <div class="space-card">
        <div class="space-img-container">
          ${mediaHtml}
        </div>
        <div class="space-body">
          <span class="space-tag">${space.tag}</span>
          <h3>${space.title}</h3>
          <p>${space.description}</p>
          <div class="space-footer">
            <span class="space-price">${space.price}</span>
            <span class="space-cap">${space.capacity}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Update booking select choices dynamically
  const selectSpace = document.getElementById('f-space');
  if (selectSpace) {
    const currentValue = selectSpace.value;
    selectSpace.innerHTML = '<option value="">— Выбрать —</option>' + 
      spaces.map(space => `<option value="${space.title}">${space.title}</option>`).join('');
    selectSpace.value = currentValue;
  }
}

// Render Afisha
function renderAfisha(afisha) {
  const container = document.querySelector('.afisha-slider');
  if (!container || !afisha) return;

  container.innerHTML = afisha.map(item => `
    <div class="afisha-card ${item.badgeClass === 'badge-hot' ? 'hot' : ''}">
      <div class="afisha-date">${item.date}</div>
      <h3>${item.title}</h3>
      <p>${item.description}</p>
      <span class="afisha-badge ${item.badgeClass}">${item.badge}</span>
    </div>
  `).join('');
}

// Render Gallery
function renderGallery(gallery) {
  const container = document.querySelector('.gallery-grid');
  if (!container) return;

  if (gallery && gallery.length > 0) {
    container.innerHTML = gallery.map(imgUrl => `
      <div class="gallery-item" data-src="${imgUrl}">
        <img src="${imgUrl}" alt="Фото студии Playce" loading="lazy">
      </div>
    `).join('');
  } else {
    // Emojis fallback if no images uploaded
    const defaults = [
      { emoji: '🎉', label: 'Вечеринка' },
      { emoji: '🎮', label: 'Игры' },
      { emoji: '🎬', label: 'Кинозал' },
      { emoji: '☕', label: 'Уют' },
      { emoji: '🎤', label: 'Музыка' },
      { emoji: '🎊', label: 'Мероприятия' },
      { emoji: '🕹️', label: 'Консоли' },
      { emoji: '🎭', label: 'Атмосфера' }
    ];
    container.innerHTML = defaults.map(d => `
      <div class="gallery-item default-emoji">
        <span class="space-emoji">${d.emoji}</span>
      </div>
    `).join('');
  }
}

// Interactive Lightbox for Gallery
function setupLightbox() {
  // Create lightbox markup
  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.innerHTML = `
    <div class="lightbox-content">
      <button class="lightbox-close">&times;</button>
      <img src="" alt="Увеличенное изображение">
    </div>
  `;
  document.body.appendChild(lightbox);

  const img = lightbox.querySelector('img');
  const closeBtn = lightbox.querySelector('.lightbox-close');

  // Open lightbox on gallery item click (only for actual uploaded images, not emojis)
  document.querySelector('.gallery-grid').addEventListener('click', (e) => {
    const item = e.target.closest('.gallery-item');
    if (item && item.dataset.src) {
      img.src = item.dataset.src;
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden'; // Lock scroll
    }
  });

  // Close lightbox
  const close = () => {
    lightbox.classList.remove('active');
    document.body.style.overflow = ''; // Unlock scroll
    img.src = '';
  };

  closeBtn.addEventListener('click', close);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) close();
  });
  
  // Close on Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) {
      close();
    }
  });
}

// Submit Booking Form
async function submitBooking() {
  const name = document.getElementById('f-name').value.trim();
  const phone = document.getElementById('f-phone').value.trim();
  const date = document.getElementById('f-date').value;
  const time = document.getElementById('f-time').value;
  const type = document.getElementById('f-type').value;
  const guests = document.getElementById('f-guests').value;
  const space = document.getElementById('f-space').value;
  const comment = document.getElementById('f-comment').value.trim();

  if (!name || !phone || !date || !time || !type || !guests) {
    alert('Пожалуйста, заполни все обязательные поля (*)');
    return;
  }

  const submitBtn = document.querySelector('.form-submit');
  const originalBtnText = submitBtn.textContent;
  submitBtn.textContent = 'Отправка...';
  submitBtn.disabled = true;

  try {
    const response = await fetch('/api/booking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, phone, date, time, type, guests, space, comment })
    });

    if (!response.ok) throw new Error('Booking failed');

    document.getElementById('booking-form').style.display = 'none';
    document.getElementById('success-msg').style.display = 'block';
  } catch (error) {
    console.error('Error submitting booking:', error);
    alert('Произошла ошибка при отправке заявки. Пожалуйста, отправьте ее повторно или свяжитесь с нами по телефону.');
  } finally {
    submitBtn.textContent = originalBtnText;
    submitBtn.disabled = false;
  }
}
