import { Controller, Get,Post,Body, Put,Param, Delete,UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RoleGuard } from '../../common/guards/role.guard';
import { Role,Roles } from '../../common/decorators/roles.decorator';


@Controller('users')
@UseGuards(JwtAuthGuard)
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

    @Roles(Role.User) // setup role 'User' to this route
    @UseGuards(RoleGuard) // True if comming user has 'User' role 
    @Get()
    async getUser():Promise<any[]>{
        return await this.usersService.getUsers();
    }
    // nest does 
    // reflext.defineMetadata('roles',[Roles.User])

    @Delete()
    async deleteUser(@Param('id') id:string):Promise<string>{
        return await this.usersService.deleteUser(id);
    }

    @Get('hi')
    getHiFromUser(){
        console.log(" ge hi is called -------------------")
        return this.usersService.getHiFromUser()
    }
}
