import { PrismaClient, type Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { ALL_PERMISSIONS, ROLE_PERMISSIONS, SYSTEM_ROLES, type SystemRole } from '@cliniqx/shared';
import {
  ADVICE_TEMPLATES, CITIES, CLINIC_NAMES, COMPLAINTS, DESIGNATIONS, DIAGNOSES,
  EXPENSE_CATEGORIES, FEMALE_FIRST, LAB_TESTS, MALE_FIRST, MEDICINES,
  QUALIFICATIONS, SPECIALTIES, SURNAMES,
} from './data';

const prisma = new PrismaClient();

/** Deterministic PRNG so repeated seeds produce the same demo data. */
let seedState = 20260928;
function rnd(): number {
  seedState = (seedState * 1103515245 + 12345) & 0x7fffffff;
  return seedState / 0x7fffffff;
}
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)]!;
const int = (min: number, max: number) => min + Math.floor(rnd() * (max - min + 1));
const chance = (p: number) => rnd() < p;

let mobileCounter = 9000000000;
const nextMobile = () => String(++mobileCounter);

const pad = (n: number, w = 6) => String(n).padStart(w, '0');
const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);

const DEMO_PASSWORD = 'CliniqX@2026';

async function main(): Promise<void> {
  console.log('Seeding CliniqX demo data…');
  const passwordHash = await argon2.hash(DEMO_PASSWORD, {
    type: argon2.argon2id, memoryCost: 19_456, timeCost: 2, parallelism: 1,
  });

  await reset();
  await seedPermissionsAndRoles();

  const org = await seedOrganization();
  const specialties = await seedSpecialties();
  const clinics = await seedClinics(org.id);
  await seedCatalogues(clinics.map((c) => c.id));

  const doctors = await seedDoctors(org.id, clinics, specialties, passwordHash);
  const staff = await seedStaff(org.id, clinics, passwordHash);
  const patients = await seedPatients(org.id, passwordHash);
  await seedAdmins(org.id, clinics, passwordHash);
  await seedMrs(org.id, passwordHash);
  const { pharmacies, labs } = await seedPartners(org.id, passwordHash);

  await seedOperations(doctors, patients, clinics);
  await seedHr(staff, clinics);
  await seedLabAndPharmacyOrders(patients, doctors, labs, pharmacies);

  await summarise();
  console.log(`\nDemo password for every seeded account: ${DEMO_PASSWORD}`);
}

/** Wipes demo data in dependency order. Never run against production. */
async function reset(): Promise<void> {
  const tables = [
    'message_read_receipts','message_attachments','messages','conversation_participants','conversations',
    'notification_deliveries','notifications','notification_preferences',
    'followup_activities','followups','call_logs','communication_logs',
    'payment_transactions','refunds','payments','invoice_items','invoices',
    'pharmacy_deliveries','pharmacy_order_items','pharmacy_orders','pharmacy_inventory','pharmacy_locations','pharmacies',
    'lab_reports','lab_results','lab_sample_collections','lab_order_items','lab_orders',
    'lab_test_prices','lab_tests','lab_locations','labs',
    'document_access_logs','medical_documents',
    'diet_plan_approvals','diet_plan_versions','diet_plan_items','diet_plan_meals','diet_plan_days','diet_plans',
    'consultation_advice','quick_advice_templates',
    'prescription_items','prescriptions','medicines',
    'diagnoses','vitals','medical_record_versions','consultations',
    'queue_events','queue_entries','queues',
    'appointment_status_history','appointments',
    'payslips','payroll_items','payroll','salary_advances','salary_revisions','salary_structures',
    'overtime','holidays','leave_requests','attendance_events','attendance',
    'staff_documents','staff_facility_access','staff',
    'reviews','blogs','ai_messages','ai_conversations',
    'mr_visits','doctor_onboarding','mr_users',
    'doctor_patients','patients',
    'doctor_time_off','doctor_location_schedules','doctor_practice_locations','doctor_specialties','doctors','specialties',
    'expenses','expense_categories',
    'consents','security_events','audit_logs','device_tokens','otp_challenges','user_sessions',
    'user_roles','role_permissions','roles','permissions','users',
    'location_special_schedules','location_holidays','locations','clinics',
    'feature_flags','settings','counters','organizations',
  ];
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE`);
}

async function seedPermissionsAndRoles(): Promise<void> {
  await prisma.permission.createMany({
    data: ALL_PERMISSIONS.map((key) => {
      const [resource, ...rest] = key.split('.');
      return { key, resource: resource!, action: rest.join('.') };
    }),
  });
  const permissions = await prisma.permission.findMany({ select: { id: true, key: true } });
  const byKey = new Map(permissions.map((p) => [p.key, p.id]));

  for (const roleKey of Object.values(SYSTEM_ROLES)) {
    const role = await prisma.role.create({
      data: {
        organizationId: null,
        key: roleKey,
        name: roleKey.split('_').map((w) => w[0] + w.slice(1).toLowerCase()).join(' '),
        isSystem: true,
      },
    });
    const grants = ROLE_PERMISSIONS[roleKey as SystemRole];
    await prisma.rolePermission.createMany({
      data: grants.map((key) => ({ roleId: role.id, permissionId: byKey.get(key)! })),
    });
  }
}

async function seedOrganization() {
  return prisma.organization.create({
    data: {
      code: 'CLX-ORG-000001',
      name: 'Intigus Health Network',
      legalName: 'Intigus Pharmaceutical Private Limited',
      email: 'care@intigus.in',
      phone: '02240001000',
      addressLine1: 'Unit 402, Lotus Corporate Park',
      city: 'Mumbai', district: 'Mumbai Suburban', state: 'Maharashtra', pincode: '400063',
      status: 'ACTIVE',
    },
  });
}

async function seedSpecialties() {
  await prisma.specialty.createMany({ data: SPECIALTIES });
  return prisma.specialty.findMany();
}

async function seedClinics(organizationId: string) {
  const clinics: { id: string; name: string; locationIds: string[] }[] = [];
  for (let i = 0; i < CLINIC_NAMES.length; i += 1) {
    const place = CITIES[i % CITIES.length]!;
    const clinic = await prisma.clinic.create({
      data: {
        organizationId,
        code: `CLX-CL-${pad(i + 1)}`,
        name: CLINIC_NAMES[i]!,
        registrationNo: `MH/CLIN/${2019 + (i % 6)}/${1200 + i}`,
        email: `${CLINIC_NAMES[i]!.split(' ')[0]!.toLowerCase()}@intigus.in`,
        phone: `0${22 + i}4000${1000 + i}`,
        status: 'ACTIVE',
      },
    });
    // Two thirds of clinics run a single location; the rest run two.
    const locationCount = i % 3 === 0 ? 2 : 1;
    const locationIds: string[] = [];
    for (let l = 0; l < locationCount; l += 1) {
      const lp = l === 0 ? place : CITIES[(i + l + 3) % CITIES.length]!;
      const loc = await prisma.location.create({
        data: {
          clinicId: clinic.id,
          code: `CLX-LOC-${pad(clinics.length * 2 + l + 1)}`,
          name: l === 0 ? `${clinic.name} — ${lp.city}` : `${clinic.name} — ${lp.city} Branch`,
          addressLine1: `${100 + i * 3 + l}, ${['MG Road','Link Road','Station Road','Park Street','Ring Road'][(i + l) % 5]}`,
          city: lp.city, district: lp.district, state: lp.state, pincode: lp.pincode,
          latitude: lp.lat as unknown as Prisma.Decimal, longitude: lp.lng as unknown as Prisma.Decimal,
          phone: `0${22 + i}4000${2000 + l}`,
          attendanceQrSecret: `qr_${clinic.id.slice(0, 8)}_${l}`,
          status: 'ACTIVE',
        },
      });
      locationIds.push(loc.id);
    }
    clinics.push({ id: clinic.id, name: clinic.name, locationIds });
  }
  return clinics;
}

async function seedCatalogues(clinicIds: string[]): Promise<void> {
  await prisma.medicine.createMany({
    data: MEDICINES.map((m) => ({
      name: m.name, genericName: m.generic, strength: m.strength || null, form: m.form,
    })),
  });
  await prisma.quickAdviceTemplate.createMany({
    data: ADVICE_TEMPLATES.map((a) => ({
      clinicId: null, category: a.category, title: a.title, bodyEn: a.en, bodyHi: a.hi, isSystem: true,
    })),
  });
  for (const clinicId of clinicIds) {
    await prisma.expenseCategory.createMany({
      data: EXPENSE_CATEGORIES.map((c) => ({ clinicId, key: c.key, name: c.name, isSystem: true })),
    });
  }
}

function personName(gender: 'MALE' | 'FEMALE'): string {
  const first = gender === 'MALE' ? pick(MALE_FIRST) : pick(FEMALE_FIRST);
  return `${first} ${pick(SURNAMES)}`;
}

async function attachRole(userId: string, roleKey: SystemRole, clinicId: string | null): Promise<void> {
  const role = await prisma.role.findFirstOrThrow({ where: { key: roleKey, organizationId: null } });
  await prisma.userRole.create({ data: { userId, roleId: role.id, clinicId } });
}

interface SeededDoctor {
  id: string; userId: string; practiceLocationIds: { id: string; locationId: string; clinicId: string }[];
}

async function seedDoctors(
  organizationId: string,
  clinics: { id: string; locationIds: string[] }[],
  specialties: { id: string; key: string }[],
  passwordHash: string,
): Promise<SeededDoctor[]> {
  const doctors: SeededDoctor[] = [];
  for (let i = 0; i < 20; i += 1) {
    const gender = chance(0.6) ? 'MALE' : 'FEMALE';
    const name = personName(gender);
    const user = await prisma.user.create({
      data: {
        organizationId,
        email: `doctor${i + 1}@cliniqx.demo`,
        mobile: nextMobile(),
        passwordHash,
        fullName: `Dr. ${name}`,
        principalType: 'CLINIC',
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
        mobileVerifiedAt: new Date(),
      },
    });
    const specialty = specialties[i % specialties.length]!;
    const doctor = await prisma.doctor.create({
      data: {
        userId: user.id,
        code: `CLX-DR-${pad(i + 1)}`,
        registrationNo: `MMC/${2008 + (i % 14)}/${45000 + i * 37}`,
        registrationCouncil: 'Maharashtra Medical Council',
        qualification: QUALIFICATIONS[i % QUALIFICATIONS.length]!,
        experienceYears: int(4, 28),
        bio: `Practising ${SPECIALTIES[i % SPECIALTIES.length]!.name.toLowerCase()} with a focus on preventive care and long-term follow-up.`,
        languages: ['English', 'Hindi', pick(['Marathi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Gujarati'])],
        status: 'ACTIVE',
        isOnline: chance(0.4),
      },
    });
    await prisma.doctorSpecialty.create({
      data: { doctorId: doctor.id, specialtyId: specialty.id, isPrimary: true },
    });

    // Every fourth doctor practises at two clinics, exercising multi-location logic.
    const clinicCount = i % 4 === 0 ? 2 : 1;
    const practiceLocationIds: SeededDoctor['practiceLocationIds'] = [];
    for (let c = 0; c < clinicCount; c += 1) {
      const clinic = clinics[(i + c * 5) % clinics.length]!;
      const locationId = clinic.locationIds[0]!;
      if (practiceLocationIds.some((p) => p.locationId === locationId)) continue;

      const pl = await prisma.doctorPracticeLocation.create({
        data: {
          doctorId: doctor.id,
          locationId,
          consultationFee: (400 + (i % 6) * 100) as unknown as Prisma.Decimal,
          followUpFee: (200 + (i % 4) * 50) as unknown as Prisma.Decimal,
          slotDurationMin: [10, 15, 20, 30][i % 4]!,
          opdCapacityPerDay: int(20, 45),
          startDate: addDays(new Date(), -int(200, 900)),
          status: 'ACTIVE',
        },
      });
      practiceLocationIds.push({ id: pl.id, locationId, clinicId: clinic.id });

      // Morning session every weekday; the second clinic runs evenings so the
      // same doctor never has two overlapping physical sessions.
      for (let day = 1; day <= 6; day += 1) {
        await prisma.doctorLocationSchedule.create({
          data: {
            practiceLocationId: pl.id,
            dayOfWeek: day,
            startTime: c === 0 ? '09:30' : '17:30',
            endTime: c === 0 ? '13:30' : '20:30',
            breakStart: c === 0 ? '11:30' : null,
            breakEnd: c === 0 ? '11:45' : null,
            maxAppointments: int(15, 30),
          },
        });
      }
      await attachRole(user.id, SYSTEM_ROLES.DOCTOR, clinic.id);
    }
    doctors.push({ id: doctor.id, userId: user.id, practiceLocationIds });
  }
  return doctors;
}

interface SeededStaff { id: string; userId: string; clinicId: string; locationId: string }

async function seedStaff(
  organizationId: string,
  clinics: { id: string; locationIds: string[] }[],
  passwordHash: string,
): Promise<SeededStaff[]> {
  const out: SeededStaff[] = [];
  const roleForDesignation: Record<string, SystemRole> = {
    Receptionist: SYSTEM_ROLES.RECEPTIONIST,
    'Staff Nurse': SYSTEM_ROLES.NURSE,
    'Clinic Manager': SYSTEM_ROLES.MANAGER,
    Accountant: SYSTEM_ROLES.ACCOUNTANT,
  };

  for (let i = 0; i < 30; i += 1) {
    const clinic = clinics[i % clinics.length]!;
    const locationId = clinic.locationIds[0]!;
    const designation = DESIGNATIONS[i % DESIGNATIONS.length]!;
    const gender = chance(0.5) ? 'MALE' : 'FEMALE';
    const user = await prisma.user.create({
      data: {
        organizationId,
        email: `staff${i + 1}@cliniqx.demo`,
        mobile: nextMobile(),
        passwordHash,
        fullName: personName(gender),
        principalType: 'CLINIC',
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
    });
    const staff = await prisma.staff.create({
      data: {
        userId: user.id,
        code: `CLX-ST-${pad(i + 1)}`,
        designation,
        department: designation.includes('Nurse') ? 'Clinical' : 'Operations',
        dateOfBirth: addDays(new Date(), -int(8000, 16000)),
        joiningDate: addDays(new Date(), -int(90, 1400)),
        addressLine1: `${10 + i}, ${['Shanti Nagar','Green Park','Model Colony','Vivek Vihar'][i % 4]}`,
        city: 'Mumbai', state: 'Maharashtra', pincode: '400053',
        emergencyContactName: personName(gender === 'MALE' ? 'FEMALE' : 'MALE'),
        emergencyContactPhone: nextMobile(),
        salaryType: 'MONTHLY',
        status: 'ACTIVE',
      },
    });
    await prisma.staffFacilityAccess.create({
      data: { staffId: staff.id, clinicId: clinic.id, locationId, isPrimary: true },
    });
    await prisma.salaryStructure.create({
      data: {
        staffId: staff.id,
        effectiveFrom: dayStart(addDays(new Date(), -365)),
        base: (18000 + (i % 8) * 2500) as unknown as Prisma.Decimal,
        hra: (6000 + (i % 5) * 800) as unknown as Prisma.Decimal,
        allowances: 2500 as unknown as Prisma.Decimal,
        deductions: 1800 as unknown as Prisma.Decimal,
      },
    });
    await attachRole(user.id, roleForDesignation[designation] ?? SYSTEM_ROLES.STAFF, clinic.id);
    out.push({ id: staff.id, userId: user.id, clinicId: clinic.id, locationId });
  }
  return out;
}

interface SeededPatient { id: string; userId: string; name: string }

async function seedPatients(organizationId: string, passwordHash: string): Promise<SeededPatient[]> {
  const out: SeededPatient[] = [];
  for (let i = 0; i < 100; i += 1) {
    const gender = chance(0.5) ? 'MALE' : 'FEMALE';
    const name = personName(gender);
    const mobile = nextMobile();
    const place = CITIES[i % CITIES.length]!;
    const user = await prisma.user.create({
      data: {
        organizationId,
        mobile,
        // Patients sign in with a one-time code; a password exists only for demo convenience.
        passwordHash,
        fullName: name,
        principalType: 'PATIENT',
        status: 'ACTIVE',
        mobileVerifiedAt: new Date(),
      },
    });
    const patient = await prisma.patient.create({
      data: {
        userId: user.id,
        organizationId,
        code: `CLX-PT-${pad(i + 1)}`,
        fullName: name,
        mobile,
        dateOfBirth: addDays(new Date(), -int(2500, 27000)),
        gender,
        bloodGroup: pick(['A_POS','B_POS','O_POS','AB_POS','A_NEG','O_NEG','UNKNOWN'] as const),
        addressLine1: `${20 + i}, ${['Sai Residency','Ganga Apartments','Rose Villa','Pearl Heights'][i % 4]}`,
        city: place.city, district: place.district, state: place.state, pincode: place.pincode,
        allergies: chance(0.25) ? [pick(['Penicillin', 'Sulpha drugs', 'Dust', 'Peanuts', 'Aspirin'])] : [],
        chronicConditions: chance(0.3) ? [pick(['Type 2 Diabetes', 'Hypertension', 'Asthma', 'Hypothyroidism'])] : [],
        emergencyContactName: personName(gender === 'MALE' ? 'FEMALE' : 'MALE'),
        emergencyContactPhone: nextMobile(),
        emergencyContactRelation: pick(['Spouse', 'Parent', 'Sibling', 'Child']),
      },
    });
    await attachRole(user.id, SYSTEM_ROLES.PATIENT, null);
    out.push({ id: patient.id, userId: user.id, name });
  }
  return out;
}

async function seedAdmins(
  organizationId: string,
  clinics: { id: string }[],
  passwordHash: string,
): Promise<void> {
  const superAdmin = await prisma.user.create({
    data: {
      organizationId: null,
      email: 'superadmin@cliniqx.demo',
      mobile: nextMobile(),
      passwordHash,
      fullName: 'Platform Administrator',
      principalType: 'PLATFORM',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
  });
  await attachRole(superAdmin.id, SYSTEM_ROLES.SUPER_ADMIN, null);

  const orgAdmin = await prisma.user.create({
    data: {
      organizationId,
      email: 'orgadmin@cliniqx.demo',
      mobile: nextMobile(),
      passwordHash,
      fullName: personName('FEMALE'),
      principalType: 'ORG',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
  });
  await attachRole(orgAdmin.id, SYSTEM_ROLES.ORG_ADMIN, null);

  for (let i = 0; i < clinics.length; i += 1) {
    const user = await prisma.user.create({
      data: {
        organizationId,
        email: `clinicadmin${i + 1}@cliniqx.demo`,
        mobile: nextMobile(),
        passwordHash,
        fullName: personName(chance(0.5) ? 'MALE' : 'FEMALE'),
        principalType: 'CLINIC',
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
    });
    await attachRole(user.id, SYSTEM_ROLES.CLINIC_ADMIN, clinics[i]!.id);
  }
}

async function seedMrs(organizationId: string, passwordHash: string): Promise<void> {
  for (let i = 0; i < 10; i += 1) {
    const place = CITIES[i % CITIES.length]!;
    const user = await prisma.user.create({
      data: {
        organizationId,
        email: `mr${i + 1}@cliniqx.demo`,
        mobile: nextMobile(),
        passwordHash,
        fullName: personName(chance(0.7) ? 'MALE' : 'FEMALE'),
        principalType: 'MR',
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
    });
    const mr = await prisma.mrUser.create({
      data: {
        userId: user.id,
        code: `CLX-MR-${pad(i + 1)}`,
        territory: `${place.city} ${['North','South','East','West'][i % 4]}`,
        city: place.city, state: place.state,
        monthlyTargetDoctors: int(6, 15),
        status: 'ACTIVE',
      },
    });
    await attachRole(user.id, SYSTEM_ROLES.MR, null);

    const stages = ['LEAD','CONTACTED','INTERESTED','DEMO','DOCUMENTS_PENDING','VERIFICATION','APPROVED','ACTIVATED'] as const;
    for (let l = 0; l < int(4, 9); l += 1) {
      const onboarding = await prisma.doctorOnboarding.create({
        data: {
          mrUserId: mr.id,
          leadName: `Dr. ${personName(chance(0.6) ? 'MALE' : 'FEMALE')}`,
          leadMobile: nextMobile(),
          clinicName: pick(CLINIC_NAMES),
          city: place.city,
          specialtyHint: pick(SPECIALTIES).name,
          stage: pick(stages),
          nextActionAt: addDays(new Date(), int(1, 21)),
        },
      });
      if (chance(0.6)) {
        await prisma.mrVisit.create({
          data: {
            mrUserId: mr.id,
            onboardingId: onboarding.id,
            type: pick(['INTRO','DEMO','FOLLOW_UP','DOCUMENT_PICKUP'] as const),
            visitedAt: addDays(new Date(), -int(1, 45)),
            outcome: pick(['Interested, asked for pricing', 'Requested a second demo', 'Shared registration documents', 'Will decide next month']),
          },
        });
      }
    }
  }
}

async function seedPartners(organizationId: string, passwordHash: string) {
  const pharmacies: { id: string; locationId: string }[] = [];
  const labs: { id: string; locationId: string; testIds: string[] }[] = [];

  const pharmacyNames = ['Apollo Medicals','Wellness Chemist','Shree Medical Store','Care & Cure Pharmacy','Jan Aushadhi Kendra','LifeLine Chemist','Sanjivani Medicals','Health First Pharmacy','Om Sai Medical','MedPlus Corner'];
  for (let i = 0; i < 10; i += 1) {
    const place = CITIES[i % CITIES.length]!;
    const user = await prisma.user.create({
      data: {
        organizationId, email: `pharmacy${i + 1}@cliniqx.demo`, mobile: nextMobile(), passwordHash,
        fullName: `${pharmacyNames[i]!} Desk`, principalType: 'PHARMACY', status: 'ACTIVE', emailVerifiedAt: new Date(),
      },
    });
    await attachRole(user.id, SYSTEM_ROLES.PHARMACY_PARTNER, null);
    const pharmacy = await prisma.pharmacy.create({
      data: {
        organizationId, code: `CLX-PH-${pad(i + 1)}`, name: pharmacyNames[i]!,
        licenseNo: `${place.state.slice(0, 2).toUpperCase()}-DL-${20000 + i * 13}`,
        email: `pharmacy${i + 1}@cliniqx.demo`, phone: nextMobile(), status: 'ACTIVE',
      },
    });
    const loc = await prisma.pharmacyLocation.create({
      data: {
        pharmacyId: pharmacy.id, name: `${pharmacyNames[i]!} — ${place.city}`,
        addressLine1: `Shop ${5 + i}, ${['Market Road','Main Bazaar','Hill Road'][i % 3]}`,
        city: place.city, district: place.district, state: place.state, pincode: place.pincode,
        latitude: place.lat as unknown as Prisma.Decimal, longitude: place.lng as unknown as Prisma.Decimal,
        phone: nextMobile(), delivers: chance(0.7), servicePincodes: [place.pincode], status: 'ACTIVE',
      },
    });
    await prisma.pharmacyInventory.createMany({
      data: MEDICINES.map((m) => {
        const mrp = int(30, 320);
        return {
          pharmacyLocationId: loc.id, medicineName: m.name, genericName: m.generic,
          brand: m.name.split(' ')[0]!, strength: m.strength || null, packSize: m.form === 'Syrup' ? '100 ml' : '10 tablets',
          mrp: mrp as unknown as Prisma.Decimal,
          sellingPrice: Math.round(mrp * 0.92) as unknown as Prisma.Decimal,
          stockQty: int(0, 400), batchNo: `B${int(10000, 99999)}`,
          expiryDate: addDays(new Date(), int(120, 900)), isAvailable: chance(0.9),
        };
      }),
    });
    await prisma.user.update({ where: { id: user.id }, data: { pharmacyId: pharmacy.id } });
    pharmacies.push({ id: pharmacy.id, locationId: loc.id });
  }

  const labNames = ['Dr Lal PathLabs Collection','Metropolis Diagnostics','Thyrocare Centre','SRL Diagnostics','Suburban Diagnostics','Redcliffe Labs','Neuberg Diagnostics','Krsnaa Diagnostics'];
  for (let i = 0; i < 8; i += 1) {
    const place = CITIES[i % CITIES.length]!;
    const user = await prisma.user.create({
      data: {
        organizationId, email: `lab${i + 1}@cliniqx.demo`, mobile: nextMobile(), passwordHash,
        fullName: `${labNames[i]!} Desk`, principalType: 'LAB', status: 'ACTIVE', emailVerifiedAt: new Date(),
      },
    });
    await attachRole(user.id, SYSTEM_ROLES.LAB_PARTNER, null);
    const lab = await prisma.lab.create({
      data: {
        organizationId, code: `CLX-LB-${pad(i + 1)}`, name: labNames[i]!,
        registrationNo: `NABL/${2018 + (i % 7)}/${3000 + i}`,
        email: `lab${i + 1}@cliniqx.demo`, phone: nextMobile(), status: 'ACTIVE',
      },
    });
    const loc = await prisma.labLocation.create({
      data: {
        labId: lab.id, name: `${labNames[i]!} — ${place.city}`,
        addressLine1: `${40 + i}, ${['Civil Lines','Sector 12','Gandhi Road'][i % 3]}`,
        city: place.city, district: place.district, state: place.state, pincode: place.pincode,
        latitude: place.lat as unknown as Prisma.Decimal, longitude: place.lng as unknown as Prisma.Decimal,
        phone: nextMobile(), homeCollection: chance(0.75), servicePincodes: [place.pincode], status: 'ACTIVE',
      },
    });
    const testIds: string[] = [];
    for (const t of LAB_TESTS) {
      const test = await prisma.labTest.create({
        data: {
          labId: lab.id, code: t.code, name: t.name, category: t.category,
          sampleType: t.sample, turnaroundHours: t.tat,
          preparationNote: t.code === 'FBS' || t.code === 'LIPID' ? 'Fast for 10 to 12 hours. Water is allowed.' : null,
        },
      });
      await prisma.labTestPrice.create({
        data: {
          labTestId: test.id, labLocationId: loc.id,
          price: Math.round(t.price * (0.9 + (i % 4) * 0.07)) as unknown as Prisma.Decimal,
          homeCollectionFee: 150 as unknown as Prisma.Decimal,
        },
      });
      testIds.push(test.id);
    }
    await prisma.user.update({ where: { id: user.id }, data: { labId: lab.id } });
    labs.push({ id: lab.id, locationId: loc.id, testIds });
  }

  return { pharmacies, labs };
}

async function seedOperations(
  doctors: SeededDoctor[],
  patients: SeededPatient[],
  _clinics: { id: string }[],
): Promise<void> {
  const medicines = await prisma.medicine.findMany();
  const today = dayStart(new Date());
  let apptSeq = 0;
  let consultSeq = 0;
  let rxSeq = 0;

  for (const doctor of doctors) {
    for (const pl of doctor.practiceLocationIds) {
      // Six weeks of history plus today and the coming week.
      for (let dayOffset = -42; dayOffset <= 7; dayOffset += 1) {
        const date = addDays(today, dayOffset);
        if (date.getDay() === 0) continue;
        if (dayOffset < 0 && !chance(0.45)) continue;
        if (dayOffset > 0 && !chance(0.5)) continue;

        const queue = await prisma.queue.create({
          data: {
            practiceLocationId: pl.id,
            date,
            status: dayOffset < 0 ? 'CLOSED' : dayOffset === 0 ? 'OPEN' : 'OPEN',
          },
        });

        const count = dayOffset === 0 ? int(6, 12) : int(3, 8);
        let token = 0;
        for (let s = 0; s < count; s += 1) {
          const patient = pick(patients);
          const start = new Date(date);
          start.setHours(9, 30 + s * 15, 0, 0);
          const end = new Date(start.getTime() + 15 * 60_000);
          token += 1;
          apptSeq += 1;

          const status = dayOffset < 0
            ? (chance(0.88) ? 'COMPLETED' : chance(0.5) ? 'NO_SHOW' : 'CANCELLED')
            : dayOffset === 0
              ? (s < 3 ? 'COMPLETED' : s === 3 ? 'IN_CONSULTATION' : s < 7 ? 'WAITING' : 'CONFIRMED')
              : 'CONFIRMED';

          const appointment = await prisma.appointment.create({
            data: {
              clinicId: pl.clinicId, locationId: pl.locationId, practiceLocationId: pl.id,
              doctorId: doctor.id, patientId: patient.id,
              code: `CLX-AP-${pad(apptSeq)}`,
              type: chance(0.25) ? 'WALK_IN' : chance(0.2) ? 'FOLLOW_UP' : chance(0.5) ? 'ONLINE' : 'OFFLINE',
              status: status as never,
              scheduledStart: start, scheduledEnd: end,
              tokenNumber: token,
              reason: pick(COMPLAINTS),
              fee: 500 as unknown as Prisma.Decimal,
              isPaid: status === 'COMPLETED',
              checkedInAt: ['CHECKED_IN','WAITING','IN_CONSULTATION','COMPLETED'].includes(status) ? start : null,
              completedAt: status === 'COMPLETED' ? end : null,
            },
          });
          await prisma.appointmentStatusHistory.create({
            data: { appointmentId: appointment.id, toStatus: status as never, reason: 'Seeded demo data' },
          });

          if (['WAITING','IN_CONSULTATION','COMPLETED'].includes(status)) {
            await prisma.queueEntry.create({
              data: {
                queueId: queue.id, patientId: patient.id, appointmentId: appointment.id,
                tokenNumber: token, position: token,
                status: status === 'COMPLETED' ? 'COMPLETED' : status === 'IN_CONSULTATION' ? 'IN_CONSULTATION' : 'WAITING',
                calledAt: status !== 'WAITING' ? start : null,
                completedAt: status === 'COMPLETED' ? end : null,
              },
            });
          }

          await prisma.doctorPatient.upsert({
            where: { doctorId_patientId: { doctorId: doctor.id, patientId: patient.id } },
            create: {
              doctorId: doctor.id, patientId: patient.id,
              firstVisitAt: start, lastVisitAt: start, visitCount: 1,
            },
            update: { lastVisitAt: start, visitCount: { increment: 1 } },
          });

          if (status !== 'COMPLETED') continue;

          consultSeq += 1;
          const diagnosis = pick(DIAGNOSES);
          const consultation = await prisma.consultation.create({
            data: {
              code: `CLX-CN-${pad(consultSeq)}`,
              clinicId: pl.clinicId, locationId: pl.locationId,
              doctorId: doctor.id, patientId: patient.id, appointmentId: appointment.id,
              status: 'COMPLETED',
              chiefComplaint: appointment.reason,
              symptoms: [pick(['Fever','Cough','Headache','Nausea','Fatigue','Joint pain','Breathlessness'])],
              examination: 'Patient conscious and oriented. Vitals stable. Systemic examination unremarkable.',
              clinicalNotes: 'Symptoms reviewed. Medication started. Red-flag symptoms explained to the patient.',
              advice: 'Adequate hydration and rest. Return earlier if symptoms worsen.',
              followUpDate: addDays(start, 7),
              startedAt: start, completedAt: end, version: 1,
            },
          });
          await prisma.diagnosis.create({
            data: { consultationId: consultation.id, code: diagnosis.code, label: diagnosis.label, isPrimary: true },
          });
          await prisma.vital.create({
            data: {
              patientId: patient.id, consultationId: consultation.id,
              heightCm: int(150, 185) as unknown as Prisma.Decimal,
              weightKg: int(48, 95) as unknown as Prisma.Decimal,
              temperatureC: (97 + rnd() * 4).toFixed(1) as unknown as Prisma.Decimal,
              pulseBpm: int(62, 104), systolicMmHg: int(105, 152), diastolicMmHg: int(66, 96),
              spo2Percent: int(94, 99), recordedAt: start,
            },
          });
          await prisma.medicalRecordVersion.create({
            data: {
              consultationId: consultation.id, version: 1,
              snapshot: { chiefComplaint: appointment.reason, diagnosis: diagnosis.label } as never,
              reason: 'Consultation completed',
            },
          });

          rxSeq += 1;
          const prescription = await prisma.prescription.create({
            data: {
              code: `CLX-RX-${pad(rxSeq)}`,
              clinicId: pl.clinicId, locationId: pl.locationId,
              doctorId: doctor.id, patientId: patient.id, consultationId: consultation.id,
              source: 'DIGITAL', status: 'ISSUED',
              diagnosisText: diagnosis.label,
              advice: 'Complete the full course of medicines even if you feel better.',
              followUpDate: addDays(start, 7),
              verificationCode: `RXV${pad(rxSeq, 8)}`,
              issuedAt: end,
            },
          });
          const itemCount = int(2, 4);
          for (let m = 0; m < itemCount; m += 1) {
            const med = pick(medicines);
            await prisma.prescriptionItem.create({
              data: {
                prescriptionId: prescription.id, medicineId: med.id,
                medicineName: med.name, genericName: med.genericName, strength: med.strength,
                dose: med.form === 'Syrup' ? '10 ml' : '1 tablet',
                frequency: pick(['1-0-1', '1-1-1', '0-0-1', '1-0-0']),
                durationDays: pick([3, 5, 7, 10, 30]),
                route: med.form === 'Syrup' ? 'ORAL' : 'ORAL',
                foodTiming: pick(['BEFORE_FOOD', 'AFTER_FOOD'] as const),
                sortOrder: m,
              },
            });
          }

          const invoice = await prisma.invoice.create({
            data: {
              number: `INV-2026-${pad(apptSeq)}`,
              clinicId: pl.clinicId, locationId: pl.locationId, patientId: patient.id,
              appointmentId: appointment.id, status: 'PAID',
              subtotal: 500 as unknown as Prisma.Decimal, total: 500 as unknown as Prisma.Decimal,
              amountPaid: 500 as unknown as Prisma.Decimal, issuedAt: end,
            },
          });
          await prisma.invoiceItem.create({
            data: {
              invoiceId: invoice.id, description: 'Consultation fee',
              unitPrice: 500 as unknown as Prisma.Decimal, amount: 500 as unknown as Prisma.Decimal,
            },
          });
          await prisma.payment.create({
            data: {
              code: `CLX-PAY-${pad(apptSeq)}`,
              clinicId: pl.clinicId, patientId: patient.id, invoiceId: invoice.id, appointmentId: appointment.id,
              method: pick(['UPI', 'CASH', 'CARD'] as const), status: 'SUCCESS',
              amount: 500 as unknown as Prisma.Decimal,
              idempotencyKey: `seed-pay-${apptSeq}`,
              capturedAt: end,
            },
          });
        }

        const waiting = await prisma.queueEntry.findFirst({
          where: { queueId: queue.id, status: 'IN_CONSULTATION' },
          select: { tokenNumber: true },
        });
        await prisma.queue.update({
          where: { id: queue.id },
          data: { lastIssuedToken: token, currentToken: waiting?.tokenNumber ?? null },
        });
      }
    }
  }
}

async function seedHr(staff: SeededStaff[], _clinics: { id: string }[]): Promise<void> {
  const today = dayStart(new Date());
  for (const s of staff) {
    for (let d = 30; d >= 0; d -= 1) {
      const date = addDays(today, -d);
      if (date.getDay() === 0) continue;
      const roll = rnd();
      const status = roll < 0.84 ? 'PRESENT' : roll < 0.9 ? 'LATE' : roll < 0.95 ? 'LEAVE' : 'ABSENT';
      const checkIn = new Date(date); checkIn.setHours(status === 'LATE' ? 9 : 8, status === 'LATE' ? 42 : 55, 0, 0);
      const checkOut = new Date(date); checkOut.setHours(18, int(0, 40), 0, 0);
      const present = status === 'PRESENT' || status === 'LATE';

      const attendance = await prisma.attendance.create({
        data: {
          staffId: s.id, clinicId: s.clinicId, locationId: s.locationId, date,
          checkInAt: present ? checkIn : null,
          checkOutAt: present ? checkOut : null,
          workedMinutes: present ? Math.round((checkOut.getTime() - checkIn.getTime()) / 60000) : null,
          status: status as never, method: 'QR',
        },
      });
      if (present) {
        await prisma.attendanceEvent.createMany({
          data: [
            { attendanceId: attendance.id, type: 'CHECK_IN', occurredAt: checkIn, method: 'QR', distanceM: int(5, 90) },
            { attendanceId: attendance.id, type: 'CHECK_OUT', occurredAt: checkOut, method: 'QR', distanceM: int(5, 90) },
          ],
        });
      }
    }
    if (chance(0.35)) {
      await prisma.leaveRequest.create({
        data: {
          staffId: s.id, type: pick(['CASUAL', 'SICK', 'EARNED'] as const),
          startDate: addDays(today, int(3, 25)), endDate: addDays(today, int(26, 28)),
          days: 2 as unknown as Prisma.Decimal,
          reason: pick(['Family function at hometown', 'Medical consultation', 'Personal work', 'Child’s school event']),
          status: pick(['PENDING', 'APPROVED', 'REJECTED'] as const),
        },
      });
    }
  }

  // One finalised payroll cycle for the previous month.
  const byClinic = new Map<string, SeededStaff[]>();
  for (const s of staff) byClinic.set(s.clinicId, [...(byClinic.get(s.clinicId) ?? []), s]);
  const prev = new Date(today.getFullYear(), today.getMonth() - 1, 1);

  let payslipSeq = 0;
  for (const [clinicId, members] of byClinic) {
    const payroll = await prisma.payroll.create({
      data: {
        clinicId, periodYear: prev.getFullYear(), periodMonth: prev.getMonth() + 1,
        status: 'PAID', calculatedAt: prev, approvedAt: prev, processedAt: prev, paidAt: prev,
      },
    });
    let gross = 0; let net = 0;
    for (const m of members) {
      const structure = await prisma.salaryStructure.findFirstOrThrow({ where: { staffId: m.id } });
      const base = Number(structure.base);
      const allowances = Number(structure.hra) + Number(structure.allowances);
      const deductions = Number(structure.deductions);
      const itemGross = base + allowances;
      const itemNet = itemGross - deductions;
      gross += itemGross; net += itemNet;

      await prisma.payrollItem.create({
        data: {
          payrollId: payroll.id, staffId: m.id,
          base: base as unknown as Prisma.Decimal,
          allowances: allowances as unknown as Prisma.Decimal,
          deductions: deductions as unknown as Prisma.Decimal,
          gross: itemGross as unknown as Prisma.Decimal,
          net: itemNet as unknown as Prisma.Decimal,
          presentDays: 24 as unknown as Prisma.Decimal,
        },
      });
      payslipSeq += 1;
      await prisma.payslip.create({
        data: {
          payrollId: payroll.id, staffId: m.id,
          number: `PS-${prev.getFullYear()}${String(prev.getMonth() + 1).padStart(2, '0')}-${pad(payslipSeq, 4)}`,
          snapshot: { base, allowances, deductions, gross: itemGross, net: itemNet } as never,
        },
      });
    }
    await prisma.payroll.update({
      where: { id: payroll.id },
      data: { grossTotal: gross as unknown as Prisma.Decimal, netTotal: net as unknown as Prisma.Decimal },
    });

    const categories = await prisma.expenseCategory.findMany({ where: { clinicId } });
    for (const category of categories) {
      await prisma.expense.create({
        data: {
          clinicId, categoryId: category.id,
          date: addDays(today, -int(1, 28)),
          amount: int(1500, 65000) as unknown as Prisma.Decimal,
          vendor: pick(['Shree Traders', 'MSEB', 'Sai Enterprises', 'Medline Supplies', 'CoolAir Services']),
          description: `${category.name} for the current cycle`,
          status: pick(['APPROVED', 'PAID', 'SUBMITTED'] as const),
        },
      });
    }
  }
}

async function seedLabAndPharmacyOrders(
  patients: SeededPatient[],
  doctors: SeededDoctor[],
  labs: { id: string; locationId: string; testIds: string[] }[],
  pharmacies: { id: string; locationId: string }[],
): Promise<void> {
  const consultations = await prisma.consultation.findMany({
    take: 120,
    orderBy: { startedAt: 'desc' },
    select: { id: true, patientId: true, doctorId: true, clinicId: true, locationId: true, startedAt: true },
  });

  let labSeq = 0;
  for (const c of consultations) {
    if (!chance(0.35)) continue;
    labSeq += 1;
    const lab = pick(labs);
    const status = pick(['ORDERED','ACCEPTED','SAMPLE_COLLECTED','PROCESSING','REPORT_READY','DELIVERED'] as const);
    const order = await prisma.labOrder.create({
      data: {
        code: `CLX-LB-${pad(labSeq)}`,
        clinicId: c.clinicId, locationId: c.locationId, doctorId: c.doctorId,
        patientId: c.patientId, consultationId: c.id,
        labId: lab.id, labLocationId: lab.locationId,
        status, instructions: 'Fasting sample preferred. Report to be shared with the treating doctor.',
        homeCollection: chance(0.4),
        orderedAt: c.startedAt,
      },
    });
    const tests = LAB_TESTS.slice(0, int(1, 3));
    await prisma.labOrderItem.createMany({
      data: tests.map((t, i) => ({
        labOrderId: order.id, labTestId: lab.testIds[i] ?? null,
        testName: t.name, price: t.price as unknown as Prisma.Decimal,
      })),
    });
    if (['REPORT_READY', 'DELIVERED'].includes(status)) {
      await prisma.labResult.createMany({
        data: [
          { labOrderId: order.id, testName: tests[0]!.name, parameter: 'Haemoglobin', value: String(int(10, 16)), unit: 'g/dL', referenceRange: '13.0 - 17.0', flag: chance(0.7) ? 'NORMAL' : 'LOW' },
          { labOrderId: order.id, testName: tests[0]!.name, parameter: 'Total Leucocyte Count', value: String(int(4000, 12000)), unit: '/µL', referenceRange: '4000 - 11000', flag: chance(0.8) ? 'NORMAL' : 'HIGH' },
        ],
      });
      await prisma.labReport.create({
        data: {
          labOrderId: order.id, version: 1,
          storageKey: `labs/${order.id}/report-v1.pdf`,
          mimeType: 'application/pdf', sizeBytes: int(80_000, 400_000),
          summary: 'No critical abnormality detected. Correlate clinically.',
        },
      });
    }
  }

  const prescriptions = await prisma.prescription.findMany({
    take: 60, orderBy: { createdAt: 'desc' },
    select: { id: true, patientId: true, items: { select: { medicineName: true } } },
  });
  let phSeq = 0;
  for (const rx of prescriptions) {
    if (!chance(0.4)) continue;
    phSeq += 1;
    const pharmacy = pick(pharmacies);
    const status = pick(['SENT','ACCEPTED','QUOTED','PREPARING','READY','COMPLETED'] as const);
    const order = await prisma.pharmacyOrder.create({
      data: {
        code: `CLX-PH-${pad(phSeq)}`,
        patientId: rx.patientId, prescriptionId: rx.id,
        pharmacyId: pharmacy.id, pharmacyLocationId: pharmacy.locationId,
        status, fulfilmentMode: chance(0.5) ? 'DELIVERY' : 'PICKUP',
      },
    });
    await prisma.pharmacyOrderItem.createMany({
      data: rx.items.map((item) => ({
        pharmacyOrderId: order.id, medicineName: item.medicineName,
        requestedQty: int(5, 30), availableQty: int(0, 30),
        unitPrice: int(25, 280) as unknown as Prisma.Decimal,
        isAvailable: chance(0.85),
      })),
    });
  }
}

async function summarise(): Promise<void> {
  const counts = {
    organizations: await prisma.organization.count(),
    clinics: await prisma.clinic.count(),
    locations: await prisma.location.count(),
    users: await prisma.user.count(),
    doctors: await prisma.doctor.count(),
    staff: await prisma.staff.count(),
    patients: await prisma.patient.count(),
    appointments: await prisma.appointment.count(),
    consultations: await prisma.consultation.count(),
    prescriptions: await prisma.prescription.count(),
    labOrders: await prisma.labOrder.count(),
    pharmacyOrders: await prisma.pharmacyOrder.count(),
    invoices: await prisma.invoice.count(),
    payments: await prisma.payment.count(),
    attendance: await prisma.attendance.count(),
    payslips: await prisma.payslip.count(),
  };
  console.table(counts);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
