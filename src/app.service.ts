import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getAuthor():string{
    return 'Hi from author, let me tell you something'
  }
}
