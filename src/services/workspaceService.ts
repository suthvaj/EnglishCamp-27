import { getAccessToken } from '../firebase';
import { CampEvent, Student, Room, PartnerRequest } from '../types';

export interface WorkspaceExportResult {
  success: boolean;
  fileId?: string;
  fileUrl?: string;
  error?: string;
}

// Export room assignments and roster directly to a new Google Sheet
export async function exportToGoogleSheets(
  event: CampEvent,
  students: Student[],
  rooms: Room[],
  requests: PartnerRequest[]
): Promise<WorkspaceExportResult> {
  const token = await getAccessToken();
  if (!token) {
    return {
      success: false,
      error: 'กรุณาลงชื่อเข้าใช้ด้วย Google (Sign in with Google) ที่แถบด้านบนเพื่อเชื่อมต่อ Google Sheets',
    };
  }

  try {
    // 1. Create Spreadsheet
    const title = `English Camp ${event.academicYear || ''} - Room Assignments & Roster (${new Date().toLocaleDateString('th-TH')})`;
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title,
        },
        sheets: [
          { properties: { title: 'สรุปห้องพัก' } },
          { properties: { title: 'รายชื่อนักเรียน' } },
        ],
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json();
      throw new Error(err.error?.message || 'Failed to create spreadsheet');
    }

    const spreadsheet = await createRes.json();
    const spreadsheetId = spreadsheet.spreadsheetId;

    // 2. Prepare Data for Sheet 1: Rooms
    const roomValues: (string | number)[][] = [
      ['หมายเลขห้อง', 'อาคาร/โซน', 'ความจุเป้าหมาย', 'จำนวนสมาชิก', 'สถานะ', 'ชื่อสมาชิก', 'ห้องเรียน', 'เลขที่', 'สถานะยืนยัน'],
    ];

    rooms.forEach(r => {
      const members = r.members || [];
      if (members.length === 0) {
        roomValues.push([r.roomNumber, r.buildingOrZone || '-', r.targetCapacity, 0, r.status, 'ไม่มีสมาชิก', '-', '-', '-']);
      } else {
        members.forEach(m => {
          roomValues.push([
            r.roomNumber,
            r.buildingOrZone || '-',
            r.targetCapacity,
            members.length,
            r.status === 'confirmed' ? 'ยืนยันแล้ว' : 'ข้อเสนอ',
            m.studentName,
            m.classRoom,
            m.studentNo,
            m.consentStatus === 'consented' ? 'ยินยอม' : m.consentStatus === 'review_requested' ? 'ขอทบทวน' : 'รอการตอบ',
          ]);
        });
      }
    });

    // Sheet 2: Students
    const studentValues: (string | number)[][] = [
      ['เลขประจำตัว', 'คำนำหน้า', 'ชื่อ', 'นามสกุล', 'ห้องเรียน', 'เลขที่', 'เพศ', 'ส่งตัวเลือกแล้ว'],
    ];
    students.forEach(s => {
      studentValues.push([
        s.studentId,
        s.prefix,
        s.firstName,
        s.lastName,
        s.classRoom,
        s.studentNo,
        s.gender || '-',
        s.hasSubmittedChoices ? 'ส่งแล้ว' : 'ยังไม่ส่ง',
      ]);
    });

    // 3. Batch Update Values
    const updateRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          valueInputOption: 'USER_ENTERED',
          data: [
            {
              range: 'สรุปห้องพัก!A1',
              values: roomValues,
            },
            {
              range: 'รายชื่อนักเรียน!A1',
              values: studentValues,
            },
          ],
        }),
      }
    );

    if (!updateRes.ok) {
      console.warn('Values update failed, spreadsheet still created');
    }

    return {
      success: true,
      fileId: spreadsheetId,
      fileUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    };
  } catch (error) {
    console.error('Google Sheets Export Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อ Google Sheets',
    };
  }
}

// Export official printable document directly to Google Docs
export async function exportToGoogleDocs(
  event: CampEvent,
  rooms: Room[],
  unassignedCount: number
): Promise<WorkspaceExportResult> {
  const token = await getAccessToken();
  if (!token) {
    return {
      success: false,
      error: 'กรุณาลงชื่อเข้าใช้ด้วย Google (Sign in with Google) ที่แถบด้านบนเพื่อเชื่อมต่อ Google Docs',
    };
  }

  try {
    const docTitle = `บัญชีรายชื่อห้องพัก ${event.name} ปีการศึกษา ${event.academicYear}`;
    
    // 1. Create document
    const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: docTitle,
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json();
      throw new Error(err.error?.message || 'Failed to create Google Doc');
    }

    const docData = await createRes.json();
    const documentId = docData.documentId;

    // 2. Prepare text content to insert
    let textContent = `${docTitle}\n`;
    textContent += `วันที่จัดทำเอกสาร: ${new Date().toLocaleDateString('th-TH')}\n`;
    textContent += `รูปแบบการจัดห้อง: ห้องละ ${event.targetCapacity} คน (${event.roomingMode})\n`;
    textContent += `จำนวนห้องพักทั้งหมด: ${rooms.length} ห้อง | นักเรียนที่รอจัดห้อง: ${unassignedCount} คน\n\n`;
    textContent += `--------------------------------------------------------\n\n`;

    rooms.forEach((r, idx) => {
      textContent += `ห้องที่ ${idx + 1}: ${r.roomNumber} (${r.buildingOrZone || 'อาคารหลัก'}) [ความจุ: ${(r.members || []).length}/${r.targetCapacity} คน]\n`;
      textContent += `สถานะห้อง: ${r.status === 'confirmed' ? '✓ ยืนยันแล้ว' : 'ข้อเสนอ'}\n`;
      const members = r.members || [];
      if (members.length === 0) {
        textContent += `  - (ยังไม่มีสมาชิกในห้องนี้)\n`;
      } else {
        members.forEach((m, mIdx) => {
          textContent += `  ${mIdx + 1}. ${m.studentName} (${m.classRoom} เลขที่ ${m.studentNo}) รหัส ${m.studentId} [${m.consentStatus === 'consented' ? 'ยินยอม' : 'รอตอบ'}]\n`;
        });
      }
      textContent += `\n`;
    });

    // 3. Batch Update Document with inserted text
    await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: textContent,
            },
          },
        ],
      }),
    });

    return {
      success: true,
      fileId: documentId,
      fileUrl: `https://docs.google.com/document/d/${documentId}/edit`,
    };
  } catch (error) {
    console.error('Google Docs Export Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อ Google Docs',
    };
  }
}
