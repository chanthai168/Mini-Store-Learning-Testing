
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean>{
        const request = context.switchToHttp().getRequest();
        console.log('')
        console.log('jwt auth guard custom ran');
        console.log(request.rawHeaders);
        console.log(request.body);

        request.user = {
            email: 'Dororo@gmail.com',
            name: 'Do Roro',
        }

        // using this request object when can do like normal express
        return true;
    }
}