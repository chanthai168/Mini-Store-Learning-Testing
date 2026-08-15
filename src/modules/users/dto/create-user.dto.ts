import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ 
    example: 'user@example.com',
    description: 'User email address (must be unique)'
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsString()
  @MaxLength(255)
  email!: string;

  @ApiPropertyOptional({ 
    example: 'John Doe',
    description: 'User full name (optional)'
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;
}