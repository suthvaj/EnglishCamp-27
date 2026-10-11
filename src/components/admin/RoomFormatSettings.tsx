import React, { useState } from 'react';
import { 
  Sliders, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  ShieldAlert, 
  Building2,
  Users,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { CampEvent, RoomingMode, Room, PartnerRequest } from '../../types';
import { updateRoomingModeAndCapacity } from '../../services/campService';

interface RoomFormatSettingsProps {
  event: CampEvent;
  rooms: Room[];
  requests: PartnerRequest[];
  onSettingsSaved: () => void;
}

export const RoomFormatSettings: React.FC<RoomFormatSettingsProps> = ({
  event,
  rooms,
  requests,
  onSettingsSaved,
}) => {
  const [selectedMode, setSelectedMode] = useState<RoomingMode>(event.roomingMode || 'pair');
  const [targetCapacity, setTargetCapacity] = useState<number>(event.targetCapacity || 2);
  const [maxCapacity, setMaxCapacity] = useState<number>(event.maxCapacity || targetCapacity);
  const [minCapacity, setMinCapacity] = useState<number>(event.minCapacity || 2);
  const [allowPartialLastRoom, setAllowPartialLastRoom] = useState<boolean>(event.allowPartialLastRoom ?? true);
  const [allowUnevenRooms, setAllowUnevenRooms] = useState<boolean>(event.allowUnevenRooms ?? true);
  const [requireAllMemberConsent, setRequireAllMemberConsent] = useState<boolean>(event.requireAllMemberConsent ?? false);

  const [showWarningModal, setShowWarningModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Quick preset handlers
  const handleModeChange = (mode: RoomingMode) => {
    setSelectedMode(mode);
    if (mode === 'pair') {
      setTargetCapacity(2);
      setMaxCapacity(2);
      setMinCapacity(2);
      setRequireAllMemberConsent(false);
    } else if (mode === 'multi') {
      if (targetCapacity < 3) setTargetCapacity(4);
      setMaxCapacity(Math.max(4, targetCapacity));
      setMinCapacity(2);
      setRequireAllMemberConsent(true);
    } else if (mode === 'flexible') {
      setAllowUnevenRooms(true);
      setAllowPartialLastRoom(true);
    }
  };

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccessMessage(null);
    // If target capacity changed and there are existing rooms or accepted requests, show impact modal
    const hasExistingData = rooms.length > 0 || requests.some(r => r.status === 'accepted');
    if (hasExistingData && targetCapacity !== event.targetCapacity) {
      setShowWarningModal(true);
    } else {
      executeSave();
    }
  };

  const executeSave = async () => {
    setIsSaving(true);
    try {
      const res = await updateRoomingModeAndCapacity(
        event.id,
        selectedMode,
        targetCapacity,
        {
          maxCapacity,
          minCapacity,
          allowPartialLastRoom,
          requireAllMemberConsent,
        },
        'admin'
      );
      setSaveSuccessMessage(
        `บันทึกรูปแบบห้องพักสำเร็จ (เป้าหมาย: ${targetCapacity} คน/ห้อง) ระบบคงประวัติเดิมทั้งหมดเรียบร้อยแล้ว`
      );
      setShowWarningModal(false);
      onSettingsSaved();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกรูปแบบ');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="pb-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-2">
            <Sliders className="w-3.5 h-3.5 mr-1.5" />
            ข้อกำหนดสำคัญ (Custom Room Capacity)
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            กำหนดรูปแบบและจำนวนคนต่อห้องพัก
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            รองรับการปรับเปลี่ยนจากห้อง 2 คนเป็น 3, 4, 5+ คน หรือโหมด Flexible โดยไม่ทำให้ข้อมูลการเลือกคู่นอนสูญหาย
          </p>
        </div>
      </div>

      {saveSuccessMessage && (
        <div className="mt-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center">
          <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-600 flex-shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      <form onSubmit={handleOpenConfirm} className="mt-8 space-y-8">
        
        {/* Section 1: Rooming Mode Selection (7.1) */}
        <div>
          <label className="block text-sm font-black text-slate-900 mb-3">
            1. เลือกรูปแบบการจัดห้องพัก (Rooming Mode)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* Mode: Pair */}
            <button
              type="button"
              onClick={() => handleModeChange('pair')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedMode === 'pair'
                  ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 bg-slate-50 hover:bg-white'
              }`}
            >
              <div className="font-black text-sm text-slate-900 flex items-center justify-between">
                <span>ห้องละ 2 คน</span>
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              </div>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                สำหรับการจัดเป็นคู่ เมื่อตอบรับจะยืนยันคู่สำเร็จทันที
              </p>
            </button>

            {/* Mode: Multi */}
            <button
              type="button"
              onClick={() => handleModeChange('multi')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedMode === 'multi'
                  ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 bg-slate-50 hover:bg-white'
              }`}
            >
              <div className="font-black text-sm text-slate-900 flex items-center justify-between">
                <span>ห้องหลายคน</span>
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              </div>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                กำหนดจำนวน เช่น 3 หรือ 4 คน ตอบรับความประสงค์แล้วรวมกลุ่ม
              </p>
            </button>

            {/* Mode: Custom */}
            <button
              type="button"
              onClick={() => handleModeChange('custom')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedMode === 'custom'
                  ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 bg-slate-50 hover:bg-white'
              }`}
            >
              <div className="font-black text-sm text-slate-900 flex items-center justify-between">
                <span>จำนวนคนแบบ Custom</span>
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              </div>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                ป้อนจำนวนคนเป้าหมายด้วยตนเอง เช่น 5, 6 คน หรือตามขนาดห้องพักจริง
              </p>
            </button>

            {/* Mode: Flexible */}
            <button
              type="button"
              onClick={() => handleModeChange('flexible')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedMode === 'flexible'
                  ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 bg-slate-50 hover:bg-white'
              }`}
            >
              <div className="font-black text-sm text-slate-900 flex items-center justify-between">
                <span>Flexible Rooming</span>
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              </div>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                อนุญาตให้จำนวนคนแต่ละห้องแตกต่างกันตามขนาดของแต่ละห้อง
              </p>
            </button>

          </div>
        </div>

        {/* Section 2: Numerical Capacities (7.2) */}
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
          <h3 className="text-sm font-black text-slate-900">
            2. จำนวนคนเป้าหมายและข้อจำกัดต่อห้อง
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                จำนวนคนเป้าหมายต่อห้อง (Target)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={2}
                  max={20}
                  value={targetCapacity}
                  onChange={e => {
                    const val = parseInt(e.target.value, 10) || 2;
                    setTargetCapacity(val);
                    if (maxCapacity < val) setMaxCapacity(val);
                  }}
                  required
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl font-black text-slate-900 text-lg focus:ring-2 focus:ring-indigo-500"
                />
                <span className="absolute right-3.5 top-3.5 text-xs text-slate-400 font-bold">คน/ห้อง</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                จำนวนคนสูงสุดต่อห้อง (Max)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={targetCapacity}
                  max={25}
                  value={maxCapacity}
                  onChange={e => setMaxCapacity(parseInt(e.target.value, 10) || targetCapacity)}
                  required
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl font-black text-slate-900 text-lg focus:ring-2 focus:ring-indigo-500"
                />
                <span className="absolute right-3.5 top-3.5 text-xs text-slate-400 font-bold">คน/ห้อง</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                จำนวนคนขั้นต่ำต่อห้อง (Min)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={targetCapacity}
                  value={minCapacity}
                  onChange={e => setMinCapacity(parseInt(e.target.value, 10) || 1)}
                  required
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl font-black text-slate-900 text-lg focus:ring-2 focus:ring-indigo-500"
                />
                <span className="absolute right-3.5 top-3.5 text-xs text-slate-400 font-bold">คน/ห้อง</span>
              </div>
            </div>

          </div>
        </div>

        {/* Section 3: Rooming Policies and Toggles */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-900">
            3. นโยบายการจัดห้องและข้อยกเว้น
          </h3>

          <div className="space-y-3">
            
            {/* Toggle 1: Partial Last Room */}
            <label className="flex items-start space-x-3 p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={allowPartialLastRoom}
                onChange={e => setAllowPartialLastRoom(e.target.checked)}
                className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 mt-0.5"
              />
              <div>
                <span className="text-sm font-bold text-slate-900 block">
                  อนุญาตให้ห้องสุดท้ายมีสมาชิกน้อยกว่าเป้าหมาย
                </span>
                <span className="text-xs text-slate-500 block mt-0.5">
                  กรณีจำนวนนักเรียนในห้องเรียนหารไม่ลงตัวตามความจุเป้าหมาย ห้องสุดท้ายจะถูกสร้างด้วยจำนวนที่เหลือ
                </span>
              </div>
            </label>

            {/* Toggle 2: Require All Member Consent */}
            <label className="flex items-start space-x-3 p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={requireAllMemberConsent}
                onChange={e => setRequireAllMemberConsent(e.target.checked)}
                className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 mt-0.5"
              />
              <div>
                <span className="text-sm font-bold text-slate-900 block">
                  ต้องให้สมาชิกทุกคนในห้องกดยืนยันรายชื่อห้องพักก่อนสรุปผล
                </span>
                <span className="text-xs text-slate-500 block mt-0.5">
                  เหมาะสำหรับห้อง 3 หรือ 4 คน เพื่อให้มั่นใจว่าทุกคนยินยอมที่จะพักร่วมกันจริง
                </span>
              </div>
            </label>

            {/* Toggle 3: Allow Uneven Rooms */}
            <label className="flex items-start space-x-3 p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={allowUnevenRooms}
                onChange={e => setAllowUnevenRooms(e.target.checked)}
                className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 mt-0.5"
              />
              <div>
                <span className="text-sm font-bold text-slate-900 block">
                  อนุญาตให้แต่ละห้องพักมีจำนวนสมาชิกไม่เท่ากัน
                </span>
                <span className="text-xs text-slate-500 block mt-0.5">
                  ช่วยให้ผู้ดูแลสามารถจัดสรรห้องพักตามขนาดเตียงจริงของสถานที่ค่าย
                </span>
              </div>
            </label>

          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-end space-x-4">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Sliders className="w-4 h-4 mr-2" />
            )}
            <span>บันทึกการตั้งค่ารูปแบบห้องพัก</span>
          </button>
        </div>

      </form>

      {/* Confirmation Warning Dialog when changing existing data (Section 7.3) */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-black text-slate-900">
              แจ้งเตือนการเปลี่ยนแปลงรูปแบบห้องพัก
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              คุณกำลังจะเปลี่ยนรูปแบบห้องพักจาก <strong>ห้องละ {event.targetCapacity} คน</strong> เป็น <strong>ห้องละ {targetCapacity} คน</strong>
            </p>

            <div className="my-5 p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2 text-xs text-amber-900">
              <div className="font-bold flex items-center">
                <ShieldAlert className="w-4 h-4 mr-1.5 text-amber-700 flex-shrink-0" />
                ผลกระทบต่อข้อมูลที่มีอยู่:
              </div>
              <ul className="list-disc pl-5 space-y-1 text-amber-800">
                <li>ห้องพักที่มีอยู่เดิม: <strong>{rooms.length} ห้อง</strong> (จะไม่ถูกลบโดยอัตโนมัติ)</li>
                <li>คำขอที่นักเรียนส่งหากัน: <strong>{requests.length} รายการ</strong> (ประวัติคำขอจะคงอยู่ทั้งหมด)</li>
                <li>การตอบรับคำขอใหม่จะใช้กติกาของห้องละ {targetCapacity} คน</li>
                <li>ระบบจะบันทึกการเปลี่ยนแปลงและเหตุผลลงใน Activity Log</li>
              </ul>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowWarningModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={executeSave}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                ยืนยันการเปลี่ยนแปลง
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
