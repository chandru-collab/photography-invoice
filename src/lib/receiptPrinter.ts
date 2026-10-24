'use client';

import { Invoice, PaymentRecord, ShopProfile } from '@/types';
import { formatINR, numberToIndianWords } from './numberToWords';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

export function generateReceiptHtml(
  payment: PaymentRecord,
  invoice: Invoice,
  shop: ShopProfile
): string {
  const amountWords = numberToIndianWords(payment.amount);
  const isSettled = invoice.balance_amount === 0;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Payment Receipt - ${payment.receipt_number}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      padding: 24px;
      line-height: 1.45;
      font-size: 13px;
    }
    .receipt-container {
      max-width: 720px;
      margin: 0 auto;
      border: 2px solid #0f172a;
      border-radius: 4px;
      padding: 32px 36px;
      position: relative;
      background: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 18px;
      margin-bottom: 20px;
    }
    .studio-name {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: #09090b;
      margin-bottom: 2px;
    }
    .tagline {
      font-size: 11px;
      color: #52525b;
      font-style: italic;
      margin-bottom: 6px;
    }
    .studio-meta {
      font-size: 11px;
      color: #3f3f46;
      line-height: 1.5;
    }
    .badge-col {
      text-align: right;
    }
    .receipt-badge {
      display: inline-block;
      background: #09090b;
      color: #ffffff;
      font-size: 13px;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 2px;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .receipt-id-box {
      margin-top: 10px;
      text-align: right;
      font-size: 12px;
    }
    .receipt-id-box strong {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      color: #09090b;
    }
    /* Grid details */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 12px 14px;
      font-size: 11.5px;
    }
    .card-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #64748b;
      margin-bottom: 6px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 3px;
    }
    .customer-name {
      font-size: 13px;
      font-weight: 700;
      color: #09090b;
      margin-bottom: 2px;
    }
    /* Payment Highlight Box */
    .payment-highlight {
      background: #f0fdf4;
      border: 1.5px solid #86efac;
      border-radius: 6px;
      padding: 18px 20px;
      margin-bottom: 20px;
    }
    .amount-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .amount-label {
      font-size: 12px;
      font-weight: 700;
      color: #166534;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .amount-value {
      font-size: 26px;
      font-weight: 800;
      color: #14532d;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .words-box {
      font-size: 11px;
      color: #166534;
      font-style: italic;
      font-weight: 600;
      border-top: 1px dashed #bbf7d0;
      padding-top: 6px;
    }
    /* Details Table */
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 11.5px;
    }
    .details-table th, .details-table td {
      border: 1px solid #e2e8f0;
      padding: 8px 12px;
      text-align: left;
    }
    .details-table th {
      background: #f1f5f9;
      font-weight: 700;
      color: #334155;
      width: 35%;
    }
    .details-table td {
      color: #09090b;
    }
    /* Account statement */
    .statement-box {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 24px;
      text-align: center;
    }
    .stat-card {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 10px;
      border-radius: 4px;
    }
    .stat-label {
      font-size: 10px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
    }
    .stat-value {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      margin-top: 2px;
    }
    .stat-value.balance {
      color: ${isSettled ? '#15803d' : '#b91c1c'};
    }
    /* Signatory Footer */
    .footer-sign {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 36px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
    }
    .note-text {
      font-size: 10px;
      color: #64748b;
      max-width: 380px;
      line-height: 1.4;
    }
    .sign-block {
      text-align: center;
      width: 180px;
    }
    .sign-line {
      border-top: 1px solid #09090b;
      margin-top: 40px;
      padding-top: 4px;
      font-size: 11px;
      font-weight: 600;
      color: #09090b;
    }
    .seal-text {
      font-size: 9px;
      color: #71717a;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <!-- Header -->
    <div class="header">
      <div>
        <h1 class="studio-name">${shop.shop_name}</h1>
        ${shop.tagline ? `<p class="tagline">${shop.tagline}</p>` : ''}
        <div class="studio-meta">
          <p>${shop.address}, ${shop.city}, ${shop.state} - ${shop.pincode}</p>
          <p>Phone: ${shop.phone} | Email: ${shop.email}</p>
          ${shop.gstin ? `<p><strong>GSTIN:</strong> ${shop.gstin}</p>` : ''}
        </div>
      </div>
      <div class="badge-col">
        <span class="receipt-badge">Payment Receipt</span>
        <div class="receipt-id-box">
          <p>Receipt No: <strong>${payment.receipt_number}</strong></p>
          <p>Date: <strong>${payment.payment_date}</strong></p>
        </div>
      </div>
    </div>

    <!-- Client & Event Info -->
    <div class="grid-2">
      <div class="card">
        <div class="card-title">Received With Thanks From</div>
        <p class="customer-name">${invoice.customer_name}</p>
        <p style="color: #475569;">${invoice.customer_address}</p>
        <p style="color: #475569; margin-top: 4px;">Phone: <strong>${invoice.customer_phone}</strong></p>
        ${invoice.customer_gstin ? `<p style="margin-top:2px;">GSTIN: <strong>${invoice.customer_gstin}</strong></p>` : ''}
      </div>

      <div class="card">
        <div class="card-title">Event & Invoice Reference</div>
        <p><strong>Invoice Ref:</strong> <span style="font-family: monospace;">${invoice.invoice_number}</span></p>
        <p><strong>Shoot Date:</strong> ${invoice.event_date || 'As scheduled'}</p>
        <p><strong>Event:</strong> ${invoice.event_type || 'Photography Services'}</p>
        <p><strong>Venue:</strong> ${invoice.event_venue || 'On-Location'}</p>
      </div>
    </div>

    <!-- Amount Received Highlight -->
    <div class="payment-highlight">
      <div class="amount-row">
        <span class="amount-label">Amount Received</span>
        <span class="amount-value">${formatINR(payment.amount)}</span>
      </div>
      <div class="words-box">
        In words: ${amountWords}
      </div>
    </div>

    <!-- Payment Particulars -->
    <table class="details-table">
      <tr>
        <th>Payment Mode</th>
        <td><strong>${payment.payment_method}</strong></td>
      </tr>
      ${payment.transaction_reference ? `
      <tr>
        <th>Transaction / UTR Reference</th>
        <td style="font-family: monospace; font-weight: 600;">${payment.transaction_reference}</td>
      </tr>` : ''}
      ${payment.notes ? `
      <tr>
        <th>Remarks / Payment Notes</th>
        <td>${payment.notes}</td>
      </tr>` : ''}
    </table>

    <!-- Account Settlement Statement -->
    <div class="statement-box">
      <div class="stat-card">
        <div class="stat-label">Total Invoice Value</div>
        <div class="stat-value">${formatINR(invoice.total_amount)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Amount Paid</div>
        <div class="stat-value" style="color: #15803d;">${formatINR(invoice.paid_amount)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Remaining Balance</div>
        <div class="stat-value balance">${formatINR(invoice.balance_amount)}</div>
      </div>
    </div>

    <!-- Footer & Signatory -->
    <div class="footer-sign">
      <div class="note-text">
        <p>• Thank you for your payment and for trusting ${shop.shop_name} with your memories.</p>
        <p>• This document is an official computer-generated receipt voucher acknowledging receipt of funds.</p>
        ${!isSettled ? `<p>• Remaining balance of ${formatINR(invoice.balance_amount)} is due as per agreed milestone terms.</p>` : ''}
      </div>
      <div class="sign-block">
        ${shop.signature_url ? `<img src="${shop.signature_url}" style="max-height: 40px; margin-bottom: -15px;" alt="Signature" />` : ''}
        <div class="sign-line">
          ${shop.owner_name}
          <div class="seal-text">Authorized Signatory</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Prints the payment receipt voucher in an isolated iframe.
 * Guarantees zero leakage from the parent page or invoice backdrop.
 */
export function printStandaloneReceipt({
  payment,
  invoice,
  shop,
}: {
  payment: PaymentRecord;
  invoice: Invoice;
  shop: ShopProfile;
}): void {
  const html = generateReceiptHtml(payment, invoice, shop);

  // Create isolated invisible iframe
  const iframe = document.createElement('iframe');
  iframe.setAttribute('style', 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;');
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow?.document;
  if (!iframeDoc) {
    // Fallback if iframe fails
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      win.print();
    }
    return;
  }

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  iframe.contentWindow?.focus();
  setTimeout(() => {
    try {
      iframe.contentWindow?.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }
  }, 250);
}

/**
 * Generates an actual PDF File object for the payment receipt voucher.
 */
export async function generateReceiptPdfFile({
  payment,
  invoice,
  shop,
}: {
  payment: PaymentRecord;
  invoice: Invoice;
  shop: ShopProfile;
}): Promise<File> {
  const html = generateReceiptHtml(payment, invoice, shop);

  // Create a temporary off-screen container
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'fixed';
  tempContainer.style.left = '-9999px';
  tempContainer.style.top = '0';
  tempContainer.style.width = '750px';
  tempContainer.style.background = '#ffffff';
  tempContainer.innerHTML = html.replace(/<\/?(html|head|body)[^>]*>/gi, '');
  document.body.appendChild(tempContainer);

  try {
    const canvas = await html2canvas(tempContainer, {
      scale: 2, // 2x for sharp print quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    const filename = `Receipt_${payment.receipt_number}_${invoice.customer_name.replace(/\s+/g, '_')}.pdf`;
    const blob = pdf.output('blob');
    return new File([blob], filename, { type: 'application/pdf' });
  } finally {
    if (document.body.contains(tempContainer)) {
      document.body.removeChild(tempContainer);
    }
  }
}

/**
 * Generates and downloads a clean, high-DPI PDF of the receipt voucher.
 */
export async function downloadReceiptPdf({
  payment,
  invoice,
  shop,
}: {
  payment: PaymentRecord;
  invoice: Invoice;
  shop: ShopProfile;
}): Promise<void> {
  const file = await generateReceiptPdfFile({ payment, invoice, shop });
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
