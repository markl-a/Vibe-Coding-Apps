/**
 * Production-Ready CRUD Controller Example
 * Demonstrates full Create, Read, Update, Delete operations with best practices
 *
 * Features:
 * - NestJS/Express patterns
 * - Input validation
 * - Error handling
 * - Pagination
 * - Filtering & sorting
 * - Transaction support
 * - Soft deletes
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
  ValidationPipe,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Like, Between } from 'typeorm';

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

import { IsString, IsNotEmpty, IsOptional, IsEmail, IsEnum, MinLength, MaxLength, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus = UserStatus.ACTIVE;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;
}

export class QueryUsersDto {
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @IsEnum(['ASC', 'DESC'])
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

// ============================================================================
// Entity
// ============================================================================

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  firstName: string;

  @Column({ length: 50 })
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}

// ============================================================================
// Service
// ============================================================================

import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Create a new user with encrypted password
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    this.logger.log(`Creating user with email: ${createUserDto.email}`);

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create user
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return this.userRepository.save(user);
  }

  /**
   * Find all users with pagination, filtering, and sorting
   */
  async findAll(queryDto: QueryUsersDto): Promise<{
    data: User[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page, limit, search, status, sortBy, sortOrder } = queryDto;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(user.firstName LIKE :search OR user.lastName LIKE :search OR user.email LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status) {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    // Apply sorting
    queryBuilder.orderBy(`user.${sortBy}`, sortOrder);

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find a single user by ID
   */
  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Update a user
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    this.logger.log(`Updating user with ID: ${id}`);

    const user = await this.findOne(id);

    // Check email uniqueness if email is being updated
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new BadRequestException('User with this email already exists');
      }
    }

    // Update user
    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  /**
   * Soft delete a user
   */
  async remove(id: string): Promise<void> {
    this.logger.log(`Soft deleting user with ID: ${id}`);

    const user = await this.findOne(id);
    await this.userRepository.softRemove(user);
  }

  /**
   * Permanently delete a user
   */
  async permanentlyDelete(id: string): Promise<void> {
    this.logger.log(`Permanently deleting user with ID: ${id}`);

    const result = await this.userRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  /**
   * Restore a soft-deleted user
   */
  async restore(id: string): Promise<User> {
    this.logger.log(`Restoring user with ID: ${id}`);

    const user = await this.userRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (!user.deletedAt) {
      throw new BadRequestException('User is not deleted');
    }

    await this.userRepository.restore(id);
    return this.findOne(id);
  }

  /**
   * Bulk operations
   */
  async bulkCreate(users: CreateUserDto[]): Promise<User[]> {
    this.logger.log(`Bulk creating ${users.length} users`);

    const createdUsers = await Promise.all(
      users.map(async (userData) => {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        return this.userRepository.create({
          ...userData,
          password: hashedPassword,
        });
      }),
    );

    return this.userRepository.save(createdUsers);
  }

  async bulkUpdate(ids: string[], updateData: UpdateUserDto): Promise<void> {
    this.logger.log(`Bulk updating ${ids.length} users`);

    await this.userRepository.update(ids, updateData);
  }

  async bulkDelete(ids: string[]): Promise<void> {
    this.logger.log(`Bulk deleting ${ids.length} users`);

    await this.userRepository.softDelete(ids);
  }
}

// ============================================================================
// Controller
// ============================================================================

@ApiTags('users')
@Controller('users')
@ApiBearerAuth()
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  // ========================================================================
  // CREATE operations
  // ========================================================================

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully', type: User })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  async create(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    createUserDto: CreateUserDto,
  ): Promise<User> {
    this.logger.log('Create user endpoint called');
    return this.usersService.create(createUserDto);
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Bulk create users' })
  @ApiResponse({ status: 201, description: 'Users created successfully' })
  async bulkCreate(@Body() users: CreateUserDto[]): Promise<User[]> {
    this.logger.log(`Bulk create endpoint called with ${users.length} users`);
    return this.usersService.bulkCreate(users);
  }

  // ========================================================================
  // READ operations
  // ========================================================================

  @Get()
  @ApiOperation({ summary: 'Get all users with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: UserStatus })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async findAll(@Query() queryDto: QueryUsersDto) {
    this.logger.log('Get all users endpoint called');
    return this.usersService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({ status: 200, description: 'User found', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<User> {
    this.logger.log(`Get user by ID endpoint called: ${id}`);
    return this.usersService.findOne(id);
  }

  // ========================================================================
  // UPDATE operations
  // ========================================================================

  @Put(':id')
  @ApiOperation({ summary: 'Update a user (full update)' })
  @ApiResponse({ status: 200, description: 'User updated successfully', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    this.logger.log(`Update user endpoint called: ${id}`);
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Partially update a user' })
  @ApiResponse({ status: 200, description: 'User updated successfully', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  async partialUpdate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    this.logger.log(`Partial update user endpoint called: ${id}`);
    return this.usersService.update(id, updateUserDto);
  }

  @Patch('bulk/update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk update users' })
  @ApiResponse({ status: 200, description: 'Users updated successfully' })
  async bulkUpdate(
    @Body() data: { ids: string[]; updateData: UpdateUserDto },
  ): Promise<{ message: string }> {
    this.logger.log(`Bulk update endpoint called with ${data.ids.length} users`);
    await this.usersService.bulkUpdate(data.ids, data.updateData);
    return { message: `${data.ids.length} users updated successfully` };
  }

  // ========================================================================
  // DELETE operations
  // ========================================================================

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a user' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    this.logger.log(`Soft delete user endpoint called: ${id}`);
    return this.usersService.remove(id);
  }

  @Delete(':id/permanent')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Permanently delete a user' })
  @ApiResponse({ status: 204, description: 'User permanently deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async permanentlyDelete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    this.logger.log(`Permanent delete user endpoint called: ${id}`);
    return this.usersService.permanentlyDelete(id);
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore a soft-deleted user' })
  @ApiResponse({ status: 200, description: 'User restored successfully', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  async restore(@Param('id', ParseUUIDPipe) id: string): Promise<User> {
    this.logger.log(`Restore user endpoint called: ${id}`);
    return this.usersService.restore(id);
  }

  @Delete('bulk/delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Bulk delete users' })
  @ApiResponse({ status: 204, description: 'Users deleted successfully' })
  async bulkDelete(@Body() data: { ids: string[] }): Promise<void> {
    this.logger.log(`Bulk delete endpoint called with ${data.ids.length} users`);
    return this.usersService.bulkDelete(data.ids);
  }
}

// ============================================================================
// Express.js Alternative (for non-NestJS projects)
// ============================================================================

/**
 * Express.js version of the CRUD controller
 */
import express, { Request, Response, NextFunction } from 'express';

export class ExpressUsersController {
  private usersService: UsersService;

  constructor(usersService: UsersService) {
    this.usersService = usersService;
  }

  // Middleware for validation
  validateCreateUser = (req: Request, res: Response, next: NextFunction) => {
    // Add validation logic here
    next();
  };

  // CREATE
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.usersService.create(req.body);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  };

  // READ
  findAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.usersService.findAll(req.query as any);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  findOne = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.usersService.findOne(req.params.id);
      res.json(user);
    } catch (error) {
      next(error);
    }
  };

  // UPDATE
  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.usersService.update(req.params.id, req.body);
      res.json(user);
    } catch (error) {
      next(error);
    }
  };

  // DELETE
  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.usersService.remove(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}

// Setup Express router
export function createUsersRouter(usersService: UsersService): express.Router {
  const router = express.Router();
  const controller = new ExpressUsersController(usersService);

  router.post('/', controller.validateCreateUser, controller.create);
  router.get('/', controller.findAll);
  router.get('/:id', controller.findOne);
  router.put('/:id', controller.update);
  router.patch('/:id', controller.update);
  router.delete('/:id', controller.remove);

  return router;
}

// ============================================================================
// Fastify Alternative
// ============================================================================

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export async function registerUserRoutes(
  fastify: FastifyInstance,
  usersService: UsersService,
) {
  // Schema for validation
  const createUserSchema = {
    body: {
      type: 'object',
      required: ['firstName', 'lastName', 'email', 'password'],
      properties: {
        firstName: { type: 'string', minLength: 2, maxLength: 50 },
        lastName: { type: 'string', minLength: 2, maxLength: 50 },
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 8 },
        status: { type: 'string', enum: ['active', 'inactive', 'suspended'] },
      },
    },
  };

  // CREATE
  fastify.post('/users', { schema: createUserSchema }, async (request, reply) => {
    const user = await usersService.create(request.body as CreateUserDto);
    reply.code(201).send(user);
  });

  // READ
  fastify.get('/users', async (request, reply) => {
    const result = await usersService.findAll(request.query as QueryUsersDto);
    reply.send(result);
  });

  fastify.get('/users/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = await usersService.findOne(id);
    reply.send(user);
  });

  // UPDATE
  fastify.put('/users/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = await usersService.update(id, request.body as UpdateUserDto);
    reply.send(user);
  });

  // DELETE
  fastify.delete('/users/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await usersService.remove(id);
    reply.code(204).send();
  });
}

export default {
  UsersController,
  UsersService,
  ExpressUsersController,
  createUsersRouter,
  registerUserRoutes,
};
