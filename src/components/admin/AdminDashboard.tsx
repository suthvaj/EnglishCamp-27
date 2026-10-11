import React, { useState } from 'react';
import { 
  Users, 
  Send, 
  CheckCircle2, 
  Building2, 
  AlertCircle, 
  Clock, 
  TrendingUp, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { Student, PartnerRequest, Room, CampEvent } from '../../types';
import { purgeTrialAndMockData, clearAllRoomsAndRequests, wipeAllCampData } from '../../services/campService';

interface AdminDashboardProps {
  event: CampEvent;
  students: Student[];
  requests: PartnerRequest[];
  rooms: Room[];
  onNavigateTab: (tab: string) => void;
  onRefresh?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  event,
  students,
  requests,
  rooms,
  onNavigateTab,
  onRefresh,
}) => {
  const [isPurging, setIsPurging] = useState(false);
  const [isClearingRooms, setIsClearingRooms] = useState(false);
  const [isWipingAll, setIsWipingAll] = useState(false);

  // Modal State for Wiping
  const [showWipeModal, setShowWipeModal] = useState(false);
  const [wipeType, setWipeType] = useState<'rooms_only' | 'wipe_all'>('rooms_only');
  const [confirmInput, setConfirmInput] = useState('');

  const handlePurgeTrial = async () => {
    const confirmed = window.confirm('ต้องการหยุดโหมด Trial และลบข้อมูลนักเรียนจำลองทั้งหมด (18 คน) เพื่อเริ่มใช้งานจริงทันทีใช่หรือไม่?');
    if (!confirmed) return;

    setIsPurging(true);
    try {
      await purgeTrialAndMockData(event.id, 'admin');
      alert('หยุดโหมด Trial และล้าง Mock Data สำเร็จแล้ว เข้าสู่โหมดใช้งานจริง (Production Mode)');
      onRefresh?.();
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการล้างข้อมูลตัวอย่าง');
    } finally {
      setIsPurging(false);
    }
  };

  const handleExecuteWipe = async () => {
    if (wipeType === 'wipe_all') {
      setIsWipingAll(true);
      try {
        const res = await wipeAllCampData(event.id, 'admin');
        alert(`ล้างข้อมูลทั้งหมดสำเร็จแล้ว! ลบนักเรียน ${res.studentsCount} คน, ห้องพัก ${res.roomsCount} ห้อง, และคำขอ ${res.requestsCount} รายการ ระบบพร้อมสำหรับการเริ่มต้นใหม่`);
        setShowWipeModal(false);
        setConfirmInput('');
        onRefresh?.();
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการล้างข้อมูล');
      } finally {
        setIsWipingAll(false);
      }
    } else {
      setIsClearingRooms(true);
      try {
        await clearAllRoomsAndRequests(event.id, 'admin');
        alert('ล้างห้องพักและคำขอทั้งหมดเรียบร้อยแล้ว (ยังคงรายชื่อนักเรียนไว้)');
        setShowWipeModal(false);
        setConfirmInput('');
        onRefresh?.();
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการล้างข้อมูลห้องพัก');
      } finally {
        setIsClearingRooms(false);
      }
    }
  };
  const totalEligible = students.filter(s => s.isEligible).length;
  const submittedCount = students.filter(s => s.hasSubmittedChoices).length;
  const submissionRate = totalEligible > 0 ? Math.round((submittedCount / totalEligible) * 100) : 0;

  // Requests breakdown
  const pendingRequests = requests.filter(r => r.status === 'pending').length;
  const acceptedRequests = requests.filter(r => r.status === 'accepted').length;
  const rejectedRequests = requests.filter(r => r.status === 'rejected').length;
  const closedRequests = requests.filter(r => r.status === 'closed').length;

  // Rooms breakdown
  const assignedStudentDocIds = new Set<string>();
  rooms.forEach(r => {
    (r.members || []).forEach(m => assignedStudentDocIds.add(m.studentDocId));
  });

  const unassignedCount = students.filter(s => s.isEligible && !assignedStudentDocIds.has(s.id)).length;
  const confirmedRooms = rooms.filter(r => r.status === 'confirmed').length;
  const draftRooms = rooms.filter(r => r.status === 'draft_proposal' || r.status === 'pending_consent').length;

  // Breakdown by classroom
  const classrooms = Array.from(new Set(students.map(s => s.classRoom))).sort();

  return (
    <div className="space-y-6">
      
      {/* Top Banner with Room Mode Indicator */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-2">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            ภาพรวมกิจกรรม English Camp {event.academicYear}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Dashboard ผู้ดูแลระบบ
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            ติดตามสถานะการเลือกคู่นอนของนักเรียน ตรวจสอบคำขอ และบริหารจัดการจัดห้องพักแบบยืดหยุ่นตามกติกา
          </p>
        </div>

        {/* Rooming Mode Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 min-w-[240px]">
          <div className="text-xs text-indigo-200 font-semibold uppercase tracking-wider">
            รูปแบบห้องพักปัจจุบัน
          </div>
          <div className="text-xl font-black text-white mt-0.5">
            {event.targetCapacity} คนต่อห้อง
          </div>
          <div className="text-xs text-slate-300 mt-1 flex items-center justify-between">
            <span>โหมด: {event.roomingMode}</span>
            <button
              onClick={() => onNavigateTab('format')}
              className="text-indigo-300 hover:text-white font-bold underline cursor-pointer"
            >
              ปรับรูปแบบ
            </button>
          </div>
        </div>
      </div>

      {/* Trial Mode Alert Banner */}
      {event.isTrialMode !== false && students.some(s => s.isDemo) && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-amber-900 animate-in fade-in shadow-xs">
          <div className="flex items-start sm:items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black flex items-center text-amber-950">
                <span>โหมดทดลองใช้งาน (Trial Mode - ข้อมูลตัวอย่าง 18 คน)</span>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                กำลังแสดงนักเรียนจำลอง เมื่อคุณนำเข้าไฟล์ Excel ข้อมูลตัวอย่างจะถูกล้างให้อัตโนมัติ หรือกดปุ่มนี้เพื่อล้างข้อมูลและเริ่มใช้งานจริงทันที
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handlePurgeTrial}
            disabled={isPurging}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow-xs whitespace-nowrap cursor-pointer flex items-center justify-center flex-shrink-0"
          >
            {isPurging ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-1.5" />
            ) : (
              <Trash2 className="w-4 h-4 mr-1.5" />
            )}
            <span>หยุดโหมด Trial & ล้าง Mock Data</span>
          </button>
        </div>
      )}

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Students & Submission Progress */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              นักเรียนที่มีสิทธิ์
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">
            {totalEligible} <span className="text-sm font-semibold text-slate-400">คน</span>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1 font-semibold">
              <span className="text-slate-600">ส่งตัวเลือกแล้ว:</span>
              <span className="text-indigo-600">{submittedCount}/{totalEligible} ({submissionRate}%)</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${submissionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Partner Requests */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              คำขอทั้งหมด
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">
            {requests.length} <span className="text-sm font-semibold text-slate-400">คำขอ</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-1 text-[11px] font-medium text-slate-600">
            <div>• ตอบรับแล้ว: <span className="font-bold text-emerald-600">{acceptedRequests}</span></div>
            <div>• รอการตอบ: <span className="font-bold text-amber-600">{pendingRequests}</span></div>
            <div>• ปฏิเสธ: <span className="font-bold text-rose-500">{rejectedRequests}</span></div>
            <div>• สิ้นสุด: <span className="font-bold text-slate-500">{closedRequests}</span></div>
          </div>
        </div>

        {/* Card 3: Room Assignments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              ห้องพักในระบบ
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">
            {rooms.length} <span className="text-sm font-semibold text-slate-400">ห้อง</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-medium text-slate-600">
            <span>ยืนยันแล้ว: <strong className="text-emerald-700">{confirmedRooms}</strong></span>
            <span>ข้อเสนอ/รอยืนยัน: <strong className="text-indigo-600">{draftRooms}</strong></span>
          </div>
        </div>

        {/* Card 4: Unassigned Students */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              ยังไม่ได้จัดห้อง
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              unassignedCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
            }`}>
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-3xl font-black mt-2 ${
            unassignedCount > 0 ? 'text-amber-600' : 'text-emerald-600'
          }`}>
            {unassignedCount} <span className="text-sm font-semibold text-slate-400">คน</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              {unassignedCount > 0 ? 'ต้องจัดสรรห้องพัก' : 'จัดสรรครบทุกคนแล้ว'}
            </span>
            <button
              onClick={() => onNavigateTab('rooms')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center cursor-pointer"
            >
              จัดห้อง <ArrowRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Classroom Breakdown Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-900">
              ความคืบหน้าแยกตามห้องเรียน
            </h3>
            <p className="text-xs text-slate-500">
              เงื่อนไข: นักเรียนสามารถเลือกคู่นอนได้เฉพาะเพื่อนในห้องเรียนเดียวกันเท่านั้น
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">ห้องเรียน</th>
                <th className="py-3 px-4">จำนวนนักเรียน</th>
                <th className="py-3 px-4">ส่งตัวเลือกแล้ว</th>
                <th className="py-3 px-4">ยังไม่ส่ง</th>
                <th className="py-3 px-4">จัดห้องแล้ว</th>
                <th className="py-3 px-4">รอจัดห้อง</th>
                <th className="py-3 px-4">อัตราการเลือก</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classrooms.map(cName => {
                const classStudents = students.filter(s => s.classRoom === cName && s.isEligible);
                const classSubmitted = classStudents.filter(s => s.hasSubmittedChoices).length;
                const classPending = classStudents.length - classSubmitted;
                const classAssigned = classStudents.filter(s => assignedStudentDocIds.has(s.id)).length;
                const classUnassigned = classStudents.length - classAssigned;
                const rate = classStudents.length > 0 ? Math.round((classSubmitted / classStudents.length) * 100) : 0;

                return (
                  <tr key={cName} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900 text-sm">{cName}</td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{classStudents.length} คน</td>
                    <td className="py-3 px-4 text-emerald-600 font-bold">{classSubmitted} คน</td>
                    <td className="py-3 px-4 text-amber-600 font-medium">{classPending} คน</td>
                    <td className="py-3 px-4 text-indigo-600 font-bold">{classAssigned} คน</td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{classUnassigned} คน</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full"
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-800">{rate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Advanced Data Management & Wipe Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-rose-600" />
              การจัดการข้อมูลระบบ (System Data Management)
            </div>
            <h3 className="text-base font-black text-slate-900">
              ตัวเลือกการล้างและรีเซ็ตข้อมูลกิจกรรม
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              จัดการล้างผลการจัดห้องเพื่อเปิดรอบใหม่ หรือล้างข้อมูลทั้งหมดในระบบเพื่อเริ่มกิจกรรมรุ่นถัดไป
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          
          {/* Option 1: Clear Rooms & Requests only */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
            <div>
              <div className="font-bold text-sm text-slate-900 flex items-center">
                <RefreshCw className="w-4 h-4 mr-2 text-indigo-600" />
                ล้างเฉพาะห้องพักและคำขอ
              </div>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                ยกเลิกห้องพักทั้งหมด ({rooms.length} ห้อง) และลบคำขอทั้งหมด ({requests.length} คำขอ) แต่ <strong>ยังคงรายชื่อนักเรียนไว้ทั้งหมด ({students.length} คน)</strong> เพื่อเปิดรอบคู่นอนใหม่
              </p>
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={() => {
                  setWipeType('rooms_only');
                  setConfirmInput('');
                  setShowWipeModal(true);
                }}
                className="w-full py-2.5 px-4 bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
              >
                ล้างเฉพาะห้องพัก & คำขอ
              </button>
            </div>
          </div>

          {/* Option 2: Wipe Everything 100% */}
          <div className="p-5 rounded-2xl border border-rose-200 bg-rose-50/40 flex flex-col justify-between">
            <div>
              <div className="font-bold text-sm text-rose-900 flex items-center">
                <Trash2 className="w-4 h-4 mr-2 text-rose-600" />
                ล้างข้อมูลทั้งหมดในระบบ (Factory Reset)
              </div>
              <p className="text-xs text-rose-700 mt-1.5 leading-relaxed">
                ลบข้อมูลทุกอย่าง 100%: <strong>ลบนักเรียนทั้งหมด ({students.length} คน)</strong>, คำขอทั้งหมด, และห้องพักทั้งหมด คืนสู่ระบบว่างเปล่าสำหรับการเริ่มกิจกรรมปีใหม่
              </p>
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={() => {
                  setWipeType('wipe_all');
                  setConfirmInput('');
                  setShowWipeModal(true);
                }}
                className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                ล้างข้อมูลทั้งหมดในระบบ
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Confirmation Modal for Data Wipe */}
      {showWipeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
              wipeType === 'wipe_all' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700'
            }`}>
              <AlertCircle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-slate-900">
              {wipeType === 'wipe_all' ? 'ยืนยันการล้างข้อมูลทั้งหมดในระบบ?' : 'ยืนยันการล้างห้องพักและคำขอ?'}
            </h3>
            
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {wipeType === 'wipe_all'
                ? `การดำเนินการนี้จะลบนักเรียนทั้งหมด ${students.length} คน, ห้องพัก ${rooms.length} ห้อง, และคำขอ ${requests.length} รายการ ข้อมูลจะไม่สามารถกู้คืนได้`
                : `ระบบจะลบผลการจัดห้อง ${rooms.length} ห้อง และคำขอ ${requests.length} รายการออกทั้งหมด โดยคงรายชื่อนักเรียน ${students.length} คนไว้`}
            </p>

            <div className="my-5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <span className="font-bold text-slate-700 block">
                พิมพ์คำว่า <span className="text-rose-600 font-mono">CONFIRM</span> เพื่อยืนยัน:
              </span>
              <input
                type="text"
                value={confirmInput}
                onChange={e => setConfirmInput(e.target.value)}
                placeholder="CONFIRM"
                className="w-full px-3 py-2 border rounded-lg text-center font-mono font-bold text-sm bg-white"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowWipeModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                disabled={confirmInput !== 'CONFIRM' || isWipingAll || isClearingRooms}
                onClick={handleExecuteWipe}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-bold text-xs transition-colors cursor-pointer flex items-center"
              >
                {(isWipingAll || isClearingRooms) ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                )}
                <span>ยืนยันดำเนินการ</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
