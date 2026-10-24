'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Invoice, InvoiceStatus, Quotation, QuotationStatus, ShopProfile } from '@/types';
import {
  generateInvoiceWhatsAppText,
  generateInvoiceWhatsAppUrl,
  generateQuotationWhatsAppText,
  generateQuotationWhatsAppUrl,
} from '@/lib/whatsapp';
import { generateElementPdfFile, sharePdfToWhatsApp } from '@/lib/pdfShare';
import {
  convertQuotationToInvoice,
  deleteInvoice,
  deleteQuotation,
  updateInvoiceStatus,
  updateQuotationStatus,
} from '@/lib/storage';
import { DeleteConfirmationModal } from '@/components/DeleteConfirmationModal';
import { formatINR } from '@/lib/numberToWords';
import {
  Printer,
  Download,
  Share2,
  Edit,
  ArrowRight,
  CreditCard,
  Check,
  ChevronDown,
  Loader2,
  Trash2,
  MessageCircle,
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

interface DocumentActionsProps {
  document: Quotation | Invoice;
  shop: ShopProfile;
  type: 'quotation' | 'invoice';
  onRecordPaymentClick?: () => void;
  onStatusChange?: (newStatus: string) => void;
}

export const DocumentActions: React.FC<DocumentActionsProps> = ({
  document,
  shop,
  type,
  onRecordPaymentClick,
  onStatusChange,
}) => {
  const router = useRouter();
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>(
    type === 'quotation'
      ? (document as Quotation).status
      : (document as Invoice).payment_status
  );

  React.useEffect(() => {
    const status =
      type === 'quotation'
        ? (document as Quotation).status
        : (document as Invoice).payment_status;
    if (status) {
      setCurrentStatus(status);
    }
  }, [document, type]);

  const isQuotation = type === 'quotation';
  const quotation = isQuotation ? (document as Quotation) : null;
  const invoice = !isQuotation ? (document as Invoice) : null;

  const [isSharingPdf, setIsSharingPdf] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  // 1. Direct Native Print
  const handlePrint = () => {
    window.print();
  };

  // 2. High Quality PDF Generation via html2canvas & jsPDF
  const handleDownloadPdf = async () => {
    const element = typeof window !== 'undefined'
      ? (window.document.getElementById('classic-document-a4') as HTMLElement)
      : null;

    if (!element) {
      window.print();
      return;
    }

    try {
      setIsExportingPdf(true);

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
          const clonedElement = clonedDoc.getElementById('classic-document-a4');
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

      const filename = isQuotation
        ? `${quotation?.quotation_number || 'Quotation'}_${document.customer_name.replace(/\s+/g, '_')}.pdf`
        : `${invoice?.invoice_number || 'Invoice'}_${document.customer_name.replace(/\s+/g, '_')}.pdf`;

      pdf.save(filename);
    } catch (err) {
      console.error('Failed to generate PDF, falling back to print dialog:', err);
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  // 3. WhatsApp Direct PDF Share
  const handleWhatsAppPdfShare = async () => {
    try {
      setIsSharingPdf(true);
      setShareFeedback(null);

      const filename = isQuotation
        ? `${quotation?.quotation_number || 'Quotation'}_${document.customer_name.replace(/\s+/g, '_')}.pdf`
        : `${invoice?.invoice_number || 'Invoice'}_${document.customer_name.replace(/\s+/g, '_')}.pdf`;

      const pdfFile = await generateElementPdfFile('classic-document-a4', filename);

      const text = isQuotation
        ? generateQuotationWhatsAppText(quotation!, shop)
        : generateInvoiceWhatsAppText(invoice!, shop);

      const phone = document.customer_phone;
      const title = `${isQuotation ? 'Quotation' : 'Tax Invoice'} ${docNumber} - ${shop.shop_name}`;

      if (!pdfFile) {
        // Fallback to text url if element cannot be captured
        const url = isQuotation
          ? generateQuotationWhatsAppUrl(quotation!, shop)
          : generateInvoiceWhatsAppUrl(invoice!, shop);
        window.open(url, '_blank');
        return;
      }

      const result = await sharePdfToWhatsApp({
        file: pdfFile,
        phone,
        title,
        text,
      });

      if (result.method === 'download_and_web' && result.message) {
        setShareFeedback(result.message);
        setTimeout(() => setShareFeedback(null), 8000);
      }
    } catch (err) {
      console.error('Failed to share PDF to WhatsApp:', err);
      const url = isQuotation
        ? generateQuotationWhatsAppUrl(quotation!, shop)
        : generateInvoiceWhatsAppUrl(invoice!, shop);
      window.open(url, '_blank');
    } finally {
      setIsSharingPdf(false);
    }
  };

  // 4. Convert Quotation to Invoice (1-Click)
  const handleConvertToInvoice = async () => {
    if (!quotation) return;
    try {
      setIsConverting(true);
      const newInvoice = await convertQuotationToInvoice(quotation.id);
      router.push(`/invoices/${newInvoice.id}`);
    } catch (err) {
      console.error('Failed to convert quotation:', err);
      alert('Failed to convert quotation to invoice. Please try again.');
    } finally {
      setIsConverting(false);
    }
  };

  // 5. Change Document Status
  const handleStatusChangeInternal = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value;
    setCurrentStatus(next);
    if (isQuotation) {
      await updateQuotationStatus(document.id, next as QuotationStatus);
    } else {
      await updateInvoiceStatus(document.id, next as InvoiceStatus);
    }
    if (onStatusChange) onStatusChange(next);
  };

  // 6. Delete Document
  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      if (isQuotation) {
        await deleteQuotation(document.id);
        router.push('/quotations');
      } else {
        await deleteInvoice(document.id);
        router.push('/invoices');
      }
    } catch (err) {
      console.error('Failed to delete document:', err);
      alert('Failed to delete document. Please try again.');
      setIsDeleting(false);
    }
  };

  const docNumber = isQuotation
    ? quotation?.quotation_number
    : invoice?.invoice_number;

  return (
    <div className="no-print bg-white border border-zinc-200 rounded-xl p-3 sm:p-4 shadow-xs mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
      {/* Top / Left side: Back & Status Selector */}
      <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3 w-full md:w-auto">
        <button
          onClick={() => router.push(isQuotation ? '/quotations' : '/invoices')}
          className="flex-1 sm:flex-initial text-center justify-center inline-flex items-center text-xs font-semibold text-zinc-700 hover:text-zinc-950 px-3 py-2 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition min-h-[38px] cursor-pointer"
        >
          ← {isQuotation ? 'Quotes' : 'Invoices'}
        </button>

        <div className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs min-h-[38px]">
          <span className="text-zinc-500 font-medium shrink-0">Status:</span>
          <select
            value={currentStatus}
            onChange={handleStatusChangeInternal}
            className="bg-transparent font-semibold text-zinc-900 border-none outline-none cursor-pointer focus:ring-0 text-xs"
          >
            {isQuotation ? (
              <>
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Accepted">Accepted</option>
                <option value="Rejected">Rejected</option>
                <option value="Expired">Expired</option>
              </>
            ) : (
              <>
                <option value="Unpaid">Unpaid</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* Action Buttons: Responsive Grid on Mobile, Flex on Tablet/Desktop */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full md:w-auto">
        {/* WhatsApp Share Button */}
        <button
          type="button"
          onClick={handleWhatsAppPdfShare}
          disabled={isSharingPdf}
          title={`Share official ${isQuotation ? 'Quotation' : 'Invoice'} PDF directly to WhatsApp`}
          className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 border border-emerald-700 rounded-lg hover:bg-emerald-700 disabled:opacity-60 transition shadow-xs cursor-pointer min-h-[38px]"
        >
          {isSharingPdf ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <MessageCircle className="w-3.5 h-3.5" />
          )}
          {isSharingPdf ? 'Generating PDF...' : 'WhatsApp PDF'}
        </button>

        {/* Record Payment / Pay Remaining Bill (For Invoices) */}
        {!isQuotation && onRecordPaymentClick && (
          <button
            onClick={onRecordPaymentClick}
            className={`col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white rounded-lg transition shadow-xs cursor-pointer min-h-[38px] ${
              invoice?.balance_amount === 0
                ? 'bg-emerald-800 hover:bg-emerald-900 border border-emerald-900'
                : invoice?.paid_amount && invoice.paid_amount > 0
                ? 'bg-indigo-600 hover:bg-indigo-700 border border-indigo-700'
                : 'bg-emerald-700 hover:bg-emerald-800 border border-emerald-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            {invoice?.balance_amount === 0
              ? '✓ Fully Paid (Receipt)'
              : invoice?.paid_amount && invoice.paid_amount > 0
              ? `Pay 2nd (${formatINR(invoice.balance_amount)})`
              : 'Record Payment'}
          </button>
        )}

        {/* Convert to Invoice (For Quotations) */}
        {isQuotation && (
          <button
            onClick={handleConvertToInvoice}
            disabled={isConverting}
            className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 border border-indigo-700 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition shadow-xs min-h-[38px] cursor-pointer"
          >
            {isConverting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ArrowRight className="w-3.5 h-3.5" />
            )}
            Convert to Invoice
          </button>
        )}

        {/* Edit Button */}
        <button
          onClick={() =>
            router.push(isQuotation ? `/quotations/${document.id}/edit` : `/invoices/${document.id}/edit`)
          }
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition min-h-[38px] cursor-pointer"
        >
          <Edit className="w-3.5 h-3.5" />
          Edit
        </button>

        {/* Download PDF Button */}
        <button
          onClick={handleDownloadPdf}
          disabled={isExportingPdf}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-zinc-900 border border-zinc-900 rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition shadow-xs min-h-[38px] cursor-pointer"
        >
          {isExportingPdf ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          Download PDF
        </button>

        {/* Print Button */}
        <button
          onClick={handlePrint}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-800 bg-zinc-100 border border-zinc-300 rounded-lg hover:bg-zinc-200 transition min-h-[38px] cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          Print
        </button>

        {/* Delete Document Button */}
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-300 rounded-lg hover:bg-rose-100 hover:text-rose-900 transition shadow-xs cursor-pointer min-h-[38px]"
          title={`Delete ${isQuotation ? 'Quotation' : 'Invoice'}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </button>
      </div>

      {/* Desktop Fallback Guidance Toast Banner */}
      {shareFeedback && (
        <div className="w-full mt-3 bg-emerald-50 border border-emerald-300 rounded-lg p-2.5 text-xs text-emerald-950 flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{shareFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setShareFeedback(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold ml-2 text-sm px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        title={isQuotation ? 'Delete Quotation' : 'Delete Invoice'}
        message={`Are you sure you want to permanently delete ${
          isQuotation ? 'quotation' : 'tax invoice'
        } ${docNumber}? You will be redirected to the ${
          isQuotation ? 'quotations' : 'invoices'
        } list.`}
        docNumber={docNumber}
        docType={type}
        clientName={document.customer_name}
        amount={document.total_amount}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          if (!isDeleting) setShowDeleteModal(false);
        }}
      />
    </div>
  );
};
