import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  teacherName = 'الأستاذ';
  teacherPhotoUrl: string | null = null;
  notificationCount = 3;

  ngOnInit(): void {
    // جلب بيانات بطاقة الأستاذ من التخزين المحلي إن وُجدت
    const stored = localStorage.getItem('teacherCard');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        const firstName = data.firstName || '';
        const lastName = data.lastName || '';

        const fullName = `${firstName} ${lastName}`.trim();
        if (fullName) {
          this.teacherName = fullName;
        }

        if (data.photoDataUrl) {
          this.teacherPhotoUrl = data.photoDataUrl;
        }
      } catch {
        // في حال وجود خطأ في الـ JSON نتجاهله ونبقي القيم الافتراضية
      }
    }
  }
}


