declare module 'jspdf' {
  export interface jsPDFOptions {
    orientation?: 'p' | 'portrait' | 'l' | 'landscape';
    unit?: 'pt' | 'px' | 'in' | 'mm' | 'cm' | 'ex' | 'em' | 'pc';
    format?: string | number[];
    compress?: boolean;
    precision?: number;
    userUnit?: number;
    hotfixes?: string[];
  }

  export interface TextOptions {
    align?: 'left' | 'center' | 'right' | 'justify' | 'start' | 'end';
    angle?: number;
    baseline?: 'top' | 'middle' | 'bottom' | 'alphabetic' | 'hanging' | 'ideographic';
    renderingMode?: 'fill' | 'stroke' | 'fillThenStroke' | 'invisible' | 'fillAndAddForClipping' | 'strokeAndAddForClipping' | 'fillThenStrokeAndAddForClipping' | 'addForClipping';
    maxWidth?: number;
    lineHeightFactor?: number;
  }

  export class jsPDF {
    constructor(options?: jsPDFOptions);
    constructor(orientation?: 'p' | 'portrait' | 'l' | 'landscape', unit?: string, format?: string | number[]);
    
    setFontSize(size: number): jsPDF;
    text(text: string | string[], x: number, y: number, options?: TextOptions): jsPDF;
    addPage(): jsPDF;
    save(filename: string): void;
    setTextColor(r: number, g?: number, b?: number): jsPDF;
    setFillColor(r: number, g?: number, b?: number): jsPDF;
    setDrawColor(r: number, g?: number, b?: number): jsPDF;
    rect(x: number, y: number, w: number, h: number, operation?: 'S' | 'F' | 'FD' | 'DF'): jsPDF;
    line(x1: number, y1: number, x2: number, y2: number): jsPDF;
    splitTextToSize(text: string, maxWidth: number, options?: any): string[];
    getNumberOfPages(): number;
    setPage(pageNumber: number): jsPDF;
    addImage(imgData: string, format: string, x: number, y: number, width: number, height: number, alias?: string, compression?: string, rotation?: number): jsPDF;
    internal: {
      pageSize: {
        getWidth(): number;
        getHeight(): number;
      };
    };
  }

  export default jsPDF;
}

