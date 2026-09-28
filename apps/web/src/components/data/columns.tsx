import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { StatusPill, humanise, toneForStatus } from '@/components/ui/status-pill';
import { ageFrom, formatCurrency, formatDate, formatTime } from '@/lib/utils';

export interface Column {
  key: string;
  header: string;
  /** Rendered cell. Receives the whole row so it can combine fields. */
  cell: (row: Row) => React.ReactNode;
  className?: string;
  /** Columns marked primary form the headline of the mobile card. */
  primary?: boolean;
  hideOnMobile?: boolean;
}

export type Row = Record<string, any>;

const dash = <span className="text-navy-300">—</span>;

function person(name: string, subtitle?: string | null, href?: string) {
  const body = (
    <span className="flex items-center gap-2.5">
      <Avatar name={name} size="sm" />
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-semibold text-ink">{name}</span>
        {subtitle ? <span className="block truncate text-[11px] text-muted">{subtitle}</span> : null}
      </span>
    </span>
  );
  return href ? <Link href={href} className="hover:underline">{body}</Link> : body;
}

function money(value: unknown) {
  const n = Number(value ?? 0);
  return <span className="tnum font-semibold text-ink">{formatCurrency(n)}</span>;
}

function code(value: unknown) {
  return <span className="tnum text-[12px] font-medium text-muted">{String(value ?? '—')}</span>;
}

function status(value: unknown) {
  const v = String(value ?? '');
  return <StatusPill tone={toneForStatus(v)}>{humanise(v)}</StatusPill>;
}

function datetime(value: unknown) {
  if (!value) return dash;
  return (
    <span className="tnum whitespace-nowrap text-[12.5px] text-ink-2">
      {formatDate(value as string)}
      <span className="ml-1.5 text-muted">{formatTime(value as string)}</span>
    </span>
  );
}

function dateOnly(value: unknown) {
  if (!value) return dash;
  return <span className="tnum whitespace-nowrap text-[12.5px] text-ink-2">{formatDate(value as string)}</span>;
}

function text(value: unknown, className = 'text-[13px] text-ink-2') {
  if (value === null || value === undefined || value === '') return dash;
  return <span className={`block truncate ${className}`}>{String(value)}</span>;
}

/** Column sets keyed by the API resource name. */
export const COLUMNS: Record<string, Column[]> = {
  patients: [
    { key: 'code', header: 'Patient ID', cell: (r) => code(r.code), hideOnMobile: true },
    {
      key: 'fullName', header: 'Patient', primary: true,
      cell: (r) => person(r.fullName, `${ageFrom(r.dateOfBirth, r.approxAgeYears)} · ${humanise(r.gender)}`, `/portal/patients/${r.id}`),
    },
    { key: 'mobile', header: 'Mobile', cell: (r) => <span className="tnum text-[13px] text-ink-2">{r.mobile}</span> },
    { key: 'city', header: 'City', cell: (r) => text(r.city), hideOnMobile: true },
    {
      key: 'allergies', header: 'Allergies', hideOnMobile: true,
      cell: (r) => (r.allergies?.length
        ? <StatusPill tone="danger">{r.allergies.join(', ')}</StatusPill>
        : <span className="text-[12px] text-muted">None recorded</span>),
    },
    { key: 'createdAt', header: 'Registered', cell: (r) => dateOnly(r.createdAt), hideOnMobile: true },
  ],

  doctors: [
    { key: 'code', header: 'Doctor ID', cell: (r) => code(r.code), hideOnMobile: true },
    {
      key: 'name', header: 'Doctor', primary: true,
      cell: (r) => person(r.user.fullName, r.qualification, `/admin/doctors/${r.id}`),
    },
    {
      key: 'specialty', header: 'Specialty',
      cell: (r) => text(r.specialties?.find((s: Row) => s.isPrimary)?.specialty.name ?? r.specialties?.[0]?.specialty.name),
    },
    {
      key: 'locations', header: 'Practices at', hideOnMobile: true,
      cell: (r) => text(r.practiceLocations?.map((p: Row) => p.location.clinic.name).join(', ')),
    },
    { key: 'experienceYears', header: 'Experience', cell: (r) => text(r.experienceYears ? `${r.experienceYears} yrs` : null), hideOnMobile: true },
    { key: 'status', header: 'Status', cell: (r) => status(r.status) },
  ],

  staff: [
    { key: 'code', header: 'Staff ID', cell: (r) => code(r.code), hideOnMobile: true },
    { key: 'name', header: 'Staff member', primary: true, cell: (r) => person(r.user.fullName, r.designation) },
    { key: 'department', header: 'Department', cell: (r) => text(r.department), hideOnMobile: true },
    { key: 'joiningDate', header: 'Joined', cell: (r) => dateOnly(r.joiningDate), hideOnMobile: true },
    { key: 'salaryType', header: 'Salary', cell: (r) => text(humanise(r.salaryType)), hideOnMobile: true },
    { key: 'status', header: 'Status', cell: (r) => status(r.status) },
  ],

  appointments: [
    { key: 'code', header: 'Ref', cell: (r) => code(r.code), hideOnMobile: true },
    {
      key: 'patient', header: 'Patient', primary: true,
      cell: (r) => person(r.patient.fullName, `${ageFrom(r.patient.dateOfBirth, r.patient.approxAgeYears)} · ${humanise(r.patient.gender)}`),
    },
    { key: 'doctor', header: 'Doctor', cell: (r) => text(r.doctor.user.fullName), hideOnMobile: true },
    { key: 'scheduledStart', header: 'Scheduled', cell: (r) => datetime(r.scheduledStart) },
    { key: 'type', header: 'Type', cell: (r) => text(humanise(r.type)), hideOnMobile: true },
    {
      key: 'fee', header: 'Fee', hideOnMobile: true,
      cell: (r) => (
        <span className="flex items-center gap-1.5">
          {money(r.fee)}
          {!r.isPaid ? <span className="text-[11px] font-semibold text-amber-600">Due</span> : null}
        </span>
      ),
    },
    { key: 'status', header: 'Status', cell: (r) => status(r.status) },
  ],

  consultations: [
    { key: 'code', header: 'Ref', cell: (r) => code(r.code), hideOnMobile: true },
    { key: 'patient', header: 'Patient', primary: true, cell: (r) => person(r.patient.fullName, r.chiefComplaint) },
    { key: 'doctor', header: 'Doctor', cell: (r) => text(r.doctor.user.fullName), hideOnMobile: true },
    { key: 'diagnosis', header: 'Diagnosis', cell: (r) => text(r.diagnoses?.[0]?.label), hideOnMobile: true },
    { key: 'startedAt', header: 'Date', cell: (r) => datetime(r.startedAt) },
    { key: 'status', header: 'Status', cell: (r) => status(r.status) },
  ],

  prescriptions: [
    { key: 'code', header: 'Ref', cell: (r) => code(r.code), hideOnMobile: true },
    { key: 'patient', header: 'Patient', primary: true, cell: (r) => person(r.patient.fullName, r.diagnosisText) },
    { key: 'doctor', header: 'Prescribed by', cell: (r) => text(r.doctor?.user.fullName), hideOnMobile: true },
    { key: 'items', header: 'Medicines', cell: (r) => <span className="tnum text-[13px] text-ink-2">{r._count?.items ?? 0}</span>, hideOnMobile: true },
    { key: 'source', header: 'Source', cell: (r) => <StatusPill tone={r.source === 'DIGITAL' ? 'info' : 'neutral'}>{humanise(r.source)}</StatusPill>, hideOnMobile: true },
    { key: 'issuedAt', header: 'Issued', cell: (r) => dateOnly(r.issuedAt ?? r.createdAt) },
    { key: 'status', header: 'Status', cell: (r) => status(r.status) },
  ],

  'lab-orders': [
    { key: 'code', header: 'Order', cell: (r) => code(r.code), hideOnMobile: true },
    { key: 'patient', header: 'Patient', primary: true, cell: (r) => person(r.patient.fullName, r.items?.map((i: Row) => i.testName).join(', ')) },
    { key: 'doctor', header: 'Ordered by', cell: (r) => text(r.doctor?.user.fullName), hideOnMobile: true },
    { key: 'lab', header: 'Laboratory', cell: (r) => text(r.lab?.name), hideOnMobile: true },
    {
      key: 'homeCollection', header: 'Collection', hideOnMobile: true,
      cell: (r) => <StatusPill tone={r.homeCollection ? 'info' : 'neutral'}>{r.homeCollection ? 'Home' : 'At lab'}</StatusPill>,
    },
    { key: 'orderedAt', header: 'Ordered', cell: (r) => dateOnly(r.orderedAt) },
    { key: 'status', header: 'Status', cell: (r) => status(r.status) },
  ],

  payments: [
    { key: 'code', header: 'Ref', cell: (r) => code(r.code), hideOnMobile: true },
    { key: 'patient', header: 'Patient', primary: true, cell: (r) => person(r.patient.fullName, r.invoice?.number) },
    { key: 'amount', header: 'Amount', cell: (r) => money(r.amount) },
    { key: 'method', header: 'Method', cell: (r) => text(humanise(r.method)), hideOnMobile: true },
    { key: 'createdAt', header: 'Date', cell: (r) => datetime(r.capturedAt ?? r.createdAt) },
    { key: 'status', header: 'Status', cell: (r) => status(r.status) },
  ],

  invoices: [
    { key: 'number', header: 'Invoice', cell: (r) => code(r.number), primary: true },
    { key: 'patient', header: 'Patient', cell: (r) => person(r.patient.fullName) },
    { key: 'total', header: 'Total', cell: (r) => money(r.total) },
    { key: 'amountPaid', header: 'Paid', cell: (r) => money(r.amountPaid), hideOnMobile: true },
    { key: 'issuedAt', header: 'Issued', cell: (r) => dateOnly(r.issuedAt ?? r.createdAt), hideOnMobile: true },
    { key: 'status', header: 'Status', cell: (r) => status(r.status) },
  ],

  expenses: [
    { key: 'date', header: 'Date', cell: (r) => dateOnly(r.date) },
    { key: 'category', header: 'Category', primary: true, cell: (r) => text(r.category?.name, 'text-[13px] font-semibold text-ink') },
    { key: 'vendor', header: 'Vendor', cell: (r) => text(r.vendor) },
    { key: 'description', header: 'Description', cell: (r) => text(r.description), hideOnMobile: true },
    { key: 'amount', header: 'Amount', cell: (r) => money(r.amount) },
    { key: 'status', header: 'Status', cell: (r) => status(r.status) },
  ],

  attendance: [
    { key: 'date', header: 'Date', cell: (r) => dateOnly(r.date) },
    { key: 'staff', header: 'Staff member', primary: true, cell: (r) => person(r.staff.user.fullName, r.staff.designation) },
    { key: 'checkInAt', header: 'Check in', cell: (r) => (r.checkInAt ? <span className="tnum text-[13px]">{formatTime(r.checkInAt)}</span> : dash) },
    { key: 'checkOutAt', header: 'Check out', cell: (r) => (r.checkOutAt ? <span className="tnum text-[13px]">{formatTime(r.checkOutAt)}</span> : dash), hideOnMobile: true },
    {
      key: 'workedMinutes', header: 'Worked', hideOnMobile: true,
      cell: (r) => (r.workedMinutes ? <span className="tnum text-[13px]">{Math.floor(r.workedMinutes / 60)}h {r.workedMinutes % 60}m</span> : dash),
    },
    { key: 'status', header: 'Status', cell: (r) => status(r.status) },
  ],

  'leave-requests': [
    { key: 'staff', header: 'Staff member', primary: true, cell: (r) => person(r.staff.user.fullName, r.staff.designation) },
    { key: 'type', header: 'Type', cell: (r) => text(humanise(r.type)) },
    { key: 'startDate', header: 'From', cell: (r) => dateOnly(r.startDate) },
    { key: 'endDate', header: 'To', cell: (r) => dateOnly(r.endDate), hideOnMobile: true },
    { key: 'days', header: 'Days', cell: (r) => <span className="tnum text-[13px]">{Number(r.days)}</span>, hideOnMobile: true },
    { key: 'reason', header: 'Reason', cell: (r) => text(r.reason), hideOnMobile: true },
    { key: 'status', header: 'Status', cell: (r) => status(r.status) },
  ],

  payroll: [
    {
      key: 'period', header: 'Period', primary: true,
      cell: (r) => (
        <span className="text-[13px] font-semibold text-ink">
          {new Date(r.periodYear, r.periodMonth - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
        </span>
      ),
    },
    { key: 'items', header: 'Employees', cell: (r) => <span className="tnum text-[13px]">{r._count?.items ?? 0}</span> },
    { key: 'grossTotal', header: 'Gross', cell: (r) => money(r.grossTotal) },
    { key: 'netTotal', header: 'Net payable', cell: (r) => money(r.netTotal) },
    { key: 'paidAt', header: 'Paid', cell: (r) => dateOnly(r.paidAt), hideOnMobile: true },
    { key: 'status', header: 'Status', cell: (r) => status(r.status) },
  ],

  payslips: [
    { key: 'number', header: 'Payslip', cell: (r) => code(r.number), primary: true },
    { key: 'staff', header: 'Staff member', cell: (r) => person(r.staff.user.fullName) },
    {
      key: 'period', header: 'Period',
      cell: (r) => text(new Date(r.payroll.periodYear, r.payroll.periodMonth - 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })),
    },
    { key: 'net', header: 'Net paid', cell: (r) => money((r.snapshot as Row)?.net) },
    { key: 'issuedAt', header: 'Issued', cell: (r) => dateOnly(r.issuedAt), hideOnMobile: true },
  ],

  documents: [
    { key: 'title', header: 'Document', primary: true, cell: (r) => text(r.title, 'text-[13px] font-semibold text-ink') },
    { key: 'patient', header: 'Patient', cell: (r) => person(r.patient.fullName) },
    { key: 'kind', header: 'Type', cell: (r) => <StatusPill tone="neutral">{humanise(r.kind)}</StatusPill> },
    { key: 'origin', header: 'Source', cell: (r) => text(humanise(r.origin)), hideOnMobile: true },
    {
      key: 'sizeBytes', header: 'Size', hideOnMobile: true,
      cell: (r) => <span className="tnum text-[12.5px] text-muted">{Math.round(r.sizeBytes / 1024)} KB</span>,
    },
    { key: 'uploadedAt', header: 'Uploaded', cell: (r) => dateOnly(r.uploadedAt) },
  ],

  organizations: [
    { key: 'code', header: 'Code', cell: (r) => code(r.code), hideOnMobile: true },
    { key: 'name', header: 'Organization', primary: true, cell: (r) => person(r.name, r.legalName) },
    { key: 'city', header: 'Location', cell: (r) => text([r.city, r.state].filter(Boolean).join(', ')) },
    { key: 'clinics', header: 'Clinics', cell: (r) => <span className="tnum text-[13px]">{r._count?.clinics ?? 0}</span> },
    { key: 'users', header: 'Users', cell: (r) => <span className="tnum text-[13px]">{r._count?.users ?? 0}</span>, hideOnMobile: true },
    { key: 'status', header: 'Status', cell: (r) => status(r.status) },
  ],

  clinics: [
    { key: 'code', header: 'Code', cell: (r) => code(r.code), hideOnMobile: true },
    { key: 'name', header: 'Clinic', primary: true, cell: (r) => person(r.name, r.registrationNo) },
    { key: 'organization', header: 'Organization', cell: (r) => text(r.organization?.name), hideOnMobile: true },
    {
      key: 'locations', header: 'Locations',
      cell: (r) => text(r.locations?.map((l: Row) => l.city).filter(Boolean).join(', ')),
    },
    { key: 'phone', header: 'Contact', cell: (r) => <span className="tnum text-[13px]">{r.phone ?? '—'}</span>, hideOnMobile: true },
    { key: 'status', header: 'Status', cell: (r) => status(r.status) },
  ],

  pharmacies: [
    { key: 'code', header: 'Code', cell: (r) => code(r.code), hideOnMobile: true },
    { key: 'name', header: 'Pharmacy', primary: true, cell: (r) => person(r.name, r.licenseNo) },
    { key: 'locations', header: 'City', cell: (r) => text(r.locations?.map((l: Row) => l.city).join(', ')) },
    { key: 'orders', header: 'Orders', cell: (r) => <span className="tnum text-[13px]">{r._count?.orders ?? 0}</span>, hideOnMobile: true },
    { key: 'status', header: 'Status', cell: (r) => status(r.status) },
  ],

  labs: [
    { key: 'code', header: 'Code', cell: (r) => code(r.code), hideOnMobile: true },
    { key: 'name', header: 'Laboratory', primary: true, cell: (r) => person(r.name, r.registrationNo) },
    { key: 'locations', header: 'City', cell: (r) => text(r.locations?.map((l: Row) => l.city).join(', ')) },
    { key: 'tests', header: 'Tests', cell: (r) => <span className="tnum text-[13px]">{r._count?.tests ?? 0}</span>, hideOnMobile: true },
    { key: 'orders', header: 'Orders', cell: (r) => <span className="tnum text-[13px]">{r._count?.orders ?? 0}</span>, hideOnMobile: true },
    { key: 'status', header: 'Status', cell: (r) => status(r.status) },
  ],

  'mr-leads': [
    { key: 'leadName', header: 'Lead', primary: true, cell: (r) => person(r.leadName, r.specialtyHint) },
    { key: 'clinicName', header: 'Clinic', cell: (r) => text(r.clinicName) },
    { key: 'city', header: 'City', cell: (r) => text(r.city), hideOnMobile: true },
    { key: 'leadMobile', header: 'Mobile', cell: (r) => <span className="tnum text-[13px]">{r.leadMobile}</span>, hideOnMobile: true },
    { key: 'nextActionAt', header: 'Next action', cell: (r) => dateOnly(r.nextActionAt), hideOnMobile: true },
    { key: 'stage', header: 'Stage', cell: (r) => status(r.stage) },
  ],

  'mr-visits': [
    { key: 'visitedAt', header: 'Visited', cell: (r) => datetime(r.visitedAt) },
    { key: 'lead', header: 'Lead', primary: true, cell: (r) => person(r.onboarding?.leadName ?? 'Unlinked visit', r.onboarding?.clinicName) },
    { key: 'type', header: 'Purpose', cell: (r) => <StatusPill tone="info">{humanise(r.type)}</StatusPill> },
    { key: 'outcome', header: 'Outcome', cell: (r) => text(r.outcome) },
  ],

  'pharmacy-orders': [
    { key: 'code', header: 'Order', cell: (r) => code(r.code), hideOnMobile: true },
    {
      key: 'patient', header: 'Patient', primary: true,
      cell: (r) => person(r.patient.fullName, `${r.items?.length ?? 0} items`),
    },
    { key: 'prescription', header: 'Prescription', cell: (r) => code(r.prescription?.code), hideOnMobile: true },
    { key: 'fulfilmentMode', header: 'Fulfilment', cell: (r) => <StatusPill tone={r.fulfilmentMode === 'DELIVERY' ? 'info' : 'neutral'}>{humanise(r.fulfilmentMode)}</StatusPill> },
    { key: 'sentAt', header: 'Received', cell: (r) => dateOnly(r.sentAt), hideOnMobile: true },
    { key: 'status', header: 'Status', cell: (r) => status(r.status) },
  ],

  'pharmacy-inventory': [
    { key: 'medicineName', header: 'Medicine', primary: true, cell: (r) => person(r.medicineName, r.genericName) },
    { key: 'strength', header: 'Strength', cell: (r) => text(r.strength), hideOnMobile: true },
    { key: 'packSize', header: 'Pack', cell: (r) => text(r.packSize), hideOnMobile: true },
    { key: 'mrp', header: 'MRP', cell: (r) => money(r.mrp), hideOnMobile: true },
    { key: 'sellingPrice', header: 'Price', cell: (r) => money(r.sellingPrice) },
    {
      key: 'stockQty', header: 'Stock',
      cell: (r) => (
        <StatusPill tone={r.stockQty === 0 ? 'danger' : r.stockQty <= 10 ? 'warning' : 'success'}>
          {r.stockQty} in stock
        </StatusPill>
      ),
    },
    { key: 'expiryDate', header: 'Expiry', cell: (r) => dateOnly(r.expiryDate), hideOnMobile: true },
  ],

  'lab-tests': [
    { key: 'code', header: 'Code', cell: (r) => code(r.code), hideOnMobile: true },
    { key: 'name', header: 'Test', primary: true, cell: (r) => person(r.name, r.category) },
    { key: 'sampleType', header: 'Sample', cell: (r) => text(r.sampleType) },
    { key: 'turnaroundHours', header: 'Turnaround', cell: (r) => text(r.turnaroundHours ? `${r.turnaroundHours} hrs` : null), hideOnMobile: true },
    { key: 'price', header: 'Price', cell: (r) => money(r.prices?.[0]?.price) },
    { key: 'isActive', header: 'Status', cell: (r) => <StatusPill tone={r.isActive ? 'success' : 'neutral'}>{r.isActive ? 'Active' : 'Inactive'}</StatusPill> },
  ],

  'audit-logs': [
    { key: 'createdAt', header: 'When', cell: (r) => datetime(r.createdAt) },
    { key: 'user', header: 'Who', primary: true, cell: (r) => person(r.user?.fullName ?? 'System', r.user?.email) },
    { key: 'action', header: 'Action', cell: (r) => <StatusPill tone="info">{r.action}</StatusPill> },
    { key: 'resourceType', header: 'Resource', cell: (r) => text(r.resourceType), hideOnMobile: true },
    { key: 'patientId', header: 'PHI', hideOnMobile: true, cell: (r) => (r.patientId ? <StatusPill tone="warning">Patient data</StatusPill> : dash) },
    { key: 'ipAddress', header: 'IP', cell: (r) => <span className="tnum text-[12px] text-muted">{r.ipAddress ?? '—'}</span>, hideOnMobile: true },
  ],

  'security-events': [
    { key: 'createdAt', header: 'When', cell: (r) => datetime(r.createdAt) },
    { key: 'type', header: 'Event', primary: true, cell: (r) => <StatusPill tone={r.severity === 'critical' ? 'danger' : r.severity === 'warning' ? 'warning' : 'neutral'}>{humanise(r.type)}</StatusPill> },
    { key: 'severity', header: 'Severity', cell: (r) => text(humanise(r.severity)) },
    { key: 'email', header: 'Account', cell: (r) => text(r.email ?? r.mobile), hideOnMobile: true },
    { key: 'ipAddress', header: 'IP', cell: (r) => <span className="tnum text-[12px] text-muted">{r.ipAddress ?? '—'}</span>, hideOnMobile: true },
  ],

  notifications: [
    { key: 'title', header: 'Notification', primary: true, cell: (r) => person(r.title, r.body) },
    { key: 'type', header: 'Type', cell: (r) => <StatusPill tone="info">{humanise(r.type)}</StatusPill> },
    { key: 'createdAt', header: 'When', cell: (r) => datetime(r.createdAt) },
    { key: 'readAt', header: 'Read', cell: (r) => (r.readAt ? <StatusPill tone="success">Read</StatusPill> : <StatusPill tone="warning">Unread</StatusPill>) },
  ],

  'diet-plans': [
    { key: 'title', header: 'Plan', primary: true, cell: (r) => person(r.title, `Version ${r.version}`) },
    { key: 'patient', header: 'Patient', cell: (r) => text(r.patient.fullName) },
    { key: 'startDate', header: 'Starts', cell: (r) => dateOnly(r.startDate) },
    { key: 'endDate', header: 'Ends', cell: (r) => dateOnly(r.endDate), hideOnMobile: true },
    { key: 'status', header: 'Status', cell: (r) => status(r.status) },
  ],

  blogs: [
    { key: 'title', header: 'Article', primary: true, cell: (r) => person(r.title, r.excerpt) },
    { key: 'tags', header: 'Tags', cell: (r) => text(r.tags?.join(', ')), hideOnMobile: true },
    { key: 'viewCount', header: 'Views', cell: (r) => <span className="tnum text-[13px]">{r.viewCount}</span>, hideOnMobile: true },
    { key: 'publishedAt', header: 'Published', cell: (r) => dateOnly(r.publishedAt) },
    { key: 'status', header: 'Status', cell: (r) => status(r.status) },
  ],

  reviews: [
    { key: 'patient', header: 'Patient', primary: true, cell: (r) => person(r.patient.fullName, r.comment) },
    { key: 'doctor', header: 'Doctor', cell: (r) => text(r.doctor.user.fullName) },
    { key: 'rating', header: 'Rating', cell: (r) => <span className="tnum text-[13px] font-semibold">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span> },
    { key: 'createdAt', header: 'Submitted', cell: (r) => dateOnly(r.createdAt), hideOnMobile: true },
    { key: 'status', header: 'Status', cell: (r) => status(r.status) },
  ],

  specialties: [
    { key: 'name', header: 'Specialty', primary: true, cell: (r) => person(r.name, r.description) },
    { key: 'key', header: 'Key', cell: (r) => code(r.key), hideOnMobile: true },
    { key: 'doctors', header: 'Doctors', cell: (r) => <span className="tnum text-[13px]">{r._count?.doctorSpecialties ?? 0}</span> },
  ],

  medicines: [
    { key: 'name', header: 'Medicine', primary: true, cell: (r) => person(r.name, r.genericName) },
    { key: 'strength', header: 'Strength', cell: (r) => text(r.strength) },
    { key: 'form', header: 'Form', cell: (r) => text(r.form) },
    { key: 'isActive', header: 'Status', cell: (r) => <StatusPill tone={r.isActive ? 'success' : 'neutral'}>{r.isActive ? 'Active' : 'Inactive'}</StatusPill> },
  ],

  'advice-templates': [
    { key: 'title', header: 'Advice', primary: true, cell: (r) => person(r.title, r.bodyEn) },
    { key: 'category', header: 'Category', cell: (r) => <StatusPill tone="info">{r.category}</StatusPill> },
    { key: 'bodyHi', header: 'Hindi', cell: (r) => text(r.bodyHi), hideOnMobile: true },
  ],
};
