import { ProductController } from "./product.controller.js";
import { ProductService } from "./product.service.js";
import { Test, TestingModule } from "@nestjs/testing";

describe("Product Controller", () => {
  let controller: ProductController;
  let service: ProductService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        {
          provide: ProductService,
          useValue: {
            createProduct: jest.fn(),
            getAllProducts: jest.fn(),
            getProductById: jest.fn(),
            updateProduct: jest.fn(),
            deleteProduct: jest.fn(),
            getProductWithInventory: jest.fn(),
            updateProductInventory: jest.fn(),
            getLowInventoryProducts: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProductController>(ProductController);
    service = module.get<ProductService>(ProductService);
  });


  describe('createProducts',()=>{
    it('Should create a product', async () => {
        const dto = {
        name: "Sword",
        price: 12,
        };

        const expectedResult = {
        id: "123-uuid",
        name: "Sword",
        price: 12,
        imageURL: null,
        createdAt: new Date(),
        };

        jest.spyOn(service, "createProduct").mockResolvedValue(expectedResult);

        const result = await controller.createProduct(dto);

        expect(result).toEqual(expectedResult);
        expect(service.createProduct).toHaveBeenCalledWith(dto);
    });
  })

  describe('getAllProducts', () => {
    it('Should return an array of products with pagination parameters', async () => {
      const page = 1;
      const limit = 10;
      const minPrice = 5;
      const maxPrice = 50;

      const expectedResult = [
        { id: '123-uuid', name: 'Sword', price: 12 },
        { id: '456-uuid', name: 'Shield', price: 20 },
      ];

      jest.spyOn(service, 'getAllProducts').mockResolvedValue(expectedResult as any);

      const result = await controller.getAllProducts(page, limit, minPrice, maxPrice);

      expect(result).toEqual(expectedResult);
      expect(service.getAllProducts).toHaveBeenCalledWith(page, limit, minPrice, maxPrice);
    });
  });

  describe('getProductById', () => {
    it('Should return a product by ID', async () => {
      const id = '123-uuid';
      const expectedResult = { id: '123-uuid', name: 'Sword', price: 12 };

      jest.spyOn(service, 'getProductById').mockResolvedValue(expectedResult as any);

      const result = await controller.getProductById(id);

      expect(result).toEqual(expectedResult);
      expect(service.getProductById).toHaveBeenCalledWith(id);
    });
  });

  describe('updateProduct', () => {
    it('Should update a product', async () => {
      const id = '123-uuid';
      const dto = { name: 'Enchanted Sword', price: 25 };
      const expectedResult = { id: '123-uuid', name: 'Enchanted Sword', price: 25 };

      jest.spyOn(service, 'updateProduct').mockResolvedValue(expectedResult as any);

      const result = await controller.updateProduct(id, dto);

      expect(result).toEqual(expectedResult);
      expect(service.updateProduct).toHaveBeenCalledWith(id, dto);
    });
  });

  describe('deleteProduct', () => {
    it('Should delete a product', async () => {
      const id = '123-uuid';
      const expectedResult = { success: true };

      jest.spyOn(service, 'deleteProduct').mockResolvedValue(expectedResult as any);

      const result = await controller.deleteProduct(id);

      expect(result).toEqual(expectedResult);
      expect(service.deleteProduct).toHaveBeenCalledWith(id);
    });
  });

  describe('getProductWithInventory', () => {
    it('Should return a product with inventory details', async () => {
      const id = '123-uuid';
      const expectedResult = {
        id: '123-uuid',
        name: 'Sword',
        price: 12,
        inventory: { quantity: 15 },
      };

      jest.spyOn(service, 'getProductWithInventory').mockResolvedValue(expectedResult as any);


      const result = await controller.getProductWithInventory(id);

      expect(result).toEqual(expectedResult);
      expect(service.getProductWithInventory).toHaveBeenCalledWith(id);
    });
  });

  describe('updateProductInventory', () => {
    it('Should update the inventory quantity for a product', async () => {
      const id = '123-uuid';
      const quantity = 15;
      const expectedResult = { id: '123-uuid', inventory: { quantity: 15 } };

      jest.spyOn(service, 'updateProductInventory').mockResolvedValue(expectedResult as any);

      const result = await controller.updateProductInventory(id, quantity);

      expect(result).toEqual(expectedResult);
      expect(service.updateProductInventory).toHaveBeenCalledWith(id, quantity);
    });
  });

  describe('getLowInventoryProducts', () => {
    it('Should return products with low inventory based on threshold', async () => {
      const threshold = 10;
      const expectedResult = [
        { id: '123-uuid', name: 'Sword', inventory: { quantity: 3 } },
      ];

      jest.spyOn(service, 'getLowInventoryProducts').mockResolvedValue(expectedResult as any);

      const result = await controller.getLowInventoryProducts(threshold);

      expect(result).toEqual(expectedResult);
      expect(service.getLowInventoryProducts).toHaveBeenCalledWith(threshold);
    });
  });
});