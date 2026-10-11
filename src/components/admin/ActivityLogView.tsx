import React, { useState } from 'react';
import { 
  History, 
  Search, 
  ShieldCheck, 
  Clock, 
  Sliders, 
  Users, 
  Building2, 
  FileSpreadsheet 
} from 'lucide-react';
import { ActivityLog } from '../../types';

interface ActivityLogViewProps {
  logs: ActivityLog[];
}

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({ logs }) => {
  const [search, setSearch] = useState('');

  const filteredLogs = logs.filter(log => {
    const q = search.toLowerCase().trim();
    return !q ||
      log.action.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.performedBy.toLowerCase().includes(q);
  });

  const getCategoryIcon = (category: ActivityLog['category']) => {
    switch (category) {
      case 'room':
        return <Building2 className="w-4 h-4 text-indigo-500" />;
      case 'student':
        return <Users className="w-4 h-4 text-emerald-500" />;
      case 'import':
        return <FileSpreadsheet className="w-4 h-4 text-blue-500" />;
      case 'event':
        return <Sliders className="w-4 h-4 text-amber-500" />;
      default:
        return <History className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            ประวัติการดำเนินการ (Activity Logs)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            บันทึกการกระทำสำคัญ เช่น การเปลี่ยนความจุห้องพัก การนำเข้า การจัดห้อง และการรีเซ็ต PIN
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหาในบันทึก..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
          />
        </div>
      </div>

      {/* Log Feed */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            ไม่พบบันทึกกิจกรรม
          </div>
        ) : (
          filteredLogs.map(log => (
            <div
              key={log.id}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs mt-0.5">
                  {getCategoryIcon(log.category)}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">
                    {log.action}
                  </div>
                  <div className="text-slate-600 mt-0.5">
                    {log.details}
                  </div>
                  <div className="text-slate-400 text-[11px] mt-1 flex items-center space-x-2">
                    <span>ผู้ดำเนินการ: <strong className="text-slate-600">{log.performedBy}</strong></span>
                    <span>•</span>
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(log.timestamp).toLocaleString('th-TH')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
