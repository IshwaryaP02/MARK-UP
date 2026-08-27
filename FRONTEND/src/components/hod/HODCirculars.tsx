import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Circular, CircularTarget, CircularStatus } from '../../types';
import {
  FileText,
  Plus,
  Search,
  Eye,
  Pen,
  Send,
  Archive,
  CheckCircle2,
  Clock,
  Filter,
  ChevronDown,
  ChevronRight,
  Calendar,
  Users,
  GraduationCap,
  Building2,
  Upload,
  X,
  AlertTriangle
} from 'lucide-react';

export const HODCirculars: React.FC = () => {
  const {
    circulars,
    currentUser,
    departments,
    facultyList,
    students,
    addCircular,
    updateCircular,
    signCircular,
    publishCircular,
    archiveCircular,
    addToast
  } = useApp();

  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedCircular, setSelectedCircular] = useState<Circular | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showViewDetail, setShowViewDetail] = useState(false);
  const [filterStatus, setFilterStatus] = useState<CircularStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const deptFaculty = facultyList.filter(
    (f) => f.departmentId === (currentUser.departmentId || 'dept-cs')
  );
  const deptStudents = students.filter(
    (s) => s.departmentId === (currentUser.departmentId || 'dept-cs')
  );

  const getRecipientCount = (target: CircularTarget, course?: string, year?: string, shift?: string, facultyIds?: string[]): number => {
    if (target === 'all_faculty') return deptFaculty.length;
    if (target === 'individual_faculty') return facultyIds?.length || 0;
    if (target === 'all_students') return deptStudents.length;
    if (target === 'specific_students') {
      let filtered = deptStudents;
      if (course && course !== 'All') {
        if (course === 'UG') {
          filtered = filtered.filter((s) => s.semester <= 6);
        } else {
          filtered = filtered.filter((s) => s.semester > 6);
        }
      }
      if (year && year !== 'All') {
        const yearMap: Record<string, number[]> = {
          'I': [1, 2],
          'II': [3, 4],
          'III': [5, 6]
        };
        const semesters = yearMap[year];
        if (semesters) {
          filtered = filtered.filter((s) => semesters.includes(s.semester));
        }
      }
      if (shift && shift !== 'All Shifts') {
        filtered = filtered.filter((s) => {
          if (shift === 'First Shift') return true;
          if (shift === 'Second Shift') return s.semester <= 6;
          return true;
        });
      }
      return filtered.length;
    }
    return 0;
  };

  const [form, setForm] = useState({
    title: '',
    description: '',
    target: 'all_faculty' as CircularTarget,
    course: 'UG',
    year: 'I',
    shift: 'First Shift',
    selectedFacultyIds: [] as string[],
    validFrom: '',
    validUntil: '',
    attachmentUrl: ''
  });

  const filteredCirculars = useMemo(() => {
    return circulars.filter((c) => {
      const matchStatus = filterStatus === 'all' || c.status === filterStatus;
      const matchSearch =
        !searchQuery ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [circulars, filterStatus, searchQuery]);

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      target: 'all_faculty',
      course: 'UG',
      year: 'I',
      shift: 'First Shift',
      selectedFacultyIds: [],
      validFrom: '',
      validUntil: '',
      attachmentUrl: ''
    });
  };

  const handleCreate = () => {
    if (!form.title || !form.description || !form.validFrom || !form.validUntil) {
      addToast('Validation Error', 'Please fill all required fields', 'danger');
      return;
    }

    const recipientCount = getRecipientCount(
      form.target,
      form.course,
      form.year,
      form.shift,
      form.selectedFacultyIds
    );

    addCircular({
      title: form.title,
      description: form.description,
      target: form.target,
      departmentId: currentUser.departmentId || 'dept-cs',
      departmentName: currentUser.departmentName || 'Computer Science & Engineering',
      course: form.target === 'individual_faculty' || form.target === 'all_faculty' ? undefined : form.course,
      year: form.target === 'individual_faculty' || form.target === 'all_faculty' ? undefined : form.year,
      shift: form.target === 'individual_faculty' || form.target === 'all_faculty' ? undefined : form.shift,
      attachmentUrl: form.attachmentUrl || undefined,
      validFrom: form.validFrom,
      validUntil: form.validUntil,
      status: 'published',
      recipientCount,
      selectedFacultyIds: form.target === 'individual_faculty' ? form.selectedFacultyIds : undefined,
      createdBy: currentUser.name
    });

    resetForm();
    setView('list');
  };

  const handlePreviewAndPublish = (circular: Circular) => {
    setSelectedCircular(circular);
    setShowPreview(true);
  };

  const handleSign = (circular: Circular) => {
    signCircular(circular.id, currentUser.name);
    setShowPreview(false);
  };

  const handlePublish = (circular: Circular) => {
    publishCircular(circular.id, currentUser.name);
    setShowPreview(false);
  };

  const toggleFacultySelection = (facId: string) => {
    setForm((prev) => {
      const exists = prev.selectedFacultyIds.includes(facId);
      return {
        ...prev,
        selectedFacultyIds: exists
          ? prev.selectedFacultyIds.filter((id) => id !== facId)
          : [...prev.selectedFacultyIds, facId]
      };
    });
  };

  const getStatusBadge = (status: CircularStatus) => {
    const styles: Record<CircularStatus, string> = {
      draft: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
      signed: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      archived: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#313866] dark:text-[#8A92D0]" /> Department Circulars
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Create, preview, sign, and publish circulars to faculty and students
          </p>
        </div>
        {view === 'list' && (
          <button
            onClick={() => { resetForm(); setView('create'); }}
            className="px-4 py-2 bg-[#313866] hover:bg-[#161B33] dark:bg-[#8A92D0] dark:hover:bg-[#a3a8e0] text-white dark:text-[#0D1127] text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" /> Create New Circular
          </button>
        )}
      </div>

      {/* List View */}
      {view === 'list' && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search circulars..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-[#161B33] border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#313866]"
              />
            </div>
            <div className="flex items-center gap-1 bg-white dark:bg-[#161B33] p-1 border border-zinc-200 dark:border-zinc-700 rounded-xl text-[10px] font-bold">
              {(['all', 'draft', 'signed', 'published', 'archived'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-2.5 py-1 rounded-lg transition-all capitalize ${
                    filterStatus === s ? 'bg-[#313866] text-white' : 'text-zinc-600 dark:text-zinc-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Circulars Table */}
          <div className="bg-white dark:bg-[#161B33] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 pl-4">Title</th>
                  <th className="p-3.5">Target</th>
                  <th className="p-3.5">Recipients</th>
                  <th className="p-3.5">Valid Period</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredCirculars.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-zinc-400 text-xs">
                      No circulars found.
                    </td>
                  </tr>
                ) : (
                  filteredCirculars.map((circ) => (
                    <tr key={circ.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="p-3.5 pl-4">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100">{circ.title}</div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">by {circ.createdBy}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-[#F3F4F9] dark:bg-[#313866]/50 text-[#313866] dark:text-[#8A92D0] rounded-lg">
                          {circ.target === 'all_faculty' && 'All Faculty'}
                          {circ.target === 'individual_faculty' && 'Individual Faculty'}
                          {circ.target === 'all_students' && 'All Students'}
                          {circ.target === 'specific_students' && `${circ.course || ''} ${circ.year || ''} ${circ.shift || ''}`}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-[#313866] dark:text-[#8A92D0]">
                        {circ.recipientCount} Recipient(s)
                      </td>
                      <td className="p-3.5 text-zinc-500 text-[11px]">
                        <div>{circ.validFrom}</div>
                        <div>to {circ.validUntil}</div>
                      </td>
                      <td className="p-3.5">{getStatusBadge(circ.status)}</td>
                      <td className="p-3.5 text-right pr-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setSelectedCircular(circ); setShowViewDetail(true); }}
                            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye className="w-3.5 h-3.5 text-zinc-400" />
                          </button>
                          {circ.status === 'draft' && (
                            <button
                              onClick={() => handlePreviewAndPublish(circ)}
                              className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                              title="Preview & Publish"
                            >
                              <Send className="w-3.5 h-3.5 text-emerald-500" />
                            </button>
                          )}
                          {circ.status === 'signed' && (
                            <button
                              onClick={() => handlePreviewAndPublish(circ)}
                              className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                              title="Publish"
                            >
                              <Send className="w-3.5 h-3.5 text-emerald-500" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Create View */}
      {view === 'create' && (
        <div className="bg-white dark:bg-[#161B33] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Create New Circular</h3>
            <button
              onClick={() => setView('list')}
              className="text-xs font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Title *</label>
              <input
                type="text"
                placeholder="Circular title..."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#313866]"
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Description *</label>
              <textarea
                rows={4}
                placeholder="Circular content..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#313866] resize-none"
              />
            </div>

            {/* Target */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Target *</label>
              <select
                value={form.target}
                onChange={(e) => setForm({ ...form, target: e.target.value as CircularTarget, selectedFacultyIds: [] })}
                className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-[#313866] dark:text-[#8A92D0]"
              >
                <option value="all_faculty">All Faculty</option>
                <option value="individual_faculty">Individual Faculty</option>
                <option value="all_students">All Students</option>
                <option value="specific_students">Specific Students (Course/Year/Shift)</option>
              </select>
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Department</label>
              <input
                type="text"
                value={currentUser.departmentName || 'Computer Science & Engineering'}
                disabled
                className="w-full p-2.5 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-500"
              />
            </div>

            {/* Individual Faculty Selection */}
            {form.target === 'individual_faculty' && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Select Faculty ({form.selectedFacultyIds.length} selected)
                </label>
                <div className="max-h-48 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 p-2 space-y-1">
                  {deptFaculty.map((fac) => (
                    <label
                      key={fac.id}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                        form.selectedFacultyIds.includes(fac.id)
                          ? 'bg-[#313866]/10 dark:bg-[#8A92D0]/10'
                          : 'hover:bg-zinc-100 dark:hover:bg-zinc-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={form.selectedFacultyIds.includes(fac.id)}
                        onChange={() => toggleFacultySelection(fac.id)}
                        className="w-3.5 h-3.5 rounded border-zinc-300 text-[#313866] focus:ring-[#313866]"
                      />
                      <img
                        src={fac.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'}
                        alt={fac.name}
                        className="w-6 h-6 rounded-lg object-cover"
                      />
                      <div>
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{fac.name}</span>
                        <span className="text-[10px] text-zinc-400 ml-1">{fac.employeeId}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Student Targeting: Course, Year, Shift */}
            {(form.target === 'all_students' || form.target === 'specific_students') && (
              <>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Course</label>
                  <select
                    value={form.course}
                    onChange={(e) => setForm({ ...form, course: e.target.value, year: 'I', shift: 'First Shift' })}
                    className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-[#313866] dark:text-[#8A92D0]"
                  >
                    <option value="UG">UG (Bachelor's)</option>
                    <option value="M.Sc Computer Science">M.Sc Computer Science</option>
                    <option value="M.Sc Information Technology">M.Sc Information Technology</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Year</label>
                  <select
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                    className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-[#313866] dark:text-[#8A92D0]"
                  >
                    {form.course === 'UG' ? (
                      <>
                        <option value="I">I Year</option>
                        <option value="II">II Year</option>
                        <option value="III">III Year</option>
                      </>
                    ) : (
                      <>
                        <option value="I">I Year</option>
                        <option value="II">II Year</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Shift</label>
                  <select
                    value={form.shift}
                    onChange={(e) => setForm({ ...form, shift: e.target.value })}
                    className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-[#313866] dark:text-[#8A92D0]"
                  >
                    {form.course === 'UG' ? (
                      <>
                        <option value="First Shift">First Shift</option>
                        <option value="Second Shift">Second Shift</option>
                        <option value="All Shifts">All Shifts</option>
                      </>
                    ) : (
                      <option value="First Shift">First Shift</option>
                    )}
                  </select>
                </div>
              </>
            )}

            {/* Valid From */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Valid From *</label>
              <input
                type="date"
                value={form.validFrom}
                onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#313866]"
              />
            </div>

            {/* Valid Until */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Valid Until *</label>
              <input
                type="date"
                value={form.validUntil}
                onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#313866]"
              />
            </div>

            {/* Attachment */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Attachment (Optional)</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Attachment URL or file path"
                  value={form.attachmentUrl}
                  onChange={(e) => setForm({ ...form, attachmentUrl: e.target.value })}
                  className="flex-1 p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#313866]"
                />
                <button
                  type="button"
                  className="px-3 py-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Recipient Preview */}
          {form.target && (
            <div className="p-3.5 bg-zinc-50 dark:bg-[#0D1127] border border-zinc-200 dark:border-zinc-800 rounded-2xl">
              <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Estimated Recipients:{' '}
                <span className="text-[#313866] dark:text-[#8A92D0]">
                  {getRecipientCount(form.target, form.course, form.year, form.shift, form.selectedFacultyIds)}{' '}
                  {form.target.includes('faculty') ? 'faculty member(s)' : 'student(s)'}
                </span>
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setView('list')}
              className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="px-5 py-2 bg-[#313866] hover:bg-[#161B33] dark:bg-[#8A92D0] dark:hover:bg-[#a3a8e0] text-white dark:text-[#0D1127] text-xs font-bold rounded-xl transition-all shadow-md"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && selectedCircular && (
        <Modal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          title="Circular Preview & Publish"
          subtitle="Review the circular before signing and publishing"
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            {/* Circular Content Preview */}
            <div className="p-4 bg-zinc-50 dark:bg-[#0D1127] border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{selectedCircular.title}</h4>
                {getStatusBadge(selectedCircular.status)}
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {selectedCircular.description}
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Target</span>
                  <p className="font-bold text-zinc-900 dark:text-zinc-100">
                    {selectedCircular.target === 'all_faculty' && 'All Faculty'}
                    {selectedCircular.target === 'individual_faculty' && 'Individual Faculty'}
                    {selectedCircular.target === 'all_students' && 'All Students'}
                    {selectedCircular.target === 'specific_students' &&
                      `${selectedCircular.course || ''} ${selectedCircular.year || ''} Year ${selectedCircular.shift || ''}`}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Recipients</span>
                  <p className="font-bold text-[#313866] dark:text-[#8A92D0]">{selectedCircular.recipientCount} Recipient(s)</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Valid From</span>
                  <p className="font-bold text-zinc-900 dark:text-zinc-100">{selectedCircular.validFrom}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Valid Until</span>
                  <p className="font-bold text-zinc-900 dark:text-zinc-100">{selectedCircular.validUntil}</p>
                </div>
              </div>
            </div>

            {/* Signature Info */}
            {selectedCircular.signedBy && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                  <Pen className="w-3.5 h-3.5" /> Signed by {selectedCircular.signedBy} on {selectedCircular.signedAt}
                </p>
              </div>
            )}

            {selectedCircular.publishedBy && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <Send className="w-3.5 h-3.5" /> Published by {selectedCircular.publishedBy} on {selectedCircular.publishedAt}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                Close
              </button>
              {selectedCircular.status === 'draft' && (
                <button
                  onClick={() => handleSign(selectedCircular)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5"
                >
                  <Pen className="w-3.5 h-3.5" /> Submit & Sign
                </button>
              )}
              {selectedCircular.status === 'signed' && (
                <button
                  onClick={() => handlePublish(selectedCircular)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Publish Now
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* View Detail Modal */}
      {showViewDetail && selectedCircular && (
        <Modal
          isOpen={showViewDetail}
          onClose={() => setShowViewDetail(false)}
          title="Circular Details"
          subtitle={selectedCircular.title}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-zinc-50 dark:bg-[#0D1127] border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{selectedCircular.title}</h4>
                {getStatusBadge(selectedCircular.status)}
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {selectedCircular.description}
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Target</span>
                  <p className="font-bold text-zinc-900 dark:text-zinc-100">
                    {selectedCircular.target === 'all_faculty' && 'All Faculty'}
                    {selectedCircular.target === 'individual_faculty' && 'Individual Faculty'}
                    {selectedCircular.target === 'all_students' && 'All Students'}
                    {selectedCircular.target === 'specific_students' &&
                      `${selectedCircular.course || ''} ${selectedCircular.year || ''} Year ${selectedCircular.shift || ''}`}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Recipients</span>
                  <p className="font-bold text-[#313866] dark:text-[#8A92D0]">{selectedCircular.recipientCount} Recipient(s)</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Department</span>
                  <p className="font-bold text-zinc-900 dark:text-zinc-100">{selectedCircular.departmentName}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Created By</span>
                  <p className="font-bold text-zinc-900 dark:text-zinc-100">{selectedCircular.createdBy}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Valid From</span>
                  <p className="font-bold text-zinc-900 dark:text-zinc-100">{selectedCircular.validFrom}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Valid Until</span>
                  <p className="font-bold text-zinc-900 dark:text-zinc-100">{selectedCircular.validUntil}</p>
                </div>
                {selectedCircular.signedBy && (
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">Signed By</span>
                    <p className="font-bold text-amber-600 dark:text-amber-400">{selectedCircular.signedBy} on {selectedCircular.signedAt}</p>
                  </div>
                )}
                {selectedCircular.publishedBy && (
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">Published By</span>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">{selectedCircular.publishedBy} on {selectedCircular.publishedAt}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                onClick={() => setShowViewDetail(false)}
                className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
