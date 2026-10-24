/**
 * Converts a numerical amount into Indian currency words
 * Example: 106200 -> "Indian Rupees One Lakh Six Thousand Two Hundred Only"
 */

const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertTwoDigits(num: number): string {
  if (num < 20) return ones[num];
  const unit = num % 10;
  return tens[Math.floor(num / 10)] + (unit > 0 ? ' ' + ones[unit] : '');
}

function convertThreeDigits(num: number): string {
  const hundred = Math.floor(num / 100);
  const remainder = num % 100;
  let str = '';
  if (hundred > 0) {
    str += ones[hundred] + ' Hundred';
    if (remainder > 0) str += ' and ';
  }
  if (remainder > 0) {
    str += convertTwoDigits(remainder);
  }
  return str;
}

export function numberToIndianWords(amount: number): string {
  if (amount === 0) return 'Zero Rupees Only';
  if (isNaN(amount) || amount < 0) return '';

  const rounded = Math.floor(amount);
  const decimal = Math.round((amount - rounded) * 100);

  // Indian numbering: Crores, Lakhs, Thousands, Hundreds
  const crore = Math.floor(rounded / 10000000);
  const lakh = Math.floor((rounded % 10000000) / 100000);
  const thousand = Math.floor((rounded % 100000) / 1000);
  const hundredPart = rounded % 1000;

  const parts: string[] = [];

  if (crore > 0) {
    parts.push(convertThreeDigits(crore) + ' Crore');
  }
  if (lakh > 0) {
    parts.push(convertTwoDigits(lakh) + ' Lakh');
  }
  if (thousand > 0) {
    parts.push(convertTwoDigits(thousand) + ' Thousand');
  }
  if (hundredPart > 0) {
    parts.push(convertThreeDigits(hundredPart));
  }

  let result = 'Indian Rupees ' + parts.join(' ');

  if (decimal > 0) {
    result += ' and ' + convertTwoDigits(decimal) + ' Paise';
  }

  result += ' Only';
  return result;
}

export function formatINR(val: number): string {
  if (isNaN(val) || val === null || val === undefined) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}
