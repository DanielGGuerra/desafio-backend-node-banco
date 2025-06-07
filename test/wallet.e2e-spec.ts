import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { App } from 'supertest/types';
import { configureApp } from '../src/main';
import { AppModule } from '../src/app.module';

import * as request from 'supertest';
import { UsersService } from '../src/users/users.service';
import { postgresContainer } from './setup.e2e';
import { PrismaService } from 'nestjs-prisma';
import { User } from '@prisma/client';
import { AuthService } from '../src/auth/auth.service';

const usersMapMock = new Map<
  string,
  {
    user: User;
    token: string;
  }
>();

describe('(E2E) Wallet', () => {
  let app: INestApplication<App>;
  let usersService: UsersService;
  let prismaService: PrismaService;
  let authService: AuthService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    prismaService = moduleFixture.get(PrismaService);
    usersService = moduleFixture.get(UsersService);
    authService = moduleFixture.get(AuthService);

    app = moduleFixture.createNestApplication();

    configureApp(app);

    await app.init();
  });

  beforeEach(async () => {
    await prismaService.user.deleteMany();
    await prismaService.transaction.deleteMany();

    const users = await Promise.all([
      usersService.create({
        name: 'user 1',
        email: 'user1@example.com',
        password: 'password1',
      }),

      usersService.create({
        name: 'user 2',
        email: 'user2@example.com',
        password: 'password2',
      }),
      usersService.create({
        name: 'user 3',
        email: 'user3@example.com',
        password: 'password3',
      }),
    ]);

    const tokens = await Promise.all([
      authService.generateToken(users[0]),
      authService.generateToken(users[1]),
      authService.generateToken(users[2]),
    ]);

    usersMapMock.set('user1', {
      user: users[0],
      token: tokens[0],
    });
    usersMapMock.set('user2', {
      user: users[1],
      token: tokens[1],
    });
    usersMapMock.set('user3', {
      user: users[2],
      token: tokens[2],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(usersService).toBeDefined();
    expect(authService).toBeDefined();
    expect(postgresContainer).toBeDefined();
  });

  it('POST /wallet/deposit', () => {
    return request(app.getHttpServer())
      .post('/wallet/deposit')
      .set('Authorization', `Bearer ${usersMapMock.get('user1')?.token}`)
      .send({
        amount: 100,
      })
      .expect((res) => {
        expect(res.statusCode).toBe(201);
        expect(res.body.type).toBe('deposit');
        expect(res.body.status).toBe('completed');
        expect(res.body.amount).toBe('100.00');
        expect(res.body.balanceBefore).toBe('0.00');
        expect(res.body.balanceAfter).toBe('100.00');
        expect(res.body.createdAt).toBeDefined();
        expect(res.body.updatedAt).toBeDefined();
      });
  });

  it('POST /wallet/transfer', async () => {
    await request(app.getHttpServer())
      .post('/wallet/deposit')
      .set('Authorization', `Bearer ${usersMapMock.get('user1')?.token}`)
      .send({
        amount: 100,
      });

    return request(app.getHttpServer())
      .post('/wallet/transfer')
      .set('Authorization', `Bearer ${usersMapMock.get('user1')?.token}`)
      .send({
        payeeId: usersMapMock.get('user2')?.user.id,
        amount: 100,
      })
      .expect((res) => {
        expect(res.statusCode).toBe(201);
        expect(res.body.type).toBe('transfer');
        expect(res.body.status).toBe('completed');
        expect(res.body.amount).toBe('100.00');
        expect(res.body.balanceBefore).toBe('100.00');
        expect(res.body.balanceAfter).toBe('0.00');
        expect(res.body.createdAt).toBeDefined();
        expect(res.body.updatedAt).toBeDefined();
      });
  });

  it('POST /wallet/transactions/:id/chargeback', async () => {
    await request(app.getHttpServer())
      .post('/wallet/deposit')
      .set('Authorization', `Bearer ${usersMapMock.get('user1')?.token}`)
      .send({
        amount: 100,
      });

    const transferTransaction = await request(app.getHttpServer())
      .post('/wallet/transfer')
      .set('Authorization', `Bearer ${usersMapMock.get('user1')?.token}`)
      .send({
        payeeId: usersMapMock.get('user2')?.user.id,
        amount: 100,
      });

    return request(app.getHttpServer())
      .post(`/wallet/transactions/${transferTransaction.body.id}/chargeback`)
      .set('Authorization', `Bearer ${usersMapMock.get('user1')?.token}`)
      .expect((res) => {
        console.log(res.body);
        expect(res.statusCode).toBe(201);
        expect(res.body.type).toBe('chargeback');
        expect(res.body.status).toBe('completed');
        expect(res.body.amount).toBe('100.00');
        expect(res.body.balanceBefore).toBe('100.00');
        expect(res.body.balanceAfter).toBe('0.00');
        expect(res.body.createdAt).toBeDefined();
        expect(res.body.updatedAt).toBeDefined();
      });
  });

  it('should throw insufficient balance error if user has no balance when transfer', () => {
    return request(app.getHttpServer())
      .post('/wallet/transfer')
      .set('Authorization', `Bearer ${usersMapMock.get('user1')?.token}`)
      .send({
        payeeId: usersMapMock.get('user2')?.user.id,
        amount: 100,
      })
      .expect((res) => {
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe('Insufficient balance');
      });
  });

  it('should throw insufficient balance error if user payee has no balance when chargeback', async () => {
    // user 1 deposit 100
    await request(app.getHttpServer())
      .post('/wallet/deposit')
      .set('Authorization', `Bearer ${usersMapMock.get('user1')?.token}`)
      .send({
        amount: 100,
      });

    // user 1 transfer 100 to user 2
    const user1TransferTransaction = await request(app.getHttpServer())
      .post('/wallet/transfer')
      .set('Authorization', `Bearer ${usersMapMock.get('user1')?.token}`)
      .send({
        payeeId: usersMapMock.get('user2')?.user.id,
        amount: 100,
      });

    // user 2 transfer 100 to user 3
    await request(app.getHttpServer())
      .post('/wallet/transfer')
      .set('Authorization', `Bearer ${usersMapMock.get('user2')?.token}`)
      .send({
        payeeId: usersMapMock.get('user3')?.user.id,
        amount: 100,
      });

    // user 1 request chargeback
    return request(app.getHttpServer())
      .post(
        `/wallet/transactions/${user1TransferTransaction.body.id}/chargeback`,
      )
      .set('Authorization', `Bearer ${usersMapMock.get('user1')?.token}`)
      .expect((res) => {
        console.log(res.body);
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe('Payee has insufficient balance');
      });
  });
});
