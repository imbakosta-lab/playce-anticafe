const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Dynamic data directory for persistent disk support on cloud hosting (Render/Railway)
const DATA_DIR = process.env.DATA_DIR || __dirname;
const DB_DIR = path.join(DATA_DIR, 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

// Enable JSON parsing
app.use(express.json());

// Ensure directories exist
const DIRS = [
  DB_DIR,
  UPLOADS_DIR,
  path.join(__dirname, 'public'),
  path.join(__dirname, 'public', 'images')
];

DIRS.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const DB_PATH = path.join(DB_DIR, 'db.json');
const BOOKINGS_PATH = path.join(DB_DIR, 'bookings.json');

// Default initial database content
const DEFAULT_DB = {
  hero: {
    title: "Твоё место для встреч и событий",
    subtitle: "✦ Антикафе в Алматы",
    description: "Уютные зоны, атмосферные мероприятия, оплата по времени — просто приходи и кайфуй",
    bannerUrl: "/images/hero_banner.png", // Default beautiful generated banner
    workingHours: "14:00 – 02:00",
    address: "пр. Абая, 139",
    rating: "5.0 ★",
    email: "tamarena1991@gmail.com"
  },
  spaces: [
    {
      id: "space-game",
      tag: "Развлечения",
      title: "Игровая зона",
      description: "PlayStation, настольные игры, VR-шлем. Идеально для компании друзей и геймеров.",
      price: "от 400 ₸/час",
      capacity: "до 10 чел.",
      imageUrl: "",
      emoji: "🎮"
    },
    {
      id: "space-cinema",
      tag: "Кино",
      title: "Кинозал",
      description: "Проектор 120\", мягкие диваны, объёмный звук. Приватный просмотр фильмов и сериалов.",
      price: "от 600 ₸/час",
      capacity: "до 8 чел.",
      imageUrl: "",
      emoji: "🎬"
    },
    {
      id: "space-party",
      tag: "Мероприятия",
      title: "Банкетный зал",
      description: "Просторная зона для дней рождения, корпоративов и вечеринок. Своя кухня.",
      price: "от 5000 ₸/час",
      capacity: "до 40 чел.",
      imageUrl: "",
      emoji: "🎉"
    },
    {
      id: "space-lounge",
      tag: "Уют",
      title: "Камерная гостиная",
      description: "Уютные кресла, плед, книги. Для спокойного отдыха, чтения или работы в тишине.",
      price: "от 300 ₸/час",
      capacity: "до 6 чел.",
      imageUrl: "",
      emoji: "☕"
    },
    {
      id: "space-music",
      tag: "Музыка",
      title: "Музыкальная студия",
      description: "Акустические гитары, синтезатор, звукоизоляция. Репетиции и джем-сессии.",
      price: "от 800 ₸/час",
      capacity: "до 5 чел.",
      imageUrl: "",
      emoji: "🎤"
    },
    {
      id: "space-meeting",
      tag: "Работа",
      title: "Переговорная",
      description: "Стол, проектор, высокоскоростной Wi-Fi. Встречи, брейнсторминги, онлайн-звонки.",
      price: "от 1000 ₸/час",
      capacity: "до 12 чел.",
      imageUrl: "",
      emoji: "💼"
    }
  ],
  afisha: [
    {
      id: "afisha-1",
      date: "7 июня, пятница · 20:00",
      title: "Вечер настольных игр",
      description: "Турнир по Uno, Catan и Codenames. Призы победителям.",
      badge: "🔥 Хит",
      badgeClass: "badge-hot"
    },
    {
      id: "afisha-2",
      date: "10 июня, понедельник · 19:00",
      title: "Мастер-класс по каллиграфии",
      description: "Научись красиво писать за 2 часа с нашим преподавателем.",
      badge: "✦ Новинка",
      badgeClass: "badge-new"
    },
    {
      id: "afisha-3",
      date: "14 июня, пятница · 21:00",
      title: "Кино-вечер: 90-е",
      description: "Ностальгический марафон культовых фильмов с попкорном.",
      badge: "★ Бесплатно",
      badgeClass: "badge-free"
    },
    {
      id: "afisha-4",
      date: "21 июня, суббота · 18:00",
      title: "Открытый микрофон",
      description: "Покажи свои таланты — стихи, музыка, стендап. Все жанры приветствуются.",
      badge: "✦ Новинка",
      badgeClass: "badge-new"
    }
  ],
  gallery: [],
  smtp: {
    enabled: false,
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    user: "",
    pass: "",
    from: "Playce Anticafe <your-email@gmail.com>"
  }
};

// Load or create DB
function loadDb() {
  if (!fs.existsSync(DB_PATH)) {
    saveDb(DEFAULT_DB);
    return DEFAULT_DB;
  }
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    const parsed = JSON.parse(data);
    // Ensure smtp structure exists in older database files
    if (!parsed.smtp) {
      parsed.smtp = DEFAULT_DB.smtp;
      saveDb(parsed);
    }
    return parsed;
  } catch (err) {
    console.error("Error reading database file, using defaults:", err);
    return DEFAULT_DB;
  }
}

function saveDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error("Error saving database file:", err);
  }
}

function saveBookingLocally(booking) {
  try {
    let bookings = [];
    if (fs.existsSync(BOOKINGS_PATH)) {
      const data = fs.readFileSync(BOOKINGS_PATH, 'utf8');
      try {
        bookings = JSON.parse(data);
        if (!Array.isArray(bookings)) {
          bookings = [];
        }
      } catch (e) {
        bookings = [];
      }
    }
    bookings.push({
      id: 'booking-' + Date.now() + '-' + Math.round(Math.random() * 1000),
      createdAt: new Date().toISOString(),
      ...booking
    });
    fs.writeFileSync(BOOKINGS_PATH, JSON.stringify(bookings, null, 2), 'utf8');
    console.log(`Booking saved locally to bookings.json`);
  } catch (err) {
    console.error("Error saving booking locally:", err);
  }
}

async function fetchWithTimeout(url, options, timeout = 4000) {
  if (typeof fetch === 'undefined') {
    throw new Error('fetch is not defined in this Node.js environment');
  }
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// Multer storage setup pointing to custom uploads directory
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|webp|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed!"));
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// APIs
app.get('/api/data', (req, res) => {
  res.json(loadDb());
});

app.post('/api/save', (req, res) => {
  const currentDb = loadDb();
  const updatedData = req.body;

  if (updatedData.hero) currentDb.hero = { ...currentDb.hero, ...updatedData.hero };
  if (updatedData.spaces) currentDb.spaces = updatedData.spaces;
  if (updatedData.afisha) currentDb.afisha = updatedData.afisha;
  if (updatedData.gallery) currentDb.gallery = updatedData.gallery;
  if (updatedData.smtp) currentDb.smtp = { ...currentDb.smtp, ...updatedData.smtp };

  saveDb(currentDb);
  res.json({ success: true, data: currentDb });
});

// Get all bookings
app.get('/api/bookings', (req, res) => {
  try {
    let bookings = [];
    if (fs.existsSync(BOOKINGS_PATH)) {
      const data = fs.readFileSync(BOOKINGS_PATH, 'utf8');
      try {
        bookings = JSON.parse(data);
        if (!Array.isArray(bookings)) {
          bookings = [];
        }
      } catch (e) {
        bookings = [];
      }
    }
    res.json(bookings);
  } catch (err) {
    console.error("Error reading bookings file:", err);
    res.status(500).json({ error: "Failed to read bookings" });
  }
});

// Delete a booking
app.post('/api/delete-booking', (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'Booking ID required' });
  }
  try {
    if (fs.existsSync(BOOKINGS_PATH)) {
      const data = fs.readFileSync(BOOKINGS_PATH, 'utf8');
      let bookings = JSON.parse(data);
      const index = bookings.findIndex(b => b.id === id);
      if (index !== -1) {
        bookings.splice(index, 1);
        fs.writeFileSync(BOOKINGS_PATH, JSON.stringify(bookings, null, 2), 'utf8');
        return res.json({ success: true, bookings });
      }
    }
    res.status(404).json({ error: 'Booking not found' });
  } catch (err) {
    console.error("Error deleting booking:", err);
    res.status(500).json({ error: "Failed to delete booking" });
  }
});


// Submit booking form & send email via Nodemailer
app.post('/api/booking', async (req, res) => {
  const { name, phone, date, time, type, guests, space, comment } = req.body;
  
  if (!name || !phone || !date || !time || !type || !guests) {
    return res.status(400).json({ error: 'Пожалуйста, заполните все обязательные поля' });
  }

  // Save booking locally to db so it is never lost even if SMTP/FormSubmit fails or hangs
  saveBookingLocally({ name, phone, date, time, type, guests, space, comment });

  const db = loadDb();
  const targetEmail = db.hero.email || 'tamarena1991@gmail.com';
  const formattedDate = new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

  // Console log as fallback
  console.log(`\n========================================`);
  console.log(`📅 НОВАЯ ЗАЯВКА НА БРОНИРОВАНИЕ — PLAYCE`);
  console.log(`👤 Клиент: ${name}`);
  console.log(`📞 Телефон: ${phone}`);
  console.log(`📅 Дата: ${formattedDate} в ${time}`);
  console.log(`🎉 Событие: ${type} (${guests} чел.)`);
  console.log(`🏠 Пространство: ${space || 'не указано'}`);
  console.log(`📝 Комментарий: ${comment || '—'}`);
  console.log(`========================================\n`);

  // HTML Email Body
  const emailHtml = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #0f0f1a; color: #f1f0ff; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #24243b;">
      <h2 style="color: #a78bfa; border-bottom: 2px solid #7c3aed; padding-bottom: 12px; margin-top: 0; font-size: 22px;">
        📅 Новая бронь в Playce
      </h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 15px;">
        <tr>
          <td style="padding: 10px 0; color: #9490b0; font-weight: bold; width: 160px;">👤 Имя клиента:</td>
          <td style="padding: 10px 0; color: #f1f0ff;">${name}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #9490b0; font-weight: bold;">📞 Телефон:</td>
          <td style="padding: 10px 0; color: #f1f0ff;"><a href="tel:${phone}" style="color: #a78bfa; text-decoration: none;">${phone}</a></td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #9490b0; font-weight: bold;">📅 Дата:</td>
          <td style="padding: 10px 0; color: #f1f0ff;">${formattedDate}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #9490b0; font-weight: bold;">🕐 Время:</td>
          <td style="padding: 10px 0; color: #f1f0ff;">${time}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #9490b0; font-weight: bold;">🎉 Мероприятие:</td>
          <td style="padding: 10px 0; color: #f1f0ff;">${type}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #9490b0; font-weight: bold;">👥 Гостей:</td>
          <td style="padding: 10px 0; color: #f1f0ff;">${guests} чел.</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #9490b0; font-weight: bold;">🏠 Зона / Зал:</td>
          <td style="padding: 10px 0; color: #f1f0ff;">${space || 'не указана'}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #9490b0; font-weight: bold; vertical-align: top;">📝 Комментарий:</td>
          <td style="padding: 10px 0; color: #f1f0ff; line-height: 1.5;">${comment || '—'}</td>
        </tr>
      </table>
      <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #24243b; text-align: center; font-size: 12px; color: #9490b0;">
        Это автоматическое уведомление от сайта Playce Anticafe.
      </div>
    </div>
  `;

  // Check if SMTP is configured and enabled
  if (db.smtp && db.smtp.enabled && db.smtp.user && db.smtp.pass) {
    try {
      const transporter = nodemailer.createTransport({
        host: db.smtp.host,
        port: parseInt(db.smtp.port),
        secure: db.smtp.secure, // true for 465, false for other ports
        auth: {
          user: db.smtp.user,
          pass: db.smtp.pass
        },
        connectionTimeout: 4000,
        greetingTimeout: 4000,
        socketTimeout: 4000
      });

      await transporter.sendMail({
        from: db.smtp.from || db.smtp.user,
        to: targetEmail,
        subject: `🔔 Новая бронь: ${name} (${formattedDate} в ${time})`,
        html: emailHtml
      });

      return res.json({ success: true, method: 'smtp' });
    } catch (emailErr) {
      console.error("Nodemailer failed to send email, falling back to log:", emailErr.message);
      // Return success but warning in server log
      return res.json({ success: true, method: 'log', error: emailErr.message });
    }
  }

  // If SMTP is disabled/not configured, automatically fallback to FormSubmit API so emails arrive out-of-the-box!
  try {
    console.log(`SMTP not configured. Sending booking notification to ${targetEmail} via FormSubmit...`);
    
    // We send key-value pairs formatted nicely for FormSubmit using a timeout
    const response = await fetchWithTimeout(`https://formsubmit.co/ajax/${targetEmail}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        _subject: `🔔 Новая бронь в Playce: ${name}`,
        "Имя": name,
        "Телефон": phone,
        "Дата": formattedDate,
        "Время": time,
        "Тип события": type,
        "Количество гостей": guests,
        "Пространство / Зал": space || 'не указано',
        "Комментарий": comment || '—'
      })
    }, 4000);

    const result = await response.json();
    console.log('FormSubmit status:', result);
    return res.json({ success: true, method: 'formsubmit' });
  } catch (fsErr) {
    console.error("FormSubmit API fallback failed:", fsErr.message);
    res.json({ success: true, method: 'log', warning: 'Email delivery failed. Saved in local logs.' });
  }
});

// Upload endpoint for specific banner
app.post('/api/upload-banner', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { target, spaceId } = req.body;
  const imageUrl = `/uploads/${req.file.filename}`;
  const db = loadDb();

  if (target === 'hero') {
    db.hero.bannerUrl = imageUrl;
  } else if (target === 'space' && spaceId) {
    const spaceIndex = db.spaces.findIndex(s => s.id === spaceId);
    if (spaceIndex !== -1) {
      db.spaces[spaceIndex].imageUrl = imageUrl;
    } else {
      return res.status(400).json({ error: 'Space ID not found' });
    }
  } else {
    return res.status(400).json({ error: 'Invalid target type' });
  }

  saveDb(db);
  res.json({ success: true, imageUrl, data: db });
});

// Upload endpoint for gallery
app.post('/api/upload-gallery', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const imageUrl = `/uploads/${req.file.filename}`;
  const db = loadDb();
  
  if (!db.gallery) {
    db.gallery = [];
  }
  
  db.gallery.push(imageUrl);
  saveDb(db);

  res.json({ success: true, imageUrl, gallery: db.gallery });
});

// Delete from gallery
app.post('/api/delete-gallery', (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl) {
    return res.status(400).json({ error: 'Image URL required' });
  }

  const db = loadDb();
  const index = db.gallery.indexOf(imageUrl);
  if (index !== -1) {
    db.gallery.splice(index, 1);
    
    // Attempt to delete physical file
    const filename = path.basename(imageUrl);
    const filePath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error("Could not delete file:", filePath, err);
      }
    }
    
    saveDb(db);
    return res.json({ success: true, gallery: db.gallery });
  }

  res.status(404).json({ error: 'Image not found in gallery list' });
});

// Serve dynamic uploads directory at /uploads route
app.use('/uploads', express.static(UPLOADS_DIR));

// Serve other public static files
app.use(express.static(path.join(__dirname, 'public')));

// Admin route (redirects to admin.html)
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`Playce website running at:`);
  console.log(`👉 http://localhost:${PORT}`);
  console.log(`👉 Admin Panel: http://localhost:${PORT}/admin`);
  console.log(`========================================`);
});
