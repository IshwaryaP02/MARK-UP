import React from 'react';
import { BonafideRequest } from '../../types';
import { ScrollText, Printer } from 'lucide-react';

interface BonafideCertificatePrintProps {
  request: BonafideRequest;
  collegeName?: string;
  collegeAddress?: string;
  principalName?: string;
}

export const BonafideCertificatePrint: React.FC<BonafideCertificatePrintProps> = ({
  request,
  collegeName = 'Smart Attendance University',
  collegeAddress = 'University Road, Chennai, Tamil Nadu',
  principalName = 'Dr. A. Ramachandran'
}) => {
  const issueDate = new Date(request.finalApprovedAt || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const currentYear = new Date().getFullYear();
  const regNo = request.studentRegNo || '-';
  const purpose = request.purposeDescription || request.purpose;

  return (
    <div className="space-y-4">
      {/* Printable Certificate Sheet */}
      <div
        id={`bonafide-certificate-${request.id}`}
        className="bg-white text-zinc-900 border-2 border-zinc-300 rounded-md shadow-md overflow-hidden"
        style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
      >
        {/* Top frame */}
        <div className="px-6 sm:px-12 py-8 sm:py-10">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border-2 border-zinc-400 text-zinc-700 mb-2 bg-zinc-100">
              <ScrollText className="w-7 h-7" />
            </div>
            <h1 className="text-lg sm:text-2xl font-bold tracking-wide uppercase text-zinc-900">{collegeName}</h1>
            <p className="text-[10px] sm:text-xs text-zinc-600 uppercase tracking-[0.2em] mt-1">{collegeAddress}</p>
            <p className="text-sm sm:text-lg font-semibold text-zinc-800 uppercase mt-4 border-y border-zinc-300 inline-block px-6 py-1">
              Bonafide Certificate
            </p>
          </div>

          <div className="text-xs sm:text-sm text-zinc-800 leading-relaxed mt-6 space-y-3">
            <p>
              This is to certify that{' '}
              <span className="font-bold uppercase underline underline-offset-4">{request.studentName}</span>
              , S/D/o. holding Registration Number{' '}
              <span className="font-bold">{regNo}</span>, is a bonafide student of this{' '}
              <span className="font-bold">{request.departmentName}</span> Department, studying in{' '}
              <span className="font-bold">Semester {request.semester}</span> ({request.section} Section), for the
              academic year <span className="font-bold">{request.batch}</span>, during the academic year{' '}
              <span className="font-bold">{currentYear - 1}-{currentYear}</span>.
            </p>
            <p>
              The above certificate is issued for the purpose of{' '}
              <span className="font-bold">{purpose}</span>.
            </p>
            <p className="pt-2">
              This certificate is issued based on the records available with the college and is not a claim on the
              character or conduct of the student. We wish {request.studentName} a bright and prosperous future.
            </p>
          </div>

          <div className="flex items-end justify-between mt-10 text-xs sm:text-sm text-zinc-800">
            <div className="text-left">
              <p className="font-semibold">Date: {issueDate}</p>
              <p className="mt-8 text-[10px] text-zinc-500">Bonafide No: {request.id.toUpperCase()}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-zinc-500 mb-8">HOD, {request.departmentName} Department</p>
              <p className="font-bold uppercase">{request.hodName || 'Head of Department'}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-zinc-500 mb-8">Principal</p>
              <p className="font-bold uppercase">{principalName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Action */}
      <div className="flex flex-col sm:flex-row items-center gap-3 justify-between bg-white dark:bg-[#0A0A0A] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
        <div className="text-xs text-zinc-600 dark:text-zinc-300">
          <span className="font-bold text-emerald-600 dark:text-emerald-400">Approved.</span> The certificate is ready
          to print. Use Print / Save as PDF to download.
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="px-5 py-2.5 bg-[#1E40AF] dark:bg-[#2563EB] hover:bg-[#161B33] dark:hover:bg-[#2563EB] text-white text-xs font-bold rounded-xl transition-colors shadow flex items-center gap-2"
        >
          <Printer className="w-4 h-4" /> Print Certificate
        </button>
      </div>
    </div>
  );
};
