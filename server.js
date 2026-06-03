const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
  gallery: []
};

// Load or create DB
function loadDb() {
  if (!fs.existsSync(DB_PATH)) {
    saveDb(DEFAULT_DB);
    return DEFAULT_DB;
  }
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
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

  saveDb(currentDb);
  res.json({ success: true, data: currentDb });
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
