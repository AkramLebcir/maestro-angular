import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LanguageService } from '../../services/language.service';

@Component({
  standalone: false,
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  activeTab: 'users' | 'modules' | 'monitoring' | 'subscriptions' = 'users';

  constructor(
    private router: Router,
    public languageService: LanguageService
  ) {}

  ngOnInit(): void {
    // Check if user is admin - this should be handled by AdminGuard
  }

  setActiveTab(tab: 'users' | 'modules' | 'monitoring' | 'subscriptions'): void {
    this.activeTab = tab;
  }

  translate(key: string): string {
    return this.languageService.translate(key);
  }
}

