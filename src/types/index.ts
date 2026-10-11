export type EventStatus = 
  | 'draft' 
  | 'open_selection' 
  | 'closed_selection' 
  | 'assignment_in_progress' 
  | 'completed';

export type RoomingMode = 
  | 'pair'       // ห้องละ 2 คน (จับคู่)
  | 'multi'      // ห้องหลายคน (3, 4, etc.)
  | 'custom'     // จำนวนคนแบบกำหนดเอง
  | 'flexible';  // ห้องพักยืดหยุ่น (แต่ละห้องกำหนดจำนวนต่างกันได้)

export type RequestStatus = 
  | 'pending'    // รอผู้รับตอบรับ
  | 'accepted'   // ตอบรับความประสงค์แล้ว
  | 'rejected'   // ปฏิเสธ
  | 'cancelled'  // ผู้ส่งยกเลิกคำขอ
  | 'closed'     // สิ้นสุด/ปิดแล้วเนื่องจากจับคู่สำเร็จแล้ว
  | 'expired';   // หมดเวลาในการตอบรับ

export type RoomStatus = 
  | 'draft_proposal'   // ข้อเสนอจัดห้อง (Admin generated draft)
  | 'pending_consent'  // รอยืนยันรายชื่อห้องจากสมาชิก
  | 'confirmed'        // ยืนยันห้องพักแล้ว (finalized)
  | 'archived';        // เก็บถาวร

export type MemberConsentStatus = 
  | 'pending'           // รอยืนยัน
  | 'consented'         // ยืนยันรายชื่อแล้ว
  | 'review_requested'; // ขอให้ทบทวน/ตรวจสอบการจัดห้องใหม่

export interface CampEvent {
  id: string;
  name: string;
  academicYear: string;
  description: string;
  status: EventStatus;
  selectionStartDate?: string;
  selectionEndDate?: string;
  responseEndDate?: string;
  maxChoices: number;          // Default: 3
  minChoices: number;          // Default: 1
  allowEditChoices: boolean;
  allowRejectRequests: boolean;
  roomingMode: RoomingMode;
  targetCapacity: number;      // e.g., 2, 3, 4, 5
  maxCapacity: number;
  minCapacity: number;
  allowPartialLastRoom: boolean;
  allowUnevenRooms: boolean;
  requireAllMemberConsent: boolean;
  assignmentMethod: 'auto' | 'manual' | 'hybrid';
  isTrialMode?: boolean;       // โหมดทดลองใช้ (ถ้าเป็น false คือโหมดใช้งานจริง)
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;                  // Firestore doc id
  studentId: string;           // เลขประจำตัวนักเรียน (e.g. "54321")
  prefix: string;              // ด.ช., ด.ญ., นาย, นางสาว
  firstName: string;           // ชื่อ
  lastName: string;            // นามสกุล
  classRoom: string;           // ห้องเรียน เช่น "ม.3/4"
  studentNo: number;           // เลขที่
  gender?: string;             // ชาย / หญิง
  isDemo?: boolean;            // เป็นข้อมูลตัวอย่างหรือไม่
  pinHash?: string;            // SHA-256 Hash with salt
  pinSalt?: string;
  mustChangePin?: boolean;     // บังคับเปลี่ยน PIN เมื่อเข้าสู่ระบบครั้งแรก
  failedPinAttempts?: number;  // สำหรับ Rate Limiting
  isLocked?: boolean;          // บัญชีถูกล็อคเนื่องจากใส่รหัสผิดเกินกำหนด
  isEligible: boolean;         // มีสิทธิ์เข้าร่วมกิจกรรมหรือไม่
  eventId: string;
  hasSubmittedChoices?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PartnerRequest {
  id: string;
  eventId: string;
  senderId: string;            // Student doc ID
  senderStudentId: string;
  senderName: string;
  senderClassRoom: string;
  senderStudentNo: number;
  receiverId: string;          // Student doc ID
  receiverStudentId: string;
  receiverName: string;
  receiverClassRoom: string;
  receiverStudentNo: number;
  preferenceRank: number;      // 1, 2, or 3 (ห้ามแสดงให้ผู้รับเห็นความหมายของลำดับ)
  status: RequestStatus;
  createdAt: string;
  respondedAt?: string;
}

export interface Room {
  id: string;
  eventId: string;
  roomNumber: string;          // เช่น "A-101", "Villa-02"
  buildingOrZone?: string;
  targetCapacity: number;
  maxCapacity: number;
  status: RoomStatus;
  classRoomFilter?: string;    // ห้องเรียนหลักประจำห้อง (ถ้ามี)
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Dynamic member cache
  members?: RoomMember[];
}

export interface RoomMember {
  id: string;
  roomId: string;
  eventId: string;
  studentDocId: string;
  studentId: string;
  studentName: string;
  classRoom: string;
  studentNo: number;
  consentStatus: MemberConsentStatus;
  consentNote?: string;
  assignedBy: 'system' | 'admin';
  assignedAt: string;
}

export interface ActivityLog {
  id: string;
  eventId: string;
  action: string;
  category: 'student' | 'request' | 'room' | 'event' | 'import' | 'security';
  details: string;
  performedBy: string;
  timestamp: string;
}

export interface ImportRow {
  student_id: string;
  prefix: string;
  first_name: string;
  last_name: string;
  class_room: string;
  student_no: number | string;
  gender?: string;
}

export interface ImportValidationResult {
  rowNumber: number;
  data: ImportRow;
  isValid: boolean;
  errors: string[];
}
