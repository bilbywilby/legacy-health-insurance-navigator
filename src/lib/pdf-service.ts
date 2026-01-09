import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
export interface PDFMetadata {
  title: string;
  subject: string;
  author: string;
  disputeToken: string;
}
class PDFService {
  async generateAppealPDF(elementId: string, metadata: PDFMetadata): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) throw new Error(`Element with id ${elementId} not found`);
    try {
      // Capture the element using html2canvas with high scale for medical-grade resolution
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById(elementId);
          if (clonedElement) {
            clonedElement.style.padding = '40px';
          }
        }
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
      const finalWidth = imgWidth * ratio;
      const finalHeight = imgHeight * ratio;
      const x = (pageWidth - finalWidth) / 2;
      const y = 20; // Margin top
      // Metadata injection
      pdf.setProperties({
        title: metadata.title,
        subject: metadata.subject,
        author: metadata.author,
        creator: 'Legacy Navigator Forensic Engine V2.2',
        keywords: `forensic, medical, audit, ${metadata.disputeToken}`
      });
      // Header watermark logic
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text('STRATEGIC DISPUTE - NAV-V2.2 - AUTHENTICATED AUDIT REPORT', 20, 15);
      // Main image content
      pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
      // Forensic Watermark Overlay
      pdf.setGState(new (pdf as any).GState({ opacity: 0.05 }));
      pdf.setFontSize(60);
      pdf.setTextColor(0, 50, 200);
      pdf.text(metadata.disputeToken, pageWidth / 2, pageHeight / 2, {
        align: 'center',
        angle: 45
      });
      pdf.setGState(new (pdf as any).GState({ opacity: 1 }));
      // Footer - PII-Scrub Verified
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`PII-SCRUB V2.2 VERIFIED | TOKEN: ${metadata.disputeToken} | GENERATED: ${new Date().toLocaleString()}`, 20, pageHeight - 15);
      pdf.text('CONFIDENTIAL FORENSIC DOCUMENT', pageWidth - 140, pageHeight - 15);
      pdf.save(`${metadata.disputeToken}_Appeal_Report.pdf`);
    } catch (error) {
      console.error('PDF Generation Error:', error);
      throw error;
    }
  }
}
export const pdfService = new PDFService();