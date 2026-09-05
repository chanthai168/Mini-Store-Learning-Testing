import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateProductDTO } from './dto/create-product.dto.js';
import { UpdateProductDTO } from './dto/update-product.dto.js';
import { Product } from '../../generated/prisma/client.js';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new product
   */
  async createProduct(createProductDto: CreateProductDTO): Promise<Product> {
    // Check if product with same name already exists
    const existingProduct = await this.prisma.product.findFirst({
      where: {
        name: createProductDto.name as string,
      },
    });

    if (existingProduct) {
      throw new ConflictException(
        `Product with name "${createProductDto.name}" already exists`,
      );
    }

    // Create product and its inventory in a transaction
    return this.prisma.$transaction(async (prisma) => {
      const product = await prisma.product.create({
        data: {
          name: createProductDto.name as string,
          imageURL: createProductDto.imageURL,
          price: createProductDto.price,
          // Create associated inventory with default quantity 0
          inventory: {
            create: {
              quantity: 0,
            },
          },
        },
        include: {
          inventory: true,
        },
      });

      return product;
    });
  }

  /**
   * Get all products with pagination and optional filtering
   */
  async getAllProducts(
    page: number = 1,
    limit: number = 10,
    minPrice?: number,
    maxPrice?: number,
  ): Promise<{
    products: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: any = {};
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice;
      }
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          inventory: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single product by ID
   */
  async getProductById(id: string): Promise<Product> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        inventory: true,
        cartItems: {
          include: {
            cart: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        orderItems: {
          include: {
            order: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    return product;
  }

  /**
   * Update an existing product
   */
  async updateProduct(
    id: string,
    updateProductDto: UpdateProductDTO,
  ): Promise<Product> {
    // Check if product exists
    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    // If updating name, check for conflicts
    if (updateProductDto.name) {
      const duplicateProduct = await this.prisma.product.findFirst({
        where: {
          name: updateProductDto.name as string,
          id: { not: id },
        },
      });

      if (duplicateProduct) {
        throw new ConflictException(
          `Product with name "${updateProductDto.name}" already exists`,
        );
      }
    }

    // Update the product
    return this.prisma.product.update({
      where: { id },
      data: {
        name: updateProductDto.name,
        imageURL: updateProductDto.imageURL,
        price: updateProductDto.price,
      },
      include: {
        inventory: true,
      },
    });
  }

  /**
   * Delete a product (soft delete by checking associations)
   */
  async deleteProduct(id: string): Promise<{ message: string; product: Product }> {
    // Check if product exists
    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
      include: {
        cartItems: true,
        orderItems: true,
      },
    });

    if (!existingProduct) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    // Check if product has any active cart items or order items
    if (existingProduct.cartItems.length > 0 || existingProduct.orderItems.length > 0) {
      throw new ConflictException(
        `Cannot delete product with ID "${id}" because it has associated cart items or order items`,
      );
    }

    // Delete product (inventory and other relations will be cascaded)
    const deletedProduct = await this.prisma.product.delete({
      where: { id },
      include: {
        inventory: true,
      },
    });

    return {
      message: `Product "${deletedProduct.name}" deleted successfully`,
      product: deletedProduct,
    };
  }

  /**
   * Check if product exists by ID (helper method)
   */
  async productExists(id: string): Promise<boolean> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!product;
  }

  /**
   * Get product with inventory details
   */
  async getProductWithInventory(id: string): Promise<Product & { inventory: any }> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        inventory: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    return product;
  }

  /**
   * Update product inventory quantity
   */
  async updateProductInventory(
    productId: string,
    quantity: number,
  ): Promise<{ productId: string; quantity: number }> {
    // Check if product exists (throws NotFoundException if not)
    await this.getProductById(productId);

    // Update or create inventory
    const inventory = await this.prisma.inventory.upsert({
      where: {
        productId: productId,
      },
      update: {
        quantity: quantity,
      },
      create: {
        productId: productId,
        quantity: quantity,
      },
    });

    return {
      productId: productId,
      quantity: inventory.quantity,
    };
  }

  /**
   * Get products with low inventory
   */
  async getLowInventoryProducts(threshold: number = 10): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: {
        inventory: {
          quantity: {
            lt: threshold,
          },
        },
      },
      include: {
        inventory: true,
      },
      orderBy: {
        inventory: {
          quantity: 'asc',
        },
      },
    });
  }
}