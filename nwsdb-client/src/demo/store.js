const DB_KEY = 'nwsdb-demo-db-v1';
const DB_VERSION = 1;
const SESSION_KEY = 'nwsdb-demo-session';
const DAY = 86400000;

const VALID_ROLES = ['admin', 'crc', 'oic', 'co', 'ae', 'manager', 'rsc', 'staff'];
const ACTIVE_FILE_STATUSES = ['open', 'pending_receipt', 'pending_approval'];

let memoryDb = null;

function newId(prefix) {
  const random =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${random}`;
}

function nowIso() {
  return new Date().toISOString();
}

function day(offset, hour = 9, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function readSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function buildSeed() {
  const users = [
    {
      uid: 'demo-admin',
      email: 'admin@nwsdb.lk',
      username: 'admin',
      displayName: 'Demo Administrator',
      role: 'admin',
      section: 'IT Division',
      office: 'Head Office',
      active: true,
      createdAt: day(-420),
      lastSignInTime: day(-1)
    },
    {
      uid: 'demo-crc',
      email: 'sanduni@nwsdb.lk',
      username: 'sanduni',
      displayName: 'Sanduni Fernando',
      role: 'crc',
      section: 'Consumer Relations',
      office: 'Head Office',
      active: true,
      createdAt: day(-380),
      lastSignInTime: day(-2)
    },
    {
      uid: 'demo-oic',
      email: 'nimal@nwsdb.lk',
      username: 'nimal',
      displayName: 'Nimal Perera',
      role: 'oic',
      section: 'Consumer Relations',
      office: 'Head Office',
      active: true,
      createdAt: day(-360),
      lastSignInTime: day(-1)
    },
    {
      uid: 'demo-co',
      email: 'kasun@nwsdb.lk',
      username: 'kasun',
      displayName: 'Kasun Silva',
      role: 'co',
      section: 'Commercial Division',
      office: 'Head Office',
      active: true,
      createdAt: day(-350),
      lastSignInTime: day(-3)
    },
    {
      uid: 'demo-ae',
      email: 'dilani@nwsdb.lk',
      username: 'dilani',
      displayName: 'Dilani Jayasinghe',
      role: 'ae',
      section: 'Engineering Division',
      office: 'Colombo Area Office',
      active: true,
      createdAt: day(-330),
      lastSignInTime: day(-4)
    },
    {
      uid: 'demo-manager',
      email: 'ruwan@nwsdb.lk',
      username: 'ruwan',
      displayName: 'Ruwan Weerasinghe',
      role: 'manager',
      section: 'Head Office',
      office: 'Head Office',
      active: true,
      createdAt: day(-300),
      lastSignInTime: day(-1)
    },
    {
      uid: 'demo-rsc',
      email: 'tharindu@nwsdb.lk',
      username: 'tharindu',
      displayName: 'Tharindu Bandara',
      role: 'rsc',
      section: 'Regional Support Centre',
      office: 'Western Region',
      active: true,
      createdAt: day(-280),
      lastSignInTime: day(-5)
    },
    {
      uid: 'demo-staff',
      email: 'ishara@nwsdb.lk',
      username: 'ishara',
      displayName: 'Ishara Madushani',
      role: 'staff',
      section: 'Consumer Relations',
      office: 'Head Office',
      active: false,
      createdAt: day(-250),
      lastSignInTime: day(-60)
    }
  ];

  const departments = [
    { id: 'dept-head', name: 'Head Office', code: 'HO', type: 'office', parentId: null, active: true, createdAt: day(-500) },
    { id: 'dept-it', name: 'IT Division', code: 'IT', type: 'division', parentId: 'dept-head', active: true, createdAt: day(-500) },
    { id: 'dept-crc', name: 'Consumer Relations', code: 'CRC', type: 'section', parentId: 'dept-head', active: true, createdAt: day(-500) },
    { id: 'dept-commercial', name: 'Commercial Division', code: 'COM', type: 'section', parentId: 'dept-head', active: true, createdAt: day(-500) },
    { id: 'dept-engineering', name: 'Engineering Division', code: 'ENG', type: 'section', parentId: 'dept-head', active: true, createdAt: day(-500) },
    { id: 'dept-colombo', name: 'Colombo Area Office', code: 'COL', type: 'office', parentId: 'dept-head', active: true, createdAt: day(-500) },
    { id: 'dept-rsc', name: 'Regional Support Centre', code: 'RSC', type: 'office', parentId: 'dept-head', active: true, createdAt: day(-500) }
  ];

  const categories = [
    { id: 'cat-meter', name: 'Meter reading error', code: 'MR', parentId: null, active: true, createdAt: day(-500) },
    { id: 'cat-meter-wrong', name: 'Wrong meter reading', code: 'MR-01', parentId: 'cat-meter', active: true, createdAt: day(-500) },
    { id: 'cat-meter-estimated', name: 'Estimated reading', code: 'MR-02', parentId: 'cat-meter', active: true, createdAt: day(-500) },
    { id: 'cat-meter-change', name: 'Meter change not updated', code: 'MR-03', parentId: 'cat-meter', active: true, createdAt: day(-500) },
    { id: 'cat-billing', name: 'Billing calculation error', code: 'BL', parentId: null, active: true, createdAt: day(-500) },
    { id: 'cat-billing-tariff', name: 'Incorrect tariff applied', code: 'BL-01', parentId: 'cat-billing', active: true, createdAt: day(-500) },
    { id: 'cat-billing-arrears', name: 'Arrears calculation error', code: 'BL-02', parentId: 'cat-billing', active: true, createdAt: day(-500) },
    { id: 'cat-leak', name: 'Leakage / waste', code: 'LK', parentId: null, active: true, createdAt: day(-500) },
    { id: 'cat-leak-before', name: 'Leak before meter', code: 'LK-01', parentId: 'cat-leak', active: true, createdAt: day(-500) },
    { id: 'cat-leak-after', name: 'Leak after meter', code: 'LK-02', parentId: 'cat-leak', active: true, createdAt: day(-500) },
    { id: 'cat-ownership', name: 'Change of ownership', code: 'OW', parentId: null, active: true, createdAt: day(-500) },
    { id: 'cat-ownership-transfer', name: 'Ownership transfer', code: 'OW-01', parentId: 'cat-ownership', active: true, createdAt: day(-500) },
    { id: 'cat-ownership-name', name: 'Name correction', code: 'OW-02', parentId: 'cat-ownership', active: true, createdAt: day(-500) },
    { id: 'cat-connection', name: 'Connection issue', code: 'CN', parentId: null, active: true, createdAt: day(-500) },
    { id: 'cat-connection-illegal', name: 'Illegal connection', code: 'CN-01', parentId: 'cat-connection', active: true, createdAt: day(-500) },
    { id: 'cat-connection-reconnect', name: 'Reconnection charge', code: 'CN-02', parentId: 'cat-connection', active: true, createdAt: day(-500) },
    { id: 'cat-sewer', name: 'Sewerage charge', code: 'SW', parentId: null, active: true, createdAt: day(-500) },
    { id: 'cat-sewer-charge', name: 'Sewerage charging error', code: 'SW-01', parentId: 'cat-sewer', active: true, createdAt: day(-500) },
    { id: 'cat-other', name: 'Other', code: 'OT', parentId: null, active: true, createdAt: day(-500) },
    { id: 'cat-other-general', name: 'Other adjustment', code: 'OT-01', parentId: 'cat-other', active: true, createdAt: day(-500) }
  ];

  const files = [
    {
      id: 'file-1',
      reference: 'WBA/2026/0001',
      complaintNo: 'C-2026-0142',
      consumerName: 'Nimal Silva',
      consumerAddress: '12, Galle Road, Colombo 03',
      consumerPhone: '0771234567',
      billMonth: '2026-08',
      billAmount: 8450,
      adjustmentAmount: 3200,
      categoryId: 'cat-meter',
      subCategoryId: 'cat-meter-wrong',
      description: 'Meter reading recorded higher than the actual reading at the premises.',
      priority: 'normal',
      status: 'pending_receipt',
      currentHolderUid: 'demo-co',
      currentHolderName: 'Kasun Silva',
      currentDepartmentId: 'dept-commercial',
      registeredByUid: 'demo-crc',
      registeredByName: 'Sanduni Fernando',
      registeredAt: day(-12),
      dueDate: day(3),
      lastMovementAt: day(-2, 10, 15),
      pendingMovementId: 'mv-1-3',
      completedAt: null,
      createdAt: day(-12),
      updatedAt: day(-2, 10, 15)
    },
    {
      id: 'file-2',
      reference: 'WBA/2026/0002',
      complaintNo: 'C-2026-0158',
      consumerName: 'Kamala Perera',
      consumerAddress: '45, Temple Road, Nugegoda',
      consumerPhone: '0719876543',
      billMonth: '2026-09',
      billAmount: 15200,
      adjustmentAmount: 7800,
      categoryId: 'cat-billing',
      subCategoryId: 'cat-billing-tariff',
      description: 'Incorrect tariff category applied after the recent tariff revision.',
      priority: 'urgent',
      status: 'pending_approval',
      currentHolderUid: 'demo-oic',
      currentHolderName: 'Nimal Perera',
      currentDepartmentId: 'dept-crc',
      registeredByUid: 'demo-crc',
      registeredByName: 'Sanduni Fernando',
      registeredAt: day(-8),
      dueDate: day(2),
      lastMovementAt: day(-6, 14, 0),
      pendingMovementId: null,
      completedAt: null,
      createdAt: day(-8),
      updatedAt: day(-2)
    },
    {
      id: 'file-3',
      reference: 'WBA/2026/0003',
      complaintNo: 'C-2026-0171',
      consumerName: 'Mohamed Rizwan',
      consumerAddress: '8, Main Street, Kandy',
      consumerPhone: '0765554433',
      billMonth: '2026-07',
      billAmount: 22100,
      adjustmentAmount: 12000,
      categoryId: 'cat-billing',
      subCategoryId: 'cat-billing-arrears',
      description: 'Arrears from a previous account were transferred to the new owner.',
      priority: 'normal',
      status: 'open',
      currentHolderUid: 'demo-crc',
      currentHolderName: 'Sanduni Fernando',
      currentDepartmentId: 'dept-crc',
      registeredByUid: 'demo-crc',
      registeredByName: 'Sanduni Fernando',
      registeredAt: day(-30),
      dueDate: day(-4),
      lastMovementAt: null,
      pendingMovementId: null,
      completedAt: null,
      createdAt: day(-30),
      updatedAt: day(-30)
    },
    {
      id: 'file-4',
      reference: 'WBA/2026/0004',
      complaintNo: 'C-2026-0094',
      consumerName: 'Anoma Wijesinghe',
      consumerAddress: '102, Lake Road, Gampaha',
      consumerPhone: '0703332211',
      billMonth: '2026-06',
      billAmount: 9800,
      adjustmentAmount: 4500,
      categoryId: 'cat-leak',
      subCategoryId: 'cat-leak-after',
      description: 'Leakage after the meter caused an unusually high bill.',
      priority: 'normal',
      status: 'completed',
      currentHolderUid: 'demo-manager',
      currentHolderName: 'Ruwan Weerasinghe',
      currentDepartmentId: 'dept-head',
      registeredByUid: 'demo-crc',
      registeredByName: 'Sanduni Fernando',
      registeredAt: day(-40),
      dueDate: day(-20),
      lastMovementAt: day(-18, 11, 30),
      pendingMovementId: null,
      completedAt: day(-18, 11, 30),
      createdAt: day(-40),
      updatedAt: day(-18, 11, 30)
    },
    {
      id: 'file-5',
      reference: 'WBA/2026/0005',
      complaintNo: 'C-2026-0183',
      consumerName: 'Pradeep Kumara',
      consumerAddress: '22, Station Road, Moratuwa',
      consumerPhone: '0728889900',
      billMonth: '2026-09',
      billAmount: 11750,
      adjustmentAmount: 5000,
      categoryId: 'cat-ownership',
      subCategoryId: 'cat-ownership-transfer',
      description: 'Bill issued in the previous owner name after the property transfer.',
      priority: 'normal',
      status: 'pending_approval',
      currentHolderUid: 'demo-manager',
      currentHolderName: 'Ruwan Weerasinghe',
      currentDepartmentId: 'dept-head',
      registeredByUid: 'demo-crc',
      registeredByName: 'Sanduni Fernando',
      registeredAt: day(-20),
      dueDate: day(3),
      lastMovementAt: day(-1, 16, 0),
      pendingMovementId: null,
      completedAt: null,
      createdAt: day(-20),
      updatedAt: day(-1, 16, 0)
    },
    {
      id: 'file-6',
      reference: 'WBA/2026/0006',
      complaintNo: 'C-2026-0190',
      consumerName: 'Fathima Nazeer',
      consumerAddress: '67, Hospital Road, Kalutara',
      consumerPhone: '0754445566',
      billMonth: '2026-09',
      billAmount: 18900,
      adjustmentAmount: 9200,
      categoryId: 'cat-meter',
      subCategoryId: 'cat-meter-estimated',
      description: 'Estimated readings used for three consecutive billing cycles.',
      priority: 'urgent',
      status: 'open',
      currentHolderUid: 'demo-ae',
      currentHolderName: 'Dilani Jayasinghe',
      currentDepartmentId: 'dept-engineering',
      registeredByUid: 'demo-crc',
      registeredByName: 'Sanduni Fernando',
      registeredAt: day(-6),
      dueDate: day(1),
      lastMovementAt: day(-5, 10, 0),
      pendingMovementId: null,
      completedAt: null,
      createdAt: day(-6),
      updatedAt: day(-5, 10, 0)
    },
    {
      id: 'file-7',
      reference: 'WBA/2026/0007',
      complaintNo: 'C-2026-0201',
      consumerName: 'Chamara Senanayake',
      consumerAddress: '31, School Lane, Negombo',
      consumerPhone: '0776667788',
      billMonth: '2026-09',
      billAmount: 13400,
      adjustmentAmount: 6100,
      categoryId: 'cat-connection',
      subCategoryId: 'cat-connection-reconnect',
      description: 'Reconnection charge applied after an approved payment arrangement.',
      priority: 'normal',
      status: 'pending_receipt',
      currentHolderUid: 'demo-rsc',
      currentHolderName: 'Tharindu Bandara',
      currentDepartmentId: 'dept-rsc',
      registeredByUid: 'demo-crc',
      registeredByName: 'Sanduni Fernando',
      registeredAt: day(-15),
      dueDate: day(-1),
      lastMovementAt: day(-3, 15, 30),
      pendingMovementId: 'mv-7-2',
      completedAt: null,
      createdAt: day(-15),
      updatedAt: day(-3, 15, 30)
    }
  ];

  const movements = [
    {
      id: 'mv-1-1',
      fileId: 'file-1',
      type: 'handover',
      fromUid: 'demo-crc',
      fromName: 'Sanduni Fernando',
      fromDepartmentId: 'dept-crc',
      toUid: 'demo-oic',
      toName: 'Nimal Perera',
      toDepartmentId: 'dept-crc',
      handoverAt: day(-11, 9, 15),
      handoverByUid: 'demo-crc',
      receiptAt: day(-10, 15, 20),
      receiptByUid: 'demo-oic',
      status: 'received',
      notes: 'File sent for initial review.',
      delayReason: '',
      createdAt: day(-11, 9, 15)
    },
    {
      id: 'mv-1-2',
      fileId: 'file-1',
      type: 'handover',
      fromUid: 'demo-oic',
      fromName: 'Nimal Perera',
      fromDepartmentId: 'dept-crc',
      toUid: 'demo-co',
      toName: 'Kasun Silva',
      toDepartmentId: 'dept-commercial',
      handoverAt: day(-5, 10, 0),
      handoverByUid: 'demo-oic',
      receiptAt: day(-4, 9, 30),
      receiptByUid: 'demo-co',
      status: 'received',
      notes: 'Billing correction checked and forwarded.',
      delayReason: '',
      createdAt: day(-5, 10, 0)
    },
    {
      id: 'mv-1-3',
      fileId: 'file-1',
      type: 'handover',
      fromUid: 'demo-co',
      fromName: 'Kasun Silva',
      fromDepartmentId: 'dept-commercial',
      toUid: 'demo-ae',
      toName: 'Dilani Jayasinghe',
      toDepartmentId: 'dept-engineering',
      handoverAt: day(-2, 10, 15),
      handoverByUid: 'demo-co',
      receiptAt: null,
      receiptByUid: null,
      status: 'handed_over',
      notes: 'Engineering verification required before approval.',
      delayReason: '',
      createdAt: day(-2, 10, 15)
    },
    {
      id: 'mv-2-1',
      fileId: 'file-2',
      type: 'handover',
      fromUid: 'demo-crc',
      fromName: 'Sanduni Fernando',
      fromDepartmentId: 'dept-crc',
      toUid: 'demo-oic',
      toName: 'Nimal Perera',
      toDepartmentId: 'dept-crc',
      handoverAt: day(-7, 11, 0),
      handoverByUid: 'demo-crc',
      receiptAt: day(-6, 14, 0),
      receiptByUid: 'demo-oic',
      status: 'received',
      notes: 'Tariff revision complaint attached.',
      delayReason: '',
      createdAt: day(-7, 11, 0)
    },
    {
      id: 'mv-4-1',
      fileId: 'file-4',
      type: 'handover',
      fromUid: 'demo-crc',
      fromName: 'Sanduni Fernando',
      fromDepartmentId: 'dept-crc',
      toUid: 'demo-ae',
      toName: 'Dilani Jayasinghe',
      toDepartmentId: 'dept-engineering',
      handoverAt: day(-38, 9, 0),
      handoverByUid: 'demo-crc',
      receiptAt: day(-37, 10, 0),
      receiptByUid: 'demo-ae',
      status: 'received',
      notes: 'Site inspection requested.',
      delayReason: '',
      createdAt: day(-38, 9, 0)
    },
    {
      id: 'mv-4-2',
      fileId: 'file-4',
      type: 'handover',
      fromUid: 'demo-ae',
      fromName: 'Dilani Jayasinghe',
      fromDepartmentId: 'dept-engineering',
      toUid: 'demo-manager',
      toName: 'Ruwan Weerasinghe',
      toDepartmentId: 'dept-head',
      handoverAt: day(-25, 10, 0),
      handoverByUid: 'demo-ae',
      receiptAt: day(-24, 9, 0),
      receiptByUid: 'demo-manager',
      status: 'received',
      notes: 'Site inspection report attached.',
      delayReason: '',
      createdAt: day(-25, 10, 0)
    },
    {
      id: 'mv-4-3',
      fileId: 'file-4',
      type: 'handover',
      fromUid: 'demo-manager',
      fromName: 'Ruwan Weerasinghe',
      fromDepartmentId: 'dept-head',
      toUid: 'demo-crc',
      toName: 'Sanduni Fernando',
      toDepartmentId: 'dept-crc',
      handoverAt: day(-19, 10, 0),
      handoverByUid: 'demo-manager',
      receiptAt: day(-18, 11, 30),
      receiptByUid: 'demo-crc',
      status: 'received',
      notes: 'Approved adjustment returned for closure.',
      delayReason: '',
      createdAt: day(-19, 10, 0)
    },
    {
      id: 'mv-5-1',
      fileId: 'file-5',
      type: 'handover',
      fromUid: 'demo-crc',
      fromName: 'Sanduni Fernando',
      fromDepartmentId: 'dept-crc',
      toUid: 'demo-co',
      toName: 'Kasun Silva',
      toDepartmentId: 'dept-commercial',
      handoverAt: day(-18, 9, 30),
      handoverByUid: 'demo-crc',
      receiptAt: day(-17, 10, 0),
      receiptByUid: 'demo-co',
      status: 'received',
      notes: 'Ownership documents verified.',
      delayReason: '',
      createdAt: day(-18, 9, 30)
    },
    {
      id: 'mv-5-2',
      fileId: 'file-5',
      type: 'handover',
      fromUid: 'demo-co',
      fromName: 'Kasun Silva',
      fromDepartmentId: 'dept-commercial',
      toUid: 'demo-manager',
      toName: 'Ruwan Weerasinghe',
      toDepartmentId: 'dept-head',
      handoverAt: day(-2, 15, 0),
      handoverByUid: 'demo-co',
      receiptAt: day(-1, 16, 0),
      receiptByUid: 'demo-manager',
      status: 'received',
      notes: 'Awaiting management approval.',
      delayReason: '',
      createdAt: day(-2, 15, 0)
    },
    {
      id: 'mv-6-1',
      fileId: 'file-6',
      type: 'handover',
      fromUid: 'demo-crc',
      fromName: 'Sanduni Fernando',
      fromDepartmentId: 'dept-crc',
      toUid: 'demo-ae',
      toName: 'Dilani Jayasinghe',
      toDepartmentId: 'dept-engineering',
      handoverAt: day(-5, 9, 30),
      handoverByUid: 'demo-crc',
      receiptAt: day(-5, 10, 0),
      receiptByUid: 'demo-ae',
      status: 'received',
      notes: 'Meter inspection required urgently.',
      delayReason: '',
      createdAt: day(-5, 9, 30)
    },
    {
      id: 'mv-7-1',
      fileId: 'file-7',
      type: 'handover',
      fromUid: 'demo-crc',
      fromName: 'Sanduni Fernando',
      fromDepartmentId: 'dept-crc',
      toUid: 'demo-rsc',
      toName: 'Tharindu Bandara',
      toDepartmentId: 'dept-rsc',
      handoverAt: day(-10, 11, 0),
      handoverByUid: 'demo-crc',
      receiptAt: day(-9, 9, 0),
      receiptByUid: 'demo-rsc',
      status: 'received',
      notes: 'Regional support verification.',
      delayReason: '',
      createdAt: day(-10, 11, 0)
    },
    {
      id: 'mv-7-2',
      fileId: 'file-7',
      type: 'handover',
      fromUid: 'demo-rsc',
      fromName: 'Tharindu Bandara',
      fromDepartmentId: 'dept-rsc',
      toUid: 'demo-manager',
      toName: 'Ruwan Weerasinghe',
      toDepartmentId: 'dept-head',
      handoverAt: day(-3, 15, 30),
      handoverByUid: 'demo-rsc',
      receiptAt: null,
      receiptByUid: null,
      status: 'handed_over',
      notes: 'Sent to Head Office for final approval.',
      delayReason: 'Courier delay reported by the regional office.',
      createdAt: day(-3, 15, 30)
    }
  ];

  const approvals = [
    {
      id: 'ap-1-1',
      fileId: 'file-1',
      title: 'Commercial Officer review',
      assignedRole: 'co',
      assignedUid: 'demo-co',
      sequence: 1,
      status: 'approved',
      actionAt: day(-3, 9, 0),
      actionByUid: 'demo-co',
      actionByName: 'Kasun Silva',
      comment: 'Billing correction verified.',
      createdAt: day(-10)
    },
    {
      id: 'ap-1-2',
      fileId: 'file-1',
      title: 'Area Engineer verification',
      assignedRole: 'ae',
      assignedUid: 'demo-ae',
      sequence: 2,
      status: 'pending',
      actionAt: null,
      actionByUid: null,
      actionByName: null,
      comment: '',
      createdAt: day(-3)
    },
    {
      id: 'ap-2-1',
      fileId: 'file-2',
      title: 'OIC review',
      assignedRole: 'oic',
      assignedUid: 'demo-oic',
      sequence: 1,
      status: 'pending',
      actionAt: null,
      actionByUid: null,
      actionByName: null,
      comment: '',
      createdAt: day(-6)
    },
    {
      id: 'ap-2-2',
      fileId: 'file-2',
      title: 'Manager approval',
      assignedRole: 'manager',
      assignedUid: 'demo-manager',
      sequence: 2,
      status: 'pending',
      actionAt: null,
      actionByUid: null,
      actionByName: null,
      comment: '',
      createdAt: day(-6)
    },
    {
      id: 'ap-4-1',
      fileId: 'file-4',
      title: 'Area Engineer verification',
      assignedRole: 'ae',
      assignedUid: 'demo-ae',
      sequence: 1,
      status: 'approved',
      actionAt: day(-26, 9, 0),
      actionByUid: 'demo-ae',
      actionByName: 'Dilani Jayasinghe',
      comment: 'Leak confirmed after the meter.',
      createdAt: day(-37)
    },
    {
      id: 'ap-4-2',
      fileId: 'file-4',
      title: 'Manager approval',
      assignedRole: 'manager',
      assignedUid: 'demo-manager',
      sequence: 2,
      status: 'approved',
      actionAt: day(-20, 10, 0),
      actionByUid: 'demo-manager',
      actionByName: 'Ruwan Weerasinghe',
      comment: 'Adjustment approved.',
      createdAt: day(-24)
    },
    {
      id: 'ap-5-1',
      fileId: 'file-5',
      title: 'Manager approval',
      assignedRole: 'manager',
      assignedUid: 'demo-manager',
      sequence: 1,
      status: 'pending',
      actionAt: null,
      actionByUid: null,
      actionByName: null,
      comment: '',
      createdAt: day(-1)
    },
    {
      id: 'ap-6-1',
      fileId: 'file-6',
      title: 'Area Engineer verification',
      assignedRole: 'ae',
      assignedUid: 'demo-ae',
      sequence: 1,
      status: 'pending',
      actionAt: null,
      actionByUid: null,
      actionByName: null,
      comment: '',
      createdAt: day(-4)
    }
  ];

  const audit = [
    {
      id: 'audit-1',
      actorUid: 'demo-co',
      actorName: 'Kasun Silva',
      action: 'movement.created',
      entityType: 'file',
      entityId: 'file-1',
      details: 'Handed over WBA/2026/0001 to Dilani Jayasinghe.',
      createdAt: day(-2, 10, 15)
    },
    {
      id: 'audit-2',
      actorUid: 'demo-manager',
      actorName: 'Ruwan Weerasinghe',
      action: 'approval.approved',
      entityType: 'file',
      entityId: 'file-4',
      details: 'Approved the adjustment for WBA/2026/0004.',
      createdAt: day(-20, 10, 0)
    },
    {
      id: 'audit-3',
      actorUid: 'demo-crc',
      actorName: 'Sanduni Fernando',
      action: 'file.created',
      entityType: 'file',
      entityId: 'file-6',
      details: 'Registered WBA/2026/0006.',
      createdAt: day(-6)
    }
  ];

  return {
    version: DB_VERSION,
    meta: { fileSeq: 7 },
    users,
    departments,
    categories,
    files,
    movements,
    approvals,
    audit
  };
}

function loadDb() {
  if (memoryDb) {
    return memoryDb;
  }

  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.version === DB_VERSION) {
        memoryDb = parsed;
        return memoryDb;
      }
    }
  } catch {
    memoryDb = null;
  }

  memoryDb = buildSeed();
  persistDb();
  return memoryDb;
}

function persistDb() {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(memoryDb));
  } catch {
    // Browser storage can be unavailable in private mode; keep the in-memory copy.
  }
}

function commit(db) {
  memoryDb = db;
  persistDb();
}

function delay(value, milliseconds = 120) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), milliseconds);
  });
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function getUserRecord(db, uid) {
  return db.users.find((item) => item.uid === uid) || null;
}

function getActor() {
  const db = loadDb();
  const session = readSession();
  const base =
    (session?.user && getUserRecord(db, session.user.uid)) || getUserRecord(db, 'demo-admin');

  if (!base) {
    return {
      uid: 'demo-admin',
      displayName: 'Demo Administrator',
      role: 'admin',
      section: 'IT Division',
      office: 'Head Office'
    };
  }

  const claims = session?.claims || {};

  return {
    uid: base.uid,
    displayName: session?.user?.displayName || base.displayName,
    role: claims.role || base.role,
    section: claims.section || base.section,
    office: claims.office || base.office
  };
}

export function getDemoActor() {
  return getActor();
}

function departmentIdForActor(db, actor) {
  const match = db.departments.find(
    (department) => department.name.toLowerCase() === String(actor.section || '').toLowerCase()
  );
  return match?.id || 'dept-head';
}

function departmentName(db, id) {
  return db.departments.find((item) => item.id === id)?.name || '';
}

function categoryName(db, id) {
  return db.categories.find((item) => item.id === id)?.name || '';
}

function addAudit(db, action, entityType, entityId, details) {
  const actor = getActor();
  db.audit.unshift({
    id: newId('audit'),
    actorUid: actor.uid,
    actorName: actor.displayName,
    action,
    entityType,
    entityId,
    details,
    createdAt: nowIso()
  });
  db.audit = db.audit.slice(0, 250);
}

function decorateFile(db, file) {
  const pendingApprovals = db.approvals.filter(
    (approval) => approval.fileId === file.id && approval.status === 'pending'
  ).length;
  const totalApprovals = db.approvals.filter((approval) => approval.fileId === file.id).length;
  const category = db.categories.find((item) => item.id === file.categoryId);
  const subCategory = db.categories.find((item) => item.id === file.subCategoryId);
  const overdue =
    Boolean(file.dueDate) &&
    new Date(file.dueDate).getTime() < Date.now() &&
    !['completed', 'cancelled'].includes(file.status);

  return {
    ...file,
    categoryName: category?.name || 'Uncategorised',
    subCategoryName: subCategory?.name || '',
    currentDepartmentName: departmentName(db, file.currentDepartmentId),
    pendingApprovals,
    totalApprovals,
    overdue,
    ageDays: Math.max(
      0,
      Math.floor(
        ((file.completedAt ? new Date(file.completedAt).getTime() : Date.now()) -
          new Date(file.registeredAt).getTime()) /
          DAY
      )
    )
  };
}

function decorateApproval(db, approval) {
  const file = db.files.find((item) => item.id === approval.fileId);

  return {
    ...approval,
    fileReference: file?.reference || '',
    fileStatus: file?.status || '',
    consumerName: file?.consumerName || '',
    currentHolderName: file?.currentHolderName || '',
    currentDepartmentName: file ? departmentName(db, file.currentDepartmentId) : ''
  };
}

function canSeeApproval(actor, approval) {
  if (['admin', 'manager'].includes(actor.role)) {
    return true;
  }
  return approval.assignedUid === actor.uid || approval.assignedRole === actor.role;
}

function sortNewestFirst(left, right) {
  return new Date(right).getTime() - new Date(left).getTime();
}

export function resetDemoData() {
  memoryDb = buildSeed();
  persistDb();
  return memoryDb;
}

export function getDemoDepartments() {
  const db = loadDb();
  return delay(
    db.departments
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
  );
}

export function getDemoCategories() {
  const db = loadDb();
  return delay(
    db.categories
      .slice()
      .sort((left, right) => {
        const leftParent = left.parentId || '';
        const rightParent = right.parentId || '';
        if (leftParent !== rightParent) {
          return leftParent.localeCompare(rightParent);
        }
        return left.name.localeCompare(right.name);
      })
  );
}

export function getDemoUsers() {
  const db = loadDb();
  return delay(
    db.users
      .slice()
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
  );
}

export function listDemoFiles(filters = {}) {
  const db = loadDb();
  const search = String(filters.search || '').trim().toLowerCase();
  let files = db.files.slice();

  if (filters.status) {
    files = files.filter((file) => file.status === filters.status);
  }
  if (filters.categoryId) {
    files = files.filter((file) => file.categoryId === filters.categoryId);
  }
  if (filters.holderUid) {
    files = files.filter((file) => file.currentHolderUid === filters.holderUid);
  }

  let decorated = files.map((file) => decorateFile(db, file));

  if (filters.overdue) {
    decorated = decorated.filter((file) => file.overdue);
  }
  if (search) {
    decorated = decorated.filter((file) =>
      [
        file.reference,
        file.complaintNo,
        file.consumerName,
        file.consumerPhone,
        file.categoryName,
        file.subCategoryName,
        file.currentHolderName
      ]
        .join(' ')
        .toLowerCase()
        .includes(search)
    );
  }

  decorated.sort((left, right) => sortNewestFirst(left.registeredAt, right.registeredAt));
  return delay(decorated);
}

export function getDemoFile(fileId) {
  const db = loadDb();
  const file = db.files.find((item) => item.id === fileId);

  if (!file) {
    return Promise.reject(httpError(404, 'File not found.'));
  }

  const movements = db.movements
    .filter((movement) => movement.fileId === fileId)
    .sort((left, right) => new Date(left.handoverAt).getTime() - new Date(right.handoverAt).getTime());
  const approvals = db.approvals
    .filter((approval) => approval.fileId === fileId)
    .sort((left, right) => left.sequence - right.sequence)
    .map((approval) => decorateApproval(db, approval));

  return delay({
    ...decorateFile(db, file),
    movements,
    approvals
  });
}

export function createDemoFile(input = {}) {
  const db = loadDb();
  const actor = getActor();
  const consumerName = String(input.consumerName || '').trim();
  const description = String(input.description || '').trim();
  const categoryId = String(input.categoryId || '').trim();

  if (!consumerName) {
    return Promise.reject(httpError(400, 'Consumer name is required.'));
  }
  if (!categoryId) {
    return Promise.reject(httpError(400, 'Select an error category.'));
  }
  if (!description) {
    return Promise.reject(httpError(400, 'Complaint description is required.'));
  }

  if (!['admin', 'crc'].includes(actor.role)) {
    return Promise.reject(httpError(403, 'Only administrators and CRC staff can register files.'));
  }

  const category = db.categories.find((item) => item.id === categoryId && !item.parentId);
  if (!category) {
    return Promise.reject(httpError(400, 'Select a valid main error category.'));
  }

  const subCategoryId = String(input.subCategoryId || '');
  if (subCategoryId) {
    const subCategory = db.categories.find(
      (item) => item.id === subCategoryId && item.parentId === categoryId
    );
    if (!subCategory) {
      return Promise.reject(httpError(400, 'Select a valid subcategory.'));
    }
  }

  db.meta.fileSeq = (db.meta.fileSeq || db.files.length) + 1;
  const year = new Date().getFullYear();
  const reference = `WBA/${year}/${String(db.meta.fileSeq).padStart(4, '0')}`;
  const createdAt = nowIso();
  const dueDate = input.dueDate
    ? new Date(`${input.dueDate}T17:00:00`).toISOString()
    : new Date(Date.now() + 14 * DAY).toISOString();

  const file = {
    id: newId('file'),
    reference,
    complaintNo: String(input.complaintNo || '').trim(),
    consumerName,
    consumerAddress: String(input.consumerAddress || '').trim(),
    consumerPhone: String(input.consumerPhone || '').trim(),
    billMonth: String(input.billMonth || '').trim(),
    billAmount: Number(input.billAmount) || 0,
    adjustmentAmount: Number(input.adjustmentAmount) || 0,
    categoryId,
    subCategoryId,
    description,
    priority: input.priority === 'urgent' ? 'urgent' : 'normal',
    status: 'open',
    currentHolderUid: actor.uid,
    currentHolderName: actor.displayName,
    currentDepartmentId: departmentIdForActor(db, actor),
    registeredByUid: actor.uid,
    registeredByName: actor.displayName,
    registeredAt: createdAt,
    dueDate,
    lastMovementAt: null,
    pendingMovementId: null,
    completedAt: null,
    createdAt,
    updatedAt: createdAt
  };

  db.files.unshift(file);
  addAudit(db, 'file.created', 'file', file.id, `Registered ${reference} for ${consumerName}.`);
  commit(db);
  return delay(decorateFile(db, file));
}

export function updateDemoFile(fileId, input = {}) {
  const db = loadDb();
  const actor = getActor();
  const file = db.files.find((item) => item.id === fileId);

  if (!file) {
    return Promise.reject(httpError(404, 'File not found.'));
  }
  if (!['admin', 'crc'].includes(actor.role)) {
    return Promise.reject(httpError(403, 'Only administrators and CRC staff can edit file details.'));
  }
  if (['completed', 'cancelled'].includes(file.status)) {
    return Promise.reject(httpError(400, 'Completed or cancelled files cannot be edited.'));
  }

  const fields = [
    'complaintNo',
    'consumerName',
    'consumerAddress',
    'consumerPhone',
    'billMonth',
    'description',
    'priority'
  ];

  for (const field of fields) {
    if (input[field] !== undefined) {
      file[field] = String(input[field]).trim();
    }
  }

  if (input.billAmount !== undefined) {
    file.billAmount = Number(input.billAmount) || 0;
  }
  if (input.adjustmentAmount !== undefined) {
    file.adjustmentAmount = Number(input.adjustmentAmount) || 0;
  }
  if (input.categoryId !== undefined) {
    const category = db.categories.find((item) => item.id === input.categoryId && !item.parentId);
    if (!category) {
      return Promise.reject(httpError(400, 'Select a valid main error category.'));
    }
    file.categoryId = input.categoryId;
  }
  if (input.subCategoryId !== undefined) {
    file.subCategoryId = String(input.subCategoryId);
  }
  if (input.dueDate !== undefined) {
    file.dueDate = input.dueDate ? new Date(`${input.dueDate}T17:00:00`).toISOString() : null;
  }

  file.updatedAt = nowIso();
  addAudit(db, 'file.updated', 'file', file.id, `Updated details for ${file.reference}.`);
  commit(db);
  return delay(decorateFile(db, file));
}

export function completeDemoFile(fileId) {
  const db = loadDb();
  const actor = getActor();
  const file = db.files.find((item) => item.id === fileId);

  if (!file) {
    return Promise.reject(httpError(404, 'File not found.'));
  }
  if (!['admin', 'manager'].includes(actor.role)) {
    return Promise.reject(httpError(403, 'Only administrators and managers can close files.'));
  }
  if (file.pendingMovementId) {
    return Promise.reject(httpError(400, 'Confirm the pending receipt before closing this file.'));
  }

  file.status = 'completed';
  file.completedAt = nowIso();
  file.updatedAt = file.completedAt;
  addAudit(db, 'file.completed', 'file', file.id, `Closed ${file.reference}.`);
  commit(db);
  return delay(decorateFile(db, file));
}

export function listDemoMovements(fileId) {
  const db = loadDb();
  const movements = db.movements
    .filter((movement) => movement.fileId === fileId)
    .sort((left, right) => sortNewestFirst(left.handoverAt, right.handoverAt));
  return delay(movements);
}

export function createDemoMovement(fileId, input = {}) {
  const db = loadDb();
  const actor = getActor();
  const file = db.files.find((item) => item.id === fileId);

  if (!file) {
    return Promise.reject(httpError(404, 'File not found.'));
  }
  if (['completed', 'cancelled'].includes(file.status)) {
    return Promise.reject(httpError(400, 'Completed or cancelled files cannot be moved.'));
  }
  if (file.pendingMovementId) {
    return Promise.reject(httpError(400, 'Confirm the previous receipt before handing over again.'));
  }

  const toUid = String(input.toUid || '').trim();
  const recipient = getUserRecord(db, toUid);
  if (!recipient) {
    return Promise.reject(httpError(400, 'Select a valid recipient.'));
  }
  if (recipient.uid === actor.uid) {
    return Promise.reject(httpError(400, 'Select a different recipient.'));
  }

  const handoverAt = input.handoverAt ? new Date(input.handoverAt).toISOString() : nowIso();
  const movement = {
    id: newId('mv'),
    fileId,
    type: input.type === 'return' ? 'return' : 'handover',
    fromUid: actor.uid,
    fromName: actor.displayName,
    fromDepartmentId: departmentIdForActor(db, actor),
    toUid: recipient.uid,
    toName: recipient.displayName,
    toDepartmentId: recipient.section
      ? departmentIdForActor(db, recipient)
      : String(input.toDepartmentId || file.currentDepartmentId),
    handoverAt,
    handoverByUid: actor.uid,
    receiptAt: null,
    receiptByUid: null,
    status: 'handed_over',
    notes: String(input.notes || '').trim(),
    delayReason: String(input.delayReason || '').trim(),
    createdAt: nowIso()
  };

  db.movements.unshift(movement);
  file.status = 'pending_receipt';
  file.pendingMovementId = movement.id;
  file.lastMovementAt = handoverAt;
  file.updatedAt = nowIso();
  addAudit(
    db,
    'movement.created',
    'file',
    file.id,
    `Handed over ${file.reference} to ${recipient.displayName}.`
  );
  commit(db);
  return delay(movement);
}

export function receiveDemoMovement(fileId, movementId, input = {}) {
  const db = loadDb();
  const actor = getActor();
  const file = db.files.find((item) => item.id === fileId);
  const movement = db.movements.find((item) => item.id === movementId && item.fileId === fileId);

  if (!file || !movement) {
    return Promise.reject(httpError(404, 'Movement not found.'));
  }
  if (movement.receiptAt) {
    return Promise.reject(httpError(400, 'Receipt has already been confirmed.'));
  }
  if (!['admin', 'manager'].includes(actor.role) && actor.uid !== movement.toUid) {
    return Promise.reject(httpError(403, 'Only the intended recipient can confirm receipt.'));
  }

  const receiptAt = input.receiptAt ? new Date(input.receiptAt).toISOString() : nowIso();
  movement.receiptAt = receiptAt;
  movement.receiptByUid = actor.uid;
  movement.status = movement.type === 'return' ? 'returned' : 'received';
  if (input.notes) {
    movement.notes = [movement.notes, String(input.notes).trim()].filter(Boolean).join(' ');
  }

  const pendingApprovals = db.approvals.some(
    (approval) => approval.fileId === fileId && approval.status === 'pending'
  );

  file.currentHolderUid = movement.toUid;
  file.currentHolderName = movement.toName;
  file.currentDepartmentId = movement.toDepartmentId;
  file.pendingMovementId = null;
  file.lastMovementAt = receiptAt;
  file.updatedAt = nowIso();
  file.status =
    movement.type === 'return'
      ? 'open'
      : pendingApprovals
        ? 'pending_approval'
        : 'open';

  addAudit(
    db,
    'movement.received',
    'file',
    file.id,
    `${actor.displayName} confirmed receipt of ${file.reference}.`
  );
  commit(db);
  return delay(movement);
}

export function listDemoApprovals(filters = {}) {
  const db = loadDb();
  const actor = getActor();
  let approvals = db.approvals.slice();

  if (filters.fileId) {
    approvals = approvals.filter((approval) => approval.fileId === filters.fileId);
  }
  if (filters.status) {
    approvals = approvals.filter((approval) => approval.status === filters.status);
  }
  if (filters.mine) {
    approvals = approvals.filter((approval) => canSeeApproval(actor, approval));
  }

  approvals = approvals
    .map((approval) => decorateApproval(db, approval))
    .sort((left, right) => {
      if (left.status === 'pending' && right.status !== 'pending') {
        return -1;
      }
      if (right.status === 'pending' && left.status !== 'pending') {
        return 1;
      }
      return sortNewestFirst(left.actionAt || left.createdAt, right.actionAt || right.createdAt);
    });

  return delay(approvals);
}

export function createDemoApproval(fileId, input = {}) {
  const db = loadDb();
  const actor = getActor();
  const file = db.files.find((item) => item.id === fileId);

  if (!file) {
    return Promise.reject(httpError(404, 'File not found.'));
  }
  if (!['admin', 'crc', 'manager'].includes(actor.role)) {
    return Promise.reject(httpError(403, 'You cannot add approval steps for this file.'));
  }

  const title = String(input.title || '').trim();
  const assignedRole = String(input.assignedRole || '').trim();
  if (!title) {
    return Promise.reject(httpError(400, 'Approval title is required.'));
  }
  if (!VALID_ROLES.includes(assignedRole) || assignedRole === 'admin') {
    return Promise.reject(httpError(400, 'Select a valid approval role.'));
  }

  const existing = db.approvals.filter((approval) => approval.fileId === fileId);
  const approval = {
    id: newId('ap'),
    fileId,
    title,
    assignedRole,
    assignedUid: String(input.assignedUid || ''),
    sequence: existing.length + 1,
    status: 'pending',
    actionAt: null,
    actionByUid: null,
    actionByName: null,
    comment: '',
    createdAt: nowIso()
  };

  db.approvals.push(approval);
  if (file.status !== 'completed') {
    file.status = 'pending_approval';
    file.updatedAt = nowIso();
  }
  addAudit(db, 'approval.created', 'file', file.id, `Added approval step "${title}" to ${file.reference}.`);
  commit(db);
  return delay(decorateApproval(db, approval));
}

export function updateDemoApproval(fileId, approvalId, input = {}) {
  const db = loadDb();
  const actor = getActor();
  const file = db.files.find((item) => item.id === fileId);
  const approval = db.approvals.find((item) => item.id === approvalId && item.fileId === fileId);

  if (!file || !approval) {
    return Promise.reject(httpError(404, 'Approval step not found.'));
  }

  const allowed =
    actor.role === 'admin' ||
    approval.assignedUid === actor.uid ||
    approval.assignedRole === actor.role;

  if (!allowed) {
    return Promise.reject(httpError(403, 'This approval step is assigned to another role.'));
  }
  if (!['approved', 'returned', 'skipped'].includes(input.status)) {
    return Promise.reject(httpError(400, 'Select a valid approval action.'));
  }
  if (input.status === 'returned' && !String(input.comment || '').trim()) {
    return Promise.reject(httpError(400, 'Add a reason when returning a file.'));
  }

  approval.status = input.status;
  approval.actionAt = nowIso();
  approval.actionByUid = actor.uid;
  approval.actionByName = actor.displayName;
  approval.comment = String(input.comment || '').trim();

  const pending = db.approvals.some(
    (item) => item.fileId === fileId && item.id !== approvalId && item.status === 'pending'
  );

  file.status = pending ? 'pending_approval' : 'open';
  file.updatedAt = nowIso();
  addAudit(
    db,
    `approval.${input.status}`,
    'file',
    file.id,
    `${actor.displayName} marked "${approval.title}" as ${input.status} for ${file.reference}.`
  );
  commit(db);
  return delay(decorateApproval(db, approval));
}

export function getDemoDashboard() {
  const db = loadDb();
  const actor = getActor();
  const activeFiles = db.files.filter((file) => ACTIVE_FILE_STATUSES.includes(file.status));
  const pendingApprovals = db.approvals
    .filter((approval) => approval.status === 'pending')
    .filter((approval) => canSeeApproval(actor, approval))
    .map((approval) => decorateApproval(db, approval))
    .sort((left, right) => sortNewestFirst(left.createdAt, right.createdAt));

  const heldByMap = new Map();
  for (const file of activeFiles) {
    const key = file.currentHolderName || 'Unassigned';
    heldByMap.set(key, (heldByMap.get(key) || 0) + 1);
  }

  const categoryMap = new Map();
  for (const file of db.files) {
    const name = categoryName(db, file.categoryId) || 'Uncategorised';
    categoryMap.set(name, (categoryMap.get(name) || 0) + 1);
  }

  const decorated = db.files.map((file) => decorateFile(db, file));
  const overdueFiles = decorated
    .filter((file) => file.overdue)
    .sort((left, right) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime());
  const awaitingReceipt = decorated
    .filter((file) => file.status === 'pending_receipt')
    .sort((left, right) => sortNewestFirst(left.lastMovementAt, right.lastMovementAt));
  const ageDays = decorated
    .filter((file) => file.status !== 'cancelled')
    .map((file) => file.ageDays);
  const averageAgeDays = ageDays.length
    ? Math.round(ageDays.reduce((total, value) => total + value, 0) / ageDays.length)
    : 0;

  return delay({
    counts: {
      total: db.files.length,
      open: db.files.filter((file) => file.status === 'open').length,
      pendingReceipt: db.files.filter((file) => file.status === 'pending_receipt').length,
      pendingApproval: db.files.filter((file) => file.status === 'pending_approval').length,
      completed: db.files.filter((file) => file.status === 'completed').length,
      overdue: overdueFiles.length,
      averageAgeDays
    },
    recentFiles: decorated
      .slice()
      .sort((left, right) => sortNewestFirst(left.registeredAt, right.registeredAt))
      .slice(0, 6),
    overdueFiles: overdueFiles.slice(0, 6),
    awaitingReceipt: awaitingReceipt.slice(0, 6),
    pendingApprovals: pendingApprovals.slice(0, 6),
    heldBy: Array.from(heldByMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 8),
    categoryBreakdown: Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((left, right) => right.count - left.count)
  });
}

export function getDemoReports() {
  const db = loadDb();
  const movementsByFile = new Map();

  for (const movement of db.movements) {
    if (!movementsByFile.has(movement.fileId)) {
      movementsByFile.set(movement.fileId, []);
    }
    movementsByFile.get(movement.fileId).push(movement);
  }

  const transitDurations = [];
  const stageMap = new Map();
  const inTransit = [];

  for (const [fileId, movements] of movementsByFile.entries()) {
    const file = db.files.find((item) => item.id === fileId);
    if (!file) {
      continue;
    }

    const sorted = movements
      .slice()
      .sort((left, right) => new Date(left.handoverAt).getTime() - new Date(right.handoverAt).getTime());

    for (let index = 0; index < sorted.length; index += 1) {
      const movement = sorted[index];
      const handover = new Date(movement.handoverAt).getTime();

      if (movement.receiptAt) {
        const receipt = new Date(movement.receiptAt).getTime();
        transitDurations.push(Math.max(0, receipt - handover));

        const nextHandover = sorted[index + 1]?.handoverAt
          ? new Date(sorted[index + 1].handoverAt).getTime()
          : file.completedAt
            ? new Date(file.completedAt).getTime()
            : Date.now();
        const held = Math.max(0, nextHandover - receipt);
        const department = departmentName(db, movement.toDepartmentId) || 'Unassigned';
        const current = stageMap.get(department) || { total: 0, count: 0 };
        current.total += held;
        current.count += 1;
        stageMap.set(department, current);
      } else {
        inTransit.push({
          ...movement,
          fileReference: file.reference,
          consumerName: file.consumerName,
          daysInTransit: Math.max(0, Math.floor((Date.now() - handover) / DAY)),
          fromDepartmentName: departmentName(db, movement.fromDepartmentId),
          toDepartmentName: departmentName(db, movement.toDepartmentId)
        });
      }
    }
  }

  const statusCounts = ['open', 'pending_receipt', 'pending_approval', 'completed', 'cancelled'].map(
    (status) => ({
      status,
      count: db.files.filter((file) => file.status === status).length
    })
  );

  const categoryMap = new Map();
  for (const file of db.files) {
    const name = categoryName(db, file.categoryId) || 'Uncategorised';
    categoryMap.set(name, (categoryMap.get(name) || 0) + 1);
  }

  const holderMap = new Map();
  for (const file of db.files.filter((item) => ACTIVE_FILE_STATUSES.includes(item.status))) {
    const name = file.currentHolderName || 'Unassigned';
    const entry = holderMap.get(name) || { name, count: 0, overdue: 0 };
    entry.count += 1;
    if (file.overdue) {
      entry.overdue += 1;
    }
    holderMap.set(name, entry);
  }

  const monthlyMap = new Map();
  for (const file of db.files) {
    const date = new Date(file.registeredAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyMap.set(key, (monthlyMap.get(key) || 0) + 1);
  }

  const delayedFiles = db.files
    .map((file) => decorateFile(db, file))
    .filter((file) => file.overdue)
    .map((file) => ({
      ...file,
      daysOverdue: Math.max(
        0,
        Math.floor((Date.now() - new Date(file.dueDate).getTime()) / DAY)
      )
    }))
    .sort((left, right) => right.daysOverdue - left.daysOverdue);

  const averageTransit = transitDurations.length
    ? transitDurations.reduce((total, value) => total + value, 0) / transitDurations.length
    : 0;

  return delay({
    statusCounts,
    categoryCounts: Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((left, right) => right.count - left.count),
    holderCounts: Array.from(holderMap.values()).sort((left, right) => right.count - left.count),
    monthlyRegistrations: Array.from(monthlyMap.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((left, right) => left.month.localeCompare(right.month))
      .slice(-6),
    stageAverages: Array.from(stageMap.entries())
      .map(([name, value]) => ({
        name,
        averageMs: Math.round(value.total / value.count),
        count: value.count
      }))
      .sort((left, right) => right.averageMs - left.averageMs),
    averageTransitMs: Math.round(averageTransit),
    inTransit: inTransit.sort((left, right) => right.daysInTransit - left.daysInTransit),
    delayedFiles,
    recentAudit: db.audit.slice(0, 12)
  });
}

export function createDemoDepartment(input = {}) {
  const db = loadDb();
  const actor = getActor();
  if (actor.role !== 'admin') {
    return Promise.reject(httpError(403, 'Administrator access is required.'));
  }

  const name = String(input.name || '').trim();
  const code = String(input.code || '').trim().toUpperCase();
  if (!name || !code) {
    return Promise.reject(httpError(400, 'Department name and code are required.'));
  }
  if (db.departments.some((item) => item.code === code)) {
    return Promise.reject(httpError(409, 'A department with this code already exists.'));
  }

  const department = {
    id: newId('dept'),
    name,
    code,
    type: input.type || 'section',
    parentId: input.parentId || null,
    active: input.active !== false,
    createdAt: nowIso()
  };
  db.departments.push(department);
  addAudit(db, 'department.created', 'department', department.id, `Created department ${name}.`);
  commit(db);
  return delay(department);
}

export function updateDemoDepartment(id, input = {}) {
  const db = loadDb();
  const actor = getActor();
  if (actor.role !== 'admin') {
    return Promise.reject(httpError(403, 'Administrator access is required.'));
  }

  const department = db.departments.find((item) => item.id === id);
  if (!department) {
    return Promise.reject(httpError(404, 'Department not found.'));
  }

  if (input.name !== undefined) {
    department.name = String(input.name).trim();
  }
  if (input.code !== undefined) {
    department.code = String(input.code).trim().toUpperCase();
  }
  if (input.type !== undefined) {
    department.type = input.type;
  }
  if (input.parentId !== undefined) {
    department.parentId = input.parentId || null;
  }
  if (input.active !== undefined) {
    department.active = Boolean(input.active);
  }

  addAudit(db, 'department.updated', 'department', department.id, `Updated department ${department.name}.`);
  commit(db);
  return delay(department);
}

export function createDemoCategory(input = {}) {
  const db = loadDb();
  const actor = getActor();
  if (actor.role !== 'admin') {
    return Promise.reject(httpError(403, 'Administrator access is required.'));
  }

  const name = String(input.name || '').trim();
  const code = String(input.code || '').trim().toUpperCase();
  if (!name || !code) {
    return Promise.reject(httpError(400, 'Category name and code are required.'));
  }
  if (db.categories.some((item) => item.code === code)) {
    return Promise.reject(httpError(409, 'A category with this code already exists.'));
  }

  const parentId = input.parentId || null;
  if (parentId) {
    const parent = db.categories.find((item) => item.id === parentId && !item.parentId);
    if (!parent) {
      return Promise.reject(httpError(400, 'Select a valid main category.'));
    }
  }

  const category = {
    id: newId('cat'),
    name,
    code,
    parentId,
    active: input.active !== false,
    createdAt: nowIso()
  };
  db.categories.push(category);
  addAudit(db, 'category.created', 'category', category.id, `Created category ${name}.`);
  commit(db);
  return delay(category);
}

export function updateDemoCategory(id, input = {}) {
  const db = loadDb();
  const actor = getActor();
  if (actor.role !== 'admin') {
    return Promise.reject(httpError(403, 'Administrator access is required.'));
  }

  const category = db.categories.find((item) => item.id === id);
  if (!category) {
    return Promise.reject(httpError(404, 'Category not found.'));
  }

  if (input.name !== undefined) {
    category.name = String(input.name).trim();
  }
  if (input.code !== undefined) {
    category.code = String(input.code).trim().toUpperCase();
  }
  if (input.active !== undefined) {
    category.active = Boolean(input.active);
  }

  addAudit(db, 'category.updated', 'category', category.id, `Updated category ${category.name}.`);
  commit(db);
  return delay(category);
}

export function createDemoUser(input = {}) {
  const db = loadDb();
  const actor = getActor();
  if (actor.role !== 'admin') {
    return Promise.reject(httpError(403, 'Administrator access is required.'));
  }

  const email = String(input.email || '').trim().toLowerCase();
  const displayName = String(input.displayName || '').trim();
  const role = input.role || 'staff';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Promise.reject(httpError(400, 'Enter a valid email address.'));
  }
  if (!displayName) {
    return Promise.reject(httpError(400, 'Full name is required.'));
  }
  if (!VALID_ROLES.includes(role)) {
    return Promise.reject(httpError(400, 'Select a valid role.'));
  }
  if (db.users.some((item) => item.email.toLowerCase() === email)) {
    return Promise.reject(httpError(409, 'An account with this email already exists.'));
  }

  const user = {
    uid: newId('demo-user'),
    email,
    username: String(input.username || email.split('@')[0]).trim(),
    displayName,
    role,
    section: String(input.section || '').trim(),
    office: String(input.office || '').trim(),
    active: input.active !== false,
    createdAt: nowIso(),
    lastSignInTime: null
  };
  db.users.push(user);
  addAudit(db, 'user.created', 'user', user.uid, `Created staff account for ${displayName}.`);
  commit(db);
  return delay(user);
}

export function updateDemoUser(uid, input = {}) {
  const db = loadDb();
  const actor = getActor();
  if (actor.role !== 'admin') {
    return Promise.reject(httpError(403, 'Administrator access is required.'));
  }

  const user = db.users.find((item) => item.uid === uid);
  if (!user) {
    return Promise.reject(httpError(404, 'User account not found.'));
  }
  if (uid === actor.uid) {
    if (input.role !== undefined && input.role !== 'admin') {
      return Promise.reject(httpError(400, 'You cannot remove your own administrator role.'));
    }
    if (input.active === false) {
      return Promise.reject(httpError(400, 'You cannot disable your own account.'));
    }
  }
  if (input.role !== undefined && !VALID_ROLES.includes(input.role)) {
    return Promise.reject(httpError(400, 'Select a valid role.'));
  }
  if (input.displayName !== undefined && !String(input.displayName).trim()) {
    return Promise.reject(httpError(400, 'Full name is required.'));
  }

  for (const field of ['displayName', 'section', 'office', 'username']) {
    if (input[field] !== undefined) {
      user[field] = String(input[field]).trim();
    }
  }
  if (input.role !== undefined) {
    user.role = input.role;
  }
  if (input.active !== undefined) {
    user.active = Boolean(input.active);
  }

  addAudit(db, 'user.updated', 'user', user.uid, `Updated staff account ${user.displayName}.`);
  commit(db);
  return delay(user);
}

export function resetDemoUserPassword(uid) {
  const db = loadDb();
  const actor = getActor();
  if (actor.role !== 'admin') {
    return Promise.reject(httpError(403, 'Administrator access is required.'));
  }

  const user = db.users.find((item) => item.uid === uid);
  if (!user) {
    return Promise.reject(httpError(404, 'User account not found.'));
  }

  return delay({
    email: user.email,
    resetLink: '',
    message: 'Demo mode does not send email. Use the demo login with any password.'
  });
}
