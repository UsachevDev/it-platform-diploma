# IT Platform — дипломный проект

Веб-платформа для взаимодействия заказчиков и исполнителей IT-проектов. Заказчик публикует проект, исполнители отправляют отклики, заказчик выбирает подходящего исполнителя — проект переходит в работу и затем завершается.

Проект разработан в рамках выпускной квалификационной работы и реализует полный MVP: серверную часть с REST API и документацией, клиентское приложение с разделением по ролям, базу данных и набор сценариев пользовательского взаимодействия.

---

## Содержание

- [Возможности](#возможности)
- [Технологический стек](#технологический-стек)
- [Архитектура](#архитектура)
- [Структура репозитория](#структура-репозитория)
- [Модель данных](#модель-данных)
- [Быстрый старт](#быстрый-старт)
- [Переменные окружения](#переменные-окружения)
- [Скрипты](#скрипты)
- [API и документация](#api-и-документация)
- [Тестирование](#тестирование)
- [Сценарий демонстрации](#сценарий-демонстрации)
- [Документация проекта](#документация-проекта)
- [Git Workflow](#git-workflow)

---

## Возможности

**Аутентификация и роли**

- Регистрация и вход по email и паролю, JWT-аутентификация
- Три роли: заказчик (CUSTOMER), исполнитель (CONTRACTOR), администратор (ADMIN)
- Защита маршрутов через `JwtAuthGuard` и разграничение доступа через `RolesGuard`
- Блокировка аккаунтов с причиной и сроком, авто-разблокировка по истечении

**Профиль пользователя**

- Просмотр и редактирование профиля: имя, «о себе», навыки
- Смена email (с подтверждением паролем) и смена пароля
- Индикатор надёжности пароля и заполненности профиля
- Личная статистика, рейтинг и отзывы

**Проекты**

- Создание проекта заказчиком с выбором категории и бюджета
- Каталог с фильтрами (статус, категория, поиск), сортировкой и пагинацией
- Режимы просмотра: «Все / Мои / Я откликнулся»
- Детальная страница, отмена и завершение проекта владельцем
- Статусная модель: `OPEN → IN_WORK → DONE` / `CANCELED`

**Отклики**

- Отправка, редактирование и удаление отклика исполнителем
- Запрет повторного и собственного отклика, отклик только на `OPEN`
- Просмотр, принятие и отклонение откликов владельцем проекта
- Принятие отклика как Prisma-транзакция: фиксация исполнителя, перевод проекта в `IN_WORK`
- Страница «Мои отклики»

**Отзывы, категории, навыки**

- Взаимные отзывы и оценки по завершённым проектам, средний рейтинг
- Справочник категорий проектов и фильтрация по ним
- Нормализованные навыки (`Skill` / `UserSkill`) с автоподсказками

**Уведомления**

- Уведомления о событиях (отклик, принятие, завершение, отзыв)
- Значок в шапке со счётчиком непрочитанных, авто-обновление

**Администрирование**

- Панель администратора со статистикой платформы
- Управление пользователями (блокировка, смена роли, удаление)
- Модерация проектов и откликов

Подробная сводка — в [docs/what-implemented.md](docs/what-implemented.md).

---

## Технологический стек

**Backend**

- [NestJS](https://nestjs.com/) — модульный фреймворк для Node.js
- [Prisma ORM](https://www.prisma.io/) — типобезопасный доступ к БД
- [PostgreSQL 15](https://www.postgresql.org/) — реляционная СУБД
- JWT-аутентификация (`@nestjs/jwt`, `passport-jwt`)
- [Swagger / OpenAPI](https://swagger.io/) — документация API
- Jest — unit и e2e тестирование

**Frontend**

- [Next.js](https://nextjs.org/) (App Router)
- TypeScript
- [TailwindCSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) — компонентная библиотека
- [TanStack Query](https://tanstack.com/query) — работа с серверным состоянием
- [lucide-react](https://lucide.dev/) — иконки
- [sonner](https://sonner.emilkowal.ski/) — toast-уведомления

**Инфраструктура**

- Docker Compose — PostgreSQL и pgAdmin
- ESLint + Prettier
- Conventional Commits

---

## Архитектура

Проект организован как монорепозиторий с двумя приложениями:

```
apps/
  api/   — серверная часть (NestJS + Prisma)
  web/   — клиентская часть (Next.js)
```

Серверная часть построена по модульному принципу. Каждый функциональный блок (`Auth`, `Users`, `Projects`, `Bids`, `Reviews`, `Notifications`, `Categories`, `Skills`, `Admin`) оформлен как отдельный Nest-модуль с собственным контроллером, сервисом, DTO и entity-классами для Swagger. Доступ к базе данных инкапсулирован в `PrismaService`. Аутентификация реализована через стратегию JWT, авторизация по ролям — через декоратор `@Roles()` и `RolesGuard`. Глобальный фильтр исключений приводит ошибки к единому формату.

Клиентская часть использует App Router Next.js. Состояние авторизации хранится в `AuthProvider`, серверные данные — в кэше TanStack Query. Защищённые маршруты обёрнуты в `ProtectedLayout`. UI собирается из переиспользуемых компонентов (`AppShell`, `StatusBadge`, `EmptyState`, `Skeleton`, `ConfirmDialog`).

Подробная схема — в [docs/architecture.md](docs/architecture.md).

---

## Структура репозитория

```
.
├── apps/
│   ├── api/                  # NestJS приложение
│   │   ├── src/
│   │   │   ├── auth/         # регистрация, логин, JWT
│   │   │   ├── users/        # профили пользователей
│   │   │   ├── projects/     # CRUD проектов и статусы
│   │   │   ├── bids/         # отклики и их принятие
│   │   │   ├── reviews/      # отзывы и рейтинг
│   │   │   ├── notifications/# уведомления
│   │   │   ├── categories/   # категории проектов
│   │   │   ├── skills/       # справочник навыков
│   │   │   ├── admin/        # администрирование
│   │   │   ├── prisma/       # Prisma-сервис и модуль
│   │   │   ├── common/       # фильтры, DTO, утилиты
│   │   │   └── main.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   └── test/             # e2e тесты
│   └── web/                  # Next.js приложение
│       └── src/
│           ├── app/          # маршруты App Router
│           ├── components/   # UI-компоненты и shadcn/ui
│           ├── lib/          # api-клиент, auth, утилиты
│           └── providers/    # AuthProvider, QueryProvider
├── docker-compose.yml
├── package.json              # корневой workspace
└── README.md
```

---

## Модель данных

Восемь сущностей:

- **User** — пользователь системы: роль (`CUSTOMER`, `CONTRACTOR`, `ADMIN`), email, хеш пароля, имя, описание, статус блокировки.
- **Project** — проект заказчика: владелец (`customerId`), выбранный исполнитель (`selectedContractorId`), категория, бюджет (диапазон `min`/`max`), статус (`OPEN`, `IN_WORK`, `DONE`, `CANCELED`).
- **Bid** — отклик исполнителя: цена, срок, сопроводительное письмо, статус (`PENDING`, `ACCEPTED`, `REJECTED`). Уникальная пара `(projectId, contractorId)`.
- **Category** — категория проектов.
- **Skill** — справочник навыков.
- **UserSkill** — связь «пользователь ↔ навык» (многие-ко-многим).
- **Review** — отзыв по завершённому проекту: автор, получатель, оценка 1–5, комментарий.
- **Notification** — уведомление пользователя о событии платформы.

Полная схема — в [`apps/api/prisma/schema.prisma`](apps/api/prisma/schema.prisma).
ER-диаграмма — в [docs/er-diagram.md](docs/er-diagram.md).

---

## Быстрый старт

### Требования

- Node.js 20+
- npm 10+
- Docker и Docker Compose

### Шаги

1. **Клонировать репозиторий и установить зависимости**

   ```bash
   git clone <repo-url>
   cd it-platform-diploma
   npm install
   npm --prefix apps/api install
   npm --prefix apps/web install
   ```

2. **Создать файлы окружения**

   В корне `apps/api/` создать файл `.env` на основе `.env.example` (см. раздел [Переменные окружения](#переменные-окружения)).

3. **Поднять базу данных**

   ```bash
   npm run db:up
   ```

   PostgreSQL будет доступен на порту `5433`, pgAdmin — на `http://localhost:5050` (логин `admin@admin.com`, пароль `admin`).

4. **Применить миграции и засеять демо-данные**

   ```bash
   npm --prefix apps/api run prisma:migrate
   npm run seed:demo
   ```

   Демо-аккаунты (пароль `Password123!`): `admin@example.com`,
   `customer@example.com`, `contractor1@example.com`, `contractor2@example.com`.

5. **Запустить backend**

   ```bash
   npm run dev:api
   ```

   API будет доступен на `http://localhost:3000`, Swagger — на `http://localhost:3000/api/docs`.

6. **Запустить frontend**

   В отдельном терминале:

   ```bash
   npm --prefix apps/web run dev
   ```

   Веб-приложение откроется на `http://localhost:3001`.

---

## Переменные окружения

### `apps/api/.env`

| Переменная     | Описание                         | Пример                                                                 |
| -------------- | -------------------------------- | ---------------------------------------------------------------------- |
| `DATABASE_URL` | Строка подключения к PostgreSQL  | `postgresql://diploma:diploma@localhost:5433/diploma_db?schema=public` |
| `JWT_SECRET`   | Секрет для подписи JWT-токенов   | `super-secret-change-me`                                               |
| `PORT`         | Порт, на котором запускается API | `3000`                                                                 |

### `apps/web/.env.local`

| Переменная            | Описание        | Пример                  |
| --------------------- | --------------- | ----------------------- |
| `NEXT_PUBLIC_API_URL` | Базовый URL API | `http://localhost:3000` |

---

## Скрипты

Корневой `package.json` предоставляет команды для управления инфраструктурой и серверной частью:

| Команда              | Действие                                         |
| -------------------- | ------------------------------------------------ |
| `npm run db:up`      | Поднять PostgreSQL и pgAdmin                     |
| `npm run db:down`    | Остановить контейнеры                            |
| `npm run db:reset`   | Полный сброс БД (удаление volume и пересоздание) |
| `npm run dev:api`    | Запустить API в режиме разработки                |
| `npm run build:api`  | Собрать API                                      |
| `npm run lint:api`   | Линтер API                                       |
| `npm run format:api` | Prettier для API                                 |
| `npm run seed:demo`  | Заполнить БД демо-данными                        |

Внутри `apps/api`:

| Команда                  | Действие                  |
| ------------------------ | ------------------------- |
| `npm run start:dev`      | Запуск API с hot reload   |
| `npm run prisma:migrate` | Применить миграции        |
| `npm run prisma:generate`| Сгенерировать Prisma Client |
| `npm run prisma:studio`  | Открыть Prisma Studio     |
| `npm run seed:demo`      | Заполнить БД демо-данными |
| `npm run test`           | Unit-тесты                |
| `npm run test:e2e`       | E2E-тесты                 |

Внутри `apps/web`:

| Команда         | Действие                    |
| --------------- | --------------------------- |
| `npm run dev`   | Запуск Next.js в dev-режиме |
| `npm run build` | Сборка production-версии    |
| `npm run start` | Запуск собранной версии     |
| `npm run lint`  | Линтер                      |

---

## API и документация

После запуска API доступны:

- **Swagger UI** — `http://localhost:3000/api/docs`
- **OpenAPI JSON** — `http://localhost:3000/api/docs-json`

Основные группы маршрутов:

- `POST /auth/register`, `POST /auth/login`, `GET /auth/me` — аутентификация
- `GET /users/me`, `PATCH /users/me`, `PATCH /users/me/email`, `PATCH /users/me/password`, `GET /users/:id` — профиль
- `GET /projects`, `POST /projects`, `GET /projects/:id`, `PATCH /projects/:id` — проекты
- `POST /projects/:id/cancel`, `POST /projects/:id/done` — смена статуса
- `POST /projects/:id/bids`, `GET /projects/:id/bids`, `PATCH /bids/:id`, `DELETE /bids/:id` — отклики
- `POST /bids/:id/accept`, `POST /bids/:id/reject` — решение по отклику
- `GET /bids/my` — мои отклики
- `GET /categories`, `GET /skills` — справочники
- `POST /projects/:id/reviews`, `GET /projects/:id/reviews`, `GET /users/:id/reviews` — отзывы
- `GET /notifications`, `POST /notifications/:id/read`, `POST /notifications/read-all` — уведомления
- `GET /admin/stats`, `GET /admin/users`, `POST /admin/users/:id/block` … — администрирование

Все защищённые маршруты требуют заголовок `Authorization: Bearer <token>`.

---

## Тестирование

Проект покрыт unit- и e2e-тестами на Jest.

**Unit-тесты** проверяют ключевую бизнес-логику: правила принятия отклика, запрет повторной подачи заявки, корректность смены статусов проекта.

**E2E-тесты** воспроизводят сквозной сценарий MVP: регистрация заказчика и исполнителя, создание проекта, отклик, принятие отклика, перевод проекта в `IN_WORK` и завершение.

Запуск:

```bash
# unit
npm --prefix apps/api run test

# e2e
npm --prefix apps/api run test:e2e
```

---

## Сценарий демонстрации

Полный путь, который реализует MVP:

1. Заказчик регистрируется и входит в систему
2. Заказчик создаёт проект — проект получает статус `OPEN`
3. Исполнитель регистрируется и входит
4. Исполнитель находит проект в списке и отправляет отклик
5. Заказчик открывает свой проект и видит список откликов
6. Заказчик принимает один из откликов — проект переходит в `IN_WORK`, исполнитель фиксируется в `selectedContractorId`
7. После завершения работы заказчик переводит проект в `DONE`

Демо-пользователи создаются через `npm run seed:demo`. Полный пошаговый
сценарий — в [docs/demo-scenario.md](docs/demo-scenario.md).

---

## Документация проекта

Дополнительная документация — в каталоге [`docs/`](docs/):

| Файл | Содержание |
|------|-----------|
| [docs/er-diagram.md](docs/er-diagram.md) | ER-диаграмма базы данных (8 таблиц) |
| [docs/architecture.md](docs/architecture.md) | Диаграмма архитектуры приложения |
| [docs/demo-scenario.md](docs/demo-scenario.md) | Пошаговый сценарий демонстрации |
| [docs/what-implemented.md](docs/what-implemented.md) | Сводка реализованной функциональности |

---

## Git Workflow

**Основные ветки**

- `main` — стабильная демонстрационная версия
- `develop` — основная ветка разработки

**Feature-ветки**

Создаются от `develop` по схеме:

```
feature/epic-3-auth
feature/epic-5-projects
feature/epic-6-bids
...
```

**Коммиты** следуют [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — новая функциональность
- `fix:` — исправление ошибки
- `refactor:` — рефакторинг без изменения поведения
- `chore:` — служебные изменения
- `docs:` — изменения в документации
- `test:` — добавление или правка тестов

---

## Лицензия

См. файл [LICENSE](LICENSE).
