# Clés de traduction à ajouter - Page Achievements-Penalties

## Instructions
Ajoutez ces traductions dans `angular-frontend/src/app/services/language.service.ts` dans la méthode `loadTranslations()`, après les traductions existantes des certificats et rapports.

---

## 1. Traductions pour la page achievements-penalties

```typescript
// Achievements-Penalties Page
'achievementsPenalties.pageTitle': {
  'AR': 'الإجازات والعقوبات',
  'FR': 'Récompenses et sanctions',
  'EN': 'Achievements and penalties',
  'ES': 'Logros y sanciones',
  'IT': 'Risultati e sanzioni',
  'DE': 'Erfolge & Sanktionen',
  'TR': 'Başarılar ve Cezalar'
},
'achievementsPenalties.description': {
  'AR': 'مركز واحد لعرض شهادات التقدير والمخالفات السلوكية لكل قسم.',
  'FR': 'Un centre unique pour afficher les certificats de mérite et les infractions comportementales pour chaque classe.',
  'EN': 'A single hub to display appreciation certificates and behavioral violations for each class.',
  'ES': 'Un centro único para mostrar certificados de mérito e infracciones de comportamiento para cada clase.',
  'IT': 'Un centro unico per visualizzare certificati di merito e violazioni comportamentali per ogni classe.',
  'DE': 'Ein einziges Zentrum zur Anzeige von Verdienstzertifikaten und Verhaltensverstößen für jede Klasse.',
  'TR': 'Her sınıf için takdir sertifikaları ve davranış ihlallerini göstermek için tek bir merkez.'
},
'achievementsPenalties.tabAchievements': {
  'AR': 'الإنجازات',
  'FR': 'Réalisations',
  'EN': 'Achievements',
  'ES': 'Logros',
  'IT': 'Risultati',
  'DE': 'Erfolge',
  'TR': 'Başarılar'
},
'achievementsPenalties.tabPenalties': {
  'AR': 'العقوبات / التقارير',
  'FR': 'Sanctions / Rapports',
  'EN': 'Penalties / Reports',
  'ES': 'Sanciones / Informes',
  'IT': 'Sanzioni / Rapporti',
  'DE': 'Sanktionen / Berichte',
  'TR': 'Cezalar / Raporlar'
},
'achievementsPenalties.showPreviousCertificates': {
  'AR': 'عرض الشهادات السابقة للقسم:',
  'FR': 'Afficher les certificats précédents de la classe :',
  'EN': 'Show previous certificates for the class:',
  'ES': 'Mostrar certificados anteriores de la clase:',
  'IT': 'Mostra certificati precedenti della classe:',
  'DE': 'Vorherige Zertifikate der Klasse anzeigen:',
  'TR': 'Sınıfın önceki sertifikalarını göster:'
},
'achievementsPenalties.showPreviousReports': {
  'AR': 'عرض التقارير السابقة للقسم:',
  'FR': 'Afficher les rapports précédents de la classe :',
  'EN': 'Show previous reports for the class:',
  'ES': 'Mostrar informes anteriores de la clase:',
  'IT': 'Mostra rapporti precedenti della classe:',
  'DE': 'Vorherige Berichte der Klasse anzeigen:',
  'TR': 'Sınıfın önceki raporlarını göster:'
},
'achievementsPenalties.loadingCertificates': {
  'AR': 'جارٍ تحميل سجل الشهادات...',
  'FR': 'Chargement de l\'historique des certificats...',
  'EN': 'Loading the certificates record...',
  'ES': 'Cargando el historial de certificados...',
  'IT': 'Caricamento dello storico dei certificati...',
  'DE': 'Zertifikatsverlauf wird geladen...',
  'TR': 'Sertifika geçmişi yükleniyor...'
},
'achievementsPenalties.noCertificates': {
  'AR': 'لا توجد شهادات مسجلة لهذا القسم.',
  'FR': 'Il n\'y a aucun certificat enregistré pour cette classe.',
  'EN': 'There are no registered certificates for this class.',
  'ES': 'No hay certificados registrados para esta clase.',
  'IT': 'Non ci sono certificati registrati per questa classe.',
  'DE': 'Es gibt keine registrierten Zertifikate für diese Klasse.',
  'TR': 'Bu sınıf için kayıtlı sertifika yok.'
},
'achievementsPenalties.loadingReports': {
  'AR': 'جارٍ تحميل التقارير...',
  'FR': 'Chargement des rapports...',
  'EN': 'Loading reports...',
  'ES': 'Cargando informes...',
  'IT': 'Caricamento rapporti...',
  'DE': 'Berichte werden geladen...',
  'TR': 'Raporlar yükleniyor...'
},
'achievementsPenalties.noReports': {
  'AR': 'لا توجد تقارير سلوك في الوقت الحالي.',
  'FR': 'Il n\'y a aucun rapport de comportement pour le moment.',
  'EN': 'There are no behavior reports at the moment.',
  'ES': 'No hay informes de comportamiento en este momento.',
  'IT': 'Non ci sono rapporti comportamentali al momento.',
  'DE': 'Es gibt derzeit keine Verhaltensberichte.',
  'TR': 'Şu anda davranış raporu yok.'
},
'achievementsPenalties.exportPenaltiesToPDF': {
  'AR': 'تصدير قائمة العقوبات والتقارير إلى PDF',
  'FR': 'Exporter la liste des sanctions et rapports en PDF',
  'EN': 'Export the list of penalties and reports to PDF',
  'ES': 'Exportar la lista de sanciones e informes a PDF',
  'IT': 'Esporta l\'elenco delle sanzioni e dei rapporti in PDF',
  'DE': 'Liste der Sanktionen und Berichte als PDF exportieren',
  'TR': 'Cezalar ve raporlar listesini PDF olarak dışa aktar'
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
'achievementsPenalties.exportPDF': {
  'AR': 'تصدير PDF',
  'FR': 'Exporter en PDF',
  'EN': 'Export PDF',
  'ES': 'Exportar PDF',
  'IT': 'Esporta PDF',
  'DE': 'Als PDF exportieren',
  'TR': 'PDF dışa aktar'
},
'achievementsPenalties.notSpecified': {
  'AR': 'غير محدد',
  'FR': 'Non spécifié',
  'EN': 'Not specified',
  'ES': 'No especificado',
  'IT': 'Non specificato',
  'DE': 'Nicht angegeben',
  'TR': 'Belirtilmemiş'
},
'achievementsPenalties.studentName': {
  'AR': 'اسم التلميذ',
  'FR': 'Nom de l\'élève',
  'EN': 'Student name',
  'ES': 'Nombre del estudiante',
  'IT': 'Nome studente',
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
'achievementsPenalties.classLabel': {
  'AR': 'القسم:',
  'FR': 'Classe :',
  'EN': 'Class:',
  'ES': 'Clase:',
  'IT': 'Classe:',
  'DE': 'Klasse:',
  'TR': 'Sınıf:'
},
'achievementsPenalties.errorLoadClasses': {
  'AR': 'تعذر تحميل قائمة الأقسام',
  'FR': 'Impossible de charger la liste des classes.',
  'EN': 'Failed to load the list of classes.',
  'ES': 'Error al cargar la lista de clases.',
  'IT': 'Impossibile caricare l\'elenco delle classi.',
  'DE': 'Klassenliste konnte nicht geladen werden.',
  'TR': 'Sınıf listesi yüklenemedi.'
},
'achievementsPenalties.errorLoadReports': {
  'AR': 'تعذر تحميل تقارير السلوك',
  'FR': 'Impossible de charger les rapports de comportement.',
  'EN': 'Failed to load behavior reports.',
  'ES': 'Error al cargar los informes de comportamiento.',
  'IT': 'Impossibile caricare i rapporti comportamentali.',
  'DE': 'Verhaltensberichte konnten nicht geladen werden.',
  'TR': 'Davranış raporları yüklenemedi.'
},
'achievementsPenalties.errorLoadCertificates': {
  'AR': 'تعذر تحميل سجل الشهادات',
  'FR': 'Impossible de charger l\'historique des certificats.',
  'EN': 'Failed to load the certificates history.',
  'ES': 'Error al cargar el historial de certificados.',
  'IT': 'Impossibile caricare lo storico dei certificati.',
  'DE': 'Zertifikatsverlauf konnte nicht geladen werden.',
  'TR': 'Sertifika geçmişi yüklenemedi.'
},
'achievementsPenalties.noAdditionalDetails': {
  'AR': 'لا يوجد تفاصيل إضافية',
  'FR': 'Aucun détail supplémentaire.',
  'EN': 'No additional details.',
  'ES': 'No hay detalles adicionales.',
  'IT': 'Nessun dettaglio aggiuntivo.',
  'DE': 'Keine zusätzlichen Details.',
  'TR': 'Ek detay yok.'
},
'achievementsPenalties.unknownStudent': {
  'AR': 'طالب غير معروف',
  'FR': 'Élève inconnu.',
  'EN': 'Unknown student.',
  'ES': 'Estudiante desconocido.',
  'IT': 'Studente sconosciuto.',
  'DE': 'Unbekannter Schüler.',
  'TR': 'Bilinmeyen öğrenci.'
},
'achievementsPenalties.noClassesAvailable': {
  'AR': 'لا توجد أقسام متاحة',
  'FR': 'Aucune classe disponible.',
  'EN': 'No classes available.',
  'ES': 'No hay clases disponibles.',
  'IT': 'Nessuna classe disponibile.',
  'DE': 'Keine Klassen verfügbar.',
  'TR': 'Kullanılabilir sınıf yok.'
},
'achievementsPenalties.noReportsToExport': {
  'AR': 'لا توجد تقارير لتصديرها',
  'FR': 'Aucun rapport à exporter.',
  'EN': 'There are no reports to export.',
  'ES': 'No hay informes para exportar.',
  'IT': 'Non ci sono rapporti da esportare.',
  'DE': 'Es gibt keine Berichte zum Exportieren.',
  'TR': 'Dışa aktarılacak rapor yok.'
},
'achievementsPenalties.noCertificatesToExport': {
  'AR': 'لا توجد شهادات لتصديرها',
  'FR': 'Aucun certificat à exporter.',
  'EN': 'There are no certificates to export.',
  'ES': 'No hay certificados para exportar.',
  'IT': 'Non ci sono certificati da esportare.',
  'DE': 'Es gibt keine Zertifikate zum Exportieren.',
  'TR': 'Dışa aktarılacak sertifika yok.'
},
'achievementsPenalties.errorExportPDF': {
  'AR': 'حدث خطأ أثناء تصدير PDF',
  'FR': 'Une erreur s\'est produite lors de l\'exportation du PDF.',
  'EN': 'An error occurred while exporting the PDF.',
  'ES': 'Ocurrió un error al exportar el PDF.',
  'IT': 'Si è verificato un errore durante l\'esportazione del PDF.',
  'DE': 'Beim Exportieren des PDFs ist ein Fehler aufgetreten.',
  'TR': 'PDF dışa aktarılırken bir hata oluştu.'
},
'achievementsPenalties.penaltiesReportTitle': {
  'AR': 'تقرير العقوبات والتقارير',
  'FR': 'Rapport des sanctions et rapports',
  'EN': 'Penalties and reports report',
  'ES': 'Informe de sanciones e informes',
  'IT': 'Rapporto delle sanzioni e dei rapporti',
  'DE': 'Sanktionen- und Berichtsbericht',
  'TR': 'Cezalar ve raporlar raporu'
},
'achievementsPenalties.certificatesReportTitle': {
  'AR': 'تقرير الشهادات',
  'FR': 'Rapport des certificats',
  'EN': 'Certificates report',
  'ES': 'Informe de certificados',
  'IT': 'Rapporto dei certificati',
  'DE': 'Zertifikatsbericht',
  'TR': 'Sertifikalar raporu'
},
'achievementsPenalties.exportDate': {
  'AR': 'تاريخ التصدير:',
  'FR': 'Date d\'export :',
  'EN': 'Export date:',
  'ES': 'Fecha de exportación:',
  'IT': 'Data di esportazione:',
  'DE': 'Exportdatum:',
  'TR': 'Dışa aktarma tarihi:'
},
```

---

## 2. Traductions pour les templates de certificats (Backend)

```typescript
// Certificate Templates - Names
'certificateTemplate.academicExcellence.name': {
  'AR': 'تقدير تفوق دراسي',
  'FR': 'Reconnaissance d\'excellence académique',
  'EN': 'Academic Excellence Recognition',
  'ES': 'Reconocimiento de excelencia académica',
  'IT': 'Riconoscimento di eccellenza accademica',
  'DE': 'Anerkennung akademischer Exzellenz',
  'TR': 'Akademik mükemmellik tanınması'
},
'certificateTemplate.academicExcellence.description': {
  'AR': 'شهادة تبرز التميز الأكاديمي والتفوق في الحصص والمناهج الرقمية.',
  'FR': 'Certificat mettant en valeur l\'excellence académique et la réussite dans les cours et les programmes numériques.',
  'EN': 'Certificate highlighting academic excellence and achievement in classes and digital curricula.',
  'ES': 'Certificado que destaca la excelencia académica y el logro en las clases y los planes de estudio digitales.',
  'IT': 'Certificato che evidenzia l\'eccellenza accademica e il successo nelle classi e nei curricula digitali.',
  'DE': 'Zertifikat, das akademische Exzellenz und Leistungen in Klassen und digitalen Lehrplänen hervorhebt.',
  'TR': 'Sınıflarda ve dijital müfredatlarda akademik mükemmelliği ve başarıyı vurgulayan sertifika.'
},
'certificateTemplate.goodBehavior.name': {
  'AR': 'تقدير حسن سلوك',
  'FR': 'Reconnaissance de bon comportement',
  'EN': 'Good Behavior Recognition',
  'ES': 'Reconocimiento de buen comportamiento',
  'IT': 'Riconoscimento del buon comportamento',
  'DE': 'Anerkennung guten Verhaltens',
  'TR': 'İyi davranış tanınması'
},
'certificateTemplate.goodBehavior.description': {
  'AR': 'شهادة للسلوك النموذجي والمساهمة الإيجابية في بيئة الصف.',
  'FR': 'Certificat pour un comportement exemplaire et une contribution positive à l\'environnement de la classe.',
  'EN': 'Certificate for exemplary behavior and positive contribution to the classroom environment.',
  'ES': 'Certificado por comportamiento ejemplar y contribución positiva al ambiente del aula.',
  'IT': 'Certificato per comportamento esemplare e contributo positivo all\'ambiente della classe.',
  'DE': 'Zertifikat für vorbildliches Verhalten und positiven Beitrag zum Klassenumfeld.',
  'TR': 'Örnek davranış ve sınıf ortamına olumlu katkı için sertifika.'
},
'certificateTemplate.activeParticipation.name': {
  'AR': 'تقدير مشاركة فعالة',
  'FR': 'Reconnaissance de participation active',
  'EN': 'Active Participation Recognition',
  'ES': 'Reconocimiento de participación activa',
  'IT': 'Riconoscimento della partecipazione attiva',
  'DE': 'Anerkennung aktiver Teilnahme',
  'TR': 'Aktif katılım tanınması'
},
'certificateTemplate.activeParticipation.description': {
  'AR': 'تسلط الضوء على التفاعل والنجاح في المشاريع الجماعية والتقنيات الحديثة.',
  'FR': 'Met en lumière l\'interaction et le succès dans les projets collectifs et les technologies modernes.',
  'EN': 'Highlights interaction and success in group projects and modern technologies.',
  'ES': 'Destaca la interacción y el éxito en proyectos grupales y tecnologías modernas.',
  'IT': 'Evidenzia l\'interazione e il successo nei progetti di gruppo e nelle tecnologie moderne.',
  'DE': 'Hebt Interaktion und Erfolg in Gruppenprojekten und modernen Technologien hervor.',
  'TR': 'Grup projelerinde ve modern teknolojilerde etkileşimi ve başarıyı vurgular.'
},
```

---

## 3. Traductions pour les raisons de rapports (Report Reasons)

```typescript
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
  'EN': 'Summoning the guardian for urgency',
  'ES': 'Convocatoria del tutor por urgencia',
  'IT': 'Convocazione del tutore per urgenza',
  'DE': 'Einberufung des Erziehungsberechtigten wegen Dringlichkeit',
  'TR': 'Acil durum için velinin çağrılması'
},
'reportReason.followup.healthFile': {
  'AR': 'متابعة ملف صحي/اجتماعي',
  'FR': 'Suivi d\'un dossier santé/social',
  'EN': 'Monitoring of a health/social file',
  'ES': 'Seguimiento de un expediente de salud/social',
  'IT': 'Monitoraggio di un fascicolo sanitario/sociale',
  'DE': 'Überwachung einer Gesundheits-/Sozialakte',
  'TR': 'Sağlık/sosyal dosya takibi'
},
// Report Reasons - Cheating
'reportReason.cheating.testAttempt': {
  'AR': 'محاولة غش في الفرض المحروس',
  'FR': 'Tentative de tricherie lors d\'un contrôle surveillé',
  'EN': 'Attempted cheating during a supervised test',
  'ES': 'Intento de hacer trampa durante un examen supervisado',
  'IT': 'Tentativo di imbroglio durante un test sorvegliato',
  'DE': 'Versuchtes Betrügen bei einer beaufsichtigten Prüfung',
  'TR': 'Gözetimli sınav sırasında kopya çekme girişimi'
},
'reportReason.cheating.copyHomework': {
  'AR': 'نقل الواجب المنزلي من الزملاء',
  'FR': 'Copie des devoirs des camarades',
  'EN': 'Copying homework from classmates',
  'ES': 'Copiar tareas de los compañeros',
  'IT': 'Copiare i compiti dai compagni',
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
},
```

---

## 4. Traductions pour les templates de contenu des rapports

```typescript
// Report Content Templates
'reportTemplate.behavioral.content': {
  'AR': 'بناءً على متابعتنا المستمرة للتلميذ(ة) {{student}}، تم تسجيل ملاحظة سلوكية تتعلق بـ "{{reason}}". نود إحاطتكم علماً بأن هذا السلوك يؤثر سلباً على السير الحسن للدرس وعلى تركيز التلميذ وزملائه. وعليه، فإننا نؤكد على ضرورة الالتزام بالنظام الداخلي للمؤسسة.',
  'FR': 'Suite au suivi continu de l\'élève {{student}}, une observation comportementale a été enregistrée concernant "{{reason}}". Nous tenons à vous informer que ce comportement affecte négativement le bon déroulement du cours et la concentration de l\'élève et de ses camarades. Par conséquent, nous soulignons la nécessité de respecter le règlement intérieur de l\'établissement.',
  'EN': 'Based on our ongoing monitoring of student {{student}}, a behavioral observation has been recorded regarding "{{reason}}". We would like to inform you that this behavior negatively affects the proper conduct of the class and the concentration of the student and their classmates. Therefore, we emphasize the need to comply with the institution\'s internal regulations.',
  'ES': 'Basado en nuestro seguimiento continuo del estudiante {{student}}, se ha registrado una observación conductual sobre "{{reason}}". Nos gustaría informarle que este comportamiento afecta negativamente la correcta conducta de la clase y la concentración del estudiante y sus compañeros. Por lo tanto, enfatizamos la necesidad de cumplir con las regulaciones internas de la institución.',
  'IT': 'In base al nostro monitoraggio continuo dello studente {{student}}, è stata registrata un\'osservazione comportamentale riguardo "{{reason}}". Vorremmo informarvi che questo comportamento influenza negativamente la corretta condotta della classe e la concentrazione dello studente e dei suoi compagni. Pertanto, sottolineiamo la necessità di rispettare i regolamenti interni dell\'istituzione.',
  'DE': 'Basierend auf unserer kontinuierlichen Überwachung des Schülers {{student}} wurde eine Verhaltensbeobachtung bezüglich "{{reason}}" aufgezeichnet. Wir möchten Sie informieren, dass dieses Verhalten den ordnungsgemäßen Ablauf des Unterrichts und die Konzentration des Schülers und seiner Klassenkameraden negativ beeinflusst. Daher betonen wir die Notwendigkeit, die internen Vorschriften der Institution einzuhalten.',
  'TR': 'Öğrenci {{student}} hakkındaki sürekli izlememize dayanarak, "{{reason}}" ile ilgili bir davranış gözlemi kaydedilmiştir. Bu davranışın dersin düzenli yürütülmesini ve öğrencinin ve sınıf arkadaşlarının konsantrasyonunu olumsuz etkilediğini bilmenizi isteriz. Bu nedenle, kurumun iç düzenlemelerine uyma gereğini vurguluyoruz.'
},
'reportTemplate.academic.content': {
  'AR': 'من خلال تقييمنا للمسار الدراسي للتلميذ(ة) {{student}}، لاحظنا {{reason}}. هذا الأمر يستدعي تضافر الجهود بين المدرسة والمنزل لتدارك النقائص وتعزيز المكتسبات، لضمان تحقيق نتائج أفضل في المستقبل.',
  'FR': 'À travers notre évaluation du parcours scolaire de l\'élève {{student}}, nous avons remarqué {{reason}}. Cela nécessite des efforts conjoints entre l\'école et la maison pour combler les lacunes et renforcer les acquis, afin d\'assurer de meilleurs résultats à l\'avenir.',
  'EN': 'Through our assessment of student {{student}}\'s academic progress, we have noticed {{reason}}. This requires joint efforts between school and home to address deficiencies and strengthen achievements, to ensure better results in the future.',
  'ES': 'A través de nuestra evaluación del progreso académico del estudiante {{student}}, hemos notado {{reason}}. Esto requiere esfuerzos conjuntos entre la escuela y el hogar para abordar las deficiencias y fortalecer los logros, para asegurar mejores resultados en el futuro.',
  'IT': 'Attraverso la nostra valutazione del progresso accademico dello studente {{student}}, abbiamo notato {{reason}}. Ciò richiede sforzi congiunti tra scuola e famiglia per affrontare le carenze e rafforzare i risultati, per garantire migliori risultati in futuro.',
  'DE': 'Durch unsere Bewertung des akademischen Fortschritts des Schülers {{student}} haben wir {{reason}} festgestellt. Dies erfordert gemeinsame Anstrengungen zwischen Schule und Zuhause, um Defizite zu beheben und Erfolge zu stärken, um in Zukunft bessere Ergebnisse zu gewährleisten.',
  'TR': 'Öğrenci {{student}}\'ın akademik ilerlemesini değerlendirmemizde {{reason}} fark ettik. Bu, eksiklikleri gidermek ve başarıları güçlendirmek, gelecekte daha iyi sonuçlar sağlamak için okul ve ev arasında ortak çabalar gerektirir.'
},
'reportTemplate.cheating.content': {
  'AR': 'يؤسفنا إبلاغكم بأنه تم ضبط التلميذ(ة) {{student}} في حالة مخالفة لقواعد النزاهة الأكاديمية، والمتمثلة في {{reason}}. يعتبر هذا التصرف مخالفاً للقانون الداخلي ويستوجب إجراءات تأديبية لضمان تكافؤ الفرص بين الجميع.',
  'FR': 'Nous sommes désolés de vous informer que l\'élève {{student}} a été pris en flagrant délit de violation des règles d\'intégrité académique, à savoir {{reason}}. Cet acte est considéré comme contraire au règlement intérieur et nécessite des mesures disciplinaires pour garantir l\'équité des chances pour tous.',
  'EN': 'We regret to inform you that student {{student}} was caught violating academic integrity rules, specifically {{reason}}. This behavior is considered contrary to the internal regulations and requires disciplinary measures to ensure equal opportunities for all.',
  'ES': 'Lamentamos informarle que el estudiante {{student}} fue sorprendido violando las reglas de integridad académica, específicamente {{reason}}. Este comportamiento se considera contrario a las regulaciones internas y requiere medidas disciplinarias para asegurar igualdad de oportunidades para todos.',
  'IT': 'Ci dispiace informarvi che lo studente {{student}} è stato sorpreso a violare le regole di integrità accademica, specificamente {{reason}}. Questo comportamento è considerato contrario ai regolamenti interni e richiede misure disciplinari per garantire pari opportunità per tutti.',
  'DE': 'Wir bedauern, Sie darüber informieren zu müssen, dass der Schüler {{student}} bei der Verletzung akademischer Integritätsregeln erwischt wurde, insbesondere {{reason}}. Dieses Verhalten wird als gegen die internen Vorschriften verstoßend angesehen und erfordert disziplinarische Maßnahmen, um gleiche Chancen für alle zu gewährleisten.',
  'TR': 'Öğrenci {{student}}\'ın akademik dürüstlük kurallarını ihlal ettiğini, özellikle {{reason}} olayını size bildirmekten üzgünüz. Bu davranış iç düzenlemelere aykırı kabul edilir ve herkes için eşit fırsatları sağlamak için disiplin önlemleri gerektirir.'
},
'reportTemplate.followup.content': {
  'AR': 'في إطار المتابعة التربوية للتلميذ(ة) {{student}}، نلفت انتباهكم إلى {{reason}}. نرجو منكم الحضور أو التواصل مع إدارة المؤسسة في أقرب وقت لمناقشة الوضع واتخاذ التدابير اللازمة.',
  'FR': 'Dans le cadre du suivi éducatif de l\'élève {{student}}, nous attirons votre attention sur {{reason}}. Nous vous prions de vous présenter ou de contacter l\'administration de l\'établissement dans les plus brefs délais pour discuter de la situation et prendre les mesures nécessaires.',
  'EN': 'As part of the educational follow-up of student {{student}}, we draw your attention to {{reason}}. We request that you come in or contact the institution\'s administration as soon as possible to discuss the situation and take necessary measures.',
  'ES': 'Como parte del seguimiento educativo del estudiante {{student}}, llamamos su atención sobre {{reason}}. Solicitamos que se presente o se ponga en contacto con la administración de la institución lo antes posible para discutir la situación y tomar las medidas necesarias.',
  'IT': 'Nell\'ambito del follow-up educativo dello studente {{student}}, attiriamo la vostra attenzione su {{reason}}. Vi chiediamo di presentarvi o contattare l\'amministrazione dell\'istituzione il prima possibile per discutere la situazione e prendere le misure necessarie.',
  'DE': 'Im Rahmen der pädagogischen Nachbetreuung des Schülers {{student}} machen wir Sie auf {{reason}} aufmerksam. Wir bitten Sie, sich so bald wie möglich zu melden oder die Verwaltung der Einrichtung zu kontaktieren, um die Situation zu besprechen und die erforderlichen Maßnahmen zu ergreifen.',
  'TR': 'Öğrenci {{student}}\'ın eğitim takibi kapsamında, dikkatinizi {{reason}} konusuna çekiyoruz. Durumu görüşmek ve gerekli önlemleri almak için en kısa sürede kuruma gelmenizi veya kurum yönetimiyle iletişime geçmenizi rica ediyoruz.'
},
```

---

## Notes d'utilisation

1. **Placeholders**: Les templates utilisent des placeholders comme `{{student}}` et `{{reason}}` qui seront remplacés dynamiquement.

2. **Ajout dans LanguageService**: Copiez ces traductions dans le fichier `language.service.ts` dans la méthode `loadTranslations()`, juste après les traductions existantes des certificats et rapports.

3. **Utilisation dans le code**: Utilisez ces clés avec `this.translate('achievementsPenalties.pageTitle')` dans vos composants.

4. **Raisons de rapports**: Les raisons sont actuellement codées en dur en arabe dans `report-generator.component.ts`. Vous devrez créer un système de mapping pour utiliser ces traductions.

5. **Templates de certificats**: Les noms et descriptions des templates sont actuellement en arabe dans le backend. Vous devrez soit traduire côté backend, soit créer un mapping côté frontend.




