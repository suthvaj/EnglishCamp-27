import * as XLSX from 'xlsx';
import { ImportRow, ImportValidationResult, Student, PartnerRequest, Room, CampEvent } from '../types';

export const TEMPLATE_COLUMNS = [
  'student_id',
  'prefix',
  'first_name',
  'last_name',
  'class_room',
  'student_no',
  'gender'
];

// Generate downloadable Excel Template (.xlsx)
export function downloadExcelTemplate(): void {
  const wsData = [
    TEMPLATE_COLUMNS,
    ['99991', 'เด็กชาย', 'กิตติศักดิ์', 'รักเรียน', 'ม.3/4', 1, 'ชาย'],
    ['99992', 'เด็กหญิง', 'พิมพ์มาดา', 'ใจดี', 'ม.3/4', 2, 'หญิง'],
    ['99993', 'เด็กชาย', 'ธนกฤต', 'มั่นคง', 'ม.3/4', 3, 'ชาย'],
    ['99994', 'เด็กหญิง', 'ศศิธร', 'งามสง่า', 'ม.3/4', 4, 'หญิง'],
    ['99995', 'เด็กชาย', 'วรเมธ', 'เจริญผล', 'ม.3/5', 1, 'ชาย'],
    ['99996', 'เด็กหญิง', 'ณิชาภัทร', 'เกตุแก้ว', 'ม.3/5', 2, 'หญิง'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column width styling
  ws['!cols'] = [
    { wch: 15 }, // student_id
    { wch: 12 }, // prefix
    { wch: 20 }, // first_name
    { wch: 20 }, // last_name
    { wch: 14 }, // class_room
    { wch: 12 }, // student_no
    { wch: 10 }, // gender
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'StudentTemplate');
  XLSX.writeFile(wb, 'EnglishCamp_Student_Template.xlsx');
}

// Parse uploaded Excel file and validate row-by-row
export async function parseAndValidateExcel(file: File): Promise<{
  rows: ImportValidationResult[];
  validCount: number;
  invalidCount: number;
  totalCount: number;
}> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = wb.SheetNames[0];
  const ws = wb.Sheets[firstSheetName];

  // Convert to JSON objects
  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

  const results: ImportValidationResult[] = [];
  const seenStudentIds = new Set<string>();
  const seenClassStudentNos = new Set<string>(); // "ม.3/4:1"

  rawRows.forEach((r, index) => {
    const rowNum = index + 2; // Row 1 is header
    const errors: string[] = [];

    // Extract fields (handle both string & number representations)
    const student_id = String(r['student_id'] || r['เลขประจำตัว'] || '').trim();
    const prefix = String(r['prefix'] || r['คำนำหน้า'] || '').trim();
    const first_name = String(r['first_name'] || r['ชื่อ'] || '').trim();
    const last_name = String(r['last_name'] || r['นามสกุล'] || '').trim();
    const class_room = String(r['class_room'] || r['ห้องเรียน'] || r['ชั้นเรียน'] || '').trim();
    const student_no_raw = r['student_no'] ?? r['เลขที่'];
    const student_no = typeof student_no_raw === 'number' ? student_no_raw : parseInt(String(student_no_raw), 10);
    const gender = String(r['gender'] || r['เพศ'] || '').trim();

    // Required checks
    if (!student_id) {
      errors.push('ขาดเลขประจำตัวนักเรียน (student_id)');
    } else if (seenStudentIds.has(student_id)) {
      errors.push(`เลขประจำตัวนักเรียนซ้ำในไฟล์ (${student_id})`);
    } else {
      seenStudentIds.add(student_id);
    }

    if (!first_name) {
      errors.push('ขาดชื่อนักเรียน (first_name)');
    }
    if (!last_name) {
      errors.push('ขาดนามสกุล (last_name)');
    }
    if (!class_room) {
      errors.push('ขาดห้องเรียน (class_room)');
    }

    if (isNaN(student_no) || student_no <= 0) {
      errors.push('เลขที่ (student_no) ไม่ถูกต้อง ต้องเป็นตัวเลขมากกว่า 0');
    } else if (class_room) {
      const classNoKey = `${class_room}:${student_no}`;
      if (seenClassStudentNos.has(classNoKey)) {
        errors.push(`เลขที่ซ้ำในห้องเรียนเดียวกัน (${class_room} เลขที่ ${student_no})`);
      } else {
        seenClassStudentNos.add(classNoKey);
      }
    }

    const rowData: ImportRow = {
      student_id,
      prefix: prefix || 'นาย/นางสาว/ด.ช./ด.ญ.',
      first_name,
      last_name,
      class_room,
      student_no: isNaN(student_no) ? 0 : student_no,
      gender: gender || 'ไม่ระบุ',
    };

    results.push({
      rowNumber: rowNum,
      data: rowData,
      isValid: errors.length === 0,
      errors,
    });
  });

  const validCount = results.filter(r => r.isValid).length;
  const invalidCount = results.length - validCount;

  return {
    rows: results,
    validCount,
    invalidCount,
    totalCount: results.length,
  };
}

// Export comprehensive reports to XLSX
export function exportCampDataToExcel(
  event: CampEvent,
  students: Student[],
  requests: PartnerRequest[],
  rooms: Room[]
): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Students Roster
  const studentRows = students.map((s, idx) => ({
    'ลำดับ': idx + 1,
    'เลขประจำตัว': s.studentId,
    'คำนำหน้า': s.prefix,
    'ชื่อ': s.firstName,
    'นามสกุล': s.lastName,
    'ห้องเรียน': s.classRoom,
    'เลขที่': s.studentNo,
    'เพศ': s.gender || '-',
    'ส่งตัวเลือกแล้ว': s.hasSubmittedChoices ? 'ส่งแล้ว' : 'ยังไม่ส่ง',
    'สถานะมีสิทธิ์': s.isEligible ? 'มีสิทธิ์' : 'ระงับสิทธิ์',
  }));
  const wsStudents = XLSX.utils.json_to_sheet(studentRows);
  XLSX.utils.book_append_sheet(wb, wsStudents, 'รายชื่อนักเรียนทั้งหมด');

  // Sheet 2: Requests Summary
  const requestRows = requests.map((req, idx) => ({
    'ลำดับ': idx + 1,
    'ผู้ส่งคำขอ': req.senderName,
    'ห้องผู้ส่ง': req.senderClassRoom,
    'เลขที่ผู้ส่ง': req.senderStudentNo,
    'ผู้รับคำขอ': req.receiverName,
    'ห้องผู้รับ': req.receiverClassRoom,
    'เลขที่ผู้รับ': req.receiverStudentNo,
    'ลำดับความต้องการ': req.preferenceRank,
    'สถานะคำขอ': req.status,
    'เวลาที่ส่ง': new Date(req.createdAt).toLocaleString('th-TH'),
    'เวลาที่ตอบรับ': req.respondedAt ? new Date(req.respondedAt).toLocaleString('th-TH') : '-',
  }));
  const wsRequests = XLSX.utils.json_to_sheet(requestRows);
  XLSX.utils.book_append_sheet(wb, wsRequests, 'รายการคำขอคู่นอน');

  // Sheet 3: Confirmed / Assigned Rooms
  const roomRows: Record<string, unknown>[] = [];
  rooms.forEach((room) => {
    const members = room.members || [];
    if (members.length === 0) {
      roomRows.push({
        'หมายเลขห้อง': room.roomNumber,
        'อาคาร/โซน': room.buildingOrZone || '-',
        'ความจุเป้าหมาย': room.targetCapacity,
        'จำนวนสมาชิก': 0,
        'สถานะห้อง': room.status,
        'ชื่อนักเรียน': 'ไม่มีสมาชิก',
        'ห้องเรียน': '-',
        'เลขที่': '-',
        'สถานะยืนยัน': '-',
      });
    } else {
      members.forEach((m, mIdx) => {
        roomRows.push({
          'หมายเลขห้อง': room.roomNumber,
          'อาคาร/โซน': room.buildingOrZone || '-',
          'ความจุเป้าหมาย': room.targetCapacity,
          'จำนวนสมาชิก': members.length,
          'สถานะห้อง': room.status,
          'สมาชิกคนที่': mIdx + 1,
          'เลขประจำตัว': m.studentId,
          'ชื่อนักเรียน': m.studentName,
          'ห้องเรียน': m.classRoom,
          'เลขที่': m.studentNo,
          'สถานะยืนยัน': m.consentStatus === 'consented' ? 'ยืนยันแล้ว' : m.consentStatus === 'review_requested' ? 'ขอทบทวน' : 'รอยืนยัน',
        });
      });
    }
  });
  const wsRooms = XLSX.utils.json_to_sheet(roomRows);
  XLSX.utils.book_append_sheet(wb, wsRooms, 'รายงานการจัดห้องพัก');

  // Sheet 4: Unassigned Students
  const assignedStudentDocIds = new Set<string>();
  rooms.forEach(r => (r.members || []).forEach(m => assignedStudentDocIds.add(m.studentDocId)));
  const unassigned = students.filter(s => s.isEligible && !assignedStudentDocIds.has(s.id));
  const unassignedRows = unassigned.map((s, idx) => ({
    'ลำดับ': idx + 1,
    'เลขประจำตัว': s.studentId,
    'ชื่อ-นามสกุล': `${s.prefix}${s.firstName} ${s.lastName}`,
    'ห้องเรียน': s.classRoom,
    'เลขที่': s.studentNo,
    'สถานะส่งตัวเลือก': s.hasSubmittedChoices ? 'ส่งแล้ว' : 'ยังไม่ส่ง',
  }));
  const wsUnassigned = XLSX.utils.json_to_sheet(unassignedRows);
  XLSX.utils.book_append_sheet(wb, wsUnassigned, 'นักเรียนที่ยังไม่ได้จัดห้อง');

  const fileName = `EnglishCamp_${event.academicYear || 'Report'}_Rooming_Export.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// Export CSV for simple tabular reporting
export function exportCampDataToCSV(students: Student[], rooms: Room[]): void {
  const assignedMap = new Map<string, string>();
  rooms.forEach(r => {
    (r.members || []).forEach(m => {
      assignedMap.set(m.studentDocId, r.roomNumber);
    });
  });

  const header = ['student_id', 'prefix', 'first_name', 'last_name', 'class_room', 'student_no', 'gender', 'room_number'];
  const rows = students.map(s => [
    `"${s.studentId}"`,
    `"${s.prefix}"`,
    `"${s.firstName}"`,
    `"${s.lastName}"`,
    `"${s.classRoom}"`,
    s.studentNo,
    `"${s.gender || ''}"`,
    `"${assignedMap.get(s.id) || 'ยังไม่มีห้อง'}"`,
  ].join(','));

  const csvContent = '\uFEFF' + [header.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `EnglishCamp_Roster_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
