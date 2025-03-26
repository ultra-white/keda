# KEDA - Интернет-магазин обуви

Современный интернет-магазин обуви, разработанный с использованием Next.js, Prisma, SQLite/PostgreSQL и TypeScript.

## Основные функции

- 👟 Каталог товаров с фильтрацией по категориям (Men, Women, Kids) и брендам
- 🔍 Поиск товаров по названию
- 🛒 Корзина с возможностью изменения количества и размера
- 💳 Оформление заказа
- 👤 Личный кабинет пользователя с историей заказов
- 👑 Панель управления для администраторов
- 📱 Адаптивный дизайн для всех устройств

## Технологический стек

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes
- **Database**: SQLite (по умолчанию) или PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js, bcrypt
- **UI компоненты**: Lucide Icons, React Spinners

## Запуск проекта

### Предварительные требования

- Node.js (версия 18 или выше)
- Для работы с PostgreSQL: PostgreSQL (локально или в облаке)

### Установка

1. Клонируйте репозиторий:

```bash
git clone https://github.com/yourusername/keda-shop.git
cd keda-shop
```

2. Установите зависимости:

```bash
npm install
```

3. Скопируйте файл `.env.example` в `.env`:

```bash
cp .env.example .env
```

Файл `.env.example` содержит следующие переменные окружения:

```
# SQLite
DATABASE_URL="file:./keda_db.db"

# PostgreSQL (Change provider in prisma/schema.prisma)
# DATABASE_URL="postgresql://postgres:admin@localhost:5432/keda_db"

NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

Для использования PostgreSQL вместо SQLite раскомментируйте строку с PostgreSQL URL и внесите изменения в `prisma/schema.prisma`, изменив провайдер на "postgresql".

4. Настройте базу данных:

```bash
npx prisma migrate dev --name init
```

5. Генерация клиента Prisma:

```bash
npx prisma generate
```

6. Запустите проект в режиме разработки:

```bash
npm run dev
```

7. Откройте [http://localhost:3000](http://localhost:3000) в браузере.

### Заполнение базы данных (опционально)

Если вы хотите заполнить базу данных тестовыми данными:

```bash
npx ts-node -P tsconfig.node.json prisma/seed.ts
```

## Структура проекта

```
keda-shop/
├── app/                    # Next.js App Router
│   ├── admin/              # Панель администратора
│   ├── api/                # API endpoints
│   ├── auth/               # Авторизация
│   ├── cart/               # Корзина
│   ├── checkout/           # Оформление заказа
│   ├── components/         # React компоненты
│   ├── orders/             # Заказы пользователя
│   ├── products/           # Страницы товаров
│   ├── profile/            # Личный кабинет пользователя
│   └── ...
├── lib/                    # Утилиты и хелперы
├── prisma/                 # Prisma схема и миграции
│   ├── schema.prisma       # Модель данных
│   └── seed.ts             # Скрипт для заполнения БД
├── public/                 # Статические файлы
│   └── products/           # Изображения продуктов
└── ...
```

## Учетные записи для тестирования

### Администратор

- Email: admin@example.com
- Пароль: admin

### Пользователь

- Email: user@example.com
- Пароль: user

## Основные страницы

- **Главная** - `/` - Промо-разделы и популярные категории
- **Каталог** - `/products` - Список товаров с фильтрами
- **Карточка товара** - `/products/[id]` - Детальная информация о товаре
- **Корзина** - `/cart` - Просмотр и управление товарами в корзине
- **Оформление заказа** - `/checkout` - Завершение покупки
- **Заказы** - `/orders` - История заказов пользователя
- **Профиль** - `/profile` - Управление личными данными
- **Авторизация** - `/auth/signin` - Вход в систему
- **Регистрация** - `/auth/signup` - Создание нового аккаунта

## Панель администратора

- **Главная** - `/admin` - Статистика и обзор
- **Товары** - `/admin/products` - Управление товарами
- **Категории** - `/admin/categories` - Управление категориями
- **Бренды** - `/admin/brands` - Управление брендами
- **Заказы** - `/admin/orders` - Управление заказами
- **Пользователи** - `/admin/users` - Управление пользователями

## Дополнительная информация

### Размеры кроссовок

В проекте используются европейские размеры обуви:

- Мужские: 40-47
- Женские: 35-42
- Детские: 28-35

### Статусы заказов

- `PENDING` - Ожидает обработки
- `PROCESSING` - В обработке
- `SHIPPED` - Отправлен
- `DELIVERED` - Доставлен
- `CANCELLED` - Отменен

## Разработка

### Запуск тестов

```bash
npm test
```

### Работа с Prisma

Просмотр данных в БД:

```bash
npx prisma studio
```

Обновление клиента после изменения схемы:

```bash
npx prisma generate
```

Создание миграции:

```bash
npx prisma migrate dev --name add_new_feature
```

## Решение проблем

### Ошибки в migrrations

Если у вас возникли проблемы с миграциями, попробуйте удалить папку `prisma/migrations` и файл базы данных `*.db`, а затем запустить миграцию заново:

```bash
npx prisma migrate dev --name init
```

## Лицензия

MIT
