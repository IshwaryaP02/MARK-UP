import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Faculty } from '../../types';
import { Modal } from '../common/Modal';
import { Search, Plus, Edit2, Trash2, BookOpen, Mail, Phone, Building2 } from 'lucide-react';

export const FacultyManagement: React.FC = () => {
  const { facultyList, departments, subjects, addFaculty, updateFaculty, deleteFaculty, addToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);

  const [formData, setFormData] = useState<Partial<Faculty>>({
    name: '',
    employeeId: '',
    email: '',
    departmentId: departments[0]?.id || 'dept-cs',
    departmentName: departments[0]?.name || 'Computer Science & Engineering',
    designation: 'Assistant Professor',
    phone: '',
    assignedSubjectIds: [],
    active: true
  });

  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const filtered = facultyList.filter(
    (f) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (fac?: Faculty) => {
    if (fac) {
      setSelectedFaculty(fac);
      setFormData(fac);
    } else {
      setSelectedFaculty(null);
      setFormData({
        name: '',
        employeeId: `FAC-${100 + facultyList.length + 1}`,
        email: '',
        departmentId: departments[0]?.id || 'dept-cs',
        departmentName: departments[0]?.name || 'Computer Science & Engineering',
        designation: 'Assistant Professor',
        phone: '',
        assignedSubjectIds: [],
        active: true
      });
    }
    setModalOpen(true);
  };

  const handleSaveFaculty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.employeeId) return;

    if (selectedFaculty) {
      updateFaculty(formData as Faculty);
    } else {
      addFaculty(formData as Omit<Faculty, 'id'>);
    }
    setModalOpen(false);
  };

  const handleOpenAssign = (fac: Faculty) => {
    setSelectedFaculty(fac);
    setSelectedSubjects(fac.assignedSubjectIds || []);
    setAssignModalOpen(true);
  };

  const handleSaveAssignments = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFaculty) return;
    updateFaculty({
      ...selectedFaculty,
      assignedSubjectIds: selectedSubjects
    });
    setAssignModalOpen(false);
    addToast('Course Assignments Updated', `Assigned ${selectedSubjects.length} subjects to ${selectedFaculty.name}`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Faculty Roster & Course Assignments
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Manage teaching staff, designations, and assign academic courses
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#313866] hover:bg-[#161B33] dark:bg-[#8A92D0] dark:text-[#0D1127] dark:hover:bg-white text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Register Faculty
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search faculty by name, Employee ID, or email..."
          className="w-full pl-10 pr-3 py-2 text-xs bg-white dark:bg-[#21284C] border border-zinc-200 dark:border-[#2D376A] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#313866]"
        />
      </div>

      {/* Grid of Faculty Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((fac) => {
          const assignedCount = fac.assignedSubjectIds?.length || 0;
          return (
            <div
              key={fac.id}
              className="bg-white dark:bg-[#21284C] border border-zinc-200/80 dark:border-[#2D376A] rounded-2xl p-4 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={fac.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'}
                    alt={fac.name}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-[#313866]/30"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{fac.name}</h3>
                    <span className="text-[10px] font-mono font-bold text-[#313866] dark:text-[#8A92D0] block">
                      {fac.employeeId} · {fac.designation}
                    </span>
                    <span className="text-[11px] text-zinc-400">{fac.departmentName}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800/80 pt-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="truncate">{fac.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{fac.phone}</span>
                  </div>
                </div>

                <div className="mt-3 p-2.5 bg-[#313866]/10 dark:bg-[#313866]/40 rounded-xl flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#313866] dark:text-[#8A92D0]">
                    {assignedCount} Assigned Subject(s)
                  </span>
                  <button
                    onClick={() => handleOpenAssign(fac)}
                    className="text-[10px] font-bold text-[#313866] dark:text-[#8A92D0] hover:underline flex items-center gap-1"
                  >
                    <BookOpen className="w-3 h-3" /> Assign Courses
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800/60">
                <button
                  onClick={() => handleOpenModal(fac)}
                  className="p-1.5 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => deleteFaculty(fac.id)}
                  className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Faculty Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedFaculty ? 'Edit Faculty Record' : 'Register New Faculty Member'}
        subtitle="Specify designation and department info"
      >
        <form onSubmit={handleSaveFaculty} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Employee ID</label>
              <input
                type="text"
                required
                value={formData.employeeId || ''}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="w-full p-2 text-xs font-mono bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Email</label>
              <input
                type="email"
                required
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Department</label>
              <select
                value={formData.departmentId || ''}
                onChange={(e) => {
                  const d = departments.find((dept) => dept.id === e.target.value);
                  setFormData({ ...formData, departmentId: e.target.value, departmentName: d?.name || '' });
                }}
                className="w-full p-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Designation</label>
              <select
                value={formData.designation || 'Assistant Professor'}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full p-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              >
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Professor">Professor</option>
                <option value="Professor & HOD">Professor & HOD</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[#313866] hover:bg-[#161B33] dark:bg-[#8A92D0] dark:text-[#0D1127] dark:hover:bg-white text-white text-xs font-bold rounded-xl transition-colors mt-2"
          >
            {selectedFaculty ? 'Save Changes' : 'Register Faculty'}
          </button>
        </form>
      </Modal>

      {/* Assign Courses Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title={`Assign Subjects to ${selectedFaculty?.name}`}
        subtitle="Select subjects this faculty member is responsible for"
      >
        <form onSubmit={handleSaveAssignments} className="space-y-4">
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {subjects.map((sub) => {
              const isChecked = selectedSubjects.includes(sub.id);
              return (
                <label
                  key={sub.id}
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                    isChecked
                      ? 'bg-[#313866]/10 dark:bg-[#313866]/50 border-[#313866]/30 dark:border-[#8A92D0]/40 text-[#313866] dark:text-[#8A92D0] font-semibold'
                      : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div>
                    <span className="font-bold block">{sub.code} - {sub.name}</span>
                    <span className="text-[10px] opacity-70">Sem {sub.semester} · {sub.credits} Credits</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSubjects([...selectedSubjects, sub.id]);
                      } else {
                        setSelectedSubjects(selectedSubjects.filter((id) => id !== sub.id));
                      }
                    }}
                    className="w-4 h-4 text-[#313866] rounded focus:ring-[#313866]"
                  />
                </label>
              );
            })}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[#313866] hover:bg-[#161B33] dark:bg-[#8A92D0] dark:text-[#0D1127] dark:hover:bg-white text-white text-xs font-bold rounded-xl transition-colors"
          >
            Save Course Assignments
          </button>
        </form>
      </Modal>
    </div>
  );
};
