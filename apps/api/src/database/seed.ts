import bcrypt from 'bcrypt';
import dataSource from './data-source';
import { BookingStatus } from '../common/enums/booking-status.enum';
import { PaymentProvider } from '../common/enums/payment-provider.enum';
import { PaymentStatus } from '../common/enums/payment-status.enum';
import { SessionStatus } from '../common/enums/session-status.enum';
import { StudentPackageStatus } from '../common/enums/student-package-status.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { BookingEntity } from '../bookings/booking.entity';
import { PackageEntity } from '../packages/package.entity';
import { PaymentEntity } from '../payments/payment.entity';
import { SessionEntity } from '../sessions/session.entity';
import { StudentPackageEntity } from '../student-packages/student-package.entity';
import { TenantEntity } from '../tenants/tenant.entity';
import { UserEntity } from '../users/user.entity';

async function seed() {
  await dataSource.initialize();

  const tenantRepository = dataSource.getRepository(TenantEntity);
  const userRepository = dataSource.getRepository(UserEntity);
  const packageRepository = dataSource.getRepository(PackageEntity);
  const sessionRepository = dataSource.getRepository(SessionEntity);
  const paymentRepository = dataSource.getRepository(PaymentEntity);
  const studentPackageRepository = dataSource.getRepository(StudentPackageEntity);
  const bookingRepository = dataSource.getRepository(BookingEntity);

  let tenant = await tenantRepository.findOne({ where: { slug: 'sofia-pilates' } });

  if (!tenant) {
    tenant = tenantRepository.create({
      slug: 'sofia-pilates',
      name: 'Sofia Pilates',
      description: 'Pilates boutique para moverte con calma y fuerza.',
      address: 'Roma Norte, Ciudad de Mexico',
      phone: '+525512345678',
      instagram: 'sofiapilates',
      themeColor: '#4A7C6F',
      typography: 'DM Sans',
      timezone: 'America/Mexico_City',
    });
    tenant = await tenantRepository.save(tenant);
  }

  const ownerEmail = 'sofia@flowi.app';
  let owner = await userRepository.findOne({ where: { tenantId: tenant.id, email: ownerEmail } });

  if (!owner) {
    owner = userRepository.create({
      tenantId: tenant.id,
      email: ownerEmail,
      passwordHash: await bcrypt.hash('Flowi123!', 12),
      firstName: 'Sofia',
      lastName: 'Martinez',
      phone: '+525512345678',
      role: UserRole.Owner,
      emailVerified: true,
    });
    owner = await userRepository.save(owner);
  }

  const packageSeeds = [
    { name: 'Prueba', totalClasses: 1, validityDays: 7, price: '120.00', sortOrder: 1 },
    { name: 'Inicio', totalClasses: 3, validityDays: 15, price: '350.00', sortOrder: 2 },
    { name: 'Mensual', totalClasses: 10, validityDays: 30, price: '950.00', sortOrder: 3 },
  ];

  const packages: PackageEntity[] = [];

  for (const packageSeed of packageSeeds) {
    let packageEntity = await packageRepository.findOne({
      where: { tenantId: tenant.id, name: packageSeed.name },
    });

    if (!packageEntity) {
      packageEntity = await packageRepository.save(
        packageRepository.create({
          tenantId: tenant.id,
          description: `${packageSeed.totalClasses} clase(s), vigencia de ${packageSeed.validityDays} dias.`,
          currency: 'MXN',
          isActive: true,
          ...packageSeed,
        }),
      );
    }

    packages.push(packageEntity);
  }

  const students: UserEntity[] = [];

  for (const [index, firstName] of ['Ana', 'Camila', 'Regina', 'Mariana', 'Lucia'].entries()) {
    const email = `${firstName.toLowerCase()}@example.com`;
    let student = await userRepository.findOne({ where: { tenantId: tenant.id, email } });

    if (!student) {
      student = await userRepository.save(
        userRepository.create({
          tenantId: tenant.id,
          email,
          passwordHash: await bcrypt.hash('Flowi123!', 12),
          firstName,
          lastName: 'Demo',
          role: UserRole.Student,
          emailVerified: true,
          phone: `+5255123456${index}`,
        }),
      );
    }

    students.push(student);
  }

  const now = new Date();
  const sessions: SessionEntity[] = [];

  for (let index = 0; index < 10; index += 1) {
    const startTime = new Date(now);
    startTime.setDate(now.getDate() + Math.floor(index / 2));
    startTime.setHours(8 + (index % 2) * 10, 0, 0, 0);

    const existingSession = await sessionRepository.findOne({
      where: {
        tenantId: tenant.id,
        title: `Pilates Mat ${index + 1}`,
        startTime,
      },
    });

    if (existingSession) {
      sessions.push(existingSession);
      continue;
    }

    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 1);

    const session = await sessionRepository.save(
      sessionRepository.create({
        tenantId: tenant.id,
        instructorId: owner.id,
        title: `Pilates Mat ${index + 1}`,
        description: 'Clase demo de Pilates Mat.',
        startTime,
        endTime,
        maxCapacity: 10,
        currentBookings: 0,
        location: 'Sala principal',
        status: SessionStatus.Scheduled,
      }),
    );
    sessions.push(session);
  }

  for (const [index, student] of students.entries()) {
    const selectedPackage = packages[index % packages.length];
    let payment = await paymentRepository.findOne({
      where: {
        tenantId: tenant.id,
        userId: student.id,
        packageId: selectedPackage.id,
        status: PaymentStatus.Approved,
      },
    });

    if (!payment) {
      payment = await paymentRepository.save(
        paymentRepository.create({
          tenantId: tenant.id,
          userId: student.id,
          packageId: selectedPackage.id,
          amount: selectedPackage.price,
          currency: selectedPackage.currency,
          provider: PaymentProvider.MercadoPago,
          providerId: `seed-mp-${student.id}`,
          status: PaymentStatus.Approved,
          metadata: { source: 'seed' },
        }),
      );
    }

    let studentPackage = await studentPackageRepository.findOne({
      where: { tenantId: tenant.id, userId: student.id, paymentId: payment.id },
    });

    if (!studentPackage) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + selectedPackage.validityDays);

      studentPackage = await studentPackageRepository.save(
        studentPackageRepository.create({
          tenantId: tenant.id,
          userId: student.id,
          packageId: selectedPackage.id,
          paymentId: payment.id,
          classesRemaining: selectedPackage.totalClasses,
          expiresAt,
          status: StudentPackageStatus.Active,
        }),
      );
    }

    const session = sessions[index];
    const existingBooking = await bookingRepository.findOne({
      where: { tenantId: tenant.id, userId: student.id, sessionId: session.id },
    });

    if (!existingBooking) {
      await bookingRepository.save(
        bookingRepository.create({
          tenantId: tenant.id,
          userId: student.id,
          sessionId: session.id,
          studentPackageId: studentPackage.id,
          status: BookingStatus.Confirmed,
        }),
      );

      await sessionRepository.increment({ id: session.id }, 'currentBookings', 1);
    }
  }

  await dataSource.destroy();
}

void seed().catch(async (error: unknown) => {
  console.error(error);

  if (dataSource.isInitialized) {
    await dataSource.destroy();
  }

  process.exit(1);
});
