import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Behavior } from './behavior.entity';
import { CreateBehaviorDto } from './dto/create-behavior.dto';
import { UpdateBehaviorDto } from './dto/update-behavior.dto';
import { BehaviorResponseDto } from './dto/behavior-response.dto';

@Injectable()
export class BehaviorsService {
  private readonly defaultBehaviors = [
    // Positive behaviors
    { name: 'Good General Behavior', nameAr: 'سلوك عام جيد', type: 'positive' as const, icon: '✓', points: 0.5, color: 'green' },
    { name: 'Good Progress', nameAr: 'تقدم جيد', type: 'positive' as const, icon: '📈', points: 0.5, color: 'green' },
    { name: 'Helpful', nameAr: 'متعاون', type: 'positive' as const, icon: '🤝', points: 0.5, color: 'green' },
    { name: 'Homework done on time', nameAr: 'إنجاز الواجب في الوقت المحدد', type: 'positive' as const, icon: '✅', points: 0.5, color: 'green' },
    { name: 'Participating', nameAr: 'مشارك', type: 'positive' as const, icon: '✋', points: 0.5, color: 'green' },
    // Negative behaviors
    { name: 'Generally Bad Behavior', nameAr: 'سلوك عام سيء', type: 'negative' as const, icon: '✗', points: -0.5, color: 'red' },
    { name: 'Uses Mobile Phones Excessively', nameAr: 'استخدام الهاتف بشكل مفرط', type: 'negative' as const, icon: '📱', points: -0.5, color: 'red' },
    { name: 'Fighting', nameAr: 'شجار', type: 'negative' as const, icon: '👊', points: -0.5, color: 'red' },
    { name: 'Homework Issues', nameAr: 'مشاكل في الواجب', type: 'negative' as const, icon: '📝', points: -0.5, color: 'red' },
    { name: 'Chatting', nameAr: 'ثرثرة', type: 'negative' as const, icon: '💬', points: -0.5, color: 'red' }
  ];

  constructor(
    @InjectRepository(Behavior)
    private behaviorRepository: Repository<Behavior>,
  ) {}

  async findAll(ownerId: number): Promise<BehaviorResponseDto[]> {
    const behaviors = await this.behaviorRepository.find({
      where: { ownerId },
      order: { type: 'ASC', createdAt: 'ASC' }
    });
    return behaviors.map(b => this.toResponseDto(b));
  }

  async findOne(ownerId: number, id: number): Promise<BehaviorResponseDto> {
    const behavior = await this.behaviorRepository.findOne({
      where: { id, ownerId }
    });
    if (!behavior) {
      throw new NotFoundException(`Behavior with ID ${id} not found`);
    }
    return this.toResponseDto(behavior);
  }

  async create(ownerId: number, createBehaviorDto: CreateBehaviorDto): Promise<BehaviorResponseDto> {
    const behavior = this.behaviorRepository.create({
      ...createBehaviorDto,
      ownerId,
      points: createBehaviorDto.points ?? (createBehaviorDto.type === 'positive' ? 0.5 : -0.5),
      color: createBehaviorDto.color ?? (createBehaviorDto.type === 'positive' ? 'green' : 'red'),
    });
    const saved = await this.behaviorRepository.save(behavior);
    return this.toResponseDto(saved);
  }

  async update(ownerId: number, id: number, updateBehaviorDto: UpdateBehaviorDto): Promise<BehaviorResponseDto> {
    const behavior = await this.behaviorRepository.findOne({
      where: { id, ownerId }
    });
    if (!behavior) {
      throw new NotFoundException(`Behavior with ID ${id} not found`);
    }

    // Prevent updating default behaviors
    if (behavior.isDefault) {
      throw new BadRequestException('Cannot update default behaviors');
    }

    Object.assign(behavior, updateBehaviorDto);
    const updated = await this.behaviorRepository.save(behavior);
    return this.toResponseDto(updated);
  }

  async remove(ownerId: number, id: number): Promise<void> {
    const behavior = await this.behaviorRepository.findOne({
      where: { id, ownerId }
    });
    if (!behavior) {
      throw new NotFoundException(`Behavior with ID ${id} not found`);
    }

    // Prevent deleting default behaviors
    if (behavior.isDefault) {
      throw new BadRequestException('Cannot delete default behaviors');
    }

    await this.behaviorRepository.remove(behavior);
  }

  async resetToDefaults(ownerId: number): Promise<BehaviorResponseDto[]> {
    // Delete all existing behaviors for this owner
    await this.behaviorRepository.delete({ ownerId });

    // Create default behaviors
    const behaviors = this.defaultBehaviors.map(defaultBehavior => 
      this.behaviorRepository.create({
        ...defaultBehavior,
        ownerId,
        isDefault: true
      })
    );

    const saved = await this.behaviorRepository.save(behaviors);
    return saved.map(b => this.toResponseDto(b));
  }

  async seedDefaults(ownerId: number): Promise<void> {
    // Check if owner already has behaviors
    const existing = await this.behaviorRepository.count({ where: { ownerId } });
    if (existing > 0) {
      return; // Already seeded
    }

    // Create default behaviors
    const behaviors = this.defaultBehaviors.map(defaultBehavior => 
      this.behaviorRepository.create({
        ...defaultBehavior,
        ownerId,
        isDefault: true
      })
    );

    await this.behaviorRepository.save(behaviors);
  }

  private toResponseDto(behavior: Behavior): BehaviorResponseDto {
    return {
      id: behavior.id,
      name: behavior.name,
      nameAr: behavior.nameAr,
      type: behavior.type,
      icon: behavior.icon,
      points: typeof behavior.points === 'string' ? parseFloat(behavior.points) : Number(behavior.points),
      color: behavior.color,
      description: behavior.description,
      isDefault: behavior.isDefault,
      createdAt: behavior.createdAt,
      updatedAt: behavior.updatedAt,
    };
  }
}

