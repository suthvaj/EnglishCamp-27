import React from 'react';
import { 
  Send, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Ban, 
  HelpCircle,
  Calendar
} from 'lucide-react';
import { PartnerRequest, Student } from '../../types';

interface SentRequestsProps {
  sentRequests: PartnerRequest[];
}

export const SentRequests: React.FC<SentRequestsProps> = ({ sentRequests }) => {
  const getStatusBadge = (status: PartnerRequest['status']) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            ตอบรับแล้ว
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 mr-1 text-rose-500" />
            ปฏิเสธแล้ว
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <Ban className="w-3.5 h-3.5 mr-1 text-slate-400" />
            สิ้นสุด (จับคู่อื่นแล้ว)
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 mr-1 text-amber-500" />
            รอการตอบรับ
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
      <div className="flex items-center justify-between pb-6 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            คำขอที่คุณส่งออกไป
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            สถานะของคำขอที่ส่งไปยังเพื่อนที่คุณเลือกทั้ง 3 ลำดับ
          </p>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
          {sentRequests.length} รายการ
        </span>
      </div>

      <div className="mt-6">
        {sentRequests.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            คุณยังไม่ได้ส่งคำขอคู่นอน กรุณาเลือกเพื่อนในแถบ "เลือกคู่นอน"
          </div>
        ) : (
          <div className="space-y-3">
            {sentRequests.map((req, idx) => (
              <div
                key={req.id}
                className="p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-black text-xs">
                    {req.preferenceRank}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">
                      {req.receiverName}
                    </div>
                    <div className="text-xs text-slate-500">
                      ห้อง {req.receiverClassRoom} • เลขที่ {req.receiverStudentNo}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-3">
                  <span className="text-[11px] text-slate-400">
                    ส่งเมื่อ: {new Date(req.createdAt).toLocaleDateString('th-TH')}
                  </span>
                  {getStatusBadge(req.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
