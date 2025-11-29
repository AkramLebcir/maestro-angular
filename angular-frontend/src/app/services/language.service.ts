import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type LanguageCode = 'AR' | 'FR' | 'EN' | 'ES' | 'IT' | 'DE' | 'TR';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private currentLanguageSubject = new BehaviorSubject<LanguageCode>('AR');
  public currentLanguage$: Observable<LanguageCode> = this.currentLanguageSubject.asObservable();

  private translations: { [key: string]: { [lang: string]: string } } = {};

  constructor() {
    // جلب اللغة المحفوظة من localStorage
    const savedLang = localStorage.getItem('appLanguage') as LanguageCode;
    if (savedLang && ['AR', 'FR', 'EN', 'ES', 'IT', 'DE', 'TR'].includes(savedLang)) {
      this.currentLanguageSubject.next(savedLang);
      // تحديث اتجاه النص للغة المحفوظة
      document.documentElement.setAttribute('dir', savedLang === 'AR' ? 'rtl' : 'ltr');
      document.documentElement.setAttribute('lang', savedLang.toLowerCase());
    } else {
      // إذا لم تكن هناك لغة محفوظة، استخدم العربية كافتراضية
      this.currentLanguageSubject.next('AR');
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
      localStorage.setItem('appLanguage', 'AR');
    }
    this.loadTranslations();
  }

  getCurrentLanguage(): LanguageCode {
    return this.currentLanguageSubject.value;
  }

  setLanguage(lang: LanguageCode): void {
    this.currentLanguageSubject.next(lang);
    localStorage.setItem('appLanguage', lang);
    // تحديث اتجاه النص
    document.documentElement.setAttribute('dir', lang === 'AR' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang.toLowerCase());
  }

  translate(key: string, params?: { [key: string]: string }): string {
    const lang = this.getCurrentLanguage();
    let translation = this.translations[key]?.[lang] || this.translations[key]?.['AR'] || key;

    // استبدال المعاملات إن وجدت
    if (params) {
      Object.keys(params).forEach(param => {
        translation = translation.replace(`{{${param}}}`, params[param]);
      });
    }

    return translation;
  }

  private loadTranslations(): void {
    this.translations = {
      // Header
      'app.title': {
        'AR': 'Maestro',
        'FR': 'Maestro',
        'EN': 'Maestro',
        'ES': 'Maestro',
        'IT': 'Maestro',
        'DE': 'Maestro',
        'TR': 'Maestro'
      },
      'header.teacher': {
        'AR': 'الأستاذ',
        'FR': 'Professeur',
        'EN': 'Teacher',
        'ES': 'Profesor',
        'IT': 'Insegnante',
        'DE': 'Lehrer',
        'TR': 'Öğretmen'
      },
      'header.notifications': {
        'AR': 'الإشعارات',
        'FR': 'Notifications',
        'EN': 'Notifications',
        'ES': 'Notificaciones',
        'IT': 'Notifiche',
        'DE': 'Benachrichtigungen',
        'TR': 'Bildirimler'
      },
      'header.changeLanguage': {
        'AR': 'تغيير لغة التطبيق',
        'FR': 'Changer la langue',
        'EN': 'Change language',
        'ES': 'Cambiar idioma',
        'IT': 'Cambia lingua',
        'DE': 'Sprache ändern',
        'TR': 'Dili değiştir'
      },
      'header.toggleMenu': {
        'AR': 'فتح وإغلاق القائمة الرئيسية',
        'FR': 'Ouvrir et fermer le menu principal',
        'EN': 'Toggle main menu',
        'ES': 'Alternar menú principal',
        'IT': 'Attiva/disattiva menu principale',
        'DE': 'Hauptmenü umschalten',
        'TR': 'Ana menüyü aç/kapat'
      },

      // Sidebar Menu
      'menu.dashboard': {
        'AR': 'لوحة التحكم',
        'FR': 'Tableau de bord',
        'EN': 'Dashboard',
        'ES': 'Panel de control',
        'IT': 'Cruscotto',
        'DE': 'Dashboard',
        'TR': 'Kontrol Paneli'
      },
      'menu.teacherCard': {
        'AR': 'بطاقة فنية للأستاذ',
        'FR': 'Carte technique du professeur',
        'EN': 'Teacher Technical Card',
        'ES': 'Tarjeta técnica del profesor',
        'IT': 'Scheda tecnica insegnante',
        'DE': 'Lehrer-Technikkarte',
        'TR': 'Öğretmen Teknik Kartı'
      },
      'menu.classes': {
        'AR': 'إدارة الأقسام',
        'FR': 'Gestion des classes',
        'EN': 'Class Management',
        'ES': 'Gestión de clases',
        'IT': 'Gestione classi',
        'DE': 'Klassenverwaltung',
        'TR': 'Sınıf Yönetimi'
      },
      'menu.seatingChart': {
        'AR': 'مخطط المقاعد',
        'FR': 'Plan de placement',
        'EN': 'Seating Chart',
        'ES': 'Plano de asientos',
        'IT': 'Schema posti',
        'DE': 'Sitzplan',
        'TR': 'Oturma Planı'
      },
      'menu.students': {
        'AR': 'إدارة التلاميذ',
        'FR': 'Gestion des élèves',
        'EN': 'Student Management',
        'ES': 'Gestión de estudiantes',
        'IT': 'Gestione studenti',
        'DE': 'Schülerverwaltung',
        'TR': 'Öğrenci Yönetimi'
      },
      'menu.labs': {
        'AR': 'إدارة المخبر',
        'FR': 'Gestion du laboratoire',
        'EN': 'Lab Management',
        'ES': 'Gestión del laboratorio',
        'IT': 'Gestione laboratorio',
        'DE': 'Laborverwaltung',
        'TR': 'Laboratuvar Yönetimi'
      },
      'menu.timetable': {
        'AR': 'جدول الأوقات',
        'FR': 'Emploi du temps',
        'EN': 'Timetable',
        'ES': 'Horario',
        'IT': 'Orario',
        'DE': 'Stundenplan',
        'TR': 'Ders Programı'
      },
      'menu.topics': {
        'AR': 'إدارة المواضيع',
        'FR': 'Gestion des sujets',
        'EN': 'Topic Management',
        'ES': 'Gestión de temas',
        'IT': 'Gestione argomenti',
        'DE': 'Themenverwaltung',
        'TR': 'Konu Yönetimi'
      },
      'menu.notebooks': {
        'AR': 'إدارة الدفاتر',
        'FR': 'Gestion des cahiers',
        'EN': 'Notebook Management',
        'ES': 'Gestión de cuadernos',
        'IT': 'Gestione quaderni',
        'DE': 'Hefteverwaltung',
        'TR': 'Defter Yönetimi'
      },
      'menu.attendance': {
        'AR': 'الحضور',
        'FR': 'Présence',
        'EN': 'Attendance',
        'ES': 'Asistencia',
        'IT': 'Presenze',
        'DE': 'Anwesenheit',
        'TR': 'Yoklama'
      },
      'menu.behavior': {
        'AR': 'إدارة السلوك',
        'FR': 'Gestion du comportement',
        'EN': 'Behavior Management',
        'ES': 'Gestión del comportamiento',
        'IT': 'Gestione comportamento',
        'DE': 'Verhaltensverwaltung',
        'TR': 'Davranış Yönetimi'
      },
      'menu.achievementsPenalties': {
        'AR': 'الإجازات والعقوبات',
        'FR': 'Distinctions & sanctions',
        'EN': 'Achievements & Penalties',
        'ES': 'Logros y sanciones',
        'IT': 'Risultati e sanzioni',
        'DE': 'Erfolge & Sanktionen',
        'TR': 'Başarılar ve Cezalar'
      },
      'menu.gradebook': {
        'AR': 'سجل الدرجات',
        'FR': 'Carnet de notes',
        'EN': 'Gradebook',
        'ES': 'Libro de calificaciones',
        'IT': 'Registro voti',
        'DE': 'Notenbuch',
        'TR': 'Not Defteri'
      },
      'menu.annualDistribution': {
        'AR': 'التوزيع السنوي',
        'FR': 'Répartition annuelle',
        'EN': 'Annual Distribution',
        'ES': 'Distribución anual',
        'IT': 'Distribuzione annuale',
        'DE': 'Jährliche Verteilung',
        'TR': 'Yıllık Dağıtım'
      },
      'menu.progressTracking': {
        'AR': 'متابعة الإنجاز',
        'FR': 'Suivi des progrès',
        'EN': 'Progress Tracking',
        'ES': 'Seguimiento del progreso',
        'IT': 'Monitoraggio progressi',
        'DE': 'Fortschrittsverfolgung',
        'TR': 'İlerleme Takibi'
      },
      'menu.trainingInspection': {
        'AR': 'التكوين والتفتيش',
        'FR': 'Formation et inspection',
        'EN': 'Training & Inspection',
        'ES': 'Formación e inspección',
        'IT': 'Formazione e ispezione',
        'DE': 'Ausbildung & Inspektion',
        'TR': 'Eğitim ve Denetim'
      },
      'menu.teacherNotebook': {
        'AR': 'مفكرة الأستاذ',
        'FR': 'Carnet du professeur',
        'EN': 'Teacher Notebook',
        'ES': 'Cuaderno del profesor',
        'IT': 'Quaderno insegnante',
        'DE': 'Lehrernotizbuch',
        'TR': 'Öğretmen Defteri'
      },
      'menu.pedagogicalDocs': {
        'AR': 'الوثائق البيداغوجية',
        'FR': 'Documents pédagogiques',
        'EN': 'Pedagogical Documents',
        'ES': 'Documentos pedagógicos',
        'IT': 'Documenti pedagogici',
        'DE': 'Pädagogische Dokumente',
        'TR': 'Pedagojik Belgeler'
      },
      'menu.reports': {
        'AR': 'التقارير',
        'FR': 'Rapports',
        'EN': 'Reports',
        'ES': 'Informes',
        'IT': 'Rapporti',
        'DE': 'Berichte',
        'TR': 'Raporlar'
      },
      'menu.settings': {
        'AR': 'الإعدادات',
        'FR': 'Paramètres',
        'EN': 'Settings',
        'ES': 'Configuración',
        'IT': 'Impostazioni',
        'DE': 'Einstellungen',
        'TR': 'Ayarlar'
      },

      // Common
      'common.select': {
        'AR': 'اختر',
        'FR': 'Sélectionner',
        'EN': 'Select',
        'ES': 'Seleccionar',
        'IT': 'Seleziona',
        'DE': 'Auswählen',
        'TR': 'Seç'
      },
      'common.all': {
        'AR': 'الكل',
        'FR': 'Tous',
        'EN': 'All',
        'ES': 'Todos',
        'IT': 'Tutti',
        'DE': 'Alle',
        'TR': 'Tümü'
      },
      'common.save': {
        'AR': 'حفظ',
        'FR': 'Enregistrer',
        'EN': 'Save',
        'ES': 'Guardar',
        'IT': 'Salva',
        'DE': 'Speichern',
        'TR': 'Kaydet'
      },
      'common.cancel': {
        'AR': 'إلغاء',
        'FR': 'Annuler',
        'EN': 'Cancel',
        'ES': 'Cancelar',
        'IT': 'Annulla',
        'DE': 'Abbrechen',
        'TR': 'İptal'
      },
      'common.delete': {
        'AR': 'حذف',
        'FR': 'Supprimer',
        'EN': 'Delete',
        'ES': 'Eliminar',
        'IT': 'Elimina',
        'DE': 'Löschen',
        'TR': 'Sil'
      },
      'common.edit': {
        'AR': 'تعديل',
        'FR': 'Modifier',
        'EN': 'Edit',
        'ES': 'Editar',
        'IT': 'Modifica',
        'DE': 'Bearbeiten',
        'TR': 'Düzenle'
      },
      'common.add': {
        'AR': 'إضافة',
        'FR': 'Ajouter',
        'EN': 'Add',
        'ES': 'Agregar',
        'IT': 'Aggiungi',
        'DE': 'Hinzufügen',
        'TR': 'Ekle'
      },
      'common.close': {
        'AR': 'إغلاق',
        'FR': 'Fermer',
        'EN': 'Close',
        'ES': 'Cerrar',
        'IT': 'Chiudi',
        'DE': 'Schließen',
        'TR': 'Kapat'
      },
      'common.clear': {
        'AR': 'مسح',
        'FR': 'Effacer',
        'EN': 'Clear',
        'ES': 'Limpiar',
        'IT': 'Cancella',
        'DE': 'Löschen',
        'TR': 'Temizle'
      },
      'common.clearAll': {
        'AR': 'مسح الكل',
        'FR': 'Tout effacer',
        'EN': 'Clear All',
        'ES': 'Limpiar todo',
        'IT': 'Cancella tutto',
        'DE': 'Alles löschen',
        'TR': 'Hepsini temizle'
      },
      'common.print': {
        'AR': 'طباعة',
        'FR': 'Imprimer',
        'EN': 'Print',
        'ES': 'Imprimir',
        'IT': 'Stampa',
        'DE': 'Drucken',
        'TR': 'Yazdır'
      },
      'common.export': {
        'AR': 'تصدير',
        'FR': 'Exporter',
        'EN': 'Export',
        'ES': 'Exportar',
        'IT': 'Esporta',
        'DE': 'Exportieren',
        'TR': 'Dışa aktar'
      },
      'common.search': {
        'AR': 'بحث',
        'FR': 'Rechercher',
        'EN': 'Search',
        'ES': 'Buscar',
        'IT': 'Cerca',
        'DE': 'Suchen',
        'TR': 'Ara'
      },
      'common.filter': {
        'AR': 'تصفية',
        'FR': 'Filtrer',
        'EN': 'Filter',
        'ES': 'Filtrar',
        'IT': 'Filtra',
        'DE': 'Filtern',
        'TR': 'Filtrele'
      },
      'common.noData': {
        'AR': 'لا توجد بيانات',
        'FR': 'Aucune donnée',
        'EN': 'No data',
        'ES': 'Sin datos',
        'IT': 'Nessun dato',
        'DE': 'Keine Daten',
        'TR': 'Veri yok'
      },
      'common.loading': {
        'AR': 'جاري التحميل...',
        'FR': 'Chargement...',
        'EN': 'Loading...',
        'ES': 'Cargando...',
        'IT': 'Caricamento...',
        'DE': 'Laden...',
        'TR': 'Yükleniyor...'
      },
      'common.confirm': {
        'AR': 'تأكيد',
        'FR': 'Confirmer',
        'EN': 'Confirm',
        'ES': 'Confirmar',
        'IT': 'Conferma',
        'DE': 'Bestätigen',
        'TR': 'Onayla'
      },
      'common.yes': {
        'AR': 'نعم',
        'FR': 'Oui',
        'EN': 'Yes',
        'ES': 'Sí',
        'IT': 'Sì',
        'DE': 'Ja',
        'TR': 'Evet'
      },
      'common.no': {
        'AR': 'لا',
        'FR': 'Non',
        'EN': 'No',
        'ES': 'No',
        'IT': 'No',
        'DE': 'Nein',
        'TR': 'Hayır'
      },

      // Dashboard
      'dashboard.title': {
        'AR': 'لوحة التحكم',
        'FR': 'Tableau de bord',
        'EN': 'Dashboard',
        'ES': 'Panel de control',
        'IT': 'Cruscotto',
        'DE': 'Dashboard',
        'TR': 'Kontrol Paneli'
      },
      'dashboard.overview': {
        'AR': 'نظرة عامة سريعة على أداء الأقسام والتلاميذ',
        'FR': 'Aperçu rapide de la performance des classes et des élèves',
        'EN': 'Quick overview of class and student performance',
        'ES': 'Vista rápida del rendimiento de clases y estudiantes',
        'IT': 'Panoramica rapida delle prestazioni di classi e studenti',
        'DE': 'Schneller Überblick über Klassen- und Schülerleistungen',
        'TR': 'Sınıf ve öğrenci performansının hızlı özeti'
      },
      'dashboard.averageGradeLabel': {
        'AR': 'معدل النقاط',
        'FR': 'Moyenne des notes',
        'EN': 'Average grade',
        'ES': 'Nota media',
        'IT': 'Voto medio',
        'DE': 'Durchschnittsnote',
        'TR': 'Ortalama not'
      },
      'dashboard.viewReports': {
        'AR': 'عرض التقارير',
        'FR': 'Voir les rapports',
        'EN': 'View reports',
        'ES': 'Ver informes',
        'IT': 'Visualizza rapporti',
        'DE': 'Berichte anzeigen',
        'TR': 'Raporları görüntüle'
      },
      'dashboard.selectClass': {
        'AR': 'اختيار القسم:',
        'FR': 'Sélectionner la classe:',
        'EN': 'Select class:',
        'ES': 'Seleccionar clase:',
        'IT': 'Seleziona classe:',
        'DE': 'Klasse auswählen:',
        'TR': 'Sınıf seç:'
      },
      'dashboard.allClasses': {
        'AR': 'جميع الأقسام',
        'FR': 'Toutes les classes',
        'EN': 'All classes',
        'ES': 'Todas las clases',
        'IT': 'Tutte le classi',
        'DE': 'Alle Klassen',
        'TR': 'Tüm sınıflar'
      },
      'dashboard.generalAverage': {
        'AR': 'المعدل العام (من 20)',
        'FR': 'Moyenne générale (sur 20)',
        'EN': 'General average (out of 20)',
        'ES': 'Promedio general (de 20)',
        'IT': 'Media generale (su 20)',
        'DE': 'Durchschnitt (von 20)',
        'TR': 'Genel ortalama (20 üzerinden)'
      },
      'dashboard.gradeCountsTitle': {
        'AR': 'عدد الدرجات',
        'FR': 'Nombre de notes',
        'EN': 'Grade counts',
        'ES': 'Cantidad de notas',
        'IT': 'Conteggio voti',
        'DE': 'Notenzählung',
        'TR': 'Not Sayımı'
      },
      'dashboard.gradeCountsTotalLabel': {
        'AR': 'المجموع:',
        'FR': 'Total :',
        'EN': 'Total:',
        'ES': 'Total:',
        'IT': 'Totale:',
        'DE': 'Gesamt:',
        'TR': 'Toplam:'
      },
      'dashboard.labDevices': {
        'AR': 'أجهزة المخبر',
        'FR': 'Appareils du laboratoire',
        'EN': 'Lab devices',
        'ES': 'Dispositivos del laboratorio',
        'IT': 'Dispositivi del laboratorio',
        'DE': 'Laborgeräte',
        'TR': 'Laboratuvar cihazları'
      },
      'dashboard.totalStudents': {
        'AR': 'إجمالي التلاميذ',
        'FR': 'Total des élèves',
        'EN': 'Total students',
        'ES': 'Total de estudiantes',
        'IT': 'Totale studenti',
        'DE': 'Gesamtzahl Schüler',
        'TR': 'Toplam öğrenci'
      },
      'dashboard.totalClasses': {
        'AR': 'إجمالي الأقسام',
        'FR': 'Total des classes',
        'EN': 'Total classes',
        'ES': 'Total de clases',
        'IT': 'Totale classi',
        'DE': 'Gesamtzahl Klassen',
        'TR': 'Toplam sınıf'
      },
      'dashboard.attendance': {
        'AR': 'الحضور',
        'FR': 'Présence',
        'EN': 'Attendance',
        'ES': 'Asistencia',
        'IT': 'Presenze',
        'DE': 'Anwesenheit',
        'TR': 'Yoklama'
      },
      'dashboard.behavior': {
        'AR': 'السلوك',
        'FR': 'Comportement',
        'EN': 'Behavior',
        'ES': 'Comportamiento',
        'IT': 'Comportamento',
        'DE': 'Verhalten',
        'TR': 'Davranış'
      },
      'dashboard.behaviorPositive': {
        'AR': 'إيجابي',
        'FR': 'Positif',
        'EN': 'Positive',
        'ES': 'Positivo',
        'IT': 'Positivo',
        'DE': 'Positiv',
        'TR': 'Pozitif'
      },
      'dashboard.behaviorNegative': {
        'AR': 'سلبي',
        'FR': 'Négatif',
        'EN': 'Negative',
        'ES': 'Negativo',
        'IT': 'Negativo',
        'DE': 'Negativ',
        'TR': 'Negatif'
      },
      'dashboard.behaviorPositiveVsNegative': {
        'AR': 'إيجابي مقابل سلبي',
        'FR': 'Positif vs Négatif',
        'EN': 'Positive vs Negative',
        'ES': 'Positivo vs Negativo',
        'IT': 'Positivo vs Negativo',
        'DE': 'Positiv vs Negativ',
        'TR': 'Pozitif vs Negatif'
      },
      'dashboard.present': {
        'AR': 'حاضر',
        'FR': 'Présent',
        'EN': 'Present',
        'ES': 'Presente',
        'IT': 'Presente',
        'DE': 'Anwesend',
        'TR': 'Mevcut'
      },
      'dashboard.absent': {
        'AR': 'غائب',
        'FR': 'Absent',
        'EN': 'Absent',
        'ES': 'Ausente',
        'IT': 'Assente',
        'DE': 'Abwesend',
        'TR': 'Yok'
      },
      'dashboard.excused': {
        'AR': 'مرخّص',
        'FR': 'Excusé',
        'EN': 'Excused',
        'ES': 'Justificado',
        'IT': 'Giustificato',
        'DE': 'Entschuldigt',
        'TR': 'Mazeretli'
      },
      'dashboard.late': {
        'AR': 'متأخر',
        'FR': 'En retard',
        'EN': 'Late',
        'ES': 'Tarde',
        'IT': 'In ritardo',
        'DE': 'Verspätet',
        'TR': 'Geç'
      },
      'dashboard.sick': {
        'AR': 'مريض',
        'FR': 'Malade',
        'EN': 'Sick',
        'ES': 'Enfermo',
        'IT': 'Malato',
        'DE': 'Krank',
        'TR': 'Hasta'
      },
      'dashboard.student': {
        'AR': 'تلميذ',
        'FR': 'Élève',
        'EN': 'Student',
        'ES': 'Estudiante',
        'IT': 'Studente',
        'DE': 'Schüler',
        'TR': 'Öğrenci'
      },
      'dashboard.labStatus': {
        'AR': 'حالة المخبر',
        'FR': 'État du laboratoire',
        'EN': 'Lab status',
        'ES': 'Estado del laboratorio',
        'IT': 'Stato del laboratorio',
        'DE': 'Laborstatus',
        'TR': 'Laboratuvar durumu'
      },
      'dashboard.labFurniture': {
        'AR': 'أثاث المخبر',
        'FR': 'Mobilier du laboratoire',
        'EN': 'Lab furniture',
        'ES': 'Mobiliario del laboratorio',
        'IT': 'Arredamento del laboratorio',
        'DE': 'Labormöbel',
        'TR': 'Laboratuvar mobilyası'
      },
      'dashboard.labCleanliness': {
        'AR': 'نظافة المخبر',
        'FR': 'Propreté du laboratoire',
        'EN': 'Lab cleanliness',
        'ES': 'Limpieza del laboratorio',
        'IT': 'Pulizia del laboratorio',
        'DE': 'Laborsauberkeit',
        'TR': 'Laboratuvar temizliği'
      },
      'dashboard.programProgress': {
        'AR': 'تقدّم إنجاز البرنامج',
        'FR': 'Progression du programme',
        'EN': 'Program progress',
        'ES': 'Progreso del programa',
        'IT': 'Progresso del programma',
        'DE': 'Programmfortschritt',
        'TR': 'Program ilerlemesi'
      },
      'dashboard.programProgressForClass': {
        'AR': 'تقدّم البرنامج للقسم المختار فقط',
        'FR': 'Progression du programme pour la classe sélectionnée uniquement',
        'EN': 'Program progress for selected class only',
        'ES': 'Progreso del programa solo para la clase seleccionada',
        'IT': 'Progresso del programma solo per la classe selezionata',
        'DE': 'Programmfortschritt nur für ausgewählte Klasse',
        'TR': 'Yalnızca seçili sınıf için program ilerlemesi'
      },
      'dashboard.programProgressAllClassesLabel': {
        'AR': 'تقدّم البرنامج لجميع الأقسام (المعدل العام)',
        'FR': 'Progression du programme pour toutes les classes (Moyenne générale)',
        'EN': 'Program progress for all classes (General average)',
        'ES': 'Progreso del programa para todas las clases (Promedio general)',
        'IT': 'Progresso del programma per tutte le classi (Media generale)',
        'DE': 'Programmfortschritt für alle Klassen (Gesamtdurchschnitt)',
        'TR': 'Tüm sınıflar için program ilerlemesi (Genel ortalama)'
      },
      'dashboard.noProgressData': {
        'AR': 'لا توجد بيانات تقدّم مسجّلة لهذا القسم في البرنامج.',
        'FR': 'Aucune donnée de progression enregistrée pour cette classe dans le programme.',
        'EN': 'No progress data recorded for this class in the program.',
        'ES': 'No hay datos de progreso registrados para esta clase en el programa.',
        'IT': 'Nessun dato di progresso registrato per questa classe nel programma.',
        'DE': 'Keine Fortschrittsdaten für diese Klasse im Programm erfasst.',
        'TR': 'Bu sınıf için programda kayıtlı ilerleme verisi yok.'
      },
      'dashboard.gradeDistribution': {
        'AR': 'توزيع الدرجات',
        'FR': 'Répartition des notes',
        'EN': 'Grade distribution',
        'ES': 'Distribución de calificaciones',
        'IT': 'Distribuzione dei voti',
        'DE': 'Notenverteilung',
        'TR': 'Not dağılımı'
      },
      'dashboard.classSummary': {
        'AR': 'ملخص القسم',
        'FR': 'Résumé de la classe',
        'EN': 'Class summary',
        'ES': 'Resumen de la clase',
        'IT': 'Riepilogo della classe',
        'DE': 'Klassenzusammenfassung',
        'TR': 'Sınıf özeti'
      },
      'dashboard.attendanceRate': {
        'AR': 'معدل الحضور',
        'FR': 'Taux de présence',
        'EN': 'Attendance rate',
        'ES': 'Tasa de asistencia',
        'IT': 'Tasso di presenza',
        'DE': 'Anwesenheitsrate',
        'TR': 'Yoklama oranı'
      },
      'dashboard.seatingChart': {
        'AR': 'مخطط المقاعد',
        'FR': 'Plan de placement',
        'EN': 'Seating chart',
        'ES': 'Plano de asientos',
        'IT': 'Schema posti',
        'DE': 'Sitzplan',
        'TR': 'Oturma planı'
      },
      'dashboard.openChart': {
        'AR': 'فتح المخطط',
        'FR': 'Ouvrir le plan',
        'EN': 'Open chart',
        'ES': 'Abrir plano',
        'IT': 'Apri schema',
        'DE': 'Plan öffnen',
        'TR': 'Planı aç'
      },
      'dashboard.highestGrade': {
        'AR': 'أعلى درجة',
        'FR': 'Note la plus élevée',
        'EN': 'Highest grade',
        'ES': 'Calificación más alta',
        'IT': 'Voto più alto',
        'DE': 'Höchste Note',
        'TR': 'En yüksek not'
      },
      'dashboard.lowestGrade': {
        'AR': 'أقل درجة',
        'FR': 'Note la plus basse',
        'EN': 'Lowest grade',
        'ES': 'Calificación más baja',
        'IT': 'Voto più basso',
        'DE': 'Niedrigste Note',
        'TR': 'En düşük not'
      },
      'notifications.title': {
        'AR': 'الإشعارات',
        'FR': 'Notifications',
        'EN': 'Notifications',
        'ES': 'Notificaciones',
        'IT': 'Notifiche',
        'DE': 'Benachrichtigungen',
        'TR': 'Bildirimler'
      },
      'notifications.markAllRead': {
        'AR': 'وضع علامة قراءة على الكل',
        'FR': 'Marquer tout comme lu',
        'EN': 'Mark all as read',
        'ES': 'Marcar todo como leído',
        'IT': 'Segna tutto come letto',
        'DE': 'Alle als gelesen markieren',
        'TR': 'Tümünü okundu olarak işaretle'
      },
      'notifications.viewAll': {
        'AR': 'عرض جميع الإشعارات',
        'FR': 'Voir toutes les notifications',
        'EN': 'View all notifications',
        'ES': 'Ver todas las notificaciones',
        'IT': 'Visualizza tutte le notifiche',
        'DE': 'Alle Benachrichtigungen anzeigen',
        'TR': 'Tüm bildirimleri görüntüle'
      },
      'notifications.loading': {
        'AR': 'جاري تحميل الإشعارات...',
        'FR': 'Chargement des notifications...',
        'EN': 'Loading notifications...',
        'ES': 'Cargando notificaciones...',
        'IT': 'Caricamento notifiche...',
        'DE': 'Benachrichtigungen werden geladen...',
        'TR': 'Bildirimler yükleniyor...'
      },
      'notifications.none': {
        'AR': 'لا توجد إخطارات',
        'FR': 'Aucune notification',
        'EN': 'No notifications',
        'ES': 'No hay notificaciones',
        'IT': 'Nessuna notifica',
        'DE': 'Keine Benachrichtigungen',
        'TR': 'Bildirim yok'
      },
      'dashboard.classAverage': {
        'AR': 'معدل القسم',
        'FR': 'Moyenne de la classe',
        'EN': 'Class average',
        'ES': 'Promedio de la clase',
        'IT': 'Media della classe',
        'DE': 'Klassendurchschnitt',
        'TR': 'Sınıf ortalaması'
      },

      // Teacher Notebook
      'teacherNotebook.title': {
        'AR': 'مفكرة الأستاذ',
        'FR': 'Carnet du professeur',
        'EN': 'Teacher Notebook',
        'ES': 'Cuaderno del profesor',
        'IT': 'Quaderno insegnante',
        'DE': 'Lehrernotizbuch',
        'TR': 'Öğretmen Defteri'
      },
      'teacherNotebook.description': {
        'AR': 'سبورة بيضاء لإضافة ملاحظات سريعة على شكل بطاقات لاصقة ملوّنة.',
        'FR': 'Tableau blanc pour ajouter des notes rapides sous forme de cartes autocollantes colorées.',
        'EN': 'Whiteboard to add quick notes in the form of colored sticky notes.',
        'ES': 'Pizarra para agregar notas rápidas en forma de notas adhesivas de colores.',
        'IT': 'Lavagna per aggiungere note rapide sotto forma di note adesive colorate.',
        'DE': 'Whiteboard zum Hinzufügen schneller Notizen in Form von farbigen Haftnotizen.',
        'TR': 'Renkli yapışkan notlar şeklinde hızlı notlar eklemek için beyaz tahta.'
      },
      'teacherNotebook.addNote': {
        'AR': 'إضافة ملاحظة:',
        'FR': 'Ajouter une note:',
        'EN': 'Add note:',
        'ES': 'Agregar nota:',
        'IT': 'Aggiungi nota:',
        'DE': 'Notiz hinzufügen:',
        'TR': 'Not ekle:'
      },
      'teacherNotebook.yellow': {
        'AR': 'أصفر',
        'FR': 'Jaune',
        'EN': 'Yellow',
        'ES': 'Amarillo',
        'IT': 'Giallo',
        'DE': 'Gelb',
        'TR': 'Sarı'
      },
      'teacherNotebook.pink': {
        'AR': 'وردي',
        'FR': 'Rose',
        'EN': 'Pink',
        'ES': 'Rosa',
        'IT': 'Rosa',
        'DE': 'Rosa',
        'TR': 'Pembe'
      },
      'teacherNotebook.blue': {
        'AR': 'أزرق',
        'FR': 'Bleu',
        'EN': 'Blue',
        'ES': 'Azul',
        'IT': 'Blu',
        'DE': 'Blau',
        'TR': 'Mavi'
      },
      'teacherNotebook.green': {
        'AR': 'أخضر',
        'FR': 'Vert',
        'EN': 'Green',
        'ES': 'Verde',
        'IT': 'Verde',
        'DE': 'Grün',
        'TR': 'Yeşil'
      },
      'teacherNotebook.placeholder': {
        'AR': 'اكتب مذكّرتك هنا...',
        'FR': 'Écrivez votre note ici...',
        'EN': 'Write your note here...',
        'ES': 'Escribe tu nota aquí...',
        'IT': 'Scrivi la tua nota qui...',
        'DE': 'Schreiben Sie Ihre Notiz hier...',
        'TR': 'Notunuzu buraya yazın...'
      },
      'teacherNotebook.emptyState': {
        'AR': 'ابدأ بإضافة بطاقة ملاحظة من الأعلى لوضع أفكارك على السبورة.',
        'FR': 'Commencez par ajouter une carte de note depuis le haut pour mettre vos idées sur le tableau.',
        'EN': 'Start by adding a note card from the top to put your ideas on the board.',
        'ES': 'Comience agregando una tarjeta de nota desde arriba para poner sus ideas en el tablero.',
        'IT': 'Inizia aggiungendo una scheda di nota dall\'alto per mettere le tue idee sulla lavagna.',
        'DE': 'Beginnen Sie damit, eine Notizkarte von oben hinzuzufügen, um Ihre Ideen auf das Board zu setzen.',
        'TR': 'Fikirlerinizi tahtaya koymak için yukarıdan bir not kartı ekleyerek başlayın.'
      },
      'teacherNotebook.clearConfirm': {
        'AR': 'هل تريد مسح جميع الملاحظات من السبورة؟',
        'FR': 'Voulez-vous effacer toutes les notes du tableau?',
        'EN': 'Do you want to clear all notes from the board?',
        'ES': '¿Desea borrar todas las notas del tablero?',
        'IT': 'Vuoi cancellare tutte le note dalla lavagna?',
        'DE': 'Möchten Sie alle Notizen vom Board löschen?',
        'TR': 'Tahtadaki tüm notları temizlemek istiyor musunuz?'
      },

      // Training & Inspection
      'trainingInspection.title': {
        'AR': 'التكوين والتفتيش',
        'FR': 'Formation et inspection',
        'EN': 'Training & Inspection',
        'ES': 'Formación e inspección',
        'IT': 'Formazione e ispezione',
        'DE': 'Ausbildung & Inspektion',
        'TR': 'Eğitim ve Denetim'
      },
      'trainingInspection.description': {
        'AR': 'مساحة لتتبع مسارك التكويني وزيارات المفتش والملاحظات اليومية.',
        'FR': 'Espace pour suivre votre parcours de formation, les visites de l\'inspecteur et les notes quotidiennes.',
        'EN': 'Space to track your training path, inspector visits and daily notes.',
        'ES': 'Espacio para rastrear su trayectoria de formación, visitas del inspector y notas diarias.',
        'IT': 'Spazio per tracciare il tuo percorso di formazione, visite dell\'ispettore e note quotidiane.',
        'DE': 'Raum zur Verfolgung Ihres Ausbildungswegs, Inspektorenbesuche und täglichen Notizen.',
        'TR': 'Eğitim yolunuzu, müfettiş ziyaretlerini ve günlük notları takip etmek için alan.'
      },
      'trainingInspection.trainingLog': {
        'AR': 'سجل التكوين',
        'FR': 'Registre de formation',
        'EN': 'Training log',
        'ES': 'Registro de formación',
        'IT': 'Registro di formazione',
        'DE': 'Ausbildungsprotokoll',
        'TR': 'Eğitim kaydı'
      },
      'trainingInspection.inspectorVisits': {
        'AR': 'زيارات المفتش',
        'FR': 'Visites de l\'inspecteur',
        'EN': 'Inspector visits',
        'ES': 'Visitas del inspector',
        'IT': 'Visite dell\'ispettore',
        'DE': 'Inspektorenbesuche',
        'TR': 'Müfettiş ziyaretleri'
      },
      'trainingInspection.dailyNotes': {
        'AR': 'دفتر الملاحظات اليومية',
        'FR': 'Carnet de notes quotidiennes',
        'EN': 'Daily notes notebook',
        'ES': 'Cuaderno de notas diarias',
        'IT': 'Quaderno note quotidiane',
        'DE': 'Tägliches Notizbuch',
        'TR': 'Günlük not defteri'
      },
      'trainingInspection.educationalSeminars': {
        'AR': 'الندوات التربوية',
        'FR': 'Séminaires pédagogiques',
        'EN': 'Educational seminars',
        'ES': 'Seminarios educativos',
        'IT': 'Seminari educativi',
        'DE': 'Bildungsseminare',
        'TR': 'Eğitim seminerleri'
      },
      'trainingInspection.pedagogicalVisits': {
        'AR': 'الزيارات التربوية',
        'FR': 'Visites pédagogiques',
        'EN': 'Pedagogical visits',
        'ES': 'Visitas pedagógicas',
        'IT': 'Visite pedagogiche',
        'DE': 'Pädagogische Besuche',
        'TR': 'Pedagojik ziyaretler'
      },
      'trainingInspection.trainingDate': {
        'AR': 'تاريخ التكوين :',
        'FR': 'Date de formation :',
        'EN': 'Training date:',
        'ES': 'Fecha de formación:',
        'IT': 'Data di formazione:',
        'DE': 'Ausbildungsdatum:',
        'TR': 'Eğitim tarihi:'
      },
      'trainingInspection.trainingTopic': {
        'AR': 'موضوع التكوين :',
        'FR': 'Sujet de formation :',
        'EN': 'Training topic:',
        'ES': 'Tema de formación:',
        'IT': 'Argomento di formazione:',
        'DE': 'Ausbildungsthema:',
        'TR': 'Eğitim konusu:'
      },
      'trainingInspection.organizer': {
        'AR': 'الجهة المنظمة :',
        'FR': 'Organisateur :',
        'EN': 'Organizer:',
        'ES': 'Organizador:',
        'IT': 'Organizzatore:',
        'DE': 'Organisator:',
        'TR': 'Organizatör:'
      },
      'trainingInspection.location': {
        'AR': 'مكان التكوين :',
        'FR': 'Lieu de formation :',
        'EN': 'Training location:',
        'ES': 'Ubicación de formación:',
        'IT': 'Luogo di formazione:',
        'DE': 'Ausbildungsort:',
        'TR': 'Eğitim yeri:'
      },
      'trainingInspection.instructions': {
        'AR': 'توجيهات / توصيات / تعليمات :',
        'FR': 'Orientations / Recommandations / Instructions :',
        'EN': 'Guidelines / Recommendations / Instructions:',
        'ES': 'Orientaciones / Recomendaciones / Instrucciones:',
        'IT': 'Linee guida / Raccomandazioni / Istruzioni:',
        'DE': 'Richtlinien / Empfehlungen / Anweisungen:',
        'TR': 'Yönergeler / Öneriler / Talimatlar:'
      },
      'trainingInspection.trainingFile': {
        'AR': 'ملف التكوين :',
        'FR': 'Fichier de formation :',
        'EN': 'Training file:',
        'ES': 'Archivo de formación:',
        'IT': 'File di formazione:',
        'DE': 'Ausbildungsdatei:',
        'TR': 'Eğitim dosyası:'
      },
      'trainingInspection.savedTrainingLog': {
        'AR': 'سجل التكوين المحفوظ',
        'FR': 'Registre de formation enregistré',
        'EN': 'Saved training log',
        'ES': 'Registro de formación guardado',
        'IT': 'Registro di formazione salvato',
        'DE': 'Gespeichertes Ausbildungsprotokoll',
        'TR': 'Kaydedilmiş eğitim kaydı'
      },
      'trainingInspection.trainingReport': {
        'AR': 'تقرير سجل التكوين',
        'FR': 'Rapport du registre de formation',
        'EN': 'Training log report',
        'ES': 'Informe del registro de formación',
        'IT': 'Rapporto registro di formazione',
        'DE': 'Ausbildungsprotokollbericht',
        'TR': 'Eğitim kaydı raporu'
      },
      'trainingInspection.noTrainingRecords': {
        'AR': 'لا توجد سجلات تكوين بعد.',
        'FR': 'Aucun enregistrement de formation pour le moment.',
        'EN': 'No training records yet.',
        'ES': 'Aún no hay registros de formación.',
        'IT': 'Nessun registro di formazione ancora.',
        'DE': 'Noch keine Ausbildungsaufzeichnungen.',
        'TR': 'Henüz eğitim kaydı yok.'
      },
      'trainingInspection.visitType': {
        'AR': 'نوع الزيارة :',
        'FR': 'Type de visite :',
        'EN': 'Visit type:',
        'ES': 'Tipo de visita:',
        'IT': 'Tipo di visita:',
        'DE': 'Besuchstyp:',
        'TR': 'Ziyaret türü:'
      },
      'trainingInspection.visitTypePlaceholder': {
        'AR': 'مثال: زيارة بيداغوجية، متابعة، تفتيش شامل...',
        'FR': 'Ex: visite pédagogique, suivi, inspection complète...',
        'EN': 'Example: pedagogical visit, follow-up, full inspection...',
        'ES': 'Ejemplo: visita pedagógica, seguimiento, inspección completa...',
        'IT': 'Esempio: visita pedagogica, follow-up, ispezione completa...',
        'DE': 'Beispiel: pädagogischer Besuch, Nachbereitung, vollständige Inspektion...',
        'TR': 'Örnek: pedagojik ziyaret, takip, tam denetim...'
      },
      'trainingInspection.inspectorReport': {
        'AR': 'تقرير زيارات المفتش',
        'FR': 'Rapport des visites de l\'inspecteur',
        'EN': 'Inspector visits report',
        'ES': 'Informe de visitas del inspector',
        'IT': 'Rapporto visite dell\'ispettore',
        'DE': 'Inspektorenbesuchsbericht',
        'TR': 'Müfettiş ziyaretleri raporu'
      },
      'trainingInspection.notesNotebook': {
        'AR': 'دفتر الملاحظات',
        'FR': 'Carnet de notes',
        'EN': 'Notes notebook',
        'ES': 'Cuaderno de notas',
        'IT': 'Quaderno note',
        'DE': 'Notizbuch',
        'TR': 'Not defteri'
      },
      'trainingInspection.dailyNotesReport': {
        'AR': 'تقرير دفتر الملاحظات اليومية',
        'FR': 'Rapport du carnet de notes quotidiennes',
        'EN': 'Daily notes notebook report',
        'ES': 'Informe del cuaderno de notas diarias',
        'IT': 'Rapporto quaderno note quotidiane',
        'DE': 'Tägliches Notizbuchbericht',
        'TR': 'Günlük not defteri raporu'
      },
      'trainingInspection.seminarTitle': {
        'AR': 'عنوان الندوة / الموضوع :',
        'FR': 'Titre du séminaire / Sujet :',
        'EN': 'Seminar title / Topic:',
        'ES': 'Título del seminario / Tema:',
        'IT': 'Titolo del seminario / Argomento:',
        'DE': 'Seminartitel / Thema:',
        'TR': 'Seminer başlığı / Konu:'
      },
      'trainingInspection.seminarReport': {
        'AR': 'تقرير الندوات التربوية',
        'FR': 'Rapport des séminaires pédagogiques',
        'EN': 'Educational seminars report',
        'ES': 'Informe de seminarios educativos',
        'IT': 'Rapporto seminari educativi',
        'DE': 'Bildungsseminarebericht',
        'TR': 'Eğitim seminerleri raporu'
      },
      'trainingInspection.classLevel': {
        'AR': 'القسم والمستوى :',
        'FR': 'Classe et niveau :',
        'EN': 'Class and level:',
        'ES': 'Clase y nivel:',
        'IT': 'Classe e livello:',
        'DE': 'Klasse und Niveau:',
        'TR': 'Sınıf ve seviye:'
      },
      'trainingInspection.pedagogicalReport': {
        'AR': 'تقرير الزيارات التربوية',
        'FR': 'Rapport des visites pédagogiques',
        'EN': 'Pedagogical visits report',
        'ES': 'Informe de visitas pedagógicas',
        'IT': 'Rapporto visite pedagogiche',
        'DE': 'Pädagogische Besuchsbericht',
        'TR': 'Pedagojik ziyaretler raporu'
      },
      'trainingInspection.visitor': {
        'AR': 'الزائر',
        'FR': 'Visiteur',
        'EN': 'Visitor',
        'ES': 'Visitante',
        'IT': 'Visitatore',
        'DE': 'Besucher',
        'TR': 'Ziyaretçi'
      },
      'trainingInspection.unspecified': {
        'AR': 'غير محدد',
        'FR': 'Non spécifié',
        'EN': 'Unspecified',
        'ES': 'No especificado',
        'IT': 'Non specificato',
        'DE': 'Nicht angegeben',
        'TR': 'Belirtilmemiş'
      },

      // Header
      'header.teacherPhoto': {
        'AR': 'صورة الأستاذ',
        'FR': 'Photo du professeur',
        'EN': 'Teacher photo',
        'ES': 'Foto del profesor',
        'IT': 'Foto dell\'insegnante',
        'DE': 'Lehrerfoto',
        'TR': 'Öğretmen fotoğrafı'
      },

      // Gradebook
      'gradebook.title': {
        'AR': 'سجل الدرجات',
        'FR': 'Carnet de notes',
        'EN': 'Gradebook',
        'ES': 'Libro de calificaciones',
        'IT': 'Registro voti',
        'DE': 'Notenbuch',
        'TR': 'Not Defteri'
      },
      'gradebook.class': {
        'AR': 'القسم',
        'FR': 'Classe',
        'EN': 'Class',
        'ES': 'Clase',
        'IT': 'Classe',
        'DE': 'Klasse',
        'TR': 'Sınıf'
      },
      'gradebook.selectClass': {
        'AR': 'اختر القسم',
        'FR': 'Sélectionner la classe',
        'EN': 'Select class',
        'ES': 'Seleccionar clase',
        'IT': 'Seleziona classe',
        'DE': 'Klasse auswählen',
        'TR': 'Sınıf seç'
      },
      'gradebook.term': {
        'AR': 'الفصل الدراسي',
        'FR': 'Trimestre',
        'EN': 'Term',
        'ES': 'Trimestre',
        'IT': 'Trimestre',
        'DE': 'Trimester',
        'TR': 'Dönem'
      },
      'gradebook.term1': {
        'AR': 'الفصل الأول',
        'FR': 'Premier trimestre',
        'EN': 'First term',
        'ES': 'Primer trimestre',
        'IT': 'Primo trimestre',
        'DE': 'Erstes Trimester',
        'TR': 'Birinci dönem'
      },
      'gradebook.term2': {
        'AR': 'الفصل الثاني',
        'FR': 'Deuxième trimestre',
        'EN': 'Second term',
        'ES': 'Segundo trimestre',
        'IT': 'Secondo trimestre',
        'DE': 'Zweites Trimester',
        'TR': 'İkinci dönem'
      },
      'gradebook.term3': {
        'AR': 'الفصل الثالث',
        'FR': 'Troisième trimestre',
        'EN': 'Third term',
        'ES': 'Tercer trimestre',
        'IT': 'Terzo trimestre',
        'DE': 'Drittes Trimester',
        'TR': 'Üçüncü dönem'
      },
      'gradebook.date': {
        'AR': 'التاريخ',
        'FR': 'Date',
        'EN': 'Date',
        'ES': 'Fecha',
        'IT': 'Data',
        'DE': 'Datum',
        'TR': 'Tarih'
      },
      'gradebook.reports': {
        'AR': 'التقارير',
        'FR': 'Rapports',
        'EN': 'Reports',
        'ES': 'Informes',
        'IT': 'Rapporti',
        'DE': 'Berichte',
        'TR': 'Raporlar'
      },
      'gradebook.entry': {
        'AR': 'إدخال الدرجات',
        'FR': 'Saisie des notes',
        'EN': 'Grade entry',
        'ES': 'Entrada de calificaciones',
        'IT': 'Inserimento voti',
        'DE': 'Noteneingabe',
        'TR': 'Not girişi'
      },
      'gradebook.viewGrades': {
        'AR': 'عرض الدرجات',
        'FR': 'Afficher les notes',
        'EN': 'View grades',
        'ES': 'Ver calificaciones',
        'IT': 'Visualizza voti',
        'DE': 'Noten anzeigen',
        'TR': 'Notları görüntüle'
      },
      'gradebook.analysis': {
        'AR': 'تحليل البيانات',
        'FR': 'Analyse des données',
        'EN': 'Data analysis',
        'ES': 'Análisis de datos',
        'IT': 'Analisi dati',
        'DE': 'Datenanalyse',
        'TR': 'Veri analizi'
      },
      'gradebook.exportExcel': {
        'AR': 'تصدير إلى Excel',
        'FR': 'Exporter vers Excel',
        'EN': 'Export to Excel',
        'ES': 'Exportar a Excel',
        'IT': 'Esporta in Excel',
        'DE': 'Nach Excel exportieren',
        'TR': 'Excel\'e aktar'
      },
      'gradebook.importExcel': {
        'AR': 'استيراد من Excel',
        'FR': 'Importer depuis Excel',
        'EN': 'Import from Excel',
        'ES': 'Importar desde Excel',
        'IT': 'Importa da Excel',
        'DE': 'Von Excel importieren',
        'TR': 'Excel\'den içe aktar'
      },
      'gradebook.idNumber': {
        'AR': 'رقم الهوية أو الكود',
        'FR': 'Numéro d\'identité ou code',
        'EN': 'ID number or code',
        'ES': 'Número de identificación o código',
        'IT': 'Numero identificativo o codice',
        'DE': 'Ausweisnummer oder Code',
        'TR': 'Kimlik numarası veya kod'
      },
      'gradebook.studentName': {
        'AR': 'اسم التلميذ',
        'FR': 'Nom de l\'élève',
        'EN': 'Student name',
        'ES': 'Nombre del estudiante',
        'IT': 'Nome dello studente',
        'DE': 'Schülername',
        'TR': 'Öğrenci adı'
      },
      'gradebook.notebookCorrection': {
        'AR': 'تصحيح الدفتر',
        'FR': 'Correction du cahier',
        'EN': 'Notebook correction',
        'ES': 'Corrección del cuaderno',
        'IT': 'Correzione quaderno',
        'DE': 'Heftekorrektur',
        'TR': 'Defter düzeltme'
      },
      'gradebook.attendance': {
        'AR': 'الحضور (5)',
        'FR': 'Présence (5)',
        'EN': 'Attendance (5)',
        'ES': 'Asistencia (5)',
        'IT': 'Presenze (5)',
        'DE': 'Anwesenheit (5)',
        'TR': 'Yoklama (5)'
      },
      'gradebook.behavior': {
        'AR': 'السلوك (5)',
        'FR': 'Comportement (5)',
        'EN': 'Behavior (5)',
        'ES': 'Comportamiento (5)',
        'IT': 'Comportamento (5)',
        'DE': 'Verhalten (5)',
        'TR': 'Davranış (5)'
      },
      'gradebook.average': {
        'AR': 'المعدل',
        'FR': 'Moyenne',
        'EN': 'Average',
        'ES': 'Promedio',
        'IT': 'Media',
        'DE': 'Durchschnitt',
        'TR': 'Ortalama'
      },
      'gradebook.classAverage': {
        'AR': 'معدل القسم:',
        'FR': 'Moyenne de la classe:',
        'EN': 'Class average:',
        'ES': 'Promedio de la clase:',
        'IT': 'Media della classe:',
        'DE': 'Klassendurchschnitt:',
        'TR': 'Sınıf ortalaması:'
      },
      'gradebook.noStudents': {
        'AR': 'لا يوجد تلاميذ في هذا القسم',
        'FR': 'Aucun élève dans cette classe',
        'EN': 'No students in this class',
        'ES': 'No hay estudiantes en esta clase',
        'IT': 'Nessuno studente in questa classe',
        'DE': 'Keine Schüler in dieser Klasse',
        'TR': 'Bu sınıfta öğrenci yok'
      },
      'gradebook.selectClassFirst': {
        'AR': 'يرجى اختيار قسم لعرض الدرجات',
        'FR': 'Veuillez sélectionner une classe pour afficher les notes',
        'EN': 'Please select a class to view grades',
        'ES': 'Por favor seleccione una clase para ver las calificaciones',
        'IT': 'Si prega di selezionare una classe per visualizzare i voti',
        'DE': 'Bitte wählen Sie eine Klasse aus, um Noten anzuzeigen',
        'TR': 'Notları görüntülemek için lütfen bir sınıf seçin'
      },
      'gradebook.enterGrade': {
        'AR': 'إدخال درجة:',
        'FR': 'Saisir une note:',
        'EN': 'Enter grade:',
        'ES': 'Ingresar calificación:',
        'IT': 'Inserisci voto:',
        'DE': 'Note eingeben:',
        'TR': 'Not girin:'
      },
      'gradebook.grade': {
        'AR': 'الدرجة *',
        'FR': 'Note *',
        'EN': 'Grade *',
        'ES': 'Calificación *',
        'IT': 'Voto *',
        'DE': 'Note *',
        'TR': 'Not *'
      },
      'gradebook.gradeDistribution': {
        'AR': 'توزيع الدرجات حسب النطاقات',
        'FR': 'Répartition des notes par tranches',
        'EN': 'Grade distribution by ranges',
        'ES': 'Distribución de calificaciones por rangos',
        'IT': 'Distribuzione voti per fasce',
        'DE': 'Notenverteilung nach Bereichen',
        'TR': 'Aralıklara göre not dağılımı'
      },
      'gradebook.studentDistribution': {
        'AR': 'توزيع التلاميذ حسب الفئات',
        'FR': 'Répartition des élèves par catégories',
        'EN': 'Student distribution by categories',
        'ES': 'Distribución de estudiantes por categorías',
        'IT': 'Distribuzione studenti per categorie',
        'DE': 'Schülerverteilung nach Kategorien',
        'TR': 'Kategorilere göre öğrenci dağılımı'
      },
      'gradebook.gradeByGender': {
        'AR': 'توزيع الدرجات حسب الجنس',
        'FR': 'Répartition des notes par sexe',
        'EN': 'Grade distribution by gender',
        'ES': 'Distribución de calificaciones por género',
        'IT': 'Distribuzione voti per genere',
        'DE': 'Notenverteilung nach Geschlecht',
        'TR': 'Cinsiyete göre not dağılımı'
      },
      'gradebook.studentsWithAverage10': {
        'AR': 'عدد التلاميذ بمعدل ≥ 10',
        'FR': 'Nombre d\'élèves avec moyenne ≥ 10',
        'EN': 'Students with average ≥ 10',
        'ES': 'Estudiantes con promedio ≥ 10',
        'IT': 'Studenti con media ≥ 10',
        'DE': 'Schüler mit Durchschnitt ≥ 10',
        'TR': 'Ortalaması ≥ 10 olan öğrenciler'
      },
      'gradebook.studentsWithAverageBelow10': {
        'AR': 'عدد التلاميذ بمعدل < 10',
        'FR': 'Nombre d\'élèves avec moyenne < 10',
        'EN': 'Students with average < 10',
        'ES': 'Estudiantes con promedio < 10',
        'IT': 'Studenti con media < 10',
        'DE': 'Schüler mit Durchschnitt < 10',
        'TR': 'Ortalaması < 10 olan öğrenciler'
      },
      'gradebook.openGradebook': {
        'AR': 'فتح السجل',
        'FR': 'Ouvrir le carnet',
        'EN': 'Open gradebook',
        'ES': 'Abrir libro de calificaciones',
        'IT': 'Apri registro',
        'DE': 'Notenbuch öffnen',
        'TR': 'Not defterini aç'
      },
      'gradebook.excelImportNote': {
        'AR': 'يرجى اختيار ملف Excel يحتوي على أعمدة: اسم التلميذ والدرجة',
        'FR': 'Veuillez sélectionner un fichier Excel contenant les colonnes: nom de l\'élève et note',
        'EN': 'Please select an Excel file containing columns: student name and grade',
        'ES': 'Por favor seleccione un archivo Excel que contenga columnas: nombre del estudiante y calificación',
        'IT': 'Si prega di selezionare un file Excel contenente colonne: nome studente e voto',
        'DE': 'Bitte wählen Sie eine Excel-Datei mit Spalten: Schülername und Note',
        'TR': 'Lütfen sütunlar içeren bir Excel dosyası seçin: öğrenci adı ve not'
      },

      // Reports
      'reports.title': {
        'AR': 'التقارير',
        'FR': 'Rapports',
        'EN': 'Reports',
        'ES': 'Informes',
        'IT': 'Rapporti',
        'DE': 'Berichte',
        'TR': 'Raporlar'
      },
      'reports.description': {
        'AR': 'جميع التقارير القابلة للتصدير بصيغة PDF في مكان واحد لسهولة الوصول.',
        'FR': 'Tous les rapports exportables en PDF en un seul endroit pour un accès facile.',
        'EN': 'All PDF-exportable reports in one place for easy access.',
        'ES': 'Todos los informes exportables en PDF en un solo lugar para fácil acceso.',
        'IT': 'Tutti i rapporti esportabili in PDF in un unico posto per un facile accesso.',
        'DE': 'Alle als PDF exportierbaren Berichte an einem Ort für einfachen Zugriff.',
        'TR': 'Kolay erişim için tüm PDF olarak dışa aktarılabilir raporlar tek bir yerde.'
      },
      'reports.deviceLogs': {
        'AR': 'سجل خروج ودخول الأجهزة',
        'FR': 'Journal des entrées et sorties d\'équipements',
        'EN': 'Device entry and exit log',
        'ES': 'Registro de entrada y salida de dispositivos',
        'IT': 'Registro ingressi e uscite dispositivi',
        'DE': 'Geräte-Ein- und Ausgangsprotokoll',
        'TR': 'Cihaz giriş ve çıkış kaydı'
      },
      'reports.deviceLogsDesc': {
        'AR': 'تقرير مفصل بحركات خروج ودخول أجهزة المخبر.',
        'FR': 'Rapport détaillé des mouvements d\'entrée et de sortie des équipements du laboratoire.',
        'EN': 'Detailed report of lab equipment entry and exit movements.',
        'ES': 'Informe detallado de los movimientos de entrada y salida de equipos del laboratorio.',
        'IT': 'Rapporto dettagliato dei movimenti di ingresso e uscita delle apparecchiature del laboratorio.',
        'DE': 'Detaillierter Bericht über Ein- und Ausgangsbewegungen der Laborgeräte.',
        'TR': 'Laboratuvar ekipmanlarının giriş ve çıkış hareketlerinin detaylı raporu.'
      },
      'reports.openExportPDF': {
        'AR': 'فتح وتصدير PDF',
        'FR': 'Ouvrir et exporter PDF',
        'EN': 'Open and export PDF',
        'ES': 'Abrir y exportar PDF',
        'IT': 'Apri ed esporta PDF',
        'DE': 'PDF öffnen und exportieren',
        'TR': 'PDF aç ve dışa aktar'
      },
      'reports.educationalSeminars': {
        'AR': 'تقرير الندوات التربوية',
        'FR': 'Rapport des séminaires pédagogiques',
        'EN': 'Educational seminars report',
        'ES': 'Informe de seminarios educativos',
        'IT': 'Rapporto seminari educativi',
        'DE': 'Bildungsseminarebericht',
        'TR': 'Eğitim seminerleri raporu'
      },
      'reports.educationalSeminarsDesc': {
        'AR': 'عرض وتصدير سجل الندوات التربوية للأستاذ بصيغة PDF.',
        'FR': 'Afficher et exporter le registre des séminaires pédagogiques du professeur en PDF.',
        'EN': 'View and export teacher\'s educational seminars log in PDF format.',
        'ES': 'Ver y exportar el registro de seminarios educativos del profesor en formato PDF.',
        'IT': 'Visualizza ed esporta il registro dei seminari educativi dell\'insegnante in formato PDF.',
        'DE': 'Anzeigen und Exportieren des Bildungs-Seminarlogs des Lehrers im PDF-Format.',
        'TR': 'Öğretmenin eğitim seminerleri kaydını PDF formatında görüntüleyin ve dışa aktarın.'
      },
      'reports.openEducationalSeminars': {
        'AR': 'فتح تقرير الندوات التربوية',
        'FR': 'Ouvrir le rapport des séminaires pédagogiques',
        'EN': 'Open educational seminars report',
        'ES': 'Abrir informe de seminarios educativos',
        'IT': 'Apri rapporto seminari educativi',
        'DE': 'Bildungsseminarebericht öffnen',
        'TR': 'Eğitim seminerleri raporunu aç'
      },
      'reports.pedagogicalVisits': {
        'AR': 'تقرير الزيارات التربوية',
        'FR': 'Rapport des visites pédagogiques',
        'EN': 'Pedagogical visits report',
        'ES': 'Informe de visitas pedagógicas',
        'IT': 'Rapporto visite pedagogiche',
        'DE': 'Pädagogische Besuchsbericht',
        'TR': 'Pedagojik ziyaretler raporu'
      },
      'reports.pedagogicalVisitsDesc': {
        'AR': 'عرض وتصدير سجل الزيارات التربوية (تبادل خبرات) بصيغة PDF.',
        'FR': 'Afficher et exporter le registre des visites pédagogiques (échange d\'expériences) en PDF.',
        'EN': 'View and export pedagogical visits log (experience exchange) in PDF format.',
        'ES': 'Ver y exportar el registro de visitas pedagógicas (intercambio de experiencias) en formato PDF.',
        'IT': 'Visualizza ed esporta il registro delle visite pedagogiche (scambio di esperienze) in formato PDF.',
        'DE': 'Anzeigen und Exportieren des pädagogischen Besuchsprotokolls (Erfahrungsaustausch) im PDF-Format.',
        'TR': 'Pedagojik ziyaretler kaydını (deneyim değişimi) PDF formatında görüntüleyin ve dışa aktarın.'
      },
      'reports.openPedagogicalVisits': {
        'AR': 'فتح تقرير الزيارات التربوية',
        'FR': 'Ouvrir le rapport des visites pédagogiques',
        'EN': 'Open pedagogical visits report',
        'ES': 'Abrir informe de visitas pedagógicas',
        'IT': 'Apri rapporto visite pedagogiche',
        'DE': 'Pädagogische Besuchsbericht öffnen',
        'TR': 'Pedagojik ziyaretler raporunu aç'
      },
      'reports.labEquipment': {
        'AR': 'أجهزة معمل الحاسب الآلي',
        'FR': 'Équipements du laboratoire informatique',
        'EN': 'Computer lab equipment',
        'ES': 'Equipos del laboratorio de informática',
        'IT': 'Attrezzature del laboratorio informatico',
        'DE': 'Computerlabor-Ausrüstung',
        'TR': 'Bilgisayar laboratuvarı ekipmanları'
      },
      'reports.labEquipmentDesc': {
        'AR': 'تقرير بأجهزة معمل الحاسب وعدد الأجهزة العاملة والمعطلة.',
        'FR': 'Rapport sur les équipements du laboratoire informatique et le nombre d\'équipements fonctionnels et défectueux.',
        'EN': 'Report on computer lab equipment and number of working and broken devices.',
        'ES': 'Informe sobre equipos del laboratorio de informática y número de dispositivos funcionando y rotos.',
        'IT': 'Rapporto sulle attrezzature del laboratorio informatico e numero di dispositivi funzionanti e rotti.',
        'DE': 'Bericht über Computerlabor-Ausrüstung und Anzahl funktionierender und defekter Geräte.',
        'TR': 'Bilgisayar laboratuvarı ekipmanları ve çalışan ve bozuk cihaz sayısı hakkında rapor.'
      },
      'reports.labSoftware': {
        'AR': 'برامج حواسيب معمل الحاسب الآلي',
        'FR': 'Logiciels des ordinateurs du laboratoire informatique',
        'EN': 'Computer lab software',
        'ES': 'Software de los ordenadores del laboratorio de informática',
        'IT': 'Software dei computer del laboratorio informatico',
        'DE': 'Computerlabor-Software',
        'TR': 'Bilgisayar laboratuvarı yazılımları'
      },
      'reports.labSoftwareDesc': {
        'AR': 'تقرير ببرامج الحواسيب المثبتة في معمل الحاسب.',
        'FR': 'Rapport sur les logiciels installés sur les ordinateurs du laboratoire.',
        'EN': 'Report on software installed on lab computers.',
        'ES': 'Informe sobre software instalado en los ordenadores del laboratorio.',
        'IT': 'Rapporto sul software installato sui computer del laboratorio.',
        'DE': 'Bericht über auf Laborcomputern installierte Software.',
        'TR': 'Laboratuvar bilgisayarlarına yüklü yazılımlar hakkında rapor.'
      },
      'reports.labFurniture': {
        'AR': 'أثاث معمل الحاسب الآلي',
        'FR': 'Mobilier du laboratoire informatique',
        'EN': 'Computer lab furniture',
        'ES': 'Mobiliario del laboratorio de informática',
        'IT': 'Arredamento del laboratorio informatico',
        'DE': 'Computerlabor-Möbel',
        'TR': 'Bilgisayar laboratuvarı mobilyaları'
      },
      'reports.labFurnitureDesc': {
        'AR': 'تقرير بأثاث معمل الحاسب وحالته.',
        'FR': 'Rapport sur le mobilier du laboratoire informatique et son état.',
        'EN': 'Report on computer lab furniture and its condition.',
        'ES': 'Informe sobre el mobiliario del laboratorio de informática y su estado.',
        'IT': 'Rapporto sull\'arredamento del laboratorio informatico e sulle sue condizioni.',
        'DE': 'Bericht über Computerlabor-Möbel und deren Zustand.',
        'TR': 'Bilgisayar laboratuvarı mobilyaları ve durumu hakkında rapor.'
      },
      'reports.inventory': {
        'AR': 'جرد معمل الحاسب الآلي',
        'FR': 'Inventaire du laboratoire informatique',
        'EN': 'Computer lab inventory',
        'ES': 'Inventario del laboratorio de informática',
        'IT': 'Inventario del laboratorio informatico',
        'DE': 'Computerlabor-Inventar',
        'TR': 'Bilgisayar laboratuvarı envanteri'
      },
      'reports.inventoryDesc': {
        'AR': 'تقرير شامل بأرقام الجرد الخاصة بأجهزة وأثاث المعمل.',
        'FR': 'Rapport complet avec les numéros d\'inventaire des équipements et du mobilier du laboratoire.',
        'EN': 'Comprehensive report with inventory numbers for lab equipment and furniture.',
        'ES': 'Informe completo con números de inventario de equipos y mobiliario del laboratorio.',
        'IT': 'Rapporto completo con numeri di inventario per attrezzature e mobili del laboratorio.',
        'DE': 'Umfassender Bericht mit Inventarnummern für Laborgeräte und -möbel.',
        'TR': 'Laboratuvar ekipmanları ve mobilyaları için envanter numaralarıyla kapsamlı rapor.'
      },
      'reports.deviceStatus': {
        'AR': 'حالة أجهزة معمل الحاسب الآلي',
        'FR': 'État des équipements du laboratoire informatique',
        'EN': 'Computer lab device status',
        'ES': 'Estado de los dispositivos del laboratorio de informática',
        'IT': 'Stato dei dispositivi del laboratorio informatico',
        'DE': 'Status der Computerlabor-Geräte',
        'TR': 'Bilgisayar laboratuvarı cihaz durumu'
      },
      'reports.deviceStatusDesc': {
        'AR': 'تقرير بحالة المكوّنات المادية والبرمجية لكل جهاز في المعمل.',
        'FR': 'Rapport sur l\'état des composants matériels et logiciels de chaque équipement du laboratoire.',
        'EN': 'Report on the status of hardware and software components for each device in the lab.',
        'ES': 'Informe sobre el estado de los componentes de hardware y software de cada dispositivo del laboratorio.',
        'IT': 'Rapporto sullo stato dei componenti hardware e software per ogni dispositivo del laboratorio.',
        'DE': 'Bericht über den Status von Hardware- und Softwarekomponenten für jedes Gerät im Labor.',
        'TR': 'Laboratuvardaki her cihaz için donanım ve yazılım bileşenlerinin durumu hakkında rapor.'
      },
      'reports.labMaintenance': {
        'AR': 'صيانة معمل الحاسب الآلي',
        'FR': 'Maintenance du laboratoire informatique',
        'EN': 'Computer lab maintenance',
        'ES': 'Mantenimiento del laboratorio de informática',
        'IT': 'Manutenzione del laboratorio informatico',
        'DE': 'Computerlabor-Wartung',
        'TR': 'Bilgisayar laboratuvarı bakımı'
      },
      'reports.labMaintenanceDesc': {
        'AR': 'تقرير دوري عن نظافة معمل الحاسب وحالة التمديدات.',
        'FR': 'Rapport périodique sur la propreté du laboratoire informatique et l\'état des installations.',
        'EN': 'Periodic report on computer lab cleanliness and installation condition.',
        'ES': 'Informe periódico sobre la limpieza del laboratorio de informática y el estado de las instalaciones.',
        'IT': 'Rapporto periodico sulla pulizia del laboratorio informatico e le condizioni delle installazioni.',
        'DE': 'Periodischer Bericht über die Sauberkeit des Computerlabors und den Zustand der Installationen.',
        'TR': 'Bilgisayar laboratuvarının temizliği ve kurulum durumu hakkında periyodik rapor.'
      },
      'reports.seatingCharts': {
        'AR': 'مخططات المقاعد',
        'FR': 'Plans de placement',
        'EN': 'Seating charts',
        'ES': 'Planos de asientos',
        'IT': 'Schemi posti',
        'DE': 'Sitzpläne',
        'TR': 'Oturma planları'
      },
      'reports.seatingChartsDesc': {
        'AR': 'طباعة مخططات مقاعد التلاميذ في قاعة القسم أو المخبر.',
        'FR': 'Imprimer les plans de placement des élèves dans la salle de classe ou le laboratoire.',
        'EN': 'Print seating charts for students in the classroom or lab.',
        'ES': 'Imprimir planos de asientos para estudiantes en el aula o laboratorio.',
        'IT': 'Stampa schemi posti per studenti in classe o laboratorio.',
        'DE': 'Sitzpläne für Schüler im Klassenzimmer oder Labor drucken.',
        'TR': 'Sınıf veya laboratuvardaki öğrenciler için oturma planlarını yazdırın.'
      },
      'reports.openPrintCharts': {
        'AR': 'فتح وطباعة المخططات',
        'FR': 'Ouvrir et imprimer les plans',
        'EN': 'Open and print charts',
        'ES': 'Abrir e imprimir planos',
        'IT': 'Apri e stampa schemi',
        'DE': 'Pläne öffnen und drucken',
        'TR': 'Planları aç ve yazdır'
      },
      'reports.timetable': {
        'AR': 'جدول الأوقات',
        'FR': 'Emploi du temps',
        'EN': 'Timetable',
        'ES': 'Horario',
        'IT': 'Orario',
        'DE': 'Stundenplan',
        'TR': 'Ders programı'
      },
      'reports.timetableDesc': {
        'AR': 'طباعة جدول الأوقات الأسبوعي بصيغة PDF.',
        'FR': 'Imprimer l\'emploi du temps hebdomadaire en PDF.',
        'EN': 'Print weekly timetable in PDF format.',
        'ES': 'Imprimir horario semanal en formato PDF.',
        'IT': 'Stampa orario settimanale in formato PDF.',
        'DE': 'Wöchentlichen Stundenplan im PDF-Format drucken.',
        'TR': 'Haftalık ders programını PDF formatında yazdırın.'
      },
      'reports.attendanceReport': {
        'AR': 'تقرير الغيابات',
        'FR': 'Rapport d\'absences',
        'EN': 'Attendance report',
        'ES': 'Informe de asistencia',
        'IT': 'Rapporto presenze',
        'DE': 'Anwesenheitsbericht',
        'TR': 'Yoklama raporu'
      },
      'reports.attendanceReportDesc': {
        'AR': 'تقرير الغيابات حسب الأقسام مع إمكانية التصدير إلى PDF.',
        'FR': 'Rapport d\'absences par classe avec possibilité d\'exportation en PDF.',
        'EN': 'Attendance report by class with PDF export capability.',
        'ES': 'Informe de asistencia por clase con capacidad de exportación a PDF.',
        'IT': 'Rapporto presenze per classe con capacità di esportazione PDF.',
        'DE': 'Anwesenheitsbericht nach Klasse mit PDF-Exportfunktion.',
        'TR': 'PDF dışa aktarma özelliği ile sınıfa göre yoklama raporu.'
      },
      'reports.behaviorReports': {
        'AR': 'تقارير السلوك',
        'FR': 'Rapports de comportement',
        'EN': 'Behavior reports',
        'ES': 'Informes de comportamiento',
        'IT': 'Rapporti comportamento',
        'DE': 'Verhaltensberichte',
        'TR': 'Davranış raporları'
      },
      'reports.behaviorReportsDesc': {
        'AR': 'تقارير السلوك الفردية وتقارير القسم.',
        'FR': 'Rapports de comportement individuels et rapports de classe.',
        'EN': 'Individual behavior reports and class reports.',
        'ES': 'Informes de comportamiento individuales e informes de clase.',
        'IT': 'Rapporti comportamento individuali e rapporti di classe.',
        'DE': 'Individuelle Verhaltensberichte und Klassenberichte.',
        'TR': 'Bireysel davranış raporları ve sınıf raporları.'
      },
      'reports.openBehaviorReports': {
        'AR': 'فتح تقارير السلوك',
        'FR': 'Ouvrir les rapports de comportement',
        'EN': 'Open behavior reports',
        'ES': 'Abrir informes de comportamiento',
        'IT': 'Apri rapporti comportamento',
        'DE': 'Verhaltensberichte öffnen',
        'TR': 'Davranış raporlarını aç'
      },
      'reports.gradeReports': {
        'AR': 'تقارير الدرجات',
        'FR': 'Rapports de notes',
        'EN': 'Grade reports',
        'ES': 'Informes de calificaciones',
        'IT': 'Rapporti voti',
        'DE': 'Notenberichte',
        'TR': 'Not raporları'
      },
      'reports.gradeReportsDesc': {
        'AR': 'تقارير الدرجات وإحصائيات النتائج لكل قسم.',
        'FR': 'Rapports de notes et statistiques des résultats pour chaque classe.',
        'EN': 'Grade reports and result statistics for each class.',
        'ES': 'Informes de calificaciones y estadísticas de resultados para cada clase.',
        'IT': 'Rapporti voti e statistiche risultati per ogni classe.',
        'DE': 'Notenberichte und Ergebnisstatistiken für jede Klasse.',
        'TR': 'Her sınıf için not raporları ve sonuç istatistikleri.'
      },
      'reports.annualDistribution': {
        'AR': 'التوزيع السنوي',
        'FR': 'Répartition annuelle',
        'EN': 'Annual distribution',
        'ES': 'Distribución anual',
        'IT': 'Distribuzione annuale',
        'DE': 'Jährliche Verteilung',
        'TR': 'Yıllık dağıtım'
      },
      'reports.annualDistributionDesc': {
        'AR': 'تقارير التوزيع السنوي للمحتويات التعليمية.',
        'FR': 'Rapports de répartition annuelle des contenus pédagogiques.',
        'EN': 'Annual distribution reports of educational content.',
        'ES': 'Informes de distribución anual de contenidos educativos.',
        'IT': 'Rapporti di distribuzione annuale dei contenuti educativi.',
        'DE': 'Jährliche Verteilungsberichte für Bildungsinhalte.',
        'TR': 'Eğitim içeriklerinin yıllık dağıtım raporları.'
      },
      'reports.openAnnualDistribution': {
        'AR': 'فتح التوزيع السنوي',
        'FR': 'Ouvrir la répartition annuelle',
        'EN': 'Open annual distribution',
        'ES': 'Abrir distribución anual',
        'IT': 'Apri distribuzione annuale',
        'DE': 'Jährliche Verteilung öffnen',
        'TR': 'Yıllık dağıtımı aç'
      },
      'reports.progressReport': {
        'AR': 'تقرير تتبع التقدم',
        'FR': 'Rapport de suivi des progrès',
        'EN': 'Progress tracking report',
        'ES': 'Informe de seguimiento del progreso',
        'IT': 'Rapporto monitoraggio progressi',
        'DE': 'Fortschrittsverfolgungsbericht',
        'TR': 'İlerleme takibi raporu'
      },
      'reports.progressReportDesc': {
        'AR': 'تقرير تفصيلي لمستوى تقدّم الأقسام حسب الدروس المتوقعة والمنجزة.',
        'FR': 'Rapport détaillé du niveau de progression des classes selon les leçons attendues et accomplies.',
        'EN': 'Detailed report on class progress level according to expected and completed lessons.',
        'ES': 'Informe detallado del nivel de progreso de las clases según las lecciones esperadas y completadas.',
        'IT': 'Rapporto dettagliato sul livello di progresso delle classi secondo le lezioni previste e completate.',
        'DE': 'Detaillierter Bericht über den Fortschrittsstand der Klassen gemäß erwarteter und abgeschlossener Lektionen.',
        'TR': 'Beklenen ve tamamlanan derslere göre sınıf ilerleme seviyesinin detaylı raporu.'
      },
      'reports.openProgressReport': {
        'AR': 'فتح تقرير التقدم',
        'FR': 'Ouvrir le rapport de progrès',
        'EN': 'Open progress report',
        'ES': 'Abrir informe de progreso',
        'IT': 'Apri rapporto progressi',
        'DE': 'Fortschrittsbericht öffnen',
        'TR': 'İlerleme raporunu aç'
      },
      'reports.teacherCard': {
        'AR': 'بطاقة معلومات الأستاذ',
        'FR': 'Carte d\'information du professeur',
        'EN': 'Teacher information card',
        'ES': 'Tarjeta de información del profesor',
        'IT': 'Scheda informativa insegnante',
        'DE': 'Lehrer-Informationskarte',
        'TR': 'Öğretmen bilgi kartı'
      },
      'reports.teacherCardDesc': {
        'AR': 'إدخال وحفظ بيانات الأستاذ وطباعة البطاقة الفنية بصيغة PDF.',
        'FR': 'Saisir et enregistrer les données du professeur et imprimer la carte technique en PDF.',
        'EN': 'Enter and save teacher data and print the technical card in PDF format.',
        'ES': 'Ingresar y guardar datos del profesor e imprimir la tarjeta técnica en formato PDF.',
        'IT': 'Inserire e salvare i dati dell\'insegnante e stampare la scheda tecnica in formato PDF.',
        'DE': 'Lehrerdaten eingeben und speichern und die technische Karte im PDF-Format drucken.',
        'TR': 'Öğretmen verilerini girin ve kaydedin ve teknik kartı PDF formatında yazdırın.'
      },
      'reports.openTeacherCard': {
        'AR': 'فتح بطاقة الأستاذ',
        'FR': 'Ouvrir la carte du professeur',
        'EN': 'Open teacher card',
        'ES': 'Abrir tarjeta del profesor',
        'IT': 'Apri scheda insegnante',
        'DE': 'Lehrerkarte öffnen',
        'TR': 'Öğretmen kartını aç'
      },
      'reports.trainingLog': {
        'AR': 'تقرير سجل التكوين',
        'FR': 'Rapport du registre de formation',
        'EN': 'Training log report',
        'ES': 'Informe del registro de formación',
        'IT': 'Rapporto registro di formazione',
        'DE': 'Ausbildungsprotokollbericht',
        'TR': 'Eğitim kaydı raporu'
      },
      'reports.trainingLogDesc': {
        'AR': 'عرض وتصدير سجل التكوين الخاص بالأستاذ بصيغة PDF.',
        'FR': 'Afficher et exporter le registre de formation du professeur en PDF.',
        'EN': 'View and export teacher\'s training log in PDF format.',
        'ES': 'Ver y exportar el registro de formación del profesor en formato PDF.',
        'IT': 'Visualizza ed esporta il registro di formazione dell\'insegnante in formato PDF.',
        'DE': 'Anzeigen und Exportieren des Ausbildungsprotokolls des Lehrers im PDF-Format.',
        'TR': 'Öğretmenin eğitim kaydını PDF formatında görüntüleyin ve dışa aktarın.'
      },
      'reports.openTrainingLog': {
        'AR': 'فتح تقرير سجل التكوين',
        'FR': 'Ouvrir le rapport du registre de formation',
        'EN': 'Open training log report',
        'ES': 'Abrir informe del registro de formación',
        'IT': 'Apri rapporto registro di formazione',
        'DE': 'Ausbildungsprotokollbericht öffnen',
        'TR': 'Eğitim kaydı raporunu aç'
      },
      'reports.inspectorVisits': {
        'AR': 'تقرير زيارات المفتش',
        'FR': 'Rapport des visites de l\'inspecteur',
        'EN': 'Inspector visits report',
        'ES': 'Informe de visitas del inspector',
        'IT': 'Rapporto visite dell\'ispettore',
        'DE': 'Inspektorenbesuchsbericht',
        'TR': 'Müfettiş ziyaretleri raporu'
      },
      'reports.inspectorVisitsDesc': {
        'AR': 'عرض وتصدير سجل زيارات المفتش الخاصة بالأستاذ بصيغة PDF.',
        'FR': 'Afficher et exporter le registre des visites de l\'inspecteur du professeur en PDF.',
        'EN': 'View and export teacher\'s inspector visits log in PDF format.',
        'ES': 'Ver y exportar el registro de visitas del inspector del profesor en formato PDF.',
        'IT': 'Visualizza ed esporta il registro delle visite dell\'ispettore dell\'insegnante in formato PDF.',
        'DE': 'Anzeigen und Exportieren des Inspektorenbesuchsprotokolls des Lehrers im PDF-Format.',
        'TR': 'Öğretmenin müfettiş ziyaretleri kaydını PDF formatında görüntüleyin ve dışa aktarın.'
      },
      'reports.openInspectorVisits': {
        'AR': 'فتح تقرير زيارات المفتش',
        'FR': 'Ouvrir le rapport des visites de l\'inspecteur',
        'EN': 'Open inspector visits report',
        'ES': 'Abrir informe de visitas del inspector',
        'IT': 'Apri rapporto visite dell\'ispettore',
        'DE': 'Inspektorenbesuchsbericht öffnen',
        'TR': 'Müfettiş ziyaretleri raporunu aç'
      },
      'reports.dailyNotes': {
        'AR': 'تقرير دفتر الملاحظات اليومية',
        'FR': 'Rapport du carnet de notes quotidiennes',
        'EN': 'Daily notes notebook report',
        'ES': 'Informe del cuaderno de notas diarias',
        'IT': 'Rapporto quaderno note quotidiane',
        'DE': 'Tägliches Notizbuchbericht',
        'TR': 'Günlük not defteri raporu'
      },
      'reports.dailyNotesDesc': {
        'AR': 'عرض وتصدير دفتر الملاحظات اليومية للأستاذ بصيغة PDF.',
        'FR': 'Afficher et exporter le carnet de notes quotidiennes du professeur en PDF.',
        'EN': 'View and export teacher\'s daily notes notebook in PDF format.',
        'ES': 'Ver y exportar el cuaderno de notas diarias del profesor en formato PDF.',
        'IT': 'Visualizza ed esporta il quaderno delle note quotidiane dell\'insegnante in formato PDF.',
        'DE': 'Anzeigen und Exportieren des täglichen Notizbuchs des Lehrers im PDF-Format.',
        'TR': 'Öğretmenin günlük not defterini PDF formatında görüntüleyin ve dışa aktarın.'
      },
      'reports.openDailyNotes': {
        'AR': 'فتح تقرير الملاحظات اليومية',
        'FR': 'Ouvrir le rapport des notes quotidiennes',
        'EN': 'Open daily notes report',
        'ES': 'Abrir informe de notas diarias',
        'IT': 'Apri rapporto note quotidiane',
        'DE': 'Täglicher Notizbericht öffnen',
        'TR': 'Günlük notlar raporunu aç'
      },

      // Pedagogical Docs
      'pedagogicalDocs.title': {
        'AR': 'الوثائق البيداغوجية',
        'FR': 'Documents pédagogiques',
        'EN': 'Pedagogical Documents',
        'ES': 'Documentos pedagógicos',
        'IT': 'Documenti pedagogici',
        'DE': 'Pädagogische Dokumente',
        'TR': 'Pedagojik belgeler'
      },
      'pedagogicalDocs.description': {
        'AR': 'رفع وتنظيم المذكرات اليومية، التدرجات السنوية، المناهج، والكتب المدرسية حسب المستوى.',
        'FR': 'Télécharger et organiser les notes quotidiennes, progressions annuelles, programmes et manuels scolaires par niveau.',
        'EN': 'Upload and organize daily notes, annual progressions, curricula, and textbooks by level.',
        'ES': 'Subir y organizar notas diarias, progresiones anuales, planes de estudio y libros de texto por nivel.',
        'IT': 'Caricare e organizzare note quotidiane, progressioni annuali, programmi e libri di testo per livello.',
        'DE': 'Tägliche Notizen, jährliche Progressionen, Lehrpläne und Lehrbücher nach Niveau hochladen und organisieren.',
        'TR': 'Günlük notlar, yıllık ilerlemeler, müfredat ve ders kitaplarını seviyeye göre yükleyin ve düzenleyin.'
      },
      'pedagogicalDocs.addDocument': {
        'AR': 'إضافة وثيقة بيداغوجية',
        'FR': 'Ajouter un document pédagogique',
        'EN': 'Add pedagogical document',
        'ES': 'Agregar documento pedagógico',
        'IT': 'Aggiungi documento pedagogico',
        'DE': 'Pädagogisches Dokument hinzufügen',
        'TR': 'Pedagojik belge ekle'
      },
      'pedagogicalDocs.titleLabel': {
        'AR': 'العنوان',
        'FR': 'Titre',
        'EN': 'Title',
        'ES': 'Título',
        'IT': 'Titolo',
        'DE': 'Titel',
        'TR': 'Başlık'
      },
      'pedagogicalDocs.titlePlaceholder': {
        'AR': 'مثال: مذكرة الأسبوع الأول',
        'FR': 'Ex: Note de la première semaine',
        'EN': 'Example: First week note',
        'ES': 'Ejemplo: Nota de la primera semana',
        'IT': 'Esempio: Nota della prima settimana',
        'DE': 'Beispiel: Notiz der ersten Woche',
        'TR': 'Örnek: İlk hafta notu'
      },
      'pedagogicalDocs.level': {
        'AR': 'المستوى',
        'FR': 'Niveau',
        'EN': 'Level',
        'ES': 'Nivel',
        'IT': 'Livello',
        'DE': 'Niveau',
        'TR': 'Seviye'
      },
      'pedagogicalDocs.selectLevel': {
        'AR': 'اختر المستوى',
        'FR': 'Sélectionner le niveau',
        'EN': 'Select level',
        'ES': 'Seleccionar nivel',
        'IT': 'Seleziona livello',
        'DE': 'Niveau auswählen',
        'TR': 'Seviye seç'
      },
      'pedagogicalDocs.documentType': {
        'AR': 'نوع الوثيقة',
        'FR': 'Type de document',
        'EN': 'Document type',
        'ES': 'Tipo de documento',
        'IT': 'Tipo di documento',
        'DE': 'Dokumenttyp',
        'TR': 'Belge türü'
      },
      'pedagogicalDocs.selectType': {
        'AR': 'اختر النوع',
        'FR': 'Sélectionner le type',
        'EN': 'Select type',
        'ES': 'Seleccionar tipo',
        'IT': 'Seleziona tipo',
        'DE': 'Typ auswählen',
        'TR': 'Tür seç'
      },
      'pedagogicalDocs.subject': {
        'AR': 'المادة (اختياري)',
        'FR': 'Matière (optionnel)',
        'EN': 'Subject (optional)',
        'ES': 'Asignatura (opcional)',
        'IT': 'Materia (opzionale)',
        'DE': 'Fach (optional)',
        'TR': 'Ders (isteğe bağlı)'
      },
      'pedagogicalDocs.subjectPlaceholder': {
        'AR': 'مثال: رياضيات',
        'FR': 'Ex: Mathématiques',
        'EN': 'Example: Mathematics',
        'ES': 'Ejemplo: Matemáticas',
        'IT': 'Esempio: Matematica',
        'DE': 'Beispiel: Mathematik',
        'TR': 'Örnek: Matematik'
      },
      'pedagogicalDocs.documentFile': {
        'AR': 'ملف الوثيقة',
        'FR': 'Fichier du document',
        'EN': 'Document file',
        'ES': 'Archivo del documento',
        'IT': 'File del documento',
        'DE': 'Dokumentdatei',
        'TR': 'Belge dosyası'
      },
      'pedagogicalDocs.saveDocument': {
        'AR': 'حفظ الوثيقة',
        'FR': 'Enregistrer le document',
        'EN': 'Save document',
        'ES': 'Guardar documento',
        'IT': 'Salva documento',
        'DE': 'Dokument speichern',
        'TR': 'Belgeyi kaydet'
      },
      'pedagogicalDocs.uploading': {
        'AR': 'جاري الرفع...',
        'FR': 'Téléchargement en cours...',
        'EN': 'Uploading...',
        'ES': 'Subiendo...',
        'IT': 'Caricamento...',
        'DE': 'Hochladen...',
        'TR': 'Yükleniyor...'
      },
      'pedagogicalDocs.filterByLevel': {
        'AR': 'تصفية حسب المستوى',
        'FR': 'Filtrer par niveau',
        'EN': 'Filter by level',
        'ES': 'Filtrar por nivel',
        'IT': 'Filtra per livello',
        'DE': 'Nach Niveau filtern',
        'TR': 'Seviyeye göre filtrele'
      },
      'pedagogicalDocs.allLevels': {
        'AR': 'جميع المستويات',
        'FR': 'Tous les niveaux',
        'EN': 'All levels',
        'ES': 'Todos los niveles',
        'IT': 'Tutti i livelli',
        'DE': 'Alle Niveaus',
        'TR': 'Tüm seviyeler'
      },
      'pedagogicalDocs.filterByType': {
        'AR': 'تصفية حسب النوع',
        'FR': 'Filtrer par type',
        'EN': 'Filter by type',
        'ES': 'Filtrar por tipo',
        'IT': 'Filtra per tipo',
        'DE': 'Nach Typ filtern',
        'TR': 'Türe göre filtrele'
      },
      'pedagogicalDocs.allTypes': {
        'AR': 'جميع الأنواع',
        'FR': 'Tous les types',
        'EN': 'All types',
        'ES': 'Todos los tipos',
        'IT': 'Tutti i tipi',
        'DE': 'Alle Typen',
        'TR': 'Tüm türler'
      },
      'pedagogicalDocs.documentsCount': {
        'AR': 'عدد الوثائق:',
        'FR': 'Nombre de documents:',
        'EN': 'Documents count:',
        'ES': 'Cantidad de documentos:',
        'IT': 'Numero di documenti:',
        'DE': 'Anzahl Dokumente:',
        'TR': 'Belge sayısı:'
      },
      'pedagogicalDocs.loading': {
        'AR': 'جاري تحميل الوثائق...',
        'FR': 'Chargement des documents...',
        'EN': 'Loading documents...',
        'ES': 'Cargando documentos...',
        'IT': 'Caricamento documenti...',
        'DE': 'Dokumente werden geladen...',
        'TR': 'Belgeler yükleniyor...'
      },
      'pedagogicalDocs.dailyNote': {
        'AR': 'مذكرة يومية',
        'FR': 'Note quotidienne',
        'EN': 'Daily note',
        'ES': 'Nota diaria',
        'IT': 'Nota quotidiana',
        'DE': 'Tägliche Notiz',
        'TR': 'Günlük not'
      },
      'pedagogicalDocs.annualProgression': {
        'AR': 'تدرج سنوي',
        'FR': 'Progression annuelle',
        'EN': 'Annual progression',
        'ES': 'Progresión anual',
        'IT': 'Progressione annuale',
        'DE': 'Jährliche Progression',
        'TR': 'Yıllık ilerleme'
      },
      'pedagogicalDocs.curriculum': {
        'AR': 'منهاج',
        'FR': 'Programme',
        'EN': 'Curriculum',
        'ES': 'Plan de estudios',
        'IT': 'Programma',
        'DE': 'Lehrplan',
        'TR': 'Müfredat'
      },
      'pedagogicalDocs.textbook': {
        'AR': 'كتاب مدرسي',
        'FR': 'Manuel scolaire',
        'EN': 'Textbook',
        'ES': 'Libro de texto',
        'IT': 'Libro di testo',
        'DE': 'Lehrbuch',
        'TR': 'Ders kitabı'
      },
      'pedagogicalDocs.noMatchingDocs': {
        'AR': 'لا توجد وثائق مطابقة لخيارات التصفية الحالية.',
        'FR': 'Aucun document ne correspond aux options de filtrage actuelles.',
        'EN': 'No documents match the current filter options.',
        'ES': 'No hay documentos que coincidan con las opciones de filtro actuales.',
        'IT': 'Nessun documento corrisponde alle opzioni di filtro attuali.',
        'DE': 'Keine Dokumente entsprechen den aktuellen Filteroptionen.',
        'TR': 'Mevcut filtre seçenekleriyle eşleşen belge yok.'
      },

      // Dashboard additional
      'dashboard.gradebookQuickView': {
        'AR': 'سجل الدرجات',
        'FR': 'Carnet de notes',
        'EN': 'Gradebook',
        'ES': 'Libro de calificaciones',
        'IT': 'Registro voti',
        'DE': 'Notenbuch',
        'TR': 'Not Defteri'
      },
      'dashboard.gradebookNote': {
        'AR': 'هذه القيم يمكن ربطها لاحقاً مباشرة ببيانات سجل الدرجات (Gradebook).',
        'FR': 'Ces valeurs peuvent être liées plus tard directement aux données du carnet de notes (Gradebook).',
        'EN': 'These values can be linked later directly to gradebook data.',
        'ES': 'Estos valores se pueden vincular más tarde directamente a los datos del libro de calificaciones.',
        'IT': 'Questi valori possono essere collegati successivamente direttamente ai dati del registro voti.',
        'DE': 'Diese Werte können später direkt mit Notenbuchdaten verknüpft werden.',
        'TR': 'Bu değerler daha sonra doğrudan not defteri verilerine bağlanabilir.'
      },

      // Classes
      'classes.title': {
        'AR': 'إدارة الأقسام',
        'FR': 'Gestion des classes',
        'EN': 'Class Management',
        'ES': 'Gestión de clases',
        'IT': 'Gestione classi',
        'DE': 'Klassenverwaltung',
        'TR': 'Sınıf Yönetimi'
      },
      'classes.addNew': {
        'AR': 'إضافة قسم جديد',
        'FR': 'Ajouter une nouvelle classe',
        'EN': 'Add new class',
        'ES': 'Agregar nueva clase',
        'IT': 'Aggiungi nuova classe',
        'DE': 'Neue Klasse hinzufügen',
        'TR': 'Yeni sınıf ekle'
      },
      'classes.list': {
        'AR': 'قائمة الأقسام',
        'FR': 'Liste des classes',
        'EN': 'Classes list',
        'ES': 'Lista de clases',
        'IT': 'Elenco classi',
        'DE': 'Klassenliste',
        'TR': 'Sınıf listesi'
      },
      'classes.name': {
        'AR': 'اسم القسم',
        'FR': 'Nom de la classe',
        'EN': 'Class name',
        'ES': 'Nombre de la clase',
        'IT': 'Nome classe',
        'DE': 'Klassenname',
        'TR': 'Sınıf adı'
      },
      'classes.level': {
        'AR': 'المستوى',
        'FR': 'Niveau',
        'EN': 'Level',
        'ES': 'Nivel',
        'IT': 'Livello',
        'DE': 'Niveau',
        'TR': 'Seviye'
      },
      'classes.studentCount': {
        'AR': 'عدد التلاميذ',
        'FR': 'Nombre d\'élèves',
        'EN': 'Student count',
        'ES': 'Cantidad de estudiantes',
        'IT': 'Numero studenti',
        'DE': 'Schüleranzahl',
        'TR': 'Öğrenci sayısı'
      },
      'classes.lab': {
        'AR': 'المخبر',
        'FR': 'Laboratoire',
        'EN': 'Lab',
        'ES': 'Laboratorio',
        'IT': 'Laboratorio',
        'DE': 'Labor',
        'TR': 'Laboratuvar'
      },
      'classes.weeklySessions': {
        'AR': 'الحصص الأسبوعية',
        'FR': 'Séances hebdomadaires',
        'EN': 'Weekly sessions',
        'ES': 'Sesiones semanales',
        'IT': 'Sessioni settimanali',
        'DE': 'Wöchentliche Sitzungen',
        'TR': 'Haftalık dersler'
      },
      'classes.actions': {
        'AR': 'الإجراءات',
        'FR': 'Actions',
        'EN': 'Actions',
        'ES': 'Acciones',
        'IT': 'Azioni',
        'DE': 'Aktionen',
        'TR': 'İşlemler'
      },
      'classes.noData': {
        'AR': 'لا توجد أقسام',
        'FR': 'Aucune classe',
        'EN': 'No classes',
        'ES': 'No hay clases',
        'IT': 'Nessuna classe',
        'DE': 'Keine Klassen',
        'TR': 'Sınıf yok'
      },
      'classes.formTitleEdit': {
        'AR': 'تعديل القسم',
        'FR': 'Modifier la classe',
        'EN': 'Edit class',
        'ES': 'Editar clase',
        'IT': 'Modifica classe',
        'DE': 'Klasse bearbeiten',
        'TR': 'Sınıfı düzenle'
      },
      'classes.formTitleAdd': {
        'AR': 'إضافة قسم جديد',
        'FR': 'Ajouter une nouvelle classe',
        'EN': 'Add new class',
        'ES': 'Agregar nueva clase',
        'IT': 'Aggiungi nuova classe',
        'DE': 'Neue Klasse hinzufügen',
        'TR': 'Yeni sınıf ekle'
      },
      'classes.selectLevel': {
        'AR': 'اختر المستوى',
        'FR': 'Sélectionner le niveau',
        'EN': 'Select level',
        'ES': 'Seleccionar nivel',
        'IT': 'Seleziona livello',
        'DE': 'Niveau auswählen',
        'TR': 'Seviye seç'
      },
      'classes.namePlaceholder': {
        'AR': 'أدخل اسم القسم',
        'FR': 'Entrez le nom de la classe',
        'EN': 'Enter class name',
        'ES': 'Ingrese el nombre de la clase',
        'IT': 'Inserisci nome classe',
        'DE': 'Klassennamen eingeben',
        'TR': 'Sınıf adını girin'
      },
      'classes.subject': {
        'AR': 'المادة',
        'FR': 'Matière',
        'EN': 'Subject',
        'ES': 'Materia',
        'IT': 'Materia',
        'DE': 'Fach',
        'TR': 'Ders'
      },
      'classes.subjectPlaceholder': {
        'AR': 'أدخل اسم المادة',
        'FR': 'Entrez le nom de la matière',
        'EN': 'Enter subject name',
        'ES': 'Ingrese el nombre de la materia',
        'IT': 'Inserisci nome materia',
        'DE': 'Fachname eingeben',
        'TR': 'Ders adını girin'
      },
      'classes.noLabOption': {
        'AR': 'لا يوجد',
        'FR': 'Aucun',
        'EN': 'None',
        'ES': 'Ninguno',
        'IT': 'Nessuno',
        'DE': 'Keiner',
        'TR': 'Yok'
      },
      'classes.newLabButton': {
        'AR': '+ مخبر جديد',
        'FR': '+ Nouveau laboratoire',
        'EN': '+ New lab',
        'ES': '+ Nuevo laboratorio',
        'IT': '+ Nuovo laboratorio',
        'DE': '+ Neues Labor',
        'TR': '+ Yeni laboratuvar'
      },
      'classes.weeklySessionsPlaceholder': {
        'AR': 'عدد الحصص',
        'FR': 'Nombre de séances',
        'EN': 'Number of sessions',
        'ES': 'Número de sesiones',
        'IT': 'Numero di sessioni',
        'DE': 'Anzahl der Sitzungen',
        'TR': 'Ders sayısı'
      },
      'classes.update': {
        'AR': 'تحديث',
        'FR': 'Mettre à jour',
        'EN': 'Update',
        'ES': 'Actualizar',
        'IT': 'Aggiorna',
        'DE': 'Aktualisieren',
        'TR': 'Güncelle'
      },
      'classes.addAction': {
        'AR': 'إضافة',
        'FR': 'Ajouter',
        'EN': 'Add',
        'ES': 'Agregar',
        'IT': 'Aggiungi',
        'DE': 'Hinzufügen',
        'TR': 'Ekle'
      },
      'classes.addLabTitle': {
        'AR': 'إضافة مخبر جديد',
        'FR': 'Ajouter un nouveau laboratoire',
        'EN': 'Add new lab',
        'ES': 'Agregar nuevo laboratorio',
        'IT': 'Aggiungi nuovo laboratorio',
        'DE': 'Neues Labor hinzufügen',
        'TR': 'Yeni laboratuvar ekle'
      },
      'classes.labNameLabel': {
        'AR': 'اسم المخبر *',
        'FR': 'Nom du laboratoire *',
        'EN': 'Lab name *',
        'ES': 'Nombre del laboratorio *',
        'IT': 'Nome laboratorio *',
        'DE': 'Name des Labors *',
        'TR': 'Labor adı *'
      },
      'classes.labNamePlaceholder': {
        'AR': 'أدخل اسم المخبر',
        'FR': 'Entrez le nom du laboratoire',
        'EN': 'Enter lab name',
        'ES': 'Ingrese el nombre del laboratorio',
        'IT': 'Inserisci nome laboratorio',
        'DE': 'Labornamen eingeben',
        'TR': 'Labor adını girin'
      },
      'classes.labDescriptionLabel': {
        'AR': 'الوصف',
        'FR': 'Description',
        'EN': 'Description',
        'ES': 'Descripción',
        'IT': 'Descrizione',
        'DE': 'Beschreibung',
        'TR': 'Açıklama'
      },
      'classes.labDescriptionPlaceholder': {
        'AR': 'أدخل وصف المخبر',
        'FR': 'Entrez la description du laboratoire',
        'EN': 'Enter lab description',
        'ES': 'Ingrese la descripción del laboratorio',
        'IT': 'Inserisci descrizione del laboratorio',
        'DE': 'Laborbeschreibung eingeben',
        'TR': 'Labor açıklaması girin'
      },
      'classes.labLocationLabel': {
        'AR': 'الموقع',
        'FR': 'Emplacement',
        'EN': 'Location',
        'ES': 'Ubicación',
        'IT': 'Posizione',
        'DE': 'Ort',
        'TR': 'Konum'
      },
      'classes.labLocationPlaceholder': {
        'AR': 'أدخل موقع المخبر',
        'FR': 'Entrez l\'emplacement du laboratoire',
        'EN': 'Enter lab location',
        'ES': 'Ingrese la ubicación del laboratorio',
        'IT': 'Inserisci posizione del laboratorio',
        'DE': 'Laborstandort eingeben',
        'TR': 'Labor konumunu girin'
      },
      'classes.labAvailable': {
        'AR': 'المخبر متاح',
        'FR': 'Laboratoire disponible',
        'EN': 'Lab available',
        'ES': 'Laboratorio disponible',
        'IT': 'Laboratorio disponibile',
        'DE': 'Labor verfügbar',
        'TR': 'Labor kullanılabilir'
      },
      'classes.manageGroupsTitle': {
        'AR': 'إدارة المجموعات',
        'FR': 'Gestion des groupes',
        'EN': 'Group management',
        'ES': 'Gestión de grupos',
        'IT': 'Gestione gruppi',
        'DE': 'Gruppenverwaltung',
        'TR': 'Grup yönetimi'
      },
      'classes.autoAssignTitle': {
        'AR': 'التقسيم التلقائي',
        'FR': 'Répartition automatique',
        'EN': 'Automatic splitting',
        'ES': 'División automática',
        'IT': 'Suddivisione automatica',
        'DE': 'Automatische Aufteilung',
        'TR': 'Otomatik bölme'
      },
      'classes.autoAssignByFirstName': {
        'AR': 'تقسيم حسب الاسم (أبجدي)',
        'FR': 'Répartition par prénom (alphabétique)',
        'EN': 'Split by first name (alphabetical)',
        'ES': 'Dividir por nombre (alfabético)',
        'IT': 'Dividi per nome (alfabetico)',
        'DE': 'Nach Vornamen aufteilen (alphabetisch)',
        'TR': 'Adına göre böl (alfabetik)'
      },
      'classes.autoAssignByLastName': {
        'AR': 'تقسيم حسب اللقب (أبجدي)',
        'FR': 'Répartition par nom (alphabétique)',
        'EN': 'Split by last name (alphabetical)',
        'ES': 'Dividir por apellido (alfabético)',
        'IT': 'Dividi per cognome (alfabetico)',
        'DE': 'Nach Nachnamen aufteilen (alphabetisch)',
        'TR': 'Soyadına göre böl (alfabetik)'
      },
      'classes.autoAssignByGender': {
        'AR': 'تقسيم حسب الجنس',
        'FR': 'Répartition par sexe',
        'EN': 'Split by gender',
        'ES': 'Dividir por género',
        'IT': 'Dividi per genere',
        'DE': 'Nach Geschlecht aufteilen',
        'TR': 'Cinsiyete göre böl'
      },
      'classes.manualAssignTitle': {
        'AR': 'التعيين اليدوي',
        'FR': 'Attribution manuelle',
        'EN': 'Manual assignment',
        'ES': 'Asignación manual',
        'IT': 'Assegnazione manuale',
        'DE': 'Manuelle Zuordnung',
        'TR': 'Manuel atama'
      },
      'classes.selectionCount': {
        'AR': 'المحدد: {{count}} تلميذ',
        'FR': 'Sélectionnés : {{count}} élèves',
        'EN': 'Selected: {{count}} students',
        'ES': 'Seleccionados: {{count}} estudiantes',
        'IT': 'Selezionati: {{count}} studenti',
        'DE': 'Ausgewählt: {{count}} Schüler',
        'TR': 'Seçilen: {{count}} öğrenci'
      },
      'classes.assignGroup1': {
        'AR': 'تعيين للمجموعة 1',
        'FR': 'Assigner au groupe 1',
        'EN': 'Assign to group 1',
        'ES': 'Asignar al grupo 1',
        'IT': 'Assegna al gruppo 1',
        'DE': 'Gruppe 1 zuweisen',
        'TR': '1. gruba ata'
      },
      'classes.assignGroup2': {
        'AR': 'تعيين للمجموعة 2',
        'FR': 'Assigner au groupe 2',
        'EN': 'Assign to group 2',
        'ES': 'Asignar al grupo 2',
        'IT': 'Assegna al gruppo 2',
        'DE': 'Gruppe 2 zuweisen',
        'TR': '2. gruba ata'
      },
      'classes.unassigned': {
        'AR': 'غير معين',
        'FR': 'Non assigné',
        'EN': 'Unassigned',
        'ES': 'No asignado',
        'IT': 'Non assegnato',
        'DE': 'Nicht zugewiesen',
        'TR': 'Atanmamış'
      },
      'classes.noUnassigned': {
        'AR': 'لا يوجد تلاميذ غير معينين',
        'FR': 'Aucun élève non assigné',
        'EN': 'No unassigned students',
        'ES': 'No hay estudiantes sin asignar',
        'IT': 'Nessuno studente non assegnato',
        'DE': 'Keine nicht zugewiesenen Schüler',
        'TR': 'Atanmamış öğrenci yok'
      },
      'classes.group1': {
        'AR': 'المجموعة 1',
        'FR': 'Groupe 1',
        'EN': 'Group 1',
        'ES': 'Grupo 1',
        'IT': 'Gruppo 1',
        'DE': 'Gruppe 1',
        'TR': '1. grup'
      },
      'classes.group2': {
        'AR': 'المجموعة 2',
        'FR': 'Groupe 2',
        'EN': 'Group 2',
        'ES': 'Grupo 2',
        'IT': 'Gruppo 2',
        'DE': 'Gruppe 2',
        'TR': '2. grup'
      },
      'classes.remove': {
        'AR': 'إزالة',
        'FR': 'Retirer',
        'EN': 'Remove',
        'ES': 'Eliminar',
        'IT': 'Rimuovi',
        'DE': 'Entfernen',
        'TR': 'Kaldır'
      },
      'classes.noStudentsInGroup': {
        'AR': 'لا يوجد تلاميذ في هذه المجموعة',
        'FR': 'Aucun élève dans ce groupe',
        'EN': 'No students in this group',
        'ES': 'No hay estudiantes en este grupo',
        'IT': 'Nessuno studente in questo gruppo',
        'DE': 'Keine Schüler in dieser Gruppe',
        'TR': 'Bu grupta öğrenci yok'
      },
      'classes.close': {
        'AR': 'إغلاق',
        'FR': 'Fermer',
        'EN': 'Close',
        'ES': 'Cerrar',
        'IT': 'Chiudi',
        'DE': 'Schließen',
        'TR': 'Kapat'
      },
      'classes.manageGroups': {
        'AR': 'إدارة المجموعات',
        'FR': 'Gérer les groupes',
        'EN': 'Manage groups',
        'ES': 'Gestionar grupos',
        'IT': 'Gestisci gruppi',
        'DE': 'Gruppen verwalten',
        'TR': 'Grupları yönet'
      },
      'classes.edit': {
        'AR': 'تعديل',
        'FR': 'Modifier',
        'EN': 'Edit',
        'ES': 'Editar',
        'IT': 'Modifica',
        'DE': 'Bearbeiten',
        'TR': 'Düzenle'
      },
      'classes.delete': {
        'AR': 'حذف',
        'FR': 'Supprimer',
        'EN': 'Delete',
        'ES': 'Eliminar',
        'IT': 'Elimina',
        'DE': 'Löschen',
        'TR': 'Sil'
      },

      // Students
      'students.title': {
        'AR': 'إدارة التلاميذ',
        'FR': 'Gestion des élèves',
        'EN': 'Student Management',
        'ES': 'Gestión de estudiantes',
        'IT': 'Gestione studenti',
        'DE': 'Schülerverwaltung',
        'TR': 'Öğrenci Yönetimi'
      },
      'students.importExcel': {
        'AR': 'استيراد من Excel',
        'FR': 'Importer depuis Excel',
        'EN': 'Import from Excel',
        'ES': 'Importar desde Excel',
        'IT': 'Importa da Excel',
        'DE': 'Von Excel importieren',
        'TR': 'Excel\'den içe aktar'
      },
      'students.exportExcel': {
        'AR': 'تصدير إلى Excel',
        'FR': 'Exporter vers Excel',
        'EN': 'Export to Excel',
        'ES': 'Exportar a Excel',
        'IT': 'Esporta in Excel',
        'DE': 'Nach Excel exportieren',
        'TR': 'Excel\'e aktar'
      },
      'students.addStudent': {
        'AR': 'إضافة تلميذ',
        'FR': 'Ajouter un élève',
        'EN': 'Add student',
        'ES': 'Agregar estudiante',
        'IT': 'Aggiungi studente',
        'DE': 'Schüler hinzufügen',
        'TR': 'Öğrenci ekle'
      },
      'students.search': {
        'AR': 'البحث',
        'FR': 'Rechercher',
        'EN': 'Search',
        'ES': 'Buscar',
        'IT': 'Cerca',
        'DE': 'Suchen',
        'TR': 'Ara'
      },
      'students.searchPlaceholder': {
        'AR': 'ابحث بالاسم، اللقب، تاريخ الميلاد، مكان الميلاد، الجنس، القسم، معيد...',
        'FR': 'Rechercher par nom, prénom, date de naissance, lieu de naissance, sexe, classe, redoublant...',
        'EN': 'Search by name, surname, birth date, birth place, gender, class, repeater...',
        'ES': 'Buscar por nombre, apellido, fecha de nacimiento, lugar de nacimiento, género, clase, repetidor...',
        'IT': 'Cerca per nome, cognome, data di nascita, luogo di nascita, genere, classe, ripetente...',
        'DE': 'Suchen nach Name, Nachname, Geburtsdatum, Geburtsort, Geschlecht, Klasse, Wiederholer...',
        'TR': 'İsim, soyad, doğum tarihi, doğum yeri, cinsiyet, sınıf, tekrar eden... ile ara'
      },
      'students.filterByClass': {
        'AR': 'تصفية حسب القسم',
        'FR': 'Filtrer par classe',
        'EN': 'Filter by class',
        'ES': 'Filtrar por clase',
        'IT': 'Filtra per classe',
        'DE': 'Nach Klasse filtern',
        'TR': 'Sınıfa göre filtrele'
      },
      'students.allClasses': {
        'AR': 'جميع الأقسام',
        'FR': 'Toutes les classes',
        'EN': 'All classes',
        'ES': 'Todas las clases',
        'IT': 'Tutte le classi',
        'DE': 'Alle Klassen',
        'TR': 'Tüm sınıflar'
      },
      'students.firstName': {
        'AR': 'الاسم',
        'FR': 'Prénom',
        'EN': 'First name',
        'ES': 'Nombre',
        'IT': 'Nome',
        'DE': 'Vorname',
        'TR': 'Ad'
      },
      'students.lastName': {
        'AR': 'اللقب',
        'FR': 'Nom',
        'EN': 'Last name',
        'ES': 'Apellido',
        'IT': 'Cognome',
        'DE': 'Nachname',
        'TR': 'Soyad'
      },
      'students.birthDate': {
        'AR': 'تاريخ الميلاد',
        'FR': 'Date de naissance',
        'EN': 'Birth date',
        'ES': 'Fecha de nacimiento',
        'IT': 'Data di nascita',
        'DE': 'Geburtsdatum',
        'TR': 'Doğum tarihi'
      },
      'students.birthPlace': {
        'AR': 'مكان الميلاد',
        'FR': 'Lieu de naissance',
        'EN': 'Birth place',
        'ES': 'Lugar de nacimiento',
        'IT': 'Luogo di nascita',
        'DE': 'Geburtsort',
        'TR': 'Doğum yeri'
      },
      'students.gender': {
        'AR': 'الجنس',
        'FR': 'Sexe',
        'EN': 'Gender',
        'ES': 'Género',
        'IT': 'Genere',
        'DE': 'Geschlecht',
        'TR': 'Cinsiyet'
      },
      'students.male': {
        'AR': 'ذكر',
        'FR': 'Masculin',
        'EN': 'Male',
        'ES': 'Masculino',
        'IT': 'Maschio',
        'DE': 'Männlich',
        'TR': 'Erkek'
      },
      'students.female': {
        'AR': 'أنثى',
        'FR': 'Féminin',
        'EN': 'Female',
        'ES': 'Femenino',
        'IT': 'Femmina',
        'DE': 'Weiblich',
        'TR': 'Kadın'
      },
      'students.class': {
        'AR': 'القسم',
        'FR': 'Classe',
        'EN': 'Class',
        'ES': 'Clase',
        'IT': 'Classe',
        'DE': 'Klasse',
        'TR': 'Sınıf'
      },
      'students.repeater': {
        'AR': 'معيد',
        'FR': 'Redoublant',
        'EN': 'Repeater',
        'ES': 'Repetidor',
        'IT': 'Ripetente',
        'DE': 'Wiederholer',
        'TR': 'Tekrar eden'
      },
      'students.yes': {
        'AR': 'نعم',
        'FR': 'Oui',
        'EN': 'Yes',
        'ES': 'Sí',
        'IT': 'Sì',
        'DE': 'Ja',
        'TR': 'Evet'
      },
      'students.no': {
        'AR': 'لا',
        'FR': 'Non',
        'EN': 'No',
        'ES': 'No',
        'IT': 'No',
        'DE': 'Nein',
        'TR': 'Hayır'
      },
      'students.filterByGender': {
        'AR': 'تصفية حسب الجنس',
        'FR': 'Filtrer par sexe',
        'EN': 'Filter by gender',
        'ES': 'Filtrar por género',
        'IT': 'Filtra per genere',
        'DE': 'Nach Geschlecht filtern',
        'TR': 'Cinsiyete göre filtrele'
      },
      'students.allGenders': {
        'AR': 'جميع الأجناس',
        'FR': 'Tous les sexes',
        'EN': 'All genders',
        'ES': 'Todos los géneros',
        'IT': 'Tutti i generi',
        'DE': 'Alle Geschlechter',
        'TR': 'Tüm cinsiyetler'
      },
      'students.filterByRepeater': {
        'AR': 'تصفية حسب المعيد',
        'FR': 'Filtrer par redoublant',
        'EN': 'Filter by repeater',
        'ES': 'Filtrar por repetidor',
        'IT': 'Filtra per ripetente',
        'DE': 'Nach Wiederholer filtern',
        'TR': 'Tekrar durumuna göre filtrele'
      },
      'students.allRepeaterOptions': {
        'AR': 'الكل',
        'FR': 'Tous',
        'EN': 'All',
        'ES': 'Todos',
        'IT': 'Tutti',
        'DE': 'Alle',
        'TR': 'Hepsi'
      },
      'students.repeaterOnly': {
        'AR': 'معيد',
        'FR': 'Redoublant',
        'EN': 'Repeater',
        'ES': 'Repe',
        'IT': 'Ripetente',
        'DE': 'Wiederholer',
        'TR': 'Tekrar'
      },
      'students.nonRepeaterOnly': {
        'AR': 'غير معيد',
        'FR': 'Non redoublant',
        'EN': 'Non repeater',
        'ES': 'No repetidor',
        'IT': 'Non ripetente',
        'DE': 'Kein Wiederholer',
        'TR': 'Tekrar etmeyen'
      },
      'students.filterByGroup': {
        'AR': 'تصفية حسب المجموعة',
        'FR': 'Filtrer par groupe',
        'EN': 'Filter by group',
        'ES': 'Filtrar por grupo',
        'IT': 'Filtra per gruppo',
        'DE': 'Nach Gruppe filtern',
        'TR': 'Gruba göre filtrele'
      },
      'students.allGroups': {
        'AR': 'جميع المجموعات',
        'FR': 'Tous les groupes',
        'EN': 'All groups',
        'ES': 'Todos los grupos',
        'IT': 'Tutti i gruppi',
        'DE': 'Alle Gruppen',
        'TR': 'Tüm gruplar'
      },
      'students.listTitle': {
        'AR': 'قائمة التلاميذ',
        'FR': 'Liste des élèves',
        'EN': 'Students list',
        'ES': 'Lista de estudiantes',
        'IT': 'Elenco studenti',
        'DE': 'Schülerliste',
        'TR': 'Öğrenci listesi'
      },
      'students.photo': {
        'AR': 'الصورة',
        'FR': 'Photo',
        'EN': 'Photo',
        'ES': 'Foto',
        'IT': 'Foto',
        'DE': 'Foto',
        'TR': 'Fotoğraf'
      },
      'students.idNumberLabel': {
        'AR': 'رقم الهوية / الكود',
        'FR': 'Numéro d\'identité / code',
        'EN': 'ID number / code',
        'ES': 'Número de identificación / código',
        'IT': 'Numero identificativo / codice',
        'DE': 'Ausweisnummer / Code',
        'TR': 'Kimlik numarası / kod'
      },
      'students.idNumberPlaceholder': {
        'AR': 'أدخل رقم الهوية',
        'FR': 'Entrez le numéro d\'identité',
        'EN': 'Enter ID number',
        'ES': 'Ingrese el número de identificación',
        'IT': 'Inserisci numero ID',
        'DE': 'Ausweisnummer eingeben',
        'TR': 'Kimlik numarasını girin'
      },
      'students.lastNamePlaceholder': {
        'AR': 'أدخل اللقب',
        'FR': 'Entrez le nom',
        'EN': 'Enter last name',
        'ES': 'Ingrese el apellido',
        'IT': 'Inserisci cognome',
        'DE': 'Nachnamen eingeben',
        'TR': 'Soyadı girin'
      },
      'students.firstNamePlaceholder': {
        'AR': 'أدخل الاسم',
        'FR': 'Entrez le prénom',
        'EN': 'Enter first name',
        'ES': 'Ingrese el nombre',
        'IT': 'Inserisci nome',
        'DE': 'Vornamen eingeben',
        'TR': 'Adı girin'
      },
      'students.birthPlacePlaceholder': {
        'AR': 'أدخل مكان الميلاد',
        'FR': 'Entrez le lieu de naissance',
        'EN': 'Enter birth place',
        'ES': 'Ingrese el lugar de nacimiento',
        'IT': 'Inserisci luogo di nascita',
        'DE': 'Geburtsort eingeben',
        'TR': 'Doğum yerini girin'
      },
      'students.selectGender': {
        'AR': 'اختر الجنس',
        'FR': 'Sélectionner le sexe',
        'EN': 'Select gender',
        'ES': 'Seleccionar género',
        'IT': 'Seleziona genere',
        'DE': 'Geschlecht wählen',
        'TR': 'Cinsiyet seçin'
      },
      'students.isRepeaterQuestion': {
        'AR': 'هل التلميذ معيد؟',
        'FR': 'L\'élève est-il redoublant ?',
        'EN': 'Is the student a repeater?',
        'ES': '¿El estudiante es repetidor?',
        'IT': 'Lo studente è ripetente?',
        'DE': 'Ist der Schüler Wiederholer?',
        'TR': 'Öğrenci tekrar eden mi?'
      },
      'students.studentNumber': {
        'AR': 'رقم التلميذ',
        'FR': 'Numéro de l\'élève',
        'EN': 'Student number',
        'ES': 'Número del estudiante',
        'IT': 'Numero studente',
        'DE': 'Schülernummer',
        'TR': 'Öğrenci numarası'
      },
      'students.studentNumberPlaceholder': {
        'AR': 'أدخل رقم التلميذ',
        'FR': 'Entrez le numéro de l\'élève',
        'EN': 'Enter student number',
        'ES': 'Ingrese el número del estudiante',
        'IT': 'Inserisci numero studente',
        'DE': 'Schülernummer eingeben',
        'TR': 'Öğrenci numarasını girin'
      },
      'students.noneOption': {
        'AR': 'لا يوجد',
        'FR': 'Aucun',
        'EN': 'None',
        'ES': 'Ninguno',
        'IT': 'Nessuno',
        'DE': 'Keiner',
        'TR': 'Yok'
      },
      'students.group': {
        'AR': 'المجموعة',
        'FR': 'Groupe',
        'EN': 'Group',
        'ES': 'Grupo',
        'IT': 'Gruppo',
        'DE': 'Gruppe',
        'TR': 'Grup'
      },
      'students.email': {
        'AR': 'البريد الإلكتروني',
        'FR': 'E-mail',
        'EN': 'Email',
        'ES': 'Correo electrónico',
        'IT': 'Email',
        'DE': 'E-Mail',
        'TR': 'E-posta'
      },
      'students.emailPlaceholder': {
        'AR': 'أدخل البريد الإلكتروني',
        'FR': 'Entrez l\'e-mail',
        'EN': 'Enter email',
        'ES': 'Ingrese el correo electrónico',
        'IT': 'Inserisci email',
        'DE': 'E-Mail eingeben',
        'TR': 'E-postayı girin'
      },
      'students.schoolId': {
        'AR': 'رقم الطالب',
        'FR': 'Numéro scolaire',
        'EN': 'School ID',
        'ES': 'Número escolar',
        'IT': 'Numero scolastico',
        'DE': 'Schulnummer',
        'TR': 'Okul numarası'
      },
      'students.schoolIdPlaceholder': {
        'AR': 'أدخل رقم الطالب',
        'FR': 'Entrez le numéro scolaire',
        'EN': 'Enter school ID',
        'ES': 'Ingrese el número escolar',
        'IT': 'Inserisci numero scolastico',
        'DE': 'Schulnummer eingeben',
        'TR': 'Okul numarasını girin'
      },
      'students.notes': {
        'AR': 'ملاحظات عامة',
        'FR': 'Remarques générales',
        'EN': 'General notes',
        'ES': 'Notas generales',
        'IT': 'Note generali',
        'DE': 'Allgemeine Notizen',
        'TR': 'Genel notlar'
      },
      'students.notesPlaceholder': {
        'AR': 'أدخل ملاحظات عامة',
        'FR': 'Entrez des remarques générales',
        'EN': 'Enter general notes',
        'ES': 'Ingrese notas generales',
        'IT': 'Inserisci note generali',
        'DE': 'Allgemeine Notizen eingeben',
        'TR': 'Genel notları girin'
      },
      'students.choosePhoto': {
        'AR': 'اختر صورة',
        'FR': 'Choisir une photo',
        'EN': 'Choose photo',
        'ES': 'Elegir foto',
        'IT': 'Scegli foto',
        'DE': 'Foto wählen',
        'TR': 'Fotoğraf seç'
      },
      'students.noData': {
        'AR': 'لا يوجد تلاميذ',
        'FR': 'Aucun élève',
        'EN': 'No students',
        'ES': 'No hay estudiantes',
        'IT': 'Nessuno studente',
        'DE': 'Keine Schüler',
        'TR': 'Öğrenci yok'
      },
      'students.editTitle': {
        'AR': 'تعديل التلميذ',
        'FR': 'Modifier l\'élève',
        'EN': 'Edit student',
        'ES': 'Editar estudiante',
        'IT': 'Modifica studente',
        'DE': 'Schüler bearbeiten',
        'TR': 'Öğrenciyi düzenle'
      },
      'students.addTitle': {
        'AR': 'إضافة تلميذ جديد',
        'FR': 'Ajouter un nouvel élève',
        'EN': 'Add new student',
        'ES': 'Agregar nuevo estudiante',
        'IT': 'Aggiungi nuovo studente',
        'DE': 'Neuen Schüler hinzufügen',
        'TR': 'Yeni öğrenci ekle'
      },
      'students.importing': {
        'AR': 'جاري الاستيراد...',
        'FR': 'Importation en cours...',
        'EN': 'Importing...',
        'ES': 'Importando...',
        'IT': 'Importazione in corso...',
        'DE': 'Importieren...',
        'TR': 'İçe aktarılıyor...'
      },
      'students.importSuccess': {
        'AR': 'نجح:',
        'FR': 'Réussis :',
        'EN': 'Success:',
        'ES': 'Éxitos:',
        'IT': 'Successi:',
        'DE': 'Erfolgreich:',
        'TR': 'Başarılı:'
      },
      'students.importFailed': {
        'AR': 'فشل:',
        'FR': 'Échecs :',
        'EN': 'Failed:',
        'ES': 'Fallidos:',
        'IT': 'Falliti:',
        'DE': 'Fehlgeschlagen:',
        'TR': 'Başarısız:'
      },
      'students.importTotal': {
        'AR': 'المجموع:',
        'FR': 'Total :',
        'EN': 'Total:',
        'ES': 'Total:',
        'IT': 'Totale:',
        'DE': 'Gesamt:',
        'TR': 'Toplam:'
      },
      'students.errorDetails': {
        'AR': 'تفاصيل الأخطاء:',
        'FR': 'Détails des erreurs :',
        'EN': 'Error details:',
        'ES': 'Detalles de errores:',
        'IT': 'Dettagli errori:',
        'DE': 'Fehlerdetails:',
        'TR': 'Hata detayları:'
      },

      // Attendance
      'attendance.title': {
        'AR': 'الحضور',
        'FR': 'Présence',
        'EN': 'Attendance',
        'ES': 'Asistencia',
        'IT': 'Presenze',
        'DE': 'Anwesenheit',
        'TR': 'Yoklama'
      },
      'attendance.lesson': {
        'AR': 'الحصة',
        'FR': 'Leçon',
        'EN': 'Lesson',
        'ES': 'Lección',
        'IT': 'Lezione',
        'DE': 'Stunde',
        'TR': 'Ders'
      },
      'attendance.today': {
        'AR': 'اليوم',
        'FR': 'Aujourd\'hui',
        'EN': 'Today',
        'ES': 'Hoy',
        'IT': 'Oggi',
        'DE': 'Heute',
        'TR': 'Bugün'
      },
      'attendance.selectClass': {
        'AR': 'اختر القسم',
        'FR': 'Sélectionner la classe',
        'EN': 'Select class',
        'ES': 'Seleccionar clase',
        'IT': 'Seleziona classe',
        'DE': 'Klasse auswählen',
        'TR': 'Sınıf seç'
      },
      'attendance.lessonTime': {
        'AR': 'وقت الحصة',
        'FR': 'Heure de la leçon',
        'EN': 'Lesson time',
        'ES': 'Hora de la lección',
        'IT': 'Ora della lezione',
        'DE': 'Stundenzeit',
        'TR': 'Ders saati'
      },
      'attendance.subject': {
        'AR': 'المادة',
        'FR': 'Matière',
        'EN': 'Subject',
        'ES': 'Asignatura',
        'IT': 'Materia',
        'DE': 'Fach',
        'TR': 'Ders'
      },
      'attendance.subjectPlaceholder': {
        'AR': 'اسم المادة',
        'FR': 'Nom de la matière',
        'EN': 'Subject name',
        'ES': 'Nombre de la asignatura',
        'IT': 'Nome della materia',
        'DE': 'Fachname',
        'TR': 'Ders adı'
      },
      'attendance.timePlaceholder': {
        'AR': '08:00-09:00',
        'FR': '08:00-09:00',
        'EN': '08:00-09:00',
        'ES': '08:00-09:00',
        'IT': '08:00-09:00',
        'DE': '08:00-09:00',
        'TR': '08:00-09:00'
      },
      'attendance.toggleDaily': {
        'AR': 'عرض يومي',
        'FR': 'Vue quotidienne',
        'EN': 'Daily view',
        'ES': 'Vista diaria',
        'IT': 'Vista giornaliera',
        'DE': 'Tagesansicht',
        'TR': 'Günlük görünüm'
      },
      'attendance.toggleWeekly': {
        'AR': 'عرض أسبوعي',
        'FR': 'Vue hebdomadaire',
        'EN': 'Weekly view',
        'ES': 'Vista semanal',
        'IT': 'Vista settimanale',
        'DE': 'Wochenansicht',
        'TR': 'Haftalık görünüm'
      },
      'attendance.reports': {
        'AR': 'التقارير',
        'FR': 'Rapports',
        'EN': 'Reports',
        'ES': 'Informes',
        'IT': 'Rapporti',
        'DE': 'Berichte',
        'TR': 'Raporlar'
      },
      'attendance.date': {
        'AR': 'التاريخ:',
        'FR': 'Date :',
        'EN': 'Date:',
        'ES': 'Fecha:',
        'IT': 'Data:',
        'DE': 'Datum:',
        'TR': 'Tarih:'
      },
      'attendance.dateHeader': {
        'AR': 'التاريخ',
        'FR': 'Date',
        'EN': 'Date',
        'ES': 'Fecha',
        'IT': 'Data',
        'DE': 'Datum',
        'TR': 'Tarih'
      },
      'attendance.noStudents': {
        'AR': 'لا يوجد تلاميذ في هذا القسم',
        'FR': 'Aucun élève dans cette classe',
        'EN': 'No students in this class',
        'ES': 'No hay estudiantes en esta clase',
        'IT': 'Nessuno studente in questa classe',
        'DE': 'Keine Schüler in dieser Klasse',
        'TR': 'Bu sınıfta öğrenci yok'
      },
      'attendance.prevWeek': {
        'AR': '← الأسبوع السابق',
        'FR': '← Semaine précédente',
        'EN': '← Previous week',
        'ES': '← Semana anterior',
        'IT': '← Settimana precedente',
        'DE': '← Vorherige Woche',
        'TR': '← Önceki hafta'
      },
      'attendance.nextWeek': {
        'AR': 'الأسبوع التالي →',
        'FR': 'Semaine suivante →',
        'EN': 'Next week →',
        'ES': 'Siguiente semana →',
        'IT': 'Settimana successiva →',
        'DE': 'Nächste Woche →',
        'TR': 'Sonraki hafta →'
      },
      'attendance.weeklyViewTitle': {
        'AR': 'عرض أسبوعي',
        'FR': 'Vue hebdomadaire',
        'EN': 'Weekly view',
        'ES': 'Vista semanal',
        'IT': 'Vista settimanale',
        'DE': 'Wochenansicht',
        'TR': 'Haftalık görünüm'
      },
      'attendance.studentName': {
        'AR': 'اسم التلميذ',
        'FR': 'Nom de l\'élève',
        'EN': 'Student name',
        'ES': 'Nombre del estudiante',
        'IT': 'Nome dello studente',
        'DE': 'Schülername',
        'TR': 'Öğrenci adı'
      },
      'attendance.saveWeek': {
        'AR': 'حفظ الحضور للأسبوع',
        'FR': 'Enregistrer la présence pour la semaine',
        'EN': 'Save week attendance',
        'ES': 'Guardar asistencia semanal',
        'IT': 'Salva presenze della settimana',
        'DE': 'Wöchentliche Anwesenheit speichern',
        'TR': 'Haftalık yoklamayı kaydet'
      },
      'attendance.absencesReport': {
        'AR': 'تقرير الغيابات',
        'FR': 'Rapport des absences',
        'EN': 'Absences report',
        'ES': 'Informe de ausencias',
        'IT': 'Rapporto assenze',
        'DE': 'Abwesenheitsbericht',
        'TR': 'Devamsızlık raporu'
      },
      'attendance.statisticsReport': {
        'AR': 'إحصائيات الحضور',
        'FR': 'Statistiques de présence',
        'EN': 'Attendance statistics',
        'ES': 'Estadísticas de asistencia',
        'IT': 'Statistiche di presenza',
        'DE': 'Anwesenheitsstatistiken',
        'TR': 'Yoklama istatistikleri'
      },
      'attendance.classReport': {
        'AR': 'تقرير حضور القسم',
        'FR': 'Rapport de présence de la classe',
        'EN': 'Class attendance report',
        'ES': 'Informe de asistencia de la clase',
        'IT': 'Rapporto presenze della classe',
        'DE': 'Klassenanwesenheitsbericht',
        'TR': 'Sınıf yoklama raporu'
      },
      'attendance.absencesTab': {
        'AR': 'أعلى الغيابات',
        'FR': 'Plus hautes absences',
        'EN': 'Highest absences',
        'ES': 'Mayores ausencias',
        'IT': 'Assenze più alte',
        'DE': 'Höchste Abwesenheiten',
        'TR': 'En yüksek devamsızlıklar'
      },
      'attendance.statisticsTab': {
        'AR': 'الإحصائيات',
        'FR': 'Statistiques',
        'EN': 'Statistics',
        'ES': 'Estadísticas',
        'IT': 'Statistiche',
        'DE': 'Statistiken',
        'TR': 'İstatistikler'
      },
      'attendance.classTab': {
        'AR': 'حضور القسم',
        'FR': 'Présence de la classe',
        'EN': 'Class attendance',
        'ES': 'Asistencia de la clase',
        'IT': 'Presenze della classe',
        'DE': 'Klassenanwesenheit',
        'TR': 'Sınıf yoklaması'
      },
      'attendance.presentDays': {
        'AR': 'أيام الحضور',
        'FR': 'Jours de présence',
        'EN': 'Present days',
        'ES': 'Días de asistencia',
        'IT': 'Giorni di presenza',
        'DE': 'Anwesenheitstage',
        'TR': 'Devam günleri'
      },
      'attendance.absentDays': {
        'AR': 'أيام الغياب',
        'FR': 'Jours d\'absence',
        'EN': 'Absent days',
        'ES': 'Días de ausencia',
        'IT': 'Giorni di assenza',
        'DE': 'Abwesenheitstage',
        'TR': 'Devamsızlık günleri'
      },
      'attendance.lateDays': {
        'AR': 'أيام التأخر',
        'FR': 'Jours de retard',
        'EN': 'Late days',
        'ES': 'Días de tardanza',
        'IT': 'Giorni di ritardo',
        'DE': 'Verspätungstage',
        'TR': 'Geç kalma günleri'
      },
      'attendance.attendanceRate': {
        'AR': 'نسبة الحضور',
        'FR': 'Taux de présence',
        'EN': 'Attendance rate',
        'ES': 'Tasa de asistencia',
        'IT': 'Tasso di presenza',
        'DE': 'Anwesenheitsrate',
        'TR': 'Yoklama oranı'
      },
      'attendance.noData': {
        'AR': 'لا توجد بيانات',
        'FR': 'Aucune donnée',
        'EN': 'No data',
        'ES': 'Sin datos',
        'IT': 'Nessun dato',
        'DE': 'Keine Daten',
        'TR': 'Veri yok'
      },
      'attendance.statisticsByClass': {
        'AR': 'إحصائيات حسب القسم',
        'FR': 'Statistiques par classe',
        'EN': 'Statistics by class',
        'ES': 'Estadísticas por clase',
        'IT': 'Statistiche per classe',
        'DE': 'Statistiken nach Klasse',
        'TR': 'Sınıfa göre istatistikler'
      },
      'attendance.statisticsByDay': {
        'AR': 'إحصائيات حسب اليوم',
        'FR': 'Statistiques par jour',
        'EN': 'Statistics by day',
        'ES': 'Estadísticas por día',
        'IT': 'Statistiche per giorno',
        'DE': 'Statistiken nach Tag',
        'TR': 'Güne göre istatistikler'
      },
      'attendance.statisticsByMonth': {
        'AR': 'إحصائيات حسب الشهر',
        'FR': 'Statistiques par mois',
        'EN': 'Statistics by month',
        'ES': 'Estadísticas por mes',
        'IT': 'Statistiche per mese',
        'DE': 'Statistiken nach Monat',
        'TR': 'Aya göre istatistikler'
      },
      'attendance.month': {
        'AR': 'الشهر',
        'FR': 'Mois',
        'EN': 'Month',
        'ES': 'Mes',
        'IT': 'Mese',
        'DE': 'Monat',
        'TR': 'Ay'
      },
      'attendance.day': {
        'AR': 'اليوم',
        'FR': 'Jour',
        'EN': 'Day',
        'ES': 'Día',
        'IT': 'Giorno',
        'DE': 'Tag',
        'TR': 'Gün'
      },
      'attendance.status': {
        'AR': 'الحالة',
        'FR': 'Statut',
        'EN': 'Status',
        'ES': 'Estado',
        'IT': 'Stato',
        'DE': 'Status',
        'TR': 'Durum'
      },
      'attendance.total': {
        'AR': 'الإجمالي',
        'FR': 'Total',
        'EN': 'Total',
        'ES': 'Total',
        'IT': 'Totale',
        'DE': 'Gesamt',
        'TR': 'Toplam'
      },
      'attendance.lessonTimeColumn': {
        'AR': 'وقت الحصة',
        'FR': 'Heure de la leçon',
        'EN': 'Lesson time',
        'ES': 'Hora de la lección',
        'IT': 'Ora della lezione',
        'DE': 'Stundenzeit',
        'TR': 'Ders saati'
      },
      'attendance.lessonSubjectColumn': {
        'AR': 'المادة',
        'FR': 'Matière',
        'EN': 'Subject',
        'ES': 'Asignatura',
        'IT': 'Materia',
        'DE': 'Fach',
        'TR': 'Ders'
      },
      'attendance.noAttendanceRecords': {
        'AR': 'لا توجد سجلات حضور',
        'FR': 'Aucun enregistrement de présence',
        'EN': 'No attendance records',
        'ES': 'No hay registros de asistencia',
        'IT': 'Nessun registro di presenza',
        'DE': 'Keine Anwesenheitsaufzeichnungen',
        'TR': 'Yoklama kaydı yok'
      },
      'attendance.exportPDF': {
        'AR': 'تصدير PDF',
        'FR': 'Exporter PDF',
        'EN': 'Export PDF',
        'ES': 'Exportar PDF',
        'IT': 'Esporta PDF',
        'DE': 'PDF exportieren',
        'TR': 'PDF dışa aktar'
      },
      'attendance.present': {
        'AR': 'حاضر',
        'FR': 'Présent',
        'EN': 'Present',
        'ES': 'Presente',
        'IT': 'Presente',
        'DE': 'Anwesend',
        'TR': 'Mevcut'
      },
      'attendance.absent': {
        'AR': 'غائب',
        'FR': 'Absent',
        'EN': 'Absent',
        'ES': 'Ausente',
        'IT': 'Assente',
        'DE': 'Abwesend',
        'TR': 'Yok'
      },
      'attendance.excused': {
        'AR': 'مرخّص',
        'FR': 'Excusé',
        'EN': 'Excused',
        'ES': 'Justificado',
        'IT': 'Giustificato',
        'DE': 'Entschuldigt',
        'TR': 'Mazeretli'
      },
      'attendance.leftEarly': {
        'AR': 'غادر مبكراً',
        'FR': 'Parti plus tôt',
        'EN': 'Left early',
        'ES': 'Se fue temprano',
        'IT': 'Uscito prima',
        'DE': 'Früh gegangen',
        'TR': 'Erken ayrıldı'
      },
      'attendance.late': {
        'AR': 'متأخر',
        'FR': 'En retard',
        'EN': 'Late',
        'ES': 'Tarde',
        'IT': 'In ritardo',
        'DE': 'Verspätet',
        'TR': 'Geç'
      },
      'attendance.sick': {
        'AR': 'مريض',
        'FR': 'Malade',
        'EN': 'Sick',
        'ES': 'Enfermo',
        'IT': 'Malato',
        'DE': 'Krank',
        'TR': 'Hasta'
      },
      'attendance.save': {
        'AR': 'حفظ',
        'FR': 'Enregistrer',
        'EN': 'Save',
        'ES': 'Guardar',
        'IT': 'Salva',
        'DE': 'Speichern',
        'TR': 'Kaydet'
      },

      // Behavior
      'behavior.title': {
        'AR': 'إدارة السلوك',
        'FR': 'Gestion du comportement',
        'EN': 'Behavior Management',
        'ES': 'Gestión del comportamiento',
        'IT': 'Gestione comportamento',
        'DE': 'Verhaltensverwaltung',
        'TR': 'Davranış Yönetimi'
      },
      'behavior.classReport': {
        'AR': 'تقرير القسم',
        'FR': 'Rapport de classe',
        'EN': 'Class report',
        'ES': 'Informe de clase',
        'IT': 'Rapporto classe',
        'DE': 'Klassenbericht',
        'TR': 'Sınıf raporu'
      },
      'behavior.selectClass': {
        'AR': 'اختر القسم',
        'FR': 'Sélectionner la classe',
        'EN': 'Select class',
        'ES': 'Seleccionar clase',
        'IT': 'Seleziona classe',
        'DE': 'Klasse auswählen',
        'TR': 'Sınıf seç'
      },
      'behavior.positive': {
        'AR': 'إيجابي',
        'FR': 'Positif',
        'EN': 'Positive',
        'ES': 'Positivo',
        'IT': 'Positivo',
        'DE': 'Positiv',
        'TR': 'Pozitif'
      },
      'behavior.negative': {
        'AR': 'سلبي',
        'FR': 'Négatif',
        'EN': 'Negative',
        'ES': 'Negativo',
        'IT': 'Negativo',
        'DE': 'Negativ',
        'TR': 'Negatif'
      },
      'behavior.addBehavior': {
        'AR': 'إضافة سلوك',
        'FR': 'Ajouter un comportement',
        'EN': 'Add behavior',
        'ES': 'Agregar comportamiento',
        'IT': 'Aggiungi comportamento',
        'DE': 'Verhalten hinzufügen',
        'TR': 'Davranış ekle'
      },
      'behavior.date': {
        'AR': 'التاريخ',
        'FR': 'Date',
        'EN': 'Date',
        'ES': 'Fecha',
        'IT': 'Data',
        'DE': 'Datum',
        'TR': 'Tarih'
      },
      'behavior.description': {
        'AR': 'الوصف',
        'FR': 'Description',
        'EN': 'Description',
        'ES': 'Descripción',
        'IT': 'Descrizione',
        'DE': 'Beschreibung',
        'TR': 'Açıklama'
      },

      // Seating Chart
      'seatingChart.title': {
        'AR': 'مخطط المقاعد',
        'FR': 'Plan de placement',
        'EN': 'Seating Chart',
        'ES': 'Plano de asientos',
        'IT': 'Schema posti',
        'DE': 'Sitzplan',
        'TR': 'Oturma Planı'
      },
      'seatingChart.allStudentsAssigned': {
        'AR': 'جميع تلاميذ الفوج تم توزيعهم',
        'FR': 'Tous les élèves du groupe ont été assignés',
        'EN': 'All group students have been assigned',
        'ES': 'Todos los estudiantes del grupo han sido asignados',
        'IT': 'Tutti gli studenti del gruppo sono stati assegnati',
        'DE': 'Alle Gruppenschüler wurden zugewiesen',
        'TR': 'Grupun tüm öğrencileri atandı'
      },
      'seatingChart.selectComputers': {
        'AR': 'اختيار الحواسيب للطباعة:',
        'FR': 'Sélectionner les ordinateurs pour l\'impression:',
        'EN': 'Select computers for printing:',
        'ES': 'Seleccionar computadoras para imprimir:',
        'IT': 'Seleziona computer per la stampa:',
        'DE': 'Computer zum Drucken auswählen:',
        'TR': 'Yazdırma için bilgisayarları seçin:'
      },
      'seatingChart.selectAllStations': {
        'AR': 'تحديد / إلغاء كل الحواسيب',
        'FR': 'Sélectionner / Désélectionner tous les ordinateurs',
        'EN': 'Select / Deselect all computers',
        'ES': 'Seleccionar / Deseleccionar todas las computadoras',
        'IT': 'Seleziona / Deseleziona tutti i computer',
        'DE': 'Alle Computer auswählen / abwählen',
        'TR': 'Tüm bilgisayarları seç / seçimi kaldır'
      },
      'seatingChart.printAllIfNoneSelected': {
        'AR': 'إذا لم تحدد شيئاً سيتم طباعة كل الحواسيب.',
        'FR': 'Si vous ne sélectionnez rien, tous les ordinateurs seront imprimés.',
        'EN': 'If you don\'t select anything, all computers will be printed.',
        'ES': 'Si no selecciona nada, se imprimirán todas las computadoras.',
        'IT': 'Se non selezioni nulla, verranno stampati tutti i computer.',
        'DE': 'Wenn Sie nichts auswählen, werden alle Computer gedruckt.',
        'TR': 'Hiçbir şey seçmezseniz, tüm bilgisayarlar yazdırılacaktır.'
      },
      'seatingChart.capacity': {
        'AR': 'سعة',
        'FR': 'Capacité',
        'EN': 'Capacity',
        'ES': 'Capacidad',
        'IT': 'Capacità',
        'DE': 'Kapazität',
        'TR': 'Kapasite'
      },
      'seatingChart.includesAllClasses': {
        'AR': 'يتضمن جميع الأقسام والفوجات',
        'FR': 'Inclut toutes les classes et groupes',
        'EN': 'Includes all classes and groups',
        'ES': 'Incluye todas las clases y grupos',
        'IT': 'Include tutte le classi e i gruppi',
        'DE': 'Umfasst alle Klassen und Gruppen',
        'TR': 'Tüm sınıfları ve grupları içerir'
      },
      'seatingChart.group': {
        'AR': 'الفوج',
        'FR': 'Groupe',
        'EN': 'Group',
        'ES': 'Grupo',
        'IT': 'Gruppo',
        'DE': 'Gruppe',
        'TR': 'Grup'
      },
      'seatingChart.noSubject': {
        'AR': 'بدون مادة',
        'FR': 'Sans matière',
        'EN': 'No subject',
        'ES': 'Sin asignatura',
        'IT': 'Nessuna materia',
        'DE': 'Kein Fach',
        'TR': 'Ders yok'
      },
      'seatingChart.noStudentsInComputer': {
        'AR': 'لا يوجد تلاميذ في هذا الحاسوب لهذا القسم.',
        'FR': 'Il n\'y a pas d\'élèves sur cet ordinateur pour cette classe.',
        'EN': 'No students on this computer for this class.',
        'ES': 'No hay estudiantes en esta computadora para esta clase.',
        'IT': 'Nessuno studente su questo computer per questa classe.',
        'DE': 'Keine Schüler auf diesem Computer für diese Klasse.',
        'TR': 'Bu sınıf için bu bilgisayarda öğrenci yok.'
      },

      // Labs
      'labs.title': {
        'AR': 'إدارة المخبر',
        'FR': 'Gestion du laboratoire',
        'EN': 'Lab Management',
        'ES': 'Gestión del laboratorio',
        'IT': 'Gestione laboratorio',
        'DE': 'Laborverwaltung',
        'TR': 'Laboratuvar Yönetimi'
      },
      'labs.equipment': {
        'AR': 'الأجهزة',
        'FR': 'Équipements',
        'EN': 'Equipment',
        'ES': 'Equipos',
        'IT': 'Attrezzature',
        'DE': 'Ausrüstung',
        'TR': 'Ekipmanlar'
      },
      'labs.software': {
        'AR': 'البرامج',
        'FR': 'Logiciels',
        'EN': 'Software',
        'ES': 'Software',
        'IT': 'Software',
        'DE': 'Software',
        'TR': 'Yazılımlar'
      },
      'labs.furniture': {
        'AR': 'الأثاث',
        'FR': 'Mobilier',
        'EN': 'Furniture',
        'ES': 'Mobiliario',
        'IT': 'Arredamento',
        'DE': 'Möbel',
        'TR': 'Mobilya'
      },
      'labs.deviceLogs': {
        'AR': 'سجل الأجهزة',
        'FR': 'Journal des équipements',
        'EN': 'Device logs',
        'ES': 'Registro de dispositivos',
        'IT': 'Registro dispositivi',
        'DE': 'Geräteprotokolle',
        'TR': 'Cihaz kayıtları'
      },
      'labs.maintenance': {
        'AR': 'الصيانة',
        'FR': 'Maintenance',
        'EN': 'Maintenance',
        'ES': 'Mantenimiento',
        'IT': 'Manutenzione',
        'DE': 'Wartung',
        'TR': 'Bakım'
      },
      'labs.addDevice': {
        'AR': 'إضافة جهاز',
        'FR': 'Ajouter un équipement',
        'EN': 'Add device',
        'ES': 'Agregar dispositivo',
        'IT': 'Aggiungi dispositivo',
        'DE': 'Gerät hinzufügen',
        'TR': 'Cihaz ekle'
      },
      'labs.deviceName': {
        'AR': 'اسم الجهاز',
        'FR': 'Nom de l\'équipement',
        'EN': 'Device name',
        'ES': 'Nombre del dispositivo',
        'IT': 'Nome dispositivo',
        'DE': 'Gerätename',
        'TR': 'Cihaz adı'
      },
      'labs.status': {
        'AR': 'الحالة',
        'FR': 'État',
        'EN': 'Status',
        'ES': 'Estado',
        'IT': 'Stato',
        'DE': 'Status',
        'TR': 'Durum'
      },
      'labs.working': {
        'AR': 'يعمل',
        'FR': 'Fonctionnel',
        'EN': 'Working',
        'ES': 'Funcionando',
        'IT': 'Funzionante',
        'DE': 'Funktioniert',
        'TR': 'Çalışıyor'
      },
      'labs.broken': {
        'AR': 'معطل',
        'FR': 'Défectueux',
        'EN': 'Broken',
        'ES': 'Roto',
        'IT': 'Rotto',
        'DE': 'Defekt',
        'TR': 'Bozuk'
      },
      'labs.inMaintenance': {
        'AR': 'قيد الصيانة',
        'FR': 'En maintenance',
        'EN': 'In maintenance',
        'ES': 'En mantenimiento',
        'IT': 'In manutenzione',
        'DE': 'In Wartung',
        'TR': 'Bakımda'
      },

      // Timetable
      'timetable.title': {
        'AR': 'جدول الأوقات',
        'FR': 'Emploi du temps',
        'EN': 'Timetable',
        'ES': 'Horario',
        'IT': 'Orario',
        'DE': 'Stundenplan',
        'TR': 'Ders Programı'
      },
      'timetable.weekly': {
        'AR': 'أسبوعي',
        'FR': 'Hebdomadaire',
        'EN': 'Weekly',
        'ES': 'Semanal',
        'IT': 'Settimanale',
        'DE': 'Wöchentlich',
        'TR': 'Haftalık'
      },
      'timetable.daily': {
        'AR': 'يومي',
        'FR': 'Quotidien',
        'EN': 'Daily',
        'ES': 'Diario',
        'IT': 'Giornaliero',
        'DE': 'Täglich',
        'TR': 'Günlük'
      },
      'timetable.monthly': {
        'AR': 'شهري',
        'FR': 'Mensuel',
        'EN': 'Monthly',
        'ES': 'Mensual',
        'IT': 'Mensile',
        'DE': 'Monatlich',
        'TR': 'Aylık'
      },
      'timetable.addLesson': {
        'AR': 'إضافة حصة',
        'FR': 'Ajouter une leçon',
        'EN': 'Add lesson',
        'ES': 'Agregar lección',
        'IT': 'Aggiungi lezione',
        'DE': 'Stunde hinzufügen',
        'TR': 'Ders ekle'
      },
      'timetable.class': {
        'AR': 'القسم',
        'FR': 'Classe',
        'EN': 'Class',
        'ES': 'Clase',
        'IT': 'Classe',
        'DE': 'Klasse',
        'TR': 'Sınıf'
      },
      'timetable.subject': {
        'AR': 'المادة',
        'FR': 'Matière',
        'EN': 'Subject',
        'ES': 'Asignatura',
        'IT': 'Materia',
        'DE': 'Fach',
        'TR': 'Ders'
      },
      'timetable.time': {
        'AR': 'الوقت',
        'FR': 'Heure',
        'EN': 'Time',
        'ES': 'Hora',
        'IT': 'Ora',
        'DE': 'Zeit',
        'TR': 'Saat'
      },
      'timetable.teacher': {
        'AR': 'الأستاذ',
        'FR': 'Professeur',
        'EN': 'Teacher',
        'ES': 'Profesor',
        'IT': 'Insegnante',
        'DE': 'Lehrer',
        'TR': 'Öğretmen'
      },
      'timetable.room': {
        'AR': 'القاعة',
        'FR': 'Salle',
        'EN': 'Room',
        'ES': 'Aula',
        'IT': 'Aula',
        'DE': 'Raum',
        'TR': 'Sınıf'
      },

      // Topics
      'topics.title': {
        'AR': 'إدارة المواضيع',
        'FR': 'Gestion des sujets',
        'EN': 'Topic Management',
        'ES': 'Gestión de temas',
        'IT': 'Gestione argomenti',
        'DE': 'Themenverwaltung',
        'TR': 'Konu Yönetimi'
      },
      'topics.addNew': {
        'AR': 'إضافة موضوع جديد',
        'FR': 'Ajouter un nouveau sujet',
        'EN': 'Add new topic',
        'ES': 'Agregar nuevo tema',
        'IT': 'Aggiungi nuovo argomento',
        'DE': 'Neues Thema hinzufügen',
        'TR': 'Yeni konu ekle'
      },
      'topics.editTopic': {
        'AR': 'تعديل الموضوع',
        'FR': 'Modifier le sujet',
        'EN': 'Edit topic',
        'ES': 'Editar tema',
        'IT': 'Modifica argomento',
        'DE': 'Thema bearbeiten',
        'TR': 'Konuyu düzenle'
      },
      'topics.topicTitle': {
        'AR': 'عنوان الموضوع *',
        'FR': 'Titre du sujet *',
        'EN': 'Topic title *',
        'ES': 'Título del tema *',
        'IT': 'Titolo argomento *',
        'DE': 'Thementitel *',
        'TR': 'Konu başlığı *'
      },
      'topics.topicTitlePlaceholder': {
        'AR': 'أدخل عنوان الموضوع',
        'FR': 'Entrez le titre du sujet',
        'EN': 'Enter topic title',
        'ES': 'Ingrese el título del tema',
        'IT': 'Inserisci titolo argomento',
        'DE': 'Thementitel eingeben',
        'TR': 'Konu başlığını girin'
      },
      'topics.topicDescription': {
        'AR': 'وصف الموضوع',
        'FR': 'Description du sujet',
        'EN': 'Topic description',
        'ES': 'Descripción del tema',
        'IT': 'Descrizione argomento',
        'DE': 'Themenbeschreibung',
        'TR': 'Konu açıklaması'
      },
      'topics.topicDescriptionPlaceholder': {
        'AR': 'أدخل وصف الموضوع',
        'FR': 'Entrez la description du sujet',
        'EN': 'Enter topic description',
        'ES': 'Ingrese la descripción del tema',
        'IT': 'Inserisci descrizione argomento',
        'DE': 'Themenbeschreibung eingeben',
        'TR': 'Konu açıklamasını girin'
      },
      'topics.topicElements': {
        'AR': 'عناصر الموضوع',
        'FR': 'Éléments du sujet',
        'EN': 'Topic elements',
        'ES': 'Elementos del tema',
        'IT': 'Elementi argomento',
        'DE': 'Themenelemente',
        'TR': 'Konu öğeleri'
      },

      // Notebooks
      'notebooks.title': {
        'AR': 'إدارة الدفاتر',
        'FR': 'Gestion des cahiers',
        'EN': 'Notebook Management',
        'ES': 'Gestión de cuadernos',
        'IT': 'Gestione quaderni',
        'DE': 'Hefteverwaltung',
        'TR': 'Defter Yönetimi'
      },
      'notebooks.addNotebook': {
        'AR': 'إضافة دفتر',
        'FR': 'Ajouter un cahier',
        'EN': 'Add notebook',
        'ES': 'Agregar cuaderno',
        'IT': 'Aggiungi quaderno',
        'DE': 'Heft hinzufügen',
        'TR': 'Defter ekle'
      },
      'notebooks.notebookName': {
        'AR': 'اسم الدفتر',
        'FR': 'Nom du cahier',
        'EN': 'Notebook name',
        'ES': 'Nombre del cuaderno',
        'IT': 'Nome quaderno',
        'DE': 'Heftname',
        'TR': 'Defter adı'
      },
      'notebooks.class': {
        'AR': 'القسم',
        'FR': 'Classe',
        'EN': 'Class',
        'ES': 'Clase',
        'IT': 'Classe',
        'DE': 'Klasse',
        'TR': 'Sınıf'
      },
      'notebooks.subject': {
        'AR': 'المادة',
        'FR': 'Matière',
        'EN': 'Subject',
        'ES': 'Asignatura',
        'IT': 'Materia',
        'DE': 'Fach',
        'TR': 'Ders'
      },

      // Annual Distribution
      'annualDistribution.title': {
        'AR': 'إدارة التوزيع السنوي',
        'FR': 'Gestion de la répartition annuelle',
        'EN': 'Annual Distribution Management',
        'ES': 'Gestión de distribución anual',
        'IT': 'Gestione distribuzione annuale',
        'DE': 'Jährliche Verteilungsverwaltung',
        'TR': 'Yıllık Dağıtım Yönetimi'
      },
      'annualDistribution.addRow': {
        'AR': 'إضافة سطر في التوزيع السنوي',
        'FR': 'Ajouter une ligne dans la répartition annuelle',
        'EN': 'Add row to annual distribution',
        'ES': 'Agregar fila a distribución anual',
        'IT': 'Aggiungi riga alla distribuzione annuale',
        'DE': 'Zeile zur jährlichen Verteilung hinzufügen',
        'TR': 'Yıllık dağıtıma satır ekle'
      },
      'annualDistribution.topicTitle': {
        'AR': 'عنوان الموضوع (المجال / الوحدة)',
        'FR': 'Titre du sujet (Domaine / Unité)',
        'EN': 'Topic title (Domain / Unit)',
        'ES': 'Título del tema (Dominio / Unidad)',
        'IT': 'Titolo argomento (Dominio / Unità)',
        'DE': 'Thementitel (Bereich / Einheit)',
        'TR': 'Konu başlığı (Alan / Birim)'
      },
      'annualDistribution.selectTopicTitle': {
        'AR': 'اختر عنوان الموضوع',
        'FR': 'Sélectionner le titre du sujet',
        'EN': 'Select topic title',
        'ES': 'Seleccionar título del tema',
        'IT': 'Seleziona titolo argomento',
        'DE': 'Thementitel auswählen',
        'TR': 'Konu başlığını seç'
      },
      'annualDistribution.withHolidays': {
        'AR': 'التوزيع السنوي (مع الإزاحة حسب العطل)',
        'FR': 'Répartition annuelle (avec décalage selon les vacances)',
        'EN': 'Annual distribution (with offset according to holidays)',
        'ES': 'Distribución anual (con desplazamiento según vacaciones)',
        'IT': 'Distribuzione annuale (con offset secondo le vacanze)',
        'DE': 'Jährliche Verteilung (mit Versatz nach Feiertagen)',
        'TR': 'Yıllık dağıtım (tatillere göre ofset ile)'
      },
      'annualDistribution.noDistribution': {
        'AR': 'لم تتم إضافة أي توزيع أو عطلة بعد لهذه السنة والمستوى.',
        'FR': 'Aucune répartition ou vacance n\'a encore été ajoutée pour cette année et ce niveau.',
        'EN': 'No distribution or holiday has been added yet for this year and level.',
        'ES': 'Aún no se ha agregado ninguna distribución o vacación para este año y nivel.',
        'IT': 'Nessuna distribuzione o vacanza è stata ancora aggiunta per quest\'anno e livello.',
        'DE': 'Für dieses Jahr und Niveau wurde noch keine Verteilung oder Feiertag hinzugefügt.',
        'TR': 'Bu yıl ve seviye için henüz dağıtım veya tatil eklenmedi.'
      },

      // Progress Tracking
      'progressTracking.title': {
        'AR': 'متابعة إنجاز برنامج مادة الإعلام الآلي',
        'FR': 'Suivi de l\'accomplissement du programme de la matière informatique',
        'EN': 'Progress tracking of computer science program',
        'ES': 'Seguimiento del progreso del programa de informática',
        'IT': 'Monitoraggio progressi programma informatica',
        'DE': 'Fortschrittsverfolgung des Informatikprogramms',
        'TR': 'Bilgisayar bilimi programı ilerleme takibi'
      },
      'progressTracking.teacher': {
        'AR': 'الأستاذ',
        'FR': 'Professeur',
        'EN': 'Teacher',
        'ES': 'Profesor',
        'IT': 'Insegnante',
        'DE': 'Lehrer',
        'TR': 'Öğretmen'
      },
      'progressTracking.class': {
        'AR': 'القسم',
        'FR': 'Classe',
        'EN': 'Class',
        'ES': 'Clase',
        'IT': 'Classe',
        'DE': 'Klasse',
        'TR': 'Sınıf'
      },

      // Teacher Card
      'teacherCard.title': {
        'AR': 'بطاقة فنية للأستاذ',
        'FR': 'Carte technique du professeur',
        'EN': 'Teacher Technical Card',
        'ES': 'Tarjeta técnica del profesor',
        'IT': 'Scheda tecnica insegnante',
        'DE': 'Lehrer-Technikkarte',
        'TR': 'Öğretmen Teknik Kartı'
      },
      'teacherCard.firstName': {
        'AR': 'الاسم',
        'FR': 'Prénom',
        'EN': 'First name',
        'ES': 'Nombre',
        'IT': 'Nome',
        'DE': 'Vorname',
        'TR': 'Ad'
      },
      'teacherCard.lastName': {
        'AR': 'اللقب',
        'FR': 'Nom',
        'EN': 'Last name',
        'ES': 'Apellido',
        'IT': 'Cognome',
        'DE': 'Nachname',
        'TR': 'Soyad'
      },
      'teacherCard.birthDate': {
        'AR': 'تاريخ الميلاد',
        'FR': 'Date de naissance',
        'EN': 'Birth date',
        'ES': 'Fecha de nacimiento',
        'IT': 'Data di nascita',
        'DE': 'Geburtsdatum',
        'TR': 'Doğum tarihi'
      },
      'teacherCard.birthPlace': {
        'AR': 'مكان الميلاد',
        'FR': 'Lieu de naissance',
        'EN': 'Birth place',
        'ES': 'Lugar de nacimiento',
        'IT': 'Luogo di nascita',
        'DE': 'Geburtsort',
        'TR': 'Doğum yeri'
      },
      'teacherCard.phone': {
        'AR': 'رقم الهاتف',
        'FR': 'Numéro de téléphone',
        'EN': 'Phone number',
        'ES': 'Número de teléfono',
        'IT': 'Numero di telefono',
        'DE': 'Telefonnummer',
        'TR': 'Telefon numarası'
      },
      'teacherCard.email': {
        'AR': 'البريد الإلكتروني',
        'FR': 'E-mail',
        'EN': 'Email',
        'ES': 'Correo electrónico',
        'IT': 'Email',
        'DE': 'E-Mail',
        'TR': 'E-posta'
      },
      'teacherCard.address': {
        'AR': 'العنوان',
        'FR': 'Adresse',
        'EN': 'Address',
        'ES': 'Dirección',
        'IT': 'Indirizzo',
        'DE': 'Adresse',
        'TR': 'Adres'
      },
      'teacherCard.photo': {
        'AR': 'الصورة',
        'FR': 'Photo',
        'EN': 'Photo',
        'ES': 'Foto',
        'IT': 'Foto',
        'DE': 'Foto',
        'TR': 'Fotoğraf'
      },
      'teacherCard.print': {
        'AR': 'طباعة البطاقة',
        'FR': 'Imprimer la carte',
        'EN': 'Print card',
        'ES': 'Imprimir tarjeta',
        'IT': 'Stampa scheda',
        'DE': 'Karte drucken',
        'TR': 'Kartı yazdır'
      }
    };
  }
}

