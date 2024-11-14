import { createHash } from 'crypto';

const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const BASE62_DICT = Object.fromEntries([...BASE62].map((c, i) => [c, i]));

export function hashObject(obj: any): string {
  const str = JSON.stringify(obj);
  const hash = createHash('sha256').update(str).digest('hex');
  return toBase62(hash);
}

export function toBase62(hex: string): string {
  let decimal = '';
  for (let i = 0; i < hex.length; i++) {
    decimal = addHexDigit(decimal, hex[i]);
  }
  return decimalToBase62(decimal);
}

export function fromBase62(str: string): string {
  let decimal = '0';
  for (let i = 0; i < str.length; i++) {
    decimal = multiplyStrings(decimal, '62');
    decimal = addStrings(decimal, BASE62_DICT[str[i]].toString());
  }
  return decimal;
}

export function compressNumber(n: number): string {
  return decimalToBase62(n.toString());
}

export function decompressNumber(s: string): number {
  return parseInt(fromBase62(s), 10);
}

export function compressString(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let decimal = '0';
  for (const byte of bytes) {
    decimal = multiplyStrings(decimal, '256');
    decimal = addStrings(decimal, byte.toString());
  }
  return decimalToBase62(decimal);
}

export function decompressString(s: string): string {
  let decimal = fromBase62(s);
  const bytes = [];
  while (decimal !== '0') {
    const [quotient, remainder] = divideStrings(decimal, '256');
    bytes.unshift(parseInt(remainder, 10));
    decimal = quotient;
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}

export function compressArray<T>(arr: T[], fn: (item: T) => string): string {
  return arr.map(fn).join('~');
}

export function decompressArray<T>(s: string, fn: (item: string) => T): T[] {
  return s.split('~').map(fn);
}

function decimalToBase62(decimal: string): string {
  if (decimal === '0') return '0';
  let result = '';
  let num = decimal;
  while (num !== '0') {
    const [quotient, remainder] = divideStrings(num, '62');
    result = BASE62[parseInt(remainder, 10)] + result;
    num = quotient;
  }
  return result;
}

function addHexDigit(decimal: string, hexDigit: string): string {
  const value = parseInt(hexDigit, 16);
  const product = multiplyStrings(decimal, '16');
  return addStrings(product, value.toString());
}

function addStrings(a: string, b: string): string {
  const maxLength = Math.max(a.length, b.length);
  let carry = 0;
  let result = '';
  
  for (let i = 0; i < maxLength || carry; i++) {
    const digitA = parseInt(a[a.length - 1 - i] || '0', 10);
    const digitB = parseInt(b[b.length - 1 - i] || '0', 10);
    const sum = digitA + digitB + carry;
    carry = Math.floor(sum / 10);
    result = (sum % 10).toString() + result;
  }
  
  return result;
}

function multiplyStrings(a: string, b: string): string {
  if (a === '0' || b === '0') return '0';
  
  const product = Array(a.length + b.length).fill(0);
  
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      const digitA = parseInt(a[i], 10);
      const digitB = parseInt(b[j], 10);
      const pos1 = i + j;
      const pos2 = i + j + 1;
      const mul = digitA * digitB;
      const sum = mul + product[pos2];
      
      product[pos2] = sum % 10;
      product[pos1] += Math.floor(sum / 10);
    }
  }
  
  while (product[0] === 0) product.shift();
  return product.length ? product.join('') : '0';
}

function divideStrings(a: string, b: string): [string, string] {
  let quotient = '0';
  let remainder = '0';
  
  for (let i = 0; i < a.length; i++) {
    remainder = multiplyStrings(remainder, '10');
    remainder = addStrings(remainder, a[i]);
    
    let count = 0;
    let sum = '0';
    while (compareStrings(sum, remainder) <= 0) {
      sum = addStrings(sum, b);
      count++;
    }
    count--;
    sum = subtractStrings(sum, b);
    
    quotient = addStrings(multiplyStrings(quotient, '10'), count.toString());
    remainder = subtractStrings(remainder, sum);
  }
  
  return [quotient, remainder];
}

function subtractStrings(a: string, b: string): string {
  if (compareStrings(a, b) < 0) return '0';
  
  let borrow = 0;
  let result = '';
  const maxLength = Math.max(a.length, b.length);
  
  for (let i = 0; i < maxLength; i++) {
    let digitA = parseInt(a[a.length - 1 - i] || '0', 10) - borrow;
    const digitB = parseInt(b[b.length - 1 - i] || '0', 10);
    
    if (digitA < digitB) {
      digitA += 10;
      borrow = 1;
    } else {
      borrow = 0;
    }
    
    result = (digitA - digitB).toString() + result;
  }
  
  while (result.length > 1 && result[0] === '0') {
    result = result.slice(1);
  }
  
  return result;
}

function compareStrings(a: string, b: string): number {
  if (a.length !== b.length) return a.length - b.length;
  return a.localeCompare(b);
}
