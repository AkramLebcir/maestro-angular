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
      'common.required': {
        'AR': 'مطلوب',
        'FR': 'Requis',
        'EN': 'Required',
        'ES': 'Requerido',
        'IT': 'Richiesto',
        'DE': 'Erforderlich',
        'TR': 'Gerekli'
      },
      'common.error': {
        'AR': 'خطأ',
        'FR': 'Erreur',
        'EN': 'Error',
        'ES': 'Error',
        'IT': 'Errore',
        'DE': 'Fehler',
        'TR': 'Hata'
      },
      'common.and': {
        'AR': 'و',
        'FR': 'et',
        'EN': 'and',
        'ES': 'y',
        'IT': 'e',
        'DE': 'und',
        'TR': 've'
      },
      'common.template': {
        'AR': 'القالب',
        'FR': 'Modèle',
        'EN': 'Template',
        'ES': 'Plantilla',
        'IT': 'Modello',
        'DE': 'Vorlage',
        'TR': 'Şablon'
      },
      'common.name': {
        'AR': 'الاسم',
        'FR': 'Nom',
        'EN': 'Name',
        'ES': 'Nombre',
        'IT': 'Nome',
        'DE': 'Name',
        'TR': 'İsim'
      },
      'common.status': {
        'AR': 'الحالة',
        'FR': 'Statut',
        'EN': 'Status',
        'ES': 'Estado',
        'IT': 'Stato',
        'DE': 'Status',
        'TR': 'Durum'
      },
      'common.actions': {
        'AR': 'الإجراءات',
        'FR': 'Actions',
        'EN': 'Actions',
        'ES': 'Acciones',
        'IT': 'Azioni',
        'DE': 'Aktionen',
        'TR': 'İşlemler'
      },
      'common.inactive': {
        'AR': 'معطل',
        'FR': 'Inactif',
        'EN': 'Inactive',
        'ES': 'Inactivo',
        'IT': 'Inattivo',
        'DE': 'Inaktiv',
        'TR': 'Pasif'
      },
      'common.notSpecified': {
        'AR': 'غير محدد',
        'FR': 'Non spécifié',
        'EN': 'Not specified',
        'ES': 'No especificado',
        'IT': 'Non specificato',
        'DE': 'Nicht angegeben',
        'TR': 'Belirtilmemiş'
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
      'dashboard.labDevicesWorking': {
        'AR': 'أجهزة تعمل',
        'FR': 'Appareils en fonctionnement',
        'EN': 'Working devices',
        'ES': 'Dispositivos en funcionamiento',
        'IT': 'Dispositivi funzionanti',
        'DE': 'Funktionierende Geräte',
        'TR': 'Çalışan cihazlar'
      },
      'dashboard.loadingProgress': {
        'AR': 'جاري تحميل بيانات التقدّم...',
        'FR': 'Chargement des données de progression...',
        'EN': 'Loading progress data...',
        'ES': 'Cargando datos de progreso...',
        'IT': 'Caricamento dati di progresso...',
        'DE': 'Fortschrittsdaten werden geladen...',
        'TR': 'İlerleme verileri yükleniyor...'
      },
      'dashboard.numberOfStudents': {
        'AR': 'عدد التلاميذ',
        'FR': 'Nombre d\'élèves',
        'EN': 'Number of students',
        'ES': 'Número de estudiantes',
        'IT': 'Numero di studenti',
        'DE': 'Anzahl der Schüler',
        'TR': 'Öğrenci sayısı'
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
      // Notification types (generic messages)
      'notifications.type.upcomingHoliday.title': {
        'AR': 'اقتراب عطلة',
        'FR': 'Vacances à venir',
        'EN': 'Upcoming holiday',
        'ES': 'Próximas vacaciones',
        'IT': 'Vacanze imminenti',
        'DE': 'Bevorstehende Ferien',
        'TR': 'Yaklaşan tatil'
      },
      'notifications.type.upcomingHoliday.message': {
        'AR': 'تذكير بوجود عطلة قريبة ضمن التخطيط السنوي.',
        'FR': 'Rappel d\'une période de vacances proche dans la planification annuelle.',
        'EN': 'Reminder about an upcoming holiday in the annual planning.',
        'ES': 'Recordatorio de unas próximas vacaciones en la planificación anual.',
        'IT': 'Promemoria per una prossima vacanza nel piano annuale.',
        'DE': 'Erinnerung an eine bevorstehende Ferienzeit im Jahresplan.',
        'TR': 'Yıllık planlama kapsamında yaklaşan bir tatil için hatırlatma.'
      },
      'notifications.type.upcomingAssessment.title': {
        'AR': 'تذكير بالتقييمات الأسبوعية',
        'FR': 'Rappel des évaluations hebdomadaires',
        'EN': 'Weekly assessment reminder',
        'ES': 'Recordatorio de evaluaciones semanales',
        'IT': 'Promemoria delle verifiche settimanali',
        'DE': 'Erinnerung an wöchentliche Bewertungen',
        'TR': 'Haftalık değerlendirme hatırlatıcısı'
      },
      'notifications.type.upcomingAssessment.message': {
        'AR': 'تذكير بإجراء التقييمات الأسبوعية وفق التوزيع السنوي.',
        'FR': 'Rappel d\'effectuer les évaluations hebdomadaires selon la répartition annuelle.',
        'EN': 'Reminder to perform weekly assessments according to the annual distribution.',
        'ES': 'Recordatorio para realizar las evaluaciones semanales según la distribución anual.',
        'IT': 'Promemoria per svolgere le verifiche settimanali secondo la distribuzione annuale.',
        'DE': 'Erinnerung, wöchentliche Bewertungen gemäß der Jahresverteilung durchzuführen.',
        'TR': 'Yıllık dağılıma göre haftalık değerlendirmeleri yapmanız için hatırlatma.'
      },
      'notifications.type.incompleteTask.title': {
        'AR': 'مهام غير مكتملة في الدفاتر',
        'FR': 'Tâches incomplètes dans les cahiers',
        'EN': 'Incomplete tasks in notebooks',
        'ES': 'Tareas incompletas en los cuadernos',
        'IT': 'Compiti incompleti nei quaderni',
        'DE': 'Unvollständige Aufgaben in den Heften',
        'TR': 'Defterlerde tamamlanmamış görevler'
      },
      'notifications.type.incompleteTask.message': {
        'AR': 'يوجد مهام غير مكتملة في بعض الدفاتر. يُرجى استكمالها.',
        'FR': 'Il existe des tâches incomplètes dans certains cahiers. Veuillez les compléter.',
        'EN': 'There are incomplete tasks in some notebooks. Please complete them.',
        'ES': 'Hay tareas incompletas en algunos cuadernos. Por favor complételas.',
        'IT': 'Ci sono compiti incompleti in alcuni quaderni. Si prega di completarli.',
        'DE': 'Es gibt unvollständige Aufgaben in einigen Heften. Bitte vervollständigen Sie diese.',
        'TR': 'Bazı defterlerde tamamlanmamış görevler var. Lütfen tamamlayın.'
      },
      'notifications.type.subscriptionExpiring.title': {
        'AR': 'تنبيه: انتهاء الاشتراك قريباً',
        'FR': 'Alerte : abonnement bientôt expiré',
        'EN': 'Alert: subscription expiring soon',
        'ES': 'Alerta: la suscripción caducará pronto',
        'IT': 'Avviso: abbonamento in scadenza',
        'DE': 'Hinweis: Abonnement läuft bald ab',
        'TR': 'Uyarı: abonelik yakında sona erecek'
      },
      'notifications.type.subscriptionExpiring.message': {
        'AR': 'تذكير بقرب انتهاء الاشتراك الحالي. يُرجى التجديد في أقرب وقت.',
        'FR': 'Rappel : votre abonnement actuel arrive à expiration. Veuillez le renouveler dès que possible.',
        'EN': 'Reminder: your current subscription is about to expire. Please renew it as soon as possible.',
        'ES': 'Recordatorio: su suscripción actual está a punto de caducar. Por favor, renuévela lo antes posible.',
        'IT': 'Promemoria: il tuo abbonamento attuale sta per scadere. Si prega di rinnovarlo il prima possibile.',
        'DE': 'Erinnerung: Ihr aktuelles Abonnement läuft bald ab. Bitte erneuern Sie es so bald wie möglich.',
        'TR': 'Hatırlatma: mevcut aboneliğiniz yakında sona erecek. Lütfen en kısa sürede yenileyin.'
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
      'trainingInspection.organizerShort': {
        'AR': 'الجهة:',
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
      'trainingInspection.locationShort': {
        'AR': 'المكان:',
        'FR': 'Lieu :',
        'EN': 'Location:',
        'ES': 'Lugar:',
        'IT': 'Luogo:',
        'DE': 'Ort:',
        'TR': 'Yer:'
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
      'trainingInspection.notesLabel': {
        'AR': 'ملاحظات:',
        'FR': 'Remarques :',
        'EN': 'Notes:',
        'ES': 'Notas:',
        'IT': 'Note:',
        'DE': 'Bemerkungen:',
        'TR': 'Notlar:'
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
      'trainingInspection.uploadedFile': {
        'AR': 'ملف مرفوع:',
        'FR': 'Fichier téléchargé :',
        'EN': 'Uploaded file:',
        'ES': 'Archivo cargado:',
        'IT': 'File caricato:',
        'DE': 'Hochgeladene Datei:',
        'TR': 'Yüklenen dosya:'
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
      'trainingInspection.noInspections': {
        'AR': 'لا توجد زيارات مسجلة بعد.',
        'FR': 'Aucune visite enregistrée pour le moment.',
        'EN': 'No visits recorded yet.',
        'ES': 'No hay visitas registradas todavía.',
        'IT': 'Nessuna visita registrata finora.',
        'DE': 'Noch keine Besuche aufgezeichnet.',
        'TR': 'Henüz ziyaret kaydı yok.'
      },
      'trainingInspection.inspectorNotes': {
        'AR': 'ملاحظات المفتش :',
        'FR': 'Remarques de l\'inspecteur :',
        'EN': 'Inspector notes:',
        'ES': 'Notas del inspector:',
        'IT': 'Note dell\'ispettore:',
        'DE': 'Anmerkungen des Inspektors:',
        'TR': 'Müfettiş notları:'
      },
      'trainingInspection.recommendations': {
        'AR': 'توجيهات / توصيات :',
        'FR': 'Orientations / Recommandations :',
        'EN': 'Guidelines / Recommendations:',
        'ES': 'Orientaciones / Recomendaciones:',
        'IT': 'Linee guida / Raccomandazioni:',
        'DE': 'Richtlinien / Empfehlungen:',
        'TR': 'Yönergeler / Öneriler:'
      },
      'trainingInspection.saveVisit': {
        'AR': 'حفظ زيارة المفتش',
        'FR': 'Enregistrer la visite de l\'inspecteur',
        'EN': 'Save inspector visit',
        'ES': 'Guardar visita del inspector',
        'IT': 'Salva visita dell\'ispettore',
        'DE': 'Inspektionsbesuch speichern',
        'TR': 'Müfettiş ziyaretini kaydet'
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
      'trainingInspection.noDailyNotes': {
        'AR': 'لم تتم إضافة أي ملاحظة بعد.',
        'FR': 'Aucune note ajoutée pour le moment.',
        'EN': 'No notes added yet.',
        'ES': 'Aún no se han añadido notas.',
        'IT': 'Nessuna nota aggiunta finora.',
        'DE': 'Noch keine Notizen hinzugefügt.',
        'TR': 'Henüz not eklenmedi.'
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
      'trainingInspection.seminarStartDate': {
        'AR': 'تاريخ البداية :',
        'FR': 'Date de début :',
        'EN': 'Start date:',
        'ES': 'Fecha de inicio:',
        'IT': 'Data di inizio:',
        'DE': 'Anfangsdatum:',
        'TR': 'Başlangıç tarihi:'
      },
      'trainingInspection.seminarEndDate': {
        'AR': 'تاريخ النهاية :',
        'FR': 'Date de fin :',
        'EN': 'End date:',
        'ES': 'Fecha de fin:',
        'IT': 'Data di fine:',
        'DE': 'Enddatum:',
        'TR': 'Bitiş tarihi:'
      },
      'trainingInspection.seminarDuration': {
        'AR': 'المدة الإجمالية :',
        'FR': 'Durée totale :',
        'EN': 'Total duration:',
        'ES': 'Duración total:',
        'IT': 'Durata totale:',
        'DE': 'Gesamtdauer:',
        'TR': 'Toplam süre:'
      },
      'trainingInspection.seminarDurationPlaceholder': {
        'AR': 'مثال: 3 أيام، 12 ساعة...',
        'FR': 'Ex : 3 jours, 12 heures...',
        'EN': 'Example: 3 days, 12 hours...',
        'ES': 'Ejemplo: 3 días, 12 horas...',
        'IT': 'Esempio: 3 giorni, 12 ore...',
        'DE': 'Beispiel: 3 Tage, 12 Stunden...',
        'TR': 'Örnek: 3 gün, 12 saat...'
      },
      'trainingInspection.seminarLocation': {
        'AR': 'مكان الندوة :',
        'FR': 'Lieu du séminaire :',
        'EN': 'Seminar location:',
        'ES': 'Lugar del seminario:',
        'IT': 'Luogo del seminario:',
        'DE': 'Seminarort:',
        'TR': 'Seminer yeri:'
      },
      'trainingInspection.seminarTrainer': {
        'AR': 'المؤطر :',
        'FR': 'Formateur :',
        'EN': 'Trainer:',
        'ES': 'Formador:',
        'IT': 'Formatore:',
        'DE': 'Trainer:',
        'TR': 'Eğitmen:'
      },
      'trainingInspection.seminarSummary': {
        'AR': 'ملخص شخصي للمحتوى :',
        'FR': 'Résumé personnel du contenu :',
        'EN': 'Personal summary of the content:',
        'ES': 'Resumen personal del contenido:',
        'IT': 'Riassunto personale del contenuto:',
        'DE': 'Persönliche Zusammenfassung des Inhalts:',
        'TR': 'İçeriğin kişisel özeti:'
      },
      'trainingInspection.seminarAttachments': {
        'AR': 'رفع الملحقات :',
        'FR': 'Téléversement des pièces jointes :',
        'EN': 'Upload attachments:',
        'ES': 'Subir anexos:',
        'IT': 'Carica allegati:',
        'DE': 'Anhänge hochladen:',
        'TR': 'Ekleri yükle:'
      },
      'trainingInspection.organizerLabel': {
        'AR': 'الجهة المنظمة:',
        'FR': 'Organisateur :',
        'EN': 'Organizer:',
        'ES': 'Organizador:',
        'IT': 'Organizzatore:',
        'DE': 'Organisator:',
        'TR': 'Organizatör:'
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
      'trainingInspection.noSeminars': {
        'AR': 'لا توجد ندوات مسجلة بعد.',
        'FR': 'Aucun séminaire enregistré برای le moment.',
        'EN': 'No seminars recorded yet.',
        'ES': 'No hay seminarios registrados todavía.',
        'IT': 'Nessun seminario registrato finora.',
        'DE': 'Noch keine Seminare aufgezeichnet.',
        'TR': 'Henüz seminer kaydı yok.'
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
      'trainingInspection.classLevelPlaceholder': {
        'AR': 'مثال: 3 متوسط - أ',
        'FR': 'Ex : 3 moyenne - A',
        'EN': 'Example: 3rd middle - A',
        'ES': 'Ej.: 3 medio - A',
        'IT': 'Es.: 3 media - A',
        'DE': 'Beispiel: 3. Mittelstufe - A',
        'TR': 'Ör: 3 orta - A'
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
      'trainingInspection.visitDate': {
        'AR': 'تاريخ الزيارة :',
        'FR': 'Date de la visite :',
        'EN': 'Visit date:',
        'ES': 'Fecha de la visita:',
        'IT': 'Data della visita:',
        'DE': 'Besuchsdatum:',
        'TR': 'Ziyaret tarihi:'
      },
      'trainingInspection.visitDateTime': {
        'AR': 'تاريخ ووقت الزيارة :',
        'FR': 'Date et heure de la visite :',
        'EN': 'Visit date and time:',
        'ES': 'Fecha y hora de la visita:',
        'IT': 'Data e ora della visita:',
        'DE': 'Datum und Uhrzeit des Besuchs:',
        'TR': 'Ziyaret tarih ve saati:'
      },
      'trainingInspection.noteDate': {
        'AR': 'تاريخ الملاحظة :',
        'FR': 'Date de la note :',
        'EN': 'Note date:',
        'ES': 'Fecha de la nota:',
        'IT': 'Data della nota:',
        'DE': 'Notizdatum:',
        'TR': 'Not tarihi:'
      },
      'trainingInspection.noteContent': {
        'AR': 'محتوى الملاحظة :',
        'FR': 'Contenu de la note :',
        'EN': 'Note content:',
        'ES': 'Contenido de la nota:',
        'IT': 'Contenuto della nota:',
        'DE': 'Inhalt der Notiz:',
        'TR': 'Not içeriği:'
      },
      'trainingInspection.notePlaceholder': {
        'AR': 'سجل ملاحظاتك حول سير الدروس، الصعوبات، الأحداث المهمة...',
        'FR': 'Consignez vos remarques sur le déroulement des cours, les difficultés, les événements importants...',
        'EN': 'Record your notes about lesson progress, difficulties, important events...',
        'ES': 'Registre sus notas sobre el desarrollo de las clases, dificultades, acontecimientos importantes...',
        'IT': 'Annota le tue osservazioni sull\'andamento delle lezioni, difficoltà, eventi importanti...',
        'DE': 'Notieren Sie Ihre Beobachtungen zum Unterrichtsverlauf, Schwierigkeiten, wichtigen Ereignissen...',
        'TR': 'Derslerin gidişatı, zorluklar, önemli olaylar hakkında notlarınızı kaydedin...'
      },
      'trainingInspection.saveNote': {
        'AR': 'حفظ الملاحظة',
        'FR': 'Enregistrer la note',
        'EN': 'Save note',
        'ES': 'Guardar nota',
        'IT': 'Salva nota',
        'DE': 'Notiz speichern',
        'TR': 'Notu kaydet'
      },
      'trainingInspection.saveSeminar': {
        'AR': 'حفظ الندوة',
        'FR': 'Enregistrer le séminaire',
        'EN': 'Save seminar',
        'ES': 'Guardar seminario',
        'IT': 'Salva seminario',
        'DE': 'Seminar speichern',
        'TR': 'Semineri kaydet'
      },
      'trainingInspection.savePedagogicalVisit': {
        'AR': 'حفظ الزيارة',
        'FR': 'Enregistrer la visite',
        'EN': 'Save visit',
        'ES': 'Guardar visita',
        'IT': 'Salva visita',
        'DE': 'Besuch speichern',
        'TR': 'Ziyareti kaydet'
      },
      'trainingInspection.pedagogicalNotes': {
        'AR': 'ملخص الملاحظات والتوجيهات :',
        'FR': 'Résumé des remarques et orientations :',
        'EN': 'Summary of notes and guidance:',
        'ES': 'Resumen de notas y orientaciones:',
        'IT': 'Riepilogo delle osservazioni e delle indicazioni:',
        'DE': 'Zusammenfassung der Notizen und Anweisungen:',
        'TR': 'Not ve yönergelerin özeti:'
      },
      'trainingInspection.pedagogicalFollowUp': {
        'AR': 'الإجراءات المتخذة للمتابعة :',
        'FR': 'Mesures prises pour le suivi :',
        'EN': 'Follow-up actions:',
        'ES': 'Acciones de seguimiento:',
        'IT': 'Azioni di follow-up:',
        'DE': 'Nachverfolgungsmaßnahmen:',
        'TR': 'Takip için alınan önlemler:'
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
      'gradebook.studentsWithAverage10InTerm': {
        'AR': 'عدد التلاميذ بمعدل ≥ 10 (في الفصل المحدد):',
        'FR': 'Nombre d\'élèves avec une moyenne ≥ 10 (dans le trimestre sélectionné) :',
        'EN': 'Number of students with average ≥ 10 (in the selected term):',
        'ES': 'Número de estudiantes con promedio ≥ 10 (en el trimestre seleccionado):',
        'IT': 'Numero di studenti con media ≥ 10 (nel trimestre selezionato):',
        'DE': 'Anzahl der Schüler mit Durchschnitt ≥ 10 (im gewählten Trimester):',
        'TR': 'Seçilen dönemde ortalaması ≥ 10 olan öğrenci sayısı:'
      },
      'gradebook.studentsWithAverageBelow10InTerm': {
        'AR': 'عدد التلاميذ بمعدل < 10 (في الفصل المحدد):',
        'FR': 'Nombre d\'élèves avec une moyenne < 10 (dans le trimestre sélectionné) :',
        'EN': 'Number of students with average < 10 (in the selected term):',
        'ES': 'Número de estudiantes con promedio < 10 (en el trimestre seleccionado):',
        'IT': 'Numero di studenti con media < 10 (nel trimestre selezionato):',
        'DE': 'Anzahl der Schüler mit Durchschnitt < 10 (im gewählten Trimester):',
        'TR': 'Seçilen dönemde ortalaması < 10 olan öğrenci sayısı:'
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
      'gradebook.enhancedImport': {
        'AR': 'استيراد محسّن',
        'FR': 'Import amélioré',
        'EN': 'Enhanced import',
        'ES': 'Importación mejorada',
        'IT': 'Importazione migliorata',
        'DE': 'Verbesserter Import',
        'TR': 'Geliştirilmiş içe aktarma'
      },
      'gradebook.excelAnalysis': {
        'AR': 'تحليل بيانات Excel',
        'FR': 'Analyse des données Excel',
        'EN': 'Excel data analysis',
        'ES': 'Análisis de datos Excel',
        'IT': 'Analisi dati Excel',
        'DE': 'Excel-Datenanalyse',
        'TR': 'Excel veri analizi'
      },
      'gradebook.idNumberOrCode': {
        'AR': 'رقم الهوية أو الكود',
        'FR': 'Numéro d\'identité ou code',
        'EN': 'ID number or code',
        'ES': 'Número de identificación o código',
        'IT': 'Numero identificativo o codice',
        'DE': 'Ausweisnummer oder Code',
        'TR': 'Kimlik numarası veya kod'
      },
      'gradebook.firstName': {
        'AR': 'الاسم',
        'FR': 'Prénom',
        'EN': 'First name',
        'ES': 'Nombre',
        'IT': 'Nome',
        'DE': 'Vorname',
        'TR': 'Ad'
      },
      'gradebook.lastName': {
        'AR': 'اللقب',
        'FR': 'Nom',
        'EN': 'Last name',
        'ES': 'Apellido',
        'IT': 'Cognome',
        'DE': 'Nachname',
        'TR': 'Soyad'
      },
      'gradebook.birthDate': {
        'AR': 'تاريخ الميلاد',
        'FR': 'Date de naissance',
        'EN': 'Birth date',
        'ES': 'Fecha de nacimiento',
        'IT': 'Data di nascita',
        'DE': 'Geburtsdatum',
        'TR': 'Doğum tarihi'
      },
      'gradebook.homework': {
        'AR': 'الواجب',
        'FR': 'Devoir',
        'EN': 'Homework',
        'ES': 'Tarea',
        'IT': 'Compiti',
        'DE': 'Hausaufgaben',
        'TR': 'Ödev'
      },
      'gradebook.attendance5': {
        'AR': 'الحضور (5)',
        'FR': 'Présence (5)',
        'EN': 'Attendance (5)',
        'ES': 'Asistencia (5)',
        'IT': 'Presenze (5)',
        'DE': 'Anwesenheit (5)',
        'TR': 'Yoklama (5)'
      },
      'gradebook.behavior5': {
        'AR': 'السلوك (5)',
        'FR': 'Comportement (5)',
        'EN': 'Behavior (5)',
        'ES': 'Comportamiento (5)',
        'IT': 'Comportamento (5)',
        'DE': 'Verhalten (5)',
        'TR': 'Davranış (5)'
      },
      'gradebook.continuousAssessment': {
        'AR': 'التقييم المستمر',
        'FR': 'Évaluation continue',
        'EN': 'Continuous assessment',
        'ES': 'Evaluación continua',
        'IT': 'Valutazione continua',
        'DE': 'Kontinuierliche Bewertung',
        'TR': 'Sürekli değerlendirme'
      },
      'gradebook.oralExpression': {
        'AR': 'التعبير الشفهي/العمل العملي',
        'FR': 'Expression orale/Travail pratique',
        'EN': 'Oral expression/Practical work',
        'ES': 'Expresión oral/Trabajo práctico',
        'IT': 'Espressione orale/Lavoro pratico',
        'DE': 'Mündlicher Ausdruck/Praktische Arbeit',
        'TR': 'Sözlü ifade/Pratik çalışma'
      },
      'gradebook.assignment': {
        'AR': 'الفرض',
        'FR': 'Devoir surveillé',
        'EN': 'Assignment',
        'ES': 'Tarea',
        'IT': 'Compito in classe',
        'DE': 'Klassenarbeit',
        'TR': 'Sınav'
      },
      'gradebook.test': {
        'AR': 'الاختبار',
        'FR': 'Test',
        'EN': 'Test',
        'ES': 'Examen',
        'IT': 'Test',
        'DE': 'Test',
        'TR': 'Test'
      },
      'gradebook.termAverage': {
        'AR': 'معدل الفصل',
        'FR': 'Moyenne du trimestre',
        'EN': 'Term average',
        'ES': 'Promedio del trimestre',
        'IT': 'Media del trimestre',
        'DE': 'Durchschnitt des Trimesters',
        'TR': 'Dönem ortalaması'
      },
      'gradebook.ranking': {
        'AR': 'الترتيب',
        'FR': 'Classement',
        'EN': 'Ranking',
        'ES': 'Clasificación',
        'IT': 'Classifica',
        'DE': 'Rangfolge',
        'TR': 'Sıralama'
      },
      'gradebook.classResults': {
        'AR': 'نتائج الفصل',
        'FR': 'Résultats de la classe',
        'EN': 'Class results',
        'ES': 'Resultados de la clase',
        'IT': 'Risultati della classe',
        'DE': 'Klassenergebnisse',
        'TR': 'Sınıf sonuçları'
      },
      'gradebook.exportPDF': {
        'AR': 'تصدير PDF',
        'FR': 'Exporter PDF',
        'EN': 'Export PDF',
        'ES': 'Exportar PDF',
        'IT': 'Esporta PDF',
        'DE': 'PDF exportieren',
        'TR': 'PDF dışa aktar'
      },
      'gradebook.dataAnalysis': {
        'AR': 'تحليل البيانات',
        'FR': 'Analyse des données',
        'EN': 'Data analysis',
        'ES': 'Análisis de datos',
        'IT': 'Analisi dati',
        'DE': 'Datenanalyse',
        'TR': 'Veri analizi'
      },
      'gradebook.comprehensiveAnalysis': {
        'AR': 'تحليل شامل لنتائج التلاميذ من خلال الرسوم البيانية',
        'FR': 'Analyse complète des résultats des élèves à travers des graphiques',
        'EN': 'Comprehensive analysis of student results through charts',
        'ES': 'Análisis completo de los resultados de los estudiantes a través de gráficos',
        'IT': 'Analisi completa dei risultati degli studenti attraverso grafici',
        'DE': 'Umfassende Analyse der Schülerergebnisse durch Diagramme',
        'TR': 'Grafikler aracılığıyla öğrenci sonuçlarının kapsamlı analizi'
      },
      'gradebook.gradeDistributionByRange': {
        'AR': 'توزيع الدرجات حسب النطاقات',
        'FR': 'Répartition des notes par plages',
        'EN': 'Grade distribution by ranges',
        'ES': 'Distribución de calificaciones por rangos',
        'IT': 'Distribuzione voti per intervalli',
        'DE': 'Notenverteilung nach Bereichen',
        'TR': 'Aralıklara göre not dağılımı'
      },
      'gradebook.studentDistributionByCategory': {
        'AR': 'توزيع التلاميذ حسب الفئات',
        'FR': 'Répartition des élèves par catégories',
        'EN': 'Student distribution by categories',
        'ES': 'Distribución de estudiantes por categorías',
        'IT': 'Distribuzione studenti per categorie',
        'DE': 'Schülerverteilung nach Kategorien',
        'TR': 'Kategorilere göre öğrenci dağılımı'
      },
      'gradebook.comparisonByGender': {
        'AR': 'مقارنة النتائج حسب الجنس',
        'FR': 'Comparaison des résultats par sexe',
        'EN': 'Comparison of results by gender',
        'ES': 'Comparación de resultados por género',
        'IT': 'Confronto risultati per genere',
        'DE': 'Vergleich der Ergebnisse nach Geschlecht',
        'TR': 'Cinsiyete göre sonuç karşılaştırması'
      },
      'gradebook.comparisonByTerm': {
        'AR': 'مقارنة معدلات الفصول الدراسية',
        'FR': 'Comparaison des moyennes des trimestres',
        'EN': 'Comparison of term averages',
        'ES': 'Comparación de promedios de trimestres',
        'IT': 'Confronto medie trimestri',
        'DE': 'Vergleich der Trimestermittelwerte',
        'TR': 'Dönem ortalamalarının karşılaştırması'
      },
      'gradebook.studentPerformanceByType': {
        'AR': 'أداء التلاميذ حسب نوع التقييم',
        'FR': 'Performance des élèves par type d\'évaluation',
        'EN': 'Student performance by assessment type',
        'ES': 'Rendimiento de estudiantes por tipo de evaluación',
        'IT': 'Prestazioni studenti per tipo di valutazione',
        'DE': 'Schülerleistung nach Bewertungstyp',
        'TR': 'Değerlendirme türüne göre öğrenci performansı'
      },
      'gradebook.totalStudents': {
        'AR': 'إجمالي التلاميذ',
        'FR': 'Total des élèves',
        'EN': 'Total students',
        'ES': 'Total de estudiantes',
        'IT': 'Totale studenti',
        'DE': 'Gesamtzahl der Schüler',
        'TR': 'Toplam öğrenci'
      },
      'gradebook.excelImportWithAutoNotes': {
        'AR': 'استيراد ملف Excel مع توليد الملاحظات والإرشادات تلقائياً',
        'FR': 'Importer un fichier Excel avec génération automatique des notes et conseils',
        'EN': 'Import Excel file with automatic generation of notes and guidance',
        'ES': 'Importar archivo Excel con generación automática de notas y orientación',
        'IT': 'Importa file Excel con generazione automatica di note e consigli',
        'DE': 'Excel-Datei importieren mit automatischer Generierung von Notizen und Beratung',
        'TR': 'Notlar ve rehberliğin otomatik oluşturulmasıyla Excel dosyası içe aktar'
      },
      'gradebook.excelImportDescription': {
        'AR': 'قم باستيراد ملف Excel لعلامات التلاميذ وسيتم إضافة الملاحظات (obs) والإرشادات (cons) تلقائياً بناءً على المعدل',
        'FR': 'Importez un fichier Excel des notes des élèves et les notes (obs) et conseils (cons) seront ajoutés automatiquement en fonction de la moyenne',
        'EN': 'Import an Excel file of student grades and notes (obs) and guidance (cons) will be added automatically based on the average',
        'ES': 'Importe un archivo Excel de calificaciones de estudiantes y las notas (obs) y orientación (cons) se agregarán automáticamente según el promedio',
        'IT': 'Importa un file Excel dei voti degli studenti e le note (obs) e i consigli (cons) verranno aggiunti automaticamente in base alla media',
        'DE': 'Importieren Sie eine Excel-Datei mit Schülernoten und Notizen (obs) und Beratung (cons) werden automatisch basierend auf dem Durchschnitt hinzugefügt',
        'TR': 'Öğrenci notlarının bir Excel dosyasını içe aktarın ve notlar (obs) ve rehberlik (cons) ortalamaya göre otomatik olarak eklenecektir'
      },
      'gradebook.processedDataPreview': {
        'AR': 'معاينة البيانات المعالجة',
        'FR': 'Aperçu des données traitées',
        'EN': 'Processed data preview',
        'ES': 'Vista previa de datos procesados',
        'IT': 'Anteprima dati elaborati',
        'DE': 'Vorschau der verarbeiteten Daten',
        'TR': 'İşlenmiş veri önizleme'
      },
      'gradebook.downloadProcessedFile': {
        'AR': 'تحميل الملف المعالج',
        'FR': 'Télécharger le fichier traité',
        'EN': 'Download processed file',
        'ES': 'Descargar archivo procesado',
        'IT': 'Scarica file elaborato',
        'DE': 'Verarbeitete Datei herunterladen',
        'TR': 'İşlenmiş dosyayı indir'
      },
      'gradebook.processedSheetsCount': {
        'AR': 'عدد الصفحات المعالجة:',
        'FR': 'Nombre de feuilles traitées:',
        'EN': 'Processed sheets count:',
        'ES': 'Número de hojas procesadas:',
        'IT': 'Numero di fogli elaborati:',
        'DE': 'Anzahl der verarbeiteten Blätter:',
        'TR': 'İşlenmiş sayfa sayısı:'
      },
      'gradebook.sheet': {
        'AR': 'الصفحة',
        'FR': 'Feuille',
        'EN': 'Sheet',
        'ES': 'Hoja',
        'IT': 'Foglio',
        'DE': 'Blatt',
        'TR': 'Sayfa'
      },
      'gradebook.notes': {
        'AR': 'الملاحظات (obs)',
        'FR': 'Notes (obs)',
        'EN': 'Notes (obs)',
        'ES': 'Notas (obs)',
        'IT': 'Note (obs)',
        'DE': 'Notizen (obs)',
        'TR': 'Notlar (obs)'
      },
      'gradebook.guidanceCons': {
        'AR': 'الإرشادات (cons)',
        'FR': 'Conseils (cons)',
        'EN': 'Guidance (cons)',
        'ES': 'Orientación (cons)',
        'IT': 'Consigli (cons)',
        'DE': 'Beratung (cons)',
        'TR': 'Rehberlik (cons)'
      },
      'gradebook.excelAnalysisTitle': {
        'AR': 'تحليل بيانات Excel',
        'FR': 'Analyse des données Excel',
        'EN': 'Excel data analysis',
        'ES': 'Análisis de datos Excel',
        'IT': 'Analisi dati Excel',
        'DE': 'Excel-Datenanalyse',
        'TR': 'Excel veri analizi'
      },
      'gradebook.detailedChartsPerSheet': {
        'AR': 'مخططات بيانية مفصلة لكل صفحة (قسم) في ملف Excel',
        'FR': 'Graphiques détaillés pour chaque feuille (classe) dans le fichier Excel',
        'EN': 'Detailed charts for each sheet (class) in the Excel file',
        'ES': 'Gráficos detallados para cada hoja (clase) en el archivo Excel',
        'IT': 'Grafici dettagliati per ogni foglio (classe) nel file Excel',
        'DE': 'Detaillierte Diagramme für jedes Blatt (Klasse) in der Excel-Datei',
        'TR': 'Excel dosyasındaki her sayfa (sınıf) için detaylı grafikler'
      },
      'gradebook.sheetAverage': {
        'AR': 'معدل الصفحة',
        'FR': 'Moyenne de la feuille',
        'EN': 'Sheet average',
        'ES': 'Promedio de la hoja',
        'IT': 'Media del foglio',
        'DE': 'Blattdurchschnitt',
        'TR': 'Sayfa ortalaması'
      },
      'gradebook.distributionByCategory': {
        'AR': 'توزيع حسب الفئات',
        'FR': 'Répartition par catégories',
        'EN': 'Distribution by categories',
        'ES': 'Distribución por categorías',
        'IT': 'Distribuzione per categorie',
        'DE': 'Verteilung nach Kategorien',
        'TR': 'Kategorilere göre dağılım'
      },
      'gradebook.noProcessedData': {
        'AR': 'لا توجد بيانات معالجة للتحليل',
        'FR': 'Aucune donnée traitée pour l\'analyse',
        'EN': 'No processed data for analysis',
        'ES': 'No hay datos procesados para análisis',
        'IT': 'Nessun dato elaborato per l\'analisi',
        'DE': 'Keine verarbeiteten Daten für die Analyse',
        'TR': 'Analiz için işlenmiş veri yok'
      },
      'gradebook.importExcelFirst': {
        'AR': 'استيراد ملف Excel أولاً',
        'FR': 'Importer d\'abord un fichier Excel',
        'EN': 'Import Excel file first',
        'ES': 'Importar archivo Excel primero',
        'IT': 'Importa prima il file Excel',
        'DE': 'Zuerst Excel-Datei importieren',
        'TR': 'Önce Excel dosyasını içe aktar'
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
      'reports.openStudentsReports': {
        'AR': 'فتح تقارير التلاميذ',
        'FR': 'Ouvrir les rapports des élèves',
        'EN': 'Open student reports',
        'ES': 'Abrir los informes de los alumnos',
        'IT': 'Apri i rapporti degli alunni',
        'DE': 'Schülerberichte öffnen',
        'TR': 'Öğrenci raporlarını aç'
      },
      'reports.classSummaryReport': {
        'AR': 'تقرير ملخص القسم',
        'FR': 'Rapport récapitulatif de la classe',
        'EN': 'Class summary report',
        'ES': 'Informe resumen de la clase',
        'IT': 'Rapporto riepilogativo della classe',
        'DE': 'Klassenzusammenfassungsbericht',
        'TR': 'Sınıf özet raporu'
      },
      'reports.classSummaryReportDesc': {
        'AR': 'تصدير تقرير شامل عن القسم يتضمن الحضور والسلوك والدرجات',
        'FR': 'Exporter un rapport complet sur la classe incluant la présence, le comportement et les notes',
        'EN': 'Export a comprehensive report about the class including attendance, behavior, and grades',
        'ES': 'Exportar un informe completo sobre la clase que incluye asistencia, comportamiento y calificaciones',
        'IT': 'Esporta un rapporto completo sulla classe che include presenza, comportamento e voti',
        'DE': 'Einen umfassenden Bericht über die Klasse exportieren, einschließlich Anwesenheit, Verhalten und Noten',
        'TR': 'Sınıf hakkında devam, davranış ve notları içeren kapsamlı bir rapor dışa aktar'
      },
      'reports.studentSummaryReport': {
        'AR': 'تقرير ملخص التلميذ',
        'FR': 'Rapport récapitulatif de l\'élève',
        'EN': 'Student summary report',
        'ES': 'Informe resumen del estudiante',
        'IT': 'Rapporto riepilogativo dello studente',
        'DE': 'Schülerzusammenfassungsbericht',
        'TR': 'Öğrenci özet raporu'
      },
      'reports.studentSummaryReportDesc': {
        'AR': 'تصدير تقرير شامل عن التلميذ يتضمن الحضور والسلوك والدرجات',
        'FR': 'Exporter un rapport complet sur l\'élève incluant la présence, le comportement et les notes',
        'EN': 'Export a comprehensive report about the student including attendance, behavior, and grades',
        'ES': 'Exportar un informe completo sobre el estudiante que incluye asistencia, comportamiento y calificaciones',
        'IT': 'Esporta un rapporto completo sullo studente che include presenza, comportamento e voti',
        'DE': 'Einen umfassenden Bericht über den Schüler exportieren, einschließlich Anwesenheit, Verhalten und Noten',
        'TR': 'Öğrenci hakkında devam, davranış ve notları içeren kapsamlı bir rapor dışa aktar'
      },
      'reports.openAndExportPDF': {
        'AR': 'فتح وتصدير PDF',
        'FR': 'Ouvrir et exporter PDF',
        'EN': 'Open and export PDF',
        'ES': 'Abrir y exportar PDF',
        'IT': 'Apri ed esporta PDF',
        'DE': 'PDF öffnen und exportieren',
        'TR': 'PDF aç ve dışa aktar'
      },
      'reports.usersSubscriptionsReport': {
        'AR': 'تقرير المستخدمين والاشتراكات',
        'FR': 'Rapport des utilisateurs et abonnements',
        'EN': 'Users and subscriptions report',
        'ES': 'Informe de usuarios y suscripciones',
        'IT': 'Rapporto utenti e abbonamenti',
        'DE': 'Benutzer- und Abonnementbericht',
        'TR': 'Kullanıcılar ve abonelikler raporu'
      },
      'reports.usersSubscriptionsReportDesc': {
        'AR': 'تصدير تقرير شامل عن المستخدمين واشتراكاتهم وحالة الاشتراكات',
        'FR': 'Exporter un rapport complet sur les utilisateurs, leurs abonnements et l\'état des abonnements',
        'EN': 'Export a comprehensive report about users, their subscriptions, and subscription status',
        'ES': 'Exportar un informe completo sobre usuarios, sus suscripciones y el estado de las suscripciones',
        'IT': 'Esporta un rapporto completo su utenti, i loro abbonamenti e lo stato degli abbonamenti',
        'DE': 'Einen umfassenden Bericht über Benutzer, ihre Abonnements und den Abonnementstatus exportieren',
        'TR': 'Kullanıcılar, abonelikleri ve abonelik durumu hakkında kapsamlı bir rapor dışa aktar'
      },
      'reports.notebooks': {
        'AR': 'تقارير الدفاتر',
        'FR': 'Rapports des cahiers',
        'EN': 'Notebook reports',
        'ES': 'Informes de cuadernos',
        'IT': 'Rapporti dei quaderni',
        'DE': 'Heftberichte',
        'TR': 'Defter raporları'
      },
      'reports.notebooksDesc': {
        'AR': 'طباعة تقارير مفصلة للدفاتر المختارة.',
        'FR': 'Imprimer des rapports détaillés pour les cahiers sélectionnés.',
        'EN': 'Print detailed reports for selected notebooks.',
        'ES': 'Imprimir informes detallados de los cuadernos seleccionados.',
        'IT': 'Stampare rapporti dettagliati per i quaderni selezionati.',
        'DE': 'Detaillierte Berichte für ausgewählte Hefte drucken.',
        'TR': 'Seçilen defterler için ayrıntılı raporlar yazdırın.'
      },
      'reports.openNotebooksReports': {
        'AR': 'فتح تقارير الدفاتر',
        'FR': 'Ouvrir les rapports des cahiers',
        'EN': 'Open notebook reports',
        'ES': 'Abrir informes de cuadernos',
        'IT': 'Apri i rapporti dei quaderni',
        'DE': 'Heftberichte öffnen',
        'TR': 'Defter raporlarını aç'
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
      'reports.certificatesPenalties': {
        'AR': 'الشهادات والعقوبات',
        'FR': 'Certificats et sanctions',
        'EN': 'Certificates and Penalties',
        'ES': 'Certificados y sanciones',
        'IT': 'Certificati e sanzioni',
        'DE': 'Zertifikate und Sanktionen',
        'TR': 'Sertifikalar ve Cezalar'
      },
      'reports.certificatesPenaltiesDesc': {
        'AR': 'مركز واحد لعرض شهادات التقدير والمخالفات السلوكية لكل قسم.',
        'FR': 'Un centre unique pour afficher les certificats de mérite et les infractions comportementales pour chaque classe.',
        'EN': 'A single center to view certificates of merit and behavioral violations for each class.',
        'ES': 'Un centro único para ver certificados de mérito e infracciones de comportamiento para cada clase.',
        'IT': 'Un unico centro per visualizzare certificati di merito e violazioni comportamentali per ogni classe.',
        'DE': 'Ein einziges Zentrum zur Anzeige von Leistungszertifikaten und Verhaltensverstößen für jede Klasse.',
        'TR': 'Her sınıf için başarı sertifikalarını ve davranış ihlallerini görüntülemek için tek bir merkez.'
      },
      'reports.certificates': {
        'AR': 'الشهادات',
        'FR': 'Certificats',
        'EN': 'Certificates',
        'ES': 'Certificados',
        'IT': 'Certificati',
        'DE': 'Zertifikate',
        'TR': 'Sertifikalar'
      },
      'reports.certificatesDesc': {
        'AR': 'عرض وتصدير شهادات التقدير لكل قسم بصيغة PDF.',
        'FR': 'Afficher et exporter les certificats de mérite pour chaque classe en PDF.',
        'EN': 'View and export certificates of merit for each class in PDF format.',
        'ES': 'Ver y exportar certificados de mérito para cada clase en formato PDF.',
        'IT': 'Visualizza ed esporta certificati di merito per ogni classe in formato PDF.',
        'DE': 'Anzeigen und Exportieren von Leistungszertifikaten für jede Klasse im PDF-Format.',
        'TR': 'Her sınıf için başarı sertifikalarını PDF formatında görüntüleyin ve dışa aktarın.'
      },
      'reports.penalties': {
        'AR': 'العقوبات والتقارير',
        'FR': 'Sanctions et rapports',
        'EN': 'Penalties and Reports',
        'ES': 'Sanciones e informes',
        'IT': 'Sanzioni e rapporti',
        'DE': 'Sanktionen und Berichte',
        'TR': 'Cezalar ve Raporlar'
      },
      'reports.penaltiesDesc': {
        'AR': 'عرض وتصدير المخالفات السلوكية والتقارير لكل قسم بصيغة PDF.',
        'FR': 'Afficher et exporter les infractions comportementales et les rapports pour chaque classe en PDF.',
        'EN': 'View and export behavioral violations and reports for each class in PDF format.',
        'ES': 'Ver y exportar infracciones de comportamiento e informes para cada clase en formato PDF.',
        'IT': 'Visualizza ed esporta violazioni comportamentali e rapporti per ogni classe in formato PDF.',
        'DE': 'Anzeigen und Exportieren von Verhaltensverstößen und Berichten für jede Klasse im PDF-Format.',
        'TR': 'Her sınıf için davranış ihlalleri ve raporları PDF formatında görüntüleyin ve dışa aktarın.'
      },
      'reports.openCertificatesPenalties': {
        'AR': 'فتح الشهادات والعقوبات',
        'FR': 'Ouvrir Certificats et sanctions',
        'EN': 'Open Certificates and Penalties',
        'ES': 'Abrir Certificados y sanciones',
        'IT': 'Apri Certificati e sanzioni',
        'DE': 'Zertifikate und Sanktionen öffnen',
        'TR': 'Sertifikalar ve Cezalar\'ı aç'
      },
      'reports.exportCertificates': {
        'AR': 'تصدير الشهادات PDF',
        'FR': 'Exporter Certificats PDF',
        'EN': 'Export Certificates PDF',
        'ES': 'Exportar Certificados PDF',
        'IT': 'Esporta Certificati PDF',
        'DE': 'Zertifikate PDF exportieren',
        'TR': 'Sertifikalar PDF Dışa Aktar'
      },
      'reports.exportPenalties': {
        'AR': 'تصدير العقوبات PDF',
        'FR': 'Exporter Sanctions PDF',
        'EN': 'Export Penalties PDF',
        'ES': 'Exportar Sanciones PDF',
        'IT': 'Esporta Sanzioni PDF',
        'DE': 'Sanktionen PDF exportieren',
        'TR': 'Cezalar PDF Dışa Aktar'
      },
      'reports.exporting': {
        'AR': 'جارٍ التصدير...',
        'FR': 'Exportation en cours...',
        'EN': 'Exporting...',
        'ES': 'Exportando...',
        'IT': 'Esportazione in corso...',
        'DE': 'Wird exportiert...',
        'TR': 'Dışa aktarılıyor...'
      },
      'reports.openExportCertificates': {
        'AR': 'فتح وتصدير الشهادات PDF',
        'FR': 'Ouvrir et exporter Certificats PDF',
        'EN': 'Open and Export Certificates PDF',
        'ES': 'Abrir y exportar Certificados PDF',
        'IT': 'Apri ed esporta Certificati PDF',
        'DE': 'Zertifikate PDF öffnen und exportieren',
        'TR': 'Sertifikalar PDF Aç ve Dışa Aktar'
      },
      'reports.openExportPenalties': {
        'AR': 'فتح وتصدير العقوبات PDF',
        'FR': 'Ouvrir et exporter Sanctions PDF',
        'EN': 'Open and Export Penalties PDF',
        'ES': 'Abrir y exportar Sanciones PDF',
        'IT': 'Apri ed esporta Sanzioni PDF',
        'DE': 'Sanktionen PDF öffnen und exportieren',
        'TR': 'Cezalar PDF Aç ve Dışa Aktar'
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
      'reports.gradeMonitoring': {
        'AR': 'تقرير مراقبة النقاط',
        'FR': 'Rapport de surveillance des notes',
        'EN': 'Grade monitoring report',
        'ES': 'Informe de monitoreo de calificaciones',
        'IT': 'Rapporto monitoraggio voti',
        'DE': 'Notenüberwachungsbericht',
        'TR': 'Not izleme raporu'
      },
      'reports.gradeMonitoringDesc': {
        'AR': 'عرض وتصدير تقرير مراقبة النقاط والأخطاء في الدرجات بصيغة PDF.',
        'FR': 'Afficher et exporter le rapport de surveillance des notes et des erreurs en PDF.',
        'EN': 'View and export grade monitoring report and errors in PDF format.',
        'ES': 'Ver y exportar el informe de monitoreo de calificaciones y errores en formato PDF.',
        'IT': 'Visualizza ed esporta il rapporto di monitoraggio dei voti e degli errori in formato PDF.',
        'DE': 'Anzeigen und Exportieren des Notenüberwachungsberichts und der Fehler im PDF-Format.',
        'TR': 'Not izleme raporunu ve hataları PDF formatında görüntüleyin ve dışa aktarın.'
      },
      'reports.openGradeMonitoring': {
        'AR': 'فتح تقرير مراقبة النقاط',
        'FR': 'Ouvrir le rapport de surveillance des notes',
        'EN': 'Open grade monitoring report',
        'ES': 'Abrir informe de monitoreo de calificaciones',
        'IT': 'Apri rapporto monitoraggio voti',
        'DE': 'Notenüberwachungsbericht öffnen',
        'TR': 'Not izleme raporunu aç'
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
      'pedagogicalDocs.openAsBook': {
        'AR': 'فتح ككتاب',
        'FR': 'Ouvrir comme livre',
        'EN': 'Open as book',
        'ES': 'Abrir como libro',
        'IT': 'Apri come libro',
        'DE': 'Als Buch öffnen',
        'TR': 'Kitap olarak aç'
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
      'classes.exportReport': {
        'AR': 'تقرير ملخص القسم (PDF)',
        'FR': 'Exporter le rapport de classe (PDF)',
        'EN': 'Export class summary report (PDF)',
        'ES': 'Exportar informe resumido de la clase (PDF)',
        'IT': 'Esporta riepilogo classe (PDF)',
        'DE': 'Klassenübersichtsbericht exportieren (PDF)',
        'TR': 'Sınıf özet raporunu dışa aktar (PDF)'
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
      'common.unknown': {
        'AR': 'غير معروف',
        'FR': 'Inconnu',
        'EN': 'Unknown',
        'ES': 'Desconocido',
        'IT': 'Sconosciuto',
        'DE': 'Unbekannt',
        'TR': 'Bilinmiyor'
      },
      'common.optional': {
        'AR': 'اختياري',
        'FR': 'Optionnel',
        'EN': 'Optional',
        'ES': 'Opcional',
        'IT': 'Opzionale',
        'DE': 'Optional',
        'TR': 'İsteğe bağlı'
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
      'attendance.errorUpdate': {
        'AR': 'حدث خطأ أثناء تحديث الحضور',
        'FR': 'Une erreur s\'est produite lors de la mise à jour de la présence',
        'EN': 'An error occurred while updating attendance',
        'ES': 'Se produjo un error al actualizar la asistencia',
        'IT': 'Si è verificato un errore durante l\'aggiornamento delle presenze',
        'DE': 'Beim Aktualisieren der Anwesenheit ist ein Fehler aufgetreten',
        'TR': 'Yoklama güncellenirken bir hata oluştu'
      },
      'attendance.errorCreate': {
        'AR': 'حدث خطأ أثناء تسجيل الحضور',
        'FR': 'Une erreur s\'est produite lors de l\'enregistrement de la présence',
        'EN': 'An error occurred while saving attendance',
        'ES': 'Se produjo un error al registrar la asistencia',
        'IT': 'Si è verificato un errore durante il salvataggio delle presenze',
        'DE': 'Beim Speichern der Anwesenheit ist ein Fehler aufgetreten',
        'TR': 'Yoklama kaydedilirken bir hata oluştu'
      },
      'attendance.selectClassAndStudents': {
        'AR': 'يرجى اختيار قسم وتحميل التلاميذ',
        'FR': 'Veuillez sélectionner une classe et charger les élèves',
        'EN': 'Please select a class and load students',
        'ES': 'Seleccione una clase y cargue los estudiantes',
        'IT': 'Seleziona una classe e carica gli studenti',
        'DE': 'Bitte wählen Sie eine Klasse und laden Sie die Schüler',
        'TR': 'Lütfen bir sınıf seçin ve öğrencileri yükleyin'
      },
      'attendance.confirmRecordWeek': {
        'AR': 'هل تريد تسجيل الحضور لجميع أيام الأسبوع للتلاميذ المحددين؟',
        'FR': 'Voulez-vous enregistrer la présence pour tous les jours de la semaine pour les élèves sélectionnés ?',
        'EN': 'Do you want to record attendance for all days of the week for the selected students?',
        'ES': '¿Desea registrar la asistencia para todos los días de la semana para los estudiantes seleccionados?',
        'IT': 'Vuoi registrare la presenza per tutti i giorni della settimana per gli studenti selezionati?',
        'DE': 'Möchten Sie die Anwesenheit für alle Wochentage für die ausgewählten Schüler erfassen?',
        'TR': 'Seçilen öğrenciler için haftanın tüm günleri için yoklama kaydetmek istiyor musunuz?'
      },
      'attendance.weekRecorded': {
        'AR': 'تم تسجيل الحضور للأسبوع بنجاح',
        'FR': 'La présence pour la semaine a été enregistrée avec succès',
        'EN': 'Week attendance has been recorded successfully',
        'ES': 'La asistencia de la semana se ha registrado correctamente',
        'IT': 'La presenza per la settimana è stata registrata con successo',
        'DE': 'Die Anwesenheit für die Woche wurde erfolgreich erfasst',
        'TR': 'Haftalık yoklama başarıyla kaydedildi'
      },
      'attendance.exportOnlyAbsences': {
        'AR': 'تصدير PDF متاح فقط لتقرير الغيابات',
        'FR': 'L\'export PDF est disponible uniquement pour le rapport des absences',
        'EN': 'PDF export is only available for the absences report',
        'ES': 'La exportación en PDF solo está disponible para el informe de ausencias',
        'IT': 'L\'esportazione PDF è disponibile solo per il rapporto delle assenze',
        'DE': 'PDF-Export ist nur für den Abwesenheitsbericht verfügbar',
        'TR': 'PDF dışa aktarma yalnızca devamsızlık raporu için kullanılabilir'
      },
      'attendance.reportTableNotFound': {
        'AR': 'لا يمكن العثور على جدول التقرير. يرجى التأكد من فتح تقرير الغيابات',
        'FR': 'Impossible de trouver le tableau du rapport. Veuillez vérifier que le rapport des absences est ouvert',
        'EN': 'Cannot find the report table. Please make sure the absences report is open',
        'ES': 'No se puede encontrar la tabla del informe. Asegúrese de que el informe de ausencias esté abierto',
        'IT': 'Impossibile trovare la tabella del rapporto. Assicurati che il rapporto delle assenze sia aperto',
        'DE': 'Der Berichtstisch kann nicht gefunden werden. Bitte stellen Sie sicher, dass der Abwesenheitsbericht geöffnet ist',
        'TR': 'Rapor tablosu bulunamıyor. Lütfen devamsızlık raporunun açık olduğundan emin olun'
      },
      'attendance.errorExportPdf': {
        'AR': 'حدث خطأ أثناء تصدير التقرير إلى PDF',
        'FR': 'Une erreur s\'est produite lors de l\'exportation du rapport en PDF',
        'EN': 'An error occurred while exporting the report to PDF',
        'ES': 'Se produjo un error al exportar el informe a PDF',
        'IT': 'Si è verificato un errore durante l\'esportazione del rapporto in PDF',
        'DE': 'Beim Exportieren des Berichts in PDF ist ein Fehler aufgetreten',
        'TR': 'Rapor PDF\'e aktarılırken bir hata oluştu'
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
      'behavior.descriptionPlaceholder': {
        'AR': 'أدخل وصفًا إضافيًا للسلوك...',
        'FR': 'Saisissez une description supplémentaire du comportement...',
        'EN': 'Enter additional description for the behavior...',
        'ES': 'Introduzca una descripción adicional del comportamiento...',
        'IT': 'Inserisci una descrizione aggiuntiva del comportamento...',
        'DE': 'Geben Sie eine zusätzliche Beschreibung des Verhaltens ein...',
        'TR': 'Davranış için ek bir açıklama girin...'
      },
      'behavior.selectTypeRequired': {
        'AR': 'يرجى اختيار نوع السلوك',
        'FR': 'Veuillez sélectionner un type de comportement',
        'EN': 'Please select a behavior type',
        'ES': 'Seleccione un tipo de comportamiento',
        'IT': 'Seleziona un tipo di comportamento',
        'DE': 'Bitte wählen Sie eine Verhaltensart aus',
        'TR': 'Lütfen bir davranış türü seçin'
      },
      'behavior.errorSave': {
        'AR': 'حدث خطأ أثناء حفظ السلوك',
        'FR': 'Une erreur s\'est produite lors de l\'enregistrement du comportement',
        'EN': 'An error occurred while saving the behavior',
        'ES': 'Se produjo un error al guardar el comportamiento',
        'IT': 'Si è verificato un errore durante il salvataggio del comportamento',
        'DE': 'Beim Speichern des Verhaltens ist ein Fehler aufgetreten',
        'TR': 'Davranış kaydedilirken bir hata oluştu'
      },
      'behavior.confirmDelete': {
        'AR': 'هل أنت متأكد من حذف هذا السجل؟',
        'FR': 'Êtes-vous sûr de vouloir supprimer cet enregistrement ?',
        'EN': 'Are you sure you want to delete this record?',
        'ES': '¿Está seguro de que desea eliminar este registro?',
        'IT': 'Sei sicuro di voler eliminare questo record?',
        'DE': 'Möchten Sie diesen Eintrag wirklich löschen?',
        'TR': 'Bu kaydı silmek istediğinizden emin misiniz?'
      },
      'behavior.errorDelete': {
        'AR': 'حدث خطأ أثناء حذف السجل',
        'FR': 'Une erreur s\'est produite lors de la suppression de l\'enregistrement',
        'EN': 'An error occurred while deleting the record',
        'ES': 'Se produjo un error al eliminar el registro',
        'IT': 'Si è verificato un errore durante l\'eliminazione del record',
        'DE': 'Beim Löschen des Eintrags ist ein Fehler aufgetreten',
        'TR': 'Kayıt silinirken bir hata oluştu'
      },
      'behavior.warningExceeded': {
        'AR': '⚠️ تحذير: التلميذ {{studentName}} لديه {{negativeCount}} سلوك سلبي. تم تجاوز الحد المسموح ({{threshold}}).',
        'FR': '⚠️ Avertissement : l\'élève {{studentName}} a {{negativeCount}} comportements négatifs. Le seuil autorisé ({{threshold}}) a été dépassé.',
        'EN': '⚠️ Warning: student {{studentName}} has {{negativeCount}} negative behaviors. The allowed threshold ({{threshold}}) has been exceeded.',
        'ES': '⚠️ Aviso: el estudiante {{studentName}} tiene {{negativeCount}} comportamientos negativos. Se ha superado el umbral permitido ({{threshold}}).',
        'IT': '⚠️ Avviso: lo studente {{studentName}} ha {{negativeCount}} comportamenti negativi. È stata superata la soglia consentita ({{threshold}}).',
        'DE': '⚠️ Warnung: Schüler {{studentName}} hat {{negativeCount}} negative Verhaltensweisen. Der erlaubte Schwellenwert ({{threshold}}) wurde überschritten.',
        'TR': '⚠️ Uyarı: {{studentName}} öğrencisinin {{negativeCount}} olumsuz davranışı var. İzin verilen eşik ({{threshold}}) aşıldı.'
      },
      'behavior.selectClassFirst': {
        'AR': 'يرجى اختيار قسم أولاً',
        'FR': 'Veuillez d\'abord sélectionner une classe',
        'EN': 'Please select a class first',
        'ES': 'Seleccione primero una clase',
        'IT': 'Seleziona prima una classe',
        'DE': 'Bitte wählen Sie zuerst eine Klasse aus',
        'TR': 'Lütfen önce bir sınıf seçin'
      },
      'behavior.noDataToExport': {
        'AR': 'لا توجد بيانات للتصدير',
        'FR': 'Aucune donnée à exporter',
        'EN': 'No data to export',
        'ES': 'No hay datos para exportar',
        'IT': 'Nessun dato da esportare',
        'DE': 'Keine Daten zum Exportieren',
        'TR': 'Dışa aktarılacak veri yok'
      },
      'behavior.studentReportTitle': {
        'AR': 'تقرير السلوك (تلميذ)',
        'FR': 'Rapport de comportement (élève)',
        'EN': 'Behavior report (student)',
        'ES': 'Informe de comportamiento (estudiante)',
        'IT': 'Rapporto di comportamento (studente)',
        'DE': 'Verhaltensbericht (Schüler)',
        'TR': 'Davranış raporu (öğrenci)'
      },
      'behavior.classReportTitle': {
        'AR': 'تقرير السلوك (القسم)',
        'FR': 'Rapport de comportement (classe)',
        'EN': 'Behavior report (class)',
        'ES': 'Informe de comportamiento (clase)',
        'IT': 'Rapporto di comportamento (classe)',
        'DE': 'Verhaltensbericht (Klasse)',
        'TR': 'Davranış raporu (sınıf)'
      },
      'behavior.errorExportPdf': {
        'AR': 'حدث خطأ أثناء تصدير PDF',
        'FR': 'Une erreur s\'est produite lors de l\'exportation en PDF',
        'EN': 'An error occurred while exporting PDF',
        'ES': 'Se produjo un error al exportar a PDF',
        'IT': 'Si è verificato un errore durante l\'esportazione in PDF',
        'DE': 'Beim Exportieren in PDF ist ein Fehler aufgetreten',
        'TR': 'PDF dışa aktarılırken bir hata oluştu'
      },
      'behavior.totalRecords': {
        'AR': 'إجمالي السجلات',
        'FR': 'Nombre total d\'enregistrements',
        'EN': 'Total records',
        'ES': 'Registros totales',
        'IT': 'Record totali',
        'DE': 'Gesamtanzahl der Einträge',
        'TR': 'Toplam kayıt'
      },
      'behavior.warningTitle': {
        'AR': 'تحذير: تجاوز الحد المسموح',
        'FR': 'Avertissement : seuil dépassé',
        'EN': 'Warning: threshold exceeded',
        'ES': 'Aviso: umbral superado',
        'IT': 'Avviso: soglia superata',
        'DE': 'Warnung: Schwellenwert überschritten',
        'TR': 'Uyarı: eşik aşıldı'
      },
      'behavior.warningBody': {
        'AR': 'عدد السلوكيات السلبية ({{negativeCount}}) تجاوز الحد المسموح ({{threshold}})',
        'FR': 'Le nombre de comportements négatifs ({{negativeCount}}) a dépassé le seuil autorisé ({{threshold}})',
        'EN': 'The number of negative behaviors ({{negativeCount}}) has exceeded the allowed threshold ({{threshold}})',
        'ES': 'El número de comportamientos negativos ({{negativeCount}}) ha superado el umbral permitido ({{threshold}})',
        'IT': 'Il numero di comportamenti negativi ({{negativeCount}}) ha superato la soglia consentita ({{threshold}})',
        'DE': 'Die Anzahl der negativen Verhaltensweisen ({{negativeCount}}) hat den erlaubten Schwellenwert ({{threshold}}) überschritten',
        'TR': 'Olumsuz davranış sayısı ({{negativeCount}}) izin verilen eşiği ({{threshold}}) aştı'
      },
      'behavior.noEvents': {
        'AR': 'لا توجد سجلات سلوك',
        'FR': 'Aucun enregistrement de comportement',
        'EN': 'No behavior records',
        'ES': 'No hay registros de comportamiento',
        'IT': 'Nessun registro di comportamento',
        'DE': 'Keine Verhaltensaufzeichnungen',
        'TR': 'Davranış kaydı yok'
      },
      'behavior.exportPdf': {
        'AR': 'تصدير PDF',
        'FR': 'Exporter en PDF',
        'EN': 'Export PDF',
        'ES': 'Exportar PDF',
        'IT': 'Esporta PDF',
        'DE': 'Als PDF exportieren',
        'TR': 'PDF dışa aktar'
      },
      'behavior.studentName': {
        'AR': 'اسم التلميذ',
        'FR': 'Nom de l\'élève',
        'EN': 'Student name',
        'ES': 'Nombre del estudiante',
        'IT': 'Nome dello studente',
        'DE': 'Schülername',
        'TR': 'Öğrenci adı'
      },
      'behavior.positiveCount': {
        'AR': 'السلوك الإيجابي',
        'FR': 'Comportement positif',
        'EN': 'Positive behavior',
        'ES': 'Comportamiento positivo',
        'IT': 'Comportamento positivo',
        'DE': 'Positives Verhalten',
        'TR': 'Olumlu davranış'
      },
      'behavior.negativeCount': {
        'AR': 'السلوك السلبي',
        'FR': 'Comportement négatif',
        'EN': 'Negative behavior',
        'ES': 'Comportamiento negativo',
        'IT': 'Comportamento negativo',
        'DE': 'Negatives Verhalten',
        'TR': 'Olumsuz davranış'
      },
      'behavior.total': {
        'AR': 'الإجمالي',
        'FR': 'Total',
        'EN': 'Total',
        'ES': 'Total',
        'IT': 'Totale',
        'DE': 'Gesamt',
        'TR': 'Toplam'
      },
      'behavior.status': {
        'AR': 'الحالة',
        'FR': 'Statut',
        'EN': 'Status',
        'ES': 'Estado',
        'IT': 'Stato',
        'DE': 'Status',
        'TR': 'Durum'
      },
      'behavior.actions': {
        'AR': 'الإجراءات',
        'FR': 'Actions',
        'EN': 'Actions',
        'ES': 'Acciones',
        'IT': 'Azioni',
        'DE': 'Aktionen',
        'TR': 'İşlemler'
      },
      'behavior.statusWarning': {
        'AR': 'تحذير',
        'FR': 'Avertissement',
        'EN': 'Warning',
        'ES': 'Aviso',
        'IT': 'Avviso',
        'DE': 'Warnung',
        'TR': 'Uyarı'
      },
      'behavior.statusNormal': {
        'AR': 'طبيعي',
        'FR': 'Normal',
        'EN': 'Normal',
        'ES': 'Normal',
        'IT': 'Normale',
        'DE': 'Normal',
        'TR': 'Normal'
      },
      'behavior.viewDetails': {
        'AR': 'عرض التفاصيل',
        'FR': 'Voir les détails',
        'EN': 'View details',
        'ES': 'Ver detalles',
        'IT': 'Vedi dettagli',
        'DE': 'Details anzeigen',
        'TR': 'Detayları göster'
      },
      'behavior.noData': {
        'AR': 'لا توجد بيانات',
        'FR': 'Aucune donnée',
        'EN': 'No data',
        'ES': 'Sin datos',
        'IT': 'Nessun dato',
        'DE': 'Keine Daten',
        'TR': 'Veri yok'
      },
      'behavior.viewReport': {
        'AR': 'عرض التقرير',
        'FR': 'Voir le rapport',
        'EN': 'View report',
        'ES': 'Ver informe',
        'IT': 'Vedi rapporto',
        'DE': 'Bericht anzeigen',
        'TR': 'Raporu görüntüle'
      },
      'behavior.noStudents': {
        'AR': 'لا يوجد تلاميذ في هذا القسم',
        'FR': 'Aucun élève dans cette classe',
        'EN': 'No students in this class',
        'ES': 'No hay estudiantes en esta clase',
        'IT': 'Nessuno studente in questa classe',
        'DE': 'Keine Schüler in dieser Klasse',
        'TR': 'Bu sınıfta öğrenci yok'
      },
      'behavior.selectClassToView': {
        'AR': 'يرجى اختيار قسم لعرض التلاميذ',
        'FR': 'Veuillez sélectionner une classe pour afficher les élèves',
        'EN': 'Please select a class to view students',
        'ES': 'Seleccione una clase para ver los estudiantes',
        'IT': 'Seleziona una classe per visualizzare gli studenti',
        'DE': 'Bitte wählen Sie eine Klasse, um die Schüler anzuzeigen',
        'TR': 'Öğrencileri görmek için lütfen bir sınıf seçin'
      },
      'behavior.recordBehaviorTitle': {
        'AR': 'تسجيل سلوك',
        'FR': 'Enregistrer un comportement',
        'EN': 'Record behavior',
        'ES': 'Registrar comportamiento',
        'IT': 'Registrare comportamento',
        'DE': 'Verhalten aufzeichnen',
        'TR': 'Davranış kaydet'
      },
      'behavior.save': {
        'AR': 'حفظ',
        'FR': 'Enregistrer',
        'EN': 'Save',
        'ES': 'Guardar',
        'IT': 'Salva',
        'DE': 'Speichern',
        'TR': 'Kaydet'
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
      'seatingChart.roomDesign': {
        'AR': 'تصميم القاعة',
        'FR': 'Conception de la salle',
        'EN': 'Room Design',
        'ES': 'Diseño de la sala',
        'IT': 'Progettazione della sala',
        'DE': 'Raumgestaltung',
        'TR': 'Oda Tasarımı'
      },
      'seatingChart.numberOfRows': {
        'AR': 'عدد الصفوف',
        'FR': 'Nombre de rangées',
        'EN': 'Number of rows',
        'ES': 'Número de filas',
        'IT': 'Numero di file',
        'DE': 'Anzahl der Reihen',
        'TR': 'Sıra sayısı'
      },
      'seatingChart.threeRows': {
        'AR': '3 صفوف',
        'FR': '3 rangées',
        'EN': '3 rows',
        'ES': '3 filas',
        'IT': '3 file',
        'DE': '3 Reihen',
        'TR': '3 sıra'
      },
      'seatingChart.fourRows': {
        'AR': '4 صفوف',
        'FR': '4 rangées',
        'EN': '4 rows',
        'ES': '4 filas',
        'IT': '4 file',
        'DE': '4 Reihen',
        'TR': '4 sıra'
      },
      'seatingChart.tableType': {
        'AR': 'نوع الطاولة',
        'FR': 'Type de table',
        'EN': 'Table type',
        'ES': 'Tipo de mesa',
        'IT': 'Tipo di tavolo',
        'DE': 'Tischtyp',
        'TR': 'Masa tipi'
      },
      'seatingChart.singleTable': {
        'AR': 'طاولة فردية',
        'FR': 'Table individuelle',
        'EN': 'Single table',
        'ES': 'Mesa individual',
        'IT': 'Tavolo singolo',
        'DE': 'Einzeltisch',
        'TR': 'Tekli masa'
      },
      'seatingChart.oneStudent': {
        'AR': 'تلميذ واحد',
        'FR': 'Un élève',
        'EN': 'One student',
        'ES': 'Un estudiante',
        'IT': 'Uno studente',
        'DE': 'Ein Schüler',
        'TR': 'Bir öğrenci'
      },
      'seatingChart.doubleTable': {
        'AR': 'طاولة مزدوجة',
        'FR': 'Table double',
        'EN': 'Double table',
        'ES': 'Mesa doble',
        'IT': 'Tavolo doppio',
        'DE': 'Doppeltisch',
        'TR': 'Çiftli masa'
      },
      'seatingChart.twoStudents': {
        'AR': 'تلميذان',
        'FR': 'Deux élèves',
        'EN': 'Two students',
        'ES': 'Dos estudiantes',
        'IT': 'Due studenti',
        'DE': 'Zwei Schüler',
        'TR': 'İki öğrenci'
      },
      'seatingChart.createLayout': {
        'AR': 'إنشاء التخطيط',
        'FR': 'Créer la disposition',
        'EN': 'Create layout',
        'ES': 'Crear disposición',
        'IT': 'Crea layout',
        'DE': 'Layout erstellen',
        'TR': 'Düzen oluştur'
      },
      'seatingChart.creating': {
        'AR': '... جاري الإنشاء',
        'FR': '... Création en cours',
        'EN': '... Creating',
        'ES': '... Creando',
        'IT': '... Creazione in corso',
        'DE': '... Wird erstellt',
        'TR': '... Oluşturuluyor'
      },
      'seatingChart.computerLayout': {
        'AR': 'مخطط الحواسيب (المخبر)',
        'FR': 'Plan des ordinateurs (Laboratoire)',
        'EN': 'Computer layout (Lab)',
        'ES': 'Disposición de computadoras (Laboratorio)',
        'IT': 'Layout computer (Laboratorio)',
        'DE': 'Computer-Layout (Labor)',
        'TR': 'Bilgisayar düzeni (Laboratuvar)'
      },
      'seatingChart.seatingLayout': {
        'AR': 'مخطط الجلوس (القاعة)',
        'FR': 'Plan de placement (Salle)',
        'EN': 'Seating layout (Classroom)',
        'ES': 'Disposición de asientos (Aula)',
        'IT': 'Layout posti (Aula)',
        'DE': 'Sitzplan (Klassenzimmer)',
        'TR': 'Oturma düzeni (Sınıf)'
      },
      'seatingChart.level': {
        'AR': 'المستوى:',
        'FR': 'Niveau:',
        'EN': 'Level:',
        'ES': 'Nivel:',
        'IT': 'Livello:',
        'DE': 'Stufe:',
        'TR': 'Seviye:'
      },
      'seatingChart.allStudents': {
        'AR': 'جميع التلاميذ',
        'FR': 'Tous les élèves',
        'EN': 'All students',
        'ES': 'Todos los estudiantes',
        'IT': 'Tutti gli studenti',
        'DE': 'Alle Schüler',
        'TR': 'Tüm öğrenciler'
      },
      'seatingChart.studentCount': {
        'AR': 'عدد التلاميذ:',
        'FR': 'Nombre d\'élèves:',
        'EN': 'Number of students:',
        'ES': 'Número de estudiantes:',
        'IT': 'Numero di studenti:',
        'DE': 'Anzahl der Schüler:',
        'TR': 'Öğrenci sayısı:'
      },
      'seatingChart.averageAttendance': {
        'AR': 'متوسط الحضور',
        'FR': 'Taux de présence moyen',
        'EN': 'Average attendance',
        'ES': 'Asistencia promedio',
        'IT': 'Presenza media',
        'DE': 'Durchschnittliche Anwesenheit',
        'TR': 'Ortalama devam'
      },
      'seatingChart.averageGrade': {
        'AR': 'متوسط النقاط',
        'FR': 'Note moyenne',
        'EN': 'Average grade',
        'ES': 'Calificación promedio',
        'IT': 'Voto medio',
        'DE': 'Durchschnittsnote',
        'TR': 'Ortalama not'
      },
      'seatingChart.positiveBehavior': {
        'AR': 'السلوك الإيجابي',
        'FR': 'Comportement positif',
        'EN': 'Positive behavior',
        'ES': 'Comportamiento positivo',
        'IT': 'Comportamento positivo',
        'DE': 'Positives Verhalten',
        'TR': 'Pozitif davranış'
      },
      'seatingChart.numberOfDesks': {
        'AR': 'عدد الطاولات',
        'FR': 'Nombre de tables',
        'EN': 'Number of desks',
        'ES': 'Número de mesas',
        'IT': 'Numero di banchi',
        'DE': 'Anzahl der Tische',
        'TR': 'Masa sayısı'
      },
      'seatingChart.numberOfRowsLabel': {
        'AR': 'عدد الصفوف',
        'FR': 'Nombre de rangées',
        'EN': 'Number of rows',
        'ES': 'Número de filas',
        'IT': 'Numero di file',
        'DE': 'Anzahl der Reihen',
        'TR': 'Sıra sayısı'
      },
      'seatingChart.single': {
        'AR': 'فردية',
        'FR': 'Individuelle',
        'EN': 'Single',
        'ES': 'Individual',
        'IT': 'Singola',
        'DE': 'Einzel',
        'TR': 'Tekli'
      },
      'seatingChart.double': {
        'AR': 'مزدوجة',
        'FR': 'Double',
        'EN': 'Double',
        'ES': 'Doble',
        'IT': 'Doppia',
        'DE': 'Doppel',
        'TR': 'Çiftli'
      },
      'seatingChart.class': {
        'AR': 'القسم',
        'FR': 'Classe',
        'EN': 'Class',
        'ES': 'Clase',
        'IT': 'Classe',
        'DE': 'Klasse',
        'TR': 'Sınıf'
      },
      'seatingChart.layoutType': {
        'AR': 'نوع المخطط',
        'FR': 'Type de plan',
        'EN': 'Layout type',
        'ES': 'Tipo de disposición',
        'IT': 'Tipo di layout',
        'DE': 'Layout-Typ',
        'TR': 'Düzen tipi'
      },
      'seatingChart.computerLayoutU': {
        'AR': 'مخطط الحواسيب (U)',
        'FR': 'Plan des ordinateurs (U)',
        'EN': 'Computer layout (U)',
        'ES': 'Disposición de computadoras (U)',
        'IT': 'Layout computer (U)',
        'DE': 'Computer-Layout (U)',
        'TR': 'Bilgisayar düzeni (U)'
      },
      'seatingChart.seatingLayoutRoom': {
        'AR': 'مخطط الجلوس (قاعة)',
        'FR': 'Plan de placement (Salle)',
        'EN': 'Seating layout (Room)',
        'ES': 'Disposición de asientos (Sala)',
        'IT': 'Layout posti (Sala)',
        'DE': 'Sitzplan (Raum)',
        'TR': 'Oturma düzeni (Oda)'
      },
      'seatingChart.searchStudent': {
        'AR': 'بحث عن تلميذ',
        'FR': 'Rechercher un élève',
        'EN': 'Search for student',
        'ES': 'Buscar estudiante',
        'IT': 'Cerca studente',
        'DE': 'Schüler suchen',
        'TR': 'Öğrenci ara'
      },
      'seatingChart.searchPlaceholder': {
        'AR': 'اكتب اسم التلميذ',
        'FR': 'Tapez le nom de l\'élève',
        'EN': 'Type student name',
        'ES': 'Escriba el nombre del estudiante',
        'IT': 'Digita il nome dello studente',
        'DE': 'Schülername eingeben',
        'TR': 'Öğrenci adını yazın'
      },
      'seatingChart.printSelectedAllClasses': {
        'AR': 'طباعة الحواسيب المحددة (جميع الأقسام)',
        'FR': 'Imprimer les ordinateurs sélectionnés (toutes les classes)',
        'EN': 'Print selected computers (all classes)',
        'ES': 'Imprimir computadoras seleccionadas (todas las clases)',
        'IT': 'Stampa computer selezionati (tutte le classi)',
        'DE': 'Ausgewählte Computer drucken (alle Klassen)',
        'TR': 'Seçili bilgisayarları yazdır (tüm sınıflar)'
      },
      'seatingChart.printGroup': {
        'AR': 'طباعة الفوج',
        'FR': 'Imprimer le groupe',
        'EN': 'Print group',
        'ES': 'Imprimir grupo',
        'IT': 'Stampa gruppo',
        'DE': 'Gruppe drucken',
        'TR': 'Grubu yazdır'
      },
      'seatingChart.printClass': {
        'AR': 'طباعة القسم',
        'FR': 'Imprimer la classe',
        'EN': 'Print class',
        'ES': 'Imprimir clase',
        'IT': 'Stampa classe',
        'DE': 'Klasse drucken',
        'TR': 'Sınıfı yazdır'
      },
      'seatingChart.printAllClasses': {
        'AR': 'طباعة جميع الأقسام',
        'FR': 'Imprimer toutes les classes',
        'EN': 'Print all classes',
        'ES': 'Imprimir todas las clases',
        'IT': 'Stampa tutte le classi',
        'DE': 'Alle Klassen drucken',
        'TR': 'Tüm sınıfları yazdır'
      },
      'seatingChart.createRoomLayout': {
        'AR': 'إنشاء تخطيط قاعة',
        'FR': 'Créer un plan de salle',
        'EN': 'Create room layout',
        'ES': 'Crear disposición de sala',
        'IT': 'Crea layout sala',
        'DE': 'Raumlayout erstellen',
        'TR': 'Oda düzeni oluştur'
      },
      'seatingChart.editRoomLayout': {
        'AR': 'تعديل تخطيط القاعة',
        'FR': 'Modifier le plan de la salle',
        'EN': 'Edit room layout',
        'ES': 'Editar disposición de sala',
        'IT': 'Modifica layout sala',
        'DE': 'Raumlayout bearbeiten',
        'TR': 'Oda düzenini düzenle'
      },
      'seatingChart.organizeStudents': {
        'AR': 'تنظيم التلاميذ',
        'FR': 'Organiser les élèves',
        'EN': 'Organize students',
        'ES': 'Organizar estudiantes',
        'IT': 'Organizza studenti',
        'DE': 'Schüler organisieren',
        'TR': 'Öğrencileri düzenle'
      },
      'seatingChart.stopOrganizing': {
        'AR': 'إيقاف تنظيم التلاميذ',
        'FR': 'Arrêter l\'organisation',
        'EN': 'Stop organizing',
        'ES': 'Dejar de organizar',
        'IT': 'Smetti di organizzare',
        'DE': 'Organisation beenden',
        'TR': 'Düzenlemeyi durdur'
      },
      'seatingChart.moveComputers': {
        'AR': 'تحريك الحواسيب',
        'FR': 'Déplacer les ordinateurs',
        'EN': 'Move computers',
        'ES': 'Mover computadoras',
        'IT': 'Sposta computer',
        'DE': 'Computer verschieben',
        'TR': 'Bilgisayarları taşı'
      },
      'seatingChart.stopMovingComputers': {
        'AR': 'إيقاف تحريك الحواسيب',
        'FR': 'Arrêter le déplacement',
        'EN': 'Stop moving computers',
        'ES': 'Dejar de mover computadoras',
        'IT': 'Smetti di spostare i computer',
        'DE': 'Verschieben beenden',
        'TR': 'Bilgisayarları taşımayı durdur'
      },
      'seatingChart.moveDesks': {
        'AR': 'تحريك الطاولات',
        'FR': 'Déplacer les tables',
        'EN': 'Move desks',
        'ES': 'Mover mesas',
        'IT': 'Sposta banchi',
        'DE': 'Tische verschieben',
        'TR': 'Masaları taşı'
      },
      'seatingChart.stopMovingDesks': {
        'AR': 'إيقاف تحريك الطاولات',
        'FR': 'Arrêter le déplacement',
        'EN': 'Stop moving desks',
        'ES': 'Dejar de mover mesas',
        'IT': 'Smetti di spostare i banchi',
        'DE': 'Verschieben beenden',
        'TR': 'Masaları taşımayı durdur'
      },
      'seatingChart.saveStudentDistribution': {
        'AR': 'حفظ توزيع التلاميذ',
        'FR': 'Enregistrer la répartition des élèves',
        'EN': 'Save student distribution',
        'ES': 'Guardar distribución de estudiantes',
        'IT': 'Salva distribuzione studenti',
        'DE': 'Schülerverteilung speichern',
        'TR': 'Öğrenci dağılımını kaydet'
      },
      'seatingChart.saving': {
        'AR': '... جاري الحفظ',
        'FR': '... Enregistrement en cours',
        'EN': '... Saving',
        'ES': '... Guardando',
        'IT': '... Salvataggio in corso',
        'DE': '... Wird gespeichert',
        'TR': '... Kaydediliyor'
      },
      'seatingChart.saveComputerPositions': {
        'AR': 'حفظ أماكن الحواسيب',
        'FR': 'Enregistrer les positions des ordinateurs',
        'EN': 'Save computer positions',
        'ES': 'Guardar posiciones de computadoras',
        'IT': 'Salva posizioni computer',
        'DE': 'Computerpositionen speichern',
        'TR': 'Bilgisayar konumlarını kaydet'
      },
      'seatingChart.saveDeskPositions': {
        'AR': 'حفظ أماكن الطاولات',
        'FR': 'Enregistrer les positions des tables',
        'EN': 'Save desk positions',
        'ES': 'Guardar posiciones de mesas',
        'IT': 'Salva posizioni banchi',
        'DE': 'Tischpositionen speichern',
        'TR': 'Masa konumlarını kaydet'
      },
      'seatingChart.exportPDF': {
        'AR': 'تصدير PDF',
        'FR': 'Exporter PDF',
        'EN': 'Export PDF',
        'ES': 'Exportar PDF',
        'IT': 'Esporta PDF',
        'DE': 'PDF exportieren',
        'TR': 'PDF dışa aktar'
      },
      'seatingChart.exporting': {
        'AR': '... جاري التصدير',
        'FR': '... Exportation en cours',
        'EN': '... Exporting',
        'ES': '... Exportando',
        'IT': '... Esportazione in corso',
        'DE': '... Wird exportiert',
        'TR': '... Dışa aktarılıyor'
      },
      'seatingChart.unsavedChanges': {
        'AR': 'هناك تعديلات غير محفوظة',
        'FR': 'Il y a des modifications non enregistrées',
        'EN': 'There are unsaved changes',
        'ES': 'Hay cambios sin guardar',
        'IT': 'Ci sono modifiche non salvate',
        'DE': 'Es gibt ungespeicherte Änderungen',
        'TR': 'Kaydedilmemiş değişiklikler var'
      },
      'seatingChart.hide': {
        'AR': 'إخفاء',
        'FR': 'Masquer',
        'EN': 'Hide',
        'ES': 'Ocultar',
        'IT': 'Nascondi',
        'DE': 'Ausblenden',
        'TR': 'Gizle'
      },
      'seatingChart.retry': {
        'AR': 'إعادة المحاولة',
        'FR': 'Réessayer',
        'EN': 'Retry',
        'ES': 'Reintentar',
        'IT': 'Riprova',
        'DE': 'Wiederholen',
        'TR': 'Yeniden dene'
      },
      'seatingChart.computerLayoutUInverted': {
        'AR': 'مخطط الحواسيب (حرف U مقلوب)',
        'FR': 'Plan des ordinateurs (U inversé)',
        'EN': 'Computer layout (Inverted U)',
        'ES': 'Disposición de computadoras (U invertida)',
        'IT': 'Layout computer (U invertita)',
        'DE': 'Computer-Layout (Umgekehrtes U)',
        'TR': 'Bilgisayar düzeni (Ters U)'
      },
      'seatingChart.seatingLayoutClassroom': {
        'AR': 'مخطط الجلوس (القاعة الدراسية)',
        'FR': 'Plan de placement (Salle de classe)',
        'EN': 'Seating layout (Classroom)',
        'ES': 'Disposición de asientos (Aula)',
        'IT': 'Layout posti (Aula)',
        'DE': 'Sitzplan (Klassenzimmer)',
        'TR': 'Oturma düzeni (Sınıf)'
      },
      'seatingChart.zoomHint': {
        'AR': 'يمكن تكبير العرض بالتمرير',
        'FR': 'Vous pouvez zoomer en faisant défiler',
        'EN': 'You can zoom by scrolling',
        'ES': 'Puede hacer zoom desplazándose',
        'IT': 'Puoi ingrandire scorrendo',
        'DE': 'Sie können durch Scrollen zoomen',
        'TR': 'Kaydırarak yakınlaştırabilirsiniz'
      },
      'seatingChart.left': {
        'AR': 'يسار',
        'FR': 'Gauche',
        'EN': 'Left',
        'ES': 'Izquierda',
        'IT': 'Sinistra',
        'DE': 'Links',
        'TR': 'Sol'
      },
      'seatingChart.right': {
        'AR': 'يمين',
        'FR': 'Droite',
        'EN': 'Right',
        'ES': 'Derecha',
        'IT': 'Destra',
        'DE': 'Rechts',
        'TR': 'Sağ'
      },
      'seatingChart.dragMaxTwoStudents': {
        'AR': 'اسحب تلميذين كحد أقصى لهذا الحاسوب',
        'FR': 'Glissez jusqu\'à deux élèves pour cet ordinateur',
        'EN': 'Drag up to two students for this computer',
        'ES': 'Arrastre hasta dos estudiantes para esta computadora',
        'IT': 'Trascina fino a due studenti per questo computer',
        'DE': 'Ziehen Sie bis zu zwei Schüler für diesen Computer',
        'TR': 'Bu bilgisayar için en fazla iki öğrenci sürükleyin'
      },
      'seatingChart.dragOneStudent': {
        'AR': 'اسحب تلميذ واحد لهذه الطاولة',
        'FR': 'Glissez un élève pour cette table',
        'EN': 'Drag one student for this desk',
        'ES': 'Arrastre un estudiante para esta mesa',
        'IT': 'Trascina uno studente per questo banco',
        'DE': 'Ziehen Sie einen Schüler für diesen Tisch',
        'TR': 'Bu masa için bir öğrenci sürükleyin'
      },
      'seatingChart.dragTwoStudents': {
        'AR': 'اسحب تلميذين لهذه الطاولة',
        'FR': 'Glissez deux élèves pour cette table',
        'EN': 'Drag two students for this desk',
        'ES': 'Arrastre dos estudiantes para esta mesa',
        'IT': 'Trascina due studenti per questo banco',
        'DE': 'Ziehen Sie zwei Schüler für diesen Tisch',
        'TR': 'Bu masa için iki öğrenci sürükleyin'
      },
      'seatingChart.loadingLayout': {
        'AR': 'جاري تحميل المخطط...',
        'FR': 'Chargement du plan...',
        'EN': 'Loading layout...',
        'ES': 'Cargando disposición...',
        'IT': 'Caricamento layout...',
        'DE': 'Layout wird geladen...',
        'TR': 'Düzen yükleniyor...'
      },
      'seatingChart.noRoomLayout': {
        'AR': 'لا يوجد تخطيط قاعة',
        'FR': 'Aucun plan de salle',
        'EN': 'No room layout',
        'ES': 'Sin disposición de sala',
        'IT': 'Nessun layout sala',
        'DE': 'Kein Raumlayout',
        'TR': 'Oda düzeni yok'
      },
      'seatingChart.createNewRoomLayout': {
        'AR': 'يرجى إنشاء تخطيط جديد للقاعة',
        'FR': 'Veuillez créer un nouveau plan de salle',
        'EN': 'Please create a new room layout',
        'ES': 'Por favor, cree una nueva disposición de sala',
        'IT': 'Si prega di creare un nuovo layout sala',
        'DE': 'Bitte erstellen Sie ein neues Raumlayout',
        'TR': 'Lütfen yeni bir oda düzeni oluşturun'
      },
      'seatingChart.attendance': {
        'AR': 'الحضور',
        'FR': 'Présence',
        'EN': 'Attendance',
        'ES': 'Asistencia',
        'IT': 'Presenza',
        'DE': 'Anwesenheit',
        'TR': 'Devam'
      },
      'seatingChart.behavior': {
        'AR': 'السلوك',
        'FR': 'Comportement',
        'EN': 'Behavior',
        'ES': 'Comportamiento',
        'IT': 'Comportamento',
        'DE': 'Verhalten',
        'TR': 'Davranış'
      },
      'seatingChart.notes': {
        'AR': 'ملاحظات',
        'FR': 'Notes',
        'EN': 'Notes',
        'ES': 'Notas',
        'IT': 'Note',
        'DE': 'Notizen',
        'TR': 'Notlar'
      },
      'seatingChart.done': {
        'AR': 'تم',
        'FR': 'Terminé',
        'EN': 'Done',
        'ES': 'Hecho',
        'IT': 'Fatto',
        'DE': 'Fertig',
        'TR': 'Tamamlandı'
      },
      'seatingChart.availableStudents': {
        'AR': 'التلاميذ المتاحون',
        'FR': 'Élèves disponibles',
        'EN': 'Available students',
        'ES': 'Estudiantes disponibles',
        'IT': 'Studenti disponibili',
        'DE': 'Verfügbare Schüler',
        'TR': 'Mevcut öğrenciler'
      },
      'seatingChart.students': {
        'AR': 'تلميذاً',
        'FR': 'élèves',
        'EN': 'students',
        'ES': 'estudiantes',
        'IT': 'studenti',
        'DE': 'Schüler',
        'TR': 'öğrenci'
      },
      'seatingChart.allClassStudentsAssigned': {
        'AR': 'جميع التلاميذ تم توزيعهم',
        'FR': 'Tous les élèves ont été assignés',
        'EN': 'All students have been assigned',
        'ES': 'Todos los estudiantes han sido asignados',
        'IT': 'Tutti gli studenti sono stati assegnati',
        'DE': 'Alle Schüler wurden zugewiesen',
        'TR': 'Tüm öğrenciler atandı'
      },
      'seatingChart.empty': {
        'AR': 'فارغ',
        'FR': 'Vide',
        'EN': 'Empty',
        'ES': 'Vacío',
        'IT': 'Vuoto',
        'DE': 'Leer',
        'TR': 'Boş'
      },
      'seatingChart.noClassesAvailable': {
        'AR': 'لا توجد أقسام متاحة. يرجى إضافة قسم أولاً.',
        'FR': 'Aucune classe disponible. Veuillez d\'abord ajouter une classe.',
        'EN': 'No classes available. Please add a class first.',
        'ES': 'No hay clases disponibles. Por favor, agregue una clase primero.',
        'IT': 'Nessuna classe disponibile. Si prega di aggiungere prima una classe.',
        'DE': 'Keine Klassen verfügbar. Bitte fügen Sie zuerst eine Klasse hinzu.',
        'TR': 'Mevcut sınıf yok. Lütfen önce bir sınıf ekleyin.'
      },
      'seatingChart.present': {
        'AR': 'حاضر',
        'FR': 'Présent',
        'EN': 'Present',
        'ES': 'Presente',
        'IT': 'Presente',
        'DE': 'Anwesend',
        'TR': 'Mevcut'
      },
      'seatingChart.absent': {
        'AR': 'غائب',
        'FR': 'Absent',
        'EN': 'Absent',
        'ES': 'Ausente',
        'IT': 'Assente',
        'DE': 'Abwesend',
        'TR': 'Yok'
      },
      'seatingChart.late': {
        'AR': 'متأخر',
        'FR': 'En retard',
        'EN': 'Late',
        'ES': 'Tarde',
        'IT': 'In ritardo',
        'DE': 'Verspätet',
        'TR': 'Geç'
      },
      'seatingChart.excused': {
        'AR': 'مُعذر',
        'FR': 'Excusé',
        'EN': 'Excused',
        'ES': 'Justificado',
        'IT': 'Giustificato',
        'DE': 'Entschuldigt',
        'TR': 'Mazeretli'
      },
      'seatingChart.positive': {
        'AR': 'إيجابي',
        'FR': 'Positif',
        'EN': 'Positive',
        'ES': 'Positivo',
        'IT': 'Positivo',
        'DE': 'Positiv',
        'TR': 'Pozitif'
      },
      'seatingChart.neutral': {
        'AR': 'محايد',
        'FR': 'Neutre',
        'EN': 'Neutral',
        'ES': 'Neutro',
        'IT': 'Neutro',
        'DE': 'Neutral',
        'TR': 'Nötr'
      },
      'seatingChart.negative': {
        'AR': 'سلبي',
        'FR': 'Négatif',
        'EN': 'Negative',
        'ES': 'Negativo',
        'IT': 'Negativo',
        'DE': 'Negativ',
        'TR': 'Negatif'
      },
      'seatingChart.groupUndefined': {
        'AR': 'غير محدد',
        'FR': 'Non défini',
        'EN': 'Undefined',
        'ES': 'No definido',
        'IT': 'Non definito',
        'DE': 'Nicht definiert',
        'TR': 'Tanımsız'
      },
      'seatingChart.attendanceLabel': {
        'AR': 'الحضور',
        'FR': 'Présence',
        'EN': 'Attendance',
        'ES': 'Asistencia',
        'IT': 'Presenza',
        'DE': 'Anwesenheit',
        'TR': 'Devam'
      },
      'seatingChart.behaviorLabel': {
        'AR': 'السلوك',
        'FR': 'Comportement',
        'EN': 'Behavior',
        'ES': 'Comportamiento',
        'IT': 'Comportamento',
        'DE': 'Verhalten',
        'TR': 'Davranış'
      },
      'seatingChart.failedToLoadClasses': {
        'AR': 'تعذر تحميل قائمة الأقسام',
        'FR': 'Impossible de charger la liste des classes',
        'EN': 'Failed to load class list',
        'ES': 'Error al cargar la lista de clases',
        'IT': 'Impossibile caricare l\'elenco delle classi',
        'DE': 'Klassenliste konnte nicht geladen werden',
        'TR': 'Sınıf listesi yüklenemedi'
      },
      'seatingChart.failedToLoadRoomLayout': {
        'AR': 'تعذر تحميل تخطيط القاعة',
        'FR': 'Impossible de charger le plan de la salle',
        'EN': 'Failed to load room layout',
        'ES': 'Error al cargar la disposición de sala',
        'IT': 'Impossibile caricare il layout della sala',
        'DE': 'Raumlayout konnte nicht geladen werden',
        'TR': 'Oda düzeni yüklenemedi'
      },
      'seatingChart.failedToLoadLayout': {
        'AR': 'تعذر تحميل مخطط المقاعد',
        'FR': 'Impossible de charger le plan de placement',
        'EN': 'Failed to load seating layout',
        'ES': 'Error al cargar la disposición de asientos',
        'IT': 'Impossibile caricare il layout dei posti',
        'DE': 'Sitzplan konnte nicht geladen werden',
        'TR': 'Oturma düzeni yüklenemedi'
      },
      'seatingChart.cannotConnectServer': {
        'AR': 'لا يمكن الاتصال بالخادم. تأكد من أن الخادم يعمل.',
        'FR': 'Impossible de se connecter au serveur. Assurez-vous que le serveur fonctionne.',
        'EN': 'Cannot connect to server. Make sure the server is running.',
        'ES': 'No se puede conectar al servidor. Asegúrese de que el servidor esté en ejecución.',
        'IT': 'Impossibile connettersi al server. Assicurati che il server sia in esecuzione.',
        'DE': 'Keine Verbindung zum Server. Stellen Sie sicher, dass der Server läuft.',
        'TR': 'Sunucuya bağlanılamıyor. Sunucunun çalıştığından emin olun.'
      },
      'seatingChart.unauthorized': {
        'AR': 'غير مصرح لك بالوصول. يرجى تسجيل الدخول مرة أخرى.',
        'FR': 'Vous n\'êtes pas autorisé à accéder. Veuillez vous reconnecter.',
        'EN': 'You are not authorized to access. Please log in again.',
        'ES': 'No está autorizado para acceder. Por favor, inicie sesión nuevamente.',
        'IT': 'Non sei autorizzato ad accedere. Si prega di accedere di nuovo.',
        'DE': 'Sie sind nicht berechtigt zuzugreifen. Bitte melden Sie sich erneut an.',
        'TR': 'Erişim yetkiniz yok. Lütfen tekrar giriş yapın.'
      },
      'seatingChart.noPermission': {
        'AR': 'ليس لديك صلاحيات للوصول إلى مخطط المقاعد. يرجى الاتصال بالمسؤول لإضافة صلاحية "مخطط المقاعد" إلى حسابك.',
        'FR': 'Vous n\'avez pas les permissions pour accéder au plan de placement. Veuillez contacter l\'administrateur pour ajouter la permission "Plan de placement" à votre compte.',
        'EN': 'You do not have permission to access the seating chart. Please contact the administrator to add the "Seating Chart" permission to your account.',
        'ES': 'No tiene permiso para acceder al plano de asientos. Por favor, contacte al administrador para agregar el permiso "Plano de asientos" a su cuenta.',
        'IT': 'Non hai il permesso di accedere al piano dei posti. Si prega di contattare l\'amministratore per aggiungere il permesso "Piano dei posti" al tuo account.',
        'DE': 'Sie haben keine Berechtigung, auf den Sitzplan zuzugreifen. Bitte kontaktieren Sie den Administrator, um die Berechtigung "Sitzplan" zu Ihrem Konto hinzuzufügen.',
        'TR': 'Oturma planına erişim izniniz yok. Lütfen yöneticiyle iletişime geçerek hesabınıza "Oturma Planı" iznini ekleyin.'
      },
      'seatingChart.layoutNotFound': {
        'AR': 'لم يتم العثور على مخطط المقاعد لهذا القسم.',
        'FR': 'Plan de placement introuvable pour cette classe.',
        'EN': 'Seating layout not found for this class.',
        'ES': 'Disposición de asientos no encontrada para esta clase.',
        'IT': 'Layout dei posti non trovato per questa classe.',
        'DE': 'Sitzplan für diese Klasse nicht gefunden.',
        'TR': 'Bu sınıf için oturma düzeni bulunamadı.'
      },
      'seatingChart.serverError': {
        'AR': 'حدث خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً.',
        'FR': 'Une erreur s\'est produite sur le serveur. Veuillez réessayer plus tard.',
        'EN': 'A server error occurred. Please try again later.',
        'ES': 'Ocurrió un error en el servidor. Por favor, intente nuevamente más tarde.',
        'IT': 'Si è verificato un errore del server. Si prega di riprovare più tardi.',
        'DE': 'Ein Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut.',
        'TR': 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.'
      },
      'seatingChart.failedToLoadStudents': {
        'AR': 'تعذر تحميل قائمة التلاميذ',
        'FR': 'Impossible de charger la liste des élèves',
        'EN': 'Failed to load student list',
        'ES': 'Error al cargar la lista de estudiantes',
        'IT': 'Impossibile caricare l\'elenco degli studenti',
        'DE': 'Schülerliste konnte nicht geladen werden',
        'TR': 'Öğrenci listesi yüklenemedi'
      },
      'seatingChart.stopMovingFirst': {
        'AR': 'أوقف تحريك',
        'FR': 'Arrêtez de déplacer',
        'EN': 'Stop moving',
        'ES': 'Dejar de mover',
        'IT': 'Smetti di spostare',
        'DE': 'Verschieben beenden',
        'TR': 'Taşımayı durdur'
      },
      'seatingChart.stopOrganizingFirst': {
        'AR': 'أوقف تنظيم التلاميذ أولاً.',
        'FR': 'Arrêtez d\'abord d\'organiser les élèves.',
        'EN': 'Stop organizing students first.',
        'ES': 'Deje de organizar estudiantes primero.',
        'IT': 'Smetti prima di organizzare gli studenti.',
        'DE': 'Beenden Sie zuerst die Organisation der Schüler.',
        'TR': 'Önce öğrencileri düzenlemeyi durdurun.'
      },
      'seatingChart.deskFull': {
        'AR': 'هذه الطاولة ممتلئة',
        'FR': 'Cette table est pleine',
        'EN': 'This desk is full',
        'ES': 'Esta mesa está llena',
        'IT': 'Questo banco è pieno',
        'DE': 'Dieser Tisch ist voll',
        'TR': 'Bu masa dolu'
      },
      'seatingChart.maximum': {
        'AR': 'كحد أقصى',
        'FR': 'au maximum',
        'EN': 'maximum',
        'ES': 'máximo',
        'IT': 'massimo',
        'DE': 'maximal',
        'TR': 'maksimum'
      },
      'seatingChart.computerPositionsSaved': {
        'AR': 'تم حفظ أماكن الحواسيب',
        'FR': 'Positions des ordinateurs enregistrées',
        'EN': 'Computer positions saved',
        'ES': 'Posiciones de computadoras guardadas',
        'IT': 'Posizioni computer salvate',
        'DE': 'Computerpositionen gespeichert',
        'TR': 'Bilgisayar konumları kaydedildi'
      },
      'seatingChart.failedToSaveComputerPositions': {
        'AR': 'تعذر حفظ أماكن الحواسيب',
        'FR': 'Impossible d\'enregistrer les positions des ordinateurs',
        'EN': 'Failed to save computer positions',
        'ES': 'Error al guardar posiciones de computadoras',
        'IT': 'Impossibile salvare le posizioni dei computer',
        'DE': 'Computerpositionen konnten nicht gespeichert werden',
        'TR': 'Bilgisayar konumları kaydedilemedi'
      },
      'seatingChart.layoutSavedSuccessfully': {
        'AR': 'تم حفظ مخطط المقاعد بنجاح',
        'FR': 'Plan de placement enregistré avec succès',
        'EN': 'Seating layout saved successfully',
        'ES': 'Disposición de asientos guardada exitosamente',
        'IT': 'Layout dei posti salvato con successo',
        'DE': 'Sitzplan erfolgreich gespeichert',
        'TR': 'Oturma düzeni başarıyla kaydedildi'
      },
      'seatingChart.failedToSaveLayout': {
        'AR': 'تعذر حفظ المخطط، حاول مرة أخرى',
        'FR': 'Impossible d\'enregistrer le plan, réessayez',
        'EN': 'Failed to save layout, please try again',
        'ES': 'Error al guardar la disposición, intente nuevamente',
        'IT': 'Impossibile salvare il layout, riprova',
        'DE': 'Layout konnte nicht gespeichert werden, bitte versuchen Sie es erneut',
        'TR': 'Düzen kaydedilemedi, lütfen tekrar deneyin'
      },
      'seatingChart.failedToPreparePrint': {
        'AR': 'تعذر تجهيز ملف الطباعة',
        'FR': 'Impossible de préparer le fichier d\'impression',
        'EN': 'Failed to prepare print file',
        'ES': 'Error al preparar el archivo de impresión',
        'IT': 'Impossibile preparare il file di stampa',
        'DE': 'Druckdatei konnte nicht vorbereitet werden',
        'TR': 'Yazdırma dosyası hazırlanamadı'
      },
      'seatingChart.selectAtLeastOneComputer': {
        'AR': 'يرجى تحديد حاسوب واحد على الأقل للطباعة.',
        'FR': 'Veuillez sélectionner au moins un ordinateur pour l\'impression.',
        'EN': 'Please select at least one computer for printing.',
        'ES': 'Por favor, seleccione al menos una computadora para imprimir.',
        'IT': 'Si prega di selezionare almeno un computer per la stampa.',
        'DE': 'Bitte wählen Sie mindestens einen Computer zum Drucken aus.',
        'TR': 'Lütfen yazdırma için en az bir bilgisayar seçin.'
      },
      'seatingChart.failedToDetermineComputerNames': {
        'AR': 'تعذر تحديد أسماء الحواسيب المحددة.',
        'FR': 'Impossible de déterminer les noms des ordinateurs sélectionnés.',
        'EN': 'Failed to determine selected computer names.',
        'ES': 'Error al determinar los nombres de las computadoras seleccionadas.',
        'IT': 'Impossibile determinare i nomi dei computer selezionati.',
        'DE': 'Ausgewählte Computernamen konnten nicht ermittelt werden.',
        'TR': 'Seçili bilgisayar adları belirlenemedi.'
      },
      'seatingChart.noDataToPrint': {
        'AR': 'لا توجد بيانات لطباعتها للحواسيب المحددة.',
        'FR': 'Aucune donnée à imprimer pour les ordinateurs sélectionnés.',
        'EN': 'No data to print for selected computers.',
        'ES': 'No hay datos para imprimir para las computadoras seleccionadas.',
        'IT': 'Nessun dato da stampare per i computer selezionati.',
        'DE': 'Keine Daten zum Drucken für ausgewählte Computer.',
        'TR': 'Seçili bilgisayarlar için yazdırılacak veri yok.'
      },
      'seatingChart.failedToPrepareComputerPrint': {
        'AR': 'تعذر تجهيز ملف طباعة هذا الحاسوب',
        'FR': 'Impossible de préparer le fichier d\'impression de cet ordinateur',
        'EN': 'Failed to prepare print file for this computer',
        'ES': 'Error al preparar el archivo de impresión para esta computadora',
        'IT': 'Impossibile preparare il file di stampa per questo computer',
        'DE': 'Druckdatei für diesen Computer konnte nicht vorbereitet werden',
        'TR': 'Bu bilgisayar için yazdırma dosyası hazırlanamadı'
      },
      'seatingChart.failedToGeneratePDF': {
        'AR': 'تعذر توليد ملف PDF للمخطط',
        'FR': 'Impossible de générer le fichier PDF du plan',
        'EN': 'Failed to generate PDF file for layout',
        'ES': 'Error al generar el archivo PDF para la disposición',
        'IT': 'Impossibile generare il file PDF per il layout',
        'DE': 'PDF-Datei für Layout konnte nicht generiert werden',
        'TR': 'Düzen için PDF dosyası oluşturulamadı'
      },
      'seatingChart.selectClassFirst': {
        'AR': 'يرجى اختيار قسم أولاً',
        'FR': 'Veuillez d\'abord sélectionner une classe',
        'EN': 'Please select a class first',
        'ES': 'Por favor, seleccione una clase primero',
        'IT': 'Si prega di selezionare prima una classe',
        'DE': 'Bitte wählen Sie zuerst eine Klasse aus',
        'TR': 'Lütfen önce bir sınıf seçin'
      },
      'seatingChart.roomLayoutCreatedSuccessfully': {
        'AR': 'تم إنشاء تخطيط القاعة بنجاح',
        'FR': 'Plan de salle créé avec succès',
        'EN': 'Room layout created successfully',
        'ES': 'Disposición de sala creada exitosamente',
        'IT': 'Layout sala creato con successo',
        'DE': 'Raumlayout erfolgreich erstellt',
        'TR': 'Oda düzeni başarıyla oluşturuldu'
      },
      'seatingChart.failedToCreateRoomLayout': {
        'AR': 'تعذر إنشاء تخطيط القاعة',
        'FR': 'Impossible de créer le plan de la salle',
        'EN': 'Failed to create room layout',
        'ES': 'Error al crear la disposición de sala',
        'IT': 'Impossibile creare il layout della sala',
        'DE': 'Raumlayout konnte nicht erstellt werden',
        'TR': 'Oda düzeni oluşturulamadı'
      },
      'seatingChart.deskPositionsSaved': {
        'AR': 'تم حفظ أماكن الطاولات',
        'FR': 'Positions des tables enregistrées',
        'EN': 'Desk positions saved',
        'ES': 'Posiciones de mesas guardadas',
        'IT': 'Posizioni banchi salvate',
        'DE': 'Tischpositionen gespeichert',
        'TR': 'Masa konumları kaydedildi'
      },
      'seatingChart.failedToSaveDeskPositions': {
        'AR': 'تعذر حفظ أماكن الطاولات',
        'FR': 'Impossible d\'enregistrer les positions des tables',
        'EN': 'Failed to save desk positions',
        'ES': 'Error al guardar posiciones de mesas',
        'IT': 'Impossibile salvare le posizioni dei banchi',
        'DE': 'Tischpositionen konnten nicht gespeichert werden',
        'TR': 'Masa konumları kaydedilemedi'
      },
      'seatingChart.computers': {
        'AR': 'الحواسيب',
        'FR': 'Ordinateurs',
        'EN': 'Computers',
        'ES': 'Computadoras',
        'IT': 'Computer',
        'DE': 'Computer',
        'TR': 'Bilgisayarlar'
      },
      'seatingChart.desks': {
        'AR': 'الطاولات',
        'FR': 'Tables',
        'EN': 'Desks',
        'ES': 'Mesas',
        'IT': 'Banchi',
        'DE': 'Tische',
        'TR': 'Masalar'
      },
      'seatingChart.first': {
        'AR': 'أولاً',
        'FR': 'd\'abord',
        'EN': 'first',
        'ES': 'primero',
        'IT': 'prima',
        'DE': 'zuerst',
        'TR': 'önce'
      },
      'seatingChart.error': {
        'AR': 'خطأ',
        'FR': 'Erreur',
        'EN': 'Error',
        'ES': 'Error',
        'IT': 'Errore',
        'DE': 'Fehler',
        'TR': 'Hata'
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
      'labs.addLab': {
        'AR': 'إضافة مخبر',
        'FR': 'Ajouter un laboratoire',
        'EN': 'Add lab',
        'ES': 'Agregar laboratorio',
        'IT': 'Aggiungi laboratorio',
        'DE': 'Labor hinzufügen',
        'TR': 'Laboratuvar ekle'
      },
      'labs.labs': {
        'AR': 'المخابر',
        'FR': 'Laboratoires',
        'EN': 'Labs',
        'ES': 'Laboratorios',
        'IT': 'Laboratori',
        'DE': 'Labore',
        'TR': 'Laboratuvarlar'
      },
      'labs.deviceTracking': {
        'AR': 'متابعة عمل وسلامة الأجهزة',
        'FR': 'Suivi du fonctionnement et de la sécurité des équipements',
        'EN': 'Device operation and safety tracking',
        'ES': 'Seguimiento del funcionamiento y seguridad de los equipos',
        'IT': 'Monitoraggio funzionamento e sicurezza dispositivi',
        'DE': 'Gerätebetriebs- und Sicherheitsverfolgung',
        'TR': 'Cihaz çalışması ve güvenlik takibi'
      },
      'labs.computerLabEquipment': {
        'AR': 'أجهزة معمل الحاسب',
        'FR': 'Équipements du laboratoire informatique',
        'EN': 'Computer lab equipment',
        'ES': 'Equipos del laboratorio de informática',
        'IT': 'Attrezzature del laboratorio informatico',
        'DE': 'Computerlabor-Ausrüstung',
        'TR': 'Bilgisayar laboratuvarı ekipmanları'
      },
      'labs.labComputerSoftware': {
        'AR': 'برامج حواسيب المعمل',
        'FR': 'Logiciels des ordinateurs du laboratoire',
        'EN': 'Lab computer software',
        'ES': 'Software de los ordenadores del laboratorio',
        'IT': 'Software dei computer del laboratorio',
        'DE': 'Laborcomputer-Software',
        'TR': 'Laboratuvar bilgisayar yazılımları'
      },
      'labs.computerLabFurniture': {
        'AR': 'أثاث معمل الحاسب',
        'FR': 'Mobilier du laboratoire informatique',
        'EN': 'Computer lab furniture',
        'ES': 'Mobiliario del laboratorio de informática',
        'IT': 'Arredamento del laboratorio informatico',
        'DE': 'Computerlabor-Möbel',
        'TR': 'Bilgisayar laboratuvarı mobilyaları'
      },
      'labs.inventoryNumbers': {
        'AR': 'أرقام الجرد',
        'FR': 'Numéros d\'inventaire',
        'EN': 'Inventory numbers',
        'ES': 'Números de inventario',
        'IT': 'Numeri di inventario',
        'DE': 'Inventarnummern',
        'TR': 'Envanter numaraları'
      },
      'labs.hardwareSoftwareChecklist': {
        'AR': 'المكوّنات المادية والبرمجية',
        'FR': 'Composants matériels et logiciels',
        'EN': 'Hardware and software components',
        'ES': 'Componentes de hardware y software',
        'IT': 'Componenti hardware e software',
        'DE': 'Hardware- und Softwarekomponenten',
        'TR': 'Donanım ve yazılım bileşenleri'
      },
      'labs.computerLabCleaning': {
        'AR': 'نظافة معمل الحاسب',
        'FR': 'Nettoyage du laboratoire informatique',
        'EN': 'Computer lab cleaning',
        'ES': 'Limpieza del laboratorio de informática',
        'IT': 'Pulizia del laboratorio informatico',
        'DE': 'Computerlabor-Reinigung',
        'TR': 'Bilgisayar laboratuvarı temizliği'
      },
      'labs.labsList': {
        'AR': 'قائمة المخابر',
        'FR': 'Liste des laboratoires',
        'EN': 'Labs list',
        'ES': 'Lista de laboratorios',
        'IT': 'Elenco laboratori',
        'DE': 'Laborliste',
        'TR': 'Laboratuvar listesi'
      },
      'labs.labName': {
        'AR': 'اسم المخبر',
        'FR': 'Nom du laboratoire',
        'EN': 'Lab name',
        'ES': 'Nombre del laboratorio',
        'IT': 'Nome laboratorio',
        'DE': 'Laborname',
        'TR': 'Laboratuvar adı'
      },
      'labs.description': {
        'AR': 'الوصف',
        'FR': 'Description',
        'EN': 'Description',
        'ES': 'Descripción',
        'IT': 'Descrizione',
        'DE': 'Beschreibung',
        'TR': 'Açıklama'
      },
      'labs.location': {
        'AR': 'الموقع',
        'FR': 'Emplacement',
        'EN': 'Location',
        'ES': 'Ubicación',
        'IT': 'Posizione',
        'DE': 'Standort',
        'TR': 'Konum'
      },
      'labs.actions': {
        'AR': 'الإجراءات',
        'FR': 'Actions',
        'EN': 'Actions',
        'ES': 'Acciones',
        'IT': 'Azioni',
        'DE': 'Aktionen',
        'TR': 'İşlemler'
      },
      'labs.available': {
        'AR': 'متاح',
        'FR': 'Disponible',
        'EN': 'Available',
        'ES': 'Disponible',
        'IT': 'Disponibile',
        'DE': 'Verfügbar',
        'TR': 'Müsait'
      },
      'labs.unavailable': {
        'AR': 'غير متاح',
        'FR': 'Indisponible',
        'EN': 'Unavailable',
        'ES': 'No disponible',
        'IT': 'Non disponibile',
        'DE': 'Nicht verfügbar',
        'TR': 'Müsait değil'
      },
      'labs.noLabs': {
        'AR': 'لا توجد مخابر',
        'FR': 'Aucun laboratoire',
        'EN': 'No labs',
        'ES': 'No hay laboratorios',
        'IT': 'Nessun laboratorio',
        'DE': 'Keine Labore',
        'TR': 'Laboratuvar yok'
      },
      'labs.deviceExitEntryLog': {
        'AR': 'سجل خروج ودخول الأجهزة',
        'FR': 'Journal de sortie et d\'entrée des équipements',
        'EN': 'Device exit and entry log',
        'ES': 'Registro de salida y entrada de dispositivos',
        'IT': 'Registro uscita e ingresso dispositivi',
        'DE': 'Geräteaus- und -eingangsprotokoll',
        'TR': 'Cihaz çıkış ve giriş kaydı'
      },
      'labs.exportPDF': {
        'AR': 'تصدير PDF',
        'FR': 'Exporter PDF',
        'EN': 'Export PDF',
        'ES': 'Exportar PDF',
        'IT': 'Esporta PDF',
        'DE': 'PDF exportieren',
        'TR': 'PDF dışa aktar'
      },
      'labs.teacherFullName': {
        'AR': 'اسم ولقب الأستاذ',
        'FR': 'Nom et prénom du professeur',
        'EN': 'Teacher full name',
        'ES': 'Nombre completo del profesor',
        'IT': 'Nome completo insegnante',
        'DE': 'Vollständiger Name des Lehrers',
        'TR': 'Öğretmen adı soyadı'
      },
      'labs.equipmentTypeFromLab': {
        'AR': 'نوع العتاد (من أجهزة المعمل)',
        'FR': 'Type d\'équipement (du laboratoire)',
        'EN': 'Equipment type (from lab equipment)',
        'ES': 'Tipo de equipo (del equipo del laboratorio)',
        'IT': 'Tipo di attrezzatura (dalle attrezzature del laboratorio)',
        'DE': 'Gerätetyp (aus Laborausrüstung)',
        'TR': 'Ekipman tipi (laboratuvar ekipmanlarından)'
      },
      'labs.selectEquipmentType': {
        'AR': 'اختر نوع العتاد',
        'FR': 'Sélectionner le type d\'équipement',
        'EN': 'Select equipment type',
        'ES': 'Seleccionar tipo de equipo',
        'IT': 'Seleziona tipo di attrezzatura',
        'DE': 'Gerätetyp auswählen',
        'TR': 'Ekipman tipini seçin'
      },
      'labs.count': {
        'AR': 'عدد',
        'FR': 'Nombre',
        'EN': 'Count',
        'ES': 'Cantidad',
        'IT': 'Conteggio',
        'DE': 'Anzahl',
        'TR': 'Sayı'
      },
      'labs.selectInventoryNumber': {
        'AR': 'اختر رقم الجرد',
        'FR': 'Sélectionner le numéro d\'inventaire',
        'EN': 'Select inventory number',
        'ES': 'Seleccionar número de inventario',
        'IT': 'Seleziona numero di inventario',
        'DE': 'Inventarnummer auswählen',
        'TR': 'Envanter numarasını seçin'
      },
      'labs.movementDate': {
        'AR': 'تاريخ الحركة',
        'FR': 'Date du mouvement',
        'EN': 'Movement date',
        'ES': 'Fecha del movimiento',
        'IT': 'Data del movimento',
        'DE': 'Bewegungsdatum',
        'TR': 'Hareket tarihi'
      },
      'labs.operationType': {
        'AR': 'نوع العملية',
        'FR': 'Type d\'opération',
        'EN': 'Operation type',
        'ES': 'Tipo de operación',
        'IT': 'Tipo di operazione',
        'DE': 'Vorgangstyp',
        'TR': 'İşlem tipi'
      },
      'labs.deviceExit': {
        'AR': 'خروج الجهاز',
        'FR': 'Sortie de l\'équipement',
        'EN': 'Device exit',
        'ES': 'Salida del dispositivo',
        'IT': 'Uscita dispositivo',
        'DE': 'Geräteausgang',
        'TR': 'Cihaz çıkışı'
      },
      'labs.deviceReturn': {
        'AR': 'استلام الجهاز',
        'FR': 'Retour de l\'équipement',
        'EN': 'Device return',
        'ES': 'Retorno del dispositivo',
        'IT': 'Ritorno dispositivo',
        'DE': 'Geräterückgabe',
        'TR': 'Cihaz iadesi'
      },
      'labs.equipmentStatus': {
        'AR': 'حالة العتاد (✓ / ✗)',
        'FR': 'État de l\'équipement (✓ / ✗)',
        'EN': 'Equipment status (✓ / ✗)',
        'ES': 'Estado del equipo (✓ / ✗)',
        'IT': 'Stato attrezzatura (✓ / ✗)',
        'DE': 'Gerätestatus (✓ / ✗)',
        'TR': 'Ekipman durumu (✓ / ✗)'
      },
      'labs.notWorking': {
        'AR': 'لا يعمل',
        'FR': 'Ne fonctionne pas',
        'EN': 'Not working',
        'ES': 'No funciona',
        'IT': 'Non funziona',
        'DE': 'Funktioniert nicht',
        'TR': 'Çalışmıyor'
      },
      'labs.notes': {
        'AR': 'ملاحظات',
        'FR': 'Notes',
        'EN': 'Notes',
        'ES': 'Notas',
        'IT': 'Note',
        'DE': 'Notizen',
        'TR': 'Notlar'
      },
      'labs.saveNewLog': {
        'AR': 'حفظ سجل جديد',
        'FR': 'Enregistrer un nouveau journal',
        'EN': 'Save new log',
        'ES': 'Guardar nuevo registro',
        'IT': 'Salva nuovo registro',
        'DE': 'Neues Protokoll speichern',
        'TR': 'Yeni kayıt kaydet'
      },
      'labs.exitDate': {
        'AR': 'تاريخ الخروج',
        'FR': 'Date de sortie',
        'EN': 'Exit date',
        'ES': 'Fecha de salida',
        'IT': 'Data di uscita',
        'DE': 'Austrittsdatum',
        'TR': 'Çıkış tarihi'
      },
      'labs.teacher': {
        'AR': 'الأستاذ',
        'FR': 'Professeur',
        'EN': 'Teacher',
        'ES': 'Profesor',
        'IT': 'Insegnante',
        'DE': 'Lehrer',
        'TR': 'Öğretmen'
      },
      'labs.equipmentType': {
        'AR': 'نوع العتاد',
        'FR': 'Type d\'équipement',
        'EN': 'Equipment type',
        'ES': 'Tipo de equipo',
        'IT': 'Tipo di attrezzatura',
        'DE': 'Gerätetyp',
        'TR': 'Ekipman tipi'
      },
      'labs.equipmentStatusOnExit': {
        'AR': 'حالة العتاد عند الخروج',
        'FR': 'État de l\'équipement à la sortie',
        'EN': 'Equipment status on exit',
        'ES': 'Estado del equipo al salir',
        'IT': 'Stato attrezzatura all\'uscita',
        'DE': 'Gerätestatus beim Verlassen',
        'TR': 'Çıkışta ekipman durumu'
      },
      'labs.returnDate': {
        'AR': 'تاريخ الاستلام',
        'FR': 'Date de retour',
        'EN': 'Return date',
        'ES': 'Fecha de retorno',
        'IT': 'Data di ritorno',
        'DE': 'Rückgabedatum',
        'TR': 'İade tarihi'
      },
      'labs.equipmentStatusOnReturn': {
        'AR': 'حالة العتاد عند الاستلام',
        'FR': 'État de l\'équipement au retour',
        'EN': 'Equipment status on return',
        'ES': 'Estado del equipo al retornar',
        'IT': 'Stato attrezzatura al ritorno',
        'DE': 'Gerätestatus bei Rückgabe',
        'TR': 'İadede ekipman durumu'
      },
      'labs.noDeviceLogs': {
        'AR': 'لا توجد سجلات للأجهزة',
        'FR': 'Aucun journal d\'équipement',
        'EN': 'No device logs',
        'ES': 'No hay registros de dispositivos',
        'IT': 'Nessun registro dispositivo',
        'DE': 'Keine Geräteprotokolle',
        'TR': 'Cihaz kaydı yok'
      },
      'labs.model': {
        'AR': 'الموديل',
        'FR': 'Modèle',
        'EN': 'Model',
        'ES': 'Modelo',
        'IT': 'Modello',
        'DE': 'Modell',
        'TR': 'Model'
      },
      'labs.totalCount': {
        'AR': 'العدد الكلي',
        'FR': 'Nombre total',
        'EN': 'Total count',
        'ES': 'Cantidad total',
        'IT': 'Conteggio totale',
        'DE': 'Gesamtzahl',
        'TR': 'Toplam sayı'
      },
      'labs.workingCount': {
        'AR': 'عدد الذي يعمل',
        'FR': 'Nombre fonctionnel',
        'EN': 'Working count',
        'ES': 'Cantidad funcionando',
        'IT': 'Conteggio funzionante',
        'DE': 'Funktionierende Anzahl',
        'TR': 'Çalışan sayısı'
      },
      'labs.notWorkingCount': {
        'AR': 'عدد الذي لا يعمل',
        'FR': 'Nombre non fonctionnel',
        'EN': 'Not working count',
        'ES': 'Cantidad no funcionando',
        'IT': 'Conteggio non funzionante',
        'DE': 'Nicht funktionierende Anzahl',
        'TR': 'Çalışmayan sayısı'
      },
      'labs.saveDeviceToRecord': {
        'AR': 'حفظ جهاز في السجل',
        'FR': 'Enregistrer l\'équipement dans le registre',
        'EN': 'Save device to record',
        'ES': 'Guardar dispositivo en el registro',
        'IT': 'Salva dispositivo nel registro',
        'DE': 'Gerät im Protokoll speichern',
        'TR': 'Cihazı kayda kaydet'
      },
      'labs.noEquipmentData': {
        'AR': 'لا توجد بيانات لأجهزة المعمل بعد',
        'FR': 'Aucune donnée d\'équipement de laboratoire pour le moment',
        'EN': 'No lab equipment data yet',
        'ES': 'Aún no hay datos de equipos del laboratorio',
        'IT': 'Nessun dato attrezzatura laboratorio ancora',
        'DE': 'Noch keine Laborausrüstungsdaten',
        'TR': 'Henüz laboratuvar ekipman verisi yok'
      },
      'labs.programName': {
        'AR': 'اسم البرنامج',
        'FR': 'Nom du programme',
        'EN': 'Program name',
        'ES': 'Nombre del programa',
        'IT': 'Nome programma',
        'DE': 'Programmname',
        'TR': 'Program adı'
      },
      'labs.versionInstalled': {
        'AR': 'الإصدار / المثبّت',
        'FR': 'Version / Installé',
        'EN': 'Version / Installed',
        'ES': 'Versión / Instalado',
        'IT': 'Versione / Installato',
        'DE': 'Version / Installiert',
        'TR': 'Sürüm / Yüklü'
      },
      'labs.saveProgram': {
        'AR': 'حفظ برنامج',
        'FR': 'Enregistrer le programme',
        'EN': 'Save program',
        'ES': 'Guardar programa',
        'IT': 'Salva programma',
        'DE': 'Programm speichern',
        'TR': 'Programı kaydet'
      },
      'labs.program': {
        'AR': 'البرنامج',
        'FR': 'Programme',
        'EN': 'Program',
        'ES': 'Programa',
        'IT': 'Programma',
        'DE': 'Programm',
        'TR': 'Program'
      },
      'labs.installedVersion': {
        'AR': 'المثبت / الإصدار',
        'FR': 'Installé / Version',
        'EN': 'Installed / Version',
        'ES': 'Instalado / Versión',
        'IT': 'Installato / Versione',
        'DE': 'Installiert / Version',
        'TR': 'Yüklü / Sürüm'
      },
      'labs.noSoftwareData': {
        'AR': 'لا توجد بيانات لبرامج حواسيب المعمل بعد',
        'FR': 'Aucune donnée de logiciel de laboratoire pour le moment',
        'EN': 'No lab computer software data yet',
        'ES': 'Aún no hay datos de software del laboratorio',
        'IT': 'Nessun dato software computer laboratorio ancora',
        'DE': 'Noch keine Laborcomputer-Softwaredaten',
        'TR': 'Henüz laboratuvar bilgisayar yazılım verisi yok'
      },
      'labs.furnitureName': {
        'AR': 'اسم الأثاث',
        'FR': 'Nom du mobilier',
        'EN': 'Furniture name',
        'ES': 'Nombre del mobiliario',
        'IT': 'Nome mobilio',
        'DE': 'Möbelname',
        'TR': 'Mobilya adı'
      },
      'labs.modelDescription': {
        'AR': 'الموديل / الوصف',
        'FR': 'Modèle / Description',
        'EN': 'Model / Description',
        'ES': 'Modelo / Descripción',
        'IT': 'Modello / Descrizione',
        'DE': 'Modell / Beschreibung',
        'TR': 'Model / Açıklama'
      },
      'labs.saveFurnitureItem': {
        'AR': 'حفظ قطعة أثاث',
        'FR': 'Enregistrer un meuble',
        'EN': 'Save furniture item',
        'ES': 'Guardar mueble',
        'IT': 'Salva mobile',
        'DE': 'Möbelstück speichern',
        'TR': 'Mobilya öğesini kaydet'
      },
      'labs.noFurnitureData': {
        'AR': 'لا توجد بيانات لأثاث المعمل بعد',
        'FR': 'Aucune donnée de mobilier de laboratoire pour le moment',
        'EN': 'No lab furniture data yet',
        'ES': 'Aún no hay datos de mobiliario del laboratorio',
        'IT': 'Nessun dato mobilio laboratorio ancora',
        'DE': 'Noch keine Labormöbeldaten',
        'TR': 'Henüz laboratuvar mobilya verisi yok'
      },
      'labs.labEquipmentFurnitureInventory': {
        'AR': 'أرقام جرد أجهزة وأثاث المعمل',
        'FR': 'Numéros d\'inventaire des équipements et mobiliers du laboratoire',
        'EN': 'Lab equipment and furniture inventory numbers',
        'ES': 'Números de inventario de equipos y mobiliario del laboratorio',
        'IT': 'Numeri di inventario attrezzature e mobili laboratorio',
        'DE': 'Inventarnummern für Laborausrüstung und -möbel',
        'TR': 'Laboratuvar ekipman ve mobilya envanter numaraları'
      },
      'labs.category': {
        'AR': 'الفئة',
        'FR': 'Catégorie',
        'EN': 'Category',
        'ES': 'Categoría',
        'IT': 'Categoria',
        'DE': 'Kategorie',
        'TR': 'Kategori'
      },
      'labs.deviceDescription': {
        'AR': 'وصف الجهاز',
        'FR': 'Description de l\'équipement',
        'EN': 'Device description',
        'ES': 'Descripción del dispositivo',
        'IT': 'Descrizione dispositivo',
        'DE': 'Gerätebeschreibung',
        'TR': 'Cihaz açıklaması'
      },
      'labs.saveInventoryNumber': {
        'AR': 'حفظ رقم الجرد',
        'FR': 'Enregistrer le numéro d\'inventaire',
        'EN': 'Save inventory number',
        'ES': 'Guardar número de inventario',
        'IT': 'Salva numero di inventario',
        'DE': 'Inventarnummer speichern',
        'TR': 'Envanter numarasını kaydet'
      },
      'labs.device': {
        'AR': 'الجهاز',
        'FR': 'Équipement',
        'EN': 'Device',
        'ES': 'Dispositivo',
        'IT': 'Dispositivo',
        'DE': 'Gerät',
        'TR': 'Cihaz'
      },
      'labs.noInventoryNumbers': {
        'AR': 'لا توجد أرقام جرد مسجلة بعد',
        'FR': 'Aucun numéro d\'inventaire enregistré pour le moment',
        'EN': 'No inventory numbers recorded yet',
        'ES': 'Aún no hay números de inventario registrados',
        'IT': 'Nessun numero di inventario registrato ancora',
        'DE': 'Noch keine Inventarnummern erfasst',
        'TR': 'Henüz kayıtlı envanter numarası yok'
      },
      'labs.deviceNumberRange': {
        'AR': 'رقم الجهاز (1 - 16)',
        'FR': 'Numéro de l\'équipement (1 - 16)',
        'EN': 'Device number (1 - 16)',
        'ES': 'Número del dispositivo (1 - 16)',
        'IT': 'Numero dispositivo (1 - 16)',
        'DE': 'Gerätenummer (1 - 16)',
        'TR': 'Cihaz numarası (1 - 16)'
      },
      'labs.systemUnit': {
        'AR': 'وحدة النظام',
        'FR': 'Unité système',
        'EN': 'System unit',
        'ES': 'Unidad del sistema',
        'IT': 'Unità di sistema',
        'DE': 'Systemeinheit',
        'TR': 'Sistem birimi'
      },
      'labs.monitor': {
        'AR': 'الشاشة',
        'FR': 'Moniteur',
        'EN': 'Monitor',
        'ES': 'Monitor',
        'IT': 'Monitor',
        'DE': 'Monitor',
        'TR': 'Monitör'
      },
      'labs.mouse': {
        'AR': 'الفأرة',
        'FR': 'Souris',
        'EN': 'Mouse',
        'ES': 'Ratón',
        'IT': 'Mouse',
        'DE': 'Maus',
        'TR': 'Fare'
      },
      'labs.keyboard': {
        'AR': 'لوحة المفاتيح',
        'FR': 'Clavier',
        'EN': 'Keyboard',
        'ES': 'Teclado',
        'IT': 'Tastiera',
        'DE': 'Tastatur',
        'TR': 'Klavye'
      },
      'labs.cabling': {
        'AR': 'التمديدات',
        'FR': 'Câblage',
        'EN': 'Cabling',
        'ES': 'Cableado',
        'IT': 'Cablaggio',
        'DE': 'Verkabelung',
        'TR': 'Kablolama'
      },
      'labs.deviceCleanliness': {
        'AR': 'نظافة الجهاز',
        'FR': 'Nettoyage de l\'équipement',
        'EN': 'Device cleanliness',
        'ES': 'Limpieza del dispositivo',
        'IT': 'Pulizia dispositivo',
        'DE': 'Gerätereinheit',
        'TR': 'Cihaz temizliği'
      },
      'labs.operatingSystem': {
        'AR': 'نظام التشغيل',
        'FR': 'Système d\'exploitation',
        'EN': 'Operating system',
        'ES': 'Sistema operativo',
        'IT': 'Sistema operativo',
        'DE': 'Betriebssystem',
        'TR': 'İşletim sistemi'
      },
      'labs.officeSoftware': {
        'AR': 'برامج الأوفيس',
        'FR': 'Logiciels Office',
        'EN': 'Office software',
        'ES': 'Software de oficina',
        'IT': 'Software Office',
        'DE': 'Office-Software',
        'TR': 'Ofis yazılımı'
      },
      'labs.office': {
        'AR': 'الأوفيس',
        'FR': 'Office',
        'EN': 'Office',
        'ES': 'Office',
        'IT': 'Office',
        'DE': 'Office',
        'TR': 'Office'
      },
      'labs.netSupport': {
        'AR': 'نت سبورت',
        'FR': 'Net Support',
        'EN': 'Net Support',
        'ES': 'Net Support',
        'IT': 'Net Support',
        'DE': 'Net Support',
        'TR': 'Net Support'
      },
      'labs.desktopCleaned': {
        'AR': 'تنظيف سطح المكتب',
        'FR': 'Nettoyage du bureau',
        'EN': 'Desktop cleaned',
        'ES': 'Escritorio limpiado',
        'IT': 'Desktop pulito',
        'DE': 'Desktop gereinigt',
        'TR': 'Masaüstü temizlendi'
      },
      'labs.antivirus': {
        'AR': 'مضاد الفيروسات',
        'FR': 'Antivirus',
        'EN': 'Antivirus',
        'ES': 'Antivirus',
        'IT': 'Antivirus',
        'DE': 'Antivirus',
        'TR': 'Antivirus'
      },
      'labs.checkDate': {
        'AR': 'تاريخ الفحص',
        'FR': 'Date de vérification',
        'EN': 'Check date',
        'ES': 'Fecha de verificación',
        'IT': 'Data verifica',
        'DE': 'Prüfdatum',
        'TR': 'Kontrol tarihi'
      },
      'labs.saveDeviceCheck': {
        'AR': 'حفظ فحص الجهاز',
        'FR': 'Enregistrer la vérification de l\'équipement',
        'EN': 'Save device check',
        'ES': 'Guardar verificación del dispositivo',
        'IT': 'Salva verifica dispositivo',
        'DE': 'Geräteprüfung speichern',
        'TR': 'Cihaz kontrolünü kaydet'
      },
      'labs.deviceNumber': {
        'AR': 'رقم الجهاز',
        'FR': 'Numéro de l\'équipement',
        'EN': 'Device number',
        'ES': 'Número del dispositivo',
        'IT': 'Numero dispositivo',
        'DE': 'Gerätenummer',
        'TR': 'Cihaz numarası'
      },
      'labs.noCheckRecords': {
        'AR': 'لا توجد سجلات فحص بعد',
        'FR': 'Aucun enregistrement de vérification pour le moment',
        'EN': 'No check records yet',
        'ES': 'Aún no hay registros de verificación',
        'IT': 'Nessun registro di verifica ancora',
        'DE': 'Noch keine Prüfprotokolle',
        'TR': 'Henüz kontrol kaydı yok'
      },
      'labs.cleaningStatuses': {
        'AR': 'حالات النظافة',
        'FR': 'États de nettoyage',
        'EN': 'Cleaning statuses',
        'ES': 'Estados de limpieza',
        'IT': 'Stati di pulizia',
        'DE': 'Reinigungsstatus',
        'TR': 'Temizlik durumları'
      },
      'labs.good': {
        'AR': 'جيدة',
        'FR': 'Bonne',
        'EN': 'Good',
        'ES': 'Buena',
        'IT': 'Buona',
        'DE': 'Gut',
        'TR': 'İyi'
      },
      'labs.bad': {
        'AR': 'سيئة',
        'FR': 'Mauvaise',
        'EN': 'Bad',
        'ES': 'Mala',
        'IT': 'Cattiva',
        'DE': 'Schlecht',
        'TR': 'Kötü'
      },
      'labs.desktopCleanliness': {
        'AR': 'نظافة سطح المكتب',
        'FR': 'Nettoyage du bureau',
        'EN': 'Desktop cleanliness',
        'ES': 'Limpieza del escritorio',
        'IT': 'Pulizia desktop',
        'DE': 'Desktop-Reinheit',
        'TR': 'Masaüstü temizliği'
      },
      'labs.roomCleanliness': {
        'AR': 'نظافة القاعة',
        'FR': 'Nettoyage de la salle',
        'EN': 'Room cleanliness',
        'ES': 'Limpieza de la sala',
        'IT': 'Pulizia sala',
        'DE': 'Raumreinheit',
        'TR': 'Oda temizliği'
      },
      'labs.complete': {
        'AR': 'كاملة',
        'FR': 'Complète',
        'EN': 'Complete',
        'ES': 'Completa',
        'IT': 'Completa',
        'DE': 'Vollständig',
        'TR': 'Tamamlandı'
      },
      'labs.incomplete': {
        'AR': 'غير كاملة',
        'FR': 'Incomplète',
        'EN': 'Incomplete',
        'ES': 'Incompleta',
        'IT': 'Incompleta',
        'DE': 'Unvollständig',
        'TR': 'Tamamlanmadı'
      },
      'labs.generalNotes': {
        'AR': 'ملاحظات عامة',
        'FR': 'Notes générales',
        'EN': 'General notes',
        'ES': 'Notas generales',
        'IT': 'Note generali',
        'DE': 'Allgemeine Notizen',
        'TR': 'Genel notlar'
      },
      'labs.saveCleaningStatus': {
        'AR': 'حفظ حالة النظافة',
        'FR': 'Enregistrer l\'état de nettoyage',
        'EN': 'Save cleaning status',
        'ES': 'Guardar estado de limpieza',
        'IT': 'Salva stato pulizia',
        'DE': 'Reinigungsstatus speichern',
        'TR': 'Temizlik durumunu kaydet'
      },
      'labs.noCleaningRecords': {
        'AR': 'لا توجد سجلات لنظافة المعمل بعد',
        'FR': 'Aucun enregistrement de nettoyage de laboratoire pour le moment',
        'EN': 'No lab cleaning records yet',
        'ES': 'Aún no hay registros de limpieza del laboratorio',
        'IT': 'Nessun registro pulizia laboratorio ancora',
        'DE': 'Noch keine Laborreinigungsprotokolle',
        'TR': 'Henüz laboratuvar temizlik kaydı yok'
      },
      'labs.editLab': {
        'AR': 'تعديل المخبر',
        'FR': 'Modifier le laboratoire',
        'EN': 'Edit lab',
        'ES': 'Editar laboratorio',
        'IT': 'Modifica laboratorio',
        'DE': 'Labor bearbeiten',
        'TR': 'Laboratuvarı düzenle'
      },
      'labs.addNewLab': {
        'AR': 'إضافة مخبر جديد',
        'FR': 'Ajouter un nouveau laboratoire',
        'EN': 'Add new lab',
        'ES': 'Agregar nuevo laboratorio',
        'IT': 'Aggiungi nuovo laboratorio',
        'DE': 'Neues Labor hinzufügen',
        'TR': 'Yeni laboratuvar ekle'
      },
      'labs.enterLabName': {
        'AR': 'أدخل اسم المخبر',
        'FR': 'Entrez le nom du laboratoire',
        'EN': 'Enter lab name',
        'ES': 'Ingrese el nombre del laboratorio',
        'IT': 'Inserisci nome laboratorio',
        'DE': 'Laborname eingeben',
        'TR': 'Laboratuvar adını girin'
      },
      'labs.enterLabDescription': {
        'AR': 'أدخل وصف المخبر',
        'FR': 'Entrez la description du laboratoire',
        'EN': 'Enter lab description',
        'ES': 'Ingrese la descripción del laboratorio',
        'IT': 'Inserisci descrizione laboratorio',
        'DE': 'Laborbeschreibung eingeben',
        'TR': 'Laboratuvar açıklamasını girin'
      },
      'labs.enterLabLocation': {
        'AR': 'أدخل موقع المخبر',
        'FR': 'Entrez l\'emplacement du laboratoire',
        'EN': 'Enter lab location',
        'ES': 'Ingrese la ubicación del laboratorio',
        'IT': 'Inserisci posizione laboratorio',
        'DE': 'Laborstandort eingeben',
        'TR': 'Laboratuvar konumunu girin'
      },
      'labs.labAvailable': {
        'AR': 'المخبر متاح',
        'FR': 'Le laboratoire est disponible',
        'EN': 'Lab available',
        'ES': 'Laboratorio disponible',
        'IT': 'Laboratorio disponibile',
        'DE': 'Labor verfügbar',
        'TR': 'Laboratuvar müsait'
      },
      'labs.update': {
        'AR': 'تحديث',
        'FR': 'Mettre à jour',
        'EN': 'Update',
        'ES': 'Actualizar',
        'IT': 'Aggiorna',
        'DE': 'Aktualisieren',
        'TR': 'Güncelle'
      },
      'labs.add': {
        'AR': 'إضافة',
        'FR': 'Ajouter',
        'EN': 'Add',
        'ES': 'Agregar',
        'IT': 'Aggiungi',
        'DE': 'Hinzufügen',
        'TR': 'Ekle'
      },
      'labs.cancel': {
        'AR': 'إلغاء',
        'FR': 'Annuler',
        'EN': 'Cancel',
        'ES': 'Cancelar',
        'IT': 'Annulla',
        'DE': 'Abbrechen',
        'TR': 'İptal'
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
      'timetable.exportPDF': {
        'AR': 'تصدير PDF',
        'FR': 'Exporter en PDF',
        'EN': 'Export PDF',
        'ES': 'Exportar PDF',
        'IT': 'Esporta PDF',
        'DE': 'PDF exportieren',
        'TR': 'PDF Dışa Aktar'
      },
      'timetable.editLesson': {
        'AR': 'تعديل حصة',
        'FR': 'Modifier la leçon',
        'EN': 'Edit lesson',
        'ES': 'Editar lección',
        'IT': 'Modifica lezione',
        'DE': 'Stunde bearbeiten',
        'TR': 'Dersi düzenle'
      },
      'timetable.addNewLesson': {
        'AR': 'إضافة حصة جديدة',
        'FR': 'Ajouter une nouvelle leçon',
        'EN': 'Add new lesson',
        'ES': 'Agregar nueva lección',
        'IT': 'Aggiungi nuova lezione',
        'DE': 'Neue Stunde hinzufügen',
        'TR': 'Yeni ders ekle'
      },
      'timetable.dayOfWeek': {
        'AR': 'يوم الأسبوع',
        'FR': 'Jour de la semaine',
        'EN': 'Day of week',
        'ES': 'Día de la semana',
        'IT': 'Giorno della settimana',
        'DE': 'Wochentag',
        'TR': 'Haftanın günü'
      },
      'timetable.startTime': {
        'AR': 'وقت البداية',
        'FR': 'Heure de début',
        'EN': 'Start time',
        'ES': 'Hora de inicio',
        'IT': 'Ora di inizio',
        'DE': 'Startzeit',
        'TR': 'Başlangıç saati'
      },
      'timetable.endTime': {
        'AR': 'وقت النهاية',
        'FR': 'Heure de fin',
        'EN': 'End time',
        'ES': 'Hora de finalización',
        'IT': 'Ora di fine',
        'DE': 'Endzeit',
        'TR': 'Bitiş saati'
      },
      'timetable.lab': {
        'AR': 'المخبر',
        'FR': 'Laboratoire',
        'EN': 'Lab',
        'ES': 'Laboratorio',
        'IT': 'Laboratorio',
        'DE': 'Labor',
        'TR': 'Laboratuvar'
      },
      'timetable.notes': {
        'AR': 'ملاحظات',
        'FR': 'Notes',
        'EN': 'Notes',
        'ES': 'Notas',
        'IT': 'Note',
        'DE': 'Notizen',
        'TR': 'Notlar'
      },
      'timetable.selectClass': {
        'AR': 'اختر القسم',
        'FR': 'Sélectionner la classe',
        'EN': 'Select class',
        'ES': 'Seleccionar clase',
        'IT': 'Seleziona classe',
        'DE': 'Klasse auswählen',
        'TR': 'Sınıf seç'
      },
      'timetable.none': {
        'AR': 'لا يوجد',
        'FR': 'Aucun',
        'EN': 'None',
        'ES': 'Ninguno',
        'IT': 'Nessuno',
        'DE': 'Keine',
        'TR': 'Yok'
      },
      'timetable.enterSubject': {
        'AR': 'أدخل اسم المادة',
        'FR': 'Entrez le nom de la matière',
        'EN': 'Enter subject name',
        'ES': 'Ingrese el nombre de la asignatura',
        'IT': 'Inserisci nome materia',
        'DE': 'Fachname eingeben',
        'TR': 'Ders adını girin'
      },
      'timetable.enterRoom': {
        'AR': 'أدخل رقم القاعة',
        'FR': 'Entrez le numéro de la salle',
        'EN': 'Enter room number',
        'ES': 'Ingrese el número de aula',
        'IT': 'Inserisci numero aula',
        'DE': 'Raumnummer eingeben',
        'TR': 'Sınıf numarasını girin'
      },
      'timetable.enterNotes': {
        'AR': 'أدخل ملاحظات',
        'FR': 'Entrez des notes',
        'EN': 'Enter notes',
        'ES': 'Ingrese notas',
        'IT': 'Inserisci note',
        'DE': 'Notizen eingeben',
        'TR': 'Notları girin'
      },
      'timetable.update': {
        'AR': 'تحديث',
        'FR': 'Mettre à jour',
        'EN': 'Update',
        'ES': 'Actualizar',
        'IT': 'Aggiorna',
        'DE': 'Aktualisieren',
        'TR': 'Güncelle'
      },
      'timetable.add': {
        'AR': 'إضافة',
        'FR': 'Ajouter',
        'EN': 'Add',
        'ES': 'Agregar',
        'IT': 'Aggiungi',
        'DE': 'Hinzufügen',
        'TR': 'Ekle'
      },
      'timetable.cancel': {
        'AR': 'إلغاء',
        'FR': 'Annuler',
        'EN': 'Cancel',
        'ES': 'Cancelar',
        'IT': 'Annulla',
        'DE': 'Abbrechen',
        'TR': 'İptal'
      },
      'timetable.previousWeek': {
        'AR': 'الأسبوع السابق',
        'FR': 'Semaine précédente',
        'EN': 'Previous week',
        'ES': 'Semana anterior',
        'IT': 'Settimana precedente',
        'DE': 'Vorherige Woche',
        'TR': 'Önceki hafta'
      },
      'timetable.nextWeek': {
        'AR': 'الأسبوع التالي',
        'FR': 'Semaine suivante',
        'EN': 'Next week',
        'ES': 'Semana siguiente',
        'IT': 'Settimana successiva',
        'DE': 'Nächste Woche',
        'TR': 'Sonraki hafta'
      },
      'timetable.today': {
        'AR': 'اليوم',
        'FR': "Aujourd'hui",
        'EN': 'Today',
        'ES': 'Hoy',
        'IT': 'Oggi',
        'DE': 'Heute',
        'TR': 'Bugün'
      },
      'timetable.week': {
        'AR': 'الأسبوع',
        'FR': 'Semaine',
        'EN': 'Week',
        'ES': 'Semana',
        'IT': 'Settimana',
        'DE': 'Woche',
        'TR': 'Hafta'
      },
      'timetable.previousDay': {
        'AR': 'اليوم السابق',
        'FR': 'Jour précédent',
        'EN': 'Previous day',
        'ES': 'Día anterior',
        'IT': 'Giorno precedente',
        'DE': 'Vorheriger Tag',
        'TR': 'Önceki gün'
      },
      'timetable.nextDay': {
        'AR': 'اليوم التالي',
        'FR': 'Jour suivant',
        'EN': 'Next day',
        'ES': 'Día siguiente',
        'IT': 'Giorno successivo',
        'DE': 'Nächster Tag',
        'TR': 'Sonraki gün'
      },
      'timetable.previousMonth': {
        'AR': 'الشهر السابق',
        'FR': 'Mois précédent',
        'EN': 'Previous month',
        'ES': 'Mes anterior',
        'IT': 'Mese precedente',
        'DE': 'Vorheriger Monat',
        'TR': 'Önceki ay'
      },
      'timetable.nextMonth': {
        'AR': 'الشهر التالي',
        'FR': 'Mois suivant',
        'EN': 'Next month',
        'ES': 'Mes siguiente',
        'IT': 'Mese successivo',
        'DE': 'Nächster Monat',
        'TR': 'Sonraki ay'
      },
      'timetable.noLessonsToday': {
        'AR': 'لا توجد حصص في هذا اليوم',
        'FR': 'Aucune leçon ce jour',
        'EN': 'No lessons today',
        'ES': 'No hay lecciones hoy',
        'IT': 'Nessuna lezione oggi',
        'DE': 'Keine Stunden heute',
        'TR': 'Bugün ders yok'
      },
      'timetable.conflictAlerts': {
        'AR': 'تنبيهات التعارض',
        'FR': 'Alertes de conflit',
        'EN': 'Conflict alerts',
        'ES': 'Alertas de conflicto',
        'IT': 'Avvisi di conflitto',
        'DE': 'Konfliktwarnungen',
        'TR': 'Çakışma uyarıları'
      },
      'timetable.sameClassConflict': {
        'AR': 'نفس القسم',
        'FR': 'Même classe',
        'EN': 'Same class',
        'ES': 'Misma clase',
        'IT': 'Stessa classe',
        'DE': 'Gleiche Klasse',
        'TR': 'Aynı sınıf'
      },
      'timetable.sameLabConflict': {
        'AR': 'نفس المخبر',
        'FR': 'Même laboratoire',
        'EN': 'Same lab',
        'ES': 'Mismo laboratorio',
        'IT': 'Stesso laboratorio',
        'DE': 'Gleiches Labor',
        'TR': 'Aynı laboratuvar'
      },
      'timetable.sameRoomConflict': {
        'AR': 'نفس القاعة',
        'FR': 'Même salle',
        'EN': 'Same room',
        'ES': 'Misma aula',
        'IT': 'Stessa aula',
        'DE': 'Gleicher Raum',
        'TR': 'Aynı sınıf'
      },
      'timetable.timeOverlap': {
        'AR': 'تداخل في الوقت',
        'FR': 'Chevauchement horaire',
        'EN': 'Time overlap',
        'ES': 'Superposición de tiempo',
        'IT': 'Sovrapposizione oraria',
        'DE': 'Zeitüberschneidung',
        'TR': 'Zaman çakışması'
      },
      'timetable.atSameTime': {
        'AR': 'في نفس الوقت',
        'FR': 'Au même moment',
        'EN': 'At the same time',
        'ES': 'Al mismo tiempo',
        'IT': 'Allo stesso tempo',
        'DE': 'Zur gleichen Zeit',
        'TR': 'Aynı zamanda'
      },
      'timetable.and': {
        'AR': 'و',
        'FR': 'et',
        'EN': 'and',
        'ES': 'y',
        'IT': 'e',
        'DE': 'und',
        'TR': 've'
      },
      'timetable.sunday': {
        'AR': 'الأحد',
        'FR': 'Dimanche',
        'EN': 'Sunday',
        'ES': 'Domingo',
        'IT': 'Domenica',
        'DE': 'Sonntag',
        'TR': 'Pazar'
      },
      'timetable.sundayShort': {
        'AR': 'أحد',
        'FR': 'Dim',
        'EN': 'Sun',
        'ES': 'Dom',
        'IT': 'Dom',
        'DE': 'So',
        'TR': 'Paz'
      },
      'timetable.monday': {
        'AR': 'الإثنين',
        'FR': 'Lundi',
        'EN': 'Monday',
        'ES': 'Lunes',
        'IT': 'Lunedì',
        'DE': 'Montag',
        'TR': 'Pazartesi'
      },
      'timetable.mondayShort': {
        'AR': 'إثنين',
        'FR': 'Lun',
        'EN': 'Mon',
        'ES': 'Lun',
        'IT': 'Lun',
        'DE': 'Mo',
        'TR': 'Pzt'
      },
      'timetable.tuesday': {
        'AR': 'الثلاثاء',
        'FR': 'Mardi',
        'EN': 'Tuesday',
        'ES': 'Martes',
        'IT': 'Martedì',
        'DE': 'Dienstag',
        'TR': 'Salı'
      },
      'timetable.tuesdayShort': {
        'AR': 'ثلاثاء',
        'FR': 'Mar',
        'EN': 'Tue',
        'ES': 'Mar',
        'IT': 'Mar',
        'DE': 'Di',
        'TR': 'Sal'
      },
      'timetable.wednesday': {
        'AR': 'الأربعاء',
        'FR': 'Mercredi',
        'EN': 'Wednesday',
        'ES': 'Miércoles',
        'IT': 'Mercoledì',
        'DE': 'Mittwoch',
        'TR': 'Çarşamba'
      },
      'timetable.wednesdayShort': {
        'AR': 'أربعاء',
        'FR': 'Mer',
        'EN': 'Wed',
        'ES': 'Mié',
        'IT': 'Mer',
        'DE': 'Mi',
        'TR': 'Çar'
      },
      'timetable.thursday': {
        'AR': 'الخميس',
        'FR': 'Jeudi',
        'EN': 'Thursday',
        'ES': 'Jueves',
        'IT': 'Giovedì',
        'DE': 'Donnerstag',
        'TR': 'Perşembe'
      },
      'timetable.thursdayShort': {
        'AR': 'خميس',
        'FR': 'Jeu',
        'EN': 'Thu',
        'ES': 'Jue',
        'IT': 'Gio',
        'DE': 'Do',
        'TR': 'Per'
      },
      'timetable.friday': {
        'AR': 'الجمعة',
        'FR': 'Vendredi',
        'EN': 'Friday',
        'ES': 'Viernes',
        'IT': 'Venerdì',
        'DE': 'Freitag',
        'TR': 'Cuma'
      },
      'timetable.fridayShort': {
        'AR': 'جمعة',
        'FR': 'Ven',
        'EN': 'Fri',
        'ES': 'Vie',
        'IT': 'Ven',
        'DE': 'Fr',
        'TR': 'Cum'
      },
      'timetable.saturday': {
        'AR': 'السبت',
        'FR': 'Samedi',
        'EN': 'Saturday',
        'ES': 'Sábado',
        'IT': 'Sabato',
        'DE': 'Samstag',
        'TR': 'Cumartesi'
      },
      'timetable.saturdayShort': {
        'AR': 'سبت',
        'FR': 'Sam',
        'EN': 'Sat',
        'ES': 'Sáb',
        'IT': 'Sab',
        'DE': 'Sa',
        'TR': 'Cmt'
      },
      'timetable.selectClassError': {
        'AR': 'يرجى اختيار القسم',
        'FR': 'Veuillez sélectionner une classe',
        'EN': 'Please select a class',
        'ES': 'Por favor seleccione una clase',
        'IT': 'Si prega di selezionare una classe',
        'DE': 'Bitte wählen Sie eine Klasse aus',
        'TR': 'Lütfen bir sınıf seçin'
      },
      'timetable.enterTimesError': {
        'AR': 'يرجى إدخال وقت البداية ووقت النهاية',
        'FR': 'Veuillez entrer l\'heure de début et l\'heure de fin',
        'EN': 'Please enter start time and end time',
        'ES': 'Por favor ingrese la hora de inicio y la hora de finalización',
        'IT': 'Si prega di inserire l\'ora di inizio e l\'ora di fine',
        'DE': 'Bitte geben Sie Start- und Endzeit ein',
        'TR': 'Lütfen başlangıç ve bitiş saatini girin'
      },
      'timetable.timeFormatError': {
        'AR': 'خطأ في تنسيق الوقت. يرجى التأكد من إدخال الوقت بشكل صحيح',
        'FR': 'Erreur de format d\'heure. Veuillez vous assurer d\'entrer l\'heure correctement',
        'EN': 'Time format error. Please make sure to enter the time correctly',
        'ES': 'Error de formato de hora. Por favor asegúrese de ingresar la hora correctamente',
        'IT': 'Errore di formato ora. Assicurati di inserire l\'ora correttamente',
        'DE': 'Zeitformatfehler. Bitte stellen Sie sicher, dass Sie die Zeit korrekt eingeben',
        'TR': 'Zaman formatı hatası. Lütfen saati doğru girdiğinizden emin olun'
      },
      'timetable.startBeforeEndError': {
        'AR': 'وقت البداية يجب أن يكون قبل وقت النهاية',
        'FR': 'L\'heure de début doit être avant l\'heure de fin',
        'EN': 'Start time must be before end time',
        'ES': 'La hora de inicio debe ser antes de la hora de finalización',
        'IT': 'L\'ora di inizio deve essere prima dell\'ora di fine',
        'DE': 'Die Startzeit muss vor der Endzeit liegen',
        'TR': 'Başlangıç saati bitiş saatinden önce olmalıdır'
      },
      'timetable.deleteConfirm': {
        'AR': 'هل أنت متأكد من حذف هذا العنصر من جدول الأوقات؟',
        'FR': 'Êtes-vous sûr de vouloir supprimer cet élément du planning ?',
        'EN': 'Are you sure you want to delete this item from the timetable?',
        'ES': '¿Está seguro de que desea eliminar este elemento del horario?',
        'IT': 'Sei sicuro di voler eliminare questo elemento dall\'orario?',
        'DE': 'Sind Sie sicher, dass Sie dieses Element aus dem Stundenplan löschen möchten?',
        'TR': 'Bu öğeyi ders programından silmek istediğinizden emin misiniz?'
      },
      'timetable.deleteError': {
        'AR': 'حدث خطأ أثناء حذف العنصر',
        'FR': 'Une erreur s\'est produite lors de la suppression de l\'élément',
        'EN': 'An error occurred while deleting the item',
        'ES': 'Ocurrió un error al eliminar el elemento',
        'IT': 'Si è verificato un errore durante l\'eliminazione dell\'elemento',
        'DE': 'Beim Löschen des Elements ist ein Fehler aufgetreten',
        'TR': 'Öğe silinirken bir hata oluştu'
      },
      'timetable.updateError': {
        'AR': 'حدث خطأ أثناء تحديث جدول الأوقات',
        'FR': 'Une erreur s\'est produite lors de la mise à jour du planning',
        'EN': 'An error occurred while updating the timetable',
        'ES': 'Ocurrió un error al actualizar el horario',
        'IT': 'Si è verificato un errore durante l\'aggiornamento dell\'orario',
        'DE': 'Beim Aktualisieren des Stundenplans ist ein Fehler aufgetreten',
        'TR': 'Ders programı güncellenirken bir hata oluştu'
      },
      'timetable.createError': {
        'AR': 'حدث خطأ أثناء إضافة جدول الأوقات',
        'FR': 'Une erreur s\'est produite lors de l\'ajout au planning',
        'EN': 'An error occurred while adding to the timetable',
        'ES': 'Ocurrió un error al agregar al horario',
        'IT': 'Si è verificato un errore durante l\'aggiunta all\'orario',
        'DE': 'Beim Hinzufügen zum Stundenplan ist ein Fehler aufgetreten',
        'TR': 'Ders programına eklenirken bir hata oluştu'
      },
      'timetable.tableNotFoundError': {
        'AR': 'لا يمكن العثور على الجدول. يرجى التأكد من أنك في عرض الأسبوع.',
        'FR': 'Impossible de trouver le tableau. Veuillez vous assurer que vous êtes en vue hebdomadaire.',
        'EN': 'Cannot find the table. Please make sure you are in weekly view.',
        'ES': 'No se puede encontrar la tabla. Por favor asegúrese de estar en la vista semanal.',
        'IT': 'Impossibile trovare la tabella. Assicurati di essere in vista settimanale.',
        'DE': 'Die Tabelle kann nicht gefunden werden. Bitte stellen Sie sicher, dass Sie sich in der Wochenansicht befinden.',
        'TR': 'Tablo bulunamadı. Lütfen haftalık görünümde olduğunuzdan emin olun.'
      },
      'timetable.pdfExportError': {
        'AR': 'حدث خطأ أثناء تصدير PDF. يرجى التأكد من تثبيت المكتبات المطلوبة.',
        'FR': 'Une erreur s\'est produite lors de l\'exportation PDF. Veuillez vous assurer que les bibliothèques requises sont installées.',
        'EN': 'An error occurred while exporting PDF. Please make sure the required libraries are installed.',
        'ES': 'Ocurrió un error al exportar PDF. Por favor asegúrese de que las bibliotecas requeridas estén instaladas.',
        'IT': 'Si è verificato un errore durante l\'esportazione PDF. Assicurati che le librerie richieste siano installate.',
        'DE': 'Beim Exportieren des PDFs ist ein Fehler aufgetreten. Bitte stellen Sie sicher, dass die erforderlichen Bibliotheken installiert sind.',
        'TR': 'PDF dışa aktarılırken bir hata oluştu. Lütfen gerekli kütüphanelerin yüklü olduğundan emin olun.'
      },
      'timetable.classLabel': {
        'AR': 'قسم',
        'FR': 'Classe',
        'EN': 'Class',
        'ES': 'Clase',
        'IT': 'Classe',
        'DE': 'Klasse',
        'TR': 'Sınıf'
      },
      'timetable.labLabel': {
        'AR': 'مخبر',
        'FR': 'Laboratoire',
        'EN': 'Lab',
        'ES': 'Laboratorio',
        'IT': 'Laboratorio',
        'DE': 'Labor',
        'TR': 'Laboratuvar'
      },
      'timetable.roomLabel': {
        'AR': 'قاعة',
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
      'topics.search': {
        'AR': 'البحث',
        'FR': 'Recherche',
        'EN': 'Search',
        'ES': 'Búsqueda',
        'IT': 'Ricerca',
        'DE': 'Suche',
        'TR': 'Arama'
      },
      'topics.searchPlaceholder': {
        'AR': 'ابحث بالعنوان، العنوان الفرعي أو الوصف...',
        'FR': 'Rechercher par titre, sous-titre ou description...',
        'EN': 'Search by title, subtitle or description...',
        'ES': 'Buscar por título, subtítulo o descripción...',
        'IT': 'Cerca per titolo, sottotitolo o descrizione...',
        'DE': 'Suche nach Titel, Untertitel oder Beschreibung...',
        'TR': 'Başlık, alt başlık veya açıklamaya göre ara...'
      },
      'topics.filterByLevel': {
        'AR': 'تصفية حسب المستوى',
        'FR': 'Filtrer par niveau',
        'EN': 'Filter by level',
        'ES': 'Filtrar por nivel',
        'IT': 'Filtra per livello',
        'DE': 'Nach Niveau filtern',
        'TR': 'Düzeye göre filtrele'
      },
      'topics.allLevels': {
        'AR': 'كل المستويات',
        'FR': 'Tous les niveaux',
        'EN': 'All levels',
        'ES': 'Todos los niveles',
        'IT': 'Tutti i livelli',
        'DE': 'Alle Niveaus',
        'TR': 'Tüm seviyeler'
      },
      'topics.filterByTrack': {
        'AR': 'تصفية حسب الشعبة / الجذع',
        'FR': 'Filtrer par filière / tronc commun',
        'EN': 'Filter by track / stream',
        'ES': 'Filtrar por rama / tronco común',
        'IT': 'Filtra per indirizzo / tronco comune',
        'DE': 'Nach Zweig / Stamm filtern',
        'TR': 'Alan / ortak temel göre filtrele'
      },
      'topics.allTracks': {
        'AR': 'كل الشعب',
        'FR': 'Toutes les filières',
        'EN': 'All tracks',
        'ES': 'Todas las ramas',
        'IT': 'Tutti gli indirizzi',
        'DE': 'Alle Zweige',
        'TR': 'Tüm alanlar'
      },
      'topics.listTitle': {
        'AR': 'قائمة المواضيع ({{count}})',
        'FR': 'Liste des sujets ({{count}})',
        'EN': 'Topics list ({{count}})',
        'ES': 'Lista de temas ({{count}})',
        'IT': 'Elenco argomenti ({{count}})',
        'DE': 'Themenliste ({{count}})',
        'TR': 'Konu listesi ({{count}})'
      },
      'topics.itemsCount': {
        'AR': '{{count}} عنصر',
        'FR': '{{count}} élément(s)',
        'EN': '{{count}} item(s)',
        'ES': '{{count}} elemento(s)',
        'IT': '{{count}} elemento/i',
        'DE': '{{count}} Element(e)',
        'TR': '{{count}} öğe'
      },
      'topics.addElement': {
        'AR': 'إضافة عنصر',
        'FR': 'Ajouter un élément',
        'EN': 'Add element',
        'ES': 'Agregar elemento',
        'IT': 'Aggiungi elemento',
        'DE': 'Element hinzufügen',
        'TR': 'Öğe ekle'
      },
      'topics.noTopics': {
        'AR': 'لا توجد مواضيع',
        'FR': 'Aucun sujet',
        'EN': 'No topics',
        'ES': 'No hay temas',
        'IT': 'Nessun argomento',
        'DE': 'Keine Themen',
        'TR': 'Konu yok'
      },
      'topics.subtitle': {
        'AR': 'العنوان الفرعي',
        'FR': 'Sous-titre',
        'EN': 'Subtitle',
        'ES': 'Subtítulo',
        'IT': 'Sottotitolo',
        'DE': 'Untertitel',
        'TR': 'Alt başlık'
      },
      'topics.subtitlePlaceholder': {
        'AR': 'أدخل العنوان الفرعي',
        'FR': 'Entrez le sous-titre',
        'EN': 'Enter subtitle',
        'ES': 'Ingrese el subtítulo',
        'IT': 'Inserisci sottotitolo',
        'DE': 'Untertitel eingeben',
        'TR': 'Alt başlığı girin'
      },
      'topics.level': {
        'AR': 'المستوى',
        'FR': 'Niveau',
        'EN': 'Level',
        'ES': 'Nivel',
        'IT': 'Livello',
        'DE': 'Niveau',
        'TR': 'Seviye'
      },
      'topics.selectLevel': {
        'AR': 'اختر المستوى',
        'FR': 'Choisissez le niveau',
        'EN': 'Select level',
        'ES': 'Seleccione el nivel',
        'IT': 'Seleziona livello',
        'DE': 'Niveau auswählen',
        'TR': 'Seviye seçin'
      },
      'topics.track': {
        'AR': 'الشعبة / الجذع',
        'FR': 'Filière / tronc commun',
        'EN': 'Track / stream',
        'ES': 'Rama / tronco común',
        'IT': 'Indirizzo / tronco comune',
        'DE': 'Zweig / Stamm',
        'TR': 'Alan / ortak temel'
      },
      'topics.selectTrack': {
        'AR': 'اختر الشعبة',
        'FR': 'Choisissez la filière',
        'EN': 'Select track',
        'ES': 'Seleccione la rama',
        'IT': 'Seleziona indirizzo',
        'DE': 'Zweig auswählen',
        'TR': 'Alan seçin'
      },
      'topics.addButton': {
        'AR': 'إضافة',
        'FR': 'Ajouter',
        'EN': 'Add',
        'ES': 'Agregar',
        'IT': 'Aggiungi',
        'DE': 'Hinzufügen',
        'TR': 'Ekle'
      },
      'topics.updateButton': {
        'AR': 'تحديث',
        'FR': 'Mettre à jour',
        'EN': 'Update',
        'ES': 'Actualizar',
        'IT': 'Aggiorna',
        'DE': 'Aktualisieren',
        'TR': 'Güncelle'
      },
      'topics.cancel': {
        'AR': 'إلغاء',
        'FR': 'Annuler',
        'EN': 'Cancel',
        'ES': 'Cancelar',
        'IT': 'Annulla',
        'DE': 'Abbrechen',
        'TR': 'İptal'
      },
      'topics.edit': {
        'AR': 'تعديل',
        'FR': 'Modifier',
        'EN': 'Edit',
        'ES': 'Editar',
        'IT': 'Modifica',
        'DE': 'Bearbeiten',
        'TR': 'Düzenle'
      },
      'topics.delete': {
        'AR': 'حذف',
        'FR': 'Supprimer',
        'EN': 'Delete',
        'ES': 'Eliminar',
        'IT': 'Elimina',
        'DE': 'Löschen',
        'TR': 'Sil'
      },
      'topics.addElementTitle': {
        'AR': 'إضافة عنصر جديد',
        'FR': 'Ajouter un nouvel élément',
        'EN': 'Add new element',
        'ES': 'Agregar nuevo elemento',
        'IT': 'Aggiungi nuovo elemento',
        'DE': 'Neues Element hinzufügen',
        'TR': 'Yeni öğe ekle'
      },
      'topics.editElementTitle': {
        'AR': 'تعديل العنصر',
        'FR': 'Modifier l’élément',
        'EN': 'Edit element',
        'ES': 'Editar elemento',
        'IT': 'Modifica elemento',
        'DE': 'Element bearbeiten',
        'TR': 'Öğeyi düzenle'
      },
      'topics.elementContent': {
        'AR': 'محتوى العنصر *',
        'FR': 'Contenu de l’élément *',
        'EN': 'Element content *',
        'ES': 'Contenido del elemento *',
        'IT': 'Contenuto elemento *',
        'DE': 'Elementinhalt *',
        'TR': 'Öğe içeriği *'
      },
      'topics.elementContentPlaceholder': {
        'AR': 'أدخل محتوى العنصر...',
        'FR': 'Entrez le contenu de l’élément...',
        'EN': 'Enter element content...',
        'ES': 'Ingrese el contenido del elemento...',
        'IT': 'Inserisci il contenuto dell’elemento...',
        'DE': 'Elementinhalt eingeben...',
        'TR': 'Öğe içeriğini girin...'
      },
      'topics.noElements': {
        'AR': 'لا توجد عناصر',
        'FR': 'Aucun élément',
        'EN': 'No elements',
        'ES': 'No hay elementos',
        'IT': 'Nessun elemento',
        'DE': 'Keine Elemente',
        'TR': 'Öğe yok'
      },
      'topics.enterTitleError': {
        'AR': 'يرجى إدخال عنوان الموضوع',
        'FR': 'Veuillez saisir le titre du sujet',
        'EN': 'Please enter the topic title',
        'ES': 'Por favor ingrese el título del tema',
        'IT': 'Inserisci il titolo dell’argomento',
        'DE': 'Bitte geben Sie den Thementitel ein',
        'TR': 'Lütfen konu başlığını girin'
      },
      'topics.updateError': {
        'AR': 'حدث خطأ أثناء تحديث الموضوع',
        'FR': 'Une erreur s’est produite lors de la mise à jour du sujet',
        'EN': 'An error occurred while updating the topic',
        'ES': 'Se produjo un error al actualizar el tema',
        'IT': 'Si è verificato un errore durante l’aggiornamento dell’argomento',
        'DE': 'Beim Aktualisieren des Themas ist ein Fehler aufgetreten',
        'TR': 'Konu güncellenirken bir hata oluştu'
      },
      'topics.createError': {
        'AR': 'حدث خطأ أثناء إضافة الموضوع',
        'FR': 'Une erreur s’est produite lors de l’ajout du sujet',
        'EN': 'An error occurred while adding the topic',
        'ES': 'Se produjo un error al agregar el tema',
        'IT': 'Si è verificato un errore durante l’aggiunta dell’argomento',
        'DE': 'Beim Hinzufügen des Themas ist ein Fehler aufgetreten',
        'TR': 'Konu eklenirken bir hata oluştu'
      },
      'topics.deleteConfirm': {
        'AR': 'هل أنت متأكد من حذف هذا الموضوع؟ سيتم حذف جميع العناصر المرتبطة به.',
        'FR': 'Êtes-vous sûr de vouloir supprimer ce sujet ? Tous les éléments associés seront supprimés.',
        'EN': 'Are you sure you want to delete this topic? All related elements will be deleted.',
        'ES': '¿Está seguro de que desea eliminar este tema? Se eliminarán todos los elementos relacionados.',
        'IT': 'Sei sicuro di voler eliminare questo argomento? Tutti gli elementi correlati verranno eliminati.',
        'DE': 'Möchten Sie dieses Thema wirklich löschen? Alle zugehörigen Elemente werden gelöscht.',
        'TR': 'Bu konuyu silmek istediğinizden emin misiniz? İlgili tüm öğeler silinecek.'
      },
      'topics.deleteError': {
        'AR': 'حدث خطأ أثناء حذف الموضوع',
        'FR': 'Une erreur s’est produite lors de la suppression du sujet',
        'EN': 'An error occurred while deleting the topic',
        'ES': 'Se produjo un error al eliminar el tema',
        'IT': 'Si è verificato un errore durante l’eliminazione dell’argomento',
        'DE': 'Beim Löschen des Themas ist ein Fehler aufgetreten',
        'TR': 'Konu silinirken bir hata oluştu'
      },
      'topics.enterElementContentError': {
        'AR': 'يرجى إدخال محتوى العنصر',
        'FR': 'Veuillez saisir le contenu de l’élément',
        'EN': 'Please enter the element content',
        'ES': 'Por favor ingrese el contenido del elemento',
        'IT': 'Inserisci il contenuto dell’elemento',
        'DE': 'Bitte geben Sie den Elementinhalt ein',
        'TR': 'Lütfen öğe içeriğini girin'
      },
      'topics.updateElementError': {
        'AR': 'حدث خطأ أثناء تحديث العنصر',
        'FR': 'Une erreur s’est produite lors de la mise à jour de l’élément',
        'EN': 'An error occurred while updating the element',
        'ES': 'Se produjo un error al actualizar el elemento',
        'IT': 'Si è verificato un errore durante l’aggiornamento dell’elemento',
        'DE': 'Beim Aktualisieren des Elements ist ein Fehler aufgetreten',
        'TR': 'Öğe güncellenirken bir hata oluştu'
      },
      'topics.createElementError': {
        'AR': 'حدث خطأ أثناء إضافة العنصر',
        'FR': 'Une erreur s’est produite lors de l’ajout de l’élément',
        'EN': 'An error occurred while adding the element',
        'ES': 'Se produjo un error al agregar el elemento',
        'IT': 'Si è verificato un errore durante l’aggiunta dell’elemento',
        'DE': 'Beim Hinzufügen des Elements ist ein Fehler aufgetreten',
        'TR': 'Öğe eklenirken bir hata oluştu'
      },
      'topics.deleteElementConfirm': {
        'AR': 'هل أنت متأكد من حذف هذا العنصر؟',
        'FR': 'Êtes-vous sûr de vouloir supprimer cet élément ?',
        'EN': 'Are you sure you want to delete this element?',
        'ES': '¿Está seguro de que desea eliminar este elemento?',
        'IT': 'Sei sicuro di voler eliminare questo elemento?',
        'DE': 'Möchten Sie dieses Element wirklich löschen?',
        'TR': 'Bu öğeyi silmek istediğinizden emin misiniz?'
      },
      'topics.deleteElementError': {
        'AR': 'حدث خطأ أثناء حذف العنصر',
        'FR': 'Une erreur s’est produite lors de la suppression de l’élément',
        'EN': 'An error occurred while deleting the element',
        'ES': 'Se produjo un error al eliminar el elemento',
        'IT': 'Si è verificato un errore durante l’eliminazione dell’elemento',
        'DE': 'Beim Löschen des Elements ist ein Fehler aufgetreten',
        'TR': 'Öğe silinirken bir hata oluştu'
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
      'notebooks.search': {
        'AR': 'البحث',
        'FR': 'Recherche',
        'EN': 'Search',
        'ES': 'Búsqueda',
        'IT': 'Ricerca',
        'DE': 'Suche',
        'TR': 'Arama'
      },
      'notebooks.searchPlaceholder': {
        'AR': 'ابحث بالعنوان، الوصف، المحتوى...',
        'FR': 'Rechercher par titre, description ou contenu...',
        'EN': 'Search by title, description or content...',
        'ES': 'Buscar por título, descripción o contenido...',
        'IT': 'Cerca per titolo, descrizione o contenuto...',
        'DE': 'Suche nach Titel, Beschreibung oder Inhalt...',
        'TR': 'Başlık, açıklama veya içeriğe göre ara...'
      },
      'notebooks.filterByClass': {
        'AR': 'تصفية حسب القسم',
        'FR': 'Filtrer par classe',
        'EN': 'Filter by class',
        'ES': 'Filtrar por clase',
        'IT': 'Filtra per classe',
        'DE': 'Nach Klasse filtern',
        'TR': 'Sınıfa göre filtrele'
      },
      'notebooks.allClasses': {
        'AR': 'جميع الأقسام',
        'FR': 'Toutes les classes',
        'EN': 'All classes',
        'ES': 'Todas las clases',
        'IT': 'Tutte le classi',
        'DE': 'Alle Klassen',
        'TR': 'Tüm sınıflar'
      },
      'notebooks.listTitle': {
        'AR': 'قائمة الدفاتر ({{count}})',
        'FR': 'Liste des cahiers ({{count}})',
        'EN': 'Notebooks list ({{count}})',
        'ES': 'Lista de cuadernos ({{count}})',
        'IT': 'Elenco quaderni ({{count}})',
        'DE': 'Hefteliste ({{count}})',
        'TR': 'Defter listesi ({{count}})'
      },
      'notebooks.general': {
        'AR': 'عام',
        'FR': 'Général',
        'EN': 'General',
        'ES': 'General',
        'IT': 'Generale',
        'DE': 'Allgemein',
        'TR': 'Genel'
      },
      'notebooks.sessionsCount': {
        'AR': '{{count}} حصة',
        'FR': '{{count}} séance(s)',
        'EN': '{{count}} session(s)',
        'ES': '{{count}} sesión(es)',
        'IT': '{{count}} lezione/i',
        'DE': '{{count}} Stunde(n)',
        'TR': '{{count}} ders'
      },
      'notebooks.sessionTitles': {
        'AR': 'عناوين الحصص:',
        'FR': 'Titres des séances :',
        'EN': 'Session titles:',
        'ES': 'Títulos de las sesiones:',
        'IT': 'Titoli delle lezioni:',
        'DE': 'Stundentitel:',
        'TR': 'Ders başlıkları:'
      },
      'notebooks.addSession': {
        'AR': 'إضافة حصة',
        'FR': 'Ajouter une séance',
        'EN': 'Add session',
        'ES': 'Agregar sesión',
        'IT': 'Aggiungi lezione',
        'DE': 'Stunde hinzufügen',
        'TR': 'Ders ekle'
      },
      'notebooks.showReport': {
        'AR': 'عرض التقرير',
        'FR': 'Afficher le rapport',
        'EN': 'Show report',
        'ES': 'Mostrar informe',
        'IT': 'Mostra rapporto',
        'DE': 'Bericht anzeigen',
        'TR': 'Raporu göster'
      },
      'notebooks.noNotebooks': {
        'AR': 'لا توجد دفاتر',
        'FR': 'Aucun cahier',
        'EN': 'No notebooks',
        'ES': 'No hay cuadernos',
        'IT': 'Nessun quaderno',
        'DE': 'Keine Hefte',
        'TR': 'Defter yok'
      },
      'notebooks.modalTitle': {
        'AR': 'إدارة الدفتر',
        'FR': 'Gestion du cahier',
        'EN': 'Notebook management',
        'ES': 'Gestión del cuaderno',
        'IT': 'Gestione quaderno',
        'DE': 'Heftverwaltung',
        'TR': 'Defter yönetimi'
      },
      'notebooks.editNotebook': {
        'AR': 'تعديل الدفتر',
        'FR': 'Modifier le cahier',
        'EN': 'Edit notebook',
        'ES': 'Editar cuaderno',
        'IT': 'Modifica quaderno',
        'DE': 'Heft bearbeiten',
        'TR': 'Defteri düzenle'
      },
      'notebooks.addNotebookFull': {
        'AR': 'إضافة دفتر جديد',
        'FR': 'Ajouter un nouveau cahier',
        'EN': 'Add new notebook',
        'ES': 'Agregar nuevo cuaderno',
        'IT': 'Aggiungi nuovo quaderno',
        'DE': 'Neues Heft hinzufügen',
        'TR': 'Yeni defter ekle'
      },
      'notebooks.titleLabel': {
        'AR': 'العنوان *',
        'FR': 'Titre *',
        'EN': 'Title *',
        'ES': 'Título *',
        'IT': 'Titolo *',
        'DE': 'Titel *',
        'TR': 'Başlık *'
      },
      'notebooks.titlePlaceholder': {
        'AR': 'أدخل عنوان الدفتر',
        'FR': 'Entrez le titre du cahier',
        'EN': 'Enter notebook title',
        'ES': 'Ingrese el título del cuaderno',
        'IT': 'Inserisci il titolo del quaderno',
        'DE': 'Hefttitel eingeben',
        'TR': 'Defter başlığını girin'
      },
      'notebooks.descriptionLabel': {
        'AR': 'الوصف',
        'FR': 'Description',
        'EN': 'Description',
        'ES': 'Descripción',
        'IT': 'Descrizione',
        'DE': 'Beschreibung',
        'TR': 'Açıklama'
      },
      'notebooks.descriptionPlaceholder': {
        'AR': 'أدخل وصف الدفتر',
        'FR': 'Entrez la description du cahier',
        'EN': 'Enter notebook description',
        'ES': 'Ingrese la descripción del cuaderno',
        'IT': 'Inserisci la descrizione del quaderno',
        'DE': 'Heftbeschreibung eingeben',
        'TR': 'Defter açıklamasını girin'
      },
      'notebooks.classLabel': {
        'AR': 'القسم',
        'FR': 'Classe',
        'EN': 'Class',
        'ES': 'Clase',
        'IT': 'Classe',
        'DE': 'Klasse',
        'TR': 'Sınıf'
      },
      'notebooks.generalForAllClasses': {
        'AR': 'عام (لجميع الأقسام)',
        'FR': 'Général (pour toutes les classes)',
        'EN': 'General (for all classes)',
        'ES': 'General (para todas las clases)',
        'IT': 'Generale (per tutte le classi)',
        'DE': 'Allgemein (für alle Klassen)',
        'TR': 'Genel (tüm sınıflar için)'
      },
      'notebooks.contentLabel': {
        'AR': 'المحتوى',
        'FR': 'Contenu',
        'EN': 'Content',
        'ES': 'Contenido',
        'IT': 'Contenuto',
        'DE': 'Inhalt',
        'TR': 'İçerik'
      },
      'notebooks.contentPlaceholder': {
        'AR': 'أدخل محتوى الدفتر...',
        'FR': 'Entrez le contenu du cahier...',
        'EN': 'Enter notebook content...',
        'ES': 'Ingrese el contenido del cuaderno...',
        'IT': 'Inserisci il contenuto del quaderno...',
        'DE': 'Heftinhalt eingeben...',
        'TR': 'Defter içeriğini girin...'
      },
      'notebooks.addButton': {
        'AR': 'إضافة',
        'FR': 'Ajouter',
        'EN': 'Add',
        'ES': 'Agregar',
        'IT': 'Aggiungi',
        'DE': 'Hinzufügen',
        'TR': 'Ekle'
      },
      'notebooks.updateButton': {
        'AR': 'تحديث',
        'FR': 'Mettre à jour',
        'EN': 'Update',
        'ES': 'Actualizar',
        'IT': 'Aggiorna',
        'DE': 'Aktualisieren',
        'TR': 'Güncelle'
      },
      'notebooks.cancel': {
        'AR': 'إلغاء',
        'FR': 'Annuler',
        'EN': 'Cancel',
        'ES': 'Cancelar',
        'IT': 'Annulla',
        'DE': 'Abbrechen',
        'TR': 'İptal'
      },
      'notebooks.edit': {
        'AR': 'تعديل',
        'FR': 'Modifier',
        'EN': 'Edit',
        'ES': 'Editar',
        'IT': 'Modifica',
        'DE': 'Bearbeiten',
        'TR': 'Düzenle'
      },
      'notebooks.delete': {
        'AR': 'حذف',
        'FR': 'Supprimer',
        'EN': 'Delete',
        'ES': 'Eliminar',
        'IT': 'Elimina',
        'DE': 'Löschen',
        'TR': 'Sil'
      },
      'notebooks.courseModalTitle': {
        'AR': 'إدارة الحصة',
        'FR': 'Gestion de la séance',
        'EN': 'Session management',
        'ES': 'Gestión de la sesión',
        'IT': 'Gestione lezione',
        'DE': 'Stundenverwaltung',
        'TR': 'Ders yönetimi'
      },
      'notebooks.editCourse': {
        'AR': 'تعديل الحصة',
        'FR': 'Modifier la séance',
        'EN': 'Edit session',
        'ES': 'Editar sesión',
        'IT': 'Modifica lezione',
        'DE': 'Stunde bearbeiten',
        'TR': 'Dersi düzenle'
      },
      'notebooks.addCourse': {
        'AR': 'إضافة حصة جديدة',
        'FR': 'Ajouter une nouvelle séance',
        'EN': 'Add new session',
        'ES': 'Agregar nueva sesión',
        'IT': 'Aggiungi nuova lezione',
        'DE': 'Neue Stunde hinzufügen',
        'TR': 'Yeni ders ekle'
      },
      'notebooks.courseTitleLabel': {
        'AR': 'عنوان الحصة *',
        'FR': 'Titre de la séance *',
        'EN': 'Session title *',
        'ES': 'Título de la sesión *',
        'IT': 'Titolo lezione *',
        'DE': 'Stundentitel *',
        'TR': 'Ders başlığı *'
      },
      'notebooks.courseTitlePlaceholder': {
        'AR': 'أدخل عنوان الحصة',
        'FR': 'Entrez le titre de la séance',
        'EN': 'Enter session title',
        'ES': 'Ingrese el título de la sesión',
        'IT': 'Inserisci il titolo della lezione',
        'DE': 'Stundentitel eingeben',
        'TR': 'Ders başlığını girin'
      },
      'notebooks.courseDateLabel': {
        'AR': 'التاريخ *',
        'FR': 'Date *',
        'EN': 'Date *',
        'ES': 'Fecha *',
        'IT': 'Data *',
        'DE': 'Datum *',
        'TR': 'Tarih *'
      },
      'notebooks.courseStartTimeLabel': {
        'AR': 'وقت البداية *',
        'FR': 'Heure de début *',
        'EN': 'Start time *',
        'ES': 'Hora de inicio *',
        'IT': 'Ora di inizio *',
        'DE': 'Anfangszeit *',
        'TR': 'Başlangıç saati *'
      },
      'notebooks.courseEndTimeLabel': {
        'AR': 'وقت النهاية *',
        'FR': 'Heure de fin *',
        'EN': 'End time *',
        'ES': 'Hora de fin *',
        'IT': 'Ora di fine *',
        'DE': 'Endzeit *',
        'TR': 'Bitiş saati *'
      },
      'notebooks.selectOrCreateTopicLabel': {
        'AR': 'اختر موضوع أو أنشئ موضوع جديد',
        'FR': 'Choisissez un sujet ou créez un nouveau sujet',
        'EN': 'Select a topic or create a new topic',
        'ES': 'Seleccione un tema o cree un tema nuevo',
        'IT': 'Seleziona un argomento o crea un nuovo argomento',
        'DE': 'Wählen Sie ein Thema oder erstellen Sie ein neues Thema',
        'TR': 'Bir konu seçin veya yeni bir konu oluşturun'
      },
      'notebooks.selectFromList': {
        'AR': 'اختر من القائمة',
        'FR': 'Choisissez dans la liste',
        'EN': 'Select from list',
        'ES': 'Seleccione de la lista',
        'IT': 'Seleziona dall\'elenco',
        'DE': 'Aus der Liste auswählen',
        'TR': 'Listeden seçin'
      },
      'notebooks.newTopicButton': {
        'AR': 'موضوع جديد',
        'FR': 'Nouveau sujet',
        'EN': 'New topic',
        'ES': 'Nuevo tema',
        'IT': 'Nuovo argomento',
        'DE': 'Neues Thema',
        'TR': 'Yeni konu'
      },
      'notebooks.cancelNewTopicButton': {
        'AR': 'إلغاء الموضوع الجديد',
        'FR': 'Annuler le nouveau sujet',
        'EN': 'Cancel new topic',
        'ES': 'Cancelar nuevo tema',
        'IT': 'Annulla nuovo argomento',
        'DE': 'Neues Thema abbrechen',
        'TR': 'Yeni konuyu iptal et'
      },
      'notebooks.newTopicTitleLabel': {
        'AR': 'عنوان الموضوع الجديد',
        'FR': 'Titre du nouveau sujet',
        'EN': 'New topic title',
        'ES': 'Título del nuevo tema',
        'IT': 'Titolo del nuovo argomento',
        'DE': 'Neuer Thementitel',
        'TR': 'Yeni konu başlığı'
      },
      'notebooks.newTopicSubtitleLabel': {
        'AR': 'العنوان الفرعي',
        'FR': 'Sous-titre',
        'EN': 'Subtitle',
        'ES': 'Subtítulo',
        'IT': 'Sottotitolo',
        'DE': 'Untertitel',
        'TR': 'Alt başlık'
      },
      'notebooks.newTopicDescriptionLabel': {
        'AR': 'وصف الموضوع',
        'FR': 'Description du sujet',
        'EN': 'Topic description',
        'ES': 'Descripción del tema',
        'IT': 'Descrizione argomento',
        'DE': 'Themenbeschreibung',
        'TR': 'Konu açıklaması'
      },
      'notebooks.descriptionCourseLabel': {
        'AR': 'وصف الحصة *',
        'FR': 'Description de la séance *',
        'EN': 'Session description *',
        'ES': 'Descripción de la sesión *',
        'IT': 'Descrizione lezione *',
        'DE': 'Stundenbeschreibung *',
        'TR': 'Ders açıklaması *'
      },
      'notebooks.descriptionCoursePlaceholder': {
        'AR': 'أدخل وصف الحصة',
        'FR': 'Entrez la description de la séance',
        'EN': 'Enter session description',
        'ES': 'Ingrese la descripción de la sesión',
        'IT': 'Inserisci la descrizione della lezione',
        'DE': 'Stundenbeschreibung eingeben',
        'TR': 'Ders açıklamasını girin'
      },
      'notebooks.markLabel': {
        'AR': 'التنقيط / الملاحظة',
        'FR': 'Note / remarque',
        'EN': 'Mark / note',
        'ES': 'Nota / observación',
        'IT': 'Voto / nota',
        'DE': 'Note / Bemerkung',
        'TR': 'Not / açıklama'
      },
      'notebooks.noteLabel': {
        'AR': 'ملاحظات إضافية',
        'FR': 'Remarques supplémentaires',
        'EN': 'Additional notes',
        'ES': 'Notas adicionales',
        'IT': 'Note aggiuntive',
        'DE': 'Zusätzliche Bemerkungen',
        'TR': 'Ek notlar'
      },
      'notebooks.enterTitleDescriptionError': {
        'AR': 'يرجى إدخال العنوان والوصف',
        'FR': 'Veuillez saisir le titre et la description',
        'EN': 'Please enter the title and description',
        'ES': 'Por favor ingrese el título y la descripción',
        'IT': 'Inserisci il titolo e la descrizione',
        'DE': 'Bitte geben Sie Titel und Beschreibung ein',
        'TR': 'Lütfen başlık ve açıklamayı girin'
      },
      'notebooks.timeFormatError': {
        'AR': 'خطأ في تنسيق الوقت. يرجى التأكد من إدخال الوقت بشكل صحيح',
        'FR': 'Erreur de format de l\'heure. Veuillez vérifier la saisie.',
        'EN': 'Time format error. Please make sure the time is entered correctly.',
        'ES': 'Error en el formato de la hora. Asegúrese de que la hora esté introducida correctamente.',
        'IT': 'Errore nel formato dell\'ora. Assicurati che l\'ora sia inserita correttamente.',
        'DE': 'Fehler im Zeitformat. Bitte stellen Sie sicher, dass die Uhrzeit korrekt eingegeben ist.',
        'TR': 'Saat formatı hatası. Lütfen saatin doğru girildiğinden emin olun.'
      },
      'notebooks.startBeforeEndError': {
        'AR': 'يجب أن يكون وقت البداية قبل وقت النهاية',
        'FR': 'L\'heure de début doit être avant l\'heure de fin',
        'EN': 'Start time must be before end time',
        'ES': 'La hora de inicio debe ser anterior a la hora de fin',
        'IT': 'L\'ora di inizio deve essere precedente all\'ora di fine',
        'DE': 'Die Anfangszeit muss vor der Endzeit liegen',
        'TR': 'Başlangıç saati bitiş saatinden önce olmalıdır'
      },
      'notebooks.updateError': {
        'AR': 'حدث خطأ أثناء تحديث الدفتر',
        'FR': 'Une erreur s’est produite lors de la mise à jour du cahier',
        'EN': 'An error occurred while updating the notebook',
        'ES': 'Se produjo un error al actualizar el cuaderno',
        'IT': 'Si è verificato un errore durante l’aggiornamento del quaderno',
        'DE': 'Beim Aktualisieren des Heftes ist ein Fehler aufgetreten',
        'TR': 'Defter güncellenirken bir hata oluştu'
      },
      'notebooks.createError': {
        'AR': 'حدث خطأ أثناء إضافة الدفتر',
        'FR': 'Une erreur s’est produite lors de l’ajout du cahier',
        'EN': 'An error occurred while adding the notebook',
        'ES': 'Se produjo un error al agregar el cuaderno',
        'IT': 'Si è verificato un errore durante l’aggiunta del quaderno',
        'DE': 'Beim Hinzufügen des Heftes ist ein Fehler aufgetreten',
        'TR': 'Defter eklenirken bir hata oluştu'
      },
      'notebooks.deleteConfirm': {
        'AR': 'هل أنت متأكد من حذف هذا الدفتر؟',
        'FR': 'Êtes-vous sûr de vouloir supprimer ce cahier ?',
        'EN': 'Are you sure you want to delete this notebook?',
        'ES': '¿Está seguro de que desea eliminar este cuaderno?',
        'IT': 'Sei sicuro di voler eliminare questo quaderno?',
        'DE': 'Möchten Sie dieses Heft wirklich löschen?',
        'TR': 'Bu defteri silmek istediğinizden emin misiniz?'
      },
      'notebooks.deleteError': {
        'AR': 'حدث خطأ أثناء حذف الدفتر',
        'FR': 'Une erreur s’est produite lors de la suppression du cahier',
        'EN': 'An error occurred while deleting the notebook',
        'ES': 'Se produjo un error al eliminar el cuaderno',
        'IT': 'Si è verificato un errore durante l’eliminazione del quaderno',
        'DE': 'Beim Löschen des Heftes ist ein Fehler aufgetreten',
        'TR': 'Defter silinirken bir hata oluştu'
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
      'annualDistribution.schoolYear': {
        'AR': 'السنة الدراسية',
        'FR': 'Année scolaire',
        'EN': 'School year',
        'ES': 'Año escolar',
        'IT': 'Anno scolastico',
        'DE': 'Schuljahr',
        'TR': 'Okul yılı'
      },
      'annualDistribution.level': {
        'AR': 'المستوى',
        'FR': 'Niveau',
        'EN': 'Level',
        'ES': 'Niveau',
        'IT': 'Livello',
        'DE': 'Niveau',
        'TR': 'Seviye'
      },
      'annualDistribution.track': {
        'AR': 'الشعبة / الجذع',
        'FR': 'Filière / Tronc commun',
        'EN': 'Track / Common core',
        'ES': 'Rama / Tronco común',
        'IT': 'Indirizzo / Tronco comune',
        'DE': 'Zweig / Gemeinsamer Kern',
        'TR': 'Alan / Ortak gövde'
      },
      'annualDistribution.tabHolidays': {
        'AR': 'العطل والامتحانات',
        'FR': 'Vacances et examens',
        'EN': 'Holidays and exams',
        'ES': 'Vacaciones y exámenes',
        'IT': 'Vacanze ed esami',
        'DE': 'Ferien und Prüfungen',
        'TR': 'Tatiller ve sınavlar'
      },
      'annualDistribution.tabDistribution': {
        'AR': 'التوزيع السنوي',
        'FR': 'Répartition annuelle',
        'EN': 'Annual distribution',
        'ES': 'Distribución anual',
        'IT': 'Distribuzione annuale',
        'DE': 'Jährliche Verteilung',
        'TR': 'Yıllık dağıtım'
      },
      'annualDistribution.loading': {
        'AR': 'جاري التحميل...',
        'FR': 'Chargement...',
        'EN': 'Loading...',
        'ES': 'Cargando...',
        'IT': 'Caricamento...',
        'DE': 'Laden...',
        'TR': 'Yükleniyor...'
      },
      'annualDistribution.addHolidayTitle': {
        'AR': 'إضافة عطلة / امتحان',
        'FR': 'Ajouter une vacance / un examen',
        'EN': 'Add holiday / exam',
        'ES': 'Agregar vacación / examen',
        'IT': 'Aggiungi vacanza / esame',
        'DE': 'Ferien / Prüfung hinzufügen',
        'TR': 'Tatil / sınav ekle'
      },
      'annualDistribution.holidayName': {
        'AR': 'اسم العطلة / الامتحان',
        'FR': 'Nom de la vacance / de l\'examen',
        'EN': 'Holiday / exam name',
        'ES': 'Nombre de la vacación / examen',
        'IT': 'Nome della vacanza / dell\'esame',
        'DE': 'Name der Ferien / Prüfung',
        'TR': 'Tatil / sınav adı'
      },
      'annualDistribution.holidayNamePlaceholder': {
        'AR': 'الاسم (مثال: عطلة الخريف)',
        'FR': 'Nom (ex: Vacances d\'automne)',
        'EN': 'Name (e.g. Autumn holiday)',
        'ES': 'Nombre (ej.: Vacaciones de otoño)',
        'IT': 'Nome (es. Vacanze autunnali)',
        'DE': 'Name (z.B. Herbstferien)',
        'TR': 'Ad (ör. Sonbahar tatili)'
      },
      'annualDistribution.holidayType': {
        'AR': 'النوع',
        'FR': 'Type',
        'EN': 'Type',
        'ES': 'Tipo',
        'IT': 'Tipo',
        'DE': 'Typ',
        'TR': 'Tür'
      },
      'annualDistribution.typeHoliday': {
        'AR': 'عطلة',
        'FR': 'Vacance',
        'EN': 'Holiday',
        'ES': 'Vacación',
        'IT': 'Vacanza',
        'DE': 'Ferien',
        'TR': 'Tatil'
      },
      'annualDistribution.typeExam': {
        'AR': 'امتحان',
        'FR': 'Examen',
        'EN': 'Exam',
        'ES': 'Examen',
        'IT': 'Esame',
        'DE': 'Prüfung',
        'TR': 'Sınav'
      },
      'annualDistribution.typeReligious': {
        'AR': 'عيد ديني',
        'FR': 'Fête religieuse',
        'EN': 'Religious holiday',
        'ES': 'Fiesta religiosa',
        'IT': 'Festa religiosa',
        'DE': 'Religiöses Fest',
        'TR': 'Dini bayram'
      },
      'annualDistribution.typeNational': {
        'AR': 'عيد وطني',
        'FR': 'Fête nationale',
        'EN': 'National holiday',
        'ES': 'Fiesta nacional',
        'IT': 'Festa nazionale',
        'DE': 'Nationalfeiertag',
        'TR': 'Ulusal bayram'
      },
      'annualDistribution.startDate': {
        'AR': 'تاريخ البداية',
        'FR': 'Date de début',
        'EN': 'Start date',
        'ES': 'Fecha de inicio',
        'IT': 'Data di inizio',
        'DE': 'Startdatum',
        'TR': 'Başlangıç tarihi'
      },
      'annualDistribution.endDate': {
        'AR': 'تاريخ النهاية',
        'FR': 'Date de fin',
        'EN': 'End date',
        'ES': 'Fecha de fin',
        'IT': 'Data di fine',
        'DE': 'Enddatum',
        'TR': 'Bitiş tarihi'
      },
      'annualDistribution.notes': {
        'AR': 'ملاحظات',
        'FR': 'Remarques',
        'EN': 'Notes',
        'ES': 'Notas',
        'IT': 'Note',
        'DE': 'Bemerkungen',
        'TR': 'Notlar'
      },
      'annualDistribution.notesPlaceholder': {
        'AR': 'ملاحظات',
        'FR': 'Remarques',
        'EN': 'Notes',
        'ES': 'Notas',
        'IT': 'Note',
        'DE': 'Bemerkungen',
        'TR': 'Notlar'
      },
      'annualDistribution.saveHoliday': {
        'AR': 'حفظ العطلة',
        'FR': 'Enregistrer la vacance',
        'EN': 'Save holiday',
        'ES': 'Guardar vacación',
        'IT': 'Salva vacanza',
        'DE': 'Ferien speichern',
        'TR': 'Tatili kaydet'
      },
      'annualDistribution.holidaysListForYear': {
        'AR': 'قائمة العطل والامتحانات للسنة',
        'FR': 'Liste des vacances et examens pour l\'année',
        'EN': 'List of holidays and exams for year',
        'ES': 'Lista de vacaciones y exámenes para el año',
        'IT': 'Elenco vacanze ed esami per l\'anno',
        'DE': 'Liste der Ferien und Prüfungen für das Jahr',
        'TR': 'Yıl için tatil ve sınav listesi'
      },
      'annualDistribution.name': {
        'AR': 'الاسم',
        'FR': 'Nom',
        'EN': 'Name',
        'ES': 'Nombre',
        'IT': 'Nome',
        'DE': 'Name',
        'TR': 'Ad'
      },
      'annualDistribution.type': {
        'AR': 'النوع',
        'FR': 'Type',
        'EN': 'Type',
        'ES': 'Tipo',
        'IT': 'Tipo',
        'DE': 'Typ',
        'TR': 'Tür'
      },
      'annualDistribution.start': {
        'AR': 'بداية',
        'FR': 'Début',
        'EN': 'Start',
        'ES': 'Inicio',
        'IT': 'Inizio',
        'DE': 'Beginn',
        'TR': 'Başlangıç'
      },
      'annualDistribution.end': {
        'AR': 'نهاية',
        'FR': 'Fin',
        'EN': 'End',
        'ES': 'Fin',
        'IT': 'Fine',
        'DE': 'Ende',
        'TR': 'Bitiş'
      },
      'annualDistribution.actions': {
        'AR': 'إجراءات',
        'FR': 'Actions',
        'EN': 'Actions',
        'ES': 'Acciones',
        'IT': 'Azioni',
        'DE': 'Aktionen',
        'TR': 'İşlemler'
      },
      'annualDistribution.delete': {
        'AR': 'حذف',
        'FR': 'Supprimer',
        'EN': 'Delete',
        'ES': 'Eliminar',
        'IT': 'Elimina',
        'DE': 'Löschen',
        'TR': 'Sil'
      },
      'annualDistribution.noPeriodsForYear': {
        'AR': 'لا توجد فترات مسجلة لهذه السنة بعد.',
        'FR': 'Aucune période enregistrée pour cette année pour le moment.',
        'EN': 'No periods recorded for this year yet.',
        'ES': 'Todavía no hay períodos registrados para este año.',
        'IT': 'Nessun periodo registrato per quest\'anno.',
        'DE': 'Für dieses Jahr wurden noch keine Zeiträume erfasst.',
        'TR': 'Bu yıl için henüz dönem kaydedilmedi.'
      },
      'annualDistribution.term': {
        'AR': 'الفصل',
        'FR': 'Trimestre',
        'EN': 'Term',
        'ES': 'Trimestre',
        'IT': 'Trimestre',
        'DE': 'Trimester',
        'TR': 'Dönem'
      },
      'annualDistribution.termPlaceholder': {
        'AR': 'الفصل (1-3)',
        'FR': 'Trimestre (1-3)',
        'EN': 'Term (1-3)',
        'ES': 'Trimestre (1-3)',
        'IT': 'Trimestre (1-3)',
        'DE': 'Trimester (1-3)',
        'TR': 'Dönem (1-3)'
      },
      'annualDistribution.weekNumber': {
        'AR': 'رقم الأسبوع',
        'FR': 'Numéro de semaine',
        'EN': 'Week number',
        'ES': 'Número de semana',
        'IT': 'Numero della settimana',
        'DE': 'Wochennummer',
        'TR': 'Hafta numarası'
      },
      'annualDistribution.weekNumberPlaceholder': {
        'AR': 'رقم الأسبوع',
        'FR': 'Numéro de semaine',
        'EN': 'Week number',
        'ES': 'Número de semana',
        'IT': 'Numero della settimana',
        'DE': 'Wochennummer',
        'TR': 'Hafta numarası'
      },
      'annualDistribution.yearStartDate': {
        'AR': 'تاريخ بداية السنة الدراسية',
        'FR': 'Date de début de l\'année scolaire',
        'EN': 'School year start date',
        'ES': 'Fecha de inicio del año escolar',
        'IT': 'Data di inizio dell\'anno scolastico',
        'DE': 'Beginn des Schuljahres',
        'TR': 'Okul yılının başlangıç tarihi'
      },
      'annualDistribution.subtitle': {
        'AR': 'اسم الوحدة / النشاط (العنوان الفرعي)',
        'FR': 'Nom de l\'unité / activité (sous-titre)',
        'EN': 'Unit / activity name (subtitle)',
        'ES': 'Nombre de la unidad / actividad (subtítulo)',
        'IT': 'Nome unità / attività (sottotitolo)',
        'DE': 'Name der Einheit / Aktivität (Untertitel)',
        'TR': 'Ünite / etkinlik adı (alt başlık)'
      },
      'annualDistribution.selectSubtitle': {
        'AR': 'اختر العنوان الفرعي',
        'FR': 'Sélectionner le sous-titre',
        'EN': 'Select subtitle',
        'ES': 'Seleccionar subtítulo',
        'IT': 'Seleziona sottotitolo',
        'DE': 'Untertitel auswählen',
        'TR': 'Alt başlık seç'
      },
      'annualDistribution.saveRow': {
        'AR': 'حفظ السطر',
        'FR': 'Enregistrer la ligne',
        'EN': 'Save row',
        'ES': 'Guardar fila',
        'IT': 'Salva riga',
        'DE': 'Zeile speichern',
        'TR': 'Satırı kaydet'
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
        'AR': 'متابعة إنجاز برنامج مادة "{{subjectName}}"',
        'FR': 'Suivi de l\'accomplissement du programme de la matière "{{subjectName}}"',
        'EN': 'Progress tracking of "{{subjectName}}" program',
        'ES': 'Seguimiento del progreso del programa de "{{subjectName}}"',
        'IT': 'Monitoraggio dei progressi del programma di "{{subjectName}}"',
        'DE': 'Fortschrittsverfolgung des Programms "{{subjectName}}"',
        'TR': '"{{subjectName}}" programı ilerleme takibi'
      },
      'progressTracking.refreshData': {
        'AR': 'تحديث البيانات',
        'FR': 'Actualiser les données',
        'EN': 'Refresh data',
        'ES': 'Actualizar datos',
        'IT': 'Aggiorna dati',
        'DE': 'Daten aktualisieren',
        'TR': 'Verileri yenile'
      },
      'progressTracking.exportPdf': {
        'AR': 'تصدير إلى PDF',
        'FR': 'Exporter en PDF',
        'EN': 'Export to PDF',
        'ES': 'Exportar a PDF',
        'IT': 'Esporta in PDF',
        'DE': 'Als PDF exportieren',
        'TR': 'PDF\'e aktar'
      },
      'progressTracking.untilDate': {
        'AR': 'إلى غاية يوم:',
        'FR': 'Jusqu\'au :',
        'EN': 'Up to:',
        'ES': 'Hasta el:',
        'IT': 'Fino al:',
        'DE': 'Bis zum:',
        'TR': 'Şu tarihe kadar:'
      },
      'progressTracking.weekNumber': {
        'AR': 'الأسبوع رقم',
        'FR': 'Semaine n°',
        'EN': 'Week no.',
        'ES': 'Semana n.º',
        'IT': 'Settimana n.',
        'DE': 'Woche Nr.',
        'TR': 'Hafta no.'
      },
      'progressTracking.expectedLesson': {
        'AR': 'الدرس المتوقع رقم',
        'FR': 'Leçon prévue n°',
        'EN': 'Expected lesson no.',
        'ES': 'Lección prevista n.º',
        'IT': 'Lezione prevista n.',
        'DE': 'Erwartete Lektion Nr.',
        'TR': 'Beklenen ders no.'
      },
      'progressTracking.loading': {
        'AR': 'جاري تحميل البيانات...',
        'FR': 'Chargement des données...',
        'EN': 'Loading data...',
        'ES': 'Cargando datos...',
        'IT': 'Caricamento dati...',
        'DE': 'Daten werden geladen...',
        'TR': 'Veriler yükleniyor...'
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
      'progressTracking.levelAndTrack': {
        'AR': 'المستوى والشعبة',
        'FR': 'Niveau et filière',
        'EN': 'Level and track',
        'ES': 'Nivel y rama',
        'IT': 'Livello e indirizzo',
        'DE': 'Niveau und Zweig',
        'TR': 'Seviye ve alan'
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
      'progressTracking.lastLesson': {
        'AR': 'آخر درس',
        'FR': 'Dernière leçon',
        'EN': 'Last lesson',
        'ES': 'Última lección',
        'IT': 'Ultima lezione',
        'DE': 'Letzte Lektion',
        'TR': 'Son ders'
      },
      'progressTracking.progressPercentage': {
        'AR': '% نسبة التقدم',
        'FR': '% Taux d\'avancement',
        'EN': '% Progress rate',
        'ES': '% Tasa de progreso',
        'IT': '% Tasso di progresso',
        'DE': '% Fortschrittsrate',
        'TR': '% İlerleme oranı'
      },
      'progressTracking.delayWeeks': {
        'AR': 'عدد أسابيع التأخر (+/-)',
        'FR': 'Nombre de semaines de retard (+/-)',
        'EN': 'Number of delay weeks (+/-)',
        'ES': 'Número de semanas de retraso (+/-)',
        'IT': 'Numero di settimane di ritardo (+/-)',
        'DE': 'Anzahl der Verzugswochen (+/-)',
        'TR': 'Gecikme haftası sayısı (+/-)'
      },
      'progressTracking.notes': {
        'AR': 'ملاحظات',
        'FR': 'Remarques',
        'EN': 'Notes',
        'ES': 'Notas',
        'IT': 'Note',
        'DE': 'Bemerkungen',
        'TR': 'Notlar'
      },
      'progressTracking.delayedClassesTitle': {
        'AR': 'الأقسام المتأخرة (delay < 0)',
        'FR': 'Classes en retard (delay < 0)',
        'EN': 'Delayed classes (delay < 0)',
        'ES': 'Clases retrasadas (delay < 0)',
        'IT': 'Classi in ritardo (delay < 0)',
        'DE': 'Verspätete Klassen (delay < 0)',
        'TR': 'Geciken sınıflar (delay < 0)'
      },
      'progressTracking.noDelayedClasses': {
        'AR': 'لا توجد أقسام متأخرة.',
        'FR': 'Aucune classe en retard.',
        'EN': 'No delayed classes.',
        'ES': 'No hay clases retrasadas.',
        'IT': 'Nessuna classe in ritardo.',
        'DE': 'Keine verspäteten Klassen.',
        'TR': 'Geciken sınıf yok.'
      },
      'progressTracking.advancedClassesTitle': {
        'AR': 'الأقسام المتقدمة (delay > 0)',
        'FR': 'Classes en avance (delay > 0)',
        'EN': 'Advanced classes (delay > 0)',
        'ES': 'Clases adelantadas (delay > 0)',
        'IT': 'Classi in anticipo (delay > 0)',
        'DE': 'Fortgeschrittene Klassen (delay > 0)',
        'TR': 'İleride olan sınıflar (delay > 0)'
      },
      'progressTracking.noAdvancedClasses': {
        'AR': 'لا توجد أقسام متقدمة.',
        'FR': 'Aucune classe en avance.',
        'EN': 'No advanced classes.',
        'ES': 'No hay clases adelantadas.',
        'IT': 'Nessuna classe in anticipo.',
        'DE': 'Keine fortgeschrittenen Klassen.',
        'TR': 'İleride olan sınıf yok.'
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
      'teacherCard.print': {
        'AR': 'طباعة البطاقة',
        'FR': 'Imprimer la carte',
        'EN': 'Print card',
        'ES': 'Imprimir tarjeta',
        'IT': 'Stampa scheda',
        'DE': 'Karte drucken',
        'TR': 'Kartı yazdır'
      },
      'teacherCard.description': {
        'AR': 'قم بإدخال معلوماتك الشخصية و المهنية لحفظها و الرجوع إليها بسهولة.',
        'FR': 'Entrez vos informations personnelles et professionnelles pour les sauvegarder et y accéder facilement.',
        'EN': 'Enter your personal and professional information to save and access it easily.',
        'ES': 'Ingrese su información personal y profesional para guardarla y acceder a ella fácilmente.',
        'IT': 'Inserisci le tue informazioni personali e professionali per salvarle e accedervi facilmente.',
        'DE': 'Geben Sie Ihre persönlichen und beruflichen Informationen ein, um sie zu speichern und einfach darauf zuzugreifen.',
        'TR': 'Kişisel ve mesleki bilgilerinizi kolayca kaydetmek ve erişmek için girin.'
      },
      'teacherCard.save': {
        'AR': 'حفظ البطاقة',
        'FR': 'Enregistrer la carte',
        'EN': 'Save card',
        'ES': 'Guardar tarjeta',
        'IT': 'Salva scheda',
        'DE': 'Karte speichern',
        'TR': 'Kartı kaydet'
      },
      'teacherCard.printPdf': {
        'AR': 'طباعة البطاقة PDF',
        'FR': 'Imprimer la carte PDF',
        'EN': 'Print card PDF',
        'ES': 'Imprimir tarjeta PDF',
        'IT': 'Stampa scheda PDF',
        'DE': 'Karte als PDF drucken',
        'TR': 'Kartı PDF olarak yazdır'
      },
      'teacherCard.saved': {
        'AR': 'تم حفظ البيانات بنجاح',
        'FR': 'Données enregistrées avec succès',
        'EN': 'Data saved successfully',
        'ES': 'Datos guardados exitosamente',
        'IT': 'Dati salvati con successo',
        'DE': 'Daten erfolgreich gespeichert',
        'TR': 'Veriler başarıyla kaydedildi'
      },
      'teacherCard.ministryHeader': {
        'AR': 'الجمهورية الجزائرية الديمقراطية الشعبية',
        'FR': 'République Algérienne Démocratique et Populaire',
        'EN': 'People\'s Democratic Republic of Algeria',
        'ES': 'República Argelina Democrática y Popular',
        'IT': 'Repubblica Algerina Democratica e Popolare',
        'DE': 'Demokratische Volksrepublik Algerien',
        'TR': 'Cezayir Demokratik Halk Cumhuriyeti'
      },
      'teacherCard.ministry': {
        'AR': 'وزارة التربية الوطنية',
        'FR': 'Ministère de l\'Éducation Nationale',
        'EN': 'Ministry of National Education',
        'ES': 'Ministerio de Educación Nacional',
        'IT': 'Ministero dell\'Educazione Nazionale',
        'DE': 'Ministerium für Nationale Bildung',
        'TR': 'Milli Eğitim Bakanlığı'
      },
      'teacherCard.infoCard': {
        'AR': 'بطاقة معلومات',
        'FR': 'Carte d\'information',
        'EN': 'Information card',
        'ES': 'Tarjeta de información',
        'IT': 'Scheda informativa',
        'DE': 'Informationskarte',
        'TR': 'Bilgi kartı'
      },
      'teacherCard.directorate': {
        'AR': 'المديرية / الولاية',
        'FR': 'Direction / Wilaya',
        'EN': 'Directorate / Wilaya',
        'ES': 'Dirección / Wilaya',
        'IT': 'Direzione / Wilaya',
        'DE': 'Direktion / Wilaya',
        'TR': 'Müdürlük / Vilayet'
      },
      'teacherCard.school': {
        'AR': 'المؤسسة',
        'FR': 'Établissement',
        'EN': 'School',
        'ES': 'Escuela',
        'IT': 'Scuola',
        'DE': 'Schule',
        'TR': 'Okul'
      },
      'teacherCard.academicYear': {
        'AR': 'السنة الدراسية',
        'FR': 'Année scolaire',
        'EN': 'Academic year',
        'ES': 'Año académico',
        'IT': 'Anno accademico',
        'DE': 'Schuljahr',
        'TR': 'Akademik yıl'
      },
      'teacherCard.photo': {
        'AR': 'صورة الأستاذ',
        'FR': 'Photo du professeur',
        'EN': 'Teacher photo',
        'ES': 'Foto del profesor',
        'IT': 'Foto insegnante',
        'DE': 'Lehrerfoto',
        'TR': 'Öğretmen fotoğrafı'
      },
      'teacherCard.familyStatus': {
        'AR': 'الحالة العائلية',
        'FR': 'Situation familiale',
        'EN': 'Family status',
        'ES': 'Estado familiar',
        'IT': 'Stato familiare',
        'DE': 'Familienstand',
        'TR': 'Aile durumu'
      },
      'teacherCard.select': {
        'AR': 'اختر...',
        'FR': 'Sélectionner...',
        'EN': 'Select...',
        'ES': 'Seleccionar...',
        'IT': 'Seleziona...',
        'DE': 'Auswählen...',
        'TR': 'Seçin...'
      },
      'teacherCard.single': {
        'AR': 'أعزب',
        'FR': 'Célibataire',
        'EN': 'Single',
        'ES': 'Soltero',
        'IT': 'Celibe',
        'DE': 'Ledig',
        'TR': 'Bekar'
      },
      'teacherCard.married': {
        'AR': 'متزوج',
        'FR': 'Marié',
        'EN': 'Married',
        'ES': 'Casado',
        'IT': 'Sposato',
        'DE': 'Verheiratet',
        'TR': 'Evli'
      },
      'teacherCard.divorced': {
        'AR': 'مطلق',
        'FR': 'Divorcé',
        'EN': 'Divorced',
        'ES': 'Divorciado',
        'IT': 'Divorziato',
        'DE': 'Geschieden',
        'TR': 'Boşanmış'
      },
      'teacherCard.widowed': {
        'AR': 'أرمل',
        'FR': 'Veuf',
        'EN': 'Widowed',
        'ES': 'Viudo',
        'IT': 'Vedovo',
        'DE': 'Verwitwet',
        'TR': 'Dul'
      },
      'teacherCard.childrenCount': {
        'AR': 'عدد الأولاد',
        'FR': 'Nombre d\'enfants',
        'EN': 'Number of children',
        'ES': 'Número de hijos',
        'IT': 'Numero di figli',
        'DE': 'Anzahl der Kinder',
        'TR': 'Çocuk sayısı'
      },
      'teacherCard.studyingChildren': {
        'AR': 'المتمدرسون منهم',
        'FR': 'Élèves parmi eux',
        'EN': 'Studying children',
        'ES': 'Hijos estudiando',
        'IT': 'Figli che studiano',
        'DE': 'Studierende Kinder',
        'TR': 'Okuyan çocuklar'
      },
      'teacherCard.studyingInSchool': {
        'AR': 'في المؤسسة',
        'FR': 'Dans l\'établissement',
        'EN': 'In the school',
        'ES': 'En la escuela',
        'IT': 'Nella scuola',
        'DE': 'In der Schule',
        'TR': 'Okulda'
      },
      'teacherCard.point': {
        'AR': 'النقطة',
        'FR': 'Point',
        'EN': 'Point',
        'ES': 'Punto',
        'IT': 'Punto',
        'DE': 'Punkt',
        'TR': 'Puan'
      },
      'teacherCard.className': {
        'AR': 'الصنف',
        'FR': 'Classe',
        'EN': 'Class',
        'ES': 'Clase',
        'IT': 'Classe',
        'DE': 'Klasse',
        'TR': 'Sınıf'
      },
      'teacherCard.rank': {
        'AR': 'الرتبة',
        'FR': 'Grade',
        'EN': 'Rank',
        'ES': 'Rango',
        'IT': 'Grado',
        'DE': 'Rang',
        'TR': 'Rütbe'
      },
      'teacherCard.grade': {
        'AR': 'الدرجة',
        'FR': 'Niveau',
        'EN': 'Grade',
        'ES': 'Grado',
        'IT': 'Livello',
        'DE': 'Note',
        'TR': 'Derece'
      },
      'teacherCard.promotionFrequency': {
        'AR': 'وتيرة الترقية',
        'FR': 'Fréquence de promotion',
        'EN': 'Promotion frequency',
        'ES': 'Frecuencia de promoción',
        'IT': 'Frequenza di promozione',
        'DE': 'Beförderungshäufigkeit',
        'TR': 'Terfi sıklığı'
      },
      'teacherCard.workInstitution': {
        'AR': 'مؤسسة العمل',
        'FR': 'Institution de travail',
        'EN': 'Work institution',
        'ES': 'Institución de trabajo',
        'IT': 'Istituzione di lavoro',
        'DE': 'Arbeitsinstitution',
        'TR': 'Çalışma kurumu'
      },
      'teacherCard.firstAppointmentDate': {
        'AR': 'تاريخ أول تعيين',
        'FR': 'Date de première nomination',
        'EN': 'First appointment date',
        'ES': 'Fecha de primer nombramiento',
        'IT': 'Data di primo incarico',
        'DE': 'Datum der ersten Ernennung',
        'TR': 'İlk atama tarihi'
      },
      'teacherCard.tenureDate': {
        'AR': 'تاريخ الترسيم',
        'FR': 'Date de titularisation',
        'EN': 'Tenure date',
        'ES': 'Fecha de titularización',
        'IT': 'Data di stabilizzazione',
        'DE': 'Datum der Festanstellung',
        'TR': 'Kadro tarihi'
      },
      'teacherCard.lastInspectionDate': {
        'AR': 'تاريخ آخر زيارة تفتيشية',
        'FR': 'Date de dernière visite d\'inspection',
        'EN': 'Last inspection visit date',
        'ES': 'Fecha de última visita de inspección',
        'IT': 'Data dell\'ultima visita di ispezione',
        'DE': 'Datum des letzten Inspektionsbesuchs',
        'TR': 'Son teftiş ziyareti tarihi'
      },
      'teacherCard.qualification': {
        'AR': 'المؤهل العلمي',
        'FR': 'Qualification',
        'EN': 'Qualification',
        'ES': 'Calificación',
        'IT': 'Qualifica',
        'DE': 'Qualifikation',
        'TR': 'Nitelik'
      },
      'teacherCard.graduationYear': {
        'AR': 'سنة التخرج',
        'FR': 'Année de diplôme',
        'EN': 'Graduation year',
        'ES': 'Año de graduación',
        'IT': 'Anno di laurea',
        'DE': 'Abschlussjahr',
        'TR': 'Mezuniyet yılı'
      },
      'teacherCard.teachingSubject': {
        'AR': 'مادة التدريس',
        'FR': 'Matière enseignée',
        'EN': 'Teaching subject',
        'ES': 'Materia de enseñanza',
        'IT': 'Materia insegnata',
        'DE': 'Unterrichtsfach',
        'TR': 'Öğretim konusu'
      },
      'teacherCard.socialSecurityNumber': {
        'AR': 'رقم الضمان الاجتماعي',
        'FR': 'Numéro de sécurité sociale',
        'EN': 'Social security number',
        'ES': 'Número de seguridad social',
        'IT': 'Numero di previdenza sociale',
        'DE': 'Sozialversicherungsnummer',
        'TR': 'Sosyal güvenlik numarası'
      },
      'teacherCard.postalAccountNumber': {
        'AR': 'رقم الحساب البريدي',
        'FR': 'Numéro de compte postal',
        'EN': 'Postal account number',
        'ES': 'Número de cuenta postal',
        'IT': 'Numero di conto postale',
        'DE': 'Postkontonummer',
        'TR': 'Posta hesap numarası'
      },
      'teacherCard.mutualNumber': {
        'AR': 'رقم التعاضدية',
        'FR': 'Numéro de mutuelle',
        'EN': 'Mutual number',
        'ES': 'Número de mutua',
        'IT': 'Numero di mutua',
        'DE': 'Versicherungsnummer',
        'TR': 'Karşılıklı numara'
      },
      'teacherCard.effectiveFrom': {
        'AR': 'تاريخ السريان من',
        'FR': 'Date d\'entrée en vigueur à partir de',
        'EN': 'Effective from',
        'ES': 'Vigente desde',
        'IT': 'Efficace da',
        'DE': 'Gültig ab',
        'TR': 'Geçerlilik başlangıcı'
      },
      'teacherCard.effectiveTo': {
        'AR': 'إلى',
        'FR': 'Jusqu\'à',
        'EN': 'To',
        'ES': 'Hasta',
        'IT': 'Fino a',
        'DE': 'Bis',
        'TR': 'Bitiş'
      },
      'teacherCard.wilaya': {
        'AR': 'ولاية',
        'FR': 'Wilaya',
        'EN': 'Wilaya',
        'ES': 'Wilaya',
        'IT': 'Wilaya',
        'DE': 'Wilaya',
        'TR': 'Vilayet'
      },
      'teacherCard.personalPhone': {
        'AR': 'رقم الهاتف الشخصي',
        'FR': 'Numéro de téléphone personnel',
        'EN': 'Personal phone number',
        'ES': 'Número de teléfono personal',
        'IT': 'Numero di telefono personale',
        'DE': 'Persönliche Telefonnummer',
        'TR': 'Kişisel telefon numarası'
      },
      'teacherCard.idOrLicenseNumber': {
        'AR': 'رقم بطاقة التعريف / رخصة السياقة',
        'FR': 'Numéro de carte d\'identité / permis de conduire',
        'EN': 'ID card / driving license number',
        'ES': 'Número de DNI / licencia de conducir',
        'IT': 'Numero carta d\'identità / patente',
        'DE': 'Ausweisnummer / Führerscheinnummer',
        'TR': 'Kimlik kartı / ehliyet numarası'
      },
      'teacherCard.bloodType': {
        'AR': 'الزمرة الدموية',
        'FR': 'Groupe sanguin',
        'EN': 'Blood type',
        'ES': 'Tipo de sangre',
        'IT': 'Gruppo sanguigno',
        'DE': 'Blutgruppe',
        'TR': 'Kan grubu'
      },
      'teacherCard.professionalInfo': {
        'AR': 'معلومات الحالة المهنية والشهادات والمؤهلات',
        'FR': 'Informations sur le statut professionnel, les diplômes et les qualifications',
        'EN': 'Professional status, certificates and qualifications information',
        'ES': 'Información sobre estado profesional, certificados y calificaciones',
        'IT': 'Informazioni su stato professionale, certificati e qualifiche',
        'DE': 'Informationen zu beruflichem Status, Zertifikaten und Qualifikationen',
        'TR': 'Mesleki durum, sertifikalar ve nitelikler bilgisi'
      },
      'teacherCard.frame': {
        'AR': 'الإطار',
        'FR': 'Cadre',
        'EN': 'Frame',
        'ES': 'Marco',
        'IT': 'Quadro',
        'DE': 'Rahmen',
        'TR': 'Çerçeve'
      },
      'teacherCard.status': {
        'AR': 'الصفة',
        'FR': 'Statut',
        'EN': 'Status',
        'ES': 'Estado',
        'IT': 'Stato',
        'DE': 'Status',
        'TR': 'Durum'
      },
      'teacherCard.specialty': {
        'AR': 'الاختصاص',
        'FR': 'Spécialité',
        'EN': 'Specialty',
        'ES': 'Especialidad',
        'IT': 'Specialità',
        'DE': 'Spezialität',
        'TR': 'Uzmanlık'
      },
      'teacherCard.currentSchoolAppointmentDate': {
        'AR': 'تاريخ التعيين بالمؤسسة الحالية',
        'FR': 'Date de nomination dans l\'établissement actuel',
        'EN': 'Current school appointment date',
        'ES': 'Fecha de nombramiento en la escuela actual',
        'IT': 'Data di incarico nella scuola attuale',
        'DE': 'Datum der Ernennung an der aktuellen Schule',
        'TR': 'Mevcut okul atama tarihi'
      },
      'teacherCard.currentSchoolInstallationDate': {
        'AR': 'تاريخ التنصيب بها',
        'FR': 'Date d\'installation',
        'EN': 'Installation date',
        'ES': 'Fecha de instalación',
        'IT': 'Data di installazione',
        'DE': 'Installationsdatum',
        'TR': 'Kurulum tarihi'
      },
      'teacherCard.currentGradeLevel': {
        'AR': 'الدرجة الحالية',
        'FR': 'Niveau actuel',
        'EN': 'Current grade level',
        'ES': 'Nivel de grado actual',
        'IT': 'Livello attuale',
        'DE': 'Aktuelles Niveau',
        'TR': 'Mevcut derece seviyesi'
      },
      'teacherCard.currentGradeEffectiveDate': {
        'AR': 'تاريخ سريان مفعولها',
        'FR': 'Date d\'entrée en vigueur',
        'EN': 'Effective date',
        'ES': 'Fecha de vigencia',
        'IT': 'Data di efficacia',
        'DE': 'Gültigkeitsdatum',
        'TR': 'Geçerlilik tarihi'
      },
      'teacherCard.lastInspectionScore': {
        'AR': 'نقطة آخر تفتيش',
        'FR': 'Note de la dernière inspection',
        'EN': 'Last inspection score',
        'ES': 'Puntuación de última inspección',
        'IT': 'Punteggio ultima ispezione',
        'DE': 'Punktzahl der letzten Inspektion',
        'TR': 'Son teftiş puanı'
      },
      'teacherCard.degrees': {
        'AR': 'الشهادات المتحصّل عليها',
        'FR': 'Diplômes obtenus',
        'EN': 'Degrees obtained',
        'ES': 'Títulos obtenidos',
        'IT': 'Titoli ottenuti',
        'DE': 'Erworbene Abschlüsse',
        'TR': 'Alınan dereceler'
      },
      'teacherCard.degree': {
        'AR': 'الشهادة',
        'FR': 'Diplôme',
        'EN': 'Degree',
        'ES': 'Título',
        'IT': 'Titolo',
        'DE': 'Abschluss',
        'TR': 'Derece'
      },
      'teacherCard.institution': {
        'AR': 'المؤسسة',
        'FR': 'Institution',
        'EN': 'Institution',
        'ES': 'Institución',
        'IT': 'Istituzione',
        'DE': 'Institution',
        'TR': 'Kurum'
      },
      'teacherCard.year': {
        'AR': 'السنة',
        'FR': 'Année',
        'EN': 'Year',
        'ES': 'Año',
        'IT': 'Anno',
        'DE': 'Jahr',
        'TR': 'Yıl'
      },
      'teacherCard.directorateEducation': {
        'AR': 'مديرية التربية لولاية',
        'FR': 'Direction de l\'éducation de la wilaya',
        'EN': 'Education directorate of wilaya',
        'ES': 'Dirección de educación de la wilaya',
        'IT': 'Direzione dell\'istruzione della wilaya',
        'DE': 'Bildungsdirektion der Wilaya',
        'TR': 'Vilayet eğitim müdürlüğü'
      },
      'teacherCard.firstAppointmentInEducation': {
        'AR': 'تاريخ أول تعيين في التعليم',
        'FR': 'Date de première nomination dans l\'enseignement',
        'EN': 'First appointment date in education',
        'ES': 'Fecha de primer nombramiento en educación',
        'IT': 'Data di primo incarico nell\'istruzione',
        'DE': 'Datum der ersten Ernennung im Bildungswesen',
        'TR': 'Eğitimde ilk atama tarihi'
      },

      // Certificate Generator
      'certificate.title': {
        'AR': 'إصدار شهادات التقدير',
        'FR': 'Émission de certificats de mérite',
        'EN': 'Issue Certificates of Merit',
        'ES': 'Emitir certificados de mérito',
        'IT': 'Emettere certificati di merito',
        'DE': 'Verdienstzertifikate ausstellen',
        'TR': 'Başarı Sertifikaları Düzenle'
      },
      'certificate.description': {
        'AR': 'اختر التلميذ والقالب وعدّل النص ثم حمّل الشهادة كهاتف PDF.',
        'FR': 'Sélectionnez l\'élève et le modèle, modifiez le texte puis téléchargez le certificat en PDF.',
        'EN': 'Select the student and template, edit the text, then download the certificate as PDF.',
        'ES': 'Seleccione el estudiante y la plantilla, edite el texto y luego descargue el certificado como PDF.',
        'IT': 'Seleziona lo studente e il modello, modifica il testo, poi scarica il certificato come PDF.',
        'DE': 'Wählen Sie den Schüler und die Vorlage aus, bearbeiten Sie den Text und laden Sie dann das Zertifikat als PDF herunter.',
        'TR': 'Öğrenciyi ve şablonu seçin, metni düzenleyin, ardından sertifikayı PDF olarak indirin.'
      },
      'certificate.class': {
        'AR': 'القسم',
        'FR': 'Classe',
        'EN': 'Class',
        'ES': 'Clase',
        'IT': 'Classe',
        'DE': 'Klasse',
        'TR': 'Sınıf'
      },
      'certificate.student': {
        'AR': 'التلميذ',
        'FR': 'Élève',
        'EN': 'Student',
        'ES': 'Estudiante',
        'IT': 'Studente',
        'DE': 'Schüler',
        'TR': 'Öğrenci'
      },
      'certificate.loading': {
        'AR': 'جار التحميل...',
        'FR': 'Chargement...',
        'EN': 'Loading...',
        'ES': 'Cargando...',
        'IT': 'Caricamento...',
        'DE': 'Wird geladen...',
        'TR': 'Yükleniyor...'
      },
      'certificate.mainText': {
        'AR': 'النص الرئيسي للشهادة',
        'FR': 'Texte principal du certificat',
        'EN': 'Certificate main text',
        'ES': 'Texto principal del certificado',
        'IT': 'Testo principale del certificato',
        'DE': 'Haupttext des Zertifikats',
        'TR': 'Sertifika ana metni'
      },
      'certificate.reason': {
        'AR': 'سبب التقدير',
        'FR': 'Raison de la distinction',
        'EN': 'Reason for recognition',
        'ES': 'Razón del reconocimiento',
        'IT': 'Motivo del riconoscimento',
        'DE': 'Grund für die Anerkennung',
        'TR': 'Tanınma nedeni'
      },
      'certificate.issueDate': {
        'AR': 'تاريخ الإصدار',
        'FR': 'Date d\'émission',
        'EN': 'Issue date',
        'ES': 'Fecha de emisión',
        'IT': 'Data di emissione',
        'DE': 'Ausstellungsdatum',
        'TR': 'Düzenleme tarihi'
      },
      'certificate.academicYear': {
        'AR': 'السنة الدراسية',
        'FR': 'Année scolaire',
        'EN': 'Academic year',
        'ES': 'Año académico',
        'IT': 'Anno accademico',
        'DE': 'Schuljahr',
        'TR': 'Akademik yıl'
      },
      'certificate.signature': {
        'AR': 'توقيع الأستاذ',
        'FR': 'Signature du professeur',
        'EN': 'Teacher signature',
        'ES': 'Firma del profesor',
        'IT': 'Firma dell\'insegnante',
        'DE': 'Unterschrift des Lehrers',
        'TR': 'Öğretmen imzası'
      },
      'certificate.issuing': {
        'AR': 'جارٍ الإصدار...',
        'FR': 'Émission en cours...',
        'EN': 'Issuing...',
        'ES': 'Emitiendo...',
        'IT': 'Emissione in corso...',
        'DE': 'Wird ausgestellt...',
        'TR': 'Düzenleniyor...'
      },
      'certificate.issue': {
        'AR': 'إصدار الشهادة',
        'FR': 'Émettre le certificat',
        'EN': 'Issue certificate',
        'ES': 'Emitir certificado',
        'IT': 'Emettere certificato',
        'DE': 'Zertifikat ausstellen',
        'TR': 'Sertifika düzenle'
      },
      'certificate.exporting': {
        'AR': 'يُجهّز PDF...',
        'FR': 'Préparation du PDF...',
        'EN': 'Preparing PDF...',
        'ES': 'Preparando PDF...',
        'IT': 'Preparazione PDF...',
        'DE': 'PDF wird vorbereitet...',
        'TR': 'PDF hazırlanıyor...'
      },
      'certificate.export': {
        'AR': 'تصدير PDF',
        'FR': 'Exporter en PDF',
        'EN': 'Export PDF',
        'ES': 'Exportar PDF',
        'IT': 'Esporta PDF',
        'DE': 'PDF exportieren',
        'TR': 'PDF dışa aktar'
      },
      'certificate.preview': {
        'AR': 'معاينة الشهادة',
        'FR': 'Aperçu du certificat',
        'EN': 'Certificate preview',
        'ES': 'Vista previa del certificado',
        'IT': 'Anteprima certificato',
        'DE': 'Zertifikat-Vorschau',
        'TR': 'Sertifika önizleme'
      },
      'certificate.certificateTitle': {
        'AR': 'شهادة تقدير',
        'FR': 'Certificat de mérite',
        'EN': 'Certificate of Merit',
        'ES': 'Certificado de mérito',
        'IT': 'Certificato di merito',
        'DE': 'Verdienstzertifikat',
        'TR': 'Başarı Sertifikası'
      },
      'certificate.awardedTo': {
        'AR': 'تُمنح هذه الشهادة إلى الطالب(ة)',
        'FR': 'Ce certificat est décerné à l\'élève',
        'EN': 'This certificate is awarded to the student',
        'ES': 'Este certificado se otorga al estudiante',
        'IT': 'Questo certificato è assegnato allo studente',
        'DE': 'Dieses Zertifikat wird dem Schüler verliehen',
        'TR': 'Bu sertifika öğrenciye verilir'
      },
      'certificate.inRecognition': {
        'AR': 'وذلك تقديراً:',
        'FR': 'En reconnaissance de:',
        'EN': 'In recognition of:',
        'ES': 'En reconocimiento de:',
        'IT': 'In riconoscimento di:',
        'DE': 'In Anerkennung von:',
        'TR': 'Tanınma nedeniyle:'
      },
      'certificate.excellence': {
        'AR': 'تميز',
        'FR': 'Excellence',
        'EN': 'Excellence',
        'ES': 'Excelencia',
        'IT': 'Eccellenza',
        'DE': 'Exzellenz',
        'TR': 'Mükemmellik'
      },
      'certificate.success': {
        'AR': 'تم إصدار الشهادة بنجاح',
        'FR': 'Certificat émis avec succès',
        'EN': 'Certificate issued successfully',
        'ES': 'Certificado emitido con éxito',
        'IT': 'Certificato emesso con successo',
        'DE': 'Zertifikat erfolgreich ausgestellt',
        'TR': 'Sertifika başarıyla düzenlendi'
      },
      'certificate.error': {
        'AR': 'تعذر إصدار الشهادة، أعد المحاولة',
        'FR': 'Impossible d\'émettre le certificat, réessayez',
        'EN': 'Failed to issue certificate, please try again',
        'ES': 'Error al emitir certificado, por favor intente de nuevo',
        'IT': 'Impossibile emettere certificato, riprova',
        'DE': 'Zertifikat konnte nicht ausgestellt werden, bitte versuchen Sie es erneut',
        'TR': 'Sertifika düzenlenemedi, lütfen tekrar deneyin'
      },
      'certificate.exportError': {
        'AR': 'تعذر تصدير PDF',
        'FR': 'Impossible d\'exporter le PDF',
        'EN': 'Failed to export PDF',
        'ES': 'Error al exportar PDF',
        'IT': 'Impossibile esportare PDF',
        'DE': 'PDF konnte nicht exportiert werden',
        'TR': 'PDF dışa aktarılamadı'
      },

      // Report Generator
      'report.setup': {
        'AR': 'إعداد التقرير',
        'FR': 'Configuration du rapport',
        'EN': 'Report setup',
        'ES': 'Configuración del informe',
        'IT': 'Configurazione rapporto',
        'DE': 'Bericht einrichten',
        'TR': 'Rapor ayarları'
      },
      'report.selectClass': {
        'AR': 'اختر القسم',
        'FR': 'Sélectionner la classe',
        'EN': 'Select class',
        'ES': 'Seleccionar clase',
        'IT': 'Seleziona classe',
        'DE': 'Klasse auswählen',
        'TR': 'Sınıf seç'
      },
      'report.selectStudent': {
        'AR': 'اختر التلميذ',
        'FR': 'Sélectionner l\'élève',
        'EN': 'Select student',
        'ES': 'Seleccionar estudiante',
        'IT': 'Seleziona studente',
        'DE': 'Schüler auswählen',
        'TR': 'Öğrenci seç'
      },
      'report.type': {
        'AR': 'نوع التقرير',
        'FR': 'Type de rapport',
        'EN': 'Report type',
        'ES': 'Tipo de informe',
        'IT': 'Tipo di rapporto',
        'DE': 'Berichtstyp',
        'TR': 'Rapor türü'
      },
      'report.typeAcademic': {
        'AR': 'تقرير أكاديمي',
        'FR': 'Rapport académique',
        'EN': 'Academic report',
        'ES': 'Informe académico',
        'IT': 'Rapporto accademico',
        'DE': 'Akademischer Bericht',
        'TR': 'Akademik rapor'
      },
      'report.typeBehavioral': {
        'AR': 'تقرير سلوكي',
        'FR': 'Rapport comportemental',
        'EN': 'Behavioral report',
        'ES': 'Informe de comportamiento',
        'IT': 'Rapporto comportamentale',
        'DE': 'Verhaltensbericht',
        'TR': 'Davranış raporu'
      },
      'report.typeFollowUp': {
        'AR': 'تقرير متابعة خاص',
        'FR': 'Rapport de suivi spécial',
        'EN': 'Special follow-up report',
        'ES': 'Informe de seguimiento especial',
        'IT': 'Rapporto di follow-up speciale',
        'DE': 'Besonderer Nachfolgebericht',
        'TR': 'Özel takip raporu'
      },
      'report.typeCheating': {
        'AR': 'تقرير غش',
        'FR': 'Rapport de tricherie',
        'EN': 'Cheating report',
        'ES': 'Informe de trampa',
        'IT': 'Rapporto di imbroglio',
        'DE': 'Betrugsbericht',
        'TR': 'Kopya raporu'
      },
      'report.reason': {
        'AR': 'سبب التقرير',
        'FR': 'Raison du rapport',
        'EN': 'Report reason',
        'ES': 'Razón del informe',
        'IT': 'Motivo del rapporto',
        'DE': 'Berichtsgrund',
        'TR': 'Rapor nedeni'
      },
      'report.selectReason': {
        'AR': 'اختر السبب',
        'FR': 'Sélectionner la raison',
        'EN': 'Select reason',
        'ES': 'Seleccionar razón',
        'IT': 'Seleziona motivo',
        'DE': 'Grund auswählen',
        'TR': 'Neden seç'
      },
      'report.content': {
        'AR': 'نص التقرير (يتم توليده تلقائياً ويمكن تعديله)',
        'FR': 'Contenu du rapport (généré automatiquement et modifiable)',
        'EN': 'Report content (auto-generated and editable)',
        'ES': 'Contenido del informe (generado automáticamente y editable)',
        'IT': 'Contenuto rapporto (generato automaticamente e modificabile)',
        'DE': 'Berichtsinhalt (automatisch generiert und bearbeitbar)',
        'TR': 'Rapor içeriği (otomatik oluşturulur ve düzenlenebilir)'
      },
      'report.additionalDetails': {
        'AR': 'وصف وتفاصيل إضافية',
        'FR': 'Description et détails supplémentaires',
        'EN': 'Additional description and details',
        'ES': 'Descripción y detalles adicionales',
        'IT': 'Descrizione e dettagli aggiuntivi',
        'DE': 'Zusätzliche Beschreibung und Details',
        'TR': 'Ek açıklama ve detaylar'
      },
      'report.additionalDetailsPlaceholder': {
        'AR': 'أضف ملاحظات شخصية أو أمثلة محددة...',
        'FR': 'Ajoutez des notes personnelles ou des exemples spécifiques...',
        'EN': 'Add personal notes or specific examples...',
        'ES': 'Agregue notas personales o ejemplos específicos...',
        'IT': 'Aggiungi note personali o esempi specifici...',
        'DE': 'Persönliche Notizen oder spezifische Beispiele hinzufügen...',
        'TR': 'Kişisel notlar veya belirli örnekler ekleyin...'
      },
      'report.recommendations': {
        'AR': 'التوصيات والإجراءات المقترحة',
        'FR': 'Recommandations et mesures proposées',
        'EN': 'Recommendations and proposed actions',
        'ES': 'Recomendaciones y acciones propuestas',
        'IT': 'Raccomandazioni e azioni proposte',
        'DE': 'Empfehlungen und vorgeschlagene Maßnahmen',
        'TR': 'Öneriler ve önerilen eylemler'
      },
      'report.recommendationsPlaceholder': {
        'AR': 'اكتب التوصيات الموجهة للتلميذ أو الولي...',
        'FR': 'Écrivez les recommandations adressées à l\'élève ou au tuteur...',
        'EN': 'Write recommendations addressed to the student or parent...',
        'ES': 'Escriba recomendaciones dirigidas al estudiante o padre...',
        'IT': 'Scrivi raccomandazioni rivolte allo studente o al genitore...',
        'DE': 'Schreiben Sie Empfehlungen an den Schüler oder Elternteil...',
        'TR': 'Öğrenciye veya veliye yönelik öneriler yazın...'
      },
      'report.saving': {
        'AR': 'جارٍ الحفظ...',
        'FR': 'Enregistrement en cours...',
        'EN': 'Saving...',
        'ES': 'Guardando...',
        'IT': 'Salvataggio in corso...',
        'DE': 'Wird gespeichert...',
        'TR': 'Kaydediliyor...'
      },
      'report.saveAndIssue': {
        'AR': 'إصدار وحفظ التقرير',
        'FR': 'Émettre et enregistrer le rapport',
        'EN': 'Issue and save report',
        'ES': 'Emitir y guardar informe',
        'IT': 'Emettere e salvare rapporto',
        'DE': 'Bericht ausstellen und speichern',
        'TR': 'Raporu düzenle ve kaydet'
      },
      'report.preview': {
        'AR': 'معاينة التقرير',
        'FR': 'Aperçu du rapport',
        'EN': 'Report preview',
        'ES': 'Vista previa del informe',
        'IT': 'Anteprima rapporto',
        'DE': 'Bericht-Vorschau',
        'TR': 'Rapor önizleme'
      },
      'report.republic': {
        'AR': 'الجمهورية الجزائرية الديمقراطية الشعبية',
        'FR': 'République Algérienne Démocratique et Populaire',
        'EN': 'People\'s Democratic Republic of Algeria',
        'ES': 'República Argelina Democrática y Popular',
        'IT': 'Repubblica Algerina Democratica e Popolare',
        'DE': 'Demokratische Volksrepublik Algerien',
        'TR': 'Cezayir Demokratik Halk Cumhuriyeti'
      },
      'report.ministry': {
        'AR': 'وزارة التربية الوطنية',
        'FR': 'Ministère de l\'Éducation Nationale',
        'EN': 'Ministry of National Education',
        'ES': 'Ministerio de Educación Nacional',
        'IT': 'Ministero dell\'Educazione Nazionale',
        'DE': 'Ministerium für Nationale Bildung',
        'TR': 'Milli Eğitim Bakanlığı'
      },
      'report.school': {
        'AR': 'المؤسسة:',
        'FR': 'Établissement:',
        'EN': 'School:',
        'ES': 'Escuela:',
        'IT': 'Scuola:',
        'DE': 'Schule:',
        'TR': 'Okul:'
      },
      'report.studentName': {
        'AR': 'اسم التلميذ:',
        'FR': 'Nom de l\'élève:',
        'EN': 'Student name:',
        'ES': 'Nombre del estudiante:',
        'IT': 'Nome studente:',
        'DE': 'Schülername:',
        'TR': 'Öğrenci adı:'
      },
      'report.class': {
        'AR': 'القسم:',
        'FR': 'Classe:',
        'EN': 'Class:',
        'ES': 'Clase:',
        'IT': 'Classe:',
        'DE': 'Klasse:',
        'TR': 'Sınıf:'
      },
      'report.teacher': {
        'AR': 'الأستاذ:',
        'FR': 'Professeur:',
        'EN': 'Teacher:',
        'ES': 'Profesor:',
        'IT': 'Insegnante:',
        'DE': 'Lehrer:',
        'TR': 'Öğretmen:'
      },
      'report.date': {
        'AR': 'التاريخ:',
        'FR': 'Date:',
        'EN': 'Date:',
        'ES': 'Fecha:',
        'IT': 'Data:',
        'DE': 'Datum:',
        'TR': 'Tarih:'
      },
      'report.reportDate': {
        'AR': 'تاريخ التقرير:',
        'FR': 'Date du rapport:',
        'EN': 'Report date:',
        'ES': 'Fecha del informe:',
        'IT': 'Data del rapporto:',
        'DE': 'Berichtsdatum:',
        'TR': 'Rapor tarihi:'
      },
      'report.additionalNotes': {
        'AR': 'ملاحظات إضافية:',
        'FR': 'Notes supplémentaires:',
        'EN': 'Additional notes:',
        'ES': 'Notas adicionales:',
        'IT': 'Note aggiuntive:',
        'DE': 'Zusätzliche Notizen:',
        'TR': 'Ek notlar:'
      },
      'report.recommendationsTitle': {
        'AR': 'التوصيات والإجراءات:',
        'FR': 'Recommandations et mesures:',
        'EN': 'Recommendations and actions:',
        'ES': 'Recomendaciones y acciones:',
        'IT': 'Raccomandazioni e azioni:',
        'DE': 'Empfehlungen und Maßnahmen:',
        'TR': 'Öneriler ve eylemler:'
      },
      'report.teacherSignature': {
        'AR': 'توقيع الأستاذ',
        'FR': 'Signature du professeur',
        'EN': 'Teacher signature',
        'ES': 'Firma del profesor',
        'IT': 'Firma dell\'insegnante',
        'DE': 'Unterschrift des Lehrers',
        'TR': 'Öğretmen imzası'
      },
      'report.parentSignature': {
        'AR': 'توقيع الولي / الإدارة',
        'FR': 'Signature du tuteur / Administration',
        'EN': 'Parent / Administration signature',
        'ES': 'Firma del padre / Administración',
        'IT': 'Firma genitore / Amministrazione',
        'DE': 'Unterschrift Elternteil / Verwaltung',
        'TR': 'Veli / Yönetim imzası'
      },
      'report.titleAcademic': {
        'AR': 'تقرير تقييم أكاديمي',
        'FR': 'Rapport d\'évaluation académique',
        'EN': 'Academic evaluation report',
        'ES': 'Informe de evaluación académica',
        'IT': 'Rapporto di valutazione accademica',
        'DE': 'Akademischer Bewertungsbericht',
        'TR': 'Akademik değerlendirme raporu'
      },
      'report.titleBehavioral': {
        'AR': 'تقرير سلوكي',
        'FR': 'Rapport comportemental',
        'EN': 'Behavioral report',
        'ES': 'Informe de comportamiento',
        'IT': 'Rapporto comportamentale',
        'DE': 'Verhaltensbericht',
        'TR': 'Davranış raporu'
      },
      'report.titleCheating': {
        'AR': 'تقرير مخالفة (غش)',
        'FR': 'Rapport d\'infraction (tricherie)',
        'EN': 'Violation report (cheating)',
        'ES': 'Informe de infracción (trampa)',
        'IT': 'Rapporto di violazione (imbroglio)',
        'DE': 'Verstoßbericht (Betrug)',
        'TR': 'İhlal raporu (kopya)'
      },
      'report.titleFollowUp': {
        'AR': 'تقرير متابعة تربوية',
        'FR': 'Rapport de suivi pédagogique',
        'EN': 'Educational follow-up report',
        'ES': 'Informe de seguimiento educativo',
        'IT': 'Rapporto di follow-up educativo',
        'DE': 'Pädagogischer Nachfolgebericht',
        'TR': 'Eğitim takip raporu'
      },
      'report.success': {
        'AR': 'تم حفظ التقرير بنجاح',
        'FR': 'Rapport enregistré avec succès',
        'EN': 'Report saved successfully',
        'ES': 'Informe guardado con éxito',
        'IT': 'Rapporto salvato con successo',
        'DE': 'Bericht erfolgreich gespeichert',
        'TR': 'Rapor başarıyla kaydedildi'
      },
      'report.error': {
        'AR': 'حدث خطأ أثناء حفظ التقرير',
        'FR': 'Erreur lors de l\'enregistrement du rapport',
        'EN': 'Error saving report',
        'ES': 'Error al guardar informe',
        'IT': 'Errore nel salvare il rapporto',
        'DE': 'Fehler beim Speichern des Berichts',
        'TR': 'Rapor kaydedilirken hata oluştu'
      },

      // Login
      'login.title': {
        'AR': 'نظام إدارة التدريس',
        'FR': 'Système de gestion pédagogique',
        'EN': 'Teaching Management System',
        'ES': 'Sistema de gestión de enseñanza',
        'IT': 'Sistema di gestione didattica',
        'DE': 'Lehrverwaltungssystem',
        'TR': 'Öğretim Yönetim Sistemi'
      },
      'login.subtitle': {
        'AR': 'تسجيل الدخول إلى حسابك',
        'FR': 'Connectez-vous à votre compte',
        'EN': 'Sign in to your account',
        'ES': 'Inicie sesión en su cuenta',
        'IT': 'Accedi al tuo account',
        'DE': 'Melden Sie sich in Ihrem Konto an',
        'TR': 'Hesabınıza giriş yapın'
      },
      'login.username': {
        'AR': 'اسم المستخدم أو البريد الإلكتروني',
        'FR': 'Nom d\'utilisateur ou e-mail',
        'EN': 'Username or email',
        'ES': 'Nombre de usuario o correo electrónico',
        'IT': 'Nome utente o email',
        'DE': 'Benutzername oder E-Mail',
        'TR': 'Kullanıcı adı veya e-posta'
      },
      'login.usernamePlaceholder': {
        'AR': 'أدخل اسم المستخدم أو البريد الإلكتروني',
        'FR': 'Entrez le nom d\'utilisateur ou l\'e-mail',
        'EN': 'Enter username or email',
        'ES': 'Ingrese nombre de usuario o correo electrónico',
        'IT': 'Inserisci nome utente o email',
        'DE': 'Benutzername oder E-Mail eingeben',
        'TR': 'Kullanıcı adı veya e-posta girin'
      },
      'login.password': {
        'AR': 'كلمة المرور',
        'FR': 'Mot de passe',
        'EN': 'Password',
        'ES': 'Contraseña',
        'IT': 'Password',
        'DE': 'Passwort',
        'TR': 'Şifre'
      },
      'login.passwordPlaceholder': {
        'AR': 'أدخل كلمة المرور',
        'FR': 'Entrez le mot de passe',
        'EN': 'Enter password',
        'ES': 'Ingrese la contraseña',
        'IT': 'Inserisci password',
        'DE': 'Passwort eingeben',
        'TR': 'Şifreyi girin'
      },
      'login.submit': {
        'AR': 'تسجيل الدخول',
        'FR': 'Se connecter',
        'EN': 'Sign in',
        'ES': 'Iniciar sesión',
        'IT': 'Accedi',
        'DE': 'Anmelden',
        'TR': 'Giriş yap'
      },
      'login.loading': {
        'AR': 'جاري تسجيل الدخول...',
        'FR': 'Connexion en cours...',
        'EN': 'Signing in...',
        'ES': 'Iniciando sesión...',
        'IT': 'Accesso in corso...',
        'DE': 'Wird angemeldet...',
        'TR': 'Giriş yapılıyor...'
      },
      'login.footer': {
        'AR': '© 2024 نظام إدارة التدريس. جميع الحقوق محفوظة.',
        'FR': '© 2024 Système de gestion pédagogique. Tous droits réservés.',
        'EN': '© 2024 Teaching Management System. All rights reserved.',
        'ES': '© 2024 Sistema de gestión de enseñanza. Todos los derechos reservados.',
        'IT': '© 2024 Sistema di gestione didattica. Tutti i diritti riservati.',
        'DE': '© 2024 Lehrverwaltungssystem. Alle Rechte vorbehalten.',
        'TR': '© 2024 Öğretim Yönetim Sistemi. Tüm hakları saklıdır.'
      },
      'login.error': {
        'AR': 'خطأ في تسجيل الدخول. الرجاء التحقق من البيانات المدخلة.',
        'FR': 'Erreur de connexion. Veuillez vérifier les données saisies.',
        'EN': 'Login error. Please check the entered data.',
        'ES': 'Error de inicio de sesión. Por favor verifique los datos ingresados.',
        'IT': 'Errore di accesso. Si prega di verificare i dati inseriti.',
        'DE': 'Anmeldefehler. Bitte überprüfen Sie die eingegebenen Daten.',
        'TR': 'Giriş hatası. Lütfen girilen verileri kontrol edin.'
      },

      // Header additional translations
      'header.notificationsTitle': {
        'AR': 'الإشعارات',
        'FR': 'Notifications',
        'EN': 'Notifications',
        'ES': 'Notificaciones',
        'IT': 'Notifiche',
        'DE': 'Benachrichtigungen',
        'TR': 'Bildirimler'
      },
      'header.refreshNotifications': {
        'AR': 'تحديث الإشعارات',
        'FR': 'Actualiser les notifications',
        'EN': 'Refresh notifications',
        'ES': 'Actualizar notificaciones',
        'IT': 'Aggiorna notifiche',
        'DE': 'Benachrichtigungen aktualisieren',
        'TR': 'Bildirimleri yenile'
      },
      'header.adminPanel': {
        'AR': 'لوحة التحكم',
        'FR': 'Panneau d\'administration',
        'EN': 'Admin panel',
        'ES': 'Panel de administración',
        'IT': 'Pannello amministratore',
        'DE': 'Administrationspanel',
        'TR': 'Yönetici paneli'
      },
      'header.logout': {
        'AR': 'تسجيل الخروج',
        'FR': 'Se déconnecter',
        'EN': 'Logout',
        'ES': 'Cerrar sesión',
        'IT': 'Esci',
        'DE': 'Abmelden',
        'TR': 'Çıkış yap'
      },
      'header.roleAdmin': {
        'AR': 'مسؤول',
        'FR': 'Administrateur',
        'EN': 'Admin',
        'ES': 'Administrador',
        'IT': 'Amministratore',
        'DE': 'Administrator',
        'TR': 'Yönetici'
      },
      'header.roleTeacher': {
        'AR': 'أستاذ',
        'FR': 'Professeur',
        'EN': 'Teacher',
        'ES': 'Profesor',
        'IT': 'Insegnante',
        'DE': 'Lehrer',
        'TR': 'Öğretmen'
      },
      'header.userPhoto': {
        'AR': 'صورة المستخدم',
        'FR': 'Photo de l\'utilisateur',
        'EN': 'User photo',
        'ES': 'Foto del usuario',
        'IT': 'Foto utente',
        'DE': 'Benutzerfoto',
        'TR': 'Kullanıcı fotoğrafı'
      },
      // Admin
      'admin.description': {
        'AR': 'إدارة المستخدمين والصلاحيات والنظام',
        'FR': 'Gérer les utilisateurs, les autorisations et le système',
        'EN': 'Manage users, permissions and system settings',
        'ES': 'Gestionar usuarios, permisos y la configuración del sistema',
        'IT': 'Gestire utenti, permessi e impostazioni di sistema',
        'DE': 'Benutzer, Berechtigungen und Systemeinstellungen verwalten',
        'TR': 'Kullanıcıları, izinleri ve sistem ayarlarını yönetin'
      },
      'admin.tabs.users': {
        'AR': 'إدارة المستخدمين',
        'FR': 'Gestion des utilisateurs',
        'EN': 'User management',
        'ES': 'Gestión de usuarios',
        'IT': 'Gestione utenti',
        'DE': 'Benutzerverwaltung',
        'TR': 'Kullanıcı yönetimi'
      },
      'admin.tabs.modules': {
        'AR': 'إدارة الصلاحيات',
        'FR': 'Gestion des modules et autorisations',
        'EN': 'Module permissions',
        'ES': 'Permisos de módulos',
        'IT': 'Permessi dei moduli',
        'DE': 'Modulberechtigungen',
        'TR': 'Modül yetkileri'
      },
      'admin.tabs.monitoring': {
        'AR': 'المتابعة والإشراف',
        'FR': 'Suivi et supervision',
        'EN': 'Monitoring & supervision',
        'ES': 'Seguimiento y supervisión',
        'IT': 'Monitoraggio e supervisione',
        'DE': 'Überwachung & Aufsicht',
        'TR': 'İzleme ve denetim'
      },
      'admin.tabs.subscriptions': {
        'AR': 'إدارة الاشتراكات',
        'FR': 'Gestion des abonnements',
        'EN': 'Subscription management',
        'ES': 'Gestión de suscripciones',
        'IT': 'Gestione abbonamenti',
        'DE': 'Abonnementverwaltung',
        'TR': 'Abonelik yönetimi'
      },
      // Module access
      'moduleAccess.title': {
        'AR': 'إدارة صلاحيات الوحدات',
        'FR': 'Gestion des autorisations des modules',
        'EN': 'Module permissions management',
        'ES': 'Gestión de permisos de módulos',
        'IT': 'Gestione dei permessi dei moduli',
        'DE': 'Verwaltung der Modulberechtigungen',
        'TR': 'Modül yetkilerini yönetme'
      },
      'moduleAccess.selectTeacher': {
        'AR': 'اختر الأستاذ',
        'FR': 'Sélectionner l\'enseignant',
        'EN': 'Select teacher',
        'ES': 'Seleccionar profesor',
        'IT': 'Seleziona insegnante',
        'DE': 'Lehrer auswählen',
        'TR': 'Öğretmen seç'
      },
      'moduleAccess.enabledModulesCount': {
        'AR': 'وحدة مفعلة',
        'FR': 'modules activés',
        'EN': 'enabled modules',
        'ES': 'módulos activados',
        'IT': 'moduli abilitati',
        'DE': 'aktivierte Module',
        'TR': 'etkin modül'
      },
      'moduleAccess.noTeachers': {
        'AR': 'لا يوجد أساتذة',
        'FR': 'Aucun enseignant',
        'EN': 'No teachers found',
        'ES': 'No se encontraron profesores',
        'IT': 'Nessun insegnante trovato',
        'DE': 'Keine Lehrer gefunden',
        'TR': 'Öğretmen bulunamadı'
      },
      'moduleAccess.permissionsFor': {
        'AR': 'صلاحيات',
        'FR': 'Autorisations pour',
        'EN': 'Permissions for',
        'ES': 'Permisos para',
        'IT': 'Permessi per',
        'DE': 'Berechtigungen für',
        'TR': 'Yetkiler:'
      },
      'moduleAccess.enableAll': {
        'AR': 'تفعيل الكل',
        'FR': 'Tout activer',
        'EN': 'Enable all',
        'ES': 'Activar todo',
        'IT': 'Abilita tutto',
        'DE': 'Alles aktivieren',
        'TR': 'Hepsini etkinleştir'
      },
      'moduleAccess.disableAll': {
        'AR': 'إلغاء الكل',
        'FR': 'Tout désactiver',
        'EN': 'Disable all',
        'ES': 'Desactivar todo',
        'IT': 'Disabilita tutto',
        'DE': 'Alles deaktivieren',
        'TR': 'Hepsini devre dışı bırak'
      },
      'moduleAccess.selectTeacherHint': {
        'AR': 'الرجاء اختيار أستاذ من القائمة لعرض وتعديل صلاحياته',
        'FR': 'Veuillez sélectionner un enseignant dans la liste pour afficher et modifier ses autorisations.',
        'EN': 'Please select a teacher from the list to view and edit their permissions.',
        'ES': 'Seleccione un profesor de la lista para ver y editar sus permisos.',
        'IT': 'Seleziona un insegnante dall\'elenco per visualizzare e modificare i suoi permessi.',
        'DE': 'Bitte wählen Sie einen Lehrer aus der Liste, um seine Berechtigungen anzuzeigen und zu bearbeiten.',
        'TR': 'Yetkilerini görüntülemek ve düzenlemek için lütfen listeden bir öğretmen seçin.'
      },
      // Module access - module labels (per key)
      'moduleAccess.module.classes.name': {
        'AR': 'الأقسام',
        'FR': 'Classes',
        'EN': 'Classes',
        'ES': 'Clases',
        'IT': 'Classi',
        'DE': 'Klassen',
        'TR': 'Sınıflar'
      },
      'moduleAccess.module.classes.description': {
        'AR': 'إدارة الأقسام والصفوف',
        'FR': 'Gérer les classes et les niveaux',
        'EN': 'Manage classes and grades',
        'ES': 'Gestionar clases y niveles',
        'IT': 'Gestire classi e livelli',
        'DE': 'Klassen und Stufen verwalten',
        'TR': 'Sınıf ve seviyeleri yönet'
      },
      'moduleAccess.module.students.name': {
        'AR': 'الطلاب',
        'FR': 'Élèves',
        'EN': 'Students',
        'ES': 'Estudiantes',
        'IT': 'Studenti',
        'DE': 'Schüler',
        'TR': 'Öğrenciler'
      },
      'moduleAccess.module.students.description': {
        'AR': 'إدارة بيانات الطلاب',
        'FR': 'Gérer les informations des élèves',
        'EN': 'Manage student data',
        'ES': 'Gestionar datos de estudiantes',
        'IT': 'Gestire i dati degli studenti',
        'DE': 'Schülere Daten verwalten',
        'TR': 'Öğrenci verilerini yönet'
      },
      'moduleAccess.module.attendance.name': {
        'AR': 'الحضور والغياب',
        'FR': 'Présence et absences',
        'EN': 'Attendance',
        'ES': 'Asistencia',
        'IT': 'Presenze',
        'DE': 'Anwesenheit',
        'TR': 'Devam'
      },
      'moduleAccess.module.attendance.description': {
        'AR': 'تسجيل حضور الطلاب',
        'FR': 'Enregistrer la présence des élèves',
        'EN': 'Record student attendance',
        'ES': 'Registrar la asistencia de los estudiantes',
        'IT': 'Registrare la presenza degli studenti',
        'DE': 'Anwesenheit der Schüler erfassen',
        'TR': 'Öğrenci yoklamasını kaydet'
      },
      'moduleAccess.module.grades.name': {
        'AR': 'الدرجات',
        'FR': 'Notes',
        'EN': 'Grades',
        'ES': 'Calificaciones',
        'IT': 'Voti',
        'DE': 'Noten',
        'TR': 'Notlar'
      },
      'moduleAccess.module.grades.description': {
        'AR': 'تسجيل وتتبع درجات الطلاب',
        'FR': 'Enregistrer et suivre les notes des élèves',
        'EN': 'Record and track student grades',
        'ES': 'Registrar y seguir las calificaciones',
        'IT': 'Registrare e monitorare i voti degli studenti',
        'DE': 'Noten der Schüler erfassen und verfolgen',
        'TR': 'Öğrenci notlarını kaydet ve takip et'
      },
      'moduleAccess.module.notebooks.name': {
        'AR': 'المذكرات',
        'FR': 'Cahiers',
        'EN': 'Notebooks',
        'ES': 'Cuadernos',
        'IT': 'Quaderni',
        'DE': 'Hefte',
        'TR': 'Defterler'
      },
      'moduleAccess.module.notebooks.description': {
        'AR': 'مذكرات الأستاذ',
        'FR': 'Cahiers de l\'enseignant',
        'EN': 'Teacher notebooks',
        'ES': 'Cuadernos del profesor',
        'IT': 'Quaderni dell\'insegnante',
        'DE': 'Lehrerhefte',
        'TR': 'Öğretmen defterleri'
      },
      'moduleAccess.module.topics.name': {
        'AR': 'المواضيع',
        'FR': 'Sujets',
        'EN': 'Topics',
        'ES': 'Temas',
        'IT': 'Argomenti',
        'DE': 'Themen',
        'TR': 'Konular'
      },
      'moduleAccess.module.topics.description': {
        'AR': 'إدارة مواضيع الدروس',
        'FR': 'Gérer les sujets des leçons',
        'EN': 'Manage lesson topics',
        'ES': 'Gestionar temas de lecciones',
        'IT': 'Gestire gli argomenti delle lezioni',
        'DE': 'Unterrichtsthemen verwalten',
        'TR': 'Ders konularını yönet'
      },
      'moduleAccess.module.timetable.name': {
        'AR': 'جدول الأوقات',
        'FR': 'Emploi du temps',
        'EN': 'Timetable',
        'ES': 'Horario',
        'IT': 'Orario',
        'DE': 'Stundenplan',
        'TR': 'Ders programı'
      },
      'moduleAccess.module.timetable.description': {
        'AR': 'تنظيم الجدول الدراسي',
        'FR': 'Organiser l\'emploi du temps scolaire',
        'EN': 'Organise the school timetable',
        'ES': 'Organizar el horario escolar',
        'IT': 'Organizzare l\'orario scolastico',
        'DE': 'Stundenplan der Schule organisieren',
        'TR': 'Okul ders programını düzenle'
      },
      'moduleAccess.module.progress-tracking.name': {
        'AR': 'تتبع التقدم',
        'FR': 'Suivi des progrès',
        'EN': 'Progress tracking',
        'ES': 'Seguimiento del progreso',
        'IT': 'Monitoraggio dei progressi',
        'DE': 'Fortschrittsverfolgung',
        'TR': 'İlerleme takibi'
      },
      'moduleAccess.module.progress-tracking.description': {
        'AR': 'متابعة تقدم المنهاج',
        'FR': 'Suivre l\'avancement du programme',
        'EN': 'Track curriculum progress',
        'ES': 'Seguir el progreso del plan de estudios',
        'IT': 'Monitorare l\'avanzamento del programma',
        'DE': 'Fortschritt des Lehrplans verfolgen',
        'TR': 'Müfredat ilerlemesini takip et'
      },
      'moduleAccess.module.pedagogical-docs.name': {
        'AR': 'الوثائق التربوية',
        'FR': 'Documents pédagogiques',
        'EN': 'Pedagogical documents',
        'ES': 'Documentos pedagógicos',
        'IT': 'Documenti pedagogici',
        'DE': 'Pädagogische Dokumente',
        'TR': 'Pedagojik belgeler'
      },
      'moduleAccess.module.pedagogical-docs.description': {
        'AR': 'إدارة الوثائق التعليمية',
        'FR': 'Gérer les documents pédagogiques',
        'EN': 'Manage pedagogical documents',
        'ES': 'Gestionar documentos pedagógicos',
        'IT': 'Gestire documenti pedagogici',
        'DE': 'Pädagogische Dokumente verwalten',
        'TR': 'Pedagojik belgeleri yönet'
      },
      'moduleAccess.module.training-inspection.name': {
        'AR': 'التفتيش التربوي',
        'FR': 'Formation & inspection',
        'EN': 'Training & inspection',
        'ES': 'Formación e inspección',
        'IT': 'Formazione e ispezione',
        'DE': 'Ausbildung & Inspektion',
        'TR': 'Eğitim ve denetim'
      },
      'moduleAccess.module.training-inspection.description': {
        'AR': 'سجل التفتيش',
        'FR': 'Registre des inspections',
        'EN': 'Inspection log',
        'ES': 'Registro de inspecciones',
        'IT': 'Registro delle ispezioni',
        'DE': 'Inspektionsprotokoll',
        'TR': 'Denetim kaydı'
      },
      'moduleAccess.module.annual-distribution.name': {
        'AR': 'التوزيع السنوي',
        'FR': 'Répartition annuelle',
        'EN': 'Annual distribution',
        'ES': 'Distribución anual',
        'IT': 'Distribuzione annuale',
        'DE': 'Jährliche Verteilung',
        'TR': 'Yıllık dağıtım'
      },
      'moduleAccess.module.annual-distribution.description': {
        'AR': 'توزيع المنهاج السنوي',
        'FR': 'Répartition annuelle du programme',
        'EN': 'Annual curriculum distribution',
        'ES': 'Distribución anual del plan de estudios',
        'IT': 'Distribuzione annuale del programma',
        'DE': 'Jährliche Verteilung des Lehrplans',
        'TR': 'Yıllık müfredat dağılımı'
      },
      'moduleAccess.module.behavior-events.name': {
        'AR': 'السلوك',
        'FR': 'Comportement',
        'EN': 'Behavior',
        'ES': 'Comportamiento',
        'IT': 'Comportamento',
        'DE': 'Verhalten',
        'TR': 'Davranış'
      },
      'moduleAccess.module.behavior-events.description': {
        'AR': 'تسجيل أحداث السلوك',
        'FR': 'Enregistrer les événements de comportement',
        'EN': 'Record behavior events',
        'ES': 'Registrar eventos de comportamiento',
        'IT': 'Registrare eventi comportamentali',
        'DE': 'Verhaltensereignisse erfassen',
        'TR': 'Davranış olaylarını kaydet'
      },
      'moduleAccess.module.labs.name': {
        'AR': 'المختبرات',
        'FR': 'Laboratoires',
        'EN': 'Labs',
        'ES': 'Laboratorios',
        'IT': 'Laboratori',
        'DE': 'Labore',
        'TR': 'Laboratuvarlar'
      },
      'moduleAccess.module.labs.description': {
        'AR': 'إدارة المختبرات',
        'FR': 'Gérer les laboratoires',
        'EN': 'Manage labs',
        'ES': 'Gestionar laboratorios',
        'IT': 'Gestire i laboratori',
        'DE': 'Labore verwalten',
        'TR': 'Laboratuvarları yönet'
      },
      'moduleAccess.module.lab-management.name': {
        'AR': 'إدارة المختبر',
        'FR': 'Gestion du stock du laboratoire',
        'EN': 'Lab inventory management',
        'ES': 'Gestión de inventario del laboratorio',
        'IT': 'Gestione inventario del laboratorio',
        'DE': 'Laborinventarverwaltung',
        'TR': 'Labor envanter yönetimi'
      },
      'moduleAccess.module.lab-management.description': {
        'AR': 'إدارة مخزون المختبر',
        'FR': 'Gérer le stock du laboratoire',
        'EN': 'Manage lab inventory',
        'ES': 'Gestionar el inventario del laboratorio',
        'IT': 'Gestire l\'inventario del laboratorio',
        'DE': 'Laborinventar verwalten',
        'TR': 'Labor envanterini yönet'
      },
      'moduleAccess.module.workstations.name': {
        'AR': 'مخطط المقاعد',
        'FR': 'Plan de placement',
        'EN': 'Seating chart',
        'ES': 'Plano de asientos',
        'IT': 'Schema dei posti',
        'DE': 'Sitzplan',
        'TR': 'Oturma planı'
      },
      'moduleAccess.module.workstations.description': {
        'AR': 'إدارة مخطط جلوس الطلاب في المخبر',
        'FR': 'Gérer le plan de placement des élèves dans le laboratoire',
        'EN': 'Manage student seating in the lab',
        'ES': 'Gestionar la distribución de asientos de los estudiantes en el laboratorio',
        'IT': 'Gestire la disposizione dei posti degli studenti in laboratorio',
        'DE': 'Sitzordnung der Schüler im Labor verwalten',
        'TR': 'Laboratuvarda öğrenci oturma düzenini yönet'
      },
      'moduleAccess.module.certificate-generator.name': {
        'AR': 'الشهادات',
        'FR': 'Certificats',
        'EN': 'Certificates',
        'ES': 'Certificados',
        'IT': 'Certificati',
        'DE': 'Zertifikate',
        'TR': 'Sertifikalar'
      },
      'moduleAccess.module.certificate-generator.description': {
        'AR': 'إنشاء وإدارة الشهادات',
        'FR': 'Créer et gérer les certificats',
        'EN': 'Create and manage certificates',
        'ES': 'Crear y gestionar certificados',
        'IT': 'Creare e gestire certificati',
        'DE': 'Zertifikate erstellen und verwalten',
        'TR': 'Sertifikalar oluştur ve yönet'
      },
      'moduleAccess.module.annual-planning.name': {
        'AR': 'التخطيط السنوي',
        'FR': 'Planification annuelle',
        'EN': 'Annual planning',
        'ES': 'Planificación anual',
        'IT': 'Pianificazione annuale',
        'DE': 'Jahresplanung',
        'TR': 'Yıllık planlama'
      },
      'moduleAccess.module.annual-planning.description': {
        'AR': 'التخطيط السنوي للمنهاج',
        'FR': 'Planification annuelle du programme',
        'EN': 'Annual curriculum planning',
        'ES': 'Planificación anual del plan de estudios',
        'IT': 'Pianificazione annuale del curriculum',
        'DE': 'Jährliche Lehrplanplanung',
        'TR': 'Yıllık müfredat planlaması'
      },
      'moduleAccess.module.notifications.name': {
        'AR': 'الإشعارات',
        'FR': 'Notifications',
        'EN': 'Notifications',
        'ES': 'Notificaciones',
        'IT': 'Notifiche',
        'DE': 'Benachrichtigungen',
        'TR': 'Bildirimler'
      },
      'moduleAccess.module.notifications.description': {
        'AR': 'إدارة الإشعارات',
        'FR': 'Gérer les notifications',
        'EN': 'Manage notifications',
        'ES': 'Gestionar notificaciones',
        'IT': 'Gestire le notifiche',
        'DE': 'Benachrichtigungen verwalten',
        'TR': 'Bildirimleri yönet'
      },
      'header.priorityUrgent': {
        'AR': 'عاجل',
        'FR': 'Urgent',
        'EN': 'Urgent',
        'ES': 'Urgente',
        'IT': 'Urgente',
        'DE': 'Dringend',
        'TR': 'Acil'
      },
      'header.priorityHigh': {
        'AR': 'عالي',
        'FR': 'Élevé',
        'EN': 'High',
        'ES': 'Alto',
        'IT': 'Alto',
        'DE': 'Hoch',
        'TR': 'Yüksek'
      },
      'header.priorityMedium': {
        'AR': 'متوسط',
        'FR': 'Moyen',
        'EN': 'Medium',
        'ES': 'Medio',
        'IT': 'Medio',
        'DE': 'Mittel',
        'TR': 'Orta'
      },
      'header.priorityLow': {
        'AR': 'منخفض',
        'FR': 'Faible',
        'EN': 'Low',
        'ES': 'Bajo',
        'IT': 'Basso',
        'DE': 'Niedrig',
        'TR': 'Düşük'
      },

      // Users Management
      'usersManagement.title': {
        'AR': 'إدارة المستخدمين',
        'FR': 'Gestion des utilisateurs',
        'EN': 'User management',
        'ES': 'Gestión de usuarios',
        'IT': 'Gestione utenti',
        'DE': 'Benutzerverwaltung',
        'TR': 'Kullanıcı yönetimi'
      },
      'usersManagement.addUser': {
        'AR': '+ إضافة مستخدم جديد',
        'FR': '+ Ajouter un nouvel utilisateur',
        'EN': '+ Add new user',
        'ES': '+ Agregar nuevo usuario',
        'IT': '+ Aggiungi nuovo utente',
        'DE': '+ Neuen Benutzer hinzufügen',
        'TR': '+ Yeni kullanıcı ekle'
      },
      'usersManagement.name': {
        'AR': 'الاسم',
        'FR': 'Nom',
        'EN': 'Name',
        'ES': 'Nombre',
        'IT': 'Nome',
        'DE': 'Name',
        'TR': 'İsim'
      },
      'usersManagement.email': {
        'AR': 'البريد الإلكتروني',
        'FR': 'E-mail',
        'EN': 'Email',
        'ES': 'Correo electrónico',
        'IT': 'Email',
        'DE': 'E-Mail',
        'TR': 'E-posta'
      },
      'usersManagement.role': {
        'AR': 'الدور',
        'FR': 'Rôle',
        'EN': 'Role',
        'ES': 'Rol',
        'IT': 'Ruolo',
        'DE': 'Rolle',
        'TR': 'Rol'
      },
      'usersManagement.status': {
        'AR': 'الحالة',
        'FR': 'Statut',
        'EN': 'Status',
        'ES': 'Estado',
        'IT': 'Stato',
        'DE': 'Status',
        'TR': 'Durum'
      },
      'usersManagement.lastLogin': {
        'AR': 'آخر تسجيل دخول',
        'FR': 'Dernière connexion',
        'EN': 'Last login',
        'ES': 'Último inicio de sesión',
        'IT': 'Ultimo accesso',
        'DE': 'Letzte Anmeldung',
        'TR': 'Son giriş'
      },
      'usersManagement.actions': {
        'AR': 'الإجراءات',
        'FR': 'Actions',
        'EN': 'Actions',
        'ES': 'Acciones',
        'IT': 'Azioni',
        'DE': 'Aktionen',
        'TR': 'İşlemler'
      },
      'usersManagement.loading': {
        'AR': 'جاري التحميل...',
        'FR': 'Chargement en cours...',
        'EN': 'Loading...',
        'ES': 'Cargando...',
        'IT': 'Caricamento in corso...',
        'DE': 'Wird geladen...',
        'TR': 'Yükleniyor...'
      },
      'usersManagement.noUsers': {
        'AR': 'لا يوجد مستخدمين',
        'FR': 'Aucun utilisateur',
        'EN': 'No users',
        'ES': 'No hay usuarios',
        'IT': 'Nessun utente',
        'DE': 'Keine Benutzer',
        'TR': 'Kullanıcı yok'
      },
      'usersManagement.editUser': {
        'AR': 'تعديل مستخدم',
        'FR': 'Modifier l\'utilisateur',
        'EN': 'Edit user',
        'ES': 'Editar usuario',
        'IT': 'Modifica utente',
        'DE': 'Benutzer bearbeiten',
        'TR': 'Kullanıcıyı düzenle'
      },
      'usersManagement.addNewUser': {
        'AR': 'إضافة مستخدم جديد',
        'FR': 'Ajouter un nouvel utilisateur',
        'EN': 'Add new user',
        'ES': 'Agregar nuevo usuario',
        'IT': 'Aggiungi nuovo utente',
        'DE': 'Neuen Benutzer hinzufügen',
        'TR': 'Yeni kullanıcı ekle'
      },
      'usersManagement.firstName': {
        'AR': 'الاسم الأول',
        'FR': 'Prénom',
        'EN': 'First name',
        'ES': 'Nombre',
        'IT': 'Nome',
        'DE': 'Vorname',
        'TR': 'Ad'
      },
      'usersManagement.lastName': {
        'AR': 'الاسم الأخير',
        'FR': 'Nom',
        'EN': 'Last name',
        'ES': 'Apellido',
        'IT': 'Cognome',
        'DE': 'Nachname',
        'TR': 'Soyad'
      },
      'usersManagement.username': {
        'AR': 'اسم المستخدم (اختياري)',
        'FR': 'Nom d\'utilisateur (optionnel)',
        'EN': 'Username (optional)',
        'ES': 'Nombre de usuario (opcional)',
        'IT': 'Nome utente (opzionale)',
        'DE': 'Benutzername (optional)',
        'TR': 'Kullanıcı adı (isteğe bağlı)'
      },
      'usersManagement.password': {
        'AR': 'كلمة المرور',
        'FR': 'Mot de passe',
        'EN': 'Password',
        'ES': 'Contraseña',
        'IT': 'Password',
        'DE': 'Passwort',
        'TR': 'Şifre'
      },
      'usersManagement.passwordKeepCurrent': {
        'AR': '(اتركه فارغاً للحفاظ على الكلمة الحالية)',
        'FR': '(laisser vide pour conserver le mot de passe actuel)',
        'EN': '(leave empty to keep current password)',
        'ES': '(dejar vacío para mantener la contraseña actual)',
        'IT': '(lascia vuoto per mantenere la password attuale)',
        'DE': '(leer lassen, um das aktuelle Passwort beizubehalten)',
        'TR': '(mevcut şifreyi korumak için boş bırakın)'
      },
      'usersManagement.accountActive': {
        'AR': 'الحساب نشط',
        'FR': 'Compte actif',
        'EN': 'Account active',
        'ES': 'Cuenta activa',
        'IT': 'Account attivo',
        'DE': 'Konto aktiv',
        'TR': 'Hesap aktif'
      },
      'usersManagement.roleTeacher': {
        'AR': 'أستاذ',
        'FR': 'Enseignant',
        'EN': 'Teacher',
        'ES': 'Profesor',
        'IT': 'Insegnante',
        'DE': 'Lehrer',
        'TR': 'Öğretmen'
      },
      'usersManagement.roleAdmin': {
        'AR': 'مسؤول',
        'FR': 'Administrateur',
        'EN': 'Admin',
        'ES': 'Administrador',
        'IT': 'Amministratore',
        'DE': 'Administrator',
        'TR': 'Yönetici'
      },
      'usersManagement.statusActive': {
        'AR': 'نشط',
        'FR': 'Actif',
        'EN': 'Active',
        'ES': 'Activo',
        'IT': 'Attivo',
        'DE': 'Aktiv',
        'TR': 'Aktif'
      },
      'usersManagement.statusInactive': {
        'AR': 'معطل',
        'FR': 'Désactivé',
        'EN': 'Inactive',
        'ES': 'Inactivo',
        'IT': 'Inattivo',
        'DE': 'Inaktiv',
        'TR': 'Pasif'
      },
      'usersManagement.edit': {
        'AR': 'تعديل',
        'FR': 'Modifier',
        'EN': 'Edit',
        'ES': 'Editar',
        'IT': 'Modifica',
        'DE': 'Bearbeiten',
        'TR': 'Düzenle'
      },
      'usersManagement.disable': {
        'AR': 'تعطيل',
        'FR': 'Désactiver',
        'EN': 'Disable',
        'ES': 'Desactivar',
        'IT': 'Disabilita',
        'DE': 'Deaktivieren',
        'TR': 'Devre dışı bırak'
      },
      'usersManagement.enable': {
        'AR': 'تفعيل',
        'FR': 'Activer',
        'EN': 'Enable',
        'ES': 'Activar',
        'IT': 'Abilita',
        'DE': 'Aktivieren',
        'TR': 'Etkinleştir'
      },
      'usersManagement.update': {
        'AR': 'تحديث',
        'FR': 'Mettre à jour',
        'EN': 'Update',
        'ES': 'Actualizar',
        'IT': 'Aggiorna',
        'DE': 'Aktualisieren',
        'TR': 'Güncelle'
      },
      'usersManagement.create': {
        'AR': 'إنشاء',
        'FR': 'Créer',
        'EN': 'Create',
        'ES': 'Crear',
        'IT': 'Crea',
        'DE': 'Erstellen',
        'TR': 'Oluştur'
      },
      'usersManagement.noName': {
        'AR': 'بدون اسم',
        'FR': 'Sans nom',
        'EN': 'No name',
        'ES': 'Sin nombre',
        'IT': 'Senza nome',
        'DE': 'Kein Name',
        'TR': 'İsim yok'
      },
      'usersManagement.neverLoggedIn': {
        'AR': 'لم يسجل دخول',
        'FR': 'Jamais connecté',
        'EN': 'Never logged in',
        'ES': 'Nunca inició sesión',
        'IT': 'Mai connesso',
        'DE': 'Nie angemeldet',
        'TR': 'Hiç giriş yapılmadı'
      },

      // Monitoring
      'monitoring.title': {
        'AR': 'المتابعة والإشراف',
        'FR': 'Suivi et supervision',
        'EN': 'Monitoring & supervision',
        'ES': 'Seguimiento y supervisión',
        'IT': 'Monitoraggio e supervisione',
        'DE': 'Überwachung & Aufsicht',
        'TR': 'İzleme ve denetim'
      },
      'monitoring.searchPlaceholder': {
        'AR': 'بحث عن مستخدم...',
        'FR': 'Rechercher un utilisateur...',
        'EN': 'Search for user...',
        'ES': 'Buscar usuario...',
        'IT': 'Cerca utente...',
        'DE': 'Benutzer suchen...',
        'TR': 'Kullanıcı ara...'
      },
      'monitoring.user': {
        'AR': 'المستخدم',
        'FR': 'Utilisateur',
        'EN': 'User',
        'ES': 'Usuario',
        'IT': 'Utente',
        'DE': 'Benutzer',
        'TR': 'Kullanıcı'
      },
      'monitoring.createdDate': {
        'AR': 'تاريخ الإنشاء',
        'FR': 'Date de création',
        'EN': 'Created date',
        'ES': 'Fecha de creación',
        'IT': 'Data di creazione',
        'DE': 'Erstellungsdatum',
        'TR': 'Oluşturulma tarihi'
      },
      'monitoring.enabledModules': {
        'AR': 'الوحدات المفعلة',
        'FR': 'Modules activés',
        'EN': 'Enabled modules',
        'ES': 'Módulos habilitados',
        'IT': 'Moduli abilitati',
        'DE': 'Aktivierte Module',
        'TR': 'Etkin modüller'
      },
      'monitoring.allModules': {
        'AR': 'الكل',
        'FR': 'Tous',
        'EN': 'All',
        'ES': 'Todos',
        'IT': 'Tutti',
        'DE': 'Alle',
        'TR': 'Tümü'
      },
      'monitoring.noResults': {
        'AR': 'لا توجد نتائج',
        'FR': 'Aucun résultat',
        'EN': 'No results',
        'ES': 'No hay resultados',
        'IT': 'Nessun risultato',
        'DE': 'Keine Ergebnisse',
        'TR': 'Sonuç yok'
      },
      'monitoring.today': {
        'AR': 'اليوم',
        'FR': 'Aujourd\'hui',
        'EN': 'Today',
        'ES': 'Hoy',
        'IT': 'Oggi',
        'DE': 'Heute',
        'TR': 'Bugün'
      },
      'monitoring.yesterday': {
        'AR': 'أمس',
        'FR': 'Hier',
        'EN': 'Yesterday',
        'ES': 'Ayer',
        'IT': 'Ieri',
        'DE': 'Gestern',
        'TR': 'Dün'
      },
      'monitoring.daysAgo': {
        'AR': 'منذ',
        'FR': 'Il y a',
        'EN': 'days ago',
        'ES': 'hace días',
        'IT': 'giorni fa',
        'DE': 'Tage her',
        'TR': 'gün önce'
      },
      'monitoring.weeksAgo': {
        'AR': 'منذ',
        'FR': 'Il y a',
        'EN': 'weeks ago',
        'ES': 'hace semanas',
        'IT': 'settimane fa',
        'DE': 'Wochen her',
        'TR': 'hafta önce'
      },
      'monitoring.monthsAgo': {
        'AR': 'منذ',
        'FR': 'Il y a',
        'EN': 'months ago',
        'ES': 'hace meses',
        'IT': 'mesi fa',
        'DE': 'Monate her',
        'TR': 'ay önce'
      },
      'monitoring.loading': {
        'AR': 'جاري التحميل...',
        'FR': 'Chargement en cours...',
        'EN': 'Loading...',
        'ES': 'Cargando...',
        'IT': 'Caricamento in corso...',
        'DE': 'Wird geladen...',
        'TR': 'Yükleniyor...'
      },
      'monitoring.role': {
        'AR': 'الدور',
        'FR': 'Rôle',
        'EN': 'Role',
        'ES': 'Rol',
        'IT': 'Ruolo',
        'DE': 'Rolle',
        'TR': 'Rol'
      },
      'monitoring.status': {
        'AR': 'الحالة',
        'FR': 'Statut',
        'EN': 'Status',
        'ES': 'Estado',
        'IT': 'Stato',
        'DE': 'Status',
        'TR': 'Durum'
      },
      'monitoring.lastLogin': {
        'AR': 'آخر تسجيل دخول',
        'FR': 'Dernière connexion',
        'EN': 'Last login',
        'ES': 'Último inicio de sesión',
        'IT': 'Ultimo accesso',
        'DE': 'Letzte Anmeldung',
        'TR': 'Son giriş'
      },
      'monitoring.roleAdmin': {
        'AR': 'مسؤول',
        'FR': 'Administrateur',
        'EN': 'Admin',
        'ES': 'Administrador',
        'IT': 'Amministratore',
        'DE': 'Administrator',
        'TR': 'Yönetici'
      },
      'monitoring.roleTeacher': {
        'AR': 'أستاذ',
        'FR': 'Enseignant',
        'EN': 'Teacher',
        'ES': 'Profesor',
        'IT': 'Insegnante',
        'DE': 'Lehrer',
        'TR': 'Öğretmen'
      },
      'monitoring.statusActive': {
        'AR': 'نشط',
        'FR': 'Actif',
        'EN': 'Active',
        'ES': 'Activo',
        'IT': 'Attivo',
        'DE': 'Aktiv',
        'TR': 'Aktif'
      },
      'monitoring.statusInactive': {
        'AR': 'معطل',
        'FR': 'Désactivé',
        'EN': 'Inactive',
        'ES': 'Inactivo',
        'IT': 'Inattivo',
        'DE': 'Inaktiv',
        'TR': 'Pasif'
      },
      'monitoring.noName': {
        'AR': 'بدون اسم',
        'FR': 'Sans nom',
        'EN': 'No name',
        'ES': 'Sin nombre',
        'IT': 'Senza nome',
        'DE': 'Kein Name',
        'TR': 'İsim yok'
      },
      'monitoring.neverLoggedIn': {
        'AR': 'لم يسجل دخول',
        'FR': 'Jamais connecté',
        'EN': 'Never logged in',
        'ES': 'Nunca inició sesión',
        'IT': 'Mai connesso',
        'DE': 'Nie angemeldet',
        'TR': 'Hiç giriş yapılmadı'
      },

      // Subscription Management
      'subscriptionManagement.title': {
        'AR': 'إدارة الاشتراكات والمدفوعات',
        'FR': 'Gestion des abonnements et des paiements',
        'EN': 'Subscription and payment management',
        'ES': 'Gestión de suscripciones y pagos',
        'IT': 'Gestione abbonamenti e pagamenti',
        'DE': 'Verwaltung von Abonnements und Zahlungen',
        'TR': 'Abonelik ve ödeme yönetimi'
      },
      'subscriptionManagement.description': {
        'AR': 'إدارة الباقات والاشتراكات والمدفوعات للأساتذة',
        'FR': 'Gérer les forfaits, abonnements et paiements pour les enseignants',
        'EN': 'Manage plans, subscriptions and payments for teachers',
        'ES': 'Gestionar planes, suscripciones y pagos para profesores',
        'IT': 'Gestire piani, abbonamenti e pagamenti per gli insegnanti',
        'DE': 'Verwalten Sie Pläne, Abonnements und Zahlungen für Lehrer',
        'TR': 'Öğretmenler için planlar, abonelikler ve ödemeleri yönetin'
      },
      'subscriptionManagement.stats': {
        'AR': 'الإحصائيات',
        'FR': 'Statistiques',
        'EN': 'Statistics',
        'ES': 'Estadísticas',
        'IT': 'Statistiche',
        'DE': 'Statistiken',
        'TR': 'İstatistikler'
      },
      'subscriptionManagement.plans': {
        'AR': 'الباقات',
        'FR': 'Forfaits',
        'EN': 'Plans',
        'ES': 'Planes',
        'IT': 'Piani',
        'DE': 'Pläne',
        'TR': 'Planlar'
      },
      'subscriptionManagement.subscriptions': {
        'AR': 'الاشتراكات',
        'FR': 'Abonnements',
        'EN': 'Subscriptions',
        'ES': 'Suscripciones',
        'IT': 'Abbonamenti',
        'DE': 'Abonnements',
        'TR': 'Abonelikler'
      },
      'subscriptionManagement.payments': {
        'AR': 'المدفوعات',
        'FR': 'Paiements',
        'EN': 'Payments',
        'ES': 'Pagos',
        'IT': 'Pagamenti',
        'DE': 'Zahlungen',
        'TR': 'Ödemeler'
      },
      'subscriptionManagement.overview': {
        'AR': 'نظرة عامة',
        'FR': 'Vue d\'ensemble',
        'EN': 'Overview',
        'ES': 'Resumen',
        'IT': 'Panoramica',
        'DE': 'Übersicht',
        'TR': 'Genel bakış'
      },
      'subscriptionManagement.totalSubscriptions': {
        'AR': 'إجمالي الاشتراكات',
        'FR': 'Total des abonnements',
        'EN': 'Total subscriptions',
        'ES': 'Total de suscripciones',
        'IT': 'Totale abbonamenti',
        'DE': 'Gesamte Abonnements',
        'TR': 'Toplam abonelik'
      },
      'subscriptionManagement.activeSubscriptions': {
        'AR': 'الاشتراكات النشطة',
        'FR': 'Abonnements actifs',
        'EN': 'Active subscriptions',
        'ES': 'Suscripciones activas',
        'IT': 'Abbonamenti attivi',
        'DE': 'Aktive Abonnements',
        'TR': 'Aktif abonelikler'
      },
      'subscriptionManagement.pendingSubscriptions': {
        'AR': 'قيد الانتظار',
        'FR': 'En attente',
        'EN': 'Pending',
        'ES': 'Pendiente',
        'IT': 'In attesa',
        'DE': 'Ausstehend',
        'TR': 'Beklemede'
      },
      'subscriptionManagement.totalRevenue': {
        'AR': 'إجمالي الإيرادات',
        'FR': 'Revenus totaux',
        'EN': 'Total revenue',
        'ES': 'Ingresos totales',
        'IT': 'Ricavi totali',
        'DE': 'Gesamterlöse',
        'TR': 'Toplam gelir'
      },
      'subscriptionManagement.addPlan': {
        'AR': '+ إضافة باقة جديدة',
        'FR': '+ Ajouter un nouveau forfait',
        'EN': '+ Add new plan',
        'ES': '+ Agregar nuevo plan',
        'IT': '+ Aggiungi nuovo piano',
        'DE': '+ Neuen Plan hinzufügen',
        'TR': '+ Yeni plan ekle'
      },
      'subscriptionManagement.planName': {
        'AR': 'الاسم (عربي)',
        'FR': 'Nom (arabe)',
        'EN': 'Name (Arabic)',
        'ES': 'Nombre (árabe)',
        'IT': 'Nome (arabo)',
        'DE': 'Name (Arabisch)',
        'TR': 'İsim (Arapça)'
      },
      'subscriptionManagement.planNameEn': {
        'AR': 'الاسم (إنجليزي)',
        'FR': 'Nom (anglais)',
        'EN': 'Name (English)',
        'ES': 'Nombre (inglés)',
        'IT': 'Nome (inglese)',
        'DE': 'Name (Englisch)',
        'TR': 'İsim (İngilizce)'
      },
      'subscriptionManagement.planType': {
        'AR': 'النوع',
        'FR': 'Type',
        'EN': 'Type',
        'ES': 'Tipo',
        'IT': 'Tipo',
        'DE': 'Typ',
        'TR': 'Tür'
      },
      'subscriptionManagement.planTypeSemester': {
        'AR': 'فصل دراسي',
        'FR': 'Semestre',
        'EN': 'Semester',
        'ES': 'Semestre',
        'IT': 'Semestre',
        'DE': 'Semester',
        'TR': 'Dönem'
      },
      'subscriptionManagement.planTypeAnnual': {
        'AR': 'سنة دراسية',
        'FR': 'Année scolaire',
        'EN': 'Academic year',
        'ES': 'Año académico',
        'IT': 'Anno accademico',
        'DE': 'Akademisches Jahr',
        'TR': 'Akademik yıl'
      },
      'subscriptionManagement.planPrice': {
        'AR': 'السعر (دج)',
        'FR': 'Prix (DA)',
        'EN': 'Price (DA)',
        'ES': 'Precio (DA)',
        'IT': 'Prezzo (DA)',
        'DE': 'Preis (DA)',
        'TR': 'Fiyat (DA)'
      },
      'subscriptionManagement.planDuration': {
        'AR': 'المدة (شهر)',
        'FR': 'Durée (mois)',
        'EN': 'Duration (months)',
        'ES': 'Duración (meses)',
        'IT': 'Durata (mesi)',
        'DE': 'Dauer (Monate)',
        'TR': 'Süre (ay)'
      },
      'subscriptionManagement.planDescription': {
        'AR': 'الوصف (عربي)',
        'FR': 'Description (arabe)',
        'EN': 'Description (Arabic)',
        'ES': 'Descripción (árabe)',
        'IT': 'Descrizione (araba)',
        'DE': 'Beschreibung (Arabisch)',
        'TR': 'Açıklama (Arapça)'
      },
      'subscriptionManagement.planDescriptionEn': {
        'AR': 'الوصف (إنجليزي)',
        'FR': 'Description (anglais)',
        'EN': 'Description (English)',
        'ES': 'Descripción (inglés)',
        'IT': 'Descrizione (inglese)',
        'DE': 'Beschreibung (Englisch)',
        'TR': 'Açıklama (İngilizce)'
      },
      'subscriptionManagement.noPlans': {
        'AR': 'لا توجد باقات حالياً',
        'FR': 'Aucun forfait pour le moment',
        'EN': 'No plans currently',
        'ES': 'No hay planes actualmente',
        'IT': 'Nessun piano al momento',
        'DE': 'Derzeit keine Pläne',
        'TR': 'Şu anda plan yok'
      },
      'subscriptionManagement.noSubscriptions': {
        'AR': 'لا توجد اشتراكات حالياً',
        'FR': 'Aucun abonnement pour le moment',
        'EN': 'No subscriptions currently',
        'ES': 'No hay suscripciones actualmente',
        'IT': 'Nessun abbonamento al momento',
        'DE': 'Derzeit keine Abonnements',
        'TR': 'Şu anda abonelik yok'
      },
      'subscriptionManagement.noPayments': {
        'AR': 'لا توجد مدفوعات حالياً',
        'FR': 'Aucun paiement pour le moment',
        'EN': 'No payments currently',
        'ES': 'No hay pagos actualmente',
        'IT': 'Nessun pagamento al momento',
        'DE': 'Derzeit keine Zahlungen',
        'TR': 'Şu anda ödeme yok'
      },
      'subscriptionManagement.teacher': {
        'AR': 'الأستاذ',
        'FR': 'Enseignant',
        'EN': 'Teacher',
        'ES': 'Profesor',
        'IT': 'Insegnante',
        'DE': 'Lehrer',
        'TR': 'Öğretmen'
      },
      'subscriptionManagement.plan': {
        'AR': 'الباقة',
        'FR': 'Forfait',
        'EN': 'Plan',
        'ES': 'Plan',
        'IT': 'Piano',
        'DE': 'Plan',
        'TR': 'Plan'
      },
      'subscriptionManagement.startDate': {
        'AR': 'تاريخ البداية',
        'FR': 'Date de début',
        'EN': 'Start date',
        'ES': 'Fecha de inicio',
        'IT': 'Data di inizio',
        'DE': 'Startdatum',
        'TR': 'Başlangıç tarihi'
      },
      'subscriptionManagement.endDate': {
        'AR': 'تاريخ الانتهاء',
        'FR': 'Date de fin',
        'EN': 'End date',
        'ES': 'Fecha de fin',
        'IT': 'Data di fine',
        'DE': 'Enddatum',
        'TR': 'Bitiş tarihi'
      },
      'subscriptionManagement.amount': {
        'AR': 'المبلغ',
        'FR': 'Montant',
        'EN': 'Amount',
        'ES': 'Cantidad',
        'IT': 'Importo',
        'DE': 'Betrag',
        'TR': 'Tutar'
      },
      'subscriptionManagement.paymentMethod': {
        'AR': 'طريقة الدفع',
        'FR': 'Méthode de paiement',
        'EN': 'Payment method',
        'ES': 'Método de pago',
        'IT': 'Metodo di pagamento',
        'DE': 'Zahlungsmethode',
        'TR': 'Ödeme yöntemi'
      },
      'subscriptionManagement.paymentDate': {
        'AR': 'تاريخ الدفع',
        'FR': 'Date de paiement',
        'EN': 'Payment date',
        'ES': 'Fecha de pago',
        'IT': 'Data di pagamento',
        'DE': 'Zahlungsdatum',
        'TR': 'Ödeme tarihi'
      },
      'subscriptionManagement.paymentMethodManual': {
        'AR': 'يدوي/تحويل بنكي',
        'FR': 'Manuel/Virement bancaire',
        'EN': 'Manual/Bank transfer',
        'ES': 'Manual/Transferencia bancaria',
        'IT': 'Manuale/Bonifico bancario',
        'DE': 'Manuell/Banküberweisung',
        'TR': 'Manuel/Banka havalesi'
      },
      'subscriptionManagement.paymentMethodCard': {
        'AR': 'بطاقة ذهبية',
        'FR': 'Carte bancaire',
        'EN': 'Credit card',
        'ES': 'Tarjeta de crédito',
        'IT': 'Carta di credito',
        'DE': 'Kreditkarte',
        'TR': 'Kredi kartı'
      },
      'subscriptionManagement.paymentMethodOther': {
        'AR': 'أخرى',
        'FR': 'Autre',
        'EN': 'Other',
        'ES': 'Otro',
        'IT': 'Altro',
        'DE': 'Andere',
        'TR': 'Diğer'
      },
      'subscriptionManagement.statusPending': {
        'AR': 'قيد الانتظار',
        'FR': 'En attente',
        'EN': 'Pending',
        'ES': 'Pendiente',
        'IT': 'In attesa',
        'DE': 'Ausstehend',
        'TR': 'Beklemede'
      },
      'subscriptionManagement.statusCompleted': {
        'AR': 'مكتمل',
        'FR': 'Complété',
        'EN': 'Completed',
        'ES': 'Completado',
        'IT': 'Completato',
        'DE': 'Abgeschlossen',
        'TR': 'Tamamlandı'
      },
      'subscriptionManagement.statusFailed': {
        'AR': 'فشل',
        'FR': 'Échoué',
        'EN': 'Failed',
        'ES': 'Fallido',
        'IT': 'Fallito',
        'DE': 'Fehlgeschlagen',
        'TR': 'Başarısız'
      },
      'subscriptionManagement.statusRefunded': {
        'AR': 'مسترد',
        'FR': 'Remboursé',
        'EN': 'Refunded',
        'ES': 'Reembolsado',
        'IT': 'Rimborsato',
        'DE': 'Erstattet',
        'TR': 'İade edildi'
      },
      'subscriptionManagement.statusActive': {
        'AR': 'نشط',
        'FR': 'Actif',
        'EN': 'Active',
        'ES': 'Activo',
        'IT': 'Attivo',
        'DE': 'Aktiv',
        'TR': 'Aktif'
      },
      'subscriptionManagement.statusExpired': {
        'AR': 'منتهي',
        'FR': 'Expiré',
        'EN': 'Expired',
        'ES': 'Expirado',
        'IT': 'Scaduto',
        'DE': 'Abgelaufen',
        'TR': 'Süresi doldu'
      },
      'subscriptionManagement.statusCancelled': {
        'AR': 'ملغي',
        'FR': 'Annulé',
        'EN': 'Cancelled',
        'ES': 'Cancelado',
        'IT': 'Annullato',
        'DE': 'Storniert',
        'TR': 'İptal edildi'
      },
      'subscriptionManagement.activate': {
        'AR': 'تفعيل',
        'FR': 'Activer',
        'EN': 'Activate',
        'ES': 'Activar',
        'IT': 'Attiva',
        'DE': 'Aktivieren',
        'TR': 'Etkinleştir'
      },
      'subscriptionManagement.cancel': {
        'AR': 'إلغاء',
        'FR': 'Annuler',
        'EN': 'Cancel',
        'ES': 'Cancelar',
        'IT': 'Annulla',
        'DE': 'Stornieren',
        'TR': 'İptal et'
      },
      'subscriptionManagement.activateSubscription': {
        'AR': 'تفعيل الاشتراك',
        'FR': 'Activer l\'abonnement',
        'EN': 'Activate subscription',
        'ES': 'Activar suscripción',
        'IT': 'Attiva abbonamento',
        'DE': 'Abonnement aktivieren',
        'TR': 'Aboneliği etkinleştir'
      },
      'subscriptionManagement.activateSubscriptionTitle': {
        'AR': 'تفعيل الاشتراك',
        'FR': 'Activer l\'abonnement',
        'EN': 'Activate subscription',
        'ES': 'Activar suscripción',
        'IT': 'Attiva abbonamento',
        'DE': 'Abonnement aktivieren',
        'TR': 'Aboneliği etkinleştir'
      },
      'subscriptionManagement.editPlan': {
        'AR': 'تعديل الباقة',
        'FR': 'Modifier le forfait',
        'EN': 'Edit plan',
        'ES': 'Editar plan',
        'IT': 'Modifica piano',
        'DE': 'Plan bearbeiten',
        'TR': 'Planı düzenle'
      },
      'subscriptionManagement.addNewPlan': {
        'AR': 'إضافة باقة جديدة',
        'FR': 'Ajouter un nouveau forfait',
        'EN': 'Add new plan',
        'ES': 'Agregar nuevo plan',
        'IT': 'Aggiungi nuovo piano',
        'DE': 'Neuen Plan hinzufügen',
        'TR': 'Yeni plan ekle'
      },
      'subscriptionManagement.addNewPayment': {
        'AR': '+ إضافة دفعة جديدة',
        'FR': '+ Ajouter un nouveau paiement',
        'EN': '+ Add new payment',
        'ES': '+ Agregar nuevo pago',
        'IT': '+ Aggiungi nuovo pagamento',
        'DE': '+ Neue Zahlung hinzufügen',
        'TR': '+ Yeni ödeme ekle'
      },
      'subscriptionManagement.updatePayment': {
        'AR': 'تحديث سجل الدفع',
        'FR': 'Mettre à jour le paiement',
        'EN': 'Update payment',
        'ES': 'Actualizar pago',
        'IT': 'Aggiorna pagamento',
        'DE': 'Zahlung aktualisieren',
        'TR': 'Ödemeyi güncelle'
      },
      'subscriptionManagement.selectSubscription': {
        'AR': 'اختر الاشتراك',
        'FR': 'Sélectionner l\'abonnement',
        'EN': 'Select subscription',
        'ES': 'Seleccionar suscripción',
        'IT': 'Seleziona abbonamento',
        'DE': 'Abonnement auswählen',
        'TR': 'Abonelik seç'
      },
      'subscriptionManagement.transactionId': {
        'AR': 'رقم المعاملة',
        'FR': 'Numéro de transaction',
        'EN': 'Transaction ID',
        'ES': 'ID de transacción',
        'IT': 'ID transazione',
        'DE': 'Transaktions-ID',
        'TR': 'İşlem kimliği'
      },
      'subscriptionManagement.receiptNumber': {
        'AR': 'رقم الإيصال',
        'FR': 'Numéro de reçu',
        'EN': 'Receipt number',
        'ES': 'Número de recibo',
        'IT': 'Numero ricevuta',
        'DE': 'Quittungsnummer',
        'TR': 'Fiş numarası'
      },
      'subscriptionManagement.notes': {
        'AR': 'ملاحظات',
        'FR': 'Notes',
        'EN': 'Notes',
        'ES': 'Notas',
        'IT': 'Note',
        'DE': 'Notizen',
        'TR': 'Notlar'
      },
      'subscriptionManagement.unknown': {
        'AR': 'غير معروف',
        'FR': 'Inconnu',
        'EN': 'Unknown',
        'ES': 'Desconocido',
        'IT': 'Sconosciuto',
        'DE': 'Unbekannt',
        'TR': 'Bilinmeyen'
      },
      'subscriptionManagement.unknownOrganizer': {
        'AR': 'غير محددة',
        'FR': 'Non spécifiée',
        'EN': 'Not specified',
        'ES': 'No especificado',
        'IT': 'Non specificato',
        'DE': 'Nicht angegeben',
        'TR': 'Belirtilmemiş'
      },
      'subscriptionManagement.unknownLocation': {
        'AR': 'غير محدد',
        'FR': 'Non spécifié',
        'EN': 'Not specified',
        'ES': 'No especificado',
        'IT': 'Non specificato',
        'DE': 'Nicht angegeben',
        'TR': 'Belirtilmemiş'
      },

      // Module Access - Error messages
      'moduleAccess.error.loadUsers': {
        'AR': 'حدث خطأ أثناء تحميل قائمة المستخدمين',
        'FR': 'Erreur lors du chargement de la liste des utilisateurs',
        'EN': 'Error loading user list',
        'ES': 'Error al cargar la lista de usuarios',
        'IT': 'Errore nel caricamento della lista utenti',
        'DE': 'Fehler beim Laden der Benutzerliste',
        'TR': 'Kullanıcı listesi yüklenirken hata'
      },
      'moduleAccess.success.updatePermissions': {
        'AR': 'تم تحديث الصلاحيات بنجاح',
        'FR': 'Autorisations mises à jour avec succès',
        'EN': 'Permissions updated successfully',
        'ES': 'Permisos actualizados con éxito',
        'IT': 'Permessi aggiornati con successo',
        'DE': 'Berechtigungen erfolgreich aktualisiert',
        'TR': 'İzinler başarıyla güncellendi'
      },
      'moduleAccess.error.updatePermissions': {
        'AR': 'حدث خطأ أثناء تحديث الصلاحيات',
        'FR': 'Erreur lors de la mise à jour des autorisations',
        'EN': 'Error updating permissions',
        'ES': 'Error al actualizar permisos',
        'IT': 'Errore nell\'aggiornamento dei permessi',
        'DE': 'Fehler beim Aktualisieren der Berechtigungen',
        'TR': 'İzinler güncellenirken hata'
      },

      // Achievements & Penalties
      'achievementsPenalties.pageTitle': {
        'AR': 'الإجازات والعقوبات',
        'FR': 'Distinctions et sanctions',
        'EN': 'Achievements & Penalties',
        'ES': 'Logros y sanciones',
        'IT': 'Risultati e sanzioni',
        'DE': 'Erfolge & Sanktionen',
        'TR': 'Başarılar ve Cezalar'
      },
      'achievementsPenalties.description': {
        'AR': 'إدارة شهادات التقدير والعقوبات السلوكية',
        'FR': 'Gérer les certificats de mérite et les sanctions comportementales',
        'EN': 'Manage certificates of merit and behavioral penalties',
        'ES': 'Gestionar certificados de mérito y sanciones de comportamiento',
        'IT': 'Gestire certificati di merito e sanzioni comportamentali',
        'DE': 'Verdienstzertifikate und Verhaltenssanktionen verwalten',
        'TR': 'Başarı sertifikaları ve davranışsal cezaları yönetin'
      },
      'achievementsPenalties.tabAchievements': {
        'AR': 'الإجازات',
        'FR': 'Distinctions',
        'EN': 'Achievements',
        'ES': 'Logros',
        'IT': 'Risultati',
        'DE': 'Erfolge',
        'TR': 'Başarılar'
      },
      'achievementsPenalties.tabPenalties': {
        'AR': 'العقوبات',
        'FR': 'Sanctions',
        'EN': 'Penalties',
        'ES': 'Sanciones',
        'IT': 'Sanzioni',
        'DE': 'Sanktionen',
        'TR': 'Cezalar'
      },
      'achievementsPenalties.showPreviousCertificates': {
        'AR': 'عرض الشهادات السابقة',
        'FR': 'Afficher les certificats précédents',
        'EN': 'Show previous certificates',
        'ES': 'Mostrar certificados anteriores',
        'IT': 'Mostra certificati precedenti',
        'DE': 'Vorherige Zertifikate anzeigen',
        'TR': 'Önceki sertifikaları göster'
      },
      'achievementsPenalties.loadingCertificates': {
        'AR': 'جاري تحميل الشهادات...',
        'FR': 'Chargement des certificats...',
        'EN': 'Loading certificates...',
        'ES': 'Cargando certificados...',
        'IT': 'Caricamento certificati...',
        'DE': 'Zertifikate werden geladen...',
        'TR': 'Sertifikalar yükleniyor...'
      },
      'achievementsPenalties.noCertificates': {
        'AR': 'لا توجد شهادات حالياً',
        'FR': 'Aucun certificat pour le moment',
        'EN': 'No certificates currently',
        'ES': 'No hay certificados actualmente',
        'IT': 'Nessun certificato al momento',
        'DE': 'Derzeit keine Zertifikate',
        'TR': 'Şu anda sertifika yok'
      },
      'achievementsPenalties.showPreviousReports': {
        'AR': 'عرض التقارير السابقة',
        'FR': 'Afficher les rapports précédents',
        'EN': 'Show previous reports',
        'ES': 'Mostrar informes anteriores',
        'IT': 'Mostra rapporti precedenti',
        'DE': 'Vorherige Berichte anzeigen',
        'TR': 'Önceki raporları göster'
      },
      'achievementsPenalties.loadingReports': {
        'AR': 'جاري تحميل التقارير...',
        'FR': 'Chargement des rapports...',
        'EN': 'Loading reports...',
        'ES': 'Cargando informes...',
        'IT': 'Caricamento rapporti...',
        'DE': 'Berichte werden geladen...',
        'TR': 'Raporlar yükleniyor...'
      },
      'achievementsPenalties.noReports': {
        'AR': 'لا توجد تقارير حالياً',
        'FR': 'Aucun rapport pour le moment',
        'EN': 'No reports currently',
        'ES': 'No hay informes actualmente',
        'IT': 'Nessun rapporto al momento',
        'DE': 'Derzeit keine Berichte',
        'TR': 'Şu anda rapor yok'
      },
      'achievementsPenalties.exportPDF': {
        'AR': 'تصدير PDF',
        'FR': 'Exporter PDF',
        'EN': 'Export PDF',
        'ES': 'Exportar PDF',
        'IT': 'Esporta PDF',
        'DE': 'PDF exportieren',
        'TR': 'PDF dışa aktar'
      },
      'achievementsPenalties.exporting': {
        'AR': 'جارٍ التصدير...',
        'FR': 'Exportation en cours...',
        'EN': 'Exporting...',
        'ES': 'Exportando...',
        'IT': 'Esportazione in corso...',
        'DE': 'Wird exportiert...',
        'TR': 'Dışa aktarılıyor...'
      },
      'achievementsPenalties.exportPenaltiesToPDF': {
        'AR': 'تصدير العقوبات إلى PDF',
        'FR': 'Exporter les sanctions en PDF',
        'EN': 'Export penalties to PDF',
        'ES': 'Exportar sanciones a PDF',
        'IT': 'Esporta sanzioni in PDF',
        'DE': 'Sanktionen als PDF exportieren',
        'TR': 'Cezaları PDF olarak dışa aktar'
      },
      'achievementsPenalties.errorLoadingBehaviorReports': {
        'AR': 'تعذر تحميل تقارير السلوك',
        'FR': 'Erreur lors du chargement des rapports de comportement',
        'EN': 'Error loading behavior reports',
        'ES': 'Error al cargar informes de comportamiento',
        'IT': 'Errore nel caricamento dei rapporti comportamentali',
        'DE': 'Fehler beim Laden der Verhaltensberichte',
        'TR': 'Davranış raporları yüklenirken hata'
      },
      'achievementsPenalties.errorLoadingCertificates': {
        'AR': 'تعذر تحميل سجل الشهادات',
        'FR': 'Erreur lors du chargement de l\'historique des certificats',
        'EN': 'Error loading certificate history',
        'ES': 'Error al cargar el historial de certificados',
        'IT': 'Errore nel caricamento della cronologia dei certificati',
        'DE': 'Fehler beim Laden des Zertifikatsverlaufs',
        'TR': 'Sertifika geçmişi yüklenirken hata'
      },
      'achievementsPenalties.unknownStudent': {
        'AR': 'طالب غير معروف',
        'FR': 'Élève inconnu',
        'EN': 'Unknown student',
        'ES': 'Estudiante desconocido',
        'IT': 'Studente sconosciuto',
        'DE': 'Unbekannter Schüler',
        'TR': 'Bilinmeyen öğrenci'
      },
      'achievementsPenalties.noAdditionalDetails': {
        'AR': 'لا يوجد تفاصيل إضافية',
        'FR': 'Aucun détail supplémentaire',
        'EN': 'No additional details',
        'ES': 'Sin detalles adicionales',
        'IT': 'Nessun dettaglio aggiuntivo',
        'DE': 'Keine zusätzlichen Details',
        'TR': 'Ek ayrıntı yok'
      },
      'achievementsPenalties.certificate': {
        'AR': 'شهادة',
        'FR': 'Certificat',
        'EN': 'Certificate',
        'ES': 'Certificado',
        'IT': 'Certificato',
        'DE': 'Zertifikat',
        'TR': 'Sertifika'
      },
      'achievementsPenalties.noClassesAvailable': {
        'AR': 'لا توجد أقسام متاحة',
        'FR': 'Aucune classe disponible',
        'EN': 'No classes available',
        'ES': 'No hay clases disponibles',
        'IT': 'Nessuna classe disponibile',
        'DE': 'Keine Klassen verfügbar',
        'TR': 'Sınıf mevcut değil'
      },
      'achievementsPenalties.noReportsToExport': {
        'AR': 'لا توجد تقارير لتصديرها',
        'FR': 'Aucun rapport à exporter',
        'EN': 'No reports to export',
        'ES': 'No hay informes para exportar',
        'IT': 'Nessun rapporto da esportare',
        'DE': 'Keine Berichte zum Exportieren',
        'TR': 'Dışa aktarılacak rapor yok'
      },
      'achievementsPenalties.noCertificatesToExport': {
        'AR': 'لا توجد شهادات لتصديرها',
        'FR': 'Aucun certificat à exporter',
        'EN': 'No certificates to export',
        'ES': 'No hay certificados para exportar',
        'IT': 'Nessun certificato da esportare',
        'DE': 'Keine Zertifikate zum Exportieren',
        'TR': 'Dışa aktarılacak sertifika yok'
      },
      'achievementsPenalties.penaltiesReportTitle': {
        'AR': 'تقرير العقوبات والتقارير',
        'FR': 'Rapport des sanctions',
        'EN': 'Penalties Report',
        'ES': 'Informe de sanciones',
        'IT': 'Rapporto sanzioni',
        'DE': 'Sanktionsbericht',
        'TR': 'Cezalar Raporu'
      },
      'achievementsPenalties.certificatesReportTitle': {
        'AR': 'تقرير الشهادات',
        'FR': 'Rapport des certificats',
        'EN': 'Certificates Report',
        'ES': 'Informe de certificados',
        'IT': 'Rapporto certificati',
        'DE': 'Zertifikatsbericht',
        'TR': 'Sertifikalar Raporu'
      },
      'achievementsPenalties.errorExportingPDF': {
        'AR': 'حدث خطأ أثناء تصدير PDF',
        'FR': 'Erreur lors de l\'exportation du PDF',
        'EN': 'Error exporting PDF',
        'ES': 'Error al exportar PDF',
        'IT': 'Errore nell\'esportazione del PDF',
        'DE': 'Fehler beim Exportieren des PDF',
        'TR': 'PDF dışa aktarılırken hata'
      },
      'achievementsPenalties.studentName': {
        'AR': 'اسم التلميذ',
        'FR': 'Nom de l\'élève',
        'EN': 'Student name',
        'ES': 'Nombre del estudiante',
        'IT': 'Nome dello studente',
        'DE': 'Schülername',
        'TR': 'Öğrenci adı'
      },
      'achievementsPenalties.certificateType': {
        'AR': 'نوع الشهادة',
        'FR': 'Type de certificat',
        'EN': 'Certificate type',
        'ES': 'Tipo de certificado',
        'IT': 'Tipo di certificato',
        'DE': 'Zertifikatstyp',
        'TR': 'Sertifika türü'
      },
      'achievementsPenalties.issueDate': {
        'AR': 'تاريخ الإصدار',
        'FR': 'Date d\'émission',
        'EN': 'Issue date',
        'ES': 'Fecha de emisión',
        'IT': 'Data di emissione',
        'DE': 'Ausstellungsdatum',
        'TR': 'Düzenleme tarihi'
      },

      // Certificate Templates
      'certificate.templateAcademicExcellence': {
        'AR': 'تقدير تفوق دراسي',
        'FR': 'Distinction d\'excellence académique',
        'EN': 'Academic Excellence Award',
        'ES': 'Distinción de excelencia académica',
        'IT': 'Distinzione di eccellenza accademica',
        'DE': 'Auszeichnung für akademische Exzellenz',
        'TR': 'Akademik Mükemmellik Ödülü'
      },
      'certificate.templateGoodConduct': {
        'AR': 'تقدير حسن سلوك',
        'FR': 'Distinction de bonne conduite',
        'EN': 'Good Conduct Award',
        'ES': 'Distinción de buena conducta',
        'IT': 'Distinzione di buona condotta',
        'DE': 'Auszeichnung für gutes Verhalten',
        'TR': 'İyi Davranış Ödülü'
      },
      'certificate.templateActiveParticipation': {
        'AR': 'تقدير مشاركة فعالة',
        'FR': 'Distinction de participation active',
        'EN': 'Active Participation Award',
        'ES': 'Distinción de participación activa',
        'IT': 'Distinzione di partecipazione attiva',
        'DE': 'Auszeichnung für aktive Teilnahme',
        'TR': 'Aktif Katılım Ödülü'
      },

      // Default Certificate Texts
      'certificate.defaultMainTextAcademicExcellence': {
        'AR': 'بكل فخر، نمنح هذه الشهادة لـ{{student}} اعترافاً بجهوده المتميزة في مادة المعلوماتية.',
        'FR': 'Avec grande fierté, nous décernons ce certificat à {{student}} en reconnaissance de ses efforts exceptionnels en informatique.',
        'EN': 'With great pride, we award this certificate to {{student}} in recognition of their outstanding efforts in the subject of Informatics.',
        'ES': 'Con gran orgullo, otorgamos este certificado a {{student}} en reconocimiento a sus esfuerzos excepcionales en la materia de Informática.',
        'IT': 'Con grande orgoglio, assegniamo questo certificato a {{student}} in riconoscimento dei suoi sforzi eccezionali nella materia di Informatica.',
        'DE': 'Mit großem Stolz verleihen wir dieses Zertifikat an {{student}} in Anerkennung ihrer außergewöhnlichen Bemühungen im Fach Informatik.',
        'TR': 'Büyük bir gururla, {{student}} adlı öğrenciye Bilişim dersindeki olağanüstü çabalarını takdir etmek için bu sertifikayı veriyoruz.'
      },
      'certificate.defaultReasonAcademicExcellence': {
        'AR': 'للإنجاز المتميز في المسارات الرقمية وبرامج التفكير المنطقي.',
        'FR': 'Pour l\'accomplissement exceptionnel dans les parcours numériques et les programmes de pensée logique.',
        'EN': 'For outstanding achievement in digital pathways and logical thinking programs.',
        'ES': 'Por el logro excepcional en las vías digitales y los programas de pensamiento lógico.',
        'IT': 'Per il conseguimento eccezionale nei percorsi digitali e nei programmi di pensiero logico.',
        'DE': 'Für herausragende Leistungen in digitalen Wegen und Programmen zum logischen Denken.',
        'TR': 'Dijital yollar ve mantıksal düşünme programlarındaki olağanüstü başarı için.'
      },
      'certificate.defaultMainTextGoodConduct': {
        'AR': 'نمنح هذه الشهادة لـ{{student}} امتناناً لسلوكه الراقي واحترافيته داخل الفصول.',
        'FR': 'Nous décernons ce certificat à {{student}} en reconnaissance de son comportement exemplaire et de son professionnalisme en classe.',
        'EN': 'We award this certificate to {{student}} in recognition of their exemplary behavior and professionalism in the classroom.',
        'ES': 'Otorgamos este certificado a {{student}} en reconocimiento a su comportamiento ejemplar y profesionalismo en el aula.',
        'IT': 'Assegniamo questo certificato a {{student}} in riconoscimento del loro comportamento esemplare e professionalità in classe.',
        'DE': 'Wir verleihen dieses Zertifikat an {{student}} in Anerkennung ihres vorbildlichen Verhaltens und ihrer Professionalität im Klassenzimmer.',
        'TR': '{{student}} adlı öğrenciye sınıftaki örnek davranışı ve profesyonelliği nedeniyle bu sertifikayı veriyoruz.'
      },
      'certificate.defaultReasonGoodConduct': {
        'AR': 'للمساهمة الملحوظة في تعزيز القيم والاحترام المتبادل.',
        'FR': 'Pour la contribution remarquable à la promotion des valeurs et du respect mutuel.',
        'EN': 'For notable contribution to promoting values and mutual respect.',
        'ES': 'Por la notable contribución a la promoción de valores y respeto mutuo.',
        'IT': 'Per il notevole contributo alla promozione dei valori e del rispetto reciproco.',
        'DE': 'Für den bemerkenswerten Beitrag zur Förderung von Werten und gegenseitigem Respekt.',
        'TR': 'Değerlerin ve karşılıklı saygının teşvik edilmesine dikkate değer katkı için.'
      },
      'certificate.defaultMainTextActiveParticipation': {
        'AR': 'نقر بجهود {{student}} البارزة في النقاشات والمشاريع التطبيقية لهذا الفصل.',
        'FR': 'Nous reconnaissons les efforts remarquables de {{student}} dans les discussions et les projets pratiques de ce semestre.',
        'EN': 'We acknowledge {{student}}\'s outstanding efforts in discussions and practical projects this semester.',
        'ES': 'Reconocemos los esfuerzos destacados de {{student}} en las discusiones y proyectos prácticos de este semestre.',
        'IT': 'Riconosciamo gli sforzi eccezionali di {{student}} nelle discussioni e nei progetti pratici di questo semestre.',
        'DE': 'Wir würdigen die herausragenden Bemühungen von {{student}} in Diskussionen und praktischen Projekten dieses Semesters.',
        'TR': '{{student}} adlı öğrencinin bu dönem tartışmalar ve pratik projelerdeki olağanüstü çabalarını takdir ediyoruz.'
      },
      'certificate.defaultReasonActiveParticipation': {
        'AR': 'للمشاركة البنّاءة والمبادرات الرقمية خلال العام الدراسي.',
        'FR': 'Pour la participation constructive et les initiatives numériques au cours de l\'année scolaire.',
        'EN': 'For constructive participation and digital initiatives during the academic year.',
        'ES': 'Por la participación constructiva y las iniciativas digitales durante el año académico.',
        'IT': 'Per la partecipazione costruttiva e le iniziative digitali durante l\'anno accademico.',
        'DE': 'Für konstruktive Teilnahme und digitale Initiativen während des akademischen Jahres.',
        'TR': 'Akademik yıl boyunca yapıcı katılım ve dijital girişimler için.'
      },

      // Report Content Templates
      'report.template.behavioral': {
        'AR': 'بناءً على متابعتنا المستمرة للتلميذ(ة) {{student}}، تم تسجيل ملاحظة سلوكية تتعلق بـ "{{reason}}". نود إحاطتكم علماً بأن هذا السلوك يؤثر سلباً على السير الحسن للدرس وعلى تركيز التلميذ وزملائه. وعليه، فإننا نؤكد على ضرورة الالتزام بالنظام الداخلي للمؤسسة.',
        'FR': 'Suite au suivi continu de l\'élève {{student}}, une observation comportementale a été enregistrée concernant "{{reason}}". Nous tenons à vous informer que ce comportement affecte négativement le bon déroulement du cours et la concentration de l\'élève et de ses camarades. Par conséquent, nous soulignons la nécessité de respecter le règlement intérieur de l\'établissement.',
        'EN': 'Based on our ongoing monitoring of student {{student}}, a behavioral observation has been recorded regarding "{{reason}}". We would like to inform you that this behavior negatively affects the proper conduct of the class and the concentration of the student and their classmates. Therefore, we emphasize the need to comply with the institution\'s internal regulations.',
        'ES': 'Basado en nuestro seguimiento continuo del estudiante {{student}}, se ha registrado una observación conductual sobre "{{reason}}". Nos gustaría informarle que este comportamiento afecta negativamente la correcta conducta de la clase y la concentración del estudiante y sus compañeros. Por lo tanto, enfatizamos la necesidad de cumplir con las regulaciones internas de la institución.',
        'IT': 'Sulla base del nostro monitoraggio continuo dello studente {{student}}, è stata registrata un\'osservazione comportamentale riguardo a "{{reason}}". Vorremmo informarvi che questo comportamento influisce negativamente sulla corretta condotta della classe e sulla concentrazione dello studente e dei suoi compagni. Pertanto, sottolineiamo la necessità di rispettare i regolamenti interni dell\'istituto.',
        'DE': 'Basierend auf unserer kontinuierlichen Überwachung des Schülers {{student}} wurde eine Verhaltensbeobachtung bezüglich "{{reason}}" aufgezeichnet. Wir möchten Sie informieren, dass dieses Verhalten den ordnungsgemäßen Ablauf des Unterrichts und die Konzentration des Schülers und seiner Klassenkameraden negativ beeinflusst. Daher betonen wir die Notwendigkeit, die internen Vorschriften der Einrichtung einzuhalten.',
        'TR': 'Öğrenci {{student}} için sürekli izlememize dayanarak, "{{reason}}" ile ilgili bir davranışsal gözlem kaydedilmiştir. Bu davranışın sınıfın düzgün yürütülmesini ve öğrencinin ve sınıf arkadaşlarının konsantrasyonunu olumsuz etkilediğini bilginize sunmak isteriz. Bu nedenle, kurumun iç düzenlemelerine uyma gereğini vurguluyoruz.'
      },
      'report.template.academic': {
        'AR': 'من خلال تقييمنا للمسار الدراسي للتلميذ(ة) {{student}}، لاحظنا {{reason}}. هذا الأمر يستدعي تضافر الجهود بين المدرسة والمنزل لتدارك النقائص وتعزيز المكتسبات، لضمان تحقيق نتائج أفضل في المستقبل.',
        'FR': 'À travers notre évaluation du parcours scolaire de l\'élève {{student}}, nous avons remarqué {{reason}}. Cette situation nécessite un effort conjoint entre l\'école et la maison pour combler les lacunes et renforcer les acquis, afin d\'assurer de meilleurs résultats à l\'avenir.',
        'EN': 'Through our assessment of student {{student}}\'s academic progress, we have noticed {{reason}}. This situation requires a joint effort between school and home to address the shortcomings and strengthen achievements, to ensure better results in the future.',
        'ES': 'A través de nuestra evaluación del progreso académico del estudiante {{student}}, hemos notado {{reason}}. Esta situación requiere un esfuerzo conjunto entre la escuela y el hogar para abordar las deficiencias y fortalecer los logros, para asegurar mejores resultados en el futuro.',
        'IT': 'Attraverso la nostra valutazione del progresso accademico dello studente {{student}}, abbiamo notato {{reason}}. Questa situazione richiede uno sforzo congiunto tra scuola e casa per affrontare le carenze e rafforzare i risultati, per garantire risultati migliori in futuro.',
        'DE': 'Durch unsere Bewertung des akademischen Fortschritts des Schülers {{student}} haben wir {{reason}} festgestellt. Diese Situation erfordert eine gemeinsame Anstrengung zwischen Schule und Zuhause, um die Mängel zu beheben und die Leistungen zu stärken, um bessere Ergebnisse in der Zukunft zu gewährleisten.',
        'TR': 'Öğrenci {{student}}\'nin akademik ilerlemesini değerlendirmemiz aracılığıyla {{reason}} fark ettik. Bu durum, eksiklikleri ele almak ve başarıları güçlendirmek, gelecekte daha iyi sonuçlar sağlamak için okul ve ev arasında ortak bir çaba gerektirir.'
      },
      'report.template.cheating': {
        'AR': 'يؤسفنا إبلاغكم بأنه تم ضبط التلميذ(ة) {{student}} في حالة مخالفة لقواعد النزاهة الأكاديمية، والمتمثلة في {{reason}}. يعتبر هذا التصرف مخالفاً للقانون الداخلي ويستوجب إجراءات تأديبية لضمان تكافؤ الفرص بين الجميع.',
        'FR': 'Nous regrettons de vous informer que l\'élève {{student}} a été pris en flagrant délit de violation des règles d\'intégrité académique, à savoir {{reason}}. Ce comportement est considéré comme contraire au règlement intérieur et nécessite des mesures disciplinaires pour garantir l\'équité des chances pour tous.',
        'EN': 'We regret to inform you that student {{student}} has been caught violating academic integrity rules, specifically {{reason}}. This behavior is considered contrary to the internal regulations and requires disciplinary measures to ensure equal opportunities for all.',
        'ES': 'Lamentamos informarle que el estudiante {{student}} ha sido sorprendido violando las reglas de integridad académica, específicamente {{reason}}. Este comportamiento se considera contrario a las regulaciones internas y requiere medidas disciplinarias para garantizar igualdad de oportunidades para todos.',
        'IT': 'Ci dispiace informarvi che lo studente {{student}} è stato sorpreso a violare le regole di integrità accademica, specificamente {{reason}}. Questo comportamento è considerato contrario ai regolamenti interni e richiede misure disciplinari per garantire pari opportunità per tutti.',
        'DE': 'Wir bedauern, Sie darüber informieren zu müssen, dass der Schüler {{student}} beim Verstoß gegen die Regeln der akademischen Integrität erwischt wurde, insbesondere {{reason}}. Dieses Verhalten wird als gegen die internen Vorschriften verstoßend angesehen und erfordert disziplinarische Maßnahmen, um Chancengleichheit für alle zu gewährleisten.',
        'TR': 'Öğrenci {{student}}\'in akademik dürüstlük kurallarını ihlal ettiğini, özellikle {{reason}} konusunda bilgilendirmekten üzüntü duyuyoruz. Bu davranış, iç düzenlemelere aykırı olarak kabul edilir ve herkes için eşit fırsatları sağlamak için disiplin önlemleri gerektirir.'
      },
      'report.template.followUp': {
        'AR': 'في إطار المتابعة التربوية للتلميذ(ة) {{student}}، نلفت انتباهكم إلى {{reason}}. نرجو منكم الحضور أو التواصل مع إدارة المؤسسة في أقرب وقت لمناقشة الوضع واتخاذ التدابير اللازمة.',
        'FR': 'Dans le cadre du suivi éducatif de l\'élève {{student}}, nous attirons votre attention sur {{reason}}. Nous vous prions de bien vouloir vous présenter ou contacter l\'administration de l\'établissement dans les plus brefs délais pour discuter de la situation et prendre les mesures nécessaires.',
        'EN': 'As part of the educational follow-up of student {{student}}, we draw your attention to {{reason}}. We kindly ask you to attend or contact the school administration as soon as possible to discuss the situation and take the necessary measures.',
        'ES': 'Como parte del seguimiento educativo del estudiante {{student}}, llamamos su atención sobre {{reason}}. Le rogamos que asista o se ponga en contacto con la administración de la escuela lo antes posible para discutir la situación y tomar las medidas necesarias.',
        'IT': 'Nell\'ambito del follow-up educativo dello studente {{student}}, attiriamo la vostra attenzione su {{reason}}. Vi chiediamo gentilmente di presentarvi o contattare l\'amministrazione scolastica il prima possibile per discutere la situazione e prendere le misure necessarie.',
        'DE': 'Im Rahmen der pädagogischen Nachbetreuung des Schülers {{student}} machen wir Sie auf {{reason}} aufmerksam. Wir bitten Sie höflich, sich so bald wie möglich zu melden oder die Schulverwaltung zu kontaktieren, um die Situation zu besprechen und die notwendigen Maßnahmen zu ergreifen.',
        'TR': 'Öğrenci {{student}} için eğitim takibi kapsamında, {{reason}} konusuna dikkatinizi çekiyoruz. Durumu görüşmek ve gerekli önlemleri almak için lütfen en kısa sürede okul yönetimiyle iletişime geçmenizi veya katılmanızı rica ederiz.'
      },

      // Report Reasons - Academic
      'reportReason.academic.weakConcepts': {
        'AR': 'ضعف في استيعاب المفاهيم الأساسية',
        'FR': 'Faiblesse dans la compréhension des concepts fondamentaux',
        'EN': 'Weakness in understanding fundamental concepts',
        'ES': 'Debilidad en la comprensión de conceptos fundamentales',
        'IT': 'Debolezza nella comprensione dei concetti fondamentali',
        'DE': 'Schwäche im Verständnis grundlegender Konzepte',
        'TR': 'Temel kavramları anlamada zayıflık'
      },
      'reportReason.academic.declineResults': {
        'AR': 'تراجع ملحوظ في النتائج',
        'FR': 'Dégradation notable des résultats',
        'EN': 'Significant decline in results',
        'ES': 'Deterioro significativo de los resultados',
        'IT': 'Deterioramento significativo dei risultati',
        'DE': 'Erheblicher Rückgang der Ergebnisse',
        'TR': 'Sonuçlarda belirgin düşüş'
      },
      'reportReason.academic.neglectedHomework': {
        'AR': 'إهمال الواجبات المنزلية بصفة متكررة',
        'FR': 'Négligence fréquente des devoirs à la maison',
        'EN': 'Frequent neglect of homework',
        'ES': 'Negligencia frecuente de las tareas',
        'IT': 'Trascuramento frequente dei compiti a casa',
        'DE': 'Häufige Vernachlässigung der Hausaufgaben',
        'TR': 'Ev ödevlerini sık sık ihmal etme'
      },
      'reportReason.academic.noParticipation': {
        'AR': 'عدم المشاركة داخل القسم',
        'FR': 'Absence de participation en classe',
        'EN': 'Lack of participation in class',
        'ES': 'Falta de participación en clase',
        'IT': 'Mancanza di partecipazione in classe',
        'DE': 'Mangelnde Teilnahme im Unterricht',
        'TR': 'Sınıfta katılım eksikliği'
      },
      'reportReason.academic.excellence': {
        'AR': 'تفوق ملحوظ ومشاركة فعالة',
        'FR': 'Excellence remarquable et participation active',
        'EN': 'Outstanding excellence and active participation',
        'ES': 'Excelencia excepcional y participación activa',
        'IT': 'Eccellenza eccezionale e partecipazione attiva',
        'DE': 'Außergewöhnliche Exzellenz und aktive Teilnahme',
        'TR': 'Olağanüstü mükemmellik ve aktif katılım'
      },
      // Report Reasons - Behavioral
      'reportReason.behavioral.discipline': {
        'AR': 'ملاحظة تدني في الانضباط',
        'FR': 'Observation d\'une baisse de discipline',
        'EN': 'Observation of declining discipline',
        'ES': 'Observación de disminución de la disciplina',
        'IT': 'Osservazione di un calo della disciplina',
        'DE': 'Beobachtung abnehmender Disziplin',
        'TR': 'Disiplinde düşüş gözlemi'
      },
      'reportReason.behavioral.disruption': {
        'AR': 'التشويش المستمر داخل القسم',
        'FR': 'Perturbation continue en classe',
        'EN': 'Continuous disruption in class',
        'ES': 'Perturbación continua en clase',
        'IT': 'Disturbo continuo in classe',
        'DE': 'Andauernde Störung im Unterricht',
        'TR': 'Sınıfta sürekli rahatsızlık'
      },
      'reportReason.behavioral.noSupplies': {
        'AR': 'عدم إحضار اللوازم المدرسية',
        'FR': 'Absence de matériel scolaire',
        'EN': 'Failure to bring school supplies',
        'ES': 'Falta de material escolar',
        'IT': 'Mancanza di materiale scolastico',
        'DE': 'Fehlende Schulsachen',
        'TR': 'Okul malzemelerini getirmeme'
      },
      'reportReason.behavioral.phoneUse': {
        'AR': 'استعمال الهاتف النقال',
        'FR': 'Utilisation du téléphone portable',
        'EN': 'Use of mobile phone',
        'ES': 'Uso del teléfono móvil',
        'IT': 'Uso del telefono cellulare',
        'DE': 'Nutzung des Mobiltelefons',
        'TR': 'Cep telefonu kullanımı'
      },
      'reportReason.behavioral.aggressive': {
        'AR': 'سلوك عدواني مع الزملاء',
        'FR': 'Comportement agressif envers les camarades',
        'EN': 'Aggressive behavior towards classmates',
        'ES': 'Comportamiento agresivo hacia los compañeros',
        'IT': 'Comportamento aggressivo verso i compagni',
        'DE': 'Aggressives Verhalten gegenüber Klassenkameraden',
        'TR': 'Sınıf arkadaşlarına karşı saldırgan davranış'
      },
      'reportReason.behavioral.exemplary': {
        'AR': 'مشاركة إيجابية وسلوك مثالي',
        'FR': 'Participation positive et comportement exemplaire',
        'EN': 'Positive participation and exemplary behavior',
        'ES': 'Participación positiva y comportamiento ejemplar',
        'IT': 'Partecipazione positiva e comportamento esemplare',
        'DE': 'Positive Teilnahme und vorbildliches Verhalten',
        'TR': 'Pozitif katılım ve örnek davranış'
      },
      // Report Reasons - Follow-up
      'reportReason.followup.repeatedAbsence': {
        'AR': 'غياب متكرر دون مبرر',
        'FR': 'Absence répétée sans justification',
        'EN': 'Repeated absence without justification',
        'ES': 'Ausencia repetida sin justificación',
        'IT': 'Assenza ripetuta senza giustificazione',
        'DE': 'Wiederholte Abwesenheit ohne Begründung',
        'TR': 'Gerekçesiz tekrarlanan devamsızlık'
      },
      'reportReason.followup.lateness': {
        'AR': 'تأخرات صباحية متكررة',
        'FR': 'Retards matinaux répétés',
        'EN': 'Repeated morning lateness',
        'ES': 'Retrasos matutinos repetidos',
        'IT': 'Ritardi mattutini ripetuti',
        'DE': 'Wiederholte morgendliche Verspätung',
        'TR': 'Tekrarlanan sabah gecikmeleri'
      },
      'reportReason.followup.summonParent': {
        'AR': 'استدعاء ولي الأمر للأهمية',
        'FR': 'Convocation du tuteur pour urgence',
        'EN': 'Summoning parent/guardian for importance',
        'ES': 'Convocación del tutor por urgencia',
        'IT': 'Convocazione del tutore per urgenza',
        'DE': 'Einberufung des Erziehungsberechtigten wegen Dringlichkeit',
        'TR': 'Acil durum için veli çağırma'
      },
      'reportReason.followup.healthSocial': {
        'AR': 'متابعة ملف صحي/اجتماعي',
        'FR': 'Suivi d\'un dossier médical/social',
        'EN': 'Follow-up of health/social file',
        'ES': 'Seguimiento de expediente médico/social',
        'IT': 'Follow-up di un fascicolo sanitario/sociale',
        'DE': 'Nachbetreuung einer Gesundheits-/Sozialakte',
        'TR': 'Sağlık/sosyal dosya takibi'
      },
      // Report Reasons - Cheating
      'reportReason.cheating.attempt': {
        'AR': 'محاولة غش في الفرض المحروس',
        'FR': 'Tentative de tricherie lors d\'un contrôle surveillé',
        'EN': 'Cheating attempt during supervised test',
        'ES': 'Intento de trampa durante examen supervisado',
        'IT': 'Tentativo di imbroglio durante prova sorvegliata',
        'DE': 'Betrugsversuch während überwachter Prüfung',
        'TR': 'Gözetimli sınavda kopya girişimi'
      },
      'reportReason.cheating.homeworkCopy': {
        'AR': 'نقل الواجب المنزلي من الزملاء',
        'FR': 'Copie des devoirs auprès des camarades',
        'EN': 'Copying homework from classmates',
        'ES': 'Copia de tareas de compañeros',
        'IT': 'Copia dei compiti dai compagni',
        'DE': 'Abschreiben der Hausaufgaben von Klassenkameraden',
        'TR': 'Sınıf arkadaşlarından ödev kopyalama'
      },
      'reportReason.cheating.examDevice': {
        'AR': 'ضبط وسيلة غش أثناء الامتحان',
        'FR': 'Saisie d\'un moyen de tricherie pendant l\'examen',
        'EN': 'Caught with a cheating device during the exam',
        'ES': 'Sorprendido con un dispositivo para hacer trampa durante el examen',
        'IT': 'Preso con un dispositivo per imbrogliare durante l\'esame',
        'DE': 'Mit Betrugsgerät während der Prüfung erwischt',
        'TR': 'Sınav sırasında kopya cihazı ile yakalanma'
      }
    };
  }
}

