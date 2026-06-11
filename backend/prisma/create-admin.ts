/**
 * Admin/personel hesabı oluşturur veya günceller.
 *
 * Kullanım:
 *   npx tsx prisma/create-admin.ts <kullaniciAdi> <sifre> [adSoyad] [ADMIN|STAFF]
 *
 * Örnek:
 *   npx tsx prisma/create-admin.ts admin "SporSalonu!2026" "Sistem Yöneticisi" ADMIN
 */
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const [username, password, fullName = "Yönetici", roleArg = "ADMIN"] =
    process.argv.slice(2);

  if (!username || !password) {
    console.error(
      'Kullanım: npx tsx prisma/create-admin.ts <kullaniciAdi> <sifre> [adSoyad] [ADMIN|STAFF]'
    );
    process.exit(1);
  }

  const role: Role = roleArg === "STAFF" ? "STAFF" : "ADMIN";
  const passwordHash = await bcrypt.hash(password, 10);

  const staff = await prisma.staff.upsert({
    where: { username },
    update: { passwordHash, fullName, role },
    create: { username, passwordHash, fullName, role },
  });

  console.log(
    `✓ Hesap hazır -> kullanıcı: ${staff.username} | rol: ${staff.role} | ad: ${staff.fullName}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
