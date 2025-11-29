import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ActivateSubscriptionDto } from './dto/activate-subscription.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // ========== Subscription Plans (Admin Only) ==========

  @Post('plans')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  createPlan(@Body() createPlanDto: CreateSubscriptionPlanDto) {
    return this.subscriptionsService.createPlan(createPlanDto);
  }

  @Get('plans')
  findAllPlans() {
    return this.subscriptionsService.findAllPlans();
  }

  @Get('plans/active')
  findActivePlans() {
    return this.subscriptionsService.findActivePlans();
  }

  @Get('plans/:id')
  findPlanById(@Param('id', ParseIntPipe) id: number) {
    return this.subscriptionsService.findPlanById(id);
  }

  @Patch('plans/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  updatePlan(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePlanDto: UpdateSubscriptionPlanDto,
  ) {
    return this.subscriptionsService.updatePlan(id, updatePlanDto);
  }

  @Delete('plans/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  deletePlan(@Param('id', ParseIntPipe) id: number) {
    return this.subscriptionsService.deletePlan(id);
  }

  // ========== Subscriptions ==========

  // ========== Stats ==========

  @Get('stats/overview')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  getStats() {
    return this.subscriptionsService.getSubscriptionStats();
  }

  // ========== Payments ==========

  @Post('payments')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  createPayment(@Body() createDto: CreatePaymentDto) {
    return this.subscriptionsService.createPayment(createDto);
  }

  @Get('payments')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAllPayments() {
    try {
      return await this.subscriptionsService.findAllPayments();
    } catch (error) {
      throw error;
    }
  }

  @Get('payments/my-payments')
  async getMyPayments(@Request() req) {
    const userId = req.user.id;
    return this.subscriptionsService.findPaymentsByUser(userId);
  }

  @Get('payments/user/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findPaymentsByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.subscriptionsService.findPaymentsByUser(userId);
  }

  @Get('payments/:id')
  findPaymentById(@Param('id', ParseIntPipe) id: number) {
    return this.subscriptionsService.findPaymentById(id);
  }

  @Patch('payments/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  updatePayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdatePaymentDto,
  ) {
    return this.subscriptionsService.updatePayment(id, updateDto);
  }

  // ========== Subscriptions ==========

  @Post('request')
  async requestSubscription(@Request() req, @Body() body: { planId: number; notes?: string }) {
    // Allow teachers to request a subscription
    const userId = req.user.id;
    return this.subscriptionsService.createSubscription({
      userId,
      planId: body.planId,
      notes: body.notes || 'طلب اشتراك جديد من الأستاذ',
    });
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  createSubscription(@Body() createDto: CreateSubscriptionDto) {
    return this.subscriptionsService.createSubscription(createDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findAllSubscriptions() {
    return this.subscriptionsService.findAllSubscriptions();
  }

  @Get('my-subscription')
  async getMySubscription(@Request() req) {
    const userId = req.user.id;
    const subscriptions = await this.subscriptionsService.findSubscriptionsByUser(userId);
    const activeSubscription = await this.subscriptionsService.findActiveSubscriptionByUser(
      userId,
    );
    return {
      subscriptions,
      activeSubscription,
      isActive: activeSubscription !== null,
    };
  }

  @Get('user/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findSubscriptionsByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.subscriptionsService.findSubscriptionsByUser(userId);
  }

  @Get(':id')
  findSubscriptionById(@Param('id', ParseIntPipe) id: number) {
    return this.subscriptionsService.findSubscriptionById(id);
  }

  @Post(':id/activate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  activateSubscription(
    @Param('id', ParseIntPipe) id: number,
    @Body() activateDto: ActivateSubscriptionDto,
  ) {
    return this.subscriptionsService.activateSubscription(id, activateDto);
  }

  @Post(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  cancelSubscription(@Param('id', ParseIntPipe) id: number) {
    return this.subscriptionsService.cancelSubscription(id);
  }
}

