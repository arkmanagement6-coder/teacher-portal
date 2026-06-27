// Database abstraction layer supporting Supabase or LocalStorage Mock DB fallback.
"use client";

export type UserRole = 'super_admin' | 'owner' | 'teacher';

export interface Profile {
  id: string;
  name: string;
  role: UserRole;
  mobile?: string;
  email: string;
}

export interface Academy {
  id: string;
  name: string;
  logo_url?: string;
  address?: string;
  owner_id?: string;
  razorpay_key_id?: string;
  razorpay_secret?: string;
  whatsapp_enabled: boolean;
  whatsapp_settings: {
    phoneNumberId?: string;
    accessToken?: string;
  };
  resend_api_key?: string;
  subscription_plan: 'trial' | 'growth' | 'enterprise';
  subscription_status: 'active' | 'unpaid' | 'cancelled';
  created_at: string;
}

export interface Batch {
  id: string;
  academy_id: string;
  name: string;
  timings: string;
  teacher_id?: string;
  teacher_name?: string;
  capacity: number;
}

export interface Student {
  id: string;
  academy_id: string;
  name: string;
  parent_name: string;
  mobile: string;
  whatsapp: string;
  email: string;
  address?: string;
  batch_id?: string;
  batch_name?: string;
  monthly_fee: number;
  joining_date: string;
  due_date: number; // day of month 1-31
  status: 'active' | 'inactive';
  notes?: string;
  created_at: string;
}

export interface Fee {
  id: string;
  student_id: string;
  student_name?: string;
  batch_name?: string;
  academy_id: string;
  amount: number;
  paid_amount: number;
  due_date: string; // YYYY-MM-DD
  billing_cycle: string;
  status: 'paid' | 'pending' | 'overdue' | 'partially_paid';
  created_at: string;
}

export interface Payment {
  id: string;
  fee_id: string;
  student_name?: string;
  academy_id: string;
  razorpay_order_id: string;
  razorpay_payment_id?: string;
  amount: number;
  status: 'paid' | 'failed' | 'pending' | 'refunded';
  payment_method?: string;
  created_at: string;
}

export interface Attendance {
  id: string;
  student_id: string;
  student_name?: string;
  batch_id: string;
  date: string; // YYYY-MM-DD
  status: 'present' | 'absent' | 'leave';
  marked_by: string;
  created_at: string;
}

export interface WhatsAppLog {
  id: string;
  academy_id: string;
  student_id: string;
  student_name?: string;
  type: 'due_reminder' | 'overdue_reminder' | 'payment_success' | 'class_reminder' | 'attendance_alert';
  status: 'sent' | 'delivered' | 'failed';
  sent_to: string;
  sent_at: string;
}

export interface SupportTicket {
  id: string;
  academy_name: string;
  title: string;
  description: string;
  status: 'open' | 'resolved';
  created_at: string;
}

// Initial mock data definitions
const MOCK_PROFILES: Profile[] = [
  { id: 'usr-admin', name: 'Super Admin', role: 'super_admin', email: 'admin@test.com', mobile: '9999900000' },
  { id: 'usr-owner', name: 'Vikram Aditya', role: 'owner', email: 'owner@test.com', mobile: '9876543210' },
  { id: 'usr-teacher', name: 'Neelam Sen', role: 'teacher', email: 'teacher@test.com', mobile: '8765432109' }
];

const MOCK_ACADEMIES: Academy[] = [
  {
    id: 'acad-1',
    name: 'Apex Chess Academy',
    logo_url: '',
    address: '402, Sector 15, HSR Layout, Bangalore',
    owner_id: 'usr-owner',
    razorpay_key_id: 'rzp_test_keys1234',
    razorpay_secret: 'sec_test_secret5678',
    whatsapp_enabled: true,
    whatsapp_settings: { phoneNumberId: '10984723984', accessToken: 'EAAd7fghd...' },
    resend_api_key: 're_7sd6fg...',
    subscription_plan: 'growth',
    subscription_status: 'active',
    created_at: '2026-01-10T12:00:00Z'
  }
];

const MOCK_BATCHES: Batch[] = [
  { id: 'batch-1', academy_id: 'acad-1', name: 'Chess Beginners', timings: 'Mon, Wed, Fri (5:00 PM - 6:00 PM)', teacher_id: 'usr-teacher', capacity: 15 },
  { id: 'batch-2', academy_id: 'acad-1', name: 'Chess Intermediate', timings: 'Tue, Thu, Sat (6:00 PM - 7:30 PM)', teacher_id: 'usr-teacher', capacity: 12 },
  { id: 'batch-3', academy_id: 'acad-1', name: 'Grandmaster Advanced', timings: 'Sat, Sun (10:00 AM - 12:30 PM)', teacher_id: 'usr-owner', capacity: 8 }
];

const MOCK_STUDENTS: Student[] = [
  {
    id: 'std-1',
    academy_id: 'acad-1',
    name: 'Aarav Sharma',
    parent_name: 'Rajesh Sharma',
    mobile: '9812345678',
    whatsapp: '9812345678',
    email: 'rajesh.sharma@example.com',
    address: 'Flat 101, Shanti Niketan, Bangalore',
    batch_id: 'batch-1',
    monthly_fee: 1500,
    joining_date: '2026-02-01',
    due_date: 5,
    status: 'active',
    notes: 'Aarav shows keen interest in endgame strategies.',
    created_at: '2026-02-01T10:00:00Z'
  },
  {
    id: 'std-2',
    academy_id: 'acad-1',
    name: 'Isha Patel',
    parent_name: 'Amit Patel',
    mobile: '9723456781',
    whatsapp: '9723456781',
    email: 'amit.patel@example.com',
    address: 'Rowhouse 23, Orchid Green, Bangalore',
    batch_id: 'batch-1',
    monthly_fee: 1500,
    joining_date: '2026-03-05',
    due_date: 5,
    status: 'active',
    notes: 'Needs guidance on opening moves.',
    created_at: '2026-03-05T11:00:00Z'
  },
  {
    id: 'std-3',
    academy_id: 'acad-1',
    name: 'Kabir Singh',
    parent_name: 'Sanjay Singh',
    mobile: '9634567812',
    whatsapp: '9634567812',
    email: 'sanjay.singh@example.com',
    address: 'Sector 3, HSR Layout, Bangalore',
    batch_id: 'batch-2',
    monthly_fee: 2000,
    joining_date: '2026-01-15',
    due_date: 10,
    status: 'active',
    notes: 'Aggressive tactical player.',
    created_at: '2026-01-15T09:00:00Z'
  },
  {
    id: 'std-4',
    academy_id: 'acad-1',
    name: 'Riya Sen',
    parent_name: 'Debashis Sen',
    mobile: '9545678123',
    whatsapp: '9545678123',
    email: 'debashis.sen@example.com',
    batch_id: 'batch-2',
    monthly_fee: 2000,
    joining_date: '2026-04-10',
    due_date: 10,
    status: 'active',
    notes: 'Very analytical thinker.',
    created_at: '2026-04-10T14:00:00Z'
  },
  {
    id: 'std-5',
    academy_id: 'acad-1',
    name: 'Vihaan Verma',
    parent_name: 'Deepak Verma',
    mobile: '9456781234',
    whatsapp: '9456781234',
    email: 'deepak.verma@example.com',
    batch_id: 'batch-1',
    monthly_fee: 1500,
    joining_date: '2026-01-10',
    due_date: 5,
    status: 'active',
    notes: 'Slow learner, needs additional assistance.',
    created_at: '2026-01-10T08:00:00Z'
  },
  {
    id: 'std-6',
    academy_id: 'acad-1',
    name: 'Diya Nair',
    parent_name: 'Madhavan Nair',
    mobile: '9367812345',
    whatsapp: '9367812345',
    email: 'madhavan.nair@example.com',
    batch_id: 'batch-3',
    monthly_fee: 3000,
    joining_date: '2026-02-20',
    due_date: 15,
    status: 'active',
    notes: 'FIDE rated player (ELO 1100).',
    created_at: '2026-02-20T16:00:00Z'
  }
];

const MOCK_FEES: Fee[] = [
  // Aarav: Overdue fee (June 2026) & Pending (July 2026) - assuming we are on June 25, 2026
  { id: 'fee-1', student_id: 'std-1', academy_id: 'acad-1', amount: 1500, paid_amount: 0, due_date: '2026-06-05', billing_cycle: 'monthly', status: 'overdue', created_at: '2026-06-01T00:00:00Z' },
  // Isha: Paid (June 2026)
  { id: 'fee-2', student_id: 'std-2', academy_id: 'acad-1', amount: 1500, paid_amount: 1500, due_date: '2026-06-05', billing_cycle: 'monthly', status: 'paid', created_at: '2026-06-01T00:00:00Z' },
  // Kabir: Paid (June 2026)
  { id: 'fee-3', student_id: 'std-3', academy_id: 'acad-1', amount: 2000, paid_amount: 2000, due_date: '2026-06-10', billing_cycle: 'monthly', status: 'paid', created_at: '2026-06-01T00:00:00Z' },
  // Riya: Pending (June 2026) - since it is due on 10th and status is pending (needs manual followup or overdue soon)
  { id: 'fee-4', student_id: 'std-4', academy_id: 'acad-1', amount: 2000, paid_amount: 0, due_date: '2026-06-10', billing_cycle: 'monthly', status: 'overdue', created_at: '2026-06-01T00:00:00Z' },
  // Vihaan: Overdue (May 2026) & Overdue (June 2026)
  { id: 'fee-5', student_id: 'std-5', academy_id: 'acad-1', amount: 1500, paid_amount: 0, due_date: '2026-05-05', billing_cycle: 'monthly', status: 'overdue', created_at: '2026-05-01T00:00:00Z' },
  { id: 'fee-6', student_id: 'std-5', academy_id: 'acad-1', amount: 1500, paid_amount: 500, due_date: '2026-06-05', billing_cycle: 'monthly', status: 'partially_paid', created_at: '2026-06-01T00:00:00Z' },
  // Diya: Paid (June 2026)
  { id: 'fee-7', student_id: 'std-6', academy_id: 'acad-1', amount: 3000, paid_amount: 3000, due_date: '2026-06-15', billing_cycle: 'monthly', status: 'paid', created_at: '2026-06-01T00:00:00Z' }
];

const MOCK_PAYMENTS: Payment[] = [
  { id: 'pay-1', fee_id: 'fee-2', academy_id: 'acad-1', razorpay_order_id: 'order_isa123', razorpay_payment_id: 'pay_isa789', amount: 1500, status: 'paid', payment_method: 'UPI', created_at: '2026-06-04T18:30:00Z' },
  { id: 'pay-2', fee_id: 'fee-3', academy_id: 'acad-1', razorpay_order_id: 'order_kab123', razorpay_payment_id: 'pay_kab789', amount: 2000, status: 'paid', payment_method: 'Netbanking', created_at: '2026-06-09T10:00:00Z' },
  { id: 'pay-3', fee_id: 'fee-6', academy_id: 'acad-1', razorpay_order_id: 'order_vih123', razorpay_payment_id: 'pay_vih789', amount: 500, status: 'paid', payment_method: 'Card', created_at: '2026-06-06T15:20:00Z' },
  { id: 'pay-4', fee_id: 'fee-7', academy_id: 'acad-1', razorpay_order_id: 'order_diy123', razorpay_payment_id: 'pay_diy789', amount: 3000, status: 'paid', payment_method: 'UPI', created_at: '2026-06-14T11:45:00Z' }
];

const MOCK_ATTENDANCE: Attendance[] = [
  // Class on Monday June 22
  { id: 'att-1', student_id: 'std-1', batch_id: 'batch-1', date: '2026-06-22', status: 'present', marked_by: 'usr-teacher', created_at: '2026-06-22T18:05:00Z' },
  { id: 'att-2', student_id: 'std-2', batch_id: 'batch-1', date: '2026-06-22', status: 'present', marked_by: 'usr-teacher', created_at: '2026-06-22T18:05:00Z' },
  { id: 'att-3', student_id: 'std-5', batch_id: 'batch-1', date: '2026-06-22', status: 'absent', marked_by: 'usr-teacher', created_at: '2026-06-22T18:05:00Z' },
  
  // Class on Wednesday June 24
  { id: 'att-4', student_id: 'std-1', batch_id: 'batch-1', date: '2026-06-24', status: 'absent', marked_by: 'usr-teacher', created_at: '2026-06-24T18:02:00Z' },
  { id: 'att-5', student_id: 'std-2', batch_id: 'batch-1', date: '2026-06-24', status: 'present', marked_by: 'usr-teacher', created_at: '2026-06-24T18:02:00Z' },
  { id: 'att-6', student_id: 'std-5', batch_id: 'batch-1', date: '2026-06-24', status: 'leave', marked_by: 'usr-teacher', created_at: '2026-06-24T18:02:00Z' }
];

const MOCK_WHATSAPP_LOGS: WhatsAppLog[] = [
  { id: 'wl-1', academy_id: 'acad-1', student_id: 'std-1', type: 'due_reminder', status: 'delivered', sent_to: '9812345678', sent_at: '2026-06-03T10:00:00Z' },
  { id: 'wl-2', academy_id: 'acad-1', student_id: 'std-5', type: 'overdue_reminder', status: 'delivered', sent_to: '9456781234', sent_at: '2026-06-08T11:30:00Z' },
  { id: 'wl-3', academy_id: 'acad-1', student_id: 'std-2', type: 'payment_success', status: 'sent', sent_to: '9723456781', sent_at: '2026-06-04T18:32:00Z' }
];

const MOCK_TICKETS: SupportTicket[] = [
  { id: 'tkt-1', academy_name: 'Apex Chess Academy', title: 'Payment link loading issue on safari', description: 'One of the parents reported a blank screen while opening the Razorpay redirect on Safari 16.', status: 'open', created_at: '2026-06-23T14:30:00Z' },
  { id: 'tkt-2', academy_name: 'Harmony Music School', title: 'Need custom SMS configuration', description: 'Can we integrate custom SMS gateway instead of WhatsApp API?', status: 'resolved', created_at: '2026-06-18T09:15:00Z' }
];

// Helper to write to local storage
const getStorageItem = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultValue;
};

const setStorageItem = <T>(key: string, value: T): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

export class DbClient {
  private static getIsLive(): boolean {
    return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  }

  // Load database state
  private static getStore() {
    const profiles = getStorageItem<Profile[]>('db_profiles', MOCK_PROFILES);
    const academies = getStorageItem<Academy[]>('db_academies', MOCK_ACADEMIES);
    const batches = getStorageItem<Batch[]>('db_batches', MOCK_BATCHES);
    const students = getStorageItem<Student[]>('db_students', MOCK_STUDENTS);
    const fees = getStorageItem<Fee[]>('db_fees', MOCK_FEES);
    const payments = getStorageItem<Payment[]>('db_payments', MOCK_PAYMENTS);
    const attendance = getStorageItem<Attendance[]>('db_attendance', MOCK_ATTENDANCE);
    const logs = getStorageItem<WhatsAppLog[]>('db_whatsapp_logs', MOCK_WHATSAPP_LOGS);
    const tickets = getStorageItem<SupportTicket[]>('db_tickets', MOCK_TICKETS);
    const currentUser = getStorageItem<Profile | null>('db_current_user', null);

    return { profiles, academies, batches, students, fees, payments, attendance, logs, tickets, currentUser };
  }

  private static saveStore(store: ReturnType<typeof DbClient.getStore>) {
    setStorageItem('db_profiles', store.profiles);
    setStorageItem('db_academies', store.academies);
    setStorageItem('db_batches', store.batches);
    setStorageItem('db_students', store.students);
    setStorageItem('db_fees', store.fees);
    setStorageItem('db_payments', store.payments);
    setStorageItem('db_attendance', store.attendance);
    setStorageItem('db_whatsapp_logs', store.logs);
    setStorageItem('db_tickets', store.tickets);
    setStorageItem('db_current_user', store.currentUser);
  }

  // AUTH API
  static async signUp(data: { email: string; password?: string; name: string; academyName: string; mobile: string }): Promise<{ success: boolean; error?: string; user?: Profile }> {
    const store = this.getStore();
    const exists = store.profiles.some(p => p.email.toLowerCase() === data.email.toLowerCase());
    if (exists) return { success: false, error: 'User with this email already exists.' };

    const newProfileId = 'usr-' + Math.random().toString(36).substr(2, 9);
    const newAcademyId = 'acad-' + Math.random().toString(36).substr(2, 9);

    const newProfile: Profile = {
      id: newProfileId,
      name: data.name,
      role: 'owner',
      mobile: data.mobile,
      email: data.email
    };

    const newAcademy: Academy = {
      id: newAcademyId,
      name: data.academyName,
      owner_id: newProfileId,
      whatsapp_enabled: false,
      whatsapp_settings: {},
      subscription_plan: 'trial',
      subscription_status: 'active',
      created_at: new Date().toISOString()
    };

    store.profiles.push(newProfile);
    store.academies.push(newAcademy);
    store.currentUser = newProfile; // auto login on signup
    this.saveStore(store);

    return { success: true, user: newProfile };
  }

  static async signIn(email: string, password?: string): Promise<{ success: boolean; error?: string; user?: Profile }> {
    const store = this.getStore();
    const profile = store.profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
    if (!profile) return { success: false, error: 'Invalid email or password.' };

    store.currentUser = profile;
    this.saveStore(store);
    return { success: true, user: profile };
  }

  static async signOut(): Promise<void> {
    const store = this.getStore();
    store.currentUser = null;
    this.saveStore(store);
  }

  static async getCurrentUser(): Promise<Profile | null> {
    return this.getStore().currentUser;
  }

  // ACADEMY API
  static async getAcademy(academyId?: string): Promise<Academy | null> {
    const store = this.getStore();
    if (academyId) {
      return store.academies.find(a => a.id === academyId) || null;
    }
    // Default to owner's academy
    const user = store.currentUser;
    if (!user) return null;
    
    // Find academy where owner_id is current user, or teacher belongs to
    if (user.role === 'owner') {
      return store.academies.find(a => a.owner_id === user.id) || store.academies[0] || null;
    } else if (user.role === 'teacher') {
      // Find default academy
      return store.academies[0] || null;
    }
    return null;
  }

  static async updateAcademy(academyId: string, updates: Partial<Academy>): Promise<Academy> {
    const store = this.getStore();
    const index = store.academies.findIndex(a => a.id === academyId);
    if (index === -1) throw new Error('Academy not found');
    store.academies[index] = { ...store.academies[index], ...updates };
    this.saveStore(store);
    return store.academies[index];
  }

  // TEACHER API
  static async getTeachers(academyId: string): Promise<Profile[]> {
    const store = this.getStore();
    return store.profiles.filter(p => p.role === 'teacher');
  }

  static async addTeacher(academyId: string, teacher: { name: string; email: string; mobile: string }): Promise<Profile> {
    const store = this.getStore();
    const newId = 'usr-' + Math.random().toString(36).substr(2, 9);
    const newTeacher: Profile = {
      id: newId,
      name: teacher.name,
      email: teacher.email,
      mobile: teacher.mobile,
      role: 'teacher'
    };
    store.profiles.push(newTeacher);
    this.saveStore(store);
    return newTeacher;
  }

  static async deleteTeacher(teacherId: string): Promise<void> {
    const store = this.getStore();
    store.profiles = store.profiles.filter(p => p.id !== teacherId);
    this.saveStore(store);
  }

  // BATCHES API
  static async getBatches(academyId: string): Promise<Batch[]> {
    const store = this.getStore();
    return store.batches.filter(b => b.academy_id === academyId).map(b => {
      const teacher = store.profiles.find(p => p.id === b.teacher_id);
      return { ...b, teacher_name: teacher ? teacher.name : 'Unassigned' };
    });
  }

  static async createBatch(academyId: string, batch: Omit<Batch, 'id' | 'academy_id'>): Promise<Batch> {
    const store = this.getStore();
    const newBatch: Batch = {
      ...batch,
      id: 'batch-' + Math.random().toString(36).substr(2, 9),
      academy_id: academyId
    };
    store.batches.push(newBatch);
    this.saveStore(store);
    return newBatch;
  }

  static async updateBatch(batchId: string, updates: Partial<Batch>): Promise<Batch> {
    const store = this.getStore();
    const idx = store.batches.findIndex(b => b.id === batchId);
    if (idx === -1) throw new Error('Batch not found');
    store.batches[idx] = { ...store.batches[idx], ...updates };
    this.saveStore(store);
    return store.batches[idx];
  }

  static async deleteBatch(batchId: string): Promise<void> {
    const store = this.getStore();
    store.batches = store.batches.filter(b => b.id !== batchId);
    this.saveStore(store);
  }

  // STUDENT API
  static async getStudents(academyId: string): Promise<Student[]> {
    const store = this.getStore();
    return store.students.filter(s => s.academy_id === academyId).map(s => {
      const batch = store.batches.find(b => b.id === s.batch_id);
      return { ...s, batch_name: batch ? batch.name : 'Unassigned' };
    });
  }

  static async getStudent(studentId: string): Promise<Student | null> {
    const store = this.getStore();
    const s = store.students.find(st => st.id === studentId);
    if (!s) return null;
    const batch = store.batches.find(b => b.id === s.batch_id);
    return { ...s, batch_name: batch ? batch.name : 'Unassigned' };
  }

  static async addStudent(academyId: string, student: Omit<Student, 'id' | 'academy_id' | 'created_at'>): Promise<Student> {
    const store = this.getStore();
    const newStudent: Student = {
      ...student,
      id: 'std-' + Math.random().toString(36).substr(2, 9),
      academy_id: academyId,
      created_at: new Date().toISOString()
    };
    store.students.push(newStudent);
    this.saveStore(store);
    return newStudent;
  }

  static async updateStudent(studentId: string, updates: Partial<Student>): Promise<Student> {
    const store = this.getStore();
    const idx = store.students.findIndex(s => s.id === studentId);
    if (idx === -1) throw new Error('Student not found');
    store.students[idx] = { ...store.students[idx], ...updates };
    this.saveStore(store);
    return store.students[idx];
  }

  static async deleteStudent(studentId: string): Promise<void> {
    const store = this.getStore();
    store.students = store.students.filter(s => s.id !== studentId);
    this.saveStore(store);
  }

  // ATTENDANCE API
  static async getAttendance(date: string, batchId: string): Promise<Attendance[]> {
    const store = this.getStore();
    const atts = store.attendance.filter(a => a.date === date && a.batch_id === batchId);
    return atts.map(a => {
      const student = store.students.find(s => s.id === a.student_id);
      return { ...a, student_name: student ? student.name : 'Unknown student' };
    });
  }

  static async markAttendance(records: { student_id: string; status: 'present' | 'absent' | 'leave' }[], date: string, batchId: string, teacherId: string): Promise<void> {
    const store = this.getStore();
    // remove existing for this date and batch
    store.attendance = store.attendance.filter(a => !(a.date === date && a.batch_id === batchId));

    records.forEach(r => {
      store.attendance.push({
        id: 'att-' + Math.random().toString(36).substr(2, 9),
        student_id: r.student_id,
        batch_id: batchId,
        date,
        status: r.status,
        marked_by: teacherId,
        created_at: new Date().toISOString()
      });
    });

    this.saveStore(store);
  }

  // FEES API
  static async getFees(academyId: string): Promise<Fee[]> {
    const store = this.getStore();
    return store.fees.filter(f => f.academy_id === academyId).map(f => {
      const student = store.students.find(s => s.id === f.student_id);
      const batch = student ? store.batches.find(b => b.id === student.batch_id) : null;
      return {
        ...f,
        student_name: student ? student.name : 'Deleted Student',
        batch_name: batch ? batch.name : 'Unassigned'
      };
    });
  }

  static async generateMonthlyFees(academyId: string): Promise<number> {
    const store = this.getStore();
    const activeStudents = store.students.filter(s => s.academy_id === academyId && s.status === 'active');
    
    // Check current month & year (e.g., June 2026)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    
    let generatedCount = 0;

    activeStudents.forEach(s => {
      // due day formatted as date
      const dueDay = String(s.due_date).padStart(2, '0');
      const invoiceDueDate = `${year}-${month}-${dueDay}`;

      // Check if fee already exists for this student in this month
      const exists = store.fees.some(f => f.student_id === s.id && f.due_date.substring(0, 7) === `${year}-${month}`);
      
      if (!exists) {
        store.fees.push({
          id: 'fee-' + Math.random().toString(36).substr(2, 9),
          student_id: s.id,
          academy_id: academyId,
          amount: s.monthly_fee,
          paid_amount: 0,
          due_date: invoiceDueDate,
          billing_cycle: 'monthly',
          status: 'pending',
          created_at: new Date().toISOString()
        });
        generatedCount++;
      }
    });

    this.saveStore(store);
    return generatedCount;
  }

  static async updateFeeStatus(feeId: string, status: 'paid' | 'pending' | 'overdue' | 'partially_paid', paidAmount?: number): Promise<Fee> {
    const store = this.getStore();
    const idx = store.fees.findIndex(f => f.id === feeId);
    if (idx === -1) throw new Error('Fee record not found');
    
    store.fees[idx].status = status;
    if (paidAmount !== undefined) {
      store.fees[idx].paid_amount = paidAmount;
    }
    
    this.saveStore(store);
    return store.fees[idx];
  }

  static async createFeeRecord(academyId: string, fee: Omit<Fee, 'id' | 'academy_id' | 'created_at'>): Promise<Fee> {
    const store = this.getStore();
    const newFee: Fee = {
      ...fee,
      id: 'fee-' + Math.random().toString(36).substr(2, 9),
      academy_id: academyId,
      created_at: new Date().toISOString()
    };
    store.fees.push(newFee);
    this.saveStore(store);
    return newFee;
  }

  // PAYMENTS API
  static async getPayments(academyId: string): Promise<Payment[]> {
    const store = this.getStore();
    return store.payments.filter(p => p.academy_id === academyId).map(p => {
      const fee = store.fees.find(f => f.id === p.fee_id);
      const student = fee ? store.students.find(s => s.id === fee.student_id) : null;
      return {
        ...p,
        student_name: student ? student.name : 'Unknown student'
      };
    });
  }

  static async createPaymentLink(feeId: string, amount: number): Promise<Payment> {
    const store = this.getStore();
    const fee = store.fees.find(f => f.id === feeId);
    if (!fee) throw new Error('Fee not found');

    const payment: Payment = {
      id: 'pay-' + Math.random().toString(36).substr(2, 9),
      fee_id: feeId,
      academy_id: fee.academy_id,
      razorpay_order_id: 'order_' + Math.random().toString(36).substr(2, 10),
      amount,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    store.payments.push(payment);
    this.saveStore(store);
    return payment;
  }

  static async completePayment(paymentId: string, razorpayPaymentId: string, method: string): Promise<Payment> {
    const store = this.getStore();
    const payIdx = store.payments.findIndex(p => p.id === paymentId);
    if (payIdx === -1) throw new Error('Payment transaction not found');

    const pay = store.payments[payIdx];
    pay.status = 'paid';
    pay.razorpay_payment_id = razorpayPaymentId;
    pay.payment_method = method;

    // Update the corresponding fee record
    const feeIdx = store.fees.findIndex(f => f.id === pay.fee_id);
    if (feeIdx !== -1) {
      const fee = store.fees[feeIdx];
      const newPaid = Number(fee.paid_amount) + Number(pay.amount);
      fee.paid_amount = newPaid;
      fee.status = newPaid >= fee.amount ? 'paid' : 'partially_paid';
    }

    this.saveStore(store);
    return pay;
  }

  // WHATSAPP API
  static async getWhatsAppLogs(academyId: string): Promise<WhatsAppLog[]> {
    const store = this.getStore();
    return store.logs.filter(l => l.academy_id === academyId).map(l => {
      const student = store.students.find(s => s.id === l.student_id);
      return { ...l, student_name: student ? student.name : 'Unknown Student' };
    });
  }

  static async triggerWhatsAppReminder(academyId: string, studentId: string, type: WhatsAppLog['type'], messageText?: string): Promise<WhatsAppLog> {
    const store = this.getStore();
    const student = store.students.find(s => s.id === studentId);
    if (!student) throw new Error('Student not found');

    const log: WhatsAppLog = {
      id: 'wl-' + Math.random().toString(36).substr(2, 9),
      academy_id: academyId,
      student_id: studentId,
      type,
      status: Math.random() > 0.08 ? 'delivered' : 'failed', // 92% deliver success in demo mode
      sent_to: student.whatsapp || student.mobile,
      sent_at: new Date().toISOString()
    };

    store.logs.unshift(log); // newest first
    this.saveStore(store);
    return log;
  }

  // SUPER ADMIN API
  static async getPlatformStats(): Promise<{ academiesCount: number; totalRevenue: number; activeSubscriptions: number; supportTicketsCount: number }> {
    const store = this.getStore();
    return {
      academiesCount: store.academies.length,
      totalRevenue: store.payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0) + 14900, // seed base revenue
      activeSubscriptions: store.academies.filter(a => a.subscription_status === 'active').length,
      supportTicketsCount: store.tickets.filter(t => t.status === 'open').length
    };
  }

  static async getSuperAdminAcademies(): Promise<Academy[]> {
    return this.getStore().academies;
  }

  static async getSupportTickets(): Promise<SupportTicket[]> {
    return this.getStore().tickets;
  }

  static async updateTicketStatus(id: string, status: 'open' | 'resolved'): Promise<void> {
    const store = this.getStore();
    const idx = store.tickets.findIndex(t => t.id === id);
    if (idx !== -1) {
      store.tickets[idx].status = status;
      this.saveStore(store);
    }
  }

  static async changeAcademyPlan(id: string, plan: 'trial' | 'growth' | 'enterprise', status: 'active' | 'unpaid' | 'cancelled'): Promise<void> {
    const store = this.getStore();
    const idx = store.academies.findIndex(a => a.id === id);
    if (idx !== -1) {
      store.academies[idx].subscription_plan = plan;
      store.academies[idx].subscription_status = status;
      this.saveStore(store);
    }
  }
}
