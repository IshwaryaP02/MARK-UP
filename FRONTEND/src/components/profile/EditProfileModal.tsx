import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { User, Camera, Trash2, Save, UserCheck, Phone, Mail, MapPin, Calendar, Building, Heart } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateStudent, updateFaculty, setCurrentUser, addToast, departments } = useApp();

  const [formData, setFormData] = useState({
    name: currentUser.name || '',
    email: currentUser.email || '',
    phone: currentUser.phone || '',
    avatar: currentUser.avatar || '',
    departmentName: currentUser.departmentName || 'Computer Science & Engineering',
    address: currentUser.address || '123 Campus Avenue, University Housing, Block B',
    gender: currentUser.gender || 'Male',
    dob: currentUser.dob || '2003-05-14',
    fatherName: currentUser.fatherName || 'Robert Miller',
    motherName: currentUser.motherName || 'Sarah Miller',
    parentPhone: currentUser.parentPhone || '+1 (555) 987-6543'
  });

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        avatar: currentUser.avatar || '',
        departmentName: currentUser.departmentName || 'Computer Science & Engineering',
        address: currentUser.address || '123 Campus Avenue, University Housing, Block B',
        gender: currentUser.gender || 'Male',
        dob: currentUser.dob || '2003-05-14',
        fatherName: currentUser.fatherName || 'Robert Miller',
        motherName: currentUser.motherName || 'Sarah Miller',
        parentPhone: currentUser.parentPhone || '+1 (555) 987-6543'
      });
    }
  }, [currentUser, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedUser = {
      ...currentUser,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      avatar: formData.avatar,
      departmentName: formData.departmentName,
      address: formData.address,
      gender: formData.gender,
      dob: formData.dob,
      fatherName: formData.fatherName,
      motherName: formData.motherName,
      parentPhone: formData.parentPhone
    };

    setCurrentUser(updatedUser);

    if (currentUser.role === 'student') {
      updateStudent({
        id: currentUser.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        avatar: formData.avatar,
        departmentName: formData.departmentName,
        address: formData.address,
        gender: formData.gender,
        dob: formData.dob,
        fatherName: formData.fatherName,
        motherName: formData.motherName,
        guardianName: formData.fatherName,
        guardianPhone: formData.parentPhone
      } as any);
    } else if (currentUser.role === 'faculty' || currentUser.role === 'hod') {
      updateFaculty({
        id: currentUser.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        avatar: formData.avatar,
        departmentName: formData.departmentName
      } as any);
    }

    addToast('Profile Updated', 'Your profile details have been saved successfully', 'success');
    onClose();
  };

  const handleClearOptionalFields = () => {
    setFormData((prev) => ({
      ...prev,
      address: '',
      phone: '',
      fatherName: '',
      motherName: '',
      parentPhone: ''
    }));
    addToast('Fields Cleared', 'Optional contact fields cleared', 'info');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Account Profile"
      subtitle={`Update personal & institutional details for ${currentUser.role.toUpperCase()}`}
      maxWidth="xl"
    >
      <form onSubmit={handleSave} className="space-y-4">
        {/* Photo & Role Header */}
        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-zinc-50 dark:bg-[#0D1127] border border-zinc-200 dark:border-zinc-800 rounded-2xl">
          <div className="relative group">
            <img
              src={
                formData.avatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
              }
              alt={formData.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-[#313866] dark:border-[#8A92D0] shadow-md"
            />
            <div className="absolute bottom-0 right-0 p-1 bg-[#313866] text-white rounded-full shadow-sm">
              <Camera className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="flex-1 w-full text-center sm:text-left">
            <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
              Profile Photo URL
            </label>
            <input
              type="text"
              name="avatar"
              value={formData.avatar}
              onChange={handleChange}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#161B33] border border-zinc-200 dark:border-zinc-700 rounded-xl"
            />
          </div>
        </div>

        {/* General Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#313866] dark:text-[#8A92D0]" /> Full Name
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs font-semibold bg-zinc-50 dark:bg-[#161B33] border border-zinc-200 dark:border-zinc-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#313866] dark:text-[#8A92D0]" /> Email Address
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs font-semibold bg-zinc-50 dark:bg-[#161B33] border border-zinc-200 dark:border-zinc-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#313866] dark:text-[#8A92D0]" /> Phone Number
            </label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 (555) 000-0000"
              className="w-full px-3 py-2 text-xs font-semibold bg-zinc-50 dark:bg-[#161B33] border border-zinc-200 dark:border-zinc-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-[#313866] dark:text-[#8A92D0]" /> Department
            </label>
            <select
              name="departmentName"
              value={formData.departmentName}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs font-semibold bg-zinc-50 dark:bg-[#161B33] border border-zinc-200 dark:border-zinc-700 rounded-xl"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-[#313866] dark:text-[#8A92D0]" /> Gender
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs font-semibold bg-zinc-50 dark:bg-[#161B33] border border-zinc-200 dark:border-zinc-700 rounded-xl"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#313866] dark:text-[#8A92D0]" /> Date of Birth
            </label>
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs font-semibold bg-zinc-50 dark:bg-[#161B33] border border-zinc-200 dark:border-zinc-700 rounded-xl"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#313866] dark:text-[#8A92D0]" /> Residential Address
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Street name, City, Zipcode"
            className="w-full px-3 py-2 text-xs font-semibold bg-zinc-50 dark:bg-[#161B33] border border-zinc-200 dark:border-zinc-700 rounded-xl"
          />
        </div>

        {/* Student Specific Fields */}
        {currentUser.role === 'student' && (
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
            <h4 className="text-xs font-extrabold text-[#313866] dark:text-[#8A92D0] uppercase tracking-wider">
              Parent & Guardian Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Father's Name
                </label>
                <input
                  type="text"
                  name="fatherName"
                  value={formData.fatherName}
                  onChange={handleChange}
                  placeholder="Father Name"
                  className="w-full px-3 py-2 text-xs font-semibold bg-zinc-50 dark:bg-[#161B33] border border-zinc-200 dark:border-zinc-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Mother's Name
                </label>
                <input
                  type="text"
                  name="motherName"
                  value={formData.motherName}
                  onChange={handleChange}
                  placeholder="Mother Name"
                  className="w-full px-3 py-2 text-xs font-semibold bg-zinc-50 dark:bg-[#161B33] border border-zinc-200 dark:border-zinc-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Parent / Guardian Mobile No
                </label>
                <input
                  type="text"
                  name="parentPhone"
                  value={formData.parentPhone}
                  onChange={handleChange}
                  placeholder="+1 (555) 987-6543"
                  className="w-full px-3 py-2 text-xs font-semibold bg-zinc-50 dark:bg-[#161B33] border border-zinc-200 dark:border-zinc-700 rounded-xl"
                />
              </div>
            </div>
          </div>
        )}

        {/* Modal Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={handleClearOptionalFields}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear Optional
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-xl hover:bg-zinc-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#313866] hover:bg-[#161B33] text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all"
            >
              <Save className="w-3.5 h-3.5" /> Update Profile
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
