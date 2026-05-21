# ER-диаграмма базы данных

Платформа взаимодействия заказчиков и исполнителей IT-проектов.
СУБД: PostgreSQL. ORM: Prisma.

```mermaid
erDiagram
    User ||--o{ Project       : "создаёт (customer)"
    User ||--o{ Project       : "выполняет (selectedContractor)"
    User ||--o{ Bid           : "отправляет"
    User ||--o{ UserSkill     : "владеет"
    User ||--o{ Review        : "пишет (author)"
    User ||--o{ Review        : "получает (target)"
    User ||--o{ Notification  : "получает"
    Category ||--o{ Project   : "классифицирует"
    Project ||--o{ Bid        : "имеет"
    Project ||--o{ Review     : "имеет"
    Skill ||--o{ UserSkill    : "входит в"

    User {
        uuid     id PK
        string   email UK
        string   passwordHash
        enum     role "CUSTOMER|CONTRACTOR|ADMIN"
        string   name
        string   about "nullable"
        boolean  isBlocked
        string   blockReason "nullable"
        datetime blockedUntil "nullable"
        datetime createdAt
        datetime updatedAt
    }

    Category {
        uuid     id PK
        string   name UK
        string   slug UK
        datetime createdAt
    }

    Project {
        uuid     id PK
        uuid     customerId FK
        uuid     categoryId FK "nullable"
        string   title
        string   description
        int      budgetMin "nullable"
        int      budgetMax "nullable"
        enum     status "OPEN|IN_WORK|DONE|CANCELED"
        uuid     selectedContractorId FK "nullable"
        datetime createdAt
        datetime updatedAt
    }

    Bid {
        uuid     id PK
        uuid     projectId FK
        uuid     contractorId FK
        int      price
        int      durationDays
        string   coverLetter
        enum     status "PENDING|ACCEPTED|REJECTED"
        datetime createdAt
        datetime updatedAt
    }

    Skill {
        uuid     id PK
        string   name UK
        datetime createdAt
    }

    UserSkill {
        uuid userId PK,FK
        uuid skillId PK,FK
    }

    Review {
        uuid     id PK
        uuid     projectId FK
        uuid     authorId FK
        uuid     targetId FK
        int      rating "1..5"
        string   comment
        datetime createdAt
    }

    Notification {
        uuid     id PK
        uuid     userId FK
        enum     type "BID_RECEIVED|BID_ACCEPTED|BID_REJECTED|PROJECT_COMPLETED|REVIEW_RECEIVED"
        string   title
        string   message
        string   link "nullable"
        boolean  isRead
        datetime createdAt
    }
```

## Описание связей

| Связь | Тип | Описание |
|-------|-----|----------|
| User → Project (customer) | 1:N | Заказчик создаёт проекты |
| User → Project (selectedContractor) | 1:N | Исполнитель назначается на проект |
| User → Bid | 1:N | Исполнитель отправляет отклики |
| Category → Project | 1:N | Категория классифицирует проекты |
| Project → Bid | 1:N | На проект приходят отклики |
| User ↔ Skill (через UserSkill) | M:N | Навыки пользователя |
| Project → Review | 1:N | Отзывы по проекту |
| User → Review (author/target) | 1:N | Автор и получатель отзыва |
| User → Notification | 1:N | Уведомления пользователя |
