import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  ExternalLink, 
  CheckCircle2, 
  RefreshCw, 
  AlertCircle,
  Table,
  Building2,
  Users
} from 'lucide-react';
import { CampEvent, Student, PartnerRequest, Room } from '../../types';
import { 
  exportCampDataToExcel, 
  exportCampDataToCSV 
} from '../../services/excelService';
import { 
  exportToGoogleSheets, 
  exportToGoogleDocs,
  WorkspaceExportResult 
} from '../../services/workspaceService';

interface ReportsAndExportProps {
  event: CampEvent;
  students: Student[];
  requests: PartnerRequest[];
  rooms: Room[];
}

export const ReportsAndExport: React.FC<ReportsAndExportProps> = ({
  event,
  students,
  requests,
  rooms,
}) => {
  const [isExportingSheets, setIsExportingSheets] = useState(false);
  const [isExportingDocs, setIsExportingDocs] = useState(false);
  const [sheetResult, setSheetResult] = useState<WorkspaceExportResult | null>(null);
  const [docResult, setDocResult] = useState<WorkspaceExportResult | null>(null);

  // Unassigned count
  const assignedStudentDocIds = new Set<string>();
  rooms.forEach(r => (r.members || []).forEach(m => assignedStudentDocIds.add(m.studentDocId)));
  const unassignedCount = students.filter(s => s.isEligible && !assignedStudentDocIds.has(s.id)).length;

  const handleExportExcel = () => {
    exportCampDataToExcel(event, students, requests, rooms);
  };

  const handleExportCSV = () => {
    exportCampDataToCSV(students, rooms);
  };

  const handlePrintA4 = () => {
    window.print();
  };

  // Google Sheets Export with mandatory confirmation
  const handleExportGoogleSheets = async () => {
    const confirmed = window.confirm(
      `คุณต้องการส่งออกข้อมูลการจัดห้องพักและรายชื่อนักเรียน (${students.length} คน, ${rooms.length} ห้อง) ไปยัง Google Sheets หรือไม่?`
    );
    if (!confirmed) return;

    setIsExportingSheets(true);
    setSheetResult(null);

    const result = await exportToGoogleSheets(event, students, rooms, requests);
    setSheetResult(result);
    setIsExportingSheets(false);
  };

  // Google Docs Export with mandatory confirmation
  const handleExportGoogleDocs = async () => {
    const confirmed = window.confirm(
      `คุณต้องการสร้างเอกสารบัญชีรายชื่อห้องพักฉบับทางการ (${rooms.length} ห้อง) ใน Google Docs หรือไม่?`
    );
    if (!confirmed) return;

    setIsExportingDocs(true);
    setDocResult(null);

    const result = await exportToGoogleDocs(event, rooms, unassignedCount);
    setDocResult(result);
    setIsExportingDocs(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="pb-6 border-b border-slate-100">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-2">
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            รายงานและการส่งออกข้อมูล (Export & Reports)
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            ศูนย์ส่งออกข้อมูลและจัดพิมพ์รายงาน A4
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            ดาวน์โหลดรายงาน Excel, CSV, พิมพ์เอกสาร A4 สำหรับแจกนักเรียน หรือเชื่อมต่อส่งออกไปยัง Google Workspace
          </p>
        </div>

        {/* Quick Export Buttons Grid */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Excel Export */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="p-5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 text-left transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Download className="w-5 h-5" />
            </div>
            <div className="font-bold text-sm text-slate-900">
              ดาวน์โหลด Excel (.xlsx)
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              รวมทุก Sheet: รายชื่อ, คำขอ, สรุปห้องพัก, และผู้รอจัดห้อง
            </p>
          </button>

          {/* CSV Export */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="p-5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 text-left transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Table className="w-5 h-5" />
            </div>
            <div className="font-bold text-sm text-slate-900">
              ดาวน์โหลด CSV
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              ตารางรวมรายชื่อนักเรียนและหมายเลขห้องพักที่จัดสรร
            </p>
          </button>

          {/* Print A4 */}
          <button
            type="button"
            onClick={handlePrintA4}
            className="p-5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 text-left transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Printer className="w-5 h-5" />
            </div>
            <div className="font-bold text-sm text-slate-900">
              พิมพ์รายงาน A4 (Print)
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              จัดหน้ากระดาษ A4 สวยงาม พร้อมสำหรับการพิมพ์แจกหน้าค่าย
            </p>
          </button>

          {/* Google Workspace Section Card */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
                <ExternalLink className="w-5 h-5" />
              </div>
              <div className="font-bold text-sm text-slate-900">
                Google Workspace
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                สร้าง Google Sheets & Google Docs อัตโนมัติ
              </p>
            </div>
          </div>

        </div>

        {/* Google Workspace Live Integration Actions */}
        <div className="mt-8 pt-8 border-t border-slate-100">
          <h3 className="text-sm font-black text-slate-900 mb-2">
            เชื่อมต่อ Google Drive & Google Docs & Google Sheets (OAuth)
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            ระบบจะสร้างไฟล์และบันทึกผลการจัดสรรห้องพักลงใน Google Drive ของคุณโดยตรง
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Action 1: Export to Google Sheets */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <div className="font-bold text-xs text-slate-800 flex items-center mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2" />
                  ส่งออกเป็น Google Spreadsheet
                </div>
                <p className="text-[11px] text-slate-500">
                  สร้างตารางข้อมูลสดใน Google Sheets พร้อมแยก Sheet ห้องพักและรายชื่อนักเรียน
                </p>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleExportGoogleSheets}
                  disabled={isExportingSheets}
                  className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50"
                >
                  {isExportingSheets ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  <span>ส่งออกไปยัง Google Sheets</span>
                </button>

                {sheetResult && (
                  <div className="mt-2 text-xs">
                    {sheetResult.success && sheetResult.fileUrl ? (
                      <a
                        href={sheetResult.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 font-bold underline flex items-center"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                        เปิดไฟล์ Google Sheet ที่สร้างขึ้น
                      </a>
                    ) : (
                      <span className="text-rose-600 font-medium">
                        {sheetResult.error}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action 2: Export to Google Docs */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <div className="font-bold text-xs text-slate-800 flex items-center mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-2" />
                  ส่งออกเป็นเอกสาร Google Docs ฉบับทางการ
                </div>
                <p className="text-[11px] text-slate-500">
                  สร้างเอกสารบัญชีรายชื่อห้องพักทางการ พร้อมระบุสมาชิกและสถานะการยืนยัน
                </p>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleExportGoogleDocs}
                  disabled={isExportingDocs}
                  className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50"
                >
                  {isExportingDocs ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  <span>ส่งออกไปยัง Google Docs</span>
                </button>

                {docResult && (
                  <div className="mt-2 text-xs">
                    {docResult.success && docResult.fileUrl ? (
                      <a
                        href={docResult.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-700 font-bold underline flex items-center"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-blue-600" />
                        เปิดเอกสาร Google Doc ที่สร้างขึ้น
                      </a>
                    ) : (
                      <span className="text-rose-600 font-medium">
                        {docResult.error}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Printable A4 Report View (Hidden from regular screen, formatted for print) */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 print:border-none print:shadow-none print:p-0">
        <div className="text-center pb-6 border-b border-slate-200">
          <h1 className="text-xl font-black text-slate-900 uppercase">
            รายงานการจัดสรรห้องพัก English Camp ประจำปีการศึกษา {event.academicYear}
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            กิจกรรม: {event.name} | จัดทำเมื่อ: {new Date().toLocaleDateString('th-TH')}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            รูปแบบห้องพัก: ห้องละ {event.targetCapacity} คน ({event.roomingMode}) | จำนวนห้องทั้งหมด: {rooms.length} ห้อง
          </p>
        </div>

        {/* Printable Rooms Table */}
        <div className="mt-6 space-y-4">
          {rooms.map((room, idx) => (
            <div key={room.id} className="border border-slate-200 rounded-xl p-3 text-xs page-break-inside-avoid">
              <div className="flex items-center justify-between font-bold text-slate-900 pb-2 border-b border-slate-100">
                <span>ห้องที่ {idx + 1}: {room.roomNumber} ({room.buildingOrZone || 'ที่พัก'})</span>
                <span className="text-slate-500">
                  สมาชิก: {(room.members || []).length} / {room.targetCapacity} คน [{room.status === 'confirmed' ? 'ยืนยันแล้ว' : 'ข้อเสนอ'}]
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                {(room.members || []).map((m, mIdx) => (
                  <div key={m.id || mIdx} className="p-1.5 bg-slate-50 rounded text-slate-800">
                    <span className="font-bold">{mIdx + 1}. {m.studentName}</span>
                    <div className="text-[10px] text-slate-500">
                      ห้อง {m.classRoom} เลขที่ {m.studentNo} (รหัส {m.studentId})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {unassignedCount > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-200 text-xs">
            <span className="font-bold text-amber-800">
              * นักเรียนที่ยังไม่ได้จัดสรรห้องพัก ({unassignedCount} คน):
            </span>
            <div className="mt-1 text-slate-600">
              {students
                .filter(s => s.isEligible && !assignedStudentDocIds.has(s.id))
                .map(s => `${s.firstName} ${s.lastName} (${s.classRoom} #${s.studentNo})`)
                .join(', ')}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
