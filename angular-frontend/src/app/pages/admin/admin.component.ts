import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  activeTab: 'users' | 'modules' | 'monitoring' | 'subscriptions' = 'users';

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Check if user is admin - this should be handled by AdminGuard
  }

  setActiveTab(tab: 'users' | 'modules' | 'monitoring' | 'subscriptions'): void {
    this.activeTab = tab;
  }
}

