import { Invoice, PaymentRecord, Quotation, ShopProfile } from '@/types';
import { formatINR, numberToIndianWords } from './numberToWords';

export function generateQuotationWhatsAppText(quotation: Quotation, shop: ShopProfile): string {
  return `*QUOTATION FROM ${shop.shop_name.toUpperCase()}* 📸
_Ref: ${quotation.quotation_number}_
Date: ${quotation.quotation_date}
Valid Until: ${quotation.validity_date}

Dear *${quotation.customer_name}*,
Thank you for considering us to capture your special moments! Here is the summary of your photography quotation:

*Event Details:*
📅 Date: ${quotation.event_date}
🎉 Event: ${quotation.event_type}
📍 Venue: ${quotation.event_venue}

*Services Included:*
${quotation.items.map((it, idx) => `${idx + 1}. ${it.description} (Qty: ${it.quantity}) - ${formatINR(it.total_price)}`).join('\n')}

*Financial Summary:*
• Subtotal: ${formatINR(quotation.subtotal)}
${quotation.discount_amount > 0 ? `• Discount: -${formatINR(quotation.discount_amount)}\n` : ''}• GST / Taxes: ${formatINR(quotation.tax_amount)}
*• Total Quotation Amount: ${formatINR(quotation.total_amount)}*
${
  quotation.advance_amount > 0 && quotation.advance_amount === Math.round(quotation.total_amount / 2)
    ? `• 1st Half (Advance Booking): ${formatINR(quotation.advance_amount)}\n• 2nd Half (Payable Later): ${formatINR(quotation.balance_amount)}`
    : quotation.advance_amount > 0
    ? `• Advance Booking Required: ${formatINR(quotation.advance_amount)}\n• Estimated Balance: ${formatINR(quotation.balance_amount)}`
    : ''
}

*Payment Options:*
UPI ID: ${shop.upi_id}
Bank: ${shop.bank_name}
A/C: ${shop.account_number}
IFSC: ${shop.ifsc_code}

Please find the official Quotation PDF attached. Feel free to connect with us at ${shop.phone} for any customizations or to confirm your booking dates.

Warm regards,
*${shop.owner_name}*
_${shop.shop_name}_`;
}

export function generateQuotationWhatsAppUrl(quotation: Quotation, shop: ShopProfile): string {
  const phone = quotation.customer_phone.replace(/[^0-9]/g, '');
  const text = generateQuotationWhatsAppText(quotation, shop);
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function generateInvoiceWhatsAppText(invoice: Invoice, shop: ShopProfile): string {
  return `*TAX INVOICE FROM ${shop.shop_name.toUpperCase()}* 📸
_Invoice No: ${invoice.invoice_number}_
Date: ${invoice.invoice_date}
Due Date: ${invoice.due_date}
${invoice.quotation_number ? `Quotation Ref: ${invoice.quotation_number}\n` : ''}
Dear *${invoice.customer_name}*,
Please find your photography service invoice details below (official Tax Invoice PDF is attached):

*Event Details:*
📅 Date: ${invoice.event_date}
🎉 Event: ${invoice.event_type}
📍 Venue: ${invoice.event_venue}

*Billed Services:*
${invoice.items.map((it, idx) => `${idx + 1}. ${it.description} (Qty: ${it.quantity}) - ${formatINR(it.total_price)}`).join('\n')}

*Payment Status: [${invoice.payment_status.toUpperCase()}]*
• Total Amount: ${formatINR(invoice.total_amount)}
${
  invoice.paid_amount > 0 && invoice.balance_amount > 0
    ? `• Amount Paid Received: ${formatINR(invoice.paid_amount)} ✅\n• Balance Payable Later: ${formatINR(invoice.balance_amount)} ⏳\n*• Balance Due: ${formatINR(invoice.balance_amount)}* (Due by ${invoice.due_date})`
    : invoice.paid_amount > 0
    ? `• Total Amount Paid: ${formatINR(invoice.paid_amount)} ✅\n*• Balance Outstanding: ₹0 (Paid in Full)*`
    : `*• Balance Outstanding: ${formatINR(invoice.balance_amount)}*`
}

*Bank & UPI Payment Details:*
UPI ID: ${shop.upi_id}
Bank: ${shop.bank_name}
A/C No: ${shop.account_number}
IFSC: ${shop.ifsc_code}
Account Holder: ${shop.account_holder}

${invoice.balance_amount > 0 ? 'Kindly share the transaction screenshot once the balance payment is completed.' : 'Thank you for your complete payment! It was a pleasure working with you.'}

Warm regards,
*${shop.owner_name}*
_${shop.shop_name}_
Contact: ${shop.phone}`;
}

export function generateInvoiceWhatsAppUrl(invoice: Invoice, shop: ShopProfile): string {
  const phone = invoice.customer_phone.replace(/[^0-9]/g, '');
  const text = generateInvoiceWhatsAppText(invoice, shop);
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function generatePaymentReceiptWhatsAppText(
  payment: PaymentRecord,
  invoice: Invoice,
  shop: ShopProfile
): string {
  return `*OFFICIAL PAYMENT RECEIPT* 🧾
*${shop.shop_name.toUpperCase()}*
────────────────────────
*Receipt No:* ${payment.receipt_number}
*Payment Date:* ${payment.payment_date}
*Invoice Ref:* ${invoice.invoice_number}

Received with thanks from:
👤 *${invoice.customer_name}*
📞 ${invoice.customer_phone}

*Event / Project:*
🎉 ${invoice.event_type} (${invoice.event_date})
📍 ${invoice.event_venue}

*Payment Particulars:*
💵 *Amount Paid:* ${formatINR(payment.amount)}
_${numberToIndianWords(payment.amount)}_
💳 *Payment Mode:* ${payment.payment_method}
${payment.transaction_reference ? `🔖 *Ref / UTR:* ${payment.transaction_reference}\n` : ''}${payment.notes ? `📝 *Notes:* ${payment.notes}\n` : ''}
*Account Summary:*
• Total Invoice Value: ${formatINR(invoice.total_amount)}
• Total Amount Paid: ${formatINR(invoice.paid_amount)}
*• Remaining Balance:* ${formatINR(invoice.balance_amount)}

${
  invoice.balance_amount === 0
    ? '✅ *This invoice is now fully settled! Thank you!*'
    : `Payment Status: *${invoice.payment_status}*\n\n⏳ *Remaining Bill / 2nd Payment Details:*\n• Balance Due: *${formatINR(invoice.balance_amount)}*\n• Due Date: ${invoice.due_date}\n• Instant UPI ID: *${shop.upi_id}*\n• Bank A/C: ${shop.account_number} (${shop.bank_name}, IFSC: ${shop.ifsc_code})\nKindly complete the second installment on or before the due date.`
}

Please find your official payment receipt voucher PDF attached.
Thank you for choosing ${shop.shop_name}!

Warm regards,
*${shop.owner_name}*
_${shop.phone}_`;
}

export function generatePaymentReceiptWhatsAppUrl(
  payment: PaymentRecord,
  invoice: Invoice,
  shop: ShopProfile
): string {
  const phone = invoice.customer_phone.replace(/[^0-9]/g, '');
  const text = generatePaymentReceiptWhatsAppText(payment, invoice, shop);
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
