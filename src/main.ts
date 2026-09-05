import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder,SwaggerModule } from '@nestjs/swagger';
import { ValidationError } from 'class-validator';
import { AllExceptionsFilter } from './common/filters/validation-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable ValidationPips - without this DTO decorator do nothing!
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist:true, // strips properties that don't have decorator 
      forbidNonWhitelisted:true,  // throw error if extra property are sent. 
      transform:true, // automatically transform payload to DTO instance 
      transformOptions:{
        enableImplicitConversion:true, // use for query/params 
      },
      exceptionFactory: (errors: ValidationError[]) => {
        // Pass raw error to filter 
        // question does it pass all raw error or only validationError
        return new BadRequestException({
          message: 'Validation failed',
          errorCode: 'VALIDATION_ERROR',
          error: errors,
        });
      }
    })
  )

  // Register ValidationExceptionFilter
  app.useGlobalFilters(new AllExceptionsFilter());

  const config = new DocumentBuilder()
  .setTitle("My API")
  .setDescription("API document for my NestJS project")
  .setVersion("1.0")
  .addTag("user")
  .build();

  const document = SwaggerModule.createDocument(app,config);
  SwaggerModule.setup('api',app,document);

  const PORT = process.env.PORT ?? 8000;
  console.log('App listen on port: ' + PORT);
  await app.listen(PORT);
}
bootstrap();
