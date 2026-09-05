import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
  DefaultValuePipe,
  ParseIntPipe}

from '@nestjs/common';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';

import { ProductService } from './product.service.js';
import { CreateProductDTO } from './dto/create-product.dto.js';
import { UpdateProductDTO } from './dto/update-product.dto.js';

@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new product' })
  @ApiBody({ type: CreateProductDTO })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Product successfully created' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Product with this name already exists' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  async createProduct(@Body() createProductDto: CreateProductDTO) {
    return await this.productService.createProduct(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'Products retrieved successfully' })
  async getAllProducts(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
  ) {
    return await this.productService.getAllProducts(page, limit, minPrice, maxPrice);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiParam({ name: 'id', required: true, type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Product retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Product not found' })
  async getProductById(@Param('id', ParseUUIDPipe) id: string) {
    return await this.productService.getProductById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiParam({ name: 'id', required: true, type: String })
  @ApiBody({ type: UpdateProductDTO })
  @ApiResponse({ status: HttpStatus.OK, description: 'Product updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Product not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Product with this name already exists' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  async updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDTO,
  ) {
    return await this.productService.updateProduct(id, updateProductDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a product' })
  @ApiParam({ name: 'id', required: true, type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Product deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Product not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Cannot delete product with associated items' })
  async deleteProduct(@Param('id', ParseUUIDPipe) id: string) {
    return await this.productService.deleteProduct(id);
  }

  @Get(':id/inventory')
  @ApiOperation({ summary: 'Get product with inventory details' })
  @ApiParam({ name: 'id', required: true, type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Product with inventory retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Product not found' })
  async getProductWithInventory(@Param('id', ParseUUIDPipe) id: string) {
    return await this.productService.getProductWithInventory(id);
  }

  @Patch(':id/inventory')
  @ApiOperation({ summary: 'Update product inventory' })
  @ApiParam({ name: 'id', required: true, type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        quantity: { type: 'number', example: 15 },
      },
      required: ['quantity'],
    },
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Inventory updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Product not found' })
  async updateProductInventory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('quantity', ParseIntPipe) quantity: number,
  ) {
    return await this.productService.updateProductInventory(id, quantity);
  }

  @Get('inventory/low')
  @ApiOperation({ summary: 'Get products with low inventory' })
  @ApiQuery({ name: 'threshold', required: false, type: Number, example: 10 })
  @ApiResponse({ status: HttpStatus.OK, description: 'Low inventory products retrieved successfully' })
  async getLowInventoryProducts(
    @Query('threshold', new DefaultValuePipe(10), ParseIntPipe) threshold: number,
  ) {
    return await this.productService.getLowInventoryProducts(threshold);
  }
}
