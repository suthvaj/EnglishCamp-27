import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  CampEvent,
  Student,
  PartnerRequest,
  Room,
  RoomMember,
  ActivityLog,
  RoomingMode,
  EventStatus
} from '../types';
import { hashPin, generateSalt } from './crypto';

export const DEFAULT_EVENT_ID = 'eng-camp-2027';

// -------------------------------------------------------------
// SEED DEFAULT EVENT & SAMPLE STUDENTS
// -------------------------------------------------------------
export async function ensureDefaultEventAndSeed(): Promise<CampEvent> {
  const eventRef = doc(db, 'events', DEFAULT_EVENT_ID);
  const snap = await getDoc(eventRef).catch(err => {
    handleFirestoreError(err, OperationType.GET, `events/${DEFAULT_EVENT_ID}`);
  });

  if (snap.exists()) {
    return snap.data() as CampEvent;
  }

  // Create default event
  const defaultEvent: CampEvent = {
    id: DEFAULT_EVENT_ID,
    name: 'English Camp 2027: Global Communication & Leadership',
    academicYear: '2570',
    description: 'ค่ายภาษาอังกฤษประจำปีการศึกษา 2570 สำหรับนักเรียนชั้นมัธยมศึกษาปีที่ 3 ณ เขาใหญ่',
    status: 'open_selection',
    selectionStartDate: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    selectionEndDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    responseEndDate: new Date(Date.now() + 8 * 24 * 3600 * 1000).toISOString(),
    maxChoices: 3,
    minChoices: 1,
    allowEditChoices: true,
    allowRejectRequests: true,
    roomingMode: 'pair', // Default is 2 persons, admin can change to 3, 4, custom, or flexible
    targetCapacity: 2,
    maxCapacity: 2,
    minCapacity: 2,
    allowPartialLastRoom: true,
    allowUnevenRooms: true,
    requireAllMemberConsent: false,
    assignmentMethod: 'hybrid',
    isTrialMode: true, // Default begins in Trial mode with mock data
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(eventRef, defaultEvent);
    await logActivity(DEFAULT_EVENT_ID, 'สร้างกิจกรรมค่ายภาษาอังกฤษ 2570', 'event', 'สร้างกิจกรรมเริ่มต้นพร้อมการตั้งค่า', 'system');

    // Seed realistic sample students in 2 classrooms (ม.3/4 and ม.3/5)
    // All sample students have default PIN: "1234"
    const salt = generateSalt();
    const pinHash = await hashPin('1234', salt);

    const sampleStudents: Omit<Student, 'id'>[] = [
      // ห้อง ม.3/4 (ชาย 5 คน, หญิง 5 คน)
      { studentId: '10001', prefix: 'เด็กชาย', firstName: 'กิตติศักดิ์', lastName: 'รักการเรียน', classRoom: 'ม.3/4', studentNo: 1, gender: 'ชาย', isDemo: true, pinHash, pinSalt: salt, mustChangePin: false, failedPinAttempts: 0, isLocked: false, isEligible: true, eventId: DEFAULT_EVENT_ID, hasSubmittedChoices: false },
      { studentId: '10002', prefix: 'เด็กชาย', firstName: 'ธนกฤต', lastName: 'มั่นคงประเสริฐ', classRoom: 'ม.3/4', studentNo: 2, gender: 'ชาย', isDemo: true, pinHash, pinSalt: salt, mustChangePin: false, failedPinAttempts: 0, isLocked: false, isEligible: true, eventId: DEFAULT_EVENT_ID, hasSubmittedChoices: false },
      { studentId: '10003', prefix: 'เด็กชาย', firstName: 'ปัณณวิชญ์', lastName: 'วิบูลย์สุข', classRoom: 'ม.3/4', studentNo: 3, gender: 'ชาย', isDemo: true, pinHash, pinSalt: salt, mustChangePin: false, failedPinAttempts: 0, isLocked: false, isEligible: true, eventId: DEFAULT_EVENT_ID, hasSubmittedChoices: false },
      { studentId: '10004', prefix: 'เด็กชาย', firstName: 'วรเมธ', lastName: 'เจริญผลพิพัฒน์', classRoom: 'ม.3/4', studentNo: 4, gender: 'ชาย', isDemo: true, pinHash, pinSalt: salt, mustChangePin: false, failedPinAttempts: 0, isLocked: false, isEligible: true, eventId: DEFAULT_EVENT_ID, hasSubmittedChoices: false },
      { studentId: '10005', prefix: 'เด็กชาย', firstName: 'ศุภกฤต', lastName: 'สถิตพงษ์', classRoom: 'ม.3/4', studentNo: 5, gender: 'ชาย', isDemo: true, pinHash, pinSalt: salt, mustChangePin: false, failedPinAttempts: 0, isLocked: false, isEligible: true, eventId: DEFAULT_EVENT_ID, hasSubmittedChoices: false },
      { studentId: '10006', prefix: 'เด็กหญิง', firstName: 'พิมพ์มาดา', lastName: 'สิริรัตนากุล', classRoom: 'ม.3/4', studentNo: 6, gender: 'หญิง', isDemo: true, pinHash, pinSalt: salt, mustChangePin: false, failedPinAttempts: 0, isLocked: false, isEligible: true, eventId: DEFAULT_EVENT_ID, hasSubmittedChoices: false },
      { studentId: '10007', prefix: 'เด็กหญิง', firstName: 'ศศิธร', lastName: 'งามสง่าวัฒนา', classRoom: 'ม.3/4', studentNo: 7, gender: 'หญิง', isDemo: true, pinHash, pinSalt: salt, mustChangePin: false, failedPinAttempts: 0, isLocked: false, isEligible: true, eventId: DEFAULT_EVENT_ID, hasSubmittedChoices: false },
      { studentId: '10008', prefix: 'เด็กหญิง', firstName: 'ณิชาภัทร', lastName: 'เกตุแก้วพิสุทธิ์', classRoom: 'ม.3/4', studentNo: 8, gender: 'หญิง', isDemo: true, pinHash, pinSalt: salt, mustChangePin: false, failedPinAttempts: 0, isLocked: false, isEligible: true, eventId: DEFAULT_EVENT_ID, hasSubmittedChoices: false },
      { studentId: '10009', prefix: 'เด็กหญิง', firstName: 'ชัญญา', lastName: 'บริบูรณ์กิจ', classRoom: 'ม.3/4', studentNo: 9, gender: 'หญิง', isDemo: true, pinHash, pinSalt: salt, mustChangePin: false, failedPinAttempts: 0, isLocked: false, isEligible: true, eventId: DEFAULT_EVENT_ID, hasSubmittedChoices: false },
      { studentId: '10010', prefix: 'เด็กหญิง', firstName: 'พิชญา', lastName: 'สมประสงค์', classRoom: 'ม.3/4', studentNo: 10, gender: 'หญิง', isDemo: true, pinHash, pinSalt: salt, mustChangePin: false, failedPinAttempts: 0, isLocked: false, isEligible: true, eventId: DEFAULT_EVENT_ID, hasSubmittedChoices: false },

      // ห้อง ม.3/5 (ชาย 4 คน, หญิง 4 คน)
      { studentId: '10011', prefix: 'เด็กชาย', firstName: 'กรวิชญ์', lastName: 'ธนารัตน์', classRoom: 'ม.3/5', studentNo: 1, gender: 'ชาย', isDemo: true, pinHash, pinSalt: salt, mustChangePin: false, failedPinAttempts: 0, isLocked: false, isEligible: true, eventId: DEFAULT_EVENT_ID, hasSubmittedChoices: false },
      { studentId: '10012', prefix: 'เด็กชาย', firstName: 'ภาคิน', lastName: 'ดวงสว่าง', classRoom: 'ม.3/5', studentNo: 2, gender: 'ชาย', isDemo: true, pinHash, pinSalt: salt, mustChangePin: false, failedPinAttempts: 0, isLocked: false, isEligible: true, eventId: DEFAULT_EVENT_ID, hasSubmittedChoices: false },
      { studentId: '10013', prefix: 'เด็กชาย', firstName: 'ณัฏฐ์', lastName: 'เลิศวิริยะกุล', classRoom: 'ม.3/5', studentNo: 3, gender: 'ชาย', isDemo: true, pinHash, pinSalt: salt, mustChangePin: false, failedPinAttempts: 0, isLocked: false, isEligible: true, eventId: DEFAULT_EVENT_ID, hasSubmittedChoices: false },
      { studentId: '10014', prefix: 'เด็กชาย', firstName: 'ภูริช', lastName: 'เตชะวัฒน์', classRoom: 'ม.3/5', studentNo: 4, gender: 'ชาย', isDemo: true, pinHash, pinSalt: salt, mustChangePin: false, failedPinAttempts: 0, isLocked: false, isEligible: true, eventId: DEFAULT_EVENT_ID, hasSubmittedChoices: false },
      { studentId: '10015', prefix: 'เด็กหญิง', firstName: 'กัญญารัตน์', lastName: 'บุญญาภิรมย์', classRoom: 'ม.3/5', studentNo: 5, gender: 'หญิง', isDemo: true, pinHash, pinSalt: salt, mustChangePin: false, failedPinAttempts: 0, isLocked: false, isEligible: true, eventId: DEFAULT_EVENT_ID, hasSubmittedChoices: false },
      { studentId: '10016', prefix: 'เด็กหญิง', firstName: 'รินรดา', lastName: 'พิทยานุกูล', classRoom: 'ม.3/5', studentNo: 6, gender: 'หญิง', isDemo: true, pinHash, pinSalt: salt, mustChangePin: false, failedPinAttempts: 0, isLocked: false, isEligible: true, eventId: DEFAULT_EVENT_ID, hasSubmittedChoices: false },
      { studentId: '10017', prefix: 'เด็กหญิง', firstName: 'อภิชญา', lastName: 'โชคธนเกียรติ', classRoom: 'ม.3/5', studentNo: 7, gender: 'หญิง', isDemo: true, pinHash, pinSalt: salt, mustChangePin: false, failedPinAttempts: 0, isLocked: false, isEligible: true, eventId: DEFAULT_EVENT_ID, hasSubmittedChoices: false },
      { studentId: '10018', prefix: 'เด็กหญิง', firstName: 'ญาณิศา', lastName: 'ชัชวาลทิพย์', classRoom: 'ม.3/5', studentNo: 8, gender: 'หญิง', isDemo: true, pinHash, pinSalt: salt, mustChangePin: false, failedPinAttempts: 0, isLocked: false, isEligible: true, eventId: DEFAULT_EVENT_ID, hasSubmittedChoices: false },
    ];

    const batch = writeBatch(db);
    for (const stu of sampleStudents) {
      const stuRef = doc(collection(db, 'events', DEFAULT_EVENT_ID, 'students'));
      batch.set(stuRef, { ...stu, id: stuRef.id, createdAt: new Date().toISOString() });
    }
    await batch.commit();
    await logActivity(DEFAULT_EVENT_ID, 'นำเข้ารายชื่อนักเรียนเริ่มต้น 18 คน (ม.3/4 และ ม.3/5)', 'import', 'สร้างข้อมูลตัวอย่างพร้อม PIN 1234 เพื่อทดสอบระบบ', 'system');
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `events/${DEFAULT_EVENT_ID}`);
  }

  return defaultEvent;
}

// -------------------------------------------------------------
// EVENT OPERATIONS
// -------------------------------------------------------------
export function subscribeEvent(eventId: string, callback: (event: CampEvent | null) => void) {
  const eventRef = doc(db, 'events', eventId);
  return onSnapshot(eventRef, snap => {
    if (snap.exists()) {
      callback({ ...snap.data(), id: snap.id } as CampEvent);
    } else {
      callback(null);
    }
  }, err => {
    handleFirestoreError(err, OperationType.GET, `events/${eventId}`);
  });
}

export async function updateEventSettings(
  eventId: string,
  updates: Partial<CampEvent>,
  performedBy = 'admin'
): Promise<void> {
  const eventRef = doc(db, 'events', eventId);
  try {
    await updateDoc(eventRef, { ...updates, updatedAt: new Date().toISOString() });
    await logActivity(
      eventId,
      'แก้ไขการตั้งค่ากิจกรรม',
      'event',
      `ปรับปรุงการตั้งค่า: ${Object.keys(updates).join(', ')}`,
      performedBy
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `events/${eventId}`);
  }
}

// -------------------------------------------------------------
// CHANGE ROOMING MODE & CAPACITY (ข้อกำหนดสำคัญ)
// -------------------------------------------------------------
export async function updateRoomingModeAndCapacity(
  eventId: string,
  roomingMode: RoomingMode,
  targetCapacity: number,
  options: {
    maxCapacity?: number;
    minCapacity?: number;
    allowPartialLastRoom?: boolean;
    requireAllMemberConsent?: boolean;
  },
  performedBy = 'admin'
): Promise<{ affectedRoomsCount: number; affectedRequestsCount: number }> {
  const eventRef = doc(db, 'events', eventId);
  
  // 1. Fetch current rooms and requests to calculate impact
  const roomsSnap = await getDocs(collection(db, 'events', eventId, 'rooms'));
  const requestsSnap = await getDocs(collection(db, 'events', eventId, 'requests'));

  const affectedRoomsCount = roomsSnap.size;
  const affectedRequestsCount = requestsSnap.size;

  const updates: Partial<CampEvent> = {
    roomingMode,
    targetCapacity,
    maxCapacity: options.maxCapacity ?? targetCapacity,
    minCapacity: options.minCapacity ?? Math.min(2, targetCapacity),
    allowPartialLastRoom: options.allowPartialLastRoom ?? true,
    requireAllMemberConsent: options.requireAllMemberConsent ?? (targetCapacity > 2),
    updatedAt: new Date().toISOString(),
  };

  try {
    await updateDoc(eventRef, updates);
    await logActivity(
      eventId,
      `เปลี่ยนรูปแบบการจัดห้องเป็น ${roomingMode} (ความจุ ${targetCapacity} คน/ห้อง)`,
      'room',
      `เปลี่ยนรูปแบบห้อง: ${roomingMode}, เป้าหมาย: ${targetCapacity} คน/ห้อง (ห้องที่ได้รับผลกระทบ: ${affectedRoomsCount}, คำขอ: ${affectedRequestsCount}) ไม่สูญเสียประวัติเดิม`,
      performedBy
    );
    return { affectedRoomsCount, affectedRequestsCount };
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `events/${eventId}`);
  }
}

// -------------------------------------------------------------
// STUDENT DIRECTORY & AUTH OPERATIONS
// -------------------------------------------------------------
export function subscribeStudents(eventId: string, callback: (students: Student[]) => void) {
  const studentsRef = collection(db, 'events', eventId, 'students');
  return onSnapshot(studentsRef, snap => {
    const students = snap.docs.map(d => ({ ...d.data(), id: d.id } as Student));
    callback(students);
  }, err => {
    handleFirestoreError(err, OperationType.GET, `events/${eventId}/students`);
  });
}

export async function findStudentByStudentId(eventId: string, studentId: string): Promise<Student | null> {
  const q = query(
    collection(db, 'events', eventId, 'students'),
    where('studentId', '==', studentId.trim())
  );
  try {
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const docData = snap.docs[0];
    return { ...docData.data(), id: docData.id } as Student;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `events/${eventId}/students`);
  }
}

export async function updateStudentPin(
  eventId: string,
  studentDocId: string,
  newPin: string,
  mustChangePin = false
): Promise<void> {
  const salt = generateSalt();
  const pinHash = await hashPin(newPin, salt);
  const studentRef = doc(db, 'events', eventId, 'students', studentDocId);

  try {
    await updateDoc(studentRef, {
      pinHash,
      pinSalt: salt,
      mustChangePin,
      failedPinAttempts: 0,
      isLocked: false,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `events/${eventId}/students/${studentDocId}`);
  }
}

export async function addOrUpdateStudent(
  eventId: string,
  studentData: Omit<Student, 'id'>,
  existingDocId?: string
): Promise<string> {
  try {
    if (existingDocId) {
      const studentRef = doc(db, 'events', eventId, 'students', existingDocId);
      await updateDoc(studentRef, { ...studentData, updatedAt: new Date().toISOString() });
      return existingDocId;
    } else {
      const studentRef = doc(collection(db, 'events', eventId, 'students'));
      const id = studentRef.id;
      let pinHash = studentData.pinHash;
      let pinSalt = studentData.pinSalt;
      if (!pinHash) {
        pinSalt = generateSalt();
        pinHash = await hashPin('1234', pinSalt);
      }
      await setDoc(studentRef, {
        ...studentData,
        id,
        pinHash,
        pinSalt,
        mustChangePin: studentData.mustChangePin ?? true,
        failedPinAttempts: 0,
        isLocked: false,
        eventId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return id;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `events/${eventId}/students`);
  }
}

export async function purgeTrialAndMockData(
  eventId: string,
  performedBy = 'admin'
): Promise<{ deletedStudentsCount: number; deletedRoomsCount: number }> {
  // 1. Find all demo students (isDemo == true or mock studentIds 10001-10018)
  const studentsSnap = await getDocs(collection(db, 'events', eventId, 'students'));
  const demoStudentDocIds = new Set<string>();
  const mockIdList = ['10001', '10002', '10003', '10004', '10005', '10006', '10007', '10008', '10009', '10010', '10011', '10012', '10013', '10014', '10015', '10016', '10017', '10018'];

  const studentBatch = writeBatch(db);
  studentsSnap.forEach(d => {
    const data = d.data() as Student;
    if (data.isDemo || mockIdList.includes(data.studentId)) {
      demoStudentDocIds.add(d.id);
      studentBatch.delete(d.ref);
    }
  });

  // 2. Delete any partner requests involving these demo students
  const requestsSnap = await getDocs(collection(db, 'events', eventId, 'requests'));
  const reqBatch = writeBatch(db);
  requestsSnap.forEach(d => {
    const req = d.data() as PartnerRequest;
    if (demoStudentDocIds.has(req.senderId) || demoStudentDocIds.has(req.receiverId)) {
      reqBatch.delete(d.ref);
    }
  });

  // 3. Delete any demo rooms
  const roomsSnap = await getDocs(collection(db, 'events', eventId, 'rooms'));
  const roomBatch = writeBatch(db);
  let deletedRoomsCount = 0;
  for (const rDoc of roomsSnap.docs) {
    const memSnap = await getDocs(collection(db, 'events', eventId, 'rooms', rDoc.id, 'members'));
    const hasDemoMember = memSnap.docs.some(m => demoStudentDocIds.has((m.data() as RoomMember).studentDocId));
    if (hasDemoMember || rDoc.data().notes?.includes('สร้างจากระบบเสนออัตโนมัติ') || rDoc.data().roomNumber?.startsWith('Pair-')) {
      memSnap.forEach(m => roomBatch.delete(m.ref));
      roomBatch.delete(rDoc.ref);
      deletedRoomsCount++;
    }
  }

  // 4. Update Event: disable trial mode
  const eventRef = doc(db, 'events', eventId);
  const eventBatch = writeBatch(db);
  eventBatch.update(eventRef, {
    isTrialMode: false,
    updatedAt: new Date().toISOString(),
  });

  // Commit batches
  await studentBatch.commit();
  await reqBatch.commit();
  await roomBatch.commit();
  await eventBatch.commit();

  await logActivity(
    eventId,
    `หยุดโหมดทดลองใช้ (Trial Mode) และล้าง Mock Data ทั้งหมด (${demoStudentDocIds.size} คน)`,
    'event',
    'ล้างข้อมูลนักเรียนและห้องพักตัวอย่างทั้งหมดเพื่อเริ่มใช้งานจริง',
    performedBy
  );

  return {
    deletedStudentsCount: demoStudentDocIds.size,
    deletedRoomsCount,
  };
}

// -------------------------------------------------------------
// CLEAR ROOMS & REQUESTS ONLY (Keep Students)
// -------------------------------------------------------------
export async function clearAllRoomsAndRequests(
  eventId: string,
  performedBy = 'admin'
): Promise<void> {
  // 1. Delete all rooms and their subcollection members
  const roomsSnap = await getDocs(collection(db, 'events', eventId, 'rooms'));
  for (const rDoc of roomsSnap.docs) {
    const memSnap = await getDocs(collection(db, 'events', eventId, 'rooms', rDoc.id, 'members'));
    const memBatch = writeBatch(db);
    memSnap.forEach(m => memBatch.delete(m.ref));
    memBatch.delete(rDoc.ref);
    await memBatch.commit();
  }

  // 2. Delete all partner requests
  const requestsSnap = await getDocs(collection(db, 'events', eventId, 'requests'));
  const reqBatch = writeBatch(db);
  requestsSnap.forEach(r => reqBatch.delete(r.ref));
  await reqBatch.commit();

  // 3. Reset students hasSubmittedChoices
  const studentsSnap = await getDocs(collection(db, 'events', eventId, 'students'));
  const stuBatch = writeBatch(db);
  studentsSnap.forEach(s => {
    stuBatch.update(s.ref, {
      hasSubmittedChoices: false,
      updatedAt: new Date().toISOString(),
    });
  });
  await stuBatch.commit();

  await logActivity(
    eventId,
    'ล้างห้องพักและคำขอทั้งหมด (คงรายชื่อนักเรียนไว้)',
    'room',
    'รีเซ็ตผลการจัดห้องและคำขอทั้งหมด เพื่อเริ่มเปิดรับเลือกใหม่',
    performedBy
  );
}

// -------------------------------------------------------------
// WIPE ALL DATA COMPLETELY (Fresh Slate)
// -------------------------------------------------------------
export async function wipeAllCampData(
  eventId: string,
  performedBy = 'admin'
): Promise<{ studentsCount: number; roomsCount: number; requestsCount: number }> {
  // 1. Delete all rooms and their subcollection members
  const roomsSnap = await getDocs(collection(db, 'events', eventId, 'rooms'));
  for (const rDoc of roomsSnap.docs) {
    const memSnap = await getDocs(collection(db, 'events', eventId, 'rooms', rDoc.id, 'members'));
    const memBatch = writeBatch(db);
    memSnap.forEach(m => memBatch.delete(m.ref));
    memBatch.delete(rDoc.ref);
    await memBatch.commit();
  }

  // 2. Delete all partner requests
  const requestsSnap = await getDocs(collection(db, 'events', eventId, 'requests'));
  const reqBatch = writeBatch(db);
  requestsSnap.forEach(r => reqBatch.delete(r.ref));
  await reqBatch.commit();

  // 3. Delete all students
  const studentsSnap = await getDocs(collection(db, 'events', eventId, 'students'));
  const stuBatch = writeBatch(db);
  studentsSnap.forEach(s => stuBatch.delete(s.ref));
  await stuBatch.commit();

  // 4. Update Event: clean state, disable trial mode
  const eventRef = doc(db, 'events', eventId);
  await updateDoc(eventRef, {
    isTrialMode: false,
    updatedAt: new Date().toISOString(),
  });

  await logActivity(
    eventId,
    'ล้างข้อมูลระบบทั้งหมด (Factory Reset / Clean Slate)',
    'event',
    `ลบนักเรียนทั้งหมด ${studentsSnap.size} คน, ห้องพัก ${roomsSnap.size} ห้อง, และคำขอ ${requestsSnap.size} รายการ`,
    performedBy
  );

  return {
    studentsCount: studentsSnap.size,
    roomsCount: roomsSnap.size,
    requestsCount: requestsSnap.size,
  };
}

export async function batchImportStudents(
  eventId: string,
  students: Omit<Student, 'id'>[],
  clearTrialData = true
): Promise<number> {
  if (clearTrialData) {
    await purgeTrialAndMockData(eventId, 'admin');
  }

  const batch = writeBatch(db);
  const defaultSalt = generateSalt();
  const defaultPinHash = await hashPin('1234', defaultSalt);

  for (const stu of students) {
    const studentRef = doc(collection(db, 'events', eventId, 'students'));
    batch.set(studentRef, {
      ...stu,
      id: studentRef.id,
      pinHash: stu.pinHash || defaultPinHash,
      pinSalt: stu.pinSalt || defaultSalt,
      mustChangePin: true,
      failedPinAttempts: 0,
      isLocked: false,
      isEligible: true,
      isDemo: false,
      eventId,
      hasSubmittedChoices: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  try {
    await batch.commit();
    await logActivity(
      eventId,
      `นำเข้านักเรียน ${students.length} คน จากไฟล์ Excel สำเร็จ`,
      'import',
      `นำเข้าสำเร็จจำนวน ${students.length} รายการ (โหมดใช้งานจริง)`,
      'admin'
    );
    return students.length;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `events/${eventId}/students`);
  }
}

// -------------------------------------------------------------
// PARTNER SELECTION & MULTI-REQUEST SUBMISSION (4.1 & 4.2)
// -------------------------------------------------------------
export async function submitStudentPreferences(
  eventId: string,
  sender: Student,
  rankedReceivers: Student[] // 1st, 2nd, 3rd choice
): Promise<void> {
  // Backend validation:
  // 1. Same classroom only
  for (const receiver of rankedReceivers) {
    if (receiver.classRoom !== sender.classRoom) {
      throw new Error(`ไม่อนุญาตให้เลือกข้ามห้องเรียน (${receiver.firstName} อยู่ ${receiver.classRoom} ขณะที่คุณอยู่ ${sender.classRoom})`);
    }
    if (receiver.id === sender.id) {
      throw new Error('ห้ามเลือกตนเองเป็นคู่นอน');
    }
  }

  // 2. No duplicates
  const ids = rankedReceivers.map(r => r.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error('ห้ามเลือกบุคคลเดิมซ้ำในหลายลำดับ');
  }

  // 3. Delete or cancel old outgoing requests from this student
  const oldRequestsQuery = query(
    collection(db, 'events', eventId, 'requests'),
    where('senderId', '==', sender.id)
  );
  const oldSnap = await getDocs(oldRequestsQuery);
  const batch = writeBatch(db);

  oldSnap.forEach(d => {
    // If request was pending, we delete or cancel it
    batch.delete(d.ref);
  });

  // 4. Create new requests simultaneously for all ranked choices
  const now = new Date().toISOString();
  rankedReceivers.forEach((receiver, idx) => {
    const reqRef = doc(collection(db, 'events', eventId, 'requests'));
    const newReq: PartnerRequest = {
      id: reqRef.id,
      eventId,
      senderId: sender.id,
      senderStudentId: sender.studentId,
      senderName: `${sender.prefix}${sender.firstName} ${sender.lastName}`,
      senderClassRoom: sender.classRoom,
      senderStudentNo: sender.studentNo,
      receiverId: receiver.id,
      receiverStudentId: receiver.studentId,
      receiverName: `${receiver.prefix}${receiver.firstName} ${receiver.lastName}`,
      receiverClassRoom: receiver.classRoom,
      receiverStudentNo: receiver.studentNo,
      preferenceRank: idx + 1, // 1, 2, 3
      status: 'pending',
      createdAt: now,
    };
    batch.set(reqRef, newReq);
  });

  // 5. Update sender hasSubmittedChoices
  const senderRef = doc(db, 'events', eventId, 'students', sender.id);
  batch.update(senderRef, {
    hasSubmittedChoices: true,
    updatedAt: now,
  });

  try {
    await batch.commit();
    await logActivity(
      eventId,
      `${sender.firstName} ส่งตัวเลือกคู่นอน ${rankedReceivers.length} ลำดับ`,
      'request',
      `ส่งคำขอพร้อมกันไปยัง: ${rankedReceivers.map(r => r.firstName).join(', ')}`,
      sender.studentId
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `events/${eventId}/requests`);
  }
}

// -------------------------------------------------------------
// REALTIME REQUESTS SUBSCRIPTION
// -------------------------------------------------------------
export function subscribeAllRequests(eventId: string, callback: (requests: PartnerRequest[]) => void) {
  const requestsRef = collection(db, 'events', eventId, 'requests');
  return onSnapshot(requestsRef, snap => {
    const reqs = snap.docs.map(d => ({ ...d.data(), id: d.id } as PartnerRequest));
    callback(reqs);
  }, err => {
    handleFirestoreError(err, OperationType.GET, `events/${eventId}/requests`);
  });
}

// -------------------------------------------------------------
// RESPONDING TO PARTNER REQUEST (SECTION 5.1 RULES A, B, C)
// -------------------------------------------------------------
export async function respondToPartnerRequest(
  eventId: string,
  requestId: string,
  accept: boolean,
  responder: Student,
  event: CampEvent
): Promise<{ success: boolean; message: string }> {
  const reqRef = doc(db, 'events', eventId, 'requests', requestId);
  const reqSnap = await getDoc(reqRef);
  if (!reqSnap.exists()) {
    throw new Error('ไม่พบคำขอนี้ในระบบ');
  }

  const req = reqSnap.data() as PartnerRequest;
  if (req.receiverId !== responder.id) {
    throw new Error('คุณไม่มีสิทธิ์ตอบรับคำขอนี้');
  }

  if (req.status !== 'pending') {
    throw new Error(`คำขอนี้อยู่ในสถานะ "${req.status}" แล้ว ไม่สามารถดำเนินการซ้ำได้`);
  }

  const now = new Date().toISOString();

  // If rejecting
  if (!accept) {
    if (!event.allowRejectRequests) {
      throw new Error('กิจกรรมนี้ไม่อนุญาตให้ปฏิเสธคำขอโดยตรง');
    }
    await updateDoc(reqRef, {
      status: 'rejected',
      respondedAt: now,
    });
    await logActivity(
      eventId,
      `${responder.firstName} ปฏิเสธคำขอจาก ${req.senderName}`,
      'request',
      'ปฏิเสธคำขอ',
      responder.studentId
    );
    return { success: true, message: 'ปฏิเสธคำขอเรียบร้อยแล้ว' };
  }

  // Acceptance logic: Depends on targetCapacity (Section 5.1)
  const isPairMode = event.targetCapacity === 2;

  if (isPairMode) {
    // ---------------------------------------------------------
    // RULE A: ห้องละ 2 คน (Pair Mode)
    // 1. ตรวจสอบว่า responder หรือ sender มีคู่ที่ยืนยันแล้วหรือไม่
    // 2. ยืนยันคู่ระหว่าง Sender และ Responder ทันที
    // 3. ปิดคำขออื่น ๆ ของทั้งสองคนให้เป็น 'closed'
    // 4. สร้างหรือจัดห้องพัก 2 คนอัตโนมัติ
    // ---------------------------------------------------------
    const batch = writeBatch(db);

    // Update accepted request
    batch.update(reqRef, {
      status: 'accepted',
      respondedAt: now,
    });

    // If responder also sent a request to sender, accept it too
    const reciprocalQuery = query(
      collection(db, 'events', eventId, 'requests'),
      where('senderId', '==', responder.id),
      where('receiverId', '==', req.senderId)
    );
    const recipSnap = await getDocs(reciprocalQuery);
    recipSnap.forEach(d => {
      batch.update(d.ref, { status: 'accepted', respondedAt: now });
    });

    // Close all other pending requests sent by responder or sender to others
    const allPendingByResponder = await getDocs(query(
      collection(db, 'events', eventId, 'requests'),
      where('senderId', '==', responder.id),
      where('status', '==', 'pending')
    ));
    allPendingByResponder.forEach(d => {
      if (d.id !== requestId) {
        batch.update(d.ref, { status: 'closed', respondedAt: now });
      }
    });

    const allPendingBySender = await getDocs(query(
      collection(db, 'events', eventId, 'requests'),
      where('senderId', '==', req.senderId),
      where('status', '==', 'pending')
    ));
    allPendingBySender.forEach(d => {
      if (d.id !== requestId) {
        batch.update(d.ref, { status: 'closed', respondedAt: now });
      }
    });

    // Create / assign confirmed pair room
    const roomRef = doc(collection(db, 'events', eventId, 'rooms'));
    const newRoom: Room = {
      id: roomRef.id,
      eventId,
      roomNumber: `Pair-${responder.classRoom}-${req.senderStudentNo}_${responder.studentNo}`,
      buildingOrZone: `อาคารเรียน ${responder.classRoom}`,
      targetCapacity: 2,
      maxCapacity: 2,
      status: 'confirmed',
      classRoomFilter: responder.classRoom,
      notes: `จับคู่สำเร็จอัตโนมัติ: ${req.senderName} & ${responder.prefix}${responder.firstName} ${responder.lastName}`,
      createdAt: now,
      updatedAt: now,
    };
    batch.set(roomRef, newRoom);

    // Add 2 members
    const m1Ref = doc(collection(db, 'events', eventId, 'rooms', roomRef.id, 'members'));
    const m1: RoomMember = {
      id: m1Ref.id,
      roomId: roomRef.id,
      eventId,
      studentDocId: req.senderId,
      studentId: req.senderStudentId,
      studentName: req.senderName,
      classRoom: req.senderClassRoom,
      studentNo: req.senderStudentNo,
      consentStatus: 'consented',
      assignedBy: 'system',
      assignedAt: now,
    };
    batch.set(m1Ref, m1);

    const m2Ref = doc(collection(db, 'events', eventId, 'rooms', roomRef.id, 'members'));
    const m2: RoomMember = {
      id: m2Ref.id,
      roomId: roomRef.id,
      eventId,
      studentDocId: responder.id,
      studentId: responder.studentId,
      studentName: `${responder.prefix}${responder.firstName} ${responder.lastName}`,
      classRoom: responder.classRoom,
      studentNo: responder.studentNo,
      consentStatus: 'consented',
      assignedBy: 'system',
      assignedAt: now,
    };
    batch.set(m2Ref, m2);

    await batch.commit();

    await logActivity(
      eventId,
      `จับคู่สำเร็จ 2 คน: ${req.senderName} และ ${responder.firstName}`,
      'room',
      `ยืนยันคู่สำเร็จและสร้างห้องพัก Pair-${req.senderStudentNo}_${responder.studentNo}`,
      responder.studentId
    );

    return {
      success: true,
      message: `จับคู่สำเร็จ! คุณและ ${req.senderName} ได้รับการยืนยันเป็นคู่นอนแล้ว`,
    };
  } else {
    // ---------------------------------------------------------
    // RULE B: ห้องหลายคน (Multi-person Mode >= 3 คน)
    // การตอบรับหมายถึง "ยอมรับความประสงค์ระหว่างกัน" (Bilateral agreement)
    // แต่ยังไม่ถือว่ายืนยันทั้งห้องขั้นสุดท้าย
    // สมาชิกสามารถตอบรับได้สูงสุด targetCapacity - 1 คน
    // ---------------------------------------------------------
    const maxAllowedAcceptances = Math.max(1, event.targetCapacity - 1);

    // Count currently accepted requests by responder
    const acceptedSnap = await getDocs(query(
      collection(db, 'events', eventId, 'requests'),
      where('receiverId', '==', responder.id),
      where('status', '==', 'accepted')
    ));

    if (acceptedSnap.size >= maxAllowedAcceptances) {
      throw new Error(`คุณตอบรับคำขอครบโควตาความจุแล้ว (ตอบรับได้สูงสุด ${maxAllowedAcceptances} คน สำหรับห้อง ${event.targetCapacity} คน)`);
    }

    await updateDoc(reqRef, {
      status: 'accepted',
      respondedAt: now,
    });

    await logActivity(
      eventId,
      `${responder.firstName} ตอบรับความประสงค์จาก ${req.senderName}`,
      'request',
      `ยอมรับความประสงค์ระหว่างบุคคล (ห้องหลายคน ${event.targetCapacity} คน)`,
      responder.studentId
    );

    return {
      success: true,
      message: `ตอบรับความประสงค์ของ ${req.senderName} แล้ว! ระบบจะรวมกลุ่มเพื่อเสนอการจัดห้องพักต่อไป`,
    };
  }
}

// -------------------------------------------------------------
// ROOMS AND MEMBERS OPERATIONS
// -------------------------------------------------------------
export function subscribeRoomsWithMembers(eventId: string, callback: (rooms: Room[]) => void) {
  const roomsRef = collection(db, 'events', eventId, 'rooms');
  return onSnapshot(roomsRef, async snap => {
    const rooms: Room[] = [];
    for (const d of snap.docs) {
      const roomData = { ...d.data(), id: d.id } as Room;
      // Get subcollection members
      const membersSnap = await getDocs(collection(db, 'events', eventId, 'rooms', d.id, 'members'));
      roomData.members = membersSnap.docs.map(mDoc => ({ ...mDoc.data(), id: mDoc.id } as RoomMember));
      rooms.push(roomData);
    }
    // Sort by roomNumber
    rooms.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true }));
    callback(rooms);
  }, err => {
    handleFirestoreError(err, OperationType.GET, `events/${eventId}/rooms`);
  });
}

// Create Room manually
export async function createRoom(
  eventId: string,
  roomData: Omit<Room, 'id' | 'createdAt' | 'updatedAt' | 'members'>,
  initialStudents: Student[] = [],
  performedBy = 'admin'
): Promise<string> {
  const roomRef = doc(collection(db, 'events', eventId, 'rooms'));
  const now = new Date().toISOString();
  const newRoom: Room = {
    ...roomData,
    id: roomRef.id,
    createdAt: now,
    updatedAt: now,
  };

  const batch = writeBatch(db);
  batch.set(roomRef, newRoom);

  for (const stu of initialStudents) {
    const mRef = doc(collection(db, 'events', eventId, 'rooms', roomRef.id, 'members'));
    const member: RoomMember = {
      id: mRef.id,
      roomId: roomRef.id,
      eventId,
      studentDocId: stu.id,
      studentId: stu.studentId,
      studentName: `${stu.prefix}${stu.firstName} ${stu.lastName}`,
      classRoom: stu.classRoom,
      studentNo: stu.studentNo,
      consentStatus: 'pending',
      assignedBy: 'admin',
      assignedAt: now,
    };
    batch.set(mRef, member);
  }

  try {
    await batch.commit();
    await logActivity(
      eventId,
      `สร้างห้องพักใหม่ ${roomData.roomNumber}`,
      'room',
      `สร้างห้องพักความจุ ${roomData.targetCapacity} คน บรรจุเริ่มต้น ${initialStudents.length} คน`,
      performedBy
    );
    return roomRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `events/${eventId}/rooms`);
  }
}

// Add or Move member to room (prevents student duplication in confirmed rooms)
export async function assignStudentToRoom(
  eventId: string,
  targetRoomId: string,
  student: Student,
  performedBy = 'admin'
): Promise<void> {
  const allRoomsSnap = await getDocs(collection(db, 'events', eventId, 'rooms'));
  const batch = writeBatch(db);

  // Check and remove from existing rooms to prevent duplicate assignment
  for (const rDoc of allRoomsSnap.docs) {
    const memSnap = await getDocs(query(
      collection(db, 'events', eventId, 'rooms', rDoc.id, 'members'),
      where('studentDocId', '==', student.id)
    ));
    memSnap.forEach(mDoc => {
      batch.delete(mDoc.ref);
    });
  }

  // Add to target room
  const now = new Date().toISOString();
  const newMemRef = doc(collection(db, 'events', eventId, 'rooms', targetRoomId, 'members'));
  const member: RoomMember = {
    id: newMemRef.id,
    roomId: targetRoomId,
    eventId,
    studentDocId: student.id,
    studentId: student.studentId,
    studentName: `${student.prefix}${student.firstName} ${student.lastName}`,
    classRoom: student.classRoom,
    studentNo: student.studentNo,
    consentStatus: 'consented',
    assignedBy: performedBy === 'admin' ? 'admin' : 'system',
    assignedAt: now,
  };
  batch.set(newMemRef, member);

  const roomRef = doc(db, 'events', eventId, 'rooms', targetRoomId);
  batch.update(roomRef, { updatedAt: now });

  try {
    await batch.commit();
    await logActivity(
      eventId,
      `ย้าย/เพิ่ม ${student.firstName} เข้าห้อง ${targetRoomId}`,
      'room',
      `มอบหมายเข้าห้องพัก`,
      performedBy
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `events/${eventId}/rooms/${targetRoomId}/members`);
  }
}

// Remove member from room
export async function removeStudentFromRoom(
  eventId: string,
  roomId: string,
  memberId: string,
  studentName: string,
  performedBy = 'admin'
): Promise<void> {
  const memberRef = doc(db, 'events', eventId, 'rooms', roomId, 'members', memberId);
  try {
    await deleteDoc(memberRef);
    await logActivity(
      eventId,
      `นำ ${studentName} ออกจากห้องพัก`,
      'room',
      `ยกเลิกสมาชิกในห้อง ${roomId}`,
      performedBy
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `events/${eventId}/rooms/${roomId}/members/${memberId}`);
  }
}

// Delete room entirely
export async function deleteRoom(eventId: string, roomId: string, roomNumber: string): Promise<void> {
  const batch = writeBatch(db);
  const memSnap = await getDocs(collection(db, 'events', eventId, 'rooms', roomId, 'members'));
  memSnap.forEach(d => batch.delete(d.ref));
  const roomRef = doc(db, 'events', eventId, 'rooms', roomId);
  batch.delete(roomRef);

  try {
    await batch.commit();
    await logActivity(eventId, `ลบห้องพัก ${roomNumber}`, 'room', `ลบห้องและถอดสมาชิกทั้งหมด`, 'admin');
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `events/${eventId}/rooms/${roomId}`);
  }
}

// Member consent action (for multi-person proposals)
export async function submitRoomConsent(
  eventId: string,
  roomId: string,
  studentDocId: string,
  consent: 'consented' | 'review_requested',
  note?: string
): Promise<void> {
  const memQuery = query(
    collection(db, 'events', eventId, 'rooms', roomId, 'members'),
    where('studentDocId', '==', studentDocId)
  );
  const snap = await getDocs(memQuery);
  if (snap.empty) {
    throw new Error('ไม่พบข้อมูลสมาชิกของคุณในห้องนี้');
  }

  const memberRef = snap.docs[0].ref;
  try {
    await updateDoc(memberRef, {
      consentStatus: consent,
      consentNote: note || '',
      assignedAt: new Date().toISOString(),
    });
    await logActivity(
      eventId,
      `สมาชิกบันทึกสถานะห้อง: ${consent}`,
      'room',
      `นักเรียนตอบรับ: ${consent} ${note ? `(เหตุผล: ${note})` : ''}`,
      studentDocId
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, memberRef.path);
  }
}

// Finalize and confirm room status
export async function updateRoomStatus(
  eventId: string,
  roomId: string,
  status: 'draft_proposal' | 'pending_consent' | 'confirmed' | 'archived',
  performedBy = 'admin'
): Promise<void> {
  const roomRef = doc(db, 'events', eventId, 'rooms', roomId);
  try {
    await updateDoc(roomRef, {
      status,
      updatedAt: new Date().toISOString(),
    });
    await logActivity(
      eventId,
      `ปรับสถานะห้อง ${roomId} เป็น ${status}`,
      'room',
      `เปลี่ยนสถานะห้องพักเป็น ${status}`,
      performedBy
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `events/${eventId}/rooms/${roomId}`);
  }
}

// -------------------------------------------------------------
// INTELLIGENT AUTO-PROPOSAL GENERATOR (SECTION 8.2)
// -------------------------------------------------------------
export interface AutoProposalResult {
  proposedRooms: {
    roomNumber: string;
    classRoom: string;
    members: Student[];
    affinityScore: number;
    matchType: 'mutual_accepted' | 'mutual_preference' | 'one_way_accepted' | 'classroom_fill';
  }[];
  unassignedStudents: Student[];
  totalAssigned: number;
  totalStudents: number;
}

export function generateAutoRoomProposals(
  event: CampEvent,
  allStudents: Student[],
  allRequests: PartnerRequest[],
  existingRooms: Room[] = []
): AutoProposalResult {
  const targetCap = event.targetCapacity || 2;
  const eligibleStudents = allStudents.filter(s => s.isEligible);

  // Exclude students who are ALREADY confirmed in existing rooms
  const lockedStudentIds = new Set<string>();
  existingRooms.forEach(r => {
    if (r.status === 'confirmed') {
      (r.members || []).forEach(m => lockedStudentIds.add(m.studentDocId));
    }
  });

  const availableStudents = eligibleStudents.filter(s => !lockedStudentIds.has(s.id));

  // Build graph of scores between students in the SAME classroom
  // We strictly respect classroom isolation
  const studentsByClass = new Map<string, Student[]>();
  availableStudents.forEach(s => {
    const list = studentsByClass.get(s.classRoom) || [];
    list.push(s);
    studentsByClass.set(s.classRoom, list);
  });

  const proposedRooms: AutoProposalResult['proposedRooms'] = [];
  const assignedInThisRun = new Set<string>();

  // Map requests by sender->receiver
  const requestMap = new Map<string, PartnerRequest>();
  allRequests.forEach(r => {
    requestMap.set(`${r.senderId}->${r.receiverId}`, r);
  });

  let roomCounter = existingRooms.length + 1;

  // Process class by class
  studentsByClass.forEach((classStudents, className) => {
    // 1. Calculate pairwise affinity matrix
    const scoreBetween = (aId: string, bId: string): number => {
      const aToB = requestMap.get(`${aId}->${bId}`);
      const bToA = requestMap.get(`${bId}->${aId}`);
      let score = 0;

      // Both accepted each other
      if (aToB?.status === 'accepted' && bToA?.status === 'accepted') score += 120;
      // One accepted, other pending
      else if (aToB?.status === 'accepted' || bToA?.status === 'accepted') score += 80;
      // Both selected each other (mutual preference)
      else if (aToB && bToA) score += 60;
      // One selected the other
      else if (aToB || bToA) {
        const req = aToB || bToA;
        if (req?.preferenceRank === 1) score += 30;
        else if (req?.preferenceRank === 2) score += 20;
        else score += 10;
      }
      return score;
    };

    const remainingInClass = [...classStudents];

    // Greedy cluster search: find groups of size targetCap with highest sum of internal scores
    while (remainingInClass.length >= (event.allowPartialLastRoom ? 1 : targetCap)) {
      if (remainingInClass.length < targetCap && !event.allowPartialLastRoom) {
        break;
      }

      // If we have fewer than targetCap and allowPartialLastRoom is true
      if (remainingInClass.length <= targetCap) {
        const group = [...remainingInClass];
        const roomNumber = `R-${className.replace(/\s+/g, '')}-${String(roomCounter++).padStart(3, '0')}`;
        proposedRooms.push({
          roomNumber,
          classRoom: className,
          members: group,
          affinityScore: 10,
          matchType: 'classroom_fill',
        });
        group.forEach(s => assignedInThisRun.add(s.id));
        remainingInClass.length = 0;
        break;
      }

      // Pick seed student: student with highest external preference connection
      let bestSeed = remainingInClass[0];
      let maxAffinitySum = -1;
      for (const s of remainingInClass) {
        const sum = remainingInClass.reduce((acc, other) => acc + (s.id !== other.id ? scoreBetween(s.id, other.id) : 0), 0);
        if (sum > maxAffinitySum) {
          maxAffinitySum = sum;
          bestSeed = s;
        }
      }

      // Build group around bestSeed
      const group: Student[] = [bestSeed];
      const candidates = remainingInClass.filter(s => s.id !== bestSeed.id);

      while (group.length < targetCap && candidates.length > 0) {
        // Pick candidate with highest total score with current group members
        let bestCandidateIdx = 0;
        let highestGroupScore = -1;

        candidates.forEach((cand, cIdx) => {
          const groupScore = group.reduce((acc, m) => acc + scoreBetween(cand.id, m.id), 0);
          if (groupScore > highestGroupScore) {
            highestGroupScore = groupScore;
            bestCandidateIdx = cIdx;
          }
        });

        group.push(candidates[bestCandidateIdx]);
        candidates.splice(bestCandidateIdx, 1);
      }

      // Calculate total group internal score
      let totalScore = 0;
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          totalScore += scoreBetween(group[i].id, group[j].id);
        }
      }

      const matchType = totalScore >= 100 
        ? 'mutual_accepted' 
        : totalScore >= 50 
        ? 'mutual_preference' 
        : totalScore > 0 
        ? 'one_way_accepted' 
        : 'classroom_fill';

      const roomNumber = `R-${className.replace(/\s+/g, '')}-${String(roomCounter++).padStart(3, '0')}`;
      proposedRooms.push({
        roomNumber,
        classRoom: className,
        members: group,
        affinityScore: totalScore,
        matchType,
      });

      group.forEach(s => {
        assignedInThisRun.add(s.id);
        const idxInRem = remainingInClass.findIndex(r => r.id === s.id);
        if (idxInRem !== -1) remainingInClass.splice(idxInRem, 1);
      });
    }
  });

  const unassignedStudents = availableStudents.filter(s => !assignedInThisRun.has(s.id));

  return {
    proposedRooms,
    unassignedStudents,
    totalAssigned: assignedInThisRun.size,
    totalStudents: availableStudents.length,
  };
}

// Apply auto-generated proposals to Firestore as 'draft_proposal' or 'confirmed'
export async function applyProposedRoomsToDatabase(
  eventId: string,
  proposals: AutoProposalResult['proposedRooms'],
  targetStatus: 'draft_proposal' | 'confirmed' = 'draft_proposal',
  performedBy = 'admin'
): Promise<void> {
  const batch = writeBatch(db);
  const now = new Date().toISOString();

  for (const prop of proposals) {
    const roomRef = doc(collection(db, 'events', eventId, 'rooms'));
    const newRoom: Room = {
      id: roomRef.id,
      eventId,
      roomNumber: prop.roomNumber,
      buildingOrZone: `โซน ${prop.classRoom}`,
      targetCapacity: prop.members.length,
      maxCapacity: prop.members.length,
      status: targetStatus,
      classRoomFilter: prop.classRoom,
      notes: `สร้างจากระบบเสนออัตโนมัติ (${prop.matchType}, ความสอดคล้อง: ${prop.affinityScore})`,
      createdAt: now,
      updatedAt: now,
    };
    batch.set(roomRef, newRoom);

    for (const memberStu of prop.members) {
      const mRef = doc(collection(db, 'events', eventId, 'rooms', roomRef.id, 'members'));
      const member: RoomMember = {
        id: mRef.id,
        roomId: roomRef.id,
        eventId,
        studentDocId: memberStu.id,
        studentId: memberStu.studentId,
        studentName: `${memberStu.prefix}${memberStu.firstName} ${memberStu.lastName}`,
        classRoom: memberStu.classRoom,
        studentNo: memberStu.studentNo,
        consentStatus: targetStatus === 'confirmed' ? 'consented' : 'pending',
        assignedBy: 'system',
        assignedAt: now,
      };
      batch.set(mRef, member);
    }
  }

  try {
    await batch.commit();
    await logActivity(
      eventId,
      `นำข้อเสนอการจัดห้อง ${proposals.length} ห้อง บันทึกลงระบบ (${targetStatus})`,
      'room',
      `บันทึกผลการจัดห้องอัตโนมัติ`,
      performedBy
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `events/${eventId}/rooms`);
  }
}

// -------------------------------------------------------------
// ACTIVITY LOGGING
// -------------------------------------------------------------
export async function logActivity(
  eventId: string,
  action: string,
  category: ActivityLog['category'],
  details: string,
  performedBy: string
): Promise<void> {
  try {
    const logRef = doc(collection(db, 'events', eventId, 'logs'));
    const log: ActivityLog = {
      id: logRef.id,
      eventId,
      action,
      category,
      details,
      performedBy,
      timestamp: new Date().toISOString(),
    };
    await setDoc(logRef, log);
  } catch (err) {
    console.warn('Log activity failed silently:', err);
  }
}

export function subscribeActivityLogs(eventId: string, callback: (logs: ActivityLog[]) => void) {
  const logsRef = collection(db, 'events', eventId, 'logs');
  return onSnapshot(logsRef, snap => {
    const logs = snap.docs.map(d => ({ ...d.data(), id: d.id } as ActivityLog));
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    callback(logs);
  }, err => {
    handleFirestoreError(err, OperationType.GET, `events/${eventId}/logs`);
  });
}
