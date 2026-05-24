# LMS — Learning Management System

Полнофункциональная платформа для онлайн-обучения с ролевой моделью доступа, системой курсов, уроков, тестирования и отслеживания прогресса. Реализована как монорепозиторий с раздельными бэкендом и фронтендом, поднимаемыми через Docker Compose.

---

## Содержание

- [Обзор проекта](#обзор-проекта)
- [Технологический стек](#технологический-стек)
- [Архитектура](#архитектура)
- [Структура репозитория](#структура-репозитория)
- [Ролевая модель](#ролевая-модель)
- [Бэкенд](#бэкенд)
  - [API-маршруты](#api-маршруты)
  - [База данных и схема Prisma](#база-данных-и-схема-prisma)
  - [Аутентификация и безопасность](#аутентификация-и-безопасность)
- [Фронтенд](#фронтенд)
  - [Страницы](#страницы)
  - [Feature Sliced Design](#feature-sliced-design)
  - [Интернационализация](#интернационализация)
  - [Темизация](#темизация)
- [Запуск проекта](#запуск-проекта)
  - [Через Docker Compose](#через-docker-compose)
  - [Локальная разработка](#локальная-разработка)
- [Переменные окружения](#переменные-окружения)
- [Тестирование](#тестирование)
- [Схема базы данных](#схема-базы-данных)
- [Бизнес-процессы](#бизнес-процессы)

---

## Обзор проекта

LMS (Learning Management System) — это веб-приложение, позволяющее:

- **Студентам** — просматривать одобренные курсы, проходить уроки, сдавать тесты и отслеживать свой прогресс.
- **Преподавателям** — создавать и редактировать курсы, добавлять уроки и тесты, назначать соавторов-преподавателей, просматривать результаты студентов.
- **Администраторам** — управлять ролями пользователей, модерировать курсы (одобрять или отклонять) и иметь полный доступ ко всем возможностям платформы.

Особенности платформы:
- Система модерации курсов: новый курс сначала попадает в статус `PENDING`, затем администратор его одобряет (`APPROVED`) или отклоняет (`REJECTED`).
- Поддержка нескольких преподавателей на одном курсе через модель `CourseTeacher`.
- Загрузка аватара пользователя в формате base64.
- Полноценный тест-раннер с постраничным прохождением и итоговым результатом.
- Двуязычный интерфейс (русский / английский) и переключение тёмной/светлой темы.

---

## Технологический стек

### Бэкенд

| Технология | Версия | Назначение |
|---|---|---|
| Node.js | 20 | Среда выполнения |
| TypeScript | 5.x | Типизация |
| Express | 5.x | HTTP-фреймворк |
| Prisma | 7.x | ORM + миграции |
| PostgreSQL | 15 | Реляционная СУБД |
| bcrypt | 6.x | Хеширование паролей |
| jsonwebtoken | 9.x | JWT-аутентификация |
| Zod | 3.x | Валидация входных данных |
| Pino | 9.x | Структурированное логирование |
| helmet | 8.x | HTTP-заголовки безопасности |
| express-rate-limit | 8.x | Ограничение частоты запросов |

### Фронтенд

| Технология | Версия | Назначение |
|---|---|---|
| React | 19 | UI-библиотека |
| TypeScript | 5.x | Типизация |
| Vite | 8.x | Сборщик и dev-сервер |
| Redux Toolkit | 2.x | Глобальное состояние (auth) |
| React Router | 7.x | Клиентская маршрутизация |
| Axios | 1.x | HTTP-клиент |
| ESLint | 9.x | Линтинг кода |

### Инфраструктура

| Технология | Назначение |
|---|---|
| Docker / Docker Compose | Контейнеризация всех сервисов |
| yarn | Пакетный менеджер (оба модуля) |

---

## Архитектура

```
┌─────────────────────────────────────────────────┐
│                  Docker Compose                 │
│                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │ frontend │    │ backend  │    │    db    │  │
│  │  :5173   │───▶│  :5000   │───▶│  :5432   │  │
│  │  React   │    │ Express  │    │ Postgres │  │
│  └──────────┘    └──────────┘    └──────────┘  │
└─────────────────────────────────────────────────┘
```

- **frontend** — React SPA, общается с бэкендом по REST через `VITE_API_URL`.
- **backend** — Express REST API, авторизует запросы через JWT Bearer-токен.
- **db** — PostgreSQL 15, данные персистируются через именованный Docker volume `postgres_data`.

Бэкенд при старте автоматически выполняет `prisma migrate deploy` (применяет все pending-миграции), после чего запускает `ts-node-dev` в режиме hot-reload.

---

## Структура репозитория

```
/
├── backend/                    # Node.js / Express API
│   ├── prisma/
│   │   ├── schema.prisma       # Схема базы данных
│   │   └── migrations/         # SQL-миграции
│   ├── src/
│   │   ├── controllers/        # Бизнес-логика эндпоинтов
│   │   │   ├── auth.controller.ts
│   │   │   ├── course.controller.ts
│   │   │   ├── lesson.controller.ts
│   │   │   ├── test.controller.ts
│   │   │   ├── progress.controller.ts
│   │   │   └── admin.controller.ts
│   │   ├── routes/             # Определение маршрутов
│   │   │   ├── auth.routes.ts
│   │   │   ├── course.routes.ts
│   │   │   ├── lesson.routes.ts
│   │   │   ├── test.routes.ts
│   │   │   ├── progress.routes.ts
│   │   │   └── admin.routes.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts   # Проверка JWT
│   │   │   └── role.middleware.ts   # Проверка роли
│   │   ├── utils/
│   │   │   ├── prisma.ts            # Singleton Prisma Client
│   │   │   ├── logger.ts            # Pino logger
│   │   │   └── coursePermissions.ts # Утилита проверки прав на курс
│   │   ├── constants/
│   │   │   └── roles.ts             # ID ролей и статусы курсов
│   │   ├── validation/
│   │   │   └── schemas.ts           # Zod-схемы валидации
│   │   ├── __tests__/
│   │   │   └── health.test.ts
│   │   └── index.ts                 # Точка входа, настройка Express
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── app/
│   │   │   ├── providers/      # StoreProvider, ThemeProvider, LocaleProvider
│   │   │   ├── router/         # AppRouter, ProtectedRoute, AuthBootstrap
│   │   │   └── store/          # Redux store
│   │   ├── pages/              # Страницы-обёртки
│   │   ├── widgets/            # Крупные UI-блоки
│   │   │   ├── auth/           # LoginCard, RegisterCard
│   │   │   ├── course/         # CoursesOverview, CourseDetailsView
│   │   │   ├── lesson/         # LessonDetailsView
│   │   │   ├── test/           # TestRunnerView
│   │   │   ├── profile/        # ProfileDashboard
│   │   │   └── layout/         # AppHeader, AppLayout
│   │   ├── features/           # Изолированные фичи
│   │   │   ├── auth/           # authSlice, authApi, LoginForm
│   │   │   ├── course/         # courseApi
│   │   │   ├── test/           # testApi
│   │   │   ├── progress/       # progressApi
│   │   │   ├── profile/        # AvatarUploader
│   │   │   └── admin/          # adminApi
│   │   └── shared/
│   │       ├── api/            # Axios instance с interceptors
│   │       ├── lib/            # i18n, roles, getApiErrorMessage
│   │       ├── styles/         # CSS: tokens, base, components, layout
│   │       └── ui/             # Chip, CollapsibleSection, LoadingState и др.
│   ├── Dockerfile
│   ├── vite.config.ts
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

---

## Ролевая модель

В системе три роли, хранящиеся в таблице `Role`:

| ID | Название | Описание |
|---|---|---|
| 1 | `STUDENT` | Роль по умолчанию при регистрации. Просматривает одобренные курсы, проходит уроки и тесты. |
| 2 | `TEACHER` | Создаёт и редактирует курсы, уроки и тесты. Видит результаты студентов в своих курсах. |
| 3 | `ADMIN` | Полный доступ: управление ролями пользователей, модерация курсов. Видит все курсы независимо от статуса. |

Переход между ролями: только администратор может повысить пользователя до преподавателя через эндпоинт `PATCH /admin/users/:id/role`.

---

## Бэкенд

### API-маршруты

#### Аутентификация (`/auth`)

| Метод | Путь | Доступ | Описание |
|---|---|---|---|
| POST | `/auth/register` | Публичный | Регистрация нового пользователя (роль `STUDENT`) |
| POST | `/auth/login` | Публичный | Вход, возвращает JWT-токен |
| GET | `/auth/me` | 🔒 Auth | Получение данных текущего пользователя |
| PATCH | `/auth/me/avatar` | 🔒 Auth | Обновление URL аватара (base64-строка) |

#### Курсы (`/courses`)

| Метод | Путь | Доступ | Описание |
|---|---|---|---|
| GET | `/courses` | 🔒 Auth | Список всех курсов |
| GET | `/courses/:id` | 🔒 Auth | Детали курса с уроками и преподавателями |
| POST | `/courses` | 🔒 Teacher/Admin | Создание курса (статус `PENDING`) |
| PUT | `/courses/:id` | 🔒 Владелец/Admin | Редактирование курса |
| DELETE | `/courses/:id` | 🔒 Владелец/Admin | Удаление курса со всем содержимым (транзакция) |
| POST | `/courses/:id/teachers` | 🔒 Владелец/Admin | Добавление соавтора-преподавателя |
| GET | `/courses/:id/test-attempts` | 🔒 Владелец/Admin | Попытки тестов студентов по курсу |

#### Уроки

| Метод | Путь | Доступ | Описание |
|---|---|---|---|
| GET | `/courses/:id/lessons` | 🔒 Auth | Список уроков курса |
| GET | `/lessons/:id` | 🔒 Auth | Детали урока с тестами |
| POST | `/lessons` | 🔒 Teacher/Admin | Создание урока |
| DELETE | `/lessons/:id` | 🔒 Владелец/Admin | Удаление урока (каскад: тесты, попытки) |

#### Тесты

| Метод | Путь | Доступ | Описание |
|---|---|---|---|
| GET | `/tests/:id` | 🔒 Auth | Получение теста (без поля `isCorrect`) |
| POST | `/tests` | 🔒 Teacher/Admin | Создание теста с вопросами и вариантами ответов |
| DELETE | `/tests/:id` | 🔒 Владелец/Admin | Удаление теста |
| POST | `/tests/:id/submit` | 🔒 Auth | Сдача теста, возвращает `score` и `total` |

#### Прогресс

| Метод | Путь | Доступ | Описание |
|---|---|---|---|
| POST | `/progress/complete-lesson` | 🔒 Auth | Отметить урок как пройденный, пересчитать прогресс |
| GET | `/progress/me` | 🔒 Auth | Прогресс по всем курсам и история попыток |
| GET | `/progress/:courseId` | 🔒 Auth | Прогресс по конкретному курсу |

#### Администрирование (`/admin`)

| Метод | Путь | Доступ | Описание |
|---|---|---|---|
| GET | `/admin/users` | 🔒 Admin | Список всех пользователей |
| PATCH | `/admin/users/:id/role` | 🔒 Admin | Изменение роли пользователя |
| GET | `/admin/courses/pending` | 🔒 Admin | Курсы в статусе `PENDING` |
| PATCH | `/admin/courses/:id/moderation` | 🔒 Admin | Одобрить или отклонить курс |

#### Служебные

| Метод | Путь | Описание |
|---|---|---|
| GET | `/healthz` | Health-check (возвращает `{ status: "ok" }`) |

---

### База данных и схема Prisma

Файл: `backend/prisma/schema.prisma`

Основные модели:

**`User`** — пользователь платформы. Поля: `id`, `name`, `email`, `passwordHash`, `avatarUrl`, `roleId`, `createdAt`. Связи: `Role`, `Course[]` (авторство), `UserProgress[]`, `TestAttempt[]`, `UserLesson[]`, `CourseTeacher[]`.

**`Role`** — справочник ролей (`STUDENT`, `TEACHER`, `ADMIN`).

**`Course`** — курс. Поля: `id`, `title`, `description`, `status` (`PENDING`/`APPROVED`/`REJECTED`), `authorId`, `createdAt`. Связи: `User` (автор), `CourseTeacher[]`, `Lesson[]`, `UserProgress[]`.

**`CourseTeacher`** — связь многие-ко-многим между курсом и дополнительными преподавателями. Уникальность по `(courseId, userId)`.

**`Lesson`** — урок в курсе. Поля: `id`, `title`, `content`, `orderIndex`, `courseId`. Связи: `Course`, `Test[]`, `UserLesson[]`.

**`Test`** — тест для урока. Один урок может иметь несколько тестов. Связи: `Lesson`, `Question[]`, `TestAttempt[]`.

**`Question`** — вопрос теста. Поля: `id`, `text`, `type` (например, `"single"`), `testId`.

**`Answer`** — вариант ответа. Поля: `id`, `text`, `isCorrect`, `questionId`. Поле `isCorrect` **никогда не отдаётся клиенту** при запросе теста.

**`TestAttempt`** — попытка прохождения теста студентом. Хранит итоговый `score`.

**`TestAnswer`** — выбранный ответ в рамках конкретной попытки.

**`UserProgress`** — прогресс студента по курсу: `completedLessons` и `progressPercent`.

**`UserLesson`** — факт прохождения урока студентом. Уникальность по `(userId, lessonId)`.

#### История миграций

| Файл | Описание |
|---|---|
| `20260321145422_init` | Начальная схема: все основные таблицы |
| `20260323225251_add_user_lesson` | Добавлена таблица `UserLesson` |
| `20260428161000_admin_course_workflows` | Добавлены поле `Course.status` и таблица `CourseTeacher` |
| `20260428181000_user_avatar` | Добавлено поле `User.avatarUrl` |

---

### Аутентификация и безопасность

- **JWT Bearer Token**: при логине сервер возвращает токен с полезной нагрузкой `{ userId, roleId }`, действующий 24 часа. Клиент хранит токен в `localStorage` и передаёт его в заголовке `Authorization: Bearer <token>`.
- **Хеширование паролей**: bcrypt с salt rounds = 10.
- **Валидация**: все входящие данные проверяются Zod-схемами ещё до обращения к базе.
- **Rate limiting**: 300 запросов за 15 минут на IP (через `express-rate-limit`).
- **HTTP-заголовки**: helmet устанавливает безопасные заголовки (CSP, X-Frame-Options и др.).
- **CORS**: разрешённые источники задаются через переменную окружения `CORS_ORIGINS`.
- **Разграничение прав**: помимо глобальной проверки роли (`requireRole`), на уровне курса применяется утилита `canManageCourse` — она проверяет, является ли пользователь автором курса или назначенным преподавателем (`CourseTeacher`).
- **Каскадное удаление**: реализовано вручную через `$transaction`, чтобы гарантировать консистентность данных при удалении курса, урока или теста.

---

## Фронтенд

### Страницы

| Путь | Компонент | Доступ | Описание |
|---|---|---|---|
| `/login` | `LoginPage` | Публичный | Форма входа |
| `/register` | `RegisterPage` | Публичный | Форма регистрации |
| `/courses` | `CoursesPage` | 🔒 Auth | Список курсов с поиском по названию и ID |
| `/courses/:id` | `CoursePage` | 🔒 Auth | Детали курса, список уроков |
| `/lessons/:id` | `LessonPage` | 🔒 Auth | Просмотр урока, отметка прохождения |
| `/tests/:id` | `TestPage` | 🔒 Auth | Прохождение теста |
| `/profile` | `ProfilePage` | 🔒 Auth | Личный кабинет, панели преподавателя и администратора |

#### Загрузка сессии

При старте приложения компонент `AuthBootstrap` проверяет наличие JWT в `localStorage`. Если токен есть, но данные пользователя ещё не загружены, выполняется запрос `GET /auth/me` для восстановления сессии. Это позволяет сохранять авторизацию при перезагрузке страницы.

#### Защищённые маршруты

`ProtectedRoute` проверяет флаг `isAuth` из Redux-хранилища. Если пользователь не авторизован — перенаправляет на `/login`.

---

### Feature Sliced Design

Фронтенд следует архитектуре **Feature Sliced Design (FSD)**:

```
src/
├── app/         # Инициализация: провайдеры, роутер, store
├── pages/       # Страницы-обёртки (thin слой)
├── widgets/     # Самодостаточные крупные блоки (содержат логику загрузки данных)
├── features/    # Изолированные бизнес-фичи (api, model, ui)
└── shared/      # Переиспользуемое: api, lib, ui, styles
```

**Почему такая архитектура?** FSD обеспечивает чёткую однонаправленную зависимость слоёв (`app → pages → widgets → features → shared`), что исключает циклические зависимости и делает код масштабируемым.

#### Ключевые решения

**Axios instance** (`shared/api/axios.ts`):
- Базовый URL берётся из `VITE_API_URL` (по умолчанию `http://localhost:5000`).
- Request interceptor автоматически добавляет `Authorization: Bearer` заголовок из `localStorage`.
- Response interceptor при получении 401 удаляет токен из `localStorage`.

**Redux** используется только для глобального состояния аутентификации (`authSlice`). Все остальные данные хранятся в локальном state компонентов — это осознанное решение, избегающее избыточного усложнения.

**Фильтрация курсов на клиенте**: студенты видят только курсы со статусом `APPROVED`, преподаватели и администраторы — все. Фильтрация происходит на фронтенде после получения полного списка, что упрощает API.

---

### Интернационализация

Реализована собственная лёгкая i18n система без внешних зависимостей.

Файлы: `shared/lib/i18n/`

- **`LocaleContext`** — React-контекст с текущей локалью (`"ru"` или `"en"`), функцией `setLocale` и функцией-переводчиком `t`.
- **`locales/ru.ts`** и **`locales/en.ts`** — объекты-деревья переводов с вложенными ключами.
- **`translate.ts`** — функция `createTranslator`, которая принимает дерево переводов и возвращает функцию `t(key, params?)`. Поддерживает интерполяцию через `{placeholder}`.
- Выбранная локаль сохраняется в `localStorage` под ключом `lms-locale`.
- Переключение языка — кнопка в шапке и на страницах авторизации.

Пример использования:
```tsx
const { t } = useTranslation();
t("courses.title")                          // "Курсы" / "Courses"
t("profile.progressLine", { title: "JS", percent: 75, lessons: 3 })
// "JS: 75% (3 урока)" / "JS: 75% (3 lessons)"
```

---

### Темизация

Реализована через CSS-переменные и атрибут `data-theme` на корневом элементе `<html>`.

Файлы: `shared/styles/tokens.css`

- **Тёмная тема** (по умолчанию): тёмный фон `#13151c`, акцент `#8b7cf8` (фиолетовый).
- **Светлая тема**: светлый фон `#f0f1f5`, акцент `#6b5ce7`.
- Выбранная тема сохраняется в `localStorage` под ключом `lms-theme`.
- При первом визите определяется через `window.matchMedia("(prefers-color-scheme: light)")`.
- Управление через `ThemeProvider` / `useTheme` hook.

Переключение: кнопка-иконка ☀/☾ в шапке и на страницах авторизации.

---

## Запуск проекта

### Через Docker Compose

Самый простой способ запустить всё окружение:

```bash
# Клонируйте репозиторий
git clone <repo-url>
cd <repo-dir>

# Запустите все сервисы
docker-compose up --build
```

После запуска:
- Фронтенд: [http://localhost:5173](http://localhost:5173)
- Бэкенд API: [http://localhost:5000](http://localhost:5000)
- Health-check: [http://localhost:5000/healthz](http://localhost:5000/healthz)

Бэкенд автоматически применит миграции базы данных при старте.

> **Prisma Studio** (опционально): после запуска контейнеров выполните:
> ```bash
> docker exec -it lms_backend npx prisma studio --port 5555 --browser none
> ```
> Откройте [http://localhost:5555](http://localhost:5555) для просмотра БД.

---

### Локальная разработка

#### Требования
- Node.js 20+
- PostgreSQL 15
- yarn

#### Бэкенд

```bash
cd backend

# Установка зависимостей
yarn install

# Настройка переменных окружения
cp .env.example .env
# Отредактируйте .env: укажите DATABASE_URL, JWT_SECRET, PORT

# Применение миграций
yarn prisma:migrate

# Запуск в режиме разработки (hot-reload)
yarn dev
```

#### Фронтенд

```bash
cd frontend

# Установка зависимостей
yarn install

# Запуск dev-сервера
yarn dev
```

По умолчанию фронтенд обращается к API на `http://localhost:5000`. Для изменения создайте файл `frontend/.env`:
```
VITE_API_URL=http://localhost:5000
```

---

## Переменные окружения

### Бэкенд (`.env`)

| Переменная | Пример | Описание |
|---|---|---|
| `DATABASE_URL` | `postgresql://user:password@localhost:5432/lms_db` | Строка подключения к PostgreSQL |
| `JWT_SECRET` | `supersecretkey` | Секрет для подписи JWT-токенов |
| `PORT` | `5000` | Порт HTTP-сервера |
| `CORS_ORIGINS` | `http://localhost:5173` | Разрешённые CORS-источники (через запятую) |
| `LOG_LEVEL` | `info` | Уровень логирования Pino (`trace`, `debug`, `info`, `warn`, `error`) |

### Фронтенд

| Переменная | Пример | Описание |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5000` | Базовый URL бэкенд API |

---

## Тестирование

### Бэкенд

Используется **Jest** + **ts-jest** + **supertest**.

```bash
cd backend
yarn test
```

Тесты находятся в `src/__tests__/`. Текущий покрытый сценарий:
- `health.test.ts` — проверяет доступность эндпоинта `GET /healthz`.

Конфигурация в `jest.config.cjs`: окружение Node.js, glob-паттерн `**/__tests__/**/*.test.ts`, автоматическая загрузка `.env` через `dotenv/config`.

---

## Схема базы данных

```
Role ──< User >──────────────────────────────────────┐
               |                                     |
               ├──< Course (AuthorCourses) >──< CourseTeacher >
               |         |
               |         ├──< Lesson >──< Test >──< Question >──< Answer >
               |         |         |          |
               |         |         └──< UserLesson >     └──< TestAttempt >──< TestAnswer >
               |         |
               |         └──< UserProgress >
               |
               ├──< TestAttempt >
               └──< UserLesson >
```

Ключевые особенности:
- Каскадное удаление реализовано **вручную через транзакции** (Prisma не поддерживает `onDelete: Cascade` для всех случаев без дополнительных настроек). Порядок удаления: `TestAnswer` → `TestAttempt` → `Answer` → `Question` → `Test` → `UserLesson` → `Lesson` → `CourseTeacher` → `UserProgress` → `Course`.
- Уникальные ограничения: `User.email`, `Role.name`, `UserLesson(userId, lessonId)`, `CourseTeacher(courseId, userId)`.

---

## Бизнес-процессы

### Жизненный цикл курса

```
Преподаватель создаёт курс
        ↓
   Статус: PENDING
        ↓
Администратор просматривает список PENDING-курсов
        ↓
   ┌────┴────┐
APPROVED  REJECTED
   ↓
Курс виден студентам
```

### Прохождение урока студентом

```
Студент открывает курс → выбирает урок → читает контент
        ↓
Нажимает "Отметить урок пройденным"
        ↓
POST /progress/complete-lesson (создаёт UserLesson)
        ↓
Пересчёт UserProgress:
  completedLessons = кол-во пройденных уроков в курсе
  progressPercent = round(completedLessons / totalLessons * 100)
```

### Сдача теста

```
Студент открывает тест → отвечает на все вопросы (radio-кнопки)
        ↓
POST /tests/:id/submit с массивом { questionId, answerId }
        ↓
Сервер проверяет каждый ответ по полю isCorrect
(поле isCorrect НИКОГДА не отправляется клиенту при GET /tests/:id)
        ↓
Сохраняет TestAttempt со score
        ↓
Возвращает { score, total }
```

### Управление преподавателями курса

Автор курса или администратор могут добавить другого пользователя с ролью `TEACHER` или `ADMIN` в качестве соавтора через `POST /courses/:id/teachers`. После добавления этот пользователь получает те же права на редактирование курса, что и автор (проверка через `canManageCourse`).

---

## Разработка и вклад в проект

### Линтинг

```bash
# Фронтенд
cd frontend && yarn lint

# Бэкенд — TypeScript строгий режим
cd backend && npx tsc --noEmit
```

### Сборка

```bash
# Бэкенд (компиляция TypeScript в dist/)
cd backend && yarn build

# Фронтенд (Vite build в dist/)
cd frontend && yarn build
```

### Добавление новой миграции

```bash
cd backend
npx prisma migrate dev --name <migration_name>
```

---

*Проект разработан как учебная LMS-платформа с полным стеком современных технологий веб-разработки.*
