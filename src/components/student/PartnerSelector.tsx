import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Check, 
  AlertCircle, 
  Send, 
  X, 
  HelpCircle,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { Student, CampEvent, PartnerRequest } from '../../types';
import { submitStudentPreferences } from '../../services/campService';

interface PartnerSelectorProps {
  currentStudent: Student;
  allStudents: Student[];
  event: CampEvent;
  existingSentRequests: PartnerRequest[];
  onSubmissionSuccess: () => void;
}

export const PartnerSelector: React.FC<PartnerSelectorProps> = ({
  currentStudent,
  allStudents,
  event,
  existingSentRequests,
  onSubmissionSuccess,
}) => {
  // Allowed peers: eligible, in the SAME classroom, not self
  const eligibleClassmates = useMemo(() => {
    return allStudents.filter(
      s => s.isEligible && s.classRoom === currentStudent.classRoom && s.id !== currentStudent.id
    );
  }, [allStudents, currentStudent]);

  const maxChoices = event.maxChoices || 3;
  const minChoices = event.minChoices || 1;

  // Initialize selected choices from existing requests if any
  const initialChoices = useMemo(() => {
    const list: (Student | null)[] = Array(maxChoices).fill(null);
    existingSentRequests
      .filter(r => r.senderId === currentStudent.id && r.status !== 'cancelled')
      .forEach(req => {
        const target = allStudents.find(s => s.id === req.receiverId);
        if (target && req.preferenceRank <= maxChoices) {
          list[req.preferenceRank - 1] = target;
        }
      });
    return list;
  }, [existingSentRequests, currentStudent, allStudents, maxChoices]);

  const [selectedRanks, setSelectedRanks] = useState<(Student | null)[]>(initialChoices);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filtered search results
  const filteredCandidates = useMemo(() => {
    if (!searchQuery.trim()) return eligibleClassmates;
    const q = searchQuery.toLowerCase().trim();
    return eligibleClassmates.filter(s =>
      s.firstName.toLowerCase().includes(q) ||
      s.lastName.toLowerCase().includes(q) ||
      `${s.prefix}${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
      s.studentNo.toString().includes(q)
    );
  }, [eligibleClassmates, searchQuery]);

  const handleSelectStudent = (slotIndex: number, student: Student) => {
    // Check if already selected in another slot
    const alreadySelectedInSlot = selectedRanks.findIndex(s => s?.id === student.id);
    if (alreadySelectedInSlot !== -1 && alreadySelectedInSlot !== slotIndex) {
      setStatusMessage({
        type: 'error',
        text: `คุณได้เลือก ${student.firstName} ในลำดับที่ ${alreadySelectedInSlot + 1} แล้ว ห้ามเลือกบุคคลเดิมซ้ำ`,
      });
      return;
    }

    const next = [...selectedRanks];
    next[slotIndex] = student;
    setSelectedRanks(next);
    setActiveSlot(null);
    setSearchQuery('');
    setStatusMessage(null);
  };

  const handleRemoveSlot = (slotIndex: number) => {
    const next = [...selectedRanks];
    next[slotIndex] = null;
    setSelectedRanks(next);
    setStatusMessage(null);
  };

  const handleSubmit = async () => {
    setStatusMessage(null);

    // Filter valid non-null choices
    const validChoices = selectedRanks.filter((s): s is Student => s !== null);

    if (validChoices.length < minChoices) {
      setStatusMessage({
        type: 'error',
        text: `กรุณาเลือกบุคคลที่ต้องการพักด้วยอย่างน้อย ${minChoices} ลำดับ`,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await submitStudentPreferences(event.id, currentStudent, validChoices);
      setStatusMessage({
        type: 'success',
        text: `ส่งคำขอคู่นอนพร้อมกัน ${validChoices.length} รายการเรียบร้อยแล้ว! บุคคลที่ได้รับสามารถพิจารณาตอบรับได้ทันที`,
      });
      onSubmissionSuccess();
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกตัวเลือก',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasChanges = useMemo(() => {
    for (let i = 0; i < maxChoices; i++) {
      if (selectedRanks[i]?.id !== initialChoices[i]?.id) return true;
    }
    return false;
  }, [selectedRanks, initialChoices, maxChoices]);

  const isLocked = currentStudent.hasSubmittedChoices && !event.allowEditChoices;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              เลือกบุคคลที่ต้องการพักด้วย
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              ห้องเรียน {currentStudent.classRoom}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            เลือกเพื่อนในห้องเรียนเดียวกัน (สูงสุด {maxChoices} ลำดับ) ระบบจะส่งคำขอไปยังทุกคนพร้อมกัน
          </p>
        </div>

        {currentStudent.hasSubmittedChoices && (
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            บันทึกตัวเลือกแล้ว
          </div>
        )}
      </div>

      {/* Status Alert */}
      {statusMessage && (
        <div
          className={`mt-6 p-4 rounded-2xl flex items-start space-x-3 text-sm animate-in fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
          )}
          <div className="font-semibold">{statusMessage.text}</div>
        </div>
      )}

      {/* Notice if locked */}
      {isLocked && (
        <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 text-amber-600" />
          กิจกรรมนี้ปิดการแก้ไขตัวเลือกแล้ว ตัวเลือกของคุณถูกล็อคตามรายการด้านล่าง
        </div>
      )}

      {/* Ranks Cards (1, 2, 3) */}
      <div className="mt-6 space-y-4">
        {Array.from({ length: maxChoices }).map((_, slotIndex) => {
          const selected = selectedRanks[slotIndex];
          const isSlotActive = activeSlot === slotIndex;

          return (
            <div
              key={slotIndex}
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                selected
                  ? 'border-indigo-200 bg-indigo-50/40 shadow-xs'
                  : isSlotActive
                  ? 'border-indigo-500 bg-white ring-2 ring-indigo-500/20'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                
                {/* Slot Identifier - Displayed as simple rank number */}
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${
                      selected
                        ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-300'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {slotIndex + 1}
                  </div>

                  <div>
                    {selected ? (
                      <div>
                        <div className="text-base font-bold text-slate-900">
                          {selected.prefix}{selected.firstName} {selected.lastName}
                        </div>
                        <div className="text-xs text-slate-500">
                          ห้อง {selected.classRoom} • เลขที่ {selected.studentNo}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <span className="text-sm font-semibold text-slate-500">
                          ยังไม่ได้เลือก
                        </span>
                        <div className="text-xs text-slate-400">
                          ลำดับที่ {slotIndex + 1}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {!isLocked && (
                  <div className="flex items-center space-x-2">
                    {selected ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveSlot(slotIndex)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="นำออก"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSlot(isSlotActive ? null : slotIndex);
                          setSearchQuery('');
                        }}
                        className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-indigo-600 border border-indigo-200 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        {isSlotActive ? 'ปิดค้นหา' : '+ เลือกเพื่อน'}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Autocomplete Search Dropdown inside active slot */}
              {isSlotActive && !isLocked && (
                <div className="mt-4 pt-4 border-t border-slate-200/80 animate-in fade-in">
                  <div className="relative mb-3">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="พิมพ์ชื่อหรือนามสกุลเพื่อนในห้อง..."
                      autoFocus
                      className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1 pr-1 divide-y divide-slate-100">
                    {filteredCandidates.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-400">
                        ไม่พบเพื่อนที่ตรงกับคำค้นหา
                      </div>
                    ) : (
                      filteredCandidates.map(candidate => {
                        const isAlreadyChosen = selectedRanks.some(s => s?.id === candidate.id);
                        return (
                          <button
                            key={candidate.id}
                            type="button"
                            disabled={isAlreadyChosen}
                            onClick={() => handleSelectStudent(slotIndex, candidate)}
                            className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left text-xs transition-colors ${
                              isAlreadyChosen
                                ? 'opacity-40 bg-slate-50 cursor-not-allowed'
                                : 'hover:bg-indigo-50 cursor-pointer'
                            }`}
                          >
                            <div>
                              <div className="font-bold text-slate-800 text-sm">
                                {candidate.prefix}{candidate.firstName} {candidate.lastName}
                              </div>
                              <div className="text-slate-500">
                                เลขที่ {candidate.studentNo} • ห้อง {candidate.classRoom}
                              </div>
                            </div>
                            {isAlreadyChosen ? (
                              <span className="text-[11px] text-slate-400">เลือกแล้ว</span>
                            ) : (
                              <span className="text-xs font-bold text-indigo-600">เลือก</span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* Submit Section */}
      {!isLocked && (
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 text-center sm:text-left">
            * ระบบจะสร้างคำขอไปยังทุกคนที่คุณเลือกพร้อมกัน เพื่อให้แต่ละคนสามารถตอบรับได้ทันที
          </p>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || selectedRanks.filter(Boolean).length < minChoices}
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            <span>
              {currentStudent.hasSubmittedChoices ? 'บันทึกการแก้ไขคำขอ' : 'ส่งคำขอคู่นอนพร้อมกัน'}
            </span>
          </button>
        </div>
      )}

    </div>
  );
};
