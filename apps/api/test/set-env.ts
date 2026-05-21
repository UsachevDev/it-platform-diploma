process.env.DATABASE_URL =
  process.env.DATABASE_URL_TEST ??
  'postgresql://diploma:diploma@127.0.0.1:5433/diploma_test?schema=public';

process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';
