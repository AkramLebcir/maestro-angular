import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { LanguageService } from '../../services/language.service';

export interface TopicElement {
  id: number;
  content: string;
  order: number;
  topicId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Topic {
  id: number;
  title: string;
  subtitle?: string;
  description?: string;
  elements: TopicElement[];
  createdAt: Date;
  updatedAt: Date;
  level?: string;
  track?: string;
}

export interface CreateTopicDto {
  title: string;
  subtitle?: string;
  description?: string;
  level?: string;
  track?: string;
}

export interface CreateTopicElementDto {
  content: string;
  topicId: number;
  order?: number;
}

@Component({
  standalone: false,
  selector: 'app-topics',
  templateUrl: './topics.component.html',
  styleUrls: ['./topics.component.css']
})
export class TopicsComponent implements OnInit {
  topics: Topic[] = [];
  filteredTopics: Topic[] = [];
  showModal = false;
  showTopicElementModal = false;
  editingTopic: Topic | null = null;
  currentTopicForElement: Topic | null = null;
  editingTopicElement: TopicElement | null = null;
  
  // Search
  searchTerm: string = '';
  selectedLevelFilter: string = '';
  selectedTrackFilter: string = '';
  
  // Form data
  topicFormData: CreateTopicDto = {
    title: '',
    subtitle: '',
    description: '',
    level: '',
    track: ''
  };

  levels: string[] = [
    'السنة أولى متوسط',
    'السنة ثانية متوسط',
    'السنة ثالثة متوسط',
    'السنة رابعة متوسط',
    'السنة أولى ثانوي',
    'السنة ثانية ثانوي',
    'السنة ثالثة ثانوي',
  ];

  tracks: string[] = [
    'جذع مشترك علوم وتكنولوجيا',
    'جذع مشترك آداب',
    'متوسط',
  ];

  // Topic element form data
  topicElementFormData: CreateTopicElementDto = {
    content: '',
    topicId: 0
  };

  constructor(
    private apiService: ApiService,
    private languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.loadTopics();
  }

  translate(key: string, params?: { [key: string]: string }): string {
    return this.languageService.translate(key, params);
  }

  loadTopics(): void {
    this.apiService.get<Topic[]>('/topics').subscribe({
      next: (data) => {
        // Load elements for each topic
        this.topics = data.map(topic => ({
          ...topic,
          elements: topic.elements || []
        }));
        this.topics.forEach(topic => {
          this.loadTopicElements(topic.id);
        });
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error loading topics:', error);
        this.topics = [];
        this.filteredTopics = [];
      }
    });
  }

  loadTopicElements(topicId: number): void {
    this.apiService.get<TopicElement[]>(`/topics/${topicId}/elements`).subscribe({
      next: (data) => {
        const topic = this.topics.find(t => t.id === topicId);
        if (topic) {
          topic.elements = data.sort((a, b) => (a.order || 0) - (b.order || 0));
        }
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error loading topic elements:', error);
        const topic = this.topics.find(t => t.id === topicId);
        if (topic) {
          topic.elements = [];
        }
      }
    });
  }

  openAddModal(): void {
    this.editingTopic = null;
    this.topicFormData = {
      title: '',
      subtitle: '',
      description: '',
      level: '',
      track: ''
    };
    this.showModal = true;
  }

  openEditModal(topic: Topic): void {
    this.editingTopic = {
      ...topic,
      elements: topic.elements || []
    };
    this.topicFormData = {
      title: topic.title,
      subtitle: topic.subtitle || '',
      description: topic.description || '',
      level: topic.level || '',
      track: topic.track || ''
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingTopic = null;
  }

  saveTopic(): void {
    if (!this.topicFormData.title) {
      alert(this.translate('topics.enterTitleError'));
      return;
    }

    const submitData: any = {
      title: this.topicFormData.title,
      subtitle: this.topicFormData.subtitle || undefined,
      description: this.topicFormData.description || undefined,
      level: this.topicFormData.level || undefined,
      track: this.topicFormData.track || undefined
    };

    if (this.editingTopic) {
      this.apiService.patch<Topic>(`/topics/${this.editingTopic.id}`, submitData).subscribe({
        next: () => {
          this.loadTopics();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error updating topic:', error);
          const errorMessage = error?.error?.message || 
                             (error?.error?.error && Array.isArray(error.error.error) 
                               ? error.error.error.join(', ') 
                               : error.error?.error) ||
                             error?.message || 
                             this.translate('topics.updateError');
          alert(errorMessage);
        }
      });
    } else {
      this.apiService.post<Topic>('/topics', submitData).subscribe({
        next: () => {
          this.loadTopics();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error creating topic:', error);
          const errorMessage = error?.error?.message || 
                             (error?.error?.error && Array.isArray(error.error.error) 
                               ? error.error.error.join(', ') 
                               : error.error?.error) ||
                             error?.message || 
                             this.translate('topics.createError');
          alert(errorMessage);
        }
      });
    }
  }

  deleteTopic(id: number): void {
    if (confirm(this.translate('topics.deleteConfirm'))) {
      this.apiService.delete(`/topics/${id}`).subscribe({
        next: () => {
          this.loadTopics();
        },
        error: (error) => {
          console.error('Error deleting topic:', error);
          alert(this.translate('topics.deleteError'));
        }
      });
    }
  }

  // Topic Element Management
  openAddTopicElementModal(topic: Topic): void {
    this.currentTopicForElement = topic;
    this.editingTopicElement = null;
    this.topicElementFormData = {
      content: '',
      topicId: topic.id
    };
    this.showTopicElementModal = true;
  }

  openEditTopicElementModal(element: TopicElement, topic: Topic): void {
    this.currentTopicForElement = topic;
    this.editingTopicElement = element;
    this.topicElementFormData = {
      content: element.content,
      topicId: topic.id
    };
    this.showTopicElementModal = true;
  }

  closeTopicElementModal(): void {
    this.showTopicElementModal = false;
    this.editingTopicElement = null;
    this.currentTopicForElement = null;
  }

  saveTopicElement(): void {
    if (!this.topicElementFormData.content) {
      alert(this.translate('topics.enterElementContentError'));
      return;
    }

    const submitData: any = {
      content: this.topicElementFormData.content,
      topicId: this.topicElementFormData.topicId
    };

    if (this.editingTopicElement) {
      this.apiService.patch<TopicElement>(`/topics/${this.topicElementFormData.topicId}/elements/${this.editingTopicElement.id}`, submitData).subscribe({
        next: () => {
          this.loadTopicElements(this.topicElementFormData.topicId);
          this.closeTopicElementModal();
        },
        error: (error) => {
          console.error('Error updating topic element:', error);
          alert(this.translate('topics.updateElementError'));
        }
      });
    } else {
      this.apiService.post<TopicElement>(`/topics/${this.topicElementFormData.topicId}/elements`, submitData).subscribe({
        next: () => {
          this.loadTopicElements(this.topicElementFormData.topicId);
          this.closeTopicElementModal();
        },
        error: (error) => {
          console.error('Error creating topic element:', error);
          alert(this.translate('topics.createElementError'));
        }
      });
    }
  }

  deleteTopicElement(topicId: number, elementId: number): void {
    if (confirm(this.translate('topics.deleteElementConfirm'))) {
      this.apiService.delete(`/topics/${topicId}/elements/${elementId}`).subscribe({
        next: () => {
          this.loadTopicElements(topicId);
        },
        error: (error) => {
          console.error('Error deleting topic element:', error);
          alert(this.translate('topics.deleteElementError'));
        }
      });
    }
  }

  // Search and Filter
  applyFilters(): void {
    let filtered = [...this.topics];

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(topic => 
        topic.title?.toLowerCase().includes(term) ||
        topic.subtitle?.toLowerCase().includes(term) ||
        topic.description?.toLowerCase().includes(term)
      );
    }

    // Level filter
    if (this.selectedLevelFilter) {
      filtered = filtered.filter(topic => topic.level === this.selectedLevelFilter);
    }

    // Track filter
    if (this.selectedTrackFilter) {
      filtered = filtered.filter(topic => topic.track === this.selectedTrackFilter);
    }

    this.filteredTopics = filtered;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

   onLevelFilterChange(): void {
    this.applyFilters();
  }

  onTrackFilterChange(): void {
    this.applyFilters();
  }

  formatDate(date: Date | string): string {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    const lang = this.languageService.getCurrentLanguage();
    const locale = lang === 'AR' ? 'ar-EG' : (lang === 'FR' ? 'fr-FR' : 'en-US');
    return d.toLocaleDateString(locale);
  }
}

