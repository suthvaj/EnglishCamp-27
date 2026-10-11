import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  UserCheck, 
  AlertCircle, 
  Clock, 
  HelpCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { Student, CampEvent } from '../../types';
import { 
  findStudentByStudentId, 
  updateStudentPin 
} from '../../services/campService';
import { 
  verifyPin, 
  checkRateLimit, 
  recordFailedAttempt, 
  resetRateLimit,
  RateLimitStatus 
} from '../../services/crypto';

interface StudentLoginProps {
  eventId: string;
  event?: CampEvent | null;
  onLoginSuccess: (student: Student) => void;
  sampleStudents: Student[];
}

export const StudentLogin: React.FC<StudentLoginProps> = ({
  eventId,
  event,
  onLoginSuccess,
  sampleStudents,
}) => {
  const [studentId, setStudentId] = useState('');
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimit, setRateLimit] = useState<RateLimitStatus>({
    isLocked: false,
    remainingSeconds: 0,
    attemptsLeft: 5,
  });

  // Modal for First-time PIN change
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [tempStudent, setTempStudent] = useState<Student | null>(null);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [changePinError, setChangePinError] = useState<string | null>(null);

  useEffect(() => {
    if (studentId.trim()) {
      setRateLimit(checkRateLimit(studentId.trim()));
    }
  }, [studentId]);

  // Countdown timer if locked
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (rateLimit.isLocked && rateLimit.remainingSeconds > 0) {
      timer = setInterval(() => {
        setRateLimit(prev => {
          if (prev.remainingSeconds <= 1) {
            return { ...prev, isLocked: false, remainingSeconds: 0, attemptsLeft: 5 };
          }
          return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [rateLimit.isLocked, rateLimit.remainingSeconds]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanId = studentId.trim();
    const cleanPin = pin.trim();

    if (!cleanId || !cleanPin) {
      setErrorMessage('กรุณากรอกเลขประจำตัวนักเรียนและ PIN ให้ครบถ้วน');
      return;
    }

    // Check rate limit
    const currentRate = checkRateLimit(cleanId);
    if (currentRate.isLocked) {
      setRateLimit(currentRate);
      setErrorMessage(`ระบบระงับการเข้าสู่ระบบชั่วคราวเนื่องจากใส่รหัสผิดหลายครั้ง โปรดรอ ${currentRate.remainingSeconds} วินาที`);
      return;
    }

    setIsLoading(true);

    try {
      const student = await findStudentByStudentId(eventId, cleanId);

      // Generic error: Don't reveal if ID exists or not
      if (!student || !student.pinHash || !student.pinSalt) {
        const updatedRate = recordFailedAttempt(cleanId);
        setRateLimit(updatedRate);
        setErrorMessage('เลขประจำตัวนักเรียนหรือ PIN ไม่ถูกต้อง');
        setIsLoading(false);
        return;
      }

      // Check eligibility
      if (!student.isEligible) {
        setErrorMessage('คุณไม่มีสิทธิ์เข้าร่วมกิจกรรม English Camp ครั้งนี้ หรือบัญชีถูกระงับ กรุณาติดต่อคุณครูผู้ดูแล');
        setIsLoading(false);
        return;
      }

      // Verify PIN
      const isValid = await verifyPin(cleanPin, student.pinSalt, student.pinHash);

      if (!isValid) {
        const updatedRate = recordFailedAttempt(cleanId);
        setRateLimit(updatedRate);
        setErrorMessage(
          updatedRate.isLocked
            ? `คุณใส่รหัสผิดครบกำหนด ระบบระงับชั่วคราวเป็นเวลา 3 นาที`
            : `เลขประจำตัวนักเรียนหรือ PIN ไม่ถูกต้อง (เหลือโอกาสอีก ${updatedRate.attemptsLeft} ครั้ง)`
        );
        setIsLoading(false);
        return;
      }

      // Login successful: reset rate limit
      resetRateLimit(cleanId);

      // Check if student must change PIN
      if (student.mustChangePin) {
        setTempStudent(student);
        setShowChangePinModal(true);
        setIsLoading(false);
        return;
      }

      onLoginSuccess(student);
    } catch (err) {
      console.error(err);
      setErrorMessage('เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNewPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePinError(null);

    if (newPin.length < 4) {
      setChangePinError('PIN ใหม่ต้องมีความยาวอย่างน้อย 4 หลัก');
      return;
    }

    if (newPin !== confirmPin) {
      setChangePinError('PIN ทั้งสองช่องไม่ตรงกัน');
      return;
    }

    if (tempStudent) {
      try {
        await updateStudentPin(eventId, tempStudent.id, newPin, false);
        const updatedStudent: Student = {
          ...tempStudent,
          mustChangePin: false,
        };
        setShowChangePinModal(false);
        onLoginSuccess(updatedStudent);
      } catch (err) {
        setChangePinError('เกิดข้อผิดพลาดในการเปลี่ยน PIN กรุณาลองใหม่');
      }
    }
  };

  const handleQuickFill = (s: Student) => {
    setStudentId(s.studentId);
    setPin('1234');
    setErrorMessage(null);
  };

  return (
    <div className="max-w-md mx-auto my-8 sm:my-12 px-4">
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
        
        {/* Card Header */}
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-800 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="inline-flex p-3 rounded-2xl bg-white/15 backdrop-blur-md mb-3 ring-1 ring-white/20">
            <UserCheck className="w-8 h-8 text-indigo-100" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">เข้าสู่ระบบนักเรียน</h2>
          <p className="text-sm text-indigo-100 mt-1">
            English Camp Partner Selection Portal
          </p>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-8">
          
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-3 text-rose-700 text-sm animate-shake">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">ข้อผิดพลาดในการเข้าสู่ระบบ</p>
                <p className="text-xs text-rose-600 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {rateLimit.isLocked && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center space-x-3 text-amber-800 text-sm">
              <Clock className="w-5 h-5 flex-shrink-0 text-amber-600" />
              <div>
                <p className="font-bold">ระบบถูกระงับชั่วคราว</p>
                <p className="text-xs text-amber-700">
                  กรุณารอ {rateLimit.remainingSeconds} วินาทีก่อนลองใหม่อีกครั้ง
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                เลขประจำตัวนักเรียน
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={studentId}
                  onChange={e => setStudentId(e.target.value)}
                  placeholder="เช่น 10001"
                  maxLength={15}
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 font-semibold text-base transition-all placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  รหัสผ่าน PIN (4-6 หลัก)
                </label>
                <span className="text-[11px] text-slate-500">ค่าเริ่มต้น: 1234</span>
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  placeholder="••••"
                  maxLength={10}
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 font-mono tracking-widest text-lg transition-all placeholder:text-slate-400"
                />
                <KeyRound className="w-5 h-5 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || rateLimit.isLocked}
              className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all duration-150 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <span>กำลังตรวจสอบ...</span>
              ) : (
                <>
                  <span>เข้าสู่ระบบ</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demonstration Quick Fill Assist (Only in Trial Mode) */}
          {event?.isTrialMode !== false && sampleStudents.filter(s => s.isDemo).length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-600 flex items-center">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500 mr-1" />
                  บัญชีตัวอย่างสำหรับทดสอบ (โหมด Trial - PIN: 1234)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {sampleStudents.filter(s => s.isDemo).slice(0, 4).map(stu => (
                  <button
                    key={stu.id}
                    type="button"
                    onClick={() => handleQuickFill(stu)}
                    className="p-2 text-left bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-slate-800 truncate">
                      {stu.firstName} ({stu.classRoom})
                    </div>
                    <div className="text-[11px] text-slate-500">
                      รหัส {stu.studentId} • เลขที่ {stu.studentNo}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-slate-400" />
              รหัสผ่านได้รับการเข้ารหัสแบบทางเดียว (One-Way Hashing) อย่างปลอดภัย
            </p>
          </div>

        </div>
      </div>

      {/* Modal: First-time mandatory PIN change */}
      {showChangePinModal && tempStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              เปลี่ยน PIN ในการใช้งานครั้งแรก
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              สวัสดี {tempStudent.firstName} เพื่อความปลอดภัยของข้อมูล กรุณากำหนด PIN ใหม่สำหรับบัญชีของคุณ
            </p>

            {changePinError && (
              <div className="p-3 mb-4 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold">
                {changePinError}
              </div>
            )}

            <form onSubmit={handleSaveNewPin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  กำหนด PIN ใหม่ (4-6 หลัก)
                </label>
                <input
                  type="password"
                  value={newPin}
                  onChange={e => setNewPin(e.target.value)}
                  placeholder="••••"
                  maxLength={6}
                  required
                  className="w-full px-3 py-2 border rounded-lg text-slate-900 font-mono tracking-widest text-center text-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ยืนยัน PIN ใหม่อีกครั้ง
                </label>
                <input
                  type="password"
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value)}
                  placeholder="••••"
                  maxLength={6}
                  required
                  className="w-full px-3 py-2 border rounded-lg text-slate-900 font-mono tracking-widest text-center text-lg"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                บันทึก PIN ใหม่และเข้าสู่ระบบ
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
