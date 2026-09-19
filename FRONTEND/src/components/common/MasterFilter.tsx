import React, { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import {
  Programme,
  Shift,
  departmentsForProgramme,
  yearsForProgramme,
  shiftsForProgramme,
  validateMasterSelection,
  MasterSelection
} from '../../services/programmeStructure';

interface MasterFilterProps {
  // Pre-populated on mount (e.g. from the current user's department).
  initial?: MasterSelection;
  // Restrict a department up-front (e.g. admin can choose any; HOD only their dept).
  lockedDepartmentId?: string;
  lockedProgramme?: Programme;
  // True: the selector also shows the Programme dropdown. False: programme is fixed.
  showProgramme?: boolean;
  showClear?: boolean;
  onSearch: (sel: MasterSelection) => void;
  // Rendered below the dropdowns (e.g. the applied-selection summary chip).
  onClear?: () => void;
  compact?: boolean;
}

/**
 * Reusable Programme -> Department -> Year -> Shift cascade selector.
 *
 * - Each dropdown is disabled until its parent is selected (correct cascade order).
 * - Invalid combos are blocked (PG + IT year, PG + Second Shift, UG + IT, ...).
 * - Never auto-applies on change; only calls onSearch on an explicit Search action.
 */
export const MasterFilter: React.FC<MasterFilterProps> = ({
  initial,
  lockedDepartmentId,
  lockedProgramme,
  showProgramme = true,
  showClear = true,
  onSearch,
  onClear,
  compact = false
}) => {
  const [programme, setProgramme] = useState<Programme | ''>(initial?.programme || '');
  const [departmentId, setDepartmentId] = useState<string>(initial?.departmentId || '');
  const [year, setYear] = useState<string>(initial?.year || '');
  const [shift, setShift] = useState<Shift | ''>(initial?.shift || '');
  const [error, setError] = useState<string | null>(null);

  // When a department is locked (e.g. HOD), seed it and its programme context.
  useEffect(() => {
    if (lockedDepartmentId) {
      setDepartmentId(lockedDepartmentId);
    }
    if (lockedProgramme) {
      setProgramme(lockedProgramme);
      setDepartmentId(lockedDepartmentId || (departmentsForProgramme(lockedProgramme)[0]?.id || ''));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deptOptions = programme ? departmentsForProgramme(programme) : [];
  const yearOptions = programme ? yearsForProgramme(programme) : [];
  const shiftOptions = programme ? shiftsForProgramme(programme) : [];

  const resetDownstream = (from: 'programme' | 'department' | 'year') => {
    setError(null);
    if (from === 'programme') {
      setDepartmentId('');
      setYear('');
      setShift('');
    } else if (from === 'department') {
      setYear('');
      setShift('');
    } else if (from === 'year') {
      setShift('');
    }
  };

  const handleSearch = () => {
    const sel: MasterSelection = {
      programme: (programme || undefined) as Programme | undefined,
      departmentId: departmentId || undefined,
      year: year || undefined,
      shift: (shift || undefined) as Shift | undefined
    };
    const err = validateMasterSelection(sel);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    onSearch(sel);
  };

  const handleClear = () => {
    setProgramme('');
    setDepartmentId(lockedDepartmentId || '');
    setYear('');
    setShift('');
    setError(null);
    if (onClear) onClear();
  };

  const selectClass = compact
    ? 'px-2.5 py-1.5 bg-white dark:bg-[#0A0A0A] border border-[#E2E8F0] dark:border-zinc-700 rounded-lg text-xs font-bold text-[#2563EB] dark:text-[#3B82F6] disabled:opacity-40 disabled:cursor-not-allowed'
    : 'px-3 py-1.5 bg-white dark:bg-[#0A0A0A] border border-[#E2E8F0] dark:border-zinc-700 rounded-xl text-xs font-bold text-[#2563EB] dark:text-[#3B82F6] disabled:opacity-40 disabled:cursor-not-allowed';
  const labelClass = 'text-xs font-bold text-[#1E293B] dark:text-zinc-300';

  return (
    <div className="flex flex-wrap items-center gap-3">
      {showProgramme && (
        <div className="flex items-center gap-2">
          <label className={labelClass}>Programme:</label>
          <select
            value={programme}
            disabled={!!lockedProgramme}
            onChange={(e) => {
              setProgramme(e.target.value as Programme | '');
              resetDownstream('programme');
            }}
            className={selectClass}
          >
            <option value="">Select Programme</option>
            {(['UG', 'PG'] as Programme[]).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      )}

      {(
        <div className="flex items-center gap-2">
          <label className={labelClass}>Department:</label>
          <select
            value={departmentId}
            disabled={!programme || !!lockedDepartmentId}
            onChange={(e) => {
              setDepartmentId(e.target.value);
              resetDownstream('department');
            }}
            className={selectClass}
          >
            <option value="">
              {programme ? `Select ${programme} Department` : 'Select Programme first'}
            </option>
            {deptOptions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {(
        <div className="flex items-center gap-2">
          <label className={labelClass}>Year:</label>
          <select
            value={year}
            disabled={!departmentId}
            onChange={(e) => {
              setYear(e.target.value);
              resetDownstream('year');
            }}
            className={selectClass}
          >
            <option value="">{departmentId ? `Select ${programme} Year` : 'Select Department first'}</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      )}

      {(
        <div className="flex items-center gap-2">
          <label className={labelClass}>Shift:</label>
          <select
            value={shift}
            disabled={!year}
            onChange={(e) => {
              setShift(e.target.value as Shift | '');
              setError(null);
            }}
            className={selectClass}
          >
            <option value="">{year ? 'Select Shift' : 'Select Year first'}</option>
            {shiftOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        type="button"
        onClick={handleSearch}
        className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#2563EB] dark:bg-[#2563EB] hover:bg-[#161B33] dark:hover:bg-[#2563EB] rounded-xl transition-colors shrink-0"
      >
        <Search className="w-3.5 h-3.5" /> Search
      </button>

      {showClear && (
        <button
          type="button"
          onClick={handleClear}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-[#000000] dark:text-[#64748B] bg-[#F7F9FC] dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors shrink-0"
        >
          <X className="w-3.5 h-3.5" /> Clear
        </button>
      )}

      {error && (
        <span className="text-xs font-bold text-rose-600 dark:text-rose-400 w-full sm:w-auto">
          {error}
        </span>
      )}
    </div>
  );
};
