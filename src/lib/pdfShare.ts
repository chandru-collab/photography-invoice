'use client';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

/**
 * Generates a high-resolution, print-accurate PDF File from any DOM element (e.g. #classic-document-a4).
 */
export async function generateElementPdfFile(
  elementId: string,
  filename: string
): Promise<File | null> {
  if (typeof window === 'undefined') return null;

  const element = window.document.getElementById(elementId);
  if (!element) {
    console.warn(`Element #${elementId} not found for PDF generation.`);
    return null;
  }

  const canvas = await html2canvas(element, {
    scale: 2, // 2x for sharp 300dpi printing typography
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    onclone: (clonedDoc) => {
      if (clonedDoc.documentElement) {
        clonedDoc.documentElement.style.backgroundColor = '#ffffff';
      }
      if (clonedDoc.body) {
        clonedDoc.body.style.backgroundColor = '#ffffff';
      }
      const clonedElement = clonedDoc.getElementById(elementId);
      if (clonedElement) {
        clonedElement.style.width = '800px';
        clonedElement.style.maxWidth = '800px';
        clonedElement.style.padding = '36px 42px';
      }
    },
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
  pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  const blob = pdf.output('blob');

  return new File([blob], cleanFilename, { type: 'application/pdf' });
}

export interface ShareResult {
  success: boolean;
  method: 'native' | 'download_and_web' | 'cancelled';
  message?: string;
}

/**
 * Shares a PDF file directly to WhatsApp:
 * 1. On mobile / supported devices (Web Share API): attaches the PDF directly to WhatsApp!
 * 2. On desktop browsers: automatically downloads the PDF and opens WhatsApp Web with the client's chat and pre-filled message, prompting drag-and-drop.
 */
export async function sharePdfToWhatsApp({
  file,
  phone,
  title,
  text,
}: {
  file: File;
  phone: string;
  title: string;
  text: string;
}): Promise<ShareResult> {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;

  // 1. Check if Web Share API with files is supported (Android Chrome, iOS Safari, macOS Safari, etc.)
  const canShareFiles =
    typeof navigator !== 'undefined' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] });

  if (canShareFiles) {
    try {
      await navigator.share({
        files: [file],
        title: title,
        text: text,
      });
      return {
        success: true,
        method: 'native',
        message: 'Shared successfully via WhatsApp!',
      };
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return { success: false, method: 'cancelled' };
      }
      console.warn('Native Web Share failed, falling back to download + WhatsApp Web:', err);
    }
  }

  // 2. Desktop Fallback:
  // Trigger immediate PDF file download
  if (typeof window !== 'undefined') {
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1500);

    // Open WhatsApp Web with the chat and formatted proposal/invoice text
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  }

  return {
    success: true,
    method: 'download_and_web',
    message: `📥 "${file.name}" has been downloaded. WhatsApp Web is open—simply drag & drop the PDF into the chat to send!`,
  };
}
