import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ProductService } from './product.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ConfigModule } from '@nestjs/config';


describe('ProductService Integration (Real DB)', () => {
  let service: ProductService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
    imports: [ConfigModule.forRoot({ isGlobal: true })],
    providers: [ProductService, PrismaService],
    }).compile();

    service = module.get<ProductService>(ProductService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  // Clean the database before every test to guarantee test isolation
  beforeEach(async () => {
    await prisma.cartItem.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.inventory.deleteMany();
    await prisma.product.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('createProduct', () => {
    it('should insert a product and auto-create an inventory record with quantity 0', async () => {
      const dto = { name: 'Health Potion', price: 25, imageURL: 'http://img.com/potion.png' };

      const created = await service.createProduct(dto);

      expect(created.id).toBeDefined();
      expect(created.name).toBe('Health Potion');

      // Verify DB persistence
      const dbProduct = await prisma.product.findUnique({
        where: { id: created.id },
        include: { inventory: true },
      });

      expect(dbProduct).not.toBeNull();
      expect(dbProduct?.inventory?.quantity).toBe(0);
    });

    it('should throw ConflictException when creating a duplicate product name', async () => {
      await service.createProduct({ name: 'Mana Potion', price: 30 });

      await expect(
        service.createProduct({ name: 'Mana Potion', price: 30 }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getAllProducts', () => {
    it('should correctly filter by price range and apply pagination', async () => {
      await service.createProduct({ name: 'Cheap Wand', price: 10 });
      await service.createProduct({ name: 'Mid Wand', price: 50 });
      await service.createProduct({ name: 'Epic Wand', price: 200 });

      const result = await service.getAllProducts(1, 10, 20, 100);

      expect(result.total).toBe(1);
      expect(result.products.length).toBe(1);
      expect(result.products[0].name).toBe('Mid Wand');
    });
  });

  describe('updateProduct', () => {
    it('should update product fields in the DB', async () => {
      const product = await service.createProduct({ name: 'Iron Sword', price: 100 });

      const updated = await service.updateProduct(product.id, {
        name: 'Steel Sword',
        price: 150,
      });

      expect(updated.name).toBe('Steel Sword');

      const dbProduct = await prisma.product.findUnique({ where: { id: product.id } });
      expect(dbProduct?.price).toBe(150);
    });

    it('should throw ConflictException if updated name collides with another product', async () => {
      const prodA = await service.createProduct({ name: 'Shield A', price: 50 });
      const prodB = await service.createProduct({ name: 'Shield B', price: 60 });

      await expect(
        service.updateProduct(prodB.id, { name: 'Shield A' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('deleteProduct', () => {
    it('should delete product and cascade-delete inventory', async () => {
      const product = await service.createProduct({ name: 'Disposable Ring', price: 5 });

      await service.deleteProduct(product.id);

      const dbProduct = await prisma.product.findUnique({ where: { id: product.id } });
      const dbInventory = await prisma.inventory.findUnique({
        where: { productId: product.id },
      });

      expect(dbProduct).toBeNull();
      expect(dbInventory).toBeNull();
    });
  });

  describe('updateProductInventory', () => {
    it('should upsert inventory quantity for a product', async () => {
      const product = await service.createProduct({ name: 'Bow', price: 80 });

      const updatedInventory = await service.updateProductInventory(product.id, 42);

      expect(updatedInventory.quantity).toBe(42);

      const dbInventory = await prisma.inventory.findUnique({
        where: { productId: product.id },
      });
      expect(dbInventory?.quantity).toBe(42);
    });

    it('should throw NotFoundException if product does not exist', async () => {
      await expect(
        service.updateProductInventory('00000000-0000-0000-0000-000000000000', 10),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getLowInventoryProducts', () => {
    it('should fetch products whose inventory is below the threshold', async () => {
      const prodA = await service.createProduct({ name: 'Rare Scroll', price: 500 });
      const prodB = await service.createProduct({ name: 'Common Scroll', price: 10 });

      await service.updateProductInventory(prodA.id, 2);
      await service.updateProductInventory(prodB.id, 50);

      const lowStock = await service.getLowInventoryProducts(10);

      expect(lowStock.length).toBe(1);
      expect(lowStock[0].id).toBe(prodA.id);
    });
  });
});