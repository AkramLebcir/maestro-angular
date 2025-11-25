import { Component } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  teacherName = 'الأستاذ لبصير علاء الدين';
  notificationCount = 3;
}


