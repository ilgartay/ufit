/**
 * T.C. Kimlik Numarası (TCKN) doğrulama ve maskeleme yardımcıları.
 *
 * Algoritma (resmi NVİ kuralları):
 *  - 11 haneli olmalı, sadece rakam.
 *  - İlk hane 0 olamaz.
 *  - d10 = ((d1+d3+d5+d7+d9) * 7 - (d2+d4+d6+d8)) mod 10
 *  - d11 = (d1+d2+...+d10) mod 10
 */

export function isValidTckn(value: string): boolean {
  if (!/^\d{11}$/.test(value)) return false;

  const d = value.split("").map(Number);

  // İlk hane 0 olamaz
  if (d[0] === 0) return false;

  const oddSum = d[0] + d[2] + d[4] + d[6] + d[8]; // 1,3,5,7,9. haneler
  const evenSum = d[1] + d[3] + d[5] + d[7]; // 2,4,6,8. haneler

  const digit10 = ((oddSum * 7 - evenSum) % 10 + 10) % 10;
  if (digit10 !== d[9]) return false;

  const sumFirst10 = d.slice(0, 10).reduce((a, b) => a + b, 0);
  const digit11 = sumFirst10 % 10;
  if (digit11 !== d[10]) return false;

  return true;
}

/**
 * TCKN'yi yalnızca ilk 3 ve son 2 haneyi gösterecek şekilde maskeler.
 * Örn: "10000000146" -> "100******46"
 */
export function maskTckn(value: string): string {
  if (!/^\d{11}$/.test(value)) return value;
  return `${value.slice(0, 3)}******${value.slice(9)}`;
}

/**
 * Test/seed amaçlı geçerli bir TCKN üretir.
 */
export function generateValidTckn(): string {
  const d: number[] = [];
  d.push(1 + Math.floor(Math.random() * 9)); // ilk hane 1-9
  for (let i = 1; i < 9; i++) d.push(Math.floor(Math.random() * 10));

  const oddSum = d[0] + d[2] + d[4] + d[6] + d[8];
  const evenSum = d[1] + d[3] + d[5] + d[7];
  const digit10 = ((oddSum * 7 - evenSum) % 10 + 10) % 10;
  d.push(digit10);

  const sumFirst10 = d.reduce((a, b) => a + b, 0);
  const digit11 = sumFirst10 % 10;
  d.push(digit11);

  return d.join("");
}
