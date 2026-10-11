import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Sliders, 
  Building2, 
  FileSpreadsheet, 
  Users, 
  Send, 
  FileText, 
  History,
  Lock,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { CampEvent, Student, PartnerRequest, Room, ActivityLog } from '../../types';
import { AdminDashboard } from './AdminDashboard';
import { RoomFormatSettings } from './RoomFormatSettings';
import { RoomAssignmentManager } from './RoomAssignmentManager';
import { ExcelImportWizard } from './ExcelImportWizard';
import { StudentManager } from './StudentManager';
import { RequestMonitor } from './RequestMonitor';
import { ReportsAndExport } from './ReportsAndExport';
import { ActivityLogView } from './ActivityLogView';
import { User } from 'firebase/auth';

interface AdminPortalProps {
  event: CampEvent;
  students: Student[];
  requests: PartnerRequest[];
  rooms: Room[];
  logs: ActivityLog[];
  adminUser: User | null;
  onRefresh: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  event,
  students,
  requests,
  rooms,
  logs,
  adminUser,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [adminPasscode, setAdminPasscode] = useState('');
  const [isPasscodeUnlocked, setIsPasscodeUnlocked] = useState(false);

  // If user is logged in with Google or admin passcode is entered
  const isAuthorized = Boolean(adminUser) || isPasscodeUnlocked;

  const handlePasscodeUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasscode.trim() === 'admin1234' || adminPasscode.trim() === '1234') {
      setIsPasscodeUnlocked(true);
    } else {
      alert('รหัสผ่าน Admin Passcode ไม่ถูกต้อง (รหัสเริ่มต้น: admin1234)');
    }
  };

  // If not authorized yet, show quick unlock or Google Login
  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto my-12 px-4">
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            การเข้าถึงส่วนผู้ดูแลระบบ (Admin Portal)
          </h2>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            กรุณาลงชื่อเข้าใช้ด้วยบัญชี Google ของผู้ดูแลระบบ (Google Sign-In) หรือกรอก Admin Passcode ชั่วคราว
          </p>

          <form onSubmit={handlePasscodeUnlock} className="space-y-4">
            <div>
              <input
                type="password"
                value={adminPasscode}
                onChange={e => setAdminPasscode(e.target.value)}
                placeholder="กรอก Admin Passcode (เช่น admin1234)"
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-center text-sm font-mono"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              ปลดล็อคด้วย Admin Passcode
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-xs text-slate-400">
            หรือกดปุ่ม <strong>"Google Admin"</strong> ที่แถบเมนูด้านบนเพื่อยืนยันตัวตนด้วย Google
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'ภาพรวม', icon: LayoutDashboard },
    { id: 'format', label: 'รูปแบบห้องพัก', icon: Sliders },
    { id: 'rooms', label: 'จัดสรรห้องพัก', icon: Building2 },
    { id: 'import', label: 'นำเข้า Excel', icon: FileSpreadsheet },
    { id: 'students', label: 'ข้อมูลนักเรียน', icon: Users },
    { id: 'requests', label: 'ตรวจสอบคำขอ', icon: Send },
    { id: 'reports', label: 'รายงาน & ส่งออก', icon: FileText },
    { id: 'logs', label: 'ประวัติการทำงาน', icon: History },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      
      {/* Navigation Tabs Bar */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs overflow-x-auto flex">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[125px] flex items-center justify-center py-2.5 px-3 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-300'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4 mr-1.5 flex-shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Panels */}
      <div>
        {activeTab === 'dashboard' && (
          <AdminDashboard
            event={event}
            students={students}
            requests={requests}
            rooms={rooms}
            onNavigateTab={tab => setActiveTab(tab)}
            onRefresh={onRefresh}
          />
        )}

        {activeTab === 'format' && (
          <RoomFormatSettings
            event={event}
            rooms={rooms}
            requests={requests}
            onSettingsSaved={onRefresh}
          />
        )}

        {activeTab === 'rooms' && (
          <RoomAssignmentManager
            event={event}
            students={students}
            requests={requests}
            rooms={rooms}
            onRefresh={onRefresh}
          />
        )}

        {activeTab === 'import' && (
          <ExcelImportWizard
            eventId={event.id}
            onImportComplete={onRefresh}
          />
        )}

        {activeTab === 'students' && (
          <StudentManager
            event={event}
            students={students}
            onRefresh={onRefresh}
          />
        )}

        {activeTab === 'requests' && (
          <RequestMonitor requests={requests} />
        )}

        {activeTab === 'reports' && (
          <ReportsAndExport
            event={event}
            students={students}
            requests={requests}
            rooms={rooms}
          />
        )}

        {activeTab === 'logs' && (
          <ActivityLogView logs={logs} />
        )}
      </div>

    </div>
  );
};
