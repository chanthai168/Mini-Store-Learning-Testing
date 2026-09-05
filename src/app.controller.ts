import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/greeting')
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/author')
  getAuthor(): string {
    return this.appService.getAuthor();
  }
  @Get('e2etest')
  testing(): string{
    return `it's testing`;
  }

  @Get()
  notFound(): string {
    return 'You looking for something ? we only have /author and /gretting.'
  }
}
