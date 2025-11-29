import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';

export interface SubscriptionData {
  subscriptions: any[];
  activeSubscription: any | null;
  isActive: boolean;
}

@Component({
  selector: 'app-subscription-status',
  templateUrl: './subscription-status.component.html',
  styleUrls: ['./subscription-status.component.css']
})
export class SubscriptionStatusComponent implements OnInit {
  subscriptionData: SubscriptionData | null = null;
  isLoading = false;
  errorMessage = '';

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSubscriptionStatus();
  }

  loadSubscriptionStatus(): void {
    this.isLoading = true;
    this.api.get<SubscriptionData>('/subscriptions/my-subscription').subscribe({
      next: (data) => {
        this.subscriptionData = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading subscription status:', err);
        this.errorMessage = 'حدث خطأ أثناء تحميل حالة الاشتراك';
        this.isLoading = false;
      }
    });
  }

  goToPayment(): void {
    this.router.navigate(['/subscription-payment']);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getDaysUntilExpiration(endDate: string): number {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
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
    const texts: Record<string, string> = {
      active: 'نشط',
      expired: 'منتهي',
      cancelled: 'ملغي',
      pending: 'قيد الانتظار'
    };
    return texts[status] || status;
  }
}

