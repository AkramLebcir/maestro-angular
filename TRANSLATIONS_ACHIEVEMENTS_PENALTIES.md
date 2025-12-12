# Traductions Complètes - Page الإجازات والعقوبات (Achievements & Penalties)

## Table des matières
1. [Interface de la page achievements-penalties](#1-interface-de-la-page-achievements-penalties)
2. [Textes des certificats (Certificate Generator)](#2-textes-des-certificats-certificate-generator)
3. [Textes des rapports (Report Generator)](#3-textes-des-rapports-report-generator)
4. [Templates par défaut des certificats](#4-templates-par-défaut-des-certificats)
5. [Messages d'erreur et de statut](#5-messages-derreur-et-de-statut)

---

## 1. Interface de la page achievements-penalties

### Titres et descriptions

| Arabe | Français | Anglais |
|-------|----------|---------|
| الإجازات والعقوبات | Récompenses et sanctions | Achievements and penalties |
| مركز واحد لعرض شهادات التقدير والمخالفات السلوكية لكل قسم. | Un centre unique pour afficher les certificats de mérite et les infractions comportementales pour chaque classe. | A single hub to display appreciation certificates and behavioral violations for each class. |
| الإنجازات | Réalisations | Achievements |
| العقوبات / التقارير | Sanctions / Rapports | Penalties / Reports |

### Sélection et filtres

| Arabe | Français | Anglais |
|-------|----------|---------|
| عرض الشهادات السابقة للقسم: | Afficher les certificats précédents de la classe : | Show previous certificates for the class: |
| عرض التقارير السابقة للقسم: | Afficher les rapports précédents de la classe : | Show previous reports for the class: |

### Messages de statut

| Arabe | Français | Anglais |
|-------|----------|---------|
| جارٍ تحميل سجل الشهادات... | Chargement de l'historique des certificats... | Loading the certificates record... |
| لا توجد شهادات مسجلة لهذا القسم. | Il n'y a aucun certificat enregistré pour cette classe. | There are no registered certificates for this class. |
| جارٍ تحميل التقارير... | Chargement des rapports... | Loading reports... |
| لا توجد تقارير سلوك في الوقت الحالي. | Il n'y a aucun rapport de comportement pour le moment. | There are no behavior reports at the moment. |

### Boutons d'export

| Arabe | Français | Anglais |
|-------|----------|---------|
| تصدير قائمة العقوبات والتقارير إلى PDF | Exporter la liste des sanctions et rapports en PDF | Export the list of penalties and reports to PDF |
| جارٍ التصدير... | Exportation en cours... | Exporting... |
| تصدير PDF | Exporter en PDF | Export PDF |

### Libellés des données

| Arabe | Français | Anglais |
|-------|----------|---------|
| اسم التلميذ | Nom de l'élève | Student name |
| نوع الشهادة | Type de certificat | Certificate type |
| تاريخ الإصدار | Date d'émission | Issue date |
| القسم: {{ className }} | Classe : {{ className }} | Class: {{ className }} |
| غير محدد | Non spécifié | Not specified |

### Messages d'erreur (TypeScript)

| Arabe | Français | Anglais |
|-------|----------|---------|
| تعذر تحميل قائمة الأقسام | Impossible de charger la liste des classes. | Failed to load the list of classes. |
| تعذر تحميل تقارير السلوك | Impossible de charger les rapports de comportement. | Failed to load behavior reports. |
| تعذر تحميل سجل الشهادات | Impossible de charger l'historique des certificats. | Failed to load the certificates history. |
| لا يوجد تفاصيل إضافية | Aucun détail supplémentaire. | No additional details. |
| طالب غير معروف | Élève inconnu. | Unknown student. |
| لا توجد أقسام متاحة | Aucune classe disponible. | No classes available. |
| لا توجد تقارير لتصديرها | Aucun rapport à exporter. | There are no reports to export. |
| لا توجد شهادات لتصديرها | Aucun certificat à exporter. | There are no certificates to export. |
| حدث خطأ أثناء تصدير PDF | Une erreur s'est produite lors de l'exportation du PDF. | An error occurred while exporting the PDF. |

### Titres dans les PDF

| Arabe | Français | Anglais |
|-------|----------|---------|
| تقرير العقوبات والتقارير | Rapport des sanctions et rapports | Penalties and reports report |
| تقرير الشهادات | Rapport des certificats | Certificates report |
| تاريخ التصدير: {{date}} | Date d'export : {{date}} | Export date: {{date}} |

---

## 2. Textes des certificats (Certificate Generator)

### Interface du générateur

| Arabe | Français | Anglais |
|-------|----------|---------|
| مولّد الشهادات | Générateur de certificats | Certificate Generator |
| حرِّر قالب الشهادة مباشرةً هنا لطباعته أو تصديره. | Modifiez directement ici le modèle de certificat pour l'imprimer ou l'exporter. | Edit the certificate template directly here to print or export it. |
| القسم | Classe | Class |
| التلميذ | Élève | Student |
| جارٍ التحميل... | Chargement... | Loading... |
| النص الرئيسي | Texte principal | Main text |
| السبب | Raison | Reason |
| تاريخ الإصدار | Date d'émission | Issue date |
| السنة الدراسية | Année scolaire | Academic year |
| التوقيع | Signature | Signature |
| إصدار الشهادة | Émettre le certificat | Issue certificate |
| جارٍ الإصدار... | Émission en cours... | Issuing... |
| معاينة | Aperçu | Preview |
| تصدير | Exporter | Export |
| جارٍ التصدير... | Exportation en cours... | Exporting... |

### Contenu du certificat (Aperçu)

| Arabe | Français | Anglais |
|-------|----------|---------|
| شهادة تقدير | Certificat de mérite | Certificate of Appreciation |
| يُمنح هذا الشرف إلى | Ce certificat est décerné à | This certificate is awarded to |
| اعترافاً بـ | En reconnaissance de | In recognition of |
| التميز | Excellence | Excellence |

### Noms des templates de certificats

| Arabe | Français | Anglais |
|-------|----------|---------|
| تقدير تفوق دراسي | Reconnaissance d'excellence académique | Academic Excellence Recognition |
| تقدير حسن سلوك | Reconnaissance de bon comportement | Good Behavior Recognition |
| تقدير مشاركة فعالة | Reconnaissance de participation active | Active Participation Recognition |

---

## 3. Textes des rapports (Report Generator)

### Interface du générateur de rapports

| Arabe | Français | Anglais |
|-------|----------|---------|
| إعداد التقرير | Configuration du rapport | Report setup |
| القسم | Classe | Class |
| اختر القسم | Sélectionner une classe | Select class |
| التلميذ | Élève | Student |
| اختر التلميذ | Sélectionner un élève | Select student |
| نوع التقرير | Type de rapport | Report type |
| السبب | Raison | Reason |
| اختر السبب | Sélectionner une raison | Select reason |
| المحتوى | Contenu | Content |
| تفاصيل إضافية | Détails supplémentaires | Additional details |
| التوصيات | Recommandations | Recommendations |
| حفظ وإصدار | Enregistrer et émettre | Save and issue |
| جارٍ الحفظ... | Enregistrement en cours... | Saving... |
| معاينة | Aperçu | Preview |

### En-tête du rapport (Aperçu)

| Arabe | Français | Anglais |
|-------|----------|---------|
| الجمهورية الجزائرية الديمقراطية الشعبية | République Algérienne Démocratique et Populaire | People's Democratic Republic of Algeria |
| وزارة التربية الوطنية | Ministère de l'Éducation Nationale | Ministry of National Education |
| مؤسسة | Établissement | School |
| اسم التلميذ | Nom de l'élève | Student name |
| القسم | Classe | Class |
| الأستاذ | Enseignant | Teacher |
| التاريخ | Date | Date |

### Titres des types de rapports

| Arabe | Français | Anglais |
|-------|----------|---------|
| تقرير أكاديمي | Rapport académique | Academic report |
| تقرير سلوكي | Rapport comportemental | Behavioral report |
| تقرير متابعة | Rapport de suivi | Follow-up report |
| تقرير مخالفة النزاهة الأكاديمية | Rapport de violation de l'intégrité académique | Academic integrity violation report |

### Types de rapports (Options)

| Arabe | Français | Anglais |
|-------|----------|---------|
| أكاديمي | Académique | Academic |
| سلوكي | Comportemental | Behavioral |
| متابعة | Suivi | Follow-up |
| مخالفة النزاهة الأكاديمية | Violation de l'intégrité académique | Academic integrity violation |

### Sections du rapport

| Arabe | Français | Anglais |
|-------|----------|---------|
| ملاحظات إضافية | Notes supplémentaires | Additional notes |
| التوصيات | Recommandations | Recommendations |
| توقيع الأستاذ | Signature de l'enseignant | Teacher signature |
| توقيع ولي الأمر | Signature du tuteur | Parent signature |

### Templates de contenu des rapports

#### Rapport Comportemental (BEHAVIORAL)

| Arabe | Français | Anglais |
|-------|----------|---------|
| بناءً على متابعتنا المستمرة للتلميذ(ة) {{student}}، تم تسجيل ملاحظة سلوكية تتعلق بـ "{{reason}}". نود إحاطتكم علماً بأن هذا السلوك يؤثر سلباً على السير الحسن للدرس وعلى تركيز التلميذ وزملائه. وعليه، فإننا نؤكد على ضرورة الالتزام بالنظام الداخلي للمؤسسة. | Suite au suivi continu de l'élève {{student}}, une observation comportementale a été enregistrée concernant "{{reason}}". Nous tenons à vous informer que ce comportement affecte négativement le bon déroulement du cours et la concentration de l'élève et de ses camarades. Par conséquent, nous soulignons la nécessité de respecter le règlement intérieur de l'établissement. | Based on our ongoing monitoring of student {{student}}, a behavioral observation has been recorded regarding "{{reason}}". We would like to inform you that this behavior negatively affects the proper conduct of the class and the concentration of the student and their classmates. Therefore, we emphasize the need to comply with the institution's internal regulations. |

#### Rapport Académique (ACADEMIC)

| Arabe | Français | Anglais |
|-------|----------|---------|
| من خلال تقييمنا للمسار الدراسي للتلميذ(ة) {{student}}، لاحظنا {{reason}}. هذا الأمر يستدعي تضافر الجهود بين المدرسة والمنزل لتدارك النقائص وتعزيز المكتسبات، لضمان تحقيق نتائج أفضل في المستقبل. | À travers notre évaluation du parcours scolaire de l'élève {{student}}, nous avons remarqué {{reason}}. Cela nécessite des efforts conjoints entre l'école et la maison pour combler les lacunes et renforcer les acquis, afin d'assurer de meilleurs résultats à l'avenir. | Through our assessment of student {{student}}'s academic progress, we have noticed {{reason}}. This requires joint efforts between school and home to address deficiencies and strengthen achievements, to ensure better results in the future. |

#### Rapport de Violation de l'Intégrité (CHEATING)

| Arabe | Français | Anglais |
|-------|----------|---------|
| يؤسفنا إبلاغكم بأنه تم ضبط التلميذ(ة) {{student}} في حالة مخالفة لقواعد النزاهة الأكاديمية، والمتمثلة في {{reason}}. يعتبر هذا التصرف مخالفاً للقانون الداخلي ويستوجب إجراءات تأديبية لضمان تكافؤ الفرص بين الجميع. | Nous sommes désolés de vous informer que l'élève {{student}} a été pris en flagrant délit de violation des règles d'intégrité académique, à savoir {{reason}}. Cet acte est considéré comme contraire au règlement intérieur et nécessite des mesures disciplinaires pour garantir l'équité des chances pour tous. | We regret to inform you that student {{student}} was caught violating academic integrity rules, specifically {{reason}}. This behavior is considered contrary to the internal regulations and requires disciplinary measures to ensure equal opportunities for all. |

#### Rapport de Suivi (FOLLOW_UP)

| Arabe | Français | Anglais |
|-------|----------|---------|
| في إطار المتابعة التربوية للتلميذ(ة) {{student}}، نلفت انتباهكم إلى {{reason}}. نرجو منكم الحضور أو التواصل مع إدارة المؤسسة في أقرب وقت لمناقشة الوضع واتخاذ التدابير اللازمة. | Dans le cadre du suivi éducatif de l'élève {{student}}, nous attirons votre attention sur {{reason}}. Nous vous prions de vous présenter ou de contacter l'administration de l'établissement dans les plus brefs délais pour discuter de la situation et prendre les mesures nécessaires. | As part of the educational follow-up of student {{student}}, we draw your attention to {{reason}}. We request that you come in or contact the institution's administration as soon as possible to discuss the situation and take necessary measures. |

### Raisons des rapports (Raisons disponibles)

#### Raisons Académiques (ACADEMIC)

| Arabe | Français | Anglais |
|-------|----------|---------|
| ضعف في استيعاب المفاهيم الأساسية | Faiblesse dans la compréhension des concepts fondamentaux | Weakness in understanding fundamental concepts |
| تراجع ملحوظ في النتائج | Dégradation notable des résultats | Significant decline in results |
| إهمال الواجبات المنزلية بصفة متكررة | Négligence fréquente des devoirs à la maison | Frequent neglect of homework |
| عدم المشاركة داخل القسم | Absence de participation en classe | Lack of participation in class |
| تفوق ملحوظ ومشاركة فعالة | Excellence remarquable et participation active | Outstanding excellence and active participation |

#### Raisons Comportementales (BEHAVIORAL)

| Arabe | Français | Anglais |
|-------|----------|---------|
| ملاحظة تدني في الانضباط | Observation d'une baisse de discipline | Observation of declining discipline |
| التشويش المستمر داخل القسم | Perturbation continue en classe | Continuous disruption in class |
| عدم إحضار اللوازم المدرسية | Absence de matériel scolaire | Failure to bring school supplies |
| استعمال الهاتف النقال | Utilisation du téléphone portable | Use of mobile phone |
| سلوك عدواني مع الزملاء | Comportement agressif envers les camarades | Aggressive behavior towards classmates |
| مشاركة إيجابية وسلوك مثالي | Participation positive et comportement exemplaire | Positive participation and exemplary behavior |

#### Raisons de Suivi (FOLLOW_UP)

| Arabe | Français | Anglais |
|-------|----------|---------|
| غياب متكرر دون مبرر | Absence répétée sans justification | Repeated absence without justification |
| تأخرات صباحية متكررة | Retards matinaux répétés | Repeated morning lateness |
| استدعاء ولي الأمر للأهمية | Convocation du tuteur pour urgence | Summoning the guardian for urgency |
| متابعة ملف صحي/اجتماعي | Suivi d'un dossier santé/social | Monitoring of a health/social file |

#### Raisons de Violation de l'Intégrité (CHEATING)

| Arabe | Français | Anglais |
|-------|----------|---------|
| محاولة غش في الفرض المحروس | Tentative de tricherie lors d'un contrôle surveillé | Attempted cheating during a supervised test |
| نقل الواجب المنزلي من الزملاء | Copie des devoirs des camarades | Copying homework from classmates |
| ضبط وسيلة غش أثناء الامتحان | Saisie d'un moyen de tricherie pendant l'examen | Caught with a cheating device during the exam |

---

## 4. Templates par défaut des certificats

### Template 1: تقدير تفوق دراسي (Reconnaissance d'excellence académique)

| Champ | Arabe | Français | Anglais |
|-------|-------|----------|---------|
| **Nom** | تقدير تفوق دراسي | Reconnaissance d'excellence académique | Academic Excellence Recognition |
| **Description** | شهادة تبرز التميز الأكاديمي والتفوق في الحصص والمناهج الرقمية. | Certificat mettant en valeur l'excellence académique et la réussite dans les cours et les programmes numériques. | Certificate highlighting academic excellence and achievement in classes and digital curricula. |
| **Texte principal par défaut** | بكل فخر، نمنح هذه الشهادة لـ{{student}} اعترافاً بجهوده المتميزة في مادة المعلوماتية. | Avec grande fierté, nous décernons ce certificat à {{student}} en reconnaissance de ses efforts remarquables en informatique. | With great pride, we award this certificate to {{student}} in recognition of their outstanding efforts in computer science. |
| **Raison par défaut** | للإنجاز المتميز في المسارات الرقمية وبرامج التفكير المنطقي. | Pour l'accomplissement remarquable dans les parcours numériques et les programmes de raisonnement logique. | For outstanding achievement in digital pathways and logical thinking programs. |
| **Libellé de signature** | توقيع الأستاذ | Signature de l'enseignant | Teacher signature |

### Template 2: تقدير حسن سلوك (Reconnaissance de bon comportement)

| Champ | Arabe | Français | Anglais |
|-------|-------|----------|---------|
| **Nom** | تقدير حسن سلوك | Reconnaissance de bon comportement | Good Behavior Recognition |
| **Description** | شهادة للسلوك النموذجي والمساهمة الإيجابية في بيئة الصف. | Certificat pour un comportement exemplaire et une contribution positive à l'environnement de la classe. | Certificate for exemplary behavior and positive contribution to the classroom environment. |
| **Texte principal par défaut** | نمنح هذه الشهادة لـ{{student}} امتناناً لسلوكه الراقي واحترافيته داخل الفصول. | Nous décernons ce certificat à {{student}} en reconnaissance de son comportement distingué et de son professionnalisme en classe. | We award this certificate to {{student}} in recognition of their distinguished behavior and professionalism in class. |
| **Raison par défaut** | للمساهمة الملحوظة في تعزيز القيم والاحترام المتبادل. | Pour la contribution notable à la promotion des valeurs et du respect mutuel. | For the notable contribution to promoting values and mutual respect. |
| **Libellé de signature** | توقيع الأستاذ المشرف | Signature de l'enseignant superviseur | Supervising teacher signature |

### Template 3: تقدير مشاركة فعالة (Reconnaissance de participation active)

| Champ | Arabe | Français | Anglais |
|-------|-------|----------|---------|
| **Nom** | تقدير مشاركة فعالة | Reconnaissance de participation active | Active Participation Recognition |
| **Description** | تسلط الضوء على التفاعل والنجاح في المشاريع الجماعية والتقنيات الحديثة. | Met en lumière l'interaction et le succès dans les projets collectifs et les technologies modernes. | Highlights interaction and success in group projects and modern technologies. |
| **Texte principal par défaut** | نقر بجهود {{student}} البارزة في النقاشات والمشاريع التطبيقية لهذا الفصل. | Nous reconnaissons les efforts remarquables de {{student}} dans les discussions et les projets pratiques de ce semestre. | We acknowledge {{student}}'s outstanding efforts in discussions and practical projects this semester. |
| **Raison par défaut** | للمشاركة البنّاءة والمبادرات الرقمية خلال العام الدراسي. | Pour la participation constructive et les initiatives numériques durant l'année scolaire. | For constructive participation and digital initiatives during the school year. |
| **Libellé de signature** | توقيع المدرب التقني | Signature de l'instructeur technique | Technical instructor signature |

---

## 5. Messages d'erreur et de statut

### Messages généraux

| Arabe | Français | Anglais |
|-------|----------|---------|
| تم إصدار الشهادة بنجاح | Certificat émis avec succès | Certificate issued successfully |
| حدث خطأ أثناء إصدار الشهادة | Une erreur s'est produite lors de l'émission du certificat | An error occurred while issuing the certificate |
| حدث خطأ أثناء التصدير | Une erreur s'est produite lors de l'exportation | An error occurred while exporting |
| تم حفظ التقرير بنجاح | Rapport enregistré avec succès | Report saved successfully |
| حدث خطأ أثناء حفظ التقرير | Une erreur s'est produite lors de l'enregistrement du rapport | An error occurred while saving the report |
| يرجى اختيار التلميذ والقالب | Veuillez sélectionner l'élève et le modèle | Please select student and template |
| مطلوب | Requis | Required |

### Messages du backend

| Arabe | Français | Anglais |
|-------|----------|---------|
| الطالب المحدد غير موجود | L'élève spécifié n'existe pas | The specified student does not exist |
| القالب المحدد غير موجود | Le modèle spécifié n'existe pas | The specified template does not exist |

---

## Notes importantes

1. **Placeholders**: Les placeholders comme `{{student}}` doivent être remplacés dynamiquement par le nom de l'élève.

2. **Formats de date**: 
   - Arabe : Format `ar-EG` (ex: 15/03/2024)
   - Français : Format `fr-FR` (ex: 15/03/2024)
   - Anglais : Format `en-US` (ex: 03/15/2024)

3. **Noms de fichiers PDF**:
   - Arabe : `تقرير_العقوبات_YYYY-MM-DD.pdf`, `تقرير_الشهادات_YYYY-MM-DD.pdf`
   - Français : `rapport_sanctions_YYYY-MM-DD.pdf`, `rapport_certificats_YYYY-MM-DD.pdf`
   - Anglais : `penalties_report_YYYY-MM-DD.pdf`, `certificates_report_YYYY-MM-DD.pdf`

4. **Année académique par défaut**: `2024-2025` (à adapter selon l'année en cours)




