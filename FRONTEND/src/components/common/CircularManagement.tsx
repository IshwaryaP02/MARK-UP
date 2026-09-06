import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Circular } from '../../types';
import { Modal } from './Modal';
import {
 FileText,
 Plus,
 Eye,
 Send,
 Trash2,
 CheckCircle2,
 Clock,
 AlertTriangle,
 Paperclip,
 X
} from 'lucide-react';

export const CircularManagement: React.FC = () => {
 const { currentUser, circulars, addCircular, updateCircular, deleteCircular, departments, subjects, addToast } = useApp();
 const isHod = currentUser.role === 'hod';
 const isFaculty = currentUser.role === 'faculty';

 const [createModalOpen, setCreateModalOpen] = useState(false);
 const [previewModalOpen, setPreviewModalOpen] = useState(false);
 const [viewingCircular, setViewingCircular] = useState<Circular | null>(null);

 const [formData, setFormData] = useState({
 title: '',
 description: '',
 target: 'department' as 'all' | 'department' | 'class' | 'course',
 departmentId: currentUser.departmentId || '',
 departmentName: currentUser.departmentName || '',
 courseCode: '',
 courseType: 'ug' as 'ug' | 'pg',
 year: 2,
 semester: 4,
 section: 'First Shift',
 shift: '',
 attachmentUrl: '',
 validFrom: new Date().toISOString().slice(0, 10),
 validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
 });

 const myCirculars = circulars.filter((c) => c.createdBy === currentUser.id);

 const handleCreate = (e: React.FormEvent) => {
 e.preventDefault();
 const newCirk: Omit<Circular, 'id' | 'createdAt'> = {
 ...formData,
 status: 'draft',
 createdBy: currentUser.id,
 createdByRole: currentUser.role,
 createdByName: currentUser.name
 };
 addCircular(newCirk);
 setCreateModalOpen(false);
 resetForm();
 };

 const handlePreview = () => {
 setPreviewModalOpen(true);
 };

 const handlePublish = (circular: Circular) => {
 updateCircular({
 ...circular,
 status: 'published',
 publishedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
 });
 addToast('Circular Published', `"${circular.title}" is now visible to target audience`, 'success');
 };

 const handleDelete = (id: string) => {
 deleteCircular(id);
 };

 const resetForm = () => {
 setFormData({
 title: '',
 description: '',
 target: 'department',
 departmentId: currentUser.departmentId || '',
 departmentName: currentUser.departmentName || '',
 courseCode: '',
 year: 2,
 semester: 4,
 section: 'First Shift',
 shift: '',
 attachmentUrl: '',
 validFrom: new Date().toISOString().slice(0, 10),
 validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
 });
 };

 return (
 <div className="space-y-6">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2E8F0]">
 <div>
 <h2 className="text-lg font-bold text-[#111827] tracking-tight flex items-center gap-2">
 <FileText className="w-5 h-5 text-[#64748B] " /> Circular Management
 </h2>
 <p className="text-xs text-[#64748B] ">
 {isHod
 ? 'Create and publish circulars for your department or specific groups'
 : 'Create and publish circulars for your assigned classes and courses'}
 </p>
 </div>

 <button
 onClick={() => setCreateModalOpen(true)}
 className="flex items-center gap-2 px-4 py-2.5 bg-[#C41E3A] hover:bg-[#9F1239] text-white text-xs font-bold rounded-xl transition-all shadow-sm shrink-0"
 >
 <Plus className="w-4 h-4" /> Create Circular
 </button>
 </div>

 {/* Circulars List */}
 <div className="space-y-3">
 {myCirculars.length === 0 ? (
 <div className="text-center py-12 bg-[#FFFFFF] border border-[#E2E8F0]/80 border-[#E2E8F0] rounded-2xl">
 <FileText className="w-10 h-10 text-[#64748B] mx-auto mb-3" />
 <p className="text-sm font-bold text-[#64748B] ">No circulars created yet</p>
 <p className="text-xs text-[#64748B] mt-1">Click "Create Circular" to get started</p>
 </div>
 ) : (
 myCirculars.map((cirk) => (
 <div
 key={cirk.id}
 className="bg-[#FFFFFF] border border-[#E2E8F0]/80 border-[#E2E8F0] rounded-2xl p-5 shadow-sm space-y-3"
 >
 <div className="flex items-start justify-between gap-3">
 <div className="flex-1">
 <div className="flex items-center gap-2 mb-1">
 <h3 className="text-sm font-bold text-[#111827] ">{cirk.title}</h3>
 <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
 cirk.status === 'published'
 ? 'bg-white/10 text-[#64748B] '
 : 'bg-white/5 text-[#64748B] '
 }`}>
 {cirk.status === 'published' ? 'Published' : 'Draft'}
 </span>
 </div>
 <p className="text-xs text-[#64748B] line-clamp-2">{cirk.description}</p>
 <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px] text-[#64748B]">
 <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Valid: {cirk.validFrom} to {cirk.validUntil}</span>
 <span>â€¢</span>
 <span>Target: {cirk.target === 'all' ? 'All' : cirk.target === 'department' ? cirk.departmentName : cirk.target === 'class' ? `${cirk.courseType === 'pg' ? 'PG' : 'UG'} Year ${cirk.year} · ${cirk.section}` : cirk.courseCode}</span>
 {cirk.attachmentUrl && (
 <>
 <span>â€¢</span>
 <span className="flex items-center gap-1"><Paperclip className="w-3 h-3" /> Attached</span>
 </>
 )}
 </div>
 </div>
 </div>

 <div className="flex items-center gap-2 pt-2 border-t border-[#E2E8F0]">
 <button
 onClick={() => { setViewingCircular(cirk); setPreviewModalOpen(true); }}
 className="px-3 py-1.5 bg-white/5 text-[#111827] text-[11px] font-bold rounded-lg flex items-center gap-1"
 >
 <Eye className="w-3 h-3" /> Preview
 </button>
 {cirk.status === 'draft' && (
 <button
 onClick={() => handlePublish(cirk)}
 className="px-3 py-1.5 bg-[#C41E3A] hover:bg-[#9F1239] text-white text-[11px] font-bold rounded-lg flex items-center gap-1"
 >
 <Send className="w-3 h-3" /> Submit & Sign / Publish
 </button>
 )}
 <button
 onClick={() => handleDelete(cirk.id)}
 className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-[#64748B] text-[11px] font-bold rounded-lg flex items-center gap-1 ml-auto"
 >
 <Trash2 className="w-3 h-3" /> Delete
 </button>
 </div>
 </div>
 ))
 )}
 </div>

 {/* Create Circular Modal */}
 <Modal
 isOpen={createModalOpen}
 onClose={() => { setCreateModalOpen(false); resetForm(); }}
 title="Create New Circular"
 subtitle={isHod ? 'Target permitted department/groups' : 'Target your assigned classes/courses'}
 maxWidth="xl"
 >
 <form onSubmit={handleCreate} className="space-y-4">
 <div>
 <label className="block text-xs font-bold text-[#111827] mb-1">Title</label>
 <input
 type="text"
 required
 value={formData.title}
 onChange={(e) => setFormData({ ...formData, title: e.target.value })}
 placeholder="e.g. Mid-Semester Exam Schedule"
 className="w-full px-3 py-2 text-xs font-semibold bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl"
 />
 </div>

 <div>
 <label className="block text-xs font-bold text-[#111827] mb-1">Description</label>
 <textarea
 required
 rows={4}
 value={formData.description}
 onChange={(e) => setFormData({ ...formData, description: e.target.value })}
 placeholder="Detailed description of the circular..."
 className="w-full px-3 py-2 text-xs font-semibold bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl resize-none"
 />
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-xs font-bold text-[#111827] mb-1">Target</label>
 <select
 value={formData.target}
 onChange={(e) => setFormData({ ...formData, target: e.target.value as any })}
 className="w-full px-3 py-2 text-xs font-semibold bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl"
 >
 {isHod && <option value="all">All Students (Department)</option>}
 <option value="department">Department Group</option>
 {isFaculty && <option value="class">Specific Class/Shift</option>}
 {isFaculty && <option value="course">Specific Course</option>}
 </select>
 </div>

 <div>
 <label className="block text-xs font-bold text-[#111827] mb-1">Department</label>
 <div className="px-3 py-2 text-xs font-semibold bg-white/5 border border-[#E2E8F0] rounded-xl text-[#64748B] ">
 {currentUser.departmentName || 'Computer Science'}
 </div>
 </div>
 </div>

 {formData.target === 'course' && (
 <div>
 <label className="block text-xs font-bold text-[#111827] mb-1">Course Code</label>
 <select
 value={formData.courseCode}
 onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
 className="w-full px-3 py-2 text-xs font-semibold bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl"
 >
 <option value="">Select Course</option>
 {subjects.filter((s) => s.facultyId === currentUser.id).map((sub) => (
 <option key={sub.id} value={sub.code}>{sub.code} â€” {sub.name}</option>
 ))}
 </select>
 </div>
 )}

 {formData.target === 'class' && (
 <div className="space-y-3">
 <div>
 <label className="block text-xs font-bold text-[#111827] mb-1">Course Type</label>
 <select
 value={formData.courseType}
 onChange={(e) => {
 const ct = e.target.value as 'ug' | 'pg';
 setFormData({
 ...formData,
 courseType: ct,
 year: ct === 'pg' ? Math.min(formData.year, 2) : formData.year,
 semester: ct === 'pg' ? Math.min(formData.semester, 4) : formData.semester
 });
 }}
 className="w-full px-3 py-2 text-xs font-semibold bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl"
 >
 <option value="ug">UG (Undergraduate) â€” 3 Years, 6 Semesters</option>
 <option value="pg">PG (Postgraduate) â€” 2 Years, 4 Semesters</option>
 </select>
 </div>
 <div className="grid grid-cols-3 gap-3">
 <div>
 <label className="block text-xs font-bold text-[#111827] mb-1">Year</label>
 <select
 value={formData.year}
 onChange={(e) => {
 const yr = Number(e.target.value);
 const sem = formData.courseType === 'pg'
 ? Math.min(formData.semester, yr === 2 ? 4 : 2)
 : Math.min(formData.semester, yr * 2);
 setFormData({ ...formData, year: yr, semester: Math.max(1, sem) });
 }}
 className="w-full px-3 py-2 text-xs font-semibold bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl"
 >
 {(formData.courseType === 'pg' ? [1, 2] : [1, 2, 3]).map((y) => (
 <option key={y} value={y}>{['I', 'II', 'III'][y - 1]} Year</option>
 ))}
 </select>
 </div>
 <div>
 <label className="block text-xs font-bold text-[#111827] mb-1">Semester</label>
 <select
 value={formData.semester}
 onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
 className="w-full px-3 py-2 text-xs font-semibold bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl"
 >
 {formData.courseType === 'ug'
 ? Array.from({ length: 6 }, (_, i) => i + 1).map((s) => (
 <option key={s} value={s}>Sem {s}</option>
 ))
 : Array.from({ length: 4 }, (_, i) => i + 1).map((s) => (
 <option key={s} value={s}>Sem {s}</option>
 ))
 }
 </select>
 </div>
<div>
  <label className="block text-xs font-bold text-[#111827] mb-1">Shift</label>
  <select
  value={formData.section}
  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
  className="w-full px-3 py-2 text-xs font-semibold bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl"
  >
  <option value="First Shift">First Shift</option>
  <option value="Second Shift">Second Shift</option>
  </select>
  </div>
 </div>
 </div>
 )}

 <div>
 <label className="block text-xs font-bold text-[#111827] mb-1">Attachment URL (optional)</label>
 <input
 type="text"
 value={formData.attachmentUrl}
 onChange={(e) => setFormData({ ...formData, attachmentUrl: e.target.value })}
 placeholder="https://..."
 className="w-full px-3 py-2 text-xs font-semibold bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl"
 />
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-xs font-bold text-[#111827] mb-1">Valid From</label>
 <input
 type="date"
 required
 value={formData.validFrom}
 onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
 className="w-full px-3 py-2 text-xs font-semibold bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl"
 />
 </div>
 <div>
 <label className="block text-xs font-bold text-[#111827] mb-1">Valid Until</label>
 <input
 type="date"
 required
 value={formData.validUntil}
 onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
 className="w-full px-3 py-2 text-xs font-semibold bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl"
 />
 </div>
 </div>

 <div className="flex items-center gap-2 pt-3">
 <button
 type="button"
 onClick={handlePreview}
 className="px-4 py-2 bg-white/5 text-[#111827] text-xs font-bold rounded-xl flex items-center gap-1.5"
 >
 <Eye className="w-3.5 h-3.5" /> Preview
 </button>
 <button
 type="submit"
 className="flex-1 py-2.5 bg-[#C41E3A] hover:bg-[#9F1239] text-white text-xs font-bold rounded-xl transition-colors shadow-md"
 >
 Save as Draft
 </button>
 </div>
 </form>
 </Modal>

 {/* Preview Modal */}
 <Modal
 isOpen={previewModalOpen}
 onClose={() => { setPreviewModalOpen(false); setViewingCircular(null); }}
 title="Circular Preview"
 subtitle={viewingCircular ? viewingCircular.title : formData.title || 'New Circular'}
 >
 <div className="space-y-4 text-xs">
 <div className="p-4 bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl space-y-3">
 <h3 className="text-sm font-bold text-[#111827] ">
 {viewingCircular?.title || formData.title || 'Untitled Circular'}
 </h3>
 <p className="text-[#64748B] leading-relaxed">
 {viewingCircular?.description || formData.description || 'No description provided.'}
 </p>
 <div className="pt-2 border-t border-[#E2E8F0] space-y-1 text-[10px] text-[#64748B]">
 <p>Target: {viewingCircular?.target || formData.target}</p>
 <p>Valid: {viewingCircular?.validFrom || formData.validFrom} to {viewingCircular?.validUntil || formData.validUntil}</p>
 <p>Issued by: {viewingCircular?.createdByName || currentUser.name} ({viewingCircular?.createdByRole || currentUser.role})</p>
 {viewingCircular?.attachmentUrl && (
 <p className="flex items-center gap-1"><Paperclip className="w-3 h-3" /> Attachment: {viewingCircular.attachmentUrl}</p>
 )}
 </div>
 </div>
 </div>
 </Modal>
 </div>
 );
};
