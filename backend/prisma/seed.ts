import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Users ──────────────────────────────────────────────────────

  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const ownerPassword = await bcrypt.hash('Owner123!', 12);
  const userPassword = await bcrypt.hash('User1234!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@datagov.io' },
    update: {},
    create: {
      name: 'Platform Admin',
      email: 'admin@datagov.io',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: 'owner@datagov.io' },
    update: {},
    create: {
      name: 'Data Publisher',
      email: 'owner@datagov.io',
      passwordHash: ownerPassword,
      role: 'OWNER',
    },
  });

  const registeredUser = await prisma.user.upsert({
    where: { email: 'user@datagov.io' },
    update: {},
    create: {
      name: 'Regular User',
      email: 'user@datagov.io',
      passwordHash: userPassword,
      role: 'REGISTERED',
    },
  });

  console.log('✅ Users created:', admin.email, owner.email, registeredUser.email);

  // ── Dataset 1: Public, Open ────────────────────────────────────

  const dataset1 = await prisma.dataset.upsert({
    where: { id: 'seed-dataset-1' },
    update: {},
    create: {
      id: 'seed-dataset-1',
      title: 'India Air Quality Index 2023',
      description:
        'Monthly Air Quality Index measurements across 50 major Indian cities in 2023. Includes PM2.5, PM10, NO2, SO2, CO readings from official monitoring stations.',
      tags: ['environment', 'air-quality', 'india', 'public-health'],
      visibility: 'PUBLIC',
      accessClassification: 'OPEN',
      ownerId: owner.id,
      viewCount: 142,
      downloadCount: 38,
    },
  });

  // Metadata version for dataset 1
  await prisma.metadataVersion.upsert({
    where: { datasetId_versionNumber: { datasetId: dataset1.id, versionNumber: 1 } },
    update: {},
    create: {
      datasetId: dataset1.id,
      versionNumber: 1,
      title: dataset1.title,
      description: dataset1.description,
      tags: dataset1.tags,
      visibility: dataset1.visibility,
      accessClassification: dataset1.accessClassification,
      changeNote: 'Initial publication',
      createdById: owner.id,
    },
  });

  // Data version + rows for dataset 1
  const existingVersion1 = await prisma.dataVersion.findFirst({
    where: { datasetId: dataset1.id },
  });

  if (!existingVersion1) {
    const rows = [
      { city: 'Delhi', month: 'January', pm25: 245, pm10: 310, aqi: 298, category: 'Hazardous' },
      { city: 'Mumbai', month: 'January', pm25: 89, pm10: 134, aqi: 112, category: 'Unhealthy for Sensitive Groups' },
      { city: 'Bangalore', month: 'January', pm25: 52, pm10: 78, aqi: 67, category: 'Moderate' },
      { city: 'Chennai', month: 'January', pm25: 61, pm10: 95, aqi: 79, category: 'Moderate' },
      { city: 'Hyderabad', month: 'January', pm25: 74, pm10: 112, aqi: 88, category: 'Moderate' },
      { city: 'Kolkata', month: 'January', pm25: 132, pm10: 198, aqi: 167, category: 'Unhealthy' },
      { city: 'Delhi', month: 'February', pm25: 198, pm10: 278, aqi: 241, category: 'Very Unhealthy' },
      { city: 'Mumbai', month: 'February', pm25: 76, pm10: 118, aqi: 96, category: 'Moderate' },
      { city: 'Pune', month: 'January', pm25: 45, pm10: 67, aqi: 58, category: 'Moderate' },
      { city: 'Ahmedabad', month: 'January', pm25: 88, pm10: 135, aqi: 110, category: 'Unhealthy for Sensitive Groups' },
    ];

    const dataVersion1 = await prisma.dataVersion.create({
      data: {
        datasetId: dataset1.id,
        versionNumber: 1,
        fileName: 'india_aqi_2023.csv',
        fileSizeBytes: 2048,
        rowCount: rows.length,
        columnNames: ['city', 'month', 'pm25', 'pm10', 'aqi', 'category'],
        columnStats: {
          city: { type: 'categorical', nullCount: 0, uniqueCount: 7, topValues: [{ value: 'Delhi', count: 2 }, { value: 'Mumbai', count: 2 }] },
          pm25: { type: 'numeric', nullCount: 0, min: 45, max: 245, mean: 106, stdDev: 67.5 },
          aqi: { type: 'numeric', nullCount: 0, min: 58, max: 298, mean: 132, stdDev: 80.2 },
        } as any,
        storageKey: 'datasets/seed-dataset-1/india_aqi_2023.csv',
        isLatest: true,
        createdById: owner.id,
      },
    });

    await prisma.dataRow.createMany({
      data: rows.map((row, idx) => ({
        dataVersionId: dataVersion1.id,
        rowIndex: idx,
        data: row as any,
        isRestricted: false,
      })),
    });
  }

  // ── Dataset 2: Public, Restricted ─────────────────────────────

  const dataset2 = await prisma.dataset.upsert({
    where: { id: 'seed-dataset-2' },
    update: {},
    create: {
      id: 'seed-dataset-2',
      title: 'Healthcare Worker Demographics 2022',
      description:
        'Anonymized demographic data of healthcare workers across India, 2022. Includes age, specialization, experience years, and salary ranges. Sensitive personal data requires approval.',
      tags: ['healthcare', 'demographics', 'salary', 'india', 'restricted'],
      visibility: 'PUBLIC',
      accessClassification: 'RESTRICTED',
      ownerId: owner.id,
      viewCount: 89,
      downloadCount: 5,
    },
  });

  await prisma.metadataVersion.upsert({
    where: { datasetId_versionNumber: { datasetId: dataset2.id, versionNumber: 1 } },
    update: {},
    create: {
      datasetId: dataset2.id,
      versionNumber: 1,
      title: dataset2.title,
      description: dataset2.description,
      tags: dataset2.tags,
      visibility: dataset2.visibility,
      accessClassification: dataset2.accessClassification,
      changeNote: 'Initial publication',
      createdById: owner.id,
    },
  });

  // Column protection rules
  await prisma.columnProtectionRule.upsert({
    where: { datasetId_columnName: { datasetId: dataset2.id, columnName: 'salary_range' } },
    update: {},
    create: { datasetId: dataset2.id, columnName: 'salary_range', strategy: 'MASK' },
  });

  await prisma.columnProtectionRule.upsert({
    where: { datasetId_columnName: { datasetId: dataset2.id, columnName: 'employee_id' } },
    update: {},
    create: { datasetId: dataset2.id, columnName: 'employee_id', strategy: 'ANONYMIZE' },
  });

  const existingVersion2 = await prisma.dataVersion.findFirst({
    where: { datasetId: dataset2.id },
  });

  if (!existingVersion2) {
    const rows = [
      { employee_id: 'EMP001', age: 32, specialization: 'Cardiology', experience_years: 7, salary_range: '15-20 LPA', state: 'Maharashtra' },
      { employee_id: 'EMP002', age: 45, specialization: 'Neurology', experience_years: 18, salary_range: '25-35 LPA', state: 'Delhi' },
      { employee_id: 'EMP003', age: 28, specialization: 'General Medicine', experience_years: 3, salary_range: '8-12 LPA', state: 'Karnataka' },
      { employee_id: 'EMP004', age: 38, specialization: 'Orthopedics', experience_years: 12, salary_range: '20-28 LPA', state: 'Tamil Nadu' },
      { employee_id: 'EMP005', age: 52, specialization: 'Oncology', experience_years: 25, salary_range: '40-60 LPA', state: 'Gujarat' },
    ];

    const dataVersion2 = await prisma.dataVersion.create({
      data: {
        datasetId: dataset2.id,
        versionNumber: 1,
        fileName: 'healthcare_workers_2022.csv',
        fileSizeBytes: 1024,
        rowCount: rows.length,
        columnNames: ['employee_id', 'age', 'specialization', 'experience_years', 'salary_range', 'state'],
        columnStats: {
          age: { type: 'numeric', nullCount: 0, min: 28, max: 52, mean: 39, stdDev: 9.2 },
          specialization: { type: 'categorical', nullCount: 0, uniqueCount: 5, topValues: [] },
          salary_range: { type: 'categorical', nullCount: 0, uniqueCount: 5, topValues: [] },
        } as any,
        storageKey: 'datasets/seed-dataset-2/healthcare_workers_2022.csv',
        isLatest: true,
        createdById: owner.id,
      },
    });

    await prisma.dataRow.createMany({
      data: rows.map((row, idx) => ({
        dataVersionId: dataVersion2.id,
        rowIndex: idx,
        data: row as any,
        isRestricted: false,
      })),
    });
  }

  // ── Dataset 3: Private, Registered ────────────────────────────

  const dataset3 = await prisma.dataset.upsert({
    where: { id: 'seed-dataset-3' },
    update: {},
    create: {
      id: 'seed-dataset-3',
      title: 'Urban Traffic Patterns Q3 2023 (Private)',
      description:
        'Internal traffic flow analysis data from 12 metro cities. Includes peak hour patterns, congestion indices, and road category breakdowns. Shared privately with partner organizations.',
      tags: ['traffic', 'urban', 'transport', 'private'],
      visibility: 'PRIVATE',
      accessClassification: 'REGISTERED',
      ownerId: owner.id,
      viewCount: 12,
      downloadCount: 3,
    },
  });

  await prisma.metadataVersion.upsert({
    where: { datasetId_versionNumber: { datasetId: dataset3.id, versionNumber: 1 } },
    update: {},
    create: {
      datasetId: dataset3.id,
      versionNumber: 1,
      title: dataset3.title,
      description: dataset3.description,
      tags: dataset3.tags,
      visibility: dataset3.visibility,
      accessClassification: dataset3.accessClassification,
      changeNote: 'Initial (private) publication',
      createdById: owner.id,
    },
  });

  // Grant admin user access to private dataset
  await prisma.accessGrant.upsert({
    where: { userId_datasetId: { userId: admin.id, datasetId: dataset3.id } },
    update: {},
    create: {
      userId: admin.id,
      datasetId: dataset3.id,
      grantedBy: owner.id,
      isActive: true,
    },
  });

  console.log('✅ Datasets created with versions, protection rules, and grants');

  // ── Sample access request ──────────────────────────────────────

  await prisma.accessRequest.upsert({
    where: { userId_datasetId: { userId: registeredUser.id, datasetId: dataset2.id } },
    update: {},
    create: {
      userId: registeredUser.id,
      datasetId: dataset2.id,
      message: 'I am a researcher studying healthcare workforce distribution in India. This data would be valuable for my academic work.',
      status: 'PENDING',
    },
  });

  console.log('✅ Sample access request created');
  console.log('\n📋 Demo Credentials:');
  console.log('   Admin:  admin@datagov.io / Admin123!  (role: ADMIN)');
  console.log('   Owner:  owner@datagov.io / Owner123!  (role: OWNER)');
  console.log('   User:   user@datagov.io  / User1234!  (role: REGISTERED)');
  console.log('\n🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
