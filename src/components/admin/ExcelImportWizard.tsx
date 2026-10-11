import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  RefreshCw,
  FileCheck,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { 
  downloadExcelTemplate, 
  parseAndValidateExcel 
} from '../../services/excelService';
import { batchImportStudents } from '../../services/campService';
import { ImportValidationResult, Student } from '../../types';

interface ExcelImportWizardProps {
  eventId: string;
  onImportComplete: () => void;
}

export const ExcelImportWizard: React.FC<ExcelImportWizardProps> = ({
  eventId,
  onImportComplete,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResults, setParseResults] = useState<{
    rows: ImportValidationResult[];
    validCount: number;
    invalidCount: number;
    totalCount: number;
  } | null>(null);

  const [isImporting, setIsImporting] = useState(false);
  const [clearMockData, setClearMockData] = useState(true);
  const [importSummary, setImportSummary] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsParsing(true);
    setParseResults(null);
    setImportSummary(null);

    try {
      const results = await parseAndValidateExcel(selectedFile);
      setParseResults(results);
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการอ่านไฟล์ Excel กรุณาตรวจสอบว่าเป็นไฟล์ .xlsx ที่ถูกต้อง');
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!parseResults) return;
    const validRows = parseResults.rows.filter(r => r.isValid).map(r => r.data);
    if (validRows.length === 0) {
      alert('ไม่มีรายการที่ผ่านการตรวจสอบ กรุณาแก้ไขข้อผิดพลาดในไฟล์ก่อนนำเข้า');
      return;
    }

    setIsImporting(true);

    try {
      const studentsToInsert: Omit<Student, 'id'>[] = validRows.map(r => ({
        studentId: r.student_id,
        prefix: r.prefix,
        firstName: r.first_name,
        lastName: r.last_name,
        classRoom: r.class_room,
        studentNo: typeof r.student_no === 'number' ? r.student_no : parseInt(String(r.student_no), 10) || 1,
        gender: r.gender,
        mustChangePin: true,
        failedPinAttempts: 0,
        isLocked: false,
        isEligible: true,
        eventId,
        hasSubmittedChoices: false,
      }));

      const count = await batchImportStudents(eventId, studentsToInsert, clearMockData);
      setImportSummary(`นำเข้าข้อมูลนักเรียนสำเร็จจำนวน ${count} คน (โหมดใช้งานจริง) พร้อมจัดเตรียมบัญชีเริ่มต้นด้วย PIN 1234 (บังคับเปลี่ยนเมื่อใช้งานครั้งแรก)`);
      setParseResults(null);
      setFile(null);
      onImportComplete();
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูลนักเรียน');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs max-w-4xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="pb-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-2">
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
            Excel Import Wizard
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            นำเข้ารายชื่อนักเรียนจาก Excel
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            ดาวน์โหลด Template, ตรวจสอบความถูกต้องของแถวข้อมูล ป้องกันเลขประจำตัวหรือเลขที่ซ้ำ ก่อนนำเข้าสู่ระบบจริง
          </p>
        </div>

        {/* Download Template Button */}
        <button
          type="button"
          onClick={downloadExcelTemplate}
          className="inline-flex items-center px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4 mr-2 text-indigo-600" />
          <span>ดาวน์โหลด Excel Template (.xlsx)</span>
        </button>
      </div>

      {importSummary && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center">
          <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-600 flex-shrink-0" />
          <span>{importSummary}</span>
        </div>
      )}

      {/* Step 1 & 2: Upload Zone */}
      <div className="p-8 border-2 border-dashed border-slate-300 rounded-3xl bg-slate-50/50 text-center hover:bg-slate-50 transition-colors">
        <Upload className="w-10 h-10 text-indigo-500 mx-auto mb-3" />
        <h3 className="text-sm font-black text-slate-800">
          อัปโหลดไฟล์รายชื่อนักเรียน (.xlsx)
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          ไฟล์ต้องประกอบด้วยคอลัมน์: student_id, prefix, first_name, last_name, class_room, student_no, gender
        </p>

        <div className="mt-5">
          <label className="inline-flex items-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20 cursor-pointer transition-all">
            <span>เลือกไฟล์ Excel</span>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        {file && (
          <div className="mt-3 text-xs font-semibold text-slate-600">
            ไฟล์ที่เลือก: <span className="text-indigo-600 font-bold">{file.name}</span> ({(file.size / 1024).toFixed(1)} KB)
          </div>
        )}
      </div>

      {isParsing && (
        <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center space-x-2">
          <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
          <span>กำลังตรวจสอบแถวข้อมูลและเงื่อนไขความถูกต้อง...</span>
        </div>
      )}

      {/* Step 3: Preview and Row Validation Table */}
      {parseResults && (
        <div className="space-y-4 animate-in fade-in">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-100 rounded-2xl">
            <div className="space-y-1">
              <div className="flex items-center space-x-4 text-xs font-bold">
                <span className="text-slate-700">ทั้งหมด: {parseResults.totalCount} แถว</span>
                <span className="text-emerald-700">✓ ถูกต้อง: {parseResults.validCount} แถว</span>
                {parseResults.invalidCount > 0 && (
                  <span className="text-rose-700">✕ ข้อผิดพลาด: {parseResults.invalidCount} แถว</span>
                )}
              </div>
              <label className="flex items-center space-x-2 text-xs text-slate-700 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={clearMockData}
                  onChange={e => setClearMockData(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span>ล้างข้อมูลตัวอย่าง (Trial / Mock Data) ทั้งหมด เพื่อเริ่มใช้งานจริงทันที</span>
              </label>
            </div>

            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={isImporting || parseResults.validCount === 0}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
            >
              {isImporting ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              <span>ยืนยันการนำเข้า {parseResults.validCount} รายการ</span>
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase sticky top-0">
                <tr>
                  <th className="py-3 px-3 w-16">แถว</th>
                  <th className="py-3 px-3">สถานะ</th>
                  <th className="py-3 px-3">เลขประจำตัว</th>
                  <th className="py-3 px-3">ชื่อ-นามสกุล</th>
                  <th className="py-3 px-3">ห้องเรียน</th>
                  <th className="py-3 px-3">เลขที่</th>
                  <th className="py-3 px-3">ข้อผิดพลาดที่พบ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parseResults.rows.map(row => (
                  <tr
                    key={row.rowNumber}
                    className={row.isValid ? 'hover:bg-slate-50/50' : 'bg-rose-50/40 hover:bg-rose-50/70'}
                  >
                    <td className="py-2.5 px-3 font-mono text-slate-400">{row.rowNumber}</td>
                    <td className="py-2.5 px-3">
                      {row.isValid ? (
                        <span className="inline-flex items-center text-emerald-600 font-bold">
                          ✓ ผ่าน
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-rose-600 font-bold">
                          ✕ ไม่ผ่าน
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                      {row.data.student_id || '-'}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      {row.data.prefix}{row.data.first_name} {row.data.last_name}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">
                      {row.data.class_room || '-'}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">
                      {row.data.student_no || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-rose-600 font-medium">
                      {row.errors.length > 0 ? row.errors.join(', ') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

    </div>
  );
};
