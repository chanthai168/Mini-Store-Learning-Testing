import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('ProductController (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Enable global pipes (vital for testing ParseUUIDPipe and ParseIntPipe behavior)
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.init();
    prisma = app.get(PrismaService);
  });

  // Reset database state before each test suite
  beforeEach(async () => {
    await prisma.cartItem.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.inventory.deleteMany();
    await prisma.product.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('POST /products', () => {
    it('should create a new product (201 Created)', async () => {
      const response = await request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Excalibur', price: 500 })
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Excalibur');
      expect(response.body.price).toBe(500);
    });

    it('should throw bad request exception', async () => {
      const response = await request(app.getHttpServer())
        .post('/products')
        .send({price:'123'})
        .expect(HttpStatus.BAD_REQUEST);
    })

    it('should return 409 Conflict if product name already exists', async () => {
      await request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Excalibur', price: 500 });

      await request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Excalibur', price: 500 })
        .expect(HttpStatus.CONFLICT);
    });
  });

  describe('GET /products', () => {
    it('should retrieve products with pagination and default pipes', async () => {
      await prisma.product.create({ data: { name: 'Item 1', price: 10 } });
      await prisma.product.create({ data: { name: 'Item 2', price: 20 } });

      const response = await request(app.getHttpServer())
        .get('/products?page=1&limit=10')
        .expect(HttpStatus.OK);

      expect(response.body.products.length).toBe(2);
      expect(response.body.total).toBe(2);
    });
  });

  describe('GET /products/:id', () => {
    it('should return 400 Bad Request if ID is not a valid UUID', async () => {
      await request(app.getHttpServer())
        .get('/products/invalid-uuid-123')
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 404 Not Found if UUID does not exist', async () => {
      await request(app.getHttpServer())
        .get('/products/00000000-0000-0000-0000-000000000000')
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 200 OK with product details', async () => {
      const product = await prisma.product.create({
        data: { name: 'Dragon Shield', price: 150 },
      });

      const response = await request(app.getHttpServer())
        .get(`/products/${product.id}`)
        .expect(HttpStatus.OK);

      expect(response.body.id).toBe(product.id);
      expect(response.body.name).toBe('Dragon Shield');
    });
  });

  describe('PATCH /products/:id', () => {
    it('should update product details (200 OK)', async () => {
      const product = await prisma.product.create({
        data: { name: 'Wooden Staff', price: 15 },
      });

      const response = await request(app.getHttpServer())
        .patch(`/products/${product.id}`)
        .send({ price: 25 })
        .expect(HttpStatus.OK);

      expect(response.body.price).toBe(25);
    });
  });

  describe('PATCH /products/:id/inventory', () => {
    it('should update product inventory quantity', async () => {
      const product = await prisma.product.create({
        data: { name: 'Healing Salve', price: 5 },
      });

      const response = await request(app.getHttpServer())
        .patch(`/products/${product.id}/inventory`)
        .send({ quantity: 50 })
        .expect(HttpStatus.OK);

      expect(response.body.quantity).toBe(50);
    });
  });

  describe('DELETE /products/:id', () => {
    it('should delete a product (200 OK)', async () => {
      const product = await prisma.product.create({
        data: { name: 'Old Boot', price: 1 },
      });

      await request(app.getHttpServer())
        .delete(`/products/${product.id}`)
        .expect(HttpStatus.OK);

      // Verify DB removal
      const check = await prisma.product.findUnique({ where: { id: product.id } });
      expect(check).toBeNull();
    });
  });
});