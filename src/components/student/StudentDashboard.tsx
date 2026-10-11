import React, { useState } from 'react';
import { 
  User, 
  Send, 
  Inbox, 
  Building2, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Student, CampEvent, PartnerRequest, Room } from '../../types';
import { PartnerSelector } from './PartnerSelector';
import { ReceivedRequests } from './ReceivedRequests';
import { SentRequests } from './SentRequests';
import { RoomStatusView } from './RoomStatusView';

interface StudentDashboardProps {
  student: Student;
  allStudents: Student[];
  event: CampEvent;
  requests: PartnerRequest[];
  rooms: Room[];
  onRefresh: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  student,
  allStudents,
  event,
  requests,
  rooms,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'select' | 'received' | 'sent' | 'room'>('select');

  // Filter requests
  const sentRequests = requests.filter(r => r.senderId === student.id);
  const receivedRequests = requests.filter(r => r.receiverId === student.id);

  // Find student's assigned room
  const assignedRoom = rooms.find(r =>
    (r.members || []).some(m => m.studentDocId === student.id)
  ) || null;

  const pendingReceivedCount = receivedRequests.filter(r => r.status === 'pending').length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      
      {/* Student Profile & Status Hero Card */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center font-black text-2xl sm:text-3xl text-white border border-white/20 shadow-inner">
              {student.studentNo}
            </div>
            <div>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-indigo-50 mb-1 border border-white/20">
                <Sparkles className="w-3 h-3 mr-1" />
                {event.name}
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                {student.prefix}{student.firstName} {student.lastName}
              </h1>
              <p className="text-xs sm:text-sm text-indigo-100 mt-0.5">
                เลขประจำตัว: <span className="font-mono font-bold">{student.studentId}</span> • ชั้นเรียน: <span className="font-bold">{student.classRoom}</span> • เลขที่: <span className="font-bold">{student.studentNo}</span>
              </p>
            </div>
          </div>

          {/* Quick status summary badge */}
          <div className="flex flex-wrap gap-2">
            {assignedRoom ? (
              <div className="px-4 py-2 bg-emerald-500/25 border border-emerald-300/40 rounded-2xl backdrop-blur-md text-emerald-100 text-xs font-bold flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-300" />
                ห้อง {assignedRoom.roomNumber} ({assignedRoom.status === 'confirmed' ? 'ยืนยันแล้ว' : 'ข้อเสนอ'})
              </div>
            ) : student.hasSubmittedChoices ? (
              <div className="px-4 py-2 bg-white/15 border border-white/20 rounded-2xl backdrop-blur-md text-indigo-100 text-xs font-semibold flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-indigo-300" />
                ส่งตัวเลือกแล้ว (รอผลจัดห้อง)
              </div>
            ) : (
              <div className="px-4 py-2 bg-amber-400/25 border border-amber-300/40 rounded-2xl backdrop-blur-md text-amber-200 text-xs font-semibold flex items-center">
                <Clock className="w-4 h-4 mr-1.5 text-amber-300" />
                ยังไม่ได้ส่งตัวเลือกคู่นอน
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Segmented Tab Navigation */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('select')}
          className={`flex-1 min-w-[130px] flex items-center justify-center py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            activeTab === 'select'
              ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-300'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Send className="w-4 h-4 mr-2" />
          <span>เลือกคู่นอน</span>
        </button>

        <button
          onClick={() => setActiveTab('received')}
          className={`flex-1 min-w-[140px] flex items-center justify-center py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all relative ${
            activeTab === 'received'
              ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-300'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Inbox className="w-4 h-4 mr-2" />
          <span>คำขอที่ได้รับ</span>
          {pendingReceivedCount > 0 && (
            <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white">
              {pendingReceivedCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('sent')}
          className={`flex-1 min-w-[130px] flex items-center justify-center py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            activeTab === 'sent'
              ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-300'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4 mr-2" />
          <span>คำขอที่ส่ง ({sentRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('room')}
          className={`flex-1 min-w-[130px] flex items-center justify-center py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            activeTab === 'room'
              ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-300'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-4 h-4 mr-2" />
          <span>ห้องพักของฉัน</span>
          {assignedRoom && (
            <span className="ml-1.5 w-2 h-2 rounded-full bg-emerald-400 inline-block" />
          )}
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'select' && (
        <PartnerSelector
          currentStudent={student}
          allStudents={allStudents}
          event={event}
          existingSentRequests={sentRequests}
          onSubmissionSuccess={onRefresh}
        />
      )}

      {activeTab === 'received' && (
        <ReceivedRequests
          currentStudent={student}
          event={event}
          receivedRequests={receivedRequests}
          onActionComplete={onRefresh}
        />
      )}

      {activeTab === 'sent' && (
        <SentRequests sentRequests={sentRequests} />
      )}

      {activeTab === 'room' && (
        <RoomStatusView
          currentStudent={student}
          event={event}
          assignedRoom={assignedRoom}
          onConsentSuccess={onRefresh}
        />
      )}

    </div>
  );
};
