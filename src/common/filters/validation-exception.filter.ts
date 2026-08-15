import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express'; 
import { ValidationError } from 'class-validator';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {

  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    // what is ctx ? why we set ctx = host.switchToHttp()

    const exceptionResponse = exception.getResponse() as any;

    // Safely extract possible validation errors
    const rawErrors = exceptionResponse?.message;

    // for understanding error object purposes
    this.LogErrorObject(exception);

    // Handle Error response with custom format if it's a Validation Error
    if (Array.isArray(rawErrors) && rawErrors.length > 0 && this.isValidationError(rawErrors[0])) {
      const formattedErrors = this.formatErrors(rawErrors as ValidationError[]);

      return response.status(status).json({
        statusCode: status,
        message: 'Validation failed',
        errors: formattedErrors,
        timestamp: new Date().toISOString(),
      });
    }

    // Fallback for other BadRequestExceptions
    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : exceptionResponse?.message || exception.message || 'Bad Request';

    response.status(status).json({
      statusCode: status,
      message: Array.isArray(message) ? message[0] : message,
      timestamp: new Date().toISOString(),
    });
  }

  /** Type guard to check if the object looks like a ValidationError */
  private isValidationError(error: any): error is ValidationError {
    return (
      error &&
      typeof error === 'object' &&
      'property' in error &&
      'constraints' in error &&
      'children' in error
    );
  }


  private LogErrorObject(exception: BadRequestException){
    console.log('Exception')
    console.log(exception);
    console.log();

    const exceptionResponse = exception.getResponse() as any;

    console.log('Exception.getResponse');
    console.log(exceptionResponse);
    console.log();

    // Safely extract possible validation errors
    const rawErrors = exceptionResponse?.message;

    console.log('Exception.getResponse.message');
    console.log(rawErrors);
    console.log();
  }

  private formatErrors(errors: ValidationError[]): Record<string, string[]> {
    const result: Record<string, string[]> = {};

    for (const error of errors) {
      const field = error.property;
      const messages = error.constraints
        ? Object.values(error.constraints)
        : ['Invalid value'];

      result[field] = messages;

      // Nested validation support
      if (error.children && error.children.length > 0) {
        const nested = this.formatErrors(error.children);
        for (const key of Object.keys(nested)) {
          result[`${field}.${key}`] = nested[key];
        }
      }
    }

    return result;
  }

}