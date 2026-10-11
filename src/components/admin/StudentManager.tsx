import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  KeyRound, 
  Plus, 
  Check, 
  X, 
  ShieldAlert, 
  CheckCircle2,
  Lock,
  Unlock,
  AlertCircle
} from 'lucide-react';
import { Student, CampEvent } from '../../types';
import { 
  addOrUpdateStudent, 
  updateStudentPin 
} from '../../services/campService';
import { generateTemporaryPin } from '../../services/crypto';

interface StudentManagerProps {
  event: CampEvent;
  students: Student[];
  onRefresh: () => void;
}

export const StudentManager: React.FC<StudentManagerProps> = ({
  event,
  students,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [resetPinStudent, setResetPinStudent] = useState<Student | null>(null);
  const [newCustomPin, setNewCustomPin] = useState('');
  const [pinResetMessage, setPinResetMessage] = useState<string | null>(null);

  // New student form state
  const [formStudentId, setFormStudentId] = useState('');
  const [formPrefix, setFormPrefix] = useState('เด็กชาย');
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formClassRoom, setFormClassRoom] = useState('ม.3/4');
  const [formStudentNo, setFormStudentNo] = useState(1);
  const [formGender, setFormGender] = useState('ชาย');

  const classrooms = useMemo(() => {
    return Array.from(new Set(students.map(s => s.classRoom))).sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchClass = selectedClass === 'all' || s.classRoom === selectedClass;
      const q = searchTerm.toLowerCase().trim();
      const matchSearch = !q ||
        s.studentId.includes(q) ||
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        `${s.prefix}${s.firstName} ${s.lastName}`.toLowerCase().includes(q);
      return matchClass && matchSearch;
    });
  }, [students, selectedClass, searchTerm]);

  // Toggle eligibility
  const handleToggleEligibility = async (student: Student) => {
    try {
      await addOrUpdateStudent(
        event.id,
        {
          studentId: student.studentId,
          prefix: student.prefix,
          firstName: student.firstName,
          lastName: student.lastName,
          classRoom: student.classRoom,
          studentNo: student.studentNo,
          gender: student.gender,
          isEligible: !student.isEligible,
          eventId: event.id,
          hasSubmittedChoices: student.hasSubmittedChoices,
        },
        student.id
      );
      onRefresh();
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเปลี่ยนสถานะสิทธิ์');
    }
  };

  // Reset PIN
  const handleResetPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPinStudent) return;

    const pinToSet = newCustomPin.trim() || generateTemporaryPin();
    try {
      await updateStudentPin(event.id, resetPinStudent.id, pinToSet, true);
      setPinResetMessage(`รีเซ็ต PIN สำหรับ ${resetPinStudent.firstName} สำเร็จเป็น: ${pinToSet} (ต้องเปลี่ยนเมื่อเข้าสู่ระบบ)`);
      setNewCustomPin('');
      onRefresh();
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการรีเซ็ต PIN');
    }
  };

  // Add Student
  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudentId.trim() || !formFirstName.trim() || !formLastName.trim()) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    try {
      await addOrUpdateStudent(event.id, {
        studentId: formStudentId.trim(),
        prefix: formPrefix,
        firstName: formFirstName.trim(),
        lastName: formLastName.trim(),
        classRoom: formClassRoom.trim(),
        studentNo: formStudentNo,
        gender: formGender,
        isEligible: true,
        eventId: event.id,
        hasSubmittedChoices: false,
      });
      setShowAddModal(false);
      setFormStudentId('');
      setFormFirstName('');
      setFormLastName('');
      onRefresh();
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเพิ่มนักเรียน');
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            จัดการรายชื่อนักเรียนและบัญชีผู้ใช้
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            ตรวจสอบสิทธิ์ กำหนดห้องเรียน และรีเซ็ตรหัส PIN ชั่วคราวให้นักเรียน
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>เพิ่มนักเรียนใหม่</span>
        </button>
      </div>

      {pinResetMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
            <span>{pinResetMessage}</span>
          </div>
          <button onClick={() => setPinResetMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="all">ทุกห้องเรียน ({students.length} คน)</option>
            {classrooms.map(c => (
              <option key={c} value={c}>ห้อง {c}</option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อ, รหัสประจำตัว..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-2xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
            <tr>
              <th className="py-3 px-4">เลขประจำตัว</th>
              <th className="py-3 px-4">ชื่อ-นามสกุล</th>
              <th className="py-3 px-4">ห้องเรียน</th>
              <th className="py-3 px-4">เลขที่</th>
              <th className="py-3 px-4">สถานะส่งตัวเลือก</th>
              <th className="py-3 px-4">สิทธิ์เข้าร่วม</th>
              <th className="py-3 px-4 text-right">การจัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStudents.map(stu => (
              <tr key={stu.id} className="hover:bg-slate-50/60">
                <td className="py-3 px-4 font-mono font-bold text-slate-900">
                  {stu.studentId}
                </td>
                <td className="py-3 px-4 font-semibold text-slate-800">
                  {stu.prefix}{stu.firstName} {stu.lastName}
                </td>
                <td className="py-3 px-4 font-medium text-slate-600">
                  {stu.classRoom}
                </td>
                <td className="py-3 px-4 font-medium text-slate-600">
                  {stu.studentNo}
                </td>
                <td className="py-3 px-4">
                  {stu.hasSubmittedChoices ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      ✓ ส่งแล้ว
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800">
                      ยังไม่ส่ง
                    </span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <button
                    type="button"
                    onClick={() => handleToggleEligibility(stu)}
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                      stu.isEligible
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    }`}
                  >
                    {stu.isEligible ? 'มีสิทธิ์' : 'ระงับสิทธิ์'}
                  </button>
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setResetPinStudent(stu);
                      setNewCustomPin('');
                    }}
                    className="inline-flex items-center px-2.5 py-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-3 h-3 mr-1" />
                    <span>รีเซ็ต PIN</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal: Reset PIN */}
      {resetPinStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-black text-slate-900 mb-1">
              รีเซ็ต PIN นักเรียน
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              กำหนด PIN ใหม่สำหรับ {resetPinStudent.firstName} {resetPinStudent.lastName} (รหัส {resetPinStudent.studentId})
            </p>

            <form onSubmit={handleResetPinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  กำหนด PIN ใหม่ (หรือเว้นว่างเพื่อสร้างรหัสสุ่ม)
                </label>
                <input
                  type="text"
                  value={newCustomPin}
                  onChange={e => setNewCustomPin(e.target.value)}
                  placeholder="เช่น 1234"
                  maxLength={6}
                  className="w-full px-3 py-2 border rounded-xl text-sm font-mono text-center"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResetPinStudent(null)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  ยืนยันรีเซ็ต
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Student */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-black text-slate-900 mb-1">
              เพิ่มข้อมูลนักเรียนใหม่
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              กรอกข้อมูลเพื่อลงทะเบียนนักเรียนเข้าร่วมกิจกรรม English Camp
            </p>

            <form onSubmit={handleAddStudentSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  เลขประจำตัวนักเรียน
                </label>
                <input
                  type="text"
                  value={formStudentId}
                  onChange={e => setFormStudentId(e.target.value)}
                  placeholder="เช่น 10099"
                  required
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">คำนำหน้า</label>
                  <select
                    value={formPrefix}
                    onChange={e => setFormPrefix(e.target.value)}
                    className="w-full px-2 py-2 border rounded-xl text-xs"
                  >
                    <option value="เด็กชาย">เด็กชาย</option>
                    <option value="เด็กหญิง">เด็กหญิง</option>
                    <option value="นาย">นาย</option>
                    <option value="นางสาว">นางสาว</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อ</label>
                  <input
                    type="text"
                    value={formFirstName}
                    onChange={e => setFormFirstName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">นามสกุล</label>
                  <input
                    type="text"
                    value={formLastName}
                    onChange={e => setFormLastName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ห้องเรียน</label>
                  <input
                    type="text"
                    value={formClassRoom}
                    onChange={e => setFormClassRoom(e.target.value)}
                    placeholder="เช่น ม.3/4"
                    required
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">เลขที่</label>
                  <input
                    type="number"
                    min={1}
                    value={formStudentNo}
                    onChange={e => setFormStudentNo(parseInt(e.target.value, 10) || 1)}
                    required
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">เพศ</label>
                  <select
                    value={formGender}
                    onChange={e => setFormGender(e.target.value)}
                    className="w-full px-2 py-2 border rounded-xl text-xs"
                  >
                    <option value="ชาย">ชาย</option>
                    <option value="หญิง">หญิง</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
