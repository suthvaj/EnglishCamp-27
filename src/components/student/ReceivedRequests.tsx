import React, { useState } from 'react';
import { 
  Inbox, 
  Check, 
  X, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  UserCheck,
  Info,
  Calendar
} from 'lucide-react';
import { Student, PartnerRequest, CampEvent } from '../../types';
import { respondToPartnerRequest } from '../../services/campService';

interface ReceivedRequestsProps {
  currentStudent: Student;
  event: CampEvent;
  receivedRequests: PartnerRequest[];
  onActionComplete: () => void;
}

export const ReceivedRequests: React.FC<ReceivedRequestsProps> = ({
  currentStudent,
  event,
  receivedRequests,
  onActionComplete,
}) => {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isPairMode = event.targetCapacity === 2;
  const maxAcceptable = Math.max(1, event.targetCapacity - 1);

  const currentlyAcceptedCount = receivedRequests.filter(r => r.status === 'accepted').length;

  const handleRespond = async (request: PartnerRequest, accept: boolean) => {
    setProcessingId(request.id);
    setFeedback(null);

    try {
      const res = await respondToPartnerRequest(event.id, request.id, accept, currentStudent, event);
      setFeedback({ type: 'success', message: res.message });
      onActionComplete();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการตอบรับคำขอ',
      });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              คำขอที่ได้รับจากเพื่อน
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {receivedRequests.length} รายการ
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            รายการเพื่อนในห้อง {currentStudent.classRoom} ที่ส่งคำขอเลือกคุณเป็นคู่นอน
          </p>
        </div>

        {/* Capacity Info Badge */}
        <div className="inline-flex items-center px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
          <Info className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
          <span>
            {isPairMode
              ? 'ห้องพักละ 2 คน (การตอบรับจะยืนยันคู่ทันที)'
              : `ห้องพัก ${event.targetCapacity} คน (ตอบรับได้สูงสุด ${maxAcceptable} คน เพื่อรอจัดกลุ่ม)`}
          </span>
        </div>
      </div>

      {/* Feedback Message */}
      {feedback && (
        <div
          className={`mt-6 p-4 rounded-2xl flex items-start space-x-3 text-sm animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
          )}
          <span className="font-semibold">{feedback.message}</span>
        </div>
      )}

      {/* Request List */}
      <div className="mt-6">
        {receivedRequests.length === 0 ? (
          <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-3xl">
            <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">ยังไม่มีคำขอที่ส่งถึงคุณ</h3>
            <p className="text-xs text-slate-400 mt-1">
              เมื่อมีเพื่อนในห้องเรียนเดียวกันเลือกคุณ รายการจะปรากฏที่นี่แบบเรียลไทม์
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {receivedRequests.map(req => {
              const isPending = req.status === 'pending';
              const isAccepted = req.status === 'accepted';
              const isRejected = req.status === 'rejected';
              const isClosed = req.status === 'closed';
              const isProcessing = processingId === req.id;

              return (
                <div
                  key={req.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    isAccepted
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : isPending
                      ? 'bg-white border-slate-200 shadow-xs hover:border-indigo-200'
                      : 'bg-slate-50/60 border-slate-200 opacity-75'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    
                    {/* Sender Info - Does NOT reveal preference rank */}
                    <div className="flex items-start space-x-3.5">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {req.senderStudentNo}
                      </div>

                      <div>
                        <div className="text-base font-bold text-slate-900">
                          {req.senderName}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center space-x-2 mt-0.5">
                          <span>ห้อง {req.senderClassRoom} • เลขที่ {req.senderStudentNo}</span>
                          <span>•</span>
                          <span className="flex items-center text-slate-400">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(req.createdAt).toLocaleDateString('th-TH', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center space-x-2 self-end sm:self-center">
                      {isPending ? (
                        <>
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleRespond(req, true)}
                            className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            <span>{isProcessing ? 'กำลังบันทึก...' : 'ตอบรับ'}</span>
                          </button>

                          {event.allowRejectRequests && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleRespond(req, false)}
                              className="inline-flex items-center px-3 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-semibold text-xs rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              <X className="w-4 h-4 mr-1" />
                              <span>ปฏิเสธ</span>
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center">
                          {isAccepted && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                              ตอบรับแล้ว
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                              <X className="w-3.5 h-3.5 mr-1 text-rose-600" />
                              ปฏิเสธแล้ว
                            </span>
                          )}
                          {isClosed && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-700">
                              สิ้นสุดแล้ว (จัดคู่แล้ว)
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
