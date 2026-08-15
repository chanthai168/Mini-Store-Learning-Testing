
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role,ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RoleGuard implements CanActivate {
    constructor(private readonly reflector:Reflector ){}

    async canActivate(context: ExecutionContext): Promise<boolean>{
        const requiredRoles = this.reflector.get<Role[]>(ROLES_KEY,context.getHandler());
        console.log("---- Role guard ran -----")
        console.log(requiredRoles);
        
        const hasRole = requiredRoles.some(role => role.includes(Role.User));
        if(hasRole){
            console.log('This user is in User role')
        }

        // we can than switch execution context to http so we can get req.user 
        return true;
    }
}