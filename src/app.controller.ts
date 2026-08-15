import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

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

  @Get()
  notFound(): string {
    return 'You looking for something ? we only have /author and /gretting.'
  }
}
