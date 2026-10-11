import React, { useState, useMemo } from 'react';
import { 
  Send, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Ban,
  ArrowRight
} from 'lucide-react';
import { PartnerRequest } from '../../types';

interface RequestMonitorProps {
  requests: PartnerRequest[];
}

export const RequestMonitor: React.FC<RequestMonitorProps> = ({ requests }) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      const q = searchTerm.toLowerCase().trim();
      const matchSearch = !q ||
        r.senderName.toLowerCase().includes(q) ||
        r.receiverName.toLowerCase().includes(q) ||
        r.senderClassRoom.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [requests, statusFilter, searchTerm]);

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            ติดตามรายการคำขอทั้งหมด (Request Monitor)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            ตรวจสอบความสัมพันธ์และสถานะคำขอที่นักเรียนส่งหากันแบบเรียลไทม์
          </p>
        </div>
        <div className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
          ทั้งหมด: {requests.length} คำขอ
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="all">ทุกสถานะ ({requests.length})</option>
            <option value="pending">รอการตอบรับ (Pending)</option>
            <option value="accepted">ตอบรับแล้ว (Accepted)</option>
            <option value="rejected">ปฏิเสธแล้ว (Rejected)</option>
            <option value="closed">สิ้นสุดแล้ว (Closed)</option>
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อผู้ส่ง หรือผู้รับ..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-2xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
            <tr>
              <th className="py-3 px-4">ผู้ส่งคำขอ</th>
              <th className="py-3 px-4">ห้องเรียน</th>
              <th className="py-3 px-4">ลำดับเลือก</th>
              <th className="py-3 px-4">ผู้รับคำขอ</th>
              <th className="py-3 px-4">สถานะคำขอ</th>
              <th className="py-3 px-4">วันเวลาส่ง</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRequests.map(r => (
              <tr key={r.id} className="hover:bg-slate-50/60">
                <td className="py-3 px-4 font-bold text-slate-900">
                  {r.senderName} (เลขที่ {r.senderStudentNo})
                </td>
                <td className="py-3 px-4 text-slate-600 font-medium">
                  {r.senderClassRoom}
                </td>
                <td className="py-3 px-4">
                  <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-800 inline-flex items-center justify-center font-bold font-mono">
                    {r.preferenceRank}
                  </span>
                </td>
                <td className="py-3 px-4 font-bold text-slate-800">
                  {r.receiverName} (เลขที่ {r.receiverStudentNo})
                </td>
                <td className="py-3 px-4">
                  {r.status === 'accepted' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> ตอบรับแล้ว
                    </span>
                  ) : r.status === 'rejected' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800">
                      <XCircle className="w-3 h-3 mr-1" /> ปฏิเสธ
                    </span>
                  ) : r.status === 'closed' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200 text-slate-700">
                      <Ban className="w-3 h-3 mr-1" /> สิ้นสุด
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800">
                      <Clock className="w-3 h-3 mr-1" /> รอการตอบ
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-slate-500 font-mono">
                  {new Date(r.createdAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};
