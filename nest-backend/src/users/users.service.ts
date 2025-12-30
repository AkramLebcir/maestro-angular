import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole } from './entities/user.entity';
import { UpdateModulesDto } from './dto/update-modules.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

const DEFAULT_SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    await this.ensureEmailIsUnique(createUserDto.email);
    if (createUserDto.username) {
      await this.ensureUsernameIsUnique(createUserDto.username);
    }

    const passwordHash = await this.hashPassword(createUserDto.password);
    const user = this.usersRepository.create({
      ...createUserDto,
      role: createUserDto.role ?? UserRole.TEACHER,
      passwordHash,
      email: createUserDto.email.toLowerCase(),
      username: createUserDto.username?.trim(),
    });

    const savedUser = await this.usersRepository.save(user);
    return this.findOne(savedUser.id);
  }

  async findAll(): Promise<User[]> {
    try {
      return await this.usersRepository.find({
        order: { createdAt: 'DESC' },
        select: ['id', 'firstName', 'lastName', 'email', 'username', 'role', 'isActive', 'allowedModules', 'lastLoginAt', 'createdAt', 'updatedAt'],
      });
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByIdentifier(identifier: string, withPassword = false): Promise<User | null> {
    const query = this.usersRepository.createQueryBuilder('user').where('user.email = :identifier', {
      identifier: identifier.toLowerCase(),
    });

    if (identifier && identifier.includes('@') === false) {
      query.orWhere('user.username = :identifier', { identifier });
    }

    if (withPassword) {
      query.addSelect('user.passwordHash');
    }

    return query.getOne();
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      await this.ensureEmailIsUnique(updateUserDto.email);
    }

    if (updateUserDto.username && updateUserDto.username !== user.username) {
      await this.ensureUsernameIsUnique(updateUserDto.username);
    }

    if (updateUserDto.password) {
      user.passwordHash = await this.hashPassword(updateUserDto.password);
      delete updateUserDto.password;
    }

    Object.assign(user, updateUserDto);
    await this.usersRepository.save(user);
    return this.findOne(id);
  }

  async updateModules(id: number, updateModulesDto: UpdateModulesDto): Promise<User> {
    const user = await this.findOne(id);
    user.allowedModules = updateModulesDto.modules;
    await this.usersRepository.save(user);
    return user;
  }

  async updateStatus(id: number, updateStatusDto: UpdateStatusDto): Promise<User> {
    const user = await this.findOne(id);
    user.isActive = updateStatusDto.isActive;
    await this.usersRepository.save(user);
    return user;
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  async validatePassword(password: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(password, passwordHash);
  }

  async setLastLogin(id: number): Promise<void> {
    await this.usersRepository.update(id, { lastLoginAt: new Date() });
  }

  async setRefreshToken(id: number, refreshTokenHash: string, expiresAt: Date, sessionId: string): Promise<void> {
    await this.usersRepository.update(id, {
      refreshTokenHash,
      refreshTokenExpiresAt: expiresAt,
      sessionId,
    });
  }

  async clearRefreshToken(id: number): Promise<void> {
    await this.usersRepository.update(id, {
      refreshTokenHash: null,
      refreshTokenExpiresAt: null,
      sessionId: null,
    });
  }

  async findByIdWithRefreshToken(id: number): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect(['user.refreshTokenHash', 'user.refreshTokenExpiresAt', 'user.sessionId'])
      .where('user.id = :id', { id })
      .getOne();
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || DEFAULT_SALT_ROUNDS;
    return bcrypt.hash(password, saltRounds);
  }

  private async ensureEmailIsUnique(email: string): Promise<void> {
    const existing = await this.usersRepository.findOne({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      throw new BadRequestException('Email already in use');
    }
  }

  private async ensureUsernameIsUnique(username: string): Promise<void> {
    const existing = await this.usersRepository.findOne({
      where: { username },
    });
    if (existing) {
      throw new BadRequestException('Username already in use');
    }
  }

  async getTeacherCard(userId: number): Promise<Record<string, unknown> | null> {
    const user = await this.findOne(userId);
    return (user.profile?.teacherCard as Record<string, unknown>) || null;
  }

  async saveTeacherCard(userId: number, teacherCardData: Record<string, unknown>): Promise<User> {
    const user = await this.findOne(userId);
    if (!user.profile) {
      user.profile = {};
    }
    user.profile.teacherCard = teacherCardData;
    await this.usersRepository.save(user);
    return this.findOne(userId);
  }
}


