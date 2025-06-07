import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { App } from 'supertest/types';
import { configureApp } from '../src/main';
import { AppModule } from '../src/app.module';

import * as request from 'supertest';
import { UsersService } from '../src/users/users.service';
import { postgresContainer } from './setup.e2e';
import { PrismaService } from 'nestjs-prisma';

describe('(E2E) Auth', () => {
  let app: INestApplication<App>;
  let usersService: UsersService;
  let prismaService: PrismaService;

  const userPayloadRegisterMock = {
    name: 'daniel guerra',
    email: 'ola@danielgguerra.dev',
    password: 'Ola!Daniel543',
  };

  const userLoginPayloadMock = {
    email: userPayloadRegisterMock.email,
    password: userPayloadRegisterMock.password,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    prismaService = moduleFixture.get(PrismaService);
    usersService = moduleFixture.get(UsersService);

    app = moduleFixture.createNestApplication();

    configureApp(app);

    await app.init();
  });

  beforeEach(async () => {
    await prismaService.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(usersService).toBeDefined();
    expect(postgresContainer).toBeDefined();
  });

  it('POST /auth/register', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send(userPayloadRegisterMock)
      .expect((res) => {
        expect(res.statusCode).toBe(201);
        expect(res.body.id).toBeDefined();
        expect(res.body.email).toBe(userPayloadRegisterMock.email);
        expect(res.body.name).toBe(userPayloadRegisterMock.name);
        expect(res.body.password).toBeUndefined();
      });
  });

  it('POST /auth/login', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(userPayloadRegisterMock);

    return request(app.getHttpServer())
      .post('/auth/login')
      .send(userLoginPayloadMock)
      .expect((res) => {
        expect(res.statusCode).toBe(201);
        expect(res.body.token).toBeDefined();
      });
  });

  it('GET /auth/me', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(userPayloadRegisterMock);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send(userLoginPayloadMock);

    return request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${loginResponse.body.token}`)
      .expect((res) => {
        expect(res.statusCode).toBe(200);
        expect(res.body.id).toBeDefined();
        expect(res.body.email).toBe(userPayloadRegisterMock.email);
        expect(res.body.name).toBe(userPayloadRegisterMock.name);
        expect(res.body.balance).toBe('0');
      });
  });
});
