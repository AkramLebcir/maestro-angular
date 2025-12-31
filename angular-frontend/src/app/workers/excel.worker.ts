/// <reference lib="webworker" />

import * as ExcelJS from 'exceljs';

// تعريف أنواع الرسائل
interface ExcelWorkerMessage {
  type: 'process';
  fileData: ArrayBuffer;
  fileName: string;
}

interface ExcelWorkerResponse {
  type: 'success' | 'error' | 'progress';
  data?: any;
  error?: string;
  progress?: number;
}

// معالجة الرسائل الواردة
self.addEventListener('message', async (event: MessageEvent<ExcelWorkerMessage>) => {
  const { type, fileData, fileName } = event.data;

  if (type === 'process') {
    try {
      // إرسال تقدم المعالجة
      self.postMessage({
        type: 'progress',
        progress: 10
      } as ExcelWorkerResponse);

      // قراءة ملف Excel
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(fileData);

      self.postMessage({
        type: 'progress',
        progress: 30
      } as ExcelWorkerResponse);

      // الحصول على أول ورقة
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new Error('لا توجد أوراق عمل في ملف Excel');
      }

      self.postMessage({
        type: 'progress',
        progress: 50
      } as ExcelWorkerResponse);

      // تحويل البيانات إلى JSON
      const data: any[] = [];
      const headers: string[] = [];
      
      // Get headers from first row
      worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
        headers[colNumber - 1] = cell.value ? String(cell.value).trim() : '';
      });
      
      // Convert rows to objects
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row
        
        const rowData: any = {};
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const header = headers[colNumber - 1];
          if (header) {
            let value = cell.value;
            // Handle different cell value types
            if (value === null || value === undefined) {
              rowData[header] = null;
            } else if (typeof value === 'object' && 'text' in value) {
              // Rich text
              rowData[header] = value.text;
            } else if (value instanceof Date) {
              // Date value - format as YYYY-MM-DD
              rowData[header] = value.toISOString().split('T')[0];
            } else {
              // Regular value
              rowData[header] = value;
            }
          }
        });
        
        // Only add row if it has at least one non-empty value
        if (Object.keys(rowData).length > 0 && Object.values(rowData).some(v => v !== null && v !== undefined && v !== '')) {
          data.push(rowData);
        }
      });

      self.postMessage({
        type: 'progress',
        progress: 80
      } as ExcelWorkerResponse);

      // التحقق من صحة البيانات
      if (!data || data.length === 0) {
        throw new Error('لا توجد بيانات في ملف Excel');
      }

      // إعداد البيانات للتحقق
      const validationResult = {
        rowCount: data.length,
        columns: data.length > 0 ? Object.keys(data[0] as Record<string, any>) : [],
        firstRowSample: data.length > 0 ? data[0] : null,
        isValid: true
      };

      self.postMessage({
        type: 'progress',
        progress: 100
      } as ExcelWorkerResponse);

      // إرسال النتيجة الناجحة
      self.postMessage({
        type: 'success',
        data: {
          validation: validationResult,
          fileName: fileName,
          rowCount: data.length
        }
      } as ExcelWorkerResponse);

    } catch (error: any) {
      // إرسال خطأ
      self.postMessage({
        type: 'error',
        error: error.message || 'حدث خطأ أثناء معالجة ملف Excel'
      } as ExcelWorkerResponse);
    }
  }
});

