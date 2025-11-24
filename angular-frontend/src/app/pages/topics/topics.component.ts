import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';

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
}

export interface CreateTopicDto {
  title: string;
  subtitle?: string;
  description?: string;
}

export interface CreateTopicElementDto {
  content: string;
  topicId: number;
  order?: number;
}

@Component({
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
  
  // Form data
  topicFormData: CreateTopicDto = {
    title: '',
    subtitle: '',
    description: ''
  };

  // Topic element form data
  topicElementFormData: CreateTopicElementDto = {
    content: '',
    topicId: 0
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadTopics();
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
      description: ''
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
      description: topic.description || ''
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingTopic = null;
  }

  saveTopic(): void {
    if (!this.topicFormData.title) {
      alert('يرجى إدخال عنوان الموضوع');
      return;
    }

    const submitData: any = {
      title: this.topicFormData.title,
      subtitle: this.topicFormData.subtitle || undefined,
      description: this.topicFormData.description || undefined
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
                             'حدث خطأ أثناء تحديث الموضوع';
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
                             'حدث خطأ أثناء إضافة الموضوع';
          alert(errorMessage);
        }
      });
    }
  }

  deleteTopic(id: number): void {
    if (confirm('هل أنت متأكد من حذف هذا الموضوع؟ سيتم حذف جميع العناصر المرتبطة به.')) {
      this.apiService.delete(`/topics/${id}`).subscribe({
        next: () => {
          this.loadTopics();
        },
        error: (error) => {
          console.error('Error deleting topic:', error);
          alert('حدث خطأ أثناء حذف الموضوع');
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
      alert('يرجى إدخال محتوى العنصر');
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
          alert('حدث خطأ أثناء تحديث العنصر');
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
          alert('حدث خطأ أثناء إضافة العنصر');
        }
      });
    }
  }

  deleteTopicElement(topicId: number, elementId: number): void {
    if (confirm('هل أنت متأكد من حذف هذا العنصر؟')) {
      this.apiService.delete(`/topics/${topicId}/elements/${elementId}`).subscribe({
        next: () => {
          this.loadTopicElements(topicId);
        },
        error: (error) => {
          console.error('Error deleting topic element:', error);
          alert('حدث خطأ أثناء حذف العنصر');
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

    this.filteredTopics = filtered;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  formatDate(date: Date | string): string {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('ar-EG');
  }
}

