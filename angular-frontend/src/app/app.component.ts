import { Component, OnInit } from '@angular/core';
import { ApiService } from './services/api.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'angular-frontend';
  backendMessage = 'Loading...';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadBackendData();
  }

  loadBackendData(): void {
    this.apiService.getHello().subscribe({
      next: (message) => {
        this.backendMessage = message;
      },
      error: (error) => {
        console.error('Error fetching data from backend:', error);
        this.backendMessage = 'Error connecting to backend';
      }
    });
  }
}

