/**
 * Basit TCKN test scripti: `npm run test:tckn`
 * Bağımlılık gerektirmeyen, çıktı tabanlı doğrulama.
 */
import { isValidTckn, maskTckn, generateValidTckn } from "./tckn";

let passed = 0;
let failed = 0;

function check(name: string, cond: boolean) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}`);
  }
}

console.log("TCKN doğrulama testleri:");

// Bilinen geçerli örnek TCKN'ler (algoritmaya uygun, gerçek kişi değil)
check("geçerli: 10000000146", isValidTckn("10000000146"));
check("geçerli: 12345678950", isValidTckn("12345678950"));

// Geçersizler
check("11 haneden kısa reddedilir", !isValidTckn("1234567895"));
check("harf içeren reddedilir", !isValidTckn("1234567895a"));
check("ilk hane 0 reddedilir", !isValidTckn("01234567890"));
check("yanlış checksum reddedilir", !isValidTckn("12345678901"));
check("boş string reddedilir", !isValidTckn(""));

// Maskeleme
check("maskeleme doğru", maskTckn("10000000146") === "100******46");

// Üretici her zaman geçerli üretir
let allGenValid = true;
for (let i = 0; i < 1000; i++) {
  if (!isValidTckn(generateValidTckn())) {
    allGenValid = false;
    break;
  }
}
check("generateValidTckn 1000 kez geçerli üretir", allGenValid);

console.log(`\nSonuç: ${passed} geçti, ${failed} kaldı`);
if (failed > 0) process.exit(1);
