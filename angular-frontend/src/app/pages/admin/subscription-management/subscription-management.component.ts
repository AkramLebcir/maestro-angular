import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { LanguageService } from '../../../services/language.service';

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
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: number;
  userId: number;
  planId: number;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  startDate: string;
  endDate: string;
  activatedAt?: string;
  cancelledAt?: string;
  notes?: string;
  user?: {
    id: number;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  plan?: SubscriptionPlan;
  payments?: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: number;
  userId: number;
  subscriptionId: number;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  method: 'manual' | 'card' | 'other';
  transactionId?: string;
  receiptNumber?: string;
  notes?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  subscription?: Subscription;
}

export interface SubscriptionStats {
  subscriptions: {
    total: number;
    active: number;
    expired: number;
    pending: number;
  };
  payments: {
    total: number;
    completed: number;
    pending: number;
  };
  revenue: {
    total: number;
  };
}

@Component({
  selector: 'app-subscription-management',
  templateUrl: './subscription-management.component.html',
  styleUrls: ['./subscription-management.component.css']
})
export class SubscriptionManagementComponent implements OnInit {
  activeSection: 'plans' | 'subscriptions' | 'payments' | 'stats' = 'stats';

  // Plans
  plans: SubscriptionPlan[] = [];
  showPlanForm = false;
  editingPlan: SubscriptionPlan | null = null;
  planForm = {
    name: '',
    nameEn: '',
    type: 'semester' as 'semester' | 'annual',
    price: 0,
    durationMonths: 3,
    isActive: true,
    description: '',
    descriptionEn: ''
  };

  // Subscriptions
  subscriptions: Subscription[] = [];
  selectedSubscription: Subscription | null = null;
  showActivateModal = false;
  activateForm = {
    startDate: '',
    notes: ''
  };

  // Payments
  payments: Payment[] = [];
  selectedPayment: Payment | null = null;
  showPaymentForm = false;
  showPaymentUpdateModal = false;
  paymentForm = {
    subscriptionId: 0,
    amount: 0,
    method: 'manual' as 'manual' | 'card' | 'other',
    transactionId: '',
    receiptNumber: '',
    notes: '',
    paidAt: ''
  };
  paymentUpdateForm = {
    status: 'pending' as 'pending' | 'completed' | 'failed' | 'refunded',
    transactionId: '',
    receiptNumber: '',
    notes: '',
    paidAt: ''
  };

  // Stats
  stats: SubscriptionStats | null = null;

  // Users for dropdowns
  users: any[] = [];

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private api: ApiService,
    public languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadPlans();
    this.loadSubscriptions();
    this.loadPayments();
    this.loadUsers();
  }

  setActiveSection(section: 'plans' | 'subscriptions' | 'payments' | 'stats'): void {
    this.activeSection = section;
    this.clearMessages();
    
    // Load data for the active section
    switch (section) {
      case 'stats':
        this.loadStats();
        break;
      case 'plans':
        this.loadPlans();
        break;
      case 'subscriptions':
        this.loadSubscriptions();
        break;
      case 'payments':
        this.loadPayments();
        break;
    }
  }

  // ========== Plans Management ==========

  loadPlans(): void {
    this.isLoading = true;
    this.api.get<SubscriptionPlan[]>('/subscriptions/plans').subscribe({
      next: (data) => {
        this.plans = data || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading plans:', err);
        this.errorMessage = 'حدث خطأ أثناء تحميل الباقات';
        this.plans = [];
        this.isLoading = false;
      }
    });
  }

  openCreatePlanForm(): void {
    this.editingPlan = null;
    this.planForm = {
      name: '',
      nameEn: '',
      type: 'semester',
      price: 0,
      durationMonths: 3,
      isActive: true,
      description: '',
      descriptionEn: ''
    };
    this.showPlanForm = true;
    this.clearMessages();
  }

  openEditPlanForm(plan: SubscriptionPlan): void {
    this.editingPlan = plan;
    this.planForm = {
      name: plan.name,
      nameEn: plan.nameEn,
      type: plan.type,
      price: plan.price,
      durationMonths: plan.durationMonths,
      isActive: plan.isActive,
      description: plan.description || '',
      descriptionEn: plan.descriptionEn || ''
    };
    this.showPlanForm = true;
    this.clearMessages();
  }

  savePlan(): void {
    if (!this.planForm.name || !this.planForm.nameEn || this.planForm.price <= 0) {
      this.errorMessage = 'يرجى ملء جميع الحقول المطلوبة';
      return;
    }

    // Ensure numeric values are sent as numbers, not strings
    const payload = {
      ...this.planForm,
      price: Number(this.planForm.price),
      durationMonths: Number(this.planForm.durationMonths),
      isActive: Boolean(this.planForm.isActive),
    };

    this.isLoading = true;
    const request = this.editingPlan
      ? this.api.patch<SubscriptionPlan>(`/subscriptions/plans/${this.editingPlan.id}`, payload)
      : this.api.post<SubscriptionPlan>('/subscriptions/plans', payload);

    request.subscribe({
      next: () => {
        this.successMessage = this.editingPlan ? 'تم تحديث الباقة بنجاح' : 'تم إنشاء الباقة بنجاح';
        this.closePlanForm();
        this.loadPlans();
        this.loadStats();
      },
      error: (err) => {
        console.error('Error saving plan:', err);
        const errorMsg = err.error?.message || err.message || 'حدث خطأ أثناء حفظ الباقة';
        if (err.error?.message) {
          // If it's a validation error, show the details
          if (Array.isArray(err.error.message)) {
            this.errorMessage = 'أخطاء في التحقق: ' + err.error.message.join(', ');
          } else {
            this.errorMessage = errorMsg;
          }
        } else {
          this.errorMessage = errorMsg;
        }
        this.isLoading = false;
      }
    });
  }

  deletePlan(plan: SubscriptionPlan): void {
    if (!confirm(`هل أنت متأكد من حذف الباقة "${plan.name}"؟`)) {
      return;
    }

    this.isLoading = true;
    this.api.delete(`/subscriptions/plans/${plan.id}`).subscribe({
      next: () => {
        this.successMessage = 'تم حذف الباقة بنجاح';
        this.loadPlans();
        this.loadStats();
      },
      error: (err) => {
        console.error('Error deleting plan:', err);
        this.errorMessage = err.error?.message || 'حدث خطأ أثناء حذف الباقة';
        this.isLoading = false;
      }
    });
  }

  closePlanForm(): void {
    this.showPlanForm = false;
    this.editingPlan = null;
    this.clearMessages();
  }

  // ========== Subscriptions Management ==========

  loadSubscriptions(): void {
    this.isLoading = true;
    this.api.get<Subscription[]>('/subscriptions').subscribe({
      next: (data) => {
        this.subscriptions = data || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading subscriptions:', err);
        this.errorMessage = 'حدث خطأ أثناء تحميل الاشتراكات';
        this.subscriptions = [];
        this.isLoading = false;
      }
    });
  }

  openActivateModal(subscription: Subscription): void {
    this.selectedSubscription = subscription;
    this.activateForm = {
      startDate: new Date().toISOString().split('T')[0],
      notes: ''
    };
    this.showActivateModal = true;
    this.clearMessages();
  }

  activateSubscription(): void {
    if (!this.selectedSubscription) return;

    this.isLoading = true;
    this.api.post(`/subscriptions/${this.selectedSubscription.id}/activate`, this.activateForm).subscribe({
      next: () => {
        this.successMessage = 'تم تفعيل الاشتراك بنجاح';
        this.closeActivateModal();
        this.loadSubscriptions();
        this.loadStats();
      },
      error: (err) => {
        console.error('Error activating subscription:', err);
        this.errorMessage = err.error?.message || 'حدث خطأ أثناء تفعيل الاشتراك';
        this.isLoading = false;
      }
    });
  }

  cancelSubscription(subscription: Subscription): void {
    if (!confirm(`هل أنت متأكد من إلغاء الاشتراك؟`)) {
      return;
    }

    this.isLoading = true;
    this.api.post(`/subscriptions/${subscription.id}/cancel`, {}).subscribe({
      next: () => {
        this.successMessage = 'تم إلغاء الاشتراك بنجاح';
        this.loadSubscriptions();
        this.loadStats();
      },
      error: (err) => {
        console.error('Error cancelling subscription:', err);
        this.errorMessage = 'حدث خطأ أثناء إلغاء الاشتراك';
        this.isLoading = false;
      }
    });
  }

  closeActivateModal(): void {
    this.showActivateModal = false;
    this.selectedSubscription = null;
    this.clearMessages();
  }

  getSubscriptionStatusClass(status: string): string {
    const classes: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      expired: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getSubscriptionStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      active: 'subscriptionManagement.statusActive',
      expired: 'subscriptionManagement.statusExpired',
      cancelled: 'subscriptionManagement.statusCancelled',
      pending: 'subscriptionManagement.statusPending'
    };
    const key = statusMap[status] || status;
    return this.translate(key);
  }

  // ========== Payments Management ==========

  loadPayments(): void {
    this.isLoading = true;
    this.api.get<Payment[]>('/subscriptions/payments').subscribe({
      next: (data) => {
        this.payments = data || [];
        this.isLoading = false;
        this.clearMessages();
      },
      error: (err) => {
        console.error('Error loading payments:', err);
        const errorMsg = err.error?.message || err.message || 'حدث خطأ أثناء تحميل المدفوعات';
        this.errorMessage = `خطأ في تحميل المدفوعات: ${errorMsg}`;
        this.isLoading = false;
        this.payments = []; // Reset to empty array on error
      }
    });
  }

  openCreatePaymentForm(subscription?: Subscription): void {
    this.selectedPayment = null;
    this.paymentForm = {
      subscriptionId: subscription?.id || 0,
      amount: subscription?.plan?.price || 0,
      method: 'manual',
      transactionId: '',
      receiptNumber: '',
      notes: '',
      paidAt: new Date().toISOString().split('T')[0]
    };
    this.showPaymentForm = true;
    this.clearMessages();
  }

  openUpdatePaymentModal(payment: Payment): void {
    this.selectedPayment = payment;
    this.paymentUpdateForm = {
      status: payment.status,
      transactionId: payment.transactionId || '',
      receiptNumber: payment.receiptNumber || '',
      notes: payment.notes || '',
      paidAt: payment.paidAt ? payment.paidAt.split('T')[0] : ''
    };
    this.showPaymentUpdateModal = true;
    this.clearMessages();
  }

  savePayment(): void {
    const subscriptionId = Number(this.paymentForm.subscriptionId);
    const amount = Number(this.paymentForm.amount);
    
    if (!subscriptionId || subscriptionId === 0 || amount <= 0) {
      this.errorMessage = 'يرجى ملء جميع الحقول المطلوبة (الاشتراك والمبلغ)';
      return;
    }

    // Ensure numeric values are sent as numbers, not strings
    const payload = {
      ...this.paymentForm,
      subscriptionId: subscriptionId,
      amount: amount,
    };

    this.isLoading = true;
    this.api.post<Payment>('/subscriptions/payments', payload).subscribe({
      next: () => {
        this.successMessage = 'تم إنشاء سجل الدفع بنجاح';
        this.closePaymentForm();
        this.loadPayments();
        this.loadSubscriptions();
        this.loadStats();
      },
      error: (err) => {
        console.error('Error creating payment:', err);
        const errorMsg = err.error?.message || err.message || 'حدث خطأ أثناء إنشاء سجل الدفع';
        if (err.error?.message) {
          // If it's a validation error, show the details
          if (Array.isArray(err.error.message)) {
            this.errorMessage = 'أخطاء في التحقق: ' + err.error.message.join(', ');
          } else {
            this.errorMessage = errorMsg;
          }
        } else {
          this.errorMessage = errorMsg;
        }
        this.isLoading = false;
      }
    });
  }

  updatePayment(): void {
    if (!this.selectedPayment) return;

    this.isLoading = true;
    this.api.patch<Payment>(`/subscriptions/payments/${this.selectedPayment.id}`, this.paymentUpdateForm).subscribe({
      next: () => {
        this.successMessage = 'تم تحديث سجل الدفع بنجاح';
        this.closePaymentUpdateModal();
        this.loadPayments();
        this.loadSubscriptions();
        this.loadStats();
      },
      error: (err) => {
        console.error('Error updating payment:', err);
        this.errorMessage = err.error?.message || 'حدث خطأ أثناء تحديث سجل الدفع';
        this.isLoading = false;
      }
    });
  }

  closePaymentForm(): void {
    this.showPaymentForm = false;
    this.clearMessages();
  }

  closePaymentUpdateModal(): void {
    this.showPaymentUpdateModal = false;
    this.selectedPayment = null;
    this.clearMessages();
  }

  getPaymentStatusClass(status: string): string {
    const classes: Record<string, string> = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getPaymentStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      completed: 'subscriptionManagement.statusCompleted',
      pending: 'subscriptionManagement.statusPending',
      failed: 'subscriptionManagement.statusFailed',
      refunded: 'subscriptionManagement.statusRefunded'
    };
    const key = statusMap[status] || status;
    return this.translate(key);
  }

  getPaymentMethodText(method: string): string {
    const methodMap: Record<string, string> = {
      manual: 'subscriptionManagement.paymentMethodManual',
      card: 'subscriptionManagement.paymentMethodCard',
      other: 'subscriptionManagement.paymentMethodOther'
    };
    const key = methodMap[method] || method;
    return this.translate(key);
  }

  // ========== Stats ==========

  loadStats(): void {
    this.api.get<SubscriptionStats>('/subscriptions/stats/overview').subscribe({
      next: (data) => {
        this.stats = data;
      },
      error: (err) => {
        console.error('Error loading stats:', err);
        // Fallback stats
        this.stats = {
          subscriptions: { total: 0, active: 0, expired: 0, pending: 0 },
          payments: { total: 0, completed: 0, pending: 0 },
          revenue: { total: 0 }
        };
      }
    });
  }

  // ========== Users ==========

  loadUsers(): void {
    this.api.get<any[]>('/users').subscribe({
      next: (data) => {
        this.users = data.filter(u => u.role === 'teacher');
      },
      error: (err) => {
        console.error('Error loading users:', err);
      }
    });
  }

  // ========== Utility ==========

  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      numberingSystem: 'latn'
    });
  }

  formatCurrency(amount: number): string {
    const lang = this.languageService.getCurrentLanguage();
    const localeMap: { [key: string]: string } = {
      'AR': 'ar-DZ',
      'FR': 'fr-FR',
      'EN': 'en-US',
      'ES': 'es-ES',
      'IT': 'it-IT',
      'DE': 'de-DE',
      'TR': 'tr-TR'
    };
    return new Intl.NumberFormat(localeMap[lang] || 'ar-DZ', {
      style: 'currency',
      currency: 'DZD'
    }).format(amount);
  }

  translate(key: string): string {
    return this.languageService.translate(key);
  }
}

