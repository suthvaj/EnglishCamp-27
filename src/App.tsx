/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  testConnection, 
  initAuth 
} from './firebase';
import { 
  ensureDefaultEventAndSeed, 
  subscribeEvent, 
  subscribeStudents, 
  subscribeAllRequests, 
  subscribeRoomsWithMembers, 
  subscribeActivityLogs,
  DEFAULT_EVENT_ID
} from './services/campService';
import { 
  CampEvent, 
  Student, 
  PartnerRequest, 
  Room, 
  ActivityLog 
} from './types';
import { Header } from './components/Header';
import { StudentLogin } from './components/student/StudentLogin';
import { StudentDashboard } from './components/student/StudentDashboard';
import { AdminPortal } from './components/admin/AdminPortal';
import { User } from 'firebase/auth';
import { RefreshCw, Sparkles, Building2, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [currentRole, setCurrentRole] = useState<'student' | 'admin'>('student');
  const [event, setEvent] = useState<CampEvent | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [requests, setRequests] = useState<PartnerRequest[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  // Auth States
  const [loggedInStudent, setLoggedInStudent] = useState<Student | null>(null);
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and Seed Default Data
  useEffect(() => {
    let unsubEvent: (() => void) | undefined;
    let unsubStudents: (() => void) | undefined;
    let unsubRequests: (() => void) | undefined;
    let unsubRooms: (() => void) | undefined;
    let unsubLogs: (() => void) | undefined;

    const setupApp = async () => {
      try {
        // Test connection as required by Firebase skill
        await testConnection();

        // Ensure default event and seed realistic students if fresh
        const defaultEv = await ensureDefaultEventAndSeed();
        setEvent(defaultEv);

        // Realtime subscriptions
        unsubEvent = subscribeEvent(DEFAULT_EVENT_ID, ev => {
          if (ev) setEvent(ev);
        });

        unsubStudents = subscribeStudents(DEFAULT_EVENT_ID, stuList => {
          setStudents(stuList);
          // Keep loggedInStudent synced with fresh student data
          setLoggedInStudent(prev => {
            if (!prev) return null;
            return stuList.find(s => s.id === prev.id) || prev;
          });
        });

        unsubRequests = subscribeAllRequests(DEFAULT_EVENT_ID, reqList => {
          setRequests(reqList);
        });

        unsubRooms = subscribeRoomsWithMembers(DEFAULT_EVENT_ID, roomList => {
          setRooms(roomList);
        });

        unsubLogs = subscribeActivityLogs(DEFAULT_EVENT_ID, logList => {
          setLogs(logList);
        });
      } catch (err) {
        console.error('App initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    setupApp();

    // Listen to Google Auth state
    const unsubAuth = initAuth(
      (user, token) => {
        setAdminUser(user);
      },
      () => {
        setAdminUser(null);
      }
    );

    return () => {
      unsubEvent?.();
      unsubStudents?.();
      unsubRequests?.();
      unsubRooms?.();
      unsubLogs?.();
      unsubAuth?.();
    };
  }, []);

  const handleStudentLogout = () => {
    setLoggedInStudent(null);
  };

  if (isLoading || !event) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4 animate-pulse">
          <Building2 className="w-7 h-7" />
        </div>
        <h2 className="text-base font-bold text-slate-800">
          กำลังเตรียมระบบ English Camp Room Management...
        </h2>
        <p className="text-xs text-slate-500 mt-1 flex items-center">
          <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
          เชื่อมต่อฐานข้อมูล Firestore และโหลดข้อมูลกิจกรรม
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-500 selection:text-white">
      
      {/* Universal Top Header */}
      <Header
        currentRole={currentRole}
        onRoleChange={role => setCurrentRole(role)}
        event={event}
        student={loggedInStudent}
        onStudentLogout={handleStudentLogout}
        adminUser={adminUser}
        onAdminLoginSuccess={user => setAdminUser(user)}
        onAdminLogout={() => setAdminUser(null)}
      />

      {/* Main Container */}
      <main className="flex-1">
        {currentRole === 'student' ? (
          loggedInStudent ? (
            <StudentDashboard
              student={loggedInStudent}
              allStudents={students}
              event={event}
              requests={requests}
              rooms={rooms}
              onRefresh={() => {}}
            />
          ) : (
            <StudentLogin
              eventId={event.id}
              event={event}
              sampleStudents={students}
              onLoginSuccess={stu => setLoggedInStudent(stu)}
            />
          )
        ) : (
          <AdminPortal
            event={event}
            students={students}
            requests={requests}
            rooms={rooms}
            logs={logs}
            adminUser={adminUser}
            onRefresh={() => {}}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 space-y-1">
          <p className="font-semibold text-slate-700">
            CampRoom • English Camp Partner Selection & Room Assignment Management System
          </p>
          <p className="text-[11px] text-slate-400">
            ระบบสนับสนุนการจัดห้องพัก 2, 3, 4, 5+ คน และ Flexible Rooming สำหรับกิจกรรมค่ายโรงเรียน
          </p>
        </div>
      </footer>

    </div>
  );
}
