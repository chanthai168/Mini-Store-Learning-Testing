import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateUserDto} from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { InsufficientBalanceException } from '../../common/exceptions/insufficient-balance.exception.js';

@Injectable()
export class UsersService {
    constructor(private readonly prismaService:PrismaService){};
    getHiFromUser(){
        throw new InsufficientBalanceException(120);
    }

    async getUsers():Promise<any[]>{
        return await this.prismaService.user.findMany();
    }

    async createUser(user:CreateUserDto): Promise<string>{
        await this.prismaService.user.create({data: user});
        return 'User created' + ' ' + user.email +' ' + user.name;
    }

    async updateUser(updateUser:UpdateUserDto,id:string): Promise<string>{
        await this.prismaService.user.update({
            where:{
                id:id,
            },
            data: updateUser,
        })
        return 'User updated' + ' ' + updateUser.email + ' ' + updateUser.name;
    }

    async deleteUser(id:string):Promise<string>{
        await this.prismaService.user.delete({
            where: {
                id:id,
            }
        })
        return 'User ' + id + ' is deleted.';
    }
}
