import { ApiProperty } from "@nestjs/swagger";
import { IsString,MaxLength,IsNumber,IsOptional,IsPositive, isPositive, } from "class-validator";
import { Type } from "class-transformer";

export class UpdateProductDTO {
    @ApiProperty({
        example:"Iphone 17",
        description:"Make sure your name is descriptive enough"
    }) 
    @IsOptional()
    @IsString()
    @MaxLength(24)
    name?:string;

    
    @ApiProperty({
        example:"yourimageurl.com"
    })
    @IsOptional()
    @IsString()
    imageURL?: string;


    @ApiProperty({
        example:"12.99"
    })
    @IsOptional()
    @Type(()=> Number)
    @IsNumber()
    @IsPositive({message:'The price must be greater than 0'})
    price?: number;
}