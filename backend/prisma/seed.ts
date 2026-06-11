import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const username = process.env.SEED_ADMIN_USERNAME || "admin";
  const password = process.env.SEED_ADMIN_PASSWORD || "Admin123!";
  const fullName = process.env.SEED_ADMIN_FULLNAME || "Sistem Yöneticisi";

  const existing = await prisma.staff.findUnique({ where: { username } });
  if (existing) {
    console.log(`Admin '${username}' zaten mevcut, atlanıyor.`);
    return;
  }

  await prisma.staff.create({
    data: {
      username,
      passwordHash: await bcrypt.hash(password, 10),
      fullName,
      role: "ADMIN",
    },
  });

  console.log(`✓ Admin personel oluşturuldu: ${username} / ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
