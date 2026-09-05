import { Injectable,NestInterceptor,ExecutionContext,CallHandler } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

export class LoggingInterceptor implements NestInterceptor{
    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<string>  {
        console.log('')
        console.log('Interceptor ran...')
        console.log('In1: Before ....');
        const now = Date.now();
        return  next
                .handle()
                .pipe(tap(()=> console.log(`In1: After .... take ${Date.now() - now}s`)))
    }
}