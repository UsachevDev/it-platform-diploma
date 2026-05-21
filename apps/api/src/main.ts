import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  app.enableCors({
    origin: true,
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('IT Platform API')
    .setDescription(
      [
        'REST API платформы для взаимодействия заказчиков и исполнителей IT-проектов.',
        '',
        '## Роли',
        '- **CUSTOMER** — заказчик: создаёт проекты, выбирает исполнителей.',
        '- **CONTRACTOR** — исполнитель: отправляет отклики на проекты.',
        '- **ADMIN** — администратор: модерация пользователей, проектов и откликов.',
        '',
        '## Авторизация',
        'Большинство эндпоинтов требуют JWT. Получите токен через `POST /auth/login` ' +
          'или `POST /auth/register`, затем нажмите **Authorize** и вставьте токен.',
        '',
        '## Жизненный цикл проекта',
        '`OPEN` → (принят отклик) → `IN_WORK` → (завершён) → `DONE`. ' +
          'Из `OPEN` проект также может быть переведён в `CANCELED`.',
      ].join('\n'),
    )
    .setVersion('1.0')
    .setContact(
      'IT Platform',
      'https://github.com/UsachevDev/it-platform-diploma',
      '',
    )
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Вставьте JWT, полученный при логине или регистрации',
    })
    .addTag('Auth', 'Регистрация, вход и получение текущего пользователя')
    .addTag('Users', 'Профиль пользователя: просмотр и редактирование')
    .addTag('Projects', 'Проекты: создание, список, смена статусов')
    .addTag('Bids', 'Отклики исполнителей на проекты')
    .addTag('Admin', 'Администрирование: пользователи, модерация, статистика')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'IT Platform API — документация',
  });

  const port = 3000;

  await app.listen(port);

  console.log(`API: http://localhost:${port}`);
  console.log(`Swagger: http://localhost:${port}/api/docs`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
