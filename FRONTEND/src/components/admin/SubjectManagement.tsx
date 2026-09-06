import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Subject } from '../../types';
import { Modal } from '../common/Modal';
import { BackButton } from '../common/BackButton';
import { BookOpen, Plus, Edit2, Trash2, Award, Clock } from 'lucide-react';

export const SubjectManagement: React.FC = () => {
  const { subjects, departments, facultyList, addSubject, updateSubject } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<Subject | null>(null);

  const [formData, setFormData] = useState<Partial<Subject>>({
    code: '',
    name: '',
    departmentId: departments[0]?.id || 'dept-cs',
    departmentName: departments[0]?.name || 'Computer Science',
    semester: 4,
    credits: 4,
    minAttendancePct: 75,
    facultyId: '',
    facultyName: ''
  });

  const handleOpenModal = (sub?: Subject) => {
    if (sub) {
      setSelectedSub(sub);
      setFormData(sub);
    } else {
      setSelectedSub(null);
      setFormData({
        code: `CS${405 + subjects.length}`,
        name: '',
        departmentId: departments[0]?.id || 'dept-cs',
        departmentName: departments[0]?.name || 'Computer Science',
        semester: 4,
        credits: 4,
        minAttendancePct: 75,
        facultyId: facultyList[0]?.id || '',
        facultyName: facultyList[0]?.name || ''
      });
    }
    setModalOpen(true);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) return;

    if (selectedSub) {
      updateSubject(formData as Subject);
    } else {
      addSubject(formData as Omit<Subject, 'id' | 'totalClassesHeld'>);
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <BackButton />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Subjects & Curriculum Directory
          </h2>

        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1E40AF] hover:bg-[#FFFFFF] dark:bg-[#2563EB] dark:text-[#FFFFFF] dark:hover:bg-white text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Subject
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-[#232326] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 dark:bg-[#0A0A0A]/80 border-b border-zinc-200 dark:border-[#232326] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
            <tr>
              <th className="p-3.5 pl-4">Course</th>
              <th className="p-3.5">Department</th>
              <th className="p-3.5">Semester</th>
              <th className="p-3.5">Credits</th>
              <th className="p-3.5">Min Attendance Limit</th>
              <th className="p-3.5">Lead Instructor</th>
              <th className="p-3.5 text-right pr-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {subjects.map((sub) => (
              <tr key={sub.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                <td className="p-3.5 pl-4 font-bold">
                  <span className="font-mono text-[#1E40AF] dark:text-[#3B82F6] mr-2">{sub.code}</span>
                  <span className="text-zinc-900 dark:text-zinc-100">{sub.name}</span>
                </td>
                <td className="p-3.5 text-zinc-600 dark:text-zinc-300">{sub.departmentName}</td>
                <td className="p-3.5 font-semibold text-zinc-800 dark:text-zinc-200">Semester {sub.semester}</td>
                <td className="p-3.5">
                  <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 font-bold rounded-md">
                    {sub.credits} Credits
                  </span>
                </td>
                <td className="p-3.5">
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 font-bold rounded-md">
                    {sub.minAttendancePct}% Min
                  </span>
                </td>
                <td className="p-3.5 font-medium text-zinc-800 dark:text-zinc-200">
                  {sub.facultyName || 'Unassigned'}
                </td>
                <td className="p-3.5 text-right pr-4">
                  <button
                    onClick={() => handleOpenModal(sub)}
                    className="p-1.5 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedSub ? 'Edit Course Subject' : 'Add New Subject'}
        subtitle="Set syllabus parameters and required attendance criteria"
      >
        <form onSubmit={handleSaveSubject} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Subject Code</label>
              <input
                type="text"
                required
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full p-2 text-xs font-mono font-bold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Course Title</label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
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
                    {d.code}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Semester</label>
              <input
                type="number"
                min={1}
                max={10}
                value={formData.semester || 4}
                onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                className="w-full p-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Credits</label>
              <input
                type="number"
                min={1}
                max={6}
                value={formData.credits || 4}
                onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) })}
                className="w-full p-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Min Attendance Limit (%)</label>
              <input
                type="number"
                min={50}
                max={100}
                value={formData.minAttendancePct || 75}
                onChange={(e) => setFormData({ ...formData, minAttendancePct: parseInt(e.target.value) })}
                className="w-full p-2 text-xs font-bold text-[#1E40AF] dark:text-[#3B82F6] bg-zinc-50 dark:bg-[#0A0A0A] border border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Lead Instructor</label>
              <select
                value={formData.facultyId || ''}
                onChange={(e) => {
                  const f = facultyList.find((fac) => fac.id === e.target.value);
                  setFormData({ ...formData, facultyId: e.target.value, facultyName: f?.name || '' });
                }}
                className="w-full p-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl"
              >
                <option value="">-- Select Faculty --</option>
                {facultyList.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[#1E40AF] hover:bg-[#FFFFFF] dark:bg-[#2563EB] dark:text-[#FFFFFF] text-white text-xs font-bold rounded-xl transition-colors mt-2"
          >
            {selectedSub ? 'Save Course Changes' : 'Create Subject'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
