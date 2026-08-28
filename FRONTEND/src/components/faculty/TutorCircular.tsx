import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';
import { Circular, CircularStatus } from '../../types';
import {
  GraduationCap,
  Search,
  Eye,
  Send,
  Calendar,
  Users,
  FileText,
  AlertTriangle
} from 'lucide-react';

export const TutorCircular: React.FC = () => {
  const {
    circulars,
    currentUser,
    facultyList,
    students,
    addCircular,
    publishCircular,
    addToast
  } = useApp();

  const myFaculty = useMemo(
    () => facultyList.find((f) => f.id === currentUser.id),
    [facultyList, currentUser.id]
  );

  const tutorFor = myFaculty?.tutorFor;

  const [view, setView] = useState<'list' | 'create'>('list');
  const [selectedCircular, setSelectedCircular] = useState<Circular | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    validFrom: '',
    validUntil: ''
  });

  const tutorClassStudents = useMemo(() => {
    if (!tutorFor) return [];
    return students.filter(
      (s) => s.active && s.semester === tutorFor.semester && s.section === tutorFor.section
    );
  }, [students, tutorFor]);

  const tutorCirculars = useMemo(() => {
    return circulars.filter(
      (c) => c.target === 'tutor_class' && c.createdBy === currentUser.name
    );
  }, [circulars, currentUser.name]);

  const filteredCirculars = useMemo(() => {
    if (!searchQuery) return tutorCirculars;
    const q = searchQuery.toLowerCase();
    return tutorCirculars.filter(
      (c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
    );
  }, [tutorCirculars, searchQuery]);

  if (!tutorFor) {
    return (
      <div className="space-y-6">
        <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-amber-600 dark:text-amber-400" /> Tutor Circular
          </h2>
        </div>
        <div className="p-8 bg-white dark:bg-[#161B33] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
          <div>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Not Assigned as Tutor</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              You are not assigned as a Tutor for any class. Contact your administrator to get a tutor class assignment.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const resetForm = () => {
    setForm({ title: '', description: '', validFrom: '', validUntil: '' });
  };

  const handleCreate = () => {
    if (!form.title || !form.description || !form.validFrom || !form.validUntil) {
      addToast('Validation Error', 'Please fill all required fields', 'danger');
      return;
    }

    const created = addCircular({
      title: form.title,
      description: form.description,
      target: 'tutor_class',
      departmentId: currentUser.departmentId || 'dept-cs',
      departmentName: currentUser.departmentName || 'Computer Science & Engineering',
      targetClass: { semester: tutorFor.semester, section: tutorFor.section },
      validFrom: form.validFrom,
      validUntil: form.validUntil,
      status: 'draft',
      createdBy: currentUser.name
    });

    publishCircular(created.id, currentUser.name);
    addToast('Tutor Circular Sent', `Published to ${tutorClassStudents.length} students in Sem ${tutorFor.semester} Sec ${tutorFor.section}`, 'success');

    resetForm();
    setView('list');
  };

  const handlePublish = (circular: Circular) => {
    publishCircular(circular.id, currentUser.name);
    setShowPreview(false);
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
            <GraduationCap className="w-5 h-5 text-amber-600 dark:text-amber-400" /> Tutor Circular
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Send circulars to your tutor class · Sem {tutorFor.semester} · Sec {tutorFor.section} · {tutorClassStudents.length} students
          </p>
        </div>
        {view === 'list' && (
          <button
            onClick={() => { resetForm(); setView('create'); }}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 shrink-0"
          >
            <Send className="w-4 h-4" /> Send Tutor Circular
          </button>
        )}
      </div>

      {/* List View */}
      {view === 'list' && (
        <>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search your tutor circulars..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-[#161B33] border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold focus:outline-none"
            />
          </div>

          {/* Tutor Class Students Preview */}
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h3 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Tutor Class Students ({tutorClassStudents.length})
              </h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tutorClassStudents.slice(0, 10).map((s) => (
                <span
                  key={s.id}
                  className="px-2 py-0.5 bg-white dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-lg text-[10px] font-bold text-amber-800 dark:text-amber-300"
                >
                  {s.name}
                </span>
              ))}
              {tutorClassStudents.length > 10 && (
                <span className="px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  +{tutorClassStudents.length - 10} more
                </span>
              )}
            </div>
          </div>

          {/* Circulars Table */}
          <div className="bg-white dark:bg-[#161B33] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5 pl-4">Title</th>
                  <th className="p-3.5">Recipients</th>
                  <th className="p-3.5">Valid Period</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredCirculars.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-zinc-400 text-xs">
                      No tutor circulars sent yet.
                    </td>
                  </tr>
                ) : (
                  filteredCirculars.map((circ) => (
                    <tr key={circ.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="p-3.5 pl-4">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100">{circ.title}</div>
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 font-semibold">
                          Sem {circ.targetClass?.semester} · Sec {circ.targetClass?.section}
                        </div>
                      </td>
                      <td className="p-3.5 font-bold text-amber-700 dark:text-amber-400">
                        {circ.recipientCount} Student(s)
                      </td>
                      <td className="p-3.5 text-zinc-500 text-[11px]">
                        <div>{circ.validFrom}</div>
                        <div>to {circ.validUntil}</div>
                      </td>
                      <td className="p-3.5">{getStatusBadge(circ.status)}</td>
                      <td className="p-3.5 text-right pr-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setSelectedCircular(circ); setShowPreview(true); }}
                            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye className="w-3.5 h-3.5 text-zinc-400" />
                          </button>
                          {circ.status === 'draft' && (
                            <button
                              onClick={() => handlePublish(circ)}
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
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Send Tutor Circular</h3>
            <button
              onClick={() => setView('list')}
              className="text-xs font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              Cancel
            </button>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl">
            <p className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4" />
              This circular will be sent to Semester {tutorFor.semester}, Section {tutorFor.section} ({tutorClassStudents.length} students)
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Title *</label>
              <input
                type="text"
                placeholder="Circular title..."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Description *</label>
              <textarea
                rows={4}
                placeholder="Circular content..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Valid From *</label>
              <input
                type="date"
                value={form.validFrom}
                onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Valid Until *</label>
              <input
                type="date"
                value={form.validUntil}
                onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Recipient Preview */}
          <div className="p-3.5 bg-zinc-50 dark:bg-[#0D1127] border border-zinc-200 dark:border-zinc-800 rounded-2xl">
            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Recipients:{' '}
              <span className="text-amber-700 dark:text-amber-400">
                {tutorClassStudents.length} student(s) of Sem {tutorFor.semester} · Sec {tutorFor.section}
              </span>
            </p>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setView('list')}
              className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-md"
            >
              Send to Class
            </button>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {showPreview && selectedCircular && (
        <Modal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          title="Tutor Circular Details"
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
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Target Class</span>
                  <p className="font-bold text-amber-700 dark:text-amber-400">
                    Sem {selectedCircular.targetClass?.semester} · Sec {selectedCircular.targetClass?.section}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Recipients</span>
                  <p className="font-bold text-amber-700 dark:text-amber-400">{selectedCircular.recipientCount} Student(s)</p>
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

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                Close
              </button>
              {selectedCircular.status === 'draft' && (
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
    </div>
  );
};
