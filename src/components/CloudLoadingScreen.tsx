import React from 'react';
import { Cloud, Loader2, Database, ShieldCheck } from 'lucide-react';
import { SchoolLogo } from './SchoolLogo';

interface CloudLoadingScreenProps {
  userEmail?: string;
  userName?: string;
  statusMessage?: string;
}

export const CloudLoadingScreen: React.FC<CloudLoadingScreenProps> = ({
  userEmail,
  userName,
  statusMessage = 'Menghubungkan ke Cloud Firestore...',
}) => {
  return (
    <div className="min-h-screen bg-slate-50/80 flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50 flex flex-col items-center text-center">
        {/* Animated Brand & Cloud Badge */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center p-3 shadow-inner">
            <SchoolLogo size="lg" className="w-full h-full object-contain" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-2 rounded-xl shadow-md border-2 border-white animate-pulse">
            <Cloud className="w-4 h-4" />
          </div>
        </div>

        {/* Loading Spinner & Status Heading */}
        <div className="flex items-center gap-2.5 text-indigo-700 font-bold text-lg mb-2">
          <Loader2 className="w-5 h-5 animate-spin shrink-0 text-indigo-600" />
          <span>Memuat Data dari Cloud</span>
        </div>
        <p className="text-slate-600 text-sm mb-6 leading-relaxed max-w-sm">
          {statusMessage}
        </p>

        {/* User Account Capsule */}
        {userEmail && (
          <div className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3 text-left mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
              {userName?.charAt(0) || userEmail.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-800 truncate">
                {userName || 'Akun Guru Terverifikasi'}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {userEmail}
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200/60">
              <ShieldCheck className="w-3 h-3" />
              Aktif
            </span>
          </div>
        )}

        {/* Skeletons mimicking data loading */}
        <div className="w-full space-y-2.5 pt-2 border-t border-slate-100">
          <div className="h-3.5 bg-slate-100 rounded-full w-4/5 mx-auto animate-pulse" />
          <div className="h-3 bg-slate-100 rounded-full w-2/3 mx-auto animate-pulse" />
          <div className="h-3 bg-slate-100 rounded-full w-1/2 mx-auto animate-pulse" />
        </div>

        <div className="mt-6 flex items-center gap-2 text-[11px] text-slate-400 font-medium">
          <Database className="w-3.5 h-3.5 text-indigo-500" />
          <span>Cloud Firestore Multi-Device Sync Active</span>
        </div>
      </div>
    </div>
  );
};
