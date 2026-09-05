import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ProductService } from './product.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

describe('ProductService', () => {
  let service: ProductService;
  let prisma: {
    product: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      count: jest.Mock;
    };
    inventory: {
      upsert: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    // Create a mock Prisma object
    const mockPrisma:any = {
      product: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      inventory: {
        upsert: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(mockPrisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    prisma = module.get(PrismaService);
  });

  describe('createProduct', () => {
    it('should create a new product successfully', async () => {
      const dto = { name: 'Sword', price: 100, imageURL: 'http://example.com/sword.jpg' };
      const createdProduct = { id: 'uuid-1', ...dto, inventory: { id: 'inv-1', quantity: 0 } };

      prisma.product.findFirst.mockResolvedValue(null);
      prisma.product.create.mockResolvedValue(createdProduct);

      const result = await service.createProduct(dto);

      expect(prisma.product.findFirst).toHaveBeenCalledWith({ where: { name: dto.name } });
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: {
          name: dto.name,
          imageURL: dto.imageURL,
          price: dto.price,
          inventory: { create: { quantity: 0 } },
        },
        include: { inventory: true },
      });
      expect(result).toEqual(createdProduct);
    });

    it('should throw ConflictException if product name already exists', async () => {
      const dto = { name: 'Sword', price: 100 };
      prisma.product.findFirst.mockResolvedValue({ id: 'existing-id', name: 'Sword' });

      await expect(service.createProduct(dto)).rejects.toThrow(
        new ConflictException(`Product with name "${dto.name}" already exists`),
      );
    });
  });

  describe('getAllProducts', () => {
    it('should return paginated products and metadata', async () => {
      const products = [{ id: 'uuid-1', name: 'Sword', price: 50 }];
      prisma.product.findMany.mockResolvedValue(products);
      prisma.product.count.mockResolvedValue(1);

      const result = await service.getAllProducts(1, 10, 10, 100);

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { price: { gte: 10, lte: 100 } },
        skip: 0,
        take: 10,
        include: { inventory: true },
        orderBy: { createdAt: 'desc' },
      });
      expect(prisma.product.count).toHaveBeenCalledWith({
        where: { price: { gte: 10, lte: 100 } },
      });
      expect(result).toEqual({
        products,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });
  });

  describe('getProductById', () => {
    it('should return a product if found', async () => {
      const product = { id: 'uuid-1', name: 'Sword' };
      prisma.product.findUnique.mockResolvedValue(product);

      const result = await service.getProductById('uuid-1');

      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
        include: {
          inventory: true,
          cartItems: {
            include: {
              cart: {
                include: {
                  user: {
                    select: { id: true, email: true, name: true },
                  },
                },
              },
            },
          },
          orderItems: { include: { order: true } },
        },
      });
      expect(result).toEqual(product);
    });

    it('should throw NotFoundException if product is not found', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.getProductById('invalid-id')).rejects.toThrow(
        new NotFoundException(`Product with ID "invalid-id" not found`),
      );
    });
  });

  describe('updateProduct', () => {
    it('should update a product successfully', async () => {
      const id = 'uuid-1';
      const dto = { name: 'New Sword', price: 150 };
      const updatedProduct = { id, ...dto };

      prisma.product.findUnique.mockResolvedValue({ id, name: 'Old Sword' });
      prisma.product.findFirst.mockResolvedValue(null);
      prisma.product.update.mockResolvedValue(updatedProduct);

      const result = await service.updateProduct(id, dto);

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id },
        data: { name: dto.name, imageURL: undefined, price: dto.price },
        include: { inventory: true },
      });
      expect(result).toEqual(updatedProduct);
    });

    it('should throw NotFoundException if product to update does not exist', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.updateProduct('invalid-id', { name: 'Test' })).rejects.toThrow(
        new NotFoundException(`Product with ID "invalid-id" not found`),
      );
    });

    it('should throw ConflictException if new name belongs to another product', async () => {
      const id = 'uuid-1';
      const dto = { name: 'Existing Name' };

      prisma.product.findUnique.mockResolvedValue({ id, name: 'Old Name' });
      prisma.product.findFirst.mockResolvedValue({ id: 'uuid-2', name: 'Existing Name' });

      await expect(service.updateProduct(id, dto)).rejects.toThrow(
        new ConflictException(`Product with name "${dto.name}" already exists`),
      );
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product if it has no associations', async () => {
      const id = 'uuid-1';
      const existingProduct = { id, name: 'Sword', cartItems: [], orderItems: [] };
      const deletedProduct = { ...existingProduct, inventory: { quantity: 5 } };

      prisma.product.findUnique.mockResolvedValue(existingProduct);
      prisma.product.delete.mockResolvedValue(deletedProduct);

      const result = await service.deleteProduct(id);

      expect(prisma.product.delete).toHaveBeenCalledWith({
        where: { id },
        include: { inventory: true },
      });
      expect(result).toEqual({
        message: `Product "${deletedProduct.name}" deleted successfully`,
        product: deletedProduct,
      });
    });

    it('should throw NotFoundException if product to delete does not exist', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.deleteProduct('invalid-id')).rejects.toThrow(
        new NotFoundException(`Product with ID "invalid-id" not found`),
      );
    });

    it('should throw ConflictException if product has associated cart/order items', async () => {
      const id = 'uuid-1';
      prisma.product.findUnique.mockResolvedValue({
        id,
        cartItems: [{ id: 'cart-item-1' }],
        orderItems: [],
      });

      await expect(service.deleteProduct(id)).rejects.toThrow(
        new ConflictException(
          `Cannot delete product with ID "${id}" because it has associated cart items or order items`,
        ),
      );
    });
  });

  describe('productExists', () => {
    it('should return true if product exists', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'uuid-1' });

      const result = await service.productExists('uuid-1');

      expect(result).toBe(true);
    });

    it('should return false if product does not exist', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      const result = await service.productExists('invalid-id');

      expect(result).toBe(false);
    });
  });

  describe('getProductWithInventory', () => {
    it('should return product with inventory', async () => {
      const product = { id: 'uuid-1', name: 'Sword', inventory: { quantity: 10 } };
      prisma.product.findUnique.mockResolvedValue(product);

      const result = await service.getProductWithInventory('uuid-1');

      expect(result).toEqual(product);
    });

    it('should throw NotFoundException if product is not found', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.getProductWithInventory('invalid-id')).rejects.toThrow(
        new NotFoundException(`Product with ID "invalid-id" not found`),
      );
    });
  });

  describe('updateProductInventory', () => {
    it('should upsert inventory quantity for a valid product', async () => {
      const productId = 'uuid-1';
      const quantity = 25;

      // getProductById mock (it uses findUnique under the hood)
      prisma.product.findUnique.mockResolvedValue({ id: productId });
      prisma.inventory.upsert.mockResolvedValue({ productId, quantity });

      const result = await service.updateProductInventory(productId, quantity);

      expect(prisma.inventory.upsert).toHaveBeenCalledWith({
        where: { productId },
        update: { quantity },
        create: { productId, quantity },
      });
      expect(result).toEqual({ productId, quantity });
    });
  });

  describe('getLowInventoryProducts', () => {
    it('should return products with low inventory below threshold', async () => {
      const products = [{ id: 'uuid-1', name: 'Sword', inventory: { quantity: 2 } }];
      prisma.product.findMany.mockResolvedValue(products);

      const result = await service.getLowInventoryProducts(5);

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { inventory: { quantity: { lt: 5 } } },
        include: { inventory: true },
        orderBy: { inventory: { quantity: 'asc' } },
      });
      expect(result).toEqual(products);
    });
  });
});