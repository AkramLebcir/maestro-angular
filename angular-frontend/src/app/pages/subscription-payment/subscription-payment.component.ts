import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';

export interface SubscriptionPlan {
  id: number;
  name: string;
  nameEn: string;
  type: 'semester' | 'annual';
  price: number;
  durationMonths: number;
  isActive: boolean;
  description?: string;
  descriptionEn?: string;
}

@Component({
  selector: 'app-subscription-payment',
  templateUrl: './subscription-payment.component.html',
  styleUrls: ['./subscription-payment.component.css']
})
export class SubscriptionPaymentComponent implements OnInit {
  plans: SubscriptionPlan[] = [];
  selectedPlan: SubscriptionPlan | null = null;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPlans();
  }

  loadPlans(): void {
    this.isLoading = true;
    this.api.get<SubscriptionPlan[]>('/subscriptions/plans/active').subscribe({
      next: (data) => {
        this.plans = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading plans:', err);
        this.errorMessage = 'حدث خطأ أثناء تحميل الباقات';
        this.isLoading = false;
      }
    });
  }

  selectPlan(plan: SubscriptionPlan): void {
    this.selectedPlan = plan;
    this.clearMessages();
  }

  requestSubscription(): void {
    if (!this.selectedPlan) {
      this.errorMessage = 'يرجى اختيار باقة';
      return;
    }

    this.isLoading = true;
    // في حالة الدفع اليدوي، ننشئ اشتراك بحالة pending
    // المسؤول سيقوم بتفعيله بعد استلام الدفع
    this.api.post('/subscriptions/request', {
      planId: this.selectedPlan.id,
      notes: 'طلب اشتراك جديد'
    }).subscribe({
      next: () => {
        this.successMessage = 'تم إرسال طلب الاشتراك بنجاح. سيتم تفعيل حسابك بعد استلام الدفع.';
        setTimeout(() => {
          this.router.navigate(['/subscription-status']);
        }, 2000);
      },
      error: (err) => {
        console.error('Error creating subscription:', err);
        this.errorMessage = err.error?.message || 'حدث خطأ أثناء إنشاء طلب الاشتراك';
        this.isLoading = false;
      }
    });
  }

  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ar-DZ', {
      style: 'currency',
      currency: 'DZD'
    }).format(amount);
  }
}

