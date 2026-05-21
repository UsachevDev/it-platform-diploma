# Архитектура приложения

Платформа построена как монорепозиторий из двух приложений: клиентского
(Next.js) и серверного (NestJS), которые работают с общей базой PostgreSQL.

## Схема взаимодействия

```mermaid
flowchart TD
    subgraph Client["Клиент — браузер"]
        UI["Next.js (App Router)\nReact, TypeScript, TailwindCSS"]
        RQ["TanStack Query\nкэш серверных данных"]
        AuthCtx["AuthProvider\nJWT в localStorage"]
        UI --- RQ
        UI --- AuthCtx
    end

    subgraph Server["Сервер — NestJS API"]
        Guards["JwtAuthGuard + RolesGuard\nпроверка токена и ролей"]
        Modules["Модули: Auth, Users, Projects,\nBids, Reviews, Notifications,\nCategories, Skills, Admin"]
        Prisma["PrismaService\nтипобезопасный доступ к БД"]
        Swagger["Swagger / OpenAPI\n/api/docs"]
        Guards --> Modules
        Modules --> Prisma
        Modules --- Swagger
    end

    subgraph Data["Данные"]
        DB[("PostgreSQL 15\n8 таблиц")]
    end

    Client -- "HTTP / REST + JWT" --> Guards
    Prisma -- "SQL" --> DB

    subgraph Infra["Инфраструктура"]
        Docker["Docker Compose:\nPostgreSQL + pgAdmin"]
    end
    Docker -.-> DB
```

## Слои

**Клиент (`apps/web`)**
- App Router Next.js: публичные страницы (`/`, `/login`, `/register`) и
  защищённая группа `(protected)`.
- `AuthProvider` хранит состояние авторизации, токен — в `localStorage`.
- TanStack Query кэширует серверные данные, делает инвалидацию после мутаций.
- `apiClient` (axios) добавляет `Authorization: Bearer` и перехватывает `401`.

**Сервер (`apps/api`)**
- Модульная структура NestJS: каждый домен — отдельный модуль
  (контроллер + сервис + DTO + entity для Swagger).
- Аутентификация — JWT-стратегия Passport; авторизация по ролям —
  декоратор `@Roles()` + `RolesGuard`.
- `PrismaService` инкапсулирует доступ к БД; глобальный фильтр исключений
  приводит ошибки к единому формату.
- Документация API генерируется через Swagger.

**База данных**
- PostgreSQL 15, схема и миграции управляются Prisma.
- 8 таблиц (см. [ER-диаграмму](./er-diagram.md)).

**Инфраструктура**
- Docker Compose поднимает PostgreSQL и pgAdmin.
