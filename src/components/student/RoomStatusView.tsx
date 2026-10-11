import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Check, 
  HelpCircle,
  MessageSquare
} from 'lucide-react';
import { Room, RoomMember, Student, CampEvent } from '../../types';
import { submitRoomConsent } from '../../services/campService';

interface RoomStatusViewProps {
  currentStudent: Student;
  event: CampEvent;
  assignedRoom: Room | null;
  onConsentSuccess: () => void;
}

export const RoomStatusView: React.FC<RoomStatusViewProps> = ({
  currentStudent,
  event,
  assignedRoom,
  onConsentSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [showReviewInput, setShowReviewInput] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!assignedRoom) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center">
        <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">ยังไม่มีการจัดห้องพักสำหรับคุณ</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          ขณะนี้อยู่ในช่วงเปิดรับตัวเลือกและประมวลผลความประสงค์ เมื่อผู้ดูแลระบบจัดกลุ่มและเสนอรายชื่อห้องพัก รายละเอียดจะแสดงที่นี่
        </p>
      </div>
    );
  }

  const members = assignedRoom.members || [];
  const currentMember = members.find(m => m.studentDocId === currentStudent.id);
  const isConfirmed = assignedRoom.status === 'confirmed';

  const handleConsent = async (consent: 'consented' | 'review_requested') => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await submitRoomConsent(
        event.id,
        assignedRoom.id,
        currentStudent.id,
        consent,
        reviewNote
      );
      setFeedback(consent === 'consented' ? 'ยืนยันรายชื่อห้องพักสำเร็จ' : 'ส่งคำขอทบทวนไปยังผู้ดูแลระบบแล้ว');
      setShowReviewInput(false);
      onConsentSuccess();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกสถานะ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              สถานะห้องพักของคุณ
            </h2>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              isConfirmed
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
            }`}>
              {isConfirmed ? 'ยืนยันห้องพักแล้ว' : 'ข้อเสนอจัดห้องพัก'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ห้อง: {assignedRoom.roomNumber} • {assignedRoom.buildingOrZone || 'ที่พักค่าย'} (ความจุ {assignedRoom.targetCapacity} คน)
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs font-bold text-slate-500">
            สมาชิกปัจจุบัน: {members.length} / {assignedRoom.targetCapacity} คน
          </span>
        </div>
      </div>

      {feedback && (
        <div className="mt-4 p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
          {feedback}
        </div>
      )}

      {/* Member Roster List */}
      <div className="mt-6 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          รายชื่อเพื่อนร่วมห้องพัก
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {members.map((m, idx) => {
            const isMe = m.studentDocId === currentStudent.id;
            return (
              <div
                key={m.id || idx}
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  isMe
                    ? 'bg-indigo-50/60 border-indigo-200'
                    : 'bg-slate-50/70 border-slate-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                    isMe ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {m.studentNo}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900 flex items-center">
                      <span>{m.studentName}</span>
                      {isMe && (
                        <span className="ml-1.5 px-1.5 py-0.2 bg-indigo-100 text-indigo-700 text-[10px] rounded font-semibold">
                          คุณ
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      ห้อง {m.classRoom} • เลขที่ {m.studentNo}
                    </div>
                  </div>
                </div>

                <div>
                  {m.consentStatus === 'consented' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-700">
                      <Check className="w-3 h-3 mr-0.5" /> ยืนยันแล้ว
                    </span>
                  ) : m.consentStatus === 'review_requested' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-100 text-rose-700">
                      ขอทบทวน
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-200 text-slate-600">
                      รอยืนยัน
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Member Consent Section (Section 5.1 & 8.3) */}
      {!isConfirmed && currentMember && (
        <div className="mt-8 pt-6 border-t border-slate-100 bg-slate-50/60 p-5 rounded-2xl border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                การยืนยันความประสงค์ในห้องพัก
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentMember.consentStatus === 'consented'
                  ? 'คุณได้ยืนยันความประสงค์สำหรับห้องพักนี้แล้ว'
                  : 'กรุณาตรวจสอบรายชื่อเพื่อนร่วมห้องและกดบันทึกความยินยอม'}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                disabled={isSubmitting || currentMember.consentStatus === 'consented'}
                onClick={() => handleConsent('consented')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                ✓ ยินยอมตามรายชื่อนี้
              </button>

              <button
                type="button"
                onClick={() => setShowReviewInput(!showReviewInput)}
                className="px-3 py-2 bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-600 border border-slate-200 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                ขอให้ทบทวนใหม่
              </button>
            </div>
          </div>

          {showReviewInput && (
            <div className="mt-4 pt-3 border-t border-slate-200">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ระบุเหตุผลหรือข้อเสนอแนะต่อผู้ดูแลระบบ:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={reviewNote}
                  onChange={e => setReviewNote(e.target.value)}
                  placeholder="เช่น ต้องการพักร่วมกับเพื่อนที่ตอบรับไว้..."
                  className="flex-1 px-3 py-2 text-xs border rounded-xl bg-white"
                />
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleConsent('review_requested')}
                  className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700 cursor-pointer"
                >
                  ส่งคำขอทบทวน
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
