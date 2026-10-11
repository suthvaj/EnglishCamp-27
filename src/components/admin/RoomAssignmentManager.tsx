import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Sparkles, 
  Plus, 
  Trash2, 
  UserMinus, 
  UserPlus, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  Users, 
  Clock, 
  Layers, 
  X,
  HelpCircle,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { Room, RoomMember, Student, PartnerRequest, CampEvent } from '../../types';
import { 
  createRoom, 
  deleteRoom, 
  assignStudentToRoom, 
  removeStudentFromRoom, 
  updateRoomStatus,
  generateAutoRoomProposals,
  applyProposedRoomsToDatabase,
  AutoProposalResult
} from '../../services/campService';

interface RoomAssignmentManagerProps {
  event: CampEvent;
  students: Student[];
  requests: PartnerRequest[];
  rooms: Room[];
  onRefresh: () => void;
}

export const RoomAssignmentManager: React.FC<RoomAssignmentManagerProps> = ({
  event,
  students,
  requests,
  rooms,
  onRefresh,
}) => {
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Auto-Proposal Generator State
  const [proposalResult, setProposalResult] = useState<AutoProposalResult | null>(null);
  const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);
  const [isApplyingProposal, setIsApplyingProposal] = useState(false);

  // Manual Room Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newBuilding, setNewBuilding] = useState('');
  const [newTargetCap, setNewTargetCap] = useState(event.targetCapacity || 2);
  const [newClassRoom, setNewClassRoom] = useState(students[0]?.classRoom || '');
  const [selectedInitialStudentIds, setSelectedInitialStudentIds] = useState<string[]>([]);

  // Add Member to existing room Modal
  const [activeAddRoom, setActiveAddRoom] = useState<Room | null>(null);
  const [studentToAddId, setStudentToAddId] = useState<string>('');

  // Assigned student Doc IDs across all rooms
  const assignedStudentDocIds = useMemo(() => {
    const set = new Set<string>();
    rooms.forEach(r => {
      (r.members || []).forEach(m => set.add(m.studentDocId));
    });
    return set;
  }, [rooms]);

  // Unassigned eligible students
  const unassignedStudents = useMemo(() => {
    return students.filter(s => s.isEligible && !assignedStudentDocIds.has(s.id));
  }, [students, assignedStudentDocIds]);

  // Classrooms list
  const classrooms = useMemo(() => {
    return Array.from(new Set(students.map(s => s.classRoom))).sort();
  }, [students]);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter(r => {
      const matchClass = filterClass === 'all' || r.classRoomFilter === filterClass || (r.members || []).some(m => m.classRoom === filterClass);
      const matchStatus = filterStatus === 'all' || r.status === filterStatus;
      const matchSearch = !searchTerm || r.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.members || []).some(m => m.studentName.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchClass && matchStatus && matchSearch;
    });
  }, [rooms, filterClass, filterStatus, searchTerm]);

  // Trigger Intelligent Auto Proposal (Section 8.2)
  const handleGenerateProposal = () => {
    setIsGeneratingProposal(true);
    try {
      const result = generateAutoRoomProposals(event, students, requests, rooms);
      setProposalResult(result);
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการประมวลผลข้อเสนอจัดห้อง');
    } finally {
      setIsGeneratingProposal(false);
    }
  };

  const handleApplyProposal = async (targetStatus: 'draft_proposal' | 'confirmed') => {
    if (!proposalResult) return;
    setIsApplyingProposal(true);
    try {
      await applyProposedRoomsToDatabase(event.id, proposalResult.proposedRooms, targetStatus, 'admin');
      setProposalResult(null);
      onRefresh();
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการบันทึกข้อเสนอ');
    } finally {
      setIsApplyingProposal(false);
    }
  };

  // Manual Room Creation
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomNumber.trim()) return;

    const initialStudents = students.filter(s => selectedInitialStudentIds.includes(s.id));

    try {
      await createRoom(
        event.id,
        {
          eventId: event.id,
          roomNumber: newRoomNumber.trim(),
          buildingOrZone: newBuilding.trim() || 'อาคารพัก',
          targetCapacity: newTargetCap,
          maxCapacity: newTargetCap,
          status: 'confirmed',
          classRoomFilter: newClassRoom,
          notes: 'สร้างโดยผู้ดูแลระบบ',
        },
        initialStudents,
        'admin'
      );
      setShowCreateModal(false);
      setNewRoomNumber('');
      setNewBuilding('');
      setSelectedInitialStudentIds([]);
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้างห้อง');
    }
  };

  // Add Member
  const handleAddMember = async () => {
    if (!activeAddRoom || !studentToAddId) return;
    const targetStudent = students.find(s => s.id === studentToAddId);
    if (!targetStudent) return;

    try {
      await assignStudentToRoom(event.id, activeAddRoom.id, targetStudent, 'admin');
      setActiveAddRoom(null);
      setStudentToAddId('');
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเพิ่มสมาชิก');
    }
  };

  // Remove Member
  const handleRemoveMember = async (roomId: string, member: RoomMember) => {
    if (!window.confirm(`ต้องการนำ ${member.studentName} ออกจากห้องหรือไม่?`)) return;
    try {
      await removeStudentFromRoom(event.id, roomId, member.id, member.studentName, 'admin');
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    }
  };

  // Delete Room
  const handleDeleteRoom = async (room: Room) => {
    if (!window.confirm(`ต้องการลบห้อง ${room.roomNumber} และนำสมาชิกทั้งหมดออกหรือไม่?`)) return;
    try {
      await deleteRoom(event.id, room.id, room.roomNumber);
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    }
  };

  // Toggle Confirm Room
  const handleToggleRoomStatus = async (room: Room) => {
    const nextStatus = room.status === 'confirmed' ? 'draft_proposal' : 'confirmed';
    try {
      await updateRoomStatus(event.id, room.id, nextStatus, 'admin');
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Action Bar & Stats */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              จัดการการจัดห้องพักจริง (Room Assignment Management)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              ความจุเป้าหมาย: {event.targetCapacity} คน/ห้อง
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            สร้างข้อเสนอจัดห้องอัตโนมัติจากคำขอที่ยอมรับ จัดห้องด้วยตนเอง ย้ายสมาชิก และยืนยันผลห้องพัก
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Auto-Proposal Generator Button (8.2) */}
          <button
            type="button"
            onClick={handleGenerateProposal}
            disabled={isGeneratingProposal}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center cursor-pointer"
          >
            <Sparkles className="w-4 h-4 mr-1.5" />
            <span>สร้างข้อเสนอจัดห้องอัตโนมัติ (AI Matching)</span>
          </button>

          {/* Create Manual Room Button (8.1) */}
          <button
            type="button"
            onClick={() => {
              setNewRoomNumber(`R-${event.targetCapacity}P-${String(rooms.length + 1).padStart(3, '0')}`);
              setShowCreateModal(true);
            }}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1" />
            <span>สร้างห้องพักใหม่</span>
          </button>
        </div>
      </div>

      {/* Auto-Proposal Preview Modal / Banner (Section 8.2) */}
      {proposalResult && (
        <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-white border-2 border-indigo-300 rounded-3xl p-6 sm:p-8 shadow-lg animate-in fade-in">
          <div className="flex items-start justify-between">
            <div>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white mb-2">
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                ข้อเสนอการจัดห้องพักอัตโนมัติ (Proposal Preview)
              </div>
              <h3 className="text-lg font-black text-slate-900">
                ผลการคำนวณ: ได้ข้อเสนอจัดห้องทั้งหมด {proposalResult.proposedRooms.length} ห้อง
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                พิจารณาจาก: คำขอที่ตอบรับร่วมกัน (Mutual Accepted) &gt; ความประสงค์ 3 ลำดับ &gt; การแยกตามห้องเรียนอย่างเคร่งครัด
              </p>
            </div>
            <button
              onClick={() => setProposalResult(null)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Summary metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
            <div className="bg-white p-3 rounded-xl border border-indigo-100">
              <span className="text-[11px] text-slate-500 font-semibold">จัดสรรได้แล้ว</span>
              <div className="text-lg font-black text-indigo-600">
                {proposalResult.totalAssigned} / {proposalResult.totalStudents} คน
              </div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-indigo-100">
              <span className="text-[11px] text-slate-500 font-semibold">ห้องที่สร้างใหม่</span>
              <div className="text-lg font-black text-slate-900">
                {proposalResult.proposedRooms.length} ห้อง
              </div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-indigo-100">
              <span className="text-[11px] text-slate-500 font-semibold">ยังไม่ได้จัดห้อง</span>
              <div className="text-lg font-black text-amber-600">
                {proposalResult.unassignedStudents.length} คน
              </div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-indigo-100">
              <span className="text-[11px] text-slate-500 font-semibold">ความจุเป้าหมาย</span>
              <div className="text-lg font-black text-slate-700">
                {event.targetCapacity} คน/ห้อง
              </div>
            </div>
          </div>

          {/* Proposed Rooms Grid Preview */}
          <div className="max-h-72 overflow-y-auto space-y-2 pr-1 my-4">
            {proposalResult.proposedRooms.map((prop, idx) => (
              <div
                key={idx}
                className="bg-white p-3.5 rounded-xl border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center space-x-3">
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {prop.roomNumber}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold">
                    {prop.classRoom}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md font-semibold ${
                    prop.matchType === 'mutual_accepted' 
                      ? 'bg-emerald-100 text-emerald-800'
                      : prop.matchType === 'mutual_preference'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {prop.matchType === 'mutual_accepted' ? '✓ ตอบรับตรงกัน' : prop.matchType === 'mutual_preference' ? 'เลือกตรงกัน' : 'เติมเต็มห้องเรียน'}
                  </span>
                </div>

                <div className="text-slate-700">
                  {prop.members.map(m => `${m.firstName} (${m.studentNo})`).join(', ')}
                </div>
              </div>
            ))}
          </div>

          {/* Action buttons to apply proposal */}
          <div className="pt-4 border-t border-indigo-200/60 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              * ข้อเสนอนี้จะไม่นำไปใช้จริงจนกว่าคุณจะกดยืนยันบันทึก
            </span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => handleApplyProposal('draft_proposal')}
                disabled={isApplyingProposal}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                บันทึกเป็นข้อเสนอ (Draft ให้สมาชิกตรวจ)
              </button>
              <button
                type="button"
                onClick={() => handleApplyProposal('confirmed')}
                disabled={isApplyingProposal}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                ยืนยันห้องพักจริงทันที (Confirmed)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Class Filter */}
          <select
            value={filterClass}
            onChange={e => setFilterClass(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="all">ทุกห้องเรียน ({rooms.length} ห้อง)</option>
            {classrooms.map(c => (
              <option key={c} value={c}>ห้อง {c}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="all">ทุกสถานะ</option>
            <option value="confirmed">ยืนยันแล้ว (Confirmed)</option>
            <option value="draft_proposal">ข้อเสนอจัดห้อง (Draft)</option>
            <option value="pending_consent">รอยืนยันจากสมาชิก</option>
          </select>
        </div>

        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="ค้นหาชื่อห้องหรือชื่อนักเรียน..."
          className="w-full sm:w-64 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
        />
      </div>

      {/* Rooms Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRooms.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-200">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">ไม่พบห้องพักตามเงื่อนไข</h3>
            <p className="text-xs text-slate-400 mt-1">
              กดปุ่ม "สร้างข้อเสนอจัดห้องอัตโนมัติ" หรือ "สร้างห้องพักใหม่" ด้านบนเพื่อเริ่มจัดห้อง
            </p>
          </div>
        ) : (
          filteredRooms.map(room => {
            const members = room.members || [];
            const isFull = members.length >= room.targetCapacity;
            const isConfirmed = room.status === 'confirmed';

            return (
              <div
                key={room.id}
                className={`bg-white rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                  isConfirmed ? 'border-slate-200 shadow-xs' : 'border-indigo-200/80 bg-indigo-50/20'
                }`}
              >
                <div>
                  
                  {/* Card Header */}
                  <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-base text-slate-900">
                          {room.roomNumber}
                        </span>
                        {room.classRoomFilter && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                            {room.classRoomFilter}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {room.buildingOrZone || 'ที่พัก'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleToggleRoomStatus(room)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors cursor-pointer ${
                          isConfirmed
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
                        }`}
                        title="คลิกเพื่อสลับสถานะยืนยัน"
                      >
                        {isConfirmed ? '✓ ยืนยันแล้ว' : 'ข้อเสนอ'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteRoom(room)}
                        className="p-1 text-slate-300 hover:text-rose-600 rounded cursor-pointer"
                        title="ลบห้อง"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500">สมาชิก:</span>
                      <span className="font-bold text-slate-800">
                        {members.length} / {room.targetCapacity} คน
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isFull ? 'bg-emerald-500' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${Math.min(100, (members.length / room.targetCapacity) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Members List */}
                  <div className="mt-4 space-y-1.5">
                    {members.length === 0 ? (
                      <div className="text-center py-4 text-xs text-slate-400 italic">
                        ยังไม่มีสมาชิกในห้องนี้
                      </div>
                    ) : (
                      members.map(m => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-50 text-xs hover:bg-slate-100/80 transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                              {m.studentNo}
                            </span>
                            <div>
                              <span className="font-bold text-slate-800">{m.studentName}</span>
                              <span className="text-[10px] text-slate-400 ml-1">({m.classRoom})</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1">
                            {m.consentStatus === 'consented' && (
                              <span className="text-[10px] text-emerald-600 font-semibold" title="ยินยอมแล้ว">✓</span>
                            )}
                            {m.consentStatus === 'review_requested' && (
                              <span className="text-[10px] text-rose-600 font-semibold" title="ขอทบทวน">!</span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(room.id, m)}
                              className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                              title="นำออกจากห้อง"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Card Footer: Add member button */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAddRoom(room);
                      setStudentToAddId('');
                    }}
                    className="w-full py-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5 mr-1" />
                    <span>เพิ่มนักเรียนเข้าห้องนี้</span>
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Unassigned Students Section */}
      {unassignedStudents.length > 0 && (
        <div className="bg-amber-50/50 rounded-3xl p-6 border border-amber-200/80">
          <div className="flex items-center justify-between pb-3 border-b border-amber-200/60">
            <div>
              <h3 className="text-sm font-bold text-amber-900 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1.5 text-amber-600" />
                นักเรียนที่ยังไม่ได้รับการจัดห้อง ({unassignedStudents.length} คน)
              </h3>
              <p className="text-xs text-amber-700 mt-0.5">
                รายชื่อนักเรียนที่มีสิทธิ์แต่ยังไม่ได้บรรจุเข้าห้องพักใด ๆ
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {unassignedStudents.map(s => (
              <div
                key={s.id}
                className="px-3 py-1.5 bg-white rounded-xl border border-amber-200 text-xs text-slate-800 shadow-2xs flex items-center space-x-1.5"
              >
                <span className="font-bold">{s.firstName} {s.lastName}</span>
                <span className="text-slate-400 text-[11px]">({s.classRoom} เลขที่ {s.studentNo})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Create Room Manually */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-black text-slate-900 mb-1">
              สร้างห้องพักใหม่
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              กำหนดหมายเลขห้องและความจุเป้าหมาย
            </p>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  หมายเลขห้อง / ชื่อกลุ่ม
                </label>
                <input
                  type="text"
                  value={newRoomNumber}
                  onChange={e => setNewRoomNumber(e.target.value)}
                  placeholder="เช่น A-101, Villa-02"
                  required
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  อาคาร / โซน
                </label>
                <input
                  type="text"
                  value={newBuilding}
                  onChange={e => setNewBuilding(e.target.value)}
                  placeholder="เช่น อาคาร 1, โซนบังกะโล"
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ความจุเป้าหมาย (คน)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={newTargetCap}
                    onChange={e => setNewTargetCap(parseInt(e.target.value, 10) || 2)}
                    required
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ห้องเรียนหลัก
                  </label>
                  <select
                    value={newClassRoom}
                    onChange={e => setNewClassRoom(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  >
                    {classrooms.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  สร้างห้องพัก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Student to Room */}
      {activeAddRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-black text-slate-900 mb-1">
              เพิ่มนักเรียนเข้าห้อง {activeAddRoom.roomNumber}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              เลือกนักเรียนที่ต้องการมอบหมายเข้าห้องนี้ (ระบบจะป้องกันไม่ให้นักเรียนอยู่ในหลายห้องพร้อมกัน)
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  เลือกนักเรียน (เฉพาะผู้ที่ยังไม่มีห้อง หรือต้องการย้ายมา)
                </label>
                <select
                  value={studentToAddId}
                  onChange={e => setStudentToAddId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                >
                  <option value="">-- เลือกนักเรียน --</option>
                  {students.filter(s => s.isEligible).map(s => {
                    const isAlreadyAssigned = assignedStudentDocIds.has(s.id);
                    return (
                      <option key={s.id} value={s.id}>
                        {s.firstName} {s.lastName} (ห้อง {s.classRoom} เลขที่ {s.studentNo}) {isAlreadyAssigned ? '[มีห้องแล้ว - จะย้าย]' : '[ยังไม่มีห้อง]'}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveAddRoom(null)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleAddMember}
                  disabled={!studentToAddId}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  เพิ่มเข้าห้อง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
