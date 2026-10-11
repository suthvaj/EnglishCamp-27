import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  ShieldCheck, 
  LogOut, 
  Sparkles,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { CampEvent, Student } from '../types';
import { signInWithGoogle, signOutGoogle, getAccessToken } from '../firebase';
import { User } from 'firebase/auth';

interface HeaderProps {
  currentRole: 'student' | 'admin';
  onRoleChange: (role: 'student' | 'admin') => void;
  event: CampEvent | null;
  student: Student | null;
  onStudentLogout: () => void;
  adminUser: User | null;
  onAdminLoginSuccess: (user: User) => void;
  onAdminLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  event,
  student,
  onStudentLogout,
  adminUser,
  onAdminLoginSuccess,
  onAdminLogout,
}) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    setLoginError(null);
    try {
      const res = await signInWithGoogle();
      if (res?.user) {
        onAdminLoginSuccess(res.user);
      }
    } catch (err) {
      console.error(err);
      setLoginError('ลงชื่อเข้าใช้ Google ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGoogleSignOut = async () => {
    await signOutGoogle();
    onAdminLogout();
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight">
                  CampRoom
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <Sparkles className="w-3 h-3 mr-1" />
                  English Camp {event?.academicYear || '2570'}
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:block">
                ระบบจัดการเลือกคู่นอนและจัดสรรห้องพักอัจฉริยะ
              </p>
            </div>
          </div>

          {/* Role Switcher & User Status */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            
            {/* Mode Switch Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => onRoleChange('student')}
                className={`flex items-center px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  currentRole === 'student'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4 mr-1.5" />
                <span>นักเรียน</span>
              </button>

              <button
                onClick={() => onRoleChange('admin')}
                className={`flex items-center px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  currentRole === 'admin'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-4 h-4 mr-1.5" />
                <span>ผู้ดูแลระบบ</span>
              </button>
            </div>

            {/* Student Auth Badge */}
            {currentRole === 'student' && student && (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-800">
                    {student.firstName} {student.lastName}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    ห้อง {student.classRoom} เลขที่ {student.studentNo}
                  </div>
                </div>
                <button
                  onClick={onStudentLogout}
                  title="ออกจากระบบนักเรียน"
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Admin Google Sign In Badge */}
            {currentRole === 'admin' && (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                {adminUser ? (
                  <div className="flex items-center space-x-2">
                    <img
                      src={adminUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60'}
                      alt={adminUser.displayName || 'Admin'}
                      className="w-8 h-8 rounded-full border border-indigo-200"
                    />
                    <div className="hidden lg:block text-left">
                      <div className="text-xs font-bold text-slate-800 truncate max-w-[130px]">
                        {adminUser.displayName || adminUser.email}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-semibold flex items-center">
                        <CheckCircle2 className="w-3 h-3 mr-0.5 inline" /> Google Auth
                      </div>
                    </div>
                    <button
                      onClick={handleGoogleSignOut}
                      title="ออกจากระบบ Admin"
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleGoogleLogin}
                    disabled={isSigningIn}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-all shadow-xs cursor-pointer"
                  >
                    <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>{isSigningIn ? 'กำลังเชื่อมต่อ...' : 'Google Admin'}</span>
                  </button>
                )}
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
