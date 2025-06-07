import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('MAIN');

  configureApp(app);

  const configService = app.get(ConfigService);

  const PORT =
    process.env.NODE_ENV === 'test' ? 0 : configService.getOrThrow('PORT');

  await app.listen(PORT, () => logger.log(`Server is running on port ${PORT}`));
}

export function configureApp(app: INestApplication) {
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
}

bootstrap();
