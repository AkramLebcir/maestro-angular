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
    text(text: string, x: number, y: number, options?: TextOptions): jsPDF;
    addPage(): jsPDF;
    save(filename: string): void;
  }

  export default jsPDF;
}

