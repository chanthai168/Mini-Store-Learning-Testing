import { Controller, Get,Post,Body, Put,Param, Delete,UseGuards,UseInterceptors } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RoleGuard } from '../../common/guards/role.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { LoggingInterceptor } from '../../common/interceptors/Logging.interceptor.js';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor.js';
import { User } from '../../common/decorators/getUser.decorator.js';

@UseGuards(JwtAuthGuard)
@UseInterceptors(LoggingInterceptor)
@Controller('users')
export class UsersController {
    constructor(private readonly usersService:UsersService){};

    @Post()
    async createUser(@Body() createUserDto:CreateUserDto):Promise<string> {
        return await this.usersService.createUser(createUserDto);
    }

    @Put(':id')
    async updateUser(@Body() updateUserDto:UpdateUserDto,@Param('id') id:string): Promise<string> {
        return await this.usersService.updateUser(updateUserDto,id);
    }

    @Roles(['USER']) // setup role 'User' to this route
    @UseGuards(RoleGuard) // True if incomming user hold 'USER' role 
    @UseInterceptors(TransformInterceptor)
    @Get()

    async getUser(@User() user:{email:string,name:string}):Promise<any[]>{
        console.log(user);
        return await this.usersService.getUsers();
    }
    // nest does 
    // reflext.defineMetadata('roles',[USER]) under the hood 

    @Delete()
    async deleteUser(@Param('id') id:string):Promise<string>{
        return await this.usersService.deleteUser(id);
    }

    @Get('hi')
    getHiFromUser(){
        return this.usersService.getHiFromUser()
    }
}
