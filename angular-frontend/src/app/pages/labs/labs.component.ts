import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export interface Lab {
  id: number;
  name: string;
  description?: string;
  location?: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLabDto {
  name: string;
  description?: string;
  location?: string;
  isAvailable?: boolean;
}

export interface LabDeviceLog {
  id: number;
  labId?: number;
  teacherName: string;
  equipmentType: string;
  inventoryNumber: string;
  exitDate: string;
  exitStatus?: string;
  notes?: string;
  teacherSignatureOut?: string;
  returnDate?: string;
  returnStatus?: string;
  teacherSignatureIn?: string;
}

export interface LabEquipmentItem {
  id: number;
  labId?: number;
  itemName: string;
  model?: string;
  totalCount: number;
  workingCount: number;
  notWorkingCount: number;
}

export interface LabSoftwareItem {
  id: number;
  labId?: number;
  programName: string;
  version?: string;
}

export interface LabFurnitureItem {
  id: number;
  labId?: number;
  itemName: string;
  model?: string;
  totalCount: number;
  workingCount: number;
  notWorkingCount: number;
}

export interface LabInventoryItem {
  id: number;
  labId?: number;
  category: string;
  label: string;
  inventoryNumber: string;
}

export interface ComputerChecklistItem {
  id: number;
  labId?: number;
  deviceNumber: number;
  hasSystemUnit: boolean;
  hasMonitor: boolean;
  hasMouse: boolean;
  hasKeyboard: boolean;
  hasCabling: boolean;
  isClean: boolean;
  osInstalled: boolean;
  officeInstalled: boolean;
  netSupportInstalled: boolean;
  desktopCleaned: boolean;
  antivirusInstalled: boolean;
  lastCheckDate?: string;
  notes?: string;
}

export interface LabCleaningEntry {
  id: number;
  labId?: number;
  deviceCleanliness: string;
  desktopCleanliness: string;
  roomCleanliness: string;
  wiringStatus: string;
  checkDate?: string;
  notes?: string;
}

export type CleaningLevel = 'good' | 'bad';
export type WiringStatus = 'complete' | 'incomplete';

@Component({
  selector: 'app-labs',
  templateUrl: './labs.component.html',
  styleUrls: ['./labs.component.css']
})
export class LabsComponent implements OnInit {
  labs: Lab[] = [];
  showModal = false;
  editingLab: Lab | null = null;
  formData: CreateLabDto = {
    name: '',
    description: '',
    location: '',
    isAvailable: true
  };

  // Tabs
  activeTab:
    | 'labs'
    | 'deviceLogs'
    | 'equipment'
    | 'software'
    | 'furniture'
    | 'inventory'
    | 'checklist'
    | 'cleaning' = 'labs';

  // Device logs
  deviceLogs: LabDeviceLog[] = [];
  deviceLogForm: Partial<LabDeviceLog> = {
    exitDate: new Date().toISOString().slice(0, 10),
  };
  deviceLogOperation: 'exit' | 'return' = 'exit';
  deviceStatus: 'ok' | 'bad' = 'ok';

  // Lab equipment
  equipmentItems: LabEquipmentItem[] = [];
  equipmentForm: Partial<LabEquipmentItem> = {
    itemName: '',
    model: '',
    totalCount: 0,
    workingCount: 0,
    notWorkingCount: 0,
  };

  // Lab software
  softwareItems: LabSoftwareItem[] = [];
  softwareForm: Partial<LabSoftwareItem> = {
    programName: '',
    version: '',
  };

  // Lab furniture
  furnitureItems: LabFurnitureItem[] = [];
  furnitureForm: Partial<LabFurnitureItem> = {
    itemName: '',
    model: '',
    totalCount: 0,
    workingCount: 0,
    notWorkingCount: 0,
  };

  // Lab inventory numbers
  inventoryItems: LabInventoryItem[] = [];
  inventoryForm: Partial<LabInventoryItem> = {
    category: '',
    label: '',
    inventoryNumber: '',
  };

  // Hardware / software checklist
  checklistItems: ComputerChecklistItem[] = [];
  checklistForm: Partial<ComputerChecklistItem> = {
    deviceNumber: 1,
    hasSystemUnit: true,
    hasMonitor: true,
    hasMouse: true,
    hasKeyboard: true,
    hasCabling: true,
    isClean: true,
    osInstalled: true,
    officeInstalled: true,
    netSupportInstalled: true,
    desktopCleaned: true,
    antivirusInstalled: true,
    lastCheckDate: new Date().toISOString().slice(0, 10),
    notes: '',
  };

  // Lab cleaning
  cleaningEntries: LabCleaningEntry[] = [];
  cleaningForm: Partial<LabCleaningEntry> = {
    deviceCleanliness: 'good',
    desktopCleanliness: 'good',
    roomCleanliness: 'good',
    wiringStatus: 'complete',
    checkDate: new Date().toISOString().slice(0, 10),
    notes: '',
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadLabs();
    this.loadDeviceLogs();
    this.loadEquipment();
    this.loadSoftware();
    this.loadFurniture();
    this.loadInventory();
    this.loadChecklist();
    this.loadCleaning();
  }

  loadLabs(): void {
    this.apiService.get<Lab[]>('/labs').subscribe({
      next: (data) => {
        this.labs = data;
      },
      error: (error) => {
        console.error('Error loading labs:', error);
      }
    });
  }

  // Device logs
  loadDeviceLogs(): void {
    this.apiService.get<LabDeviceLog[]>('/lab-device-logs').subscribe({
      next: (data) => {
        this.deviceLogs = data;
      },
      error: (error) => {
        console.error('Error loading device logs:', error);
      }
    });
  }

  // Lab equipment
  loadEquipment(): void {
    this.apiService.get<LabEquipmentItem[]>('/lab-equipment').subscribe({
      next: (data) => {
        this.equipmentItems = data;
      },
      error: (error) => {
        console.error('Error loading lab equipment:', error);
      }
    });
  }

  saveEquipment(): void {
    const payload = {
      itemName: this.equipmentForm.itemName || '',
      model: this.equipmentForm.model || undefined,
      totalCount: this.equipmentForm.totalCount || 0,
      workingCount: this.equipmentForm.totalCount && this.equipmentForm.workingCount !== undefined
        ? this.equipmentForm.workingCount
        : 0,
      notWorkingCount: this.equipmentForm.notWorkingCount !== undefined
        ? this.equipmentForm.notWorkingCount
        : Math.max(
            0,
            (this.equipmentForm.totalCount || 0) - (this.equipmentForm.workingCount || 0),
          ),
    };

    this.apiService.post<LabEquipmentItem>('/lab-equipment', payload).subscribe({
      next: () => {
        this.equipmentForm = {
          itemName: '',
          model: '',
          totalCount: 0,
          workingCount: 0,
          notWorkingCount: 0,
        };
        this.loadEquipment();
      },
      error: (error) => {
        console.error('Error saving lab equipment:', error);
        alert('حدث خطأ أثناء حفظ أجهزة المعمل');
      }
    });
  }

  // Lab software
  loadSoftware(): void {
    this.apiService.get<LabSoftwareItem[]>('/lab-software').subscribe({
      next: (data) => {
        this.softwareItems = data;
      },
      error: (error) => {
        console.error('Error loading lab software:', error);
      }
    });
  }

  saveSoftware(): void {
    const payload = {
      programName: this.softwareForm.programName || '',
      version: this.softwareForm.version || undefined,
    };

    this.apiService.post<LabSoftwareItem>('/lab-software', payload).subscribe({
      next: () => {
        this.softwareForm = {
          programName: '',
          version: '',
        };
        this.loadSoftware();
      },
      error: (error) => {
        console.error('Error saving lab software:', error);
        alert('حدث خطأ أثناء حفظ برامج الحواسيب');
      }
    });
  }

  // Lab furniture
  loadFurniture(): void {
    this.apiService.get<LabFurnitureItem[]>('/lab-furniture').subscribe({
      next: (data) => {
        this.furnitureItems = data;
      },
      error: (error) => {
        console.error('Error loading lab furniture:', error);
      }
    });
  }

  saveFurniture(): void {
    const payload = {
      itemName: this.furnitureForm.itemName || '',
      model: this.furnitureForm.model || undefined,
      totalCount: this.furnitureForm.totalCount || 0,
      workingCount: this.furnitureForm.totalCount && this.furnitureForm.workingCount !== undefined
        ? this.furnitureForm.workingCount
        : 0,
      notWorkingCount: this.furnitureForm.notWorkingCount !== undefined
        ? this.furnitureForm.notWorkingCount
        : Math.max(
            0,
            (this.furnitureForm.totalCount || 0) - (this.furnitureForm.workingCount || 0),
          ),
    };

    this.apiService.post<LabFurnitureItem>('/lab-furniture', payload).subscribe({
      next: () => {
        this.furnitureForm = {
          itemName: '',
          model: '',
          totalCount: 0,
          workingCount: 0,
          notWorkingCount: 0,
        };
        this.loadFurniture();
      },
      error: (error) => {
        console.error('Error saving lab furniture:', error);
        alert('حدث خطأ أثناء حفظ أثاث معمل الحاسب');
      }
    });
  }

  async exportFurnitureToPDF(): Promise<void> {
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const container = document.querySelector('#furniture-table') as HTMLElement;
      if (!container) {
        alert('لا يمكن العثور على جدول أثاث المعمل');
        return;
      }

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageHeight = 297;
      const margin = 10;
      const availableHeight = pageHeight - margin * 2;

      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, position, imgWidth - margin * 2, imgHeight);
      heightLeft -= availableHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, position, imgWidth - margin * 2, imgHeight);
        heightLeft -= availableHeight;
      }

      pdf.save('أثاث_معمل_الحاسب.pdf');
    } catch (error) {
      console.error('Error exporting furniture PDF:', error);
      alert('حدث خطأ أثناء تصدير PDF لأثاث المعمل');
    }
  }

  // Lab inventory
  loadInventory(): void {
    this.apiService.get<LabInventoryItem[]>('/lab-inventory').subscribe({
      next: (data) => {
        this.inventoryItems = data;
      },
      error: (error) => {
        console.error('Error loading lab inventory:', error);
      }
    });
  }

  saveInventory(): void {
    const payload = {
      category: this.inventoryForm.category || '',
      label: this.inventoryForm.label || '',
      inventoryNumber: this.inventoryForm.inventoryNumber || '',
    };

    this.apiService.post<LabInventoryItem>('/lab-inventory', payload).subscribe({
      next: () => {
        this.inventoryForm = {
          category: '',
          label: '',
          inventoryNumber: '',
        };
        this.loadInventory();
      },
      error: (error) => {
        console.error('Error saving lab inventory:', error);
        alert('حدث خطأ أثناء حفظ أرقام الجرد');
      }
    });
  }

  async exportInventoryToPDF(): Promise<void> {
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const container = document.querySelector('#inventory-table') as HTMLElement;
      if (!container) {
        alert('لا يمكن العثور على جدول أرقام الجرد');
        return;
      }

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageHeight = 297;
      const margin = 10;
      const availableHeight = pageHeight - margin * 2;

      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, position, imgWidth - margin * 2, imgHeight);
      heightLeft -= availableHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, position, imgWidth - margin * 2, imgHeight);
        heightLeft -= availableHeight;
      }

      pdf.save('أرقام_الجرد_معمل_الحاسب.pdf');
    } catch (error) {
      console.error('Error exporting inventory PDF:', error);
      alert('حدث خطأ أثناء تصدير PDF لأرقام الجرد');
    }
  }

  // Checklist
  loadChecklist(): void {
    this.apiService.get<ComputerChecklistItem[]>('/computer-checklists').subscribe({
      next: (data) => {
        this.checklistItems = data;
      },
      error: (error) => {
        console.error('Error loading computer checklist:', error);
      }
    });
  }

  saveChecklist(): void {
    const payload = {
      deviceNumber: this.checklistForm.deviceNumber || 1,
      hasSystemUnit: !!this.checklistForm.hasSystemUnit,
      hasMonitor: !!this.checklistForm.hasMonitor,
      hasMouse: !!this.checklistForm.hasMouse,
      hasKeyboard: !!this.checklistForm.hasKeyboard,
      hasCabling: !!this.checklistForm.hasCabling,
      isClean: !!this.checklistForm.isClean,
      osInstalled: !!this.checklistForm.osInstalled,
      officeInstalled: !!this.checklistForm.officeInstalled,
      netSupportInstalled: !!this.checklistForm.netSupportInstalled,
      desktopCleaned: !!this.checklistForm.desktopCleaned,
      antivirusInstalled: !!this.checklistForm.antivirusInstalled,
      lastCheckDate:
        this.checklistForm.lastCheckDate || new Date().toISOString().slice(0, 10),
      notes: this.checklistForm.notes || undefined,
    };

    this.apiService
      .post<ComputerChecklistItem>('/computer-checklists', payload)
      .subscribe({
        next: () => {
          this.checklistForm = {
            deviceNumber: 1,
            hasSystemUnit: true,
            hasMonitor: true,
            hasMouse: true,
            hasKeyboard: true,
            hasCabling: true,
            isClean: true,
            osInstalled: true,
            officeInstalled: true,
            netSupportInstalled: true,
            desktopCleaned: true,
            antivirusInstalled: true,
            lastCheckDate: new Date().toISOString().slice(0, 10),
            notes: '',
          };
          this.loadChecklist();
        },
        error: (error) => {
          console.error('Error saving computer checklist:', error);
          alert('حدث خطأ أثناء حفظ فحص المكوّنات');
        }
      });
  }

  async exportChecklistToPDF(): Promise<void> {
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const container = document.querySelector('#checklist-table') as HTMLElement;
      if (!container) {
        alert('لا يمكن العثور على جدول فحص المكوّنات');
        return;
      }

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageHeight = 297;
      const margin = 10;
      const availableHeight = pageHeight - margin * 2;

      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, position, imgWidth - margin * 2, imgHeight);
      heightLeft -= availableHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, position, imgWidth - margin * 2, imgHeight);
        heightLeft -= availableHeight;
      }

      pdf.save('فحص_مكونات_حواسيب_المعمل.pdf');
    } catch (error) {
      console.error('Error exporting checklist PDF:', error);
      alert('حدث خطأ أثناء تصدير PDF لفحص المكوّنات');
    }
  }

  // Lab cleaning
  loadCleaning(): void {
    this.apiService.get<LabCleaningEntry[]>('/lab-cleaning').subscribe({
      next: (data) => {
        this.cleaningEntries = data;
      },
      error: (error) => {
        console.error('Error loading lab cleaning entries:', error);
      }
    });
  }

  saveCleaning(): void {
    const payload = {
      deviceCleanliness: this.cleaningForm.deviceCleanliness || 'good',
      desktopCleanliness: this.cleaningForm.desktopCleanliness || 'good',
      roomCleanliness: this.cleaningForm.roomCleanliness || 'good',
      wiringStatus: this.cleaningForm.wiringStatus || 'complete',
      checkDate:
        this.cleaningForm.checkDate || new Date().toISOString().slice(0, 10),
      notes: this.cleaningForm.notes || undefined,
    };

    this.apiService.post<LabCleaningEntry>('/lab-cleaning', payload).subscribe({
      next: () => {
        this.cleaningForm = {
          deviceCleanliness: 'good',
          desktopCleanliness: 'good',
          roomCleanliness: 'good',
          wiringStatus: 'complete',
          checkDate: new Date().toISOString().slice(0, 10),
          notes: '',
        };
        this.loadCleaning();
      },
      error: (error) => {
        console.error('Error saving lab cleaning entry:', error);
        alert('حدث خطأ أثناء حفظ نظافة المعمل');
      }
    });
  }

  async exportCleaningToPDF(): Promise<void> {
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const container = document.querySelector('#cleaning-table') as HTMLElement;
      if (!container) {
        alert('لا يمكن العثور على جدول نظافة المعمل');
        return;
      }

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageHeight = 297;
      const margin = 10;
      const availableHeight = pageHeight - margin * 2;

      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, position, imgWidth - margin * 2, imgHeight);
      heightLeft -= availableHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, position, imgWidth - margin * 2, imgHeight);
        heightLeft -= availableHeight;
      }

      pdf.save('نظافة_معمل_الحاسب.pdf');
    } catch (error) {
      console.error('Error exporting cleaning PDF:', error);
      alert('حدث خطأ أثناء تصدير PDF لنظافة المعمل');
    }
  }

  async exportSoftwareToPDF(): Promise<void> {
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const container = document.querySelector('#software-table') as HTMLElement;
      if (!container) {
        alert('لا يمكن العثور على جدول برامج الحواسيب');
        return;
      }

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageHeight = 297;
      const margin = 10;
      const availableHeight = pageHeight - margin * 2;

      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, position, imgWidth - margin * 2, imgHeight);
      heightLeft -= availableHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, position, imgWidth - margin * 2, imgHeight);
        heightLeft -= availableHeight;
      }

      pdf.save('برامج_حواسيب_المعمل.pdf');
    } catch (error) {
      console.error('Error exporting software PDF:', error);
      alert('حدث خطأ أثناء تصدير PDF لبرامج الحواسيب');
    }
  }

  saveDeviceLog(): void {
    const isExit = this.deviceLogOperation === 'exit';
    const today = new Date().toISOString().slice(0, 10);

    const movementDate = this.deviceLogForm.exitDate || today;

    const payload: Partial<LabDeviceLog> = {
      teacherName: this.deviceLogForm.teacherName || '',
      equipmentType: this.deviceLogForm.equipmentType || '',
      inventoryNumber: this.deviceLogForm.inventoryNumber || '',
      // نخزّن دائمًا تاريخ الحركة في exitDate حتى يمرّ التحقق في الـ backend
      exitDate: movementDate,
      exitStatus: isExit ? this.deviceStatus : undefined,
      returnDate: !isExit ? movementDate : undefined,
      returnStatus: !isExit ? this.deviceStatus : undefined,
      notes: this.deviceLogForm.notes || undefined,
      teacherSignatureOut: this.deviceLogForm.teacherSignatureOut || undefined,
      teacherSignatureIn: this.deviceLogForm.teacherSignatureIn || undefined,
    };

    this.apiService.post<LabDeviceLog>('/lab-device-logs', payload).subscribe({
      next: () => {
        this.deviceLogForm = {
          exitDate: new Date().toISOString().slice(0, 10),
        };
        this.deviceLogOperation = 'exit';
        this.deviceStatus = 'ok';
        this.loadDeviceLogs();
      },
      error: (error) => {
        console.error('Error saving device log:', error);
        alert('حدث خطأ أثناء حفظ سجل الجهاز');
      }
    });
  }

  getStatusIcon(status?: string | null): string {
    if (!status) {
      return '-';
    }
    return status === 'ok' ? '✓' : '✗';
  }

  async exportEquipmentToPDF(): Promise<void> {
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const container = document.querySelector('#equipment-table') as HTMLElement;
      if (!container) {
        alert('لا يمكن العثور على جدول أجهزة المعمل');
        return;
      }

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageHeight = 297;
      const margin = 10;
      const availableHeight = pageHeight - margin * 2;

      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, position, imgWidth - margin * 2, imgHeight);
      heightLeft -= availableHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, position, imgWidth - margin * 2, imgHeight);
        heightLeft -= availableHeight;
      }

      pdf.save('أجهزة_معمل_الحاسب.pdf');
    } catch (error) {
      console.error('Error exporting equipment PDF:', error);
      alert('حدث خطأ أثناء تصدير PDF لأجهزة المعمل');
    }
  }

  async exportDeviceLogsToPDF(): Promise<void> {
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const container = document.querySelector('#device-logs-table') as HTMLElement;
      if (!container) {
        alert('لا يمكن العثور على جدول السجل');
        return;
      }

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageHeight = 297;
      const margin = 10;
      const availableHeight = pageHeight - margin * 2;

      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, position, imgWidth - margin * 2, imgHeight);
      heightLeft -= availableHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, position, imgWidth - margin * 2, imgHeight);
        heightLeft -= availableHeight;
      }

      pdf.save('سجل_أجهزة_المخبر.pdf');
    } catch (error) {
      console.error('Error exporting device logs PDF:', error);
      alert('حدث خطأ أثناء تصدير PDF');
    }
  }

  openAddModal(): void {
    this.editingLab = null;
    this.formData = {
      name: '',
      description: '',
      location: '',
      isAvailable: true
    };
    this.showModal = true;
  }

  openEditModal(labItem: Lab): void {
    this.editingLab = labItem;
    this.formData = {
      name: labItem.name,
      description: labItem.description || '',
      location: labItem.location || '',
      isAvailable: labItem.isAvailable
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingLab = null;
  }

  saveLab(): void {
    const submitData: CreateLabDto = {
      name: this.formData.name,
      description: this.formData.description || undefined,
      location: this.formData.location || undefined,
      isAvailable: this.formData.isAvailable !== undefined ? this.formData.isAvailable : true
    };

    if (this.editingLab) {
      // Update existing lab
      this.apiService.patch<Lab>(`/labs/${this.editingLab.id}`, submitData).subscribe({
        next: () => {
          this.loadLabs();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error updating lab:', error);
          const errorMessage = error?.error?.message || error?.message || 'حدث خطأ أثناء تحديث المخبر';
          alert(errorMessage);
        }
      });
    } else {
      // Create new lab
      this.apiService.post<Lab>('/labs', submitData).subscribe({
        next: () => {
          this.loadLabs();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error creating lab:', error);
          const errorMessage = error?.error?.message || 
                             (error?.error?.error && Array.isArray(error.error.error) 
                               ? error.error.error.join(', ') 
                               : error.error?.error) ||
                             error?.message || 
                             'حدث خطأ أثناء إضافة المخبر';
          alert(errorMessage);
        }
      });
    }
  }

  deleteLab(id: number): void {
    if (confirm('هل أنت متأكد من حذف هذا المخبر؟')) {
      this.apiService.delete(`/labs/${id}`).subscribe({
        next: () => {
          this.loadLabs();
        },
        error: (error) => {
          console.error('Error deleting lab:', error);
          alert('حدث خطأ أثناء حذف المخبر');
        }
      });
    }
  }
}


