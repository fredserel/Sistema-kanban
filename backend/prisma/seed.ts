import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@sistema.com' },
    update: {},
    create: {
      email: 'admin@sistema.com',
      password: hashedPassword,
      name: 'Administrador',
      role: Role.ADMIN,
    },
  });

  console.log('Usuário ADMIN criado:', admin);

  const manager = await prisma.user.upsert({
    where: { email: 'gerente@sistema.com' },
    update: {},
    create: {
      email: 'gerente@sistema.com',
      password: await bcrypt.hash('gerente123', 10),
      name: 'Gerente de Projetos',
      role: Role.MANAGER,
    },
  });

  console.log('Usuário MANAGER criado:', manager);

  const member = await prisma.user.upsert({
    where: { email: 'membro@sistema.com' },
    update: {},
    create: {
      email: 'membro@sistema.com',
      password: await bcrypt.hash('membro123', 10),
      name: 'Membro da Equipe',
      role: Role.MEMBER,
    },
  });

  console.log('Usuário MEMBER criado:', member);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
