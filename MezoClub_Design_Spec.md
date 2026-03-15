# MezoClub CRM — Полное ТЗ на дизайн
## Для Cursor / AI-редактора кода
## Проект: ~/mezoclub-frontend (React + Vite + Tailwind + Framer Motion)

---

## 1. ФИРМЕННЫЙ СТИЛЬ (из брендбука)

### Шрифт
- **Museo Sans Cyrl** — фирменный шрифт MezoClub (все начертания: 100-900)
- Подключить через Google Fonts или CDN: `https://fonts.cdnfonts.com/css/museo-sans-cyrl`
- Fallback: `"Museo Sans Cyrl", "Inter", system-ui, sans-serif`
- В index.css заменить `--font-sans: "Inter"` на `--font-sans: "Museo Sans Cyrl", "Inter", system-ui, sans-serif`
- В index.css добавить: `@import url('https://fonts.cdnfonts.com/css/museo-sans-cyrl');`

### Основные цвета бренда
| Название | HEX | RGB | Использование |
|----------|-----|-----|---------------|
| Сине-зелёный (основной) | `#136579` | R19 G101 B121 | Акцент, активные элементы, ссылки, иконки |
| Пудровый | `#DCBAA7` | R215 G179 B167 | Второстепенные элементы, hover-состояния, бейджи |
| Серый | `#D5D5DC` | R213 G213 B220 | Границы, разделители, неактивный текст |

### Цвета для CRM (на тёмном фоне — адаптация бренда)
| Переменная CSS | Значение | Описание |
|----------------|----------|----------|
| `--color-bg` | `#050510` | Фон body |
| `--color-card` | `rgba(20,18,42,0.9)` | Фон glassmorphism карточки |
| `--color-sidebar` | `rgba(12,10,30,0.96)` | Фон сайдбара |
| `--color-accent` | `#136579` | Основной акцент (заменяет жёлтый #B8860B ВЕЗДЕ) |
| `--color-accent-light` | `#1a8a9e` | Hover-состояние акцента |
| `--color-accent-glow` | `rgba(19,101,121,0.3)` | Glow-эффект акцента |
| `--color-gold` | `#B8860B` | ТОЛЬКО для GinCoin (монетки, кувшин, баланс) |
| `--color-teal` | `#00D4AA` | Линия графика, позитивные статусы |
| `--color-text` | `#E0E0E0` | Основной текст |
| `--color-muted` | `#888888` | Вторичный текст |
| `--color-error` | `#EF4444` | Ошибки, отмены |
| `--color-border` | `rgba(255,255,255,0.06)` | Границы карточек |

### ВАЖНО: Замена жёлтого на сине-зелёный
Во ВСЕХ файлах проекта найти и заменить:
- `#B8860B` → `#136579` (кроме GinCoin блоков)
- `#D4A017` → `#1a8a9e`
- `#FFD700` → `#1a8a9e` (кроме GinCoin)
- `rgba(184,134,11` → `rgba(19,101,121` (кроме GinCoin)
- `linear-gradient(135deg, #B8860B, #FFD700)` → `linear-gradient(135deg, #136579, #1a8a9e)` (кроме GinCoin)

Файлы для проверки: `src/index.css`, `src/components/Sidebar.tsx`, `src/pages/DashboardPage.tsx`, `src/pages/CatalogPage.tsx`, `src/pages/LoginPage.tsx`, `src/pages/OrdersPage.tsx`, `src/pages/KpiPage.tsx`, `src/pages/SettingsPage.tsx`, `src/pages/RatingPage.tsx`

---

## 2. КОСМИЧЕСКИЙ ФОН

### Body background (index.css)
```css
body {
  font-family: var(--font-sans);
  background:
    radial-gradient(ellipse at 20% 15%, rgba(19,101,121,0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 60%, rgba(19,101,121,0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 90%, rgba(0,212,170,0.06) 0%, transparent 40%),
    #050510;
  color: var(--color-text);
  min-height: 100vh;
}
```

### Nebula blobs (в index.css)
```css
.nebula-blob {
  position: fixed;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  z-index: 0;
  animation: nebulaDrift 25s ease-in-out infinite;
}
.nebula-blob-1 {
  top: 5%; right: 15%;
  width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(19,101,121,0.20), transparent 70%);
}
.nebula-blob-2 {
  bottom: 20%; left: 20%;
  width: 350px; height: 350px;
  background: radial-gradient(circle, rgba(19,101,121,0.12), transparent 70%);
  animation-direction: reverse;
  animation-duration: 30s;
}
.nebula-blob-3 {
  top: 50%; right: 40%;
  width: 300px; height: 300px;
  background: radial-gradient(circle, rgba(0,212,170,0.10), transparent 70%);
  animation-duration: 35s;
}
@keyframes nebulaDrift {
  0%   { transform: translate(0, 0); }
  33%  { transform: translate(30px, -25px); }
  66%  { transform: translate(-20px, 20px); }
  100% { transform: translate(0, 0); }
}
```

### Звёзды (Particles.tsx)
Компонент должен рендерить:
- 50 статичных пульсирующих точек (класс `.star`, анимация `starPulse`)
- 3 nebula-blob div'а (ВНЕ `.particles-container`, через Fragment `<>...</>`)

```css
.star {
  position: absolute;
  border-radius: 50%;
  background: rgba(255,255,255,0.4);
  animation: starPulse ease-in-out infinite;
}
@keyframes starPulse {
  0%, 100% { opacity: 0.15; transform: scale(1); }
  50%      { opacity: 0.7; transform: scale(1.4); }
}
```

---

## 3. GLASSMORPHISM КАРТОЧКИ

### .glass-card (index.css)
```css
.glass-card {
  background: linear-gradient(135deg, rgba(20,18,42,0.9), rgba(30,25,60,0.8));
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04);
  transition: all 0.3s ease;
}
.glass-card:hover {
  border-color: rgba(19,101,121,0.25);
  box-shadow: 0 8px 40px rgba(19,101,121,0.12), 0 0 60px rgba(19,101,121,0.05);
  transform: translateY(-2px);
}
```

### GlassCard.tsx — уже имеет 3D tilt (perspective + rotateX/Y), оставить как есть.

---

## 4. САЙДБАР (Sidebar.tsx)

### Логотип
- Иконка "M" в квадрате с border-radius: 10px, background: `linear-gradient(135deg, #136579, #1a8a9e)`
- Текст "MezoClub" — gradient text с цветами `#136579` → `#1a8a9e`

### Активный пункт меню
- Цвет текста: `#136579` (не #B8860B!)
- Background: `rgba(19,101,121,0.12)`
- Border-left: `3px solid #136579`

### AI Ассистенты (секция перед кнопкой "Выйти")
- Заголовок: "AI ASSISTANTS" (uppercase, muted, 9.5px)
- Rocco — зелёная точка (.ai-dot-online), статус "онлайн"
- Teya — жёлтая мигающая точка (.ai-dot-thinking), статус "думає..."

---

## 5. LAYOUT ФИКСЫ (все страницы)

### Общие правила
- Все страницы: padding `24px 32px`
- Все таблицы: обернуть в `div` с `overflow-x: auto`, на `table` поставить `min-width: 500px`
- Все колонки в таблицах НЕ должны налезать друг на друга

### Дашборд (/dashboard)
- 4 карточки статистики: `grid grid-cols-2 xl:grid-cols-4 gap-4` — все видимы, ничего не обрезается
- Отступ между карточками и графиком: `mb-6`
- Таблицы "Последние заказы" и "Топ клиентов": `grid grid-cols-1 lg:grid-cols-2 gap-6`, обе с `overflow-x: auto`
- GinCoin блок: `mt-6` отступ от таблиц

### Каталог (/catalog)
- Карточки товаров: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5`
- Фильтр категорий: активная кнопка — `background: linear-gradient(135deg, #136579, #1a8a9e)`, color белый
- Цена товара: бирюзовый `#00D4AA`
- Бейдж бренда: `rgba(255,255,255,0.06)` фон

### Заказы (/orders)
- Таблица: все колонки видны, статусы — pill-бейджи (border-radius: 9999px)
- Статусы: completed=`#00D4AA`, processing/pending=`#fbbf24`, new=`#136579`, cancelled=`#EF4444`

### KPI (/kpi)
- Ячейки KPI: одинаковый размер, цифры не налезают
- Прогресс-бары: основной цвет `#136579`, критический `#EF4444`

### Рейтинг (/rating)
- Строки с отступами между собой
- Мини-иконки кувшинов рядом с GinCoin балансом

### Настройки (/settings)
- Убрать жёлтый цвет из табов и кнопок → заменить на `#136579`
- Нормальные отступы между блоками формы

### GinCoin кувшин (/gincoin)
- Кувшин с ручкой (как в референсе https://kpidash24-tm9kf4vk.manus.space)
- Золотой цвет (#B8860B → #FFD700) здесь ОСТАЁТСЯ — это единственное место для золотого
- Монетки внутри с анимацией падения
- Уровни: Newcomer (прозрачный), Bronze (бронзовый), Silver (серебряный), Gold (золотой), Platinum (светящийся)

---

## 6. КНОПКИ

### Primary (.btn-primary)
```css
.btn-primary {
  background: linear-gradient(135deg, #136579, #1a8a9e);
  color: #fff;
  font-weight: 600;
  padding: 10px 24px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(19,101,121,0.4);
}
```

### Input focus
```css
.input-glass:focus {
  border-color: rgba(19,101,121,0.5);
  box-shadow: 0 0 0 3px rgba(19,101,121,0.1);
}
```

---

## 7. РЕФЕРЕНСЫ ДИЗАЙНА

### Основные
- **Linear.app** — минимализм, тёмная тема, много воздуха, тонкие границы, scatter plot графики
- **Stripe Dashboard** — графики с gradient fill, чистые карточки метрик, tooltip'ы
- **Концепция "космос"** — звёздное поле, nebula-свечение, glassmorphism, glow-бордеры

### Чего НЕ делать
- Никакого жёлтого "забора" (#B8860B) на кнопках и акцентах — только для GinCoin
- Никакого Inter шрифта — используем Museo Sans Cyrl
- Никаких плоских чёрных фонов — всегда gradient с nebula-свечением
- Никаких обрезанных таблиц — всегда overflow-x: auto

---

## 8. ПОСЛЕ ПРИМЕНЕНИЯ

1. `rm -rf node_modules/.vite dist`
2. `npm run dev`
3. Проверить в инкогнито: Cmd+Shift+N → localhost:5173
4. Проверить все страницы: /dashboard, /catalog, /orders, /kpi, /rating, /settings, /gincoin
5. Закоммитить: `git add -A && git commit -m "feat: cosmic design with brand colors and Museo Sans font" && git push`
