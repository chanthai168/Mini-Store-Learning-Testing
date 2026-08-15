import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ValidationError } from 'class-validator';

interface ApiErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | string[];
  errorCode?: string;          
  details?: Record<string, any>; 
  // additional custom fields can be added via a generic `data`?
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let errorResponse: any;

    if (exception instanceof HttpException) {

      status = exception.getStatus();
      const res = exception.getResponse() as any;
      
      errorResponse = typeof res === 'string' ? { message: res } : res;
      
      if(res.errorCode && res.errorCode === 'VALIDATION_ERROR'){
        errorResponse.details = this.formatValidationErrors(res.error);
      }

    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorResponse = { message: 'Internal server error' };
      this.logger.error(exception);
    }

    const { message, errorCode, statusCode, details, ...extra } = errorResponse;
    
    // Build the final response body
    const body: ApiErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: errorResponse.message || 'Unknown error',
      errorCode: errorResponse.errorCode,
      details: errorResponse.details,
      // preserve any additional custom fields from the exception
      ...extra,
    };

    // Log 5xx errors with stack trace
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} ${status} - ${errorResponse.message}`,
        exception instanceof Error ? exception.stack : '',
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} ${status} - ${errorResponse.message}`,
      );
    }

    response.status(status).json(body);
  }

  private formatValidationErrors(errors: ValidationError[]): Record<string, string[]> {
    const result: Record<string, string[]> = {};

    for (const error of errors) {
      const field = error.property;
      const messages = error.constraints
        ? Object.values(error.constraints)
        : ['Invalid value'];

      result[field] = messages;

      // Nested validation support
      if (error.children && error.children.length > 0) {
        const nested = this.formatValidationErrors(error.children);
        for (const key of Object.keys(nested)) {
          result[`${field}.${key}`] = nested[key];
        }
      }
    }

    return result;
  }
}