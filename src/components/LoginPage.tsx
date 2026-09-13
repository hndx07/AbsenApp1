import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  Cloud,
  ArrowRight,
  Sparkles,
  Smartphone,
  MousePointerClick,
  CheckCircle2,
} from 'lucide-react';
import { TeacherProfile } from '../types';
import { SchoolLogo } from './SchoolLogo';
import {
  signInWithGooglePopupDirect,
  signInWithGoogleRedirectMethod,
  checkGoogleRedirectResult,
  signInWithGoogleIdToken,
  GoogleWorkspaceAuthResult,
} from '../utils/googleWorkspace';
import firebaseConfig from '../../firebase-applet-config.json';

interface LoginPageProps {
  currentTeacher: TeacherProfile;
  onLoginSuccess: (
    teacher: TeacherProfile,
    authResult?: GoogleWorkspaceAuthResult | null
  ) => void;
}

type AuthMethodTab = 'popup' | 'redirect' | 'gis';

export const LoginPage: React.FC<LoginPageProps> = ({
  currentTeacher,
  onLoginSuccess,
}) => {
  const [activeMethod, setActiveMethod] = useState<AuthMethodTab>('popup');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Menghubungkan Akun Google...');
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [domainErrorConfig, setDomainErrorConfig] = useState<{
    domain: string;
    projectId: string;
    consoleUrl: string;
  } | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [gisRendered, setGisRendered] = useState(false);

  // 1. Check for Redirect Result on Mount (Method B: Redirect)
  useEffect(() => {
    let isMounted = true;
    checkGoogleRedirectResult()
      .then((res) => {
        if (res && isMounted) {
          const updatedTeacher: TeacherProfile = {
            ...currentTeacher,
            isLoggedIn: true,
            email: res.user?.email || currentTeacher.email || '',
            namaGuru: res.user?.displayName || currentTeacher.namaGuru || 'Guru SMK',
            avatarUrl: res.user?.photoURL || currentTeacher.avatarUrl,
          };
          onLoginSuccess(updatedTeacher, {
            accessToken: res.accessToken,
            userEmail: updatedTeacher.email,
            displayName: updatedTeacher.namaGuru,
            photoUrl: updatedTeacher.avatarUrl,
            user: res.user,
          });
        }
      })
      .catch((err: any) => {
        if (!isMounted) return;
        if (err?.isUnauthorizedDomain) {
          setDomainErrorConfig({
            domain: err.domain || window.location.hostname,
            projectId: err.projectId || firebaseConfig.projectId,
            consoleUrl: err.consoleUrl,
          });
        } else {
          setGoogleError(err.message || 'Gagal memproses hasil login redirect Google.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentTeacher, onLoginSuccess]);

  // 2. Initialize Google Identity Services (GIS) button if SDK is loaded (Method C)
  useEffect(() => {
    const initGisButton = () => {
      if (typeof window === 'undefined' || !(window as any).google?.accounts?.id) {
        return false;
      }

      try {
        (window as any).google.accounts.id.initialize({
          client_id: firebaseConfig.oAuthClientId,
          callback: async (response: any) => {
            if (response?.credential) {
              setIsGoogleLoading(true);
              setLoadingMessage('Memverifikasi kredensial Google Identity Services...');
              setGoogleError(null);
              setDomainErrorConfig(null);
              try {
                const res = await signInWithGoogleIdToken(response.credential);
                const updatedTeacher: TeacherProfile = {
                  ...currentTeacher,
                  isLoggedIn: true,
                  email: res.user?.email || currentTeacher.email || '',
                  namaGuru: res.user?.displayName || currentTeacher.namaGuru || 'Guru SMK',
                  avatarUrl: res.user?.photoURL || currentTeacher.avatarUrl,
                };
                onLoginSuccess(updatedTeacher, {
                  accessToken: res.accessToken,
                  userEmail: updatedTeacher.email,
                  displayName: updatedTeacher.namaGuru,
                  photoUrl: updatedTeacher.avatarUrl,
                  user: res.user,
                });
              } catch (err: any) {
                if (err?.isUnauthorizedDomain) {
                  setDomainErrorConfig({
                    domain: err.domain || window.location.hostname,
                    projectId: err.projectId || firebaseConfig.projectId,
                    consoleUrl: err.consoleUrl,
                  });
                } else {
                  setGoogleError(err.message || 'Gagal masuk dengan Google Identity Services.');
                }
              } finally {
                setIsGoogleLoading(false);
              }
            }
          },
        });

        const container = document.getElementById('gsi-official-button-container');
        if (container) {
          container.innerHTML = '';
          (window as any).google.accounts.id.renderButton(container, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'pill',
            width: 320,
            logo_alignment: 'left',
          });
          setGisRendered(true);
          return true;
        }
      } catch (err) {
        console.warn('GIS button render error:', err);
      }
      return false;
    };

    // Try immediately, then retry periodically if script is still loading
    if (!initGisButton()) {
      const timer = setInterval(() => {
        if (initGisButton()) {
          clearInterval(timer);
        }
      }, 500);
      return () => clearInterval(timer);
    }
  }, [currentTeacher, onLoginSuccess, activeMethod]);

  // Method A: Trigger Popup Dipanggil Langsung dari Event Klik (User Gesture Sinkron)
  const handleDirectPopupLogin = () => {
    setIsGoogleLoading(true);
    setLoadingMessage('Membuka jendela login Google...');
    setGoogleError(null);
    setDomainErrorConfig(null);

    // Langsung panggil tanpa await fetch/setTimeout agar gesture token tidak hilang
    signInWithGooglePopupDirect()
      .then((result) => {
        const updatedTeacher: TeacherProfile = {
          ...currentTeacher,
          isLoggedIn: true,
          email: result.user?.email || currentTeacher.email || '',
          namaGuru: result.user?.displayName || currentTeacher.namaGuru || 'Guru SMK',
          avatarUrl: result.user?.photoURL || currentTeacher.avatarUrl,
        };
        onLoginSuccess(updatedTeacher, {
          accessToken: result.accessToken,
          userEmail: updatedTeacher.email,
          displayName: updatedTeacher.namaGuru,
          photoUrl: updatedTeacher.avatarUrl,
          user: result.user,
        });
      })
      .catch((err: any) => {
        if (err?.isUnauthorizedDomain) {
          setDomainErrorConfig({
            domain: err.domain || window.location.hostname,
            projectId: err.projectId || firebaseConfig.projectId,
            consoleUrl: err.consoleUrl,
          });
        } else if (
          err?.code === 'auth/popup-blocked' ||
          err?.message?.includes('popup-blocked')
        ) {
          setGoogleError(
            'Popup diblokir oleh browser. Anda dialihkan ke Metode Redirect (B) yang bebas dari blokir popup.'
          );
          setActiveMethod('redirect');
        } else {
          setGoogleError(err?.message || 'Gagal masuk dengan akun Google.');
        }
      })
      .finally(() => {
        setIsGoogleLoading(false);
      });
  };

  // Method B: Ganti Metode dari Popup ke Redirect
  const handleRedirectLogin = () => {
    setIsGoogleLoading(true);
    setLoadingMessage('Memindahkan halaman ke Google OAuth...');
    setGoogleError(null);
    setDomainErrorConfig(null);

    signInWithGoogleRedirectMethod().catch((err: any) => {
      setIsGoogleLoading(false);
      if (err?.isUnauthorizedDomain) {
        setDomainErrorConfig({
          domain: err.domain || window.location.hostname,
          projectId: err.projectId || firebaseConfig.projectId,
          consoleUrl: err.consoleUrl,
        });
      } else {
        setGoogleError(err?.message || 'Gagal memulai autentikasi redirect Google.');
      }
    });
  };

  const handleCopyDomain = () => {
    const domainToCopy =
      domainErrorConfig?.domain || (typeof window !== 'undefined' ? window.location.hostname : '');
    if (domainToCopy && navigator?.clipboard) {
      navigator.clipboard.writeText(domainToCopy);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100/70 to-slate-200/60 flex flex-col justify-center items-center p-4 sm:p-6 font-sans text-slate-900 antialiased">
      {/* Decorative Subtle Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden flex items-center justify-center -z-10">
        <div className="w-[620px] h-[620px] rounded-full bg-blue-100/40 blur-3xl" />
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-9 border border-slate-200/90 shadow-xl shadow-slate-200/70 flex flex-col items-center text-center">
        {/* Authentic School Logo */}
        <div className="relative mb-4 group">
          <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center p-2 transition-transform duration-300 group-hover:scale-105">
            <SchoolLogo
              size="xl"
              className="w-full h-full object-contain drop-shadow-md"
              alt="Logo Resmi SMK Muhammadiyah Bawang"
            />
          </div>
        </div>

        {/* School & Application Title */}
        <div className="space-y-1 mb-5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
            <Cloud className="w-3.5 h-3.5 text-indigo-600" />
            Sistem Informasi Guru
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
            SMK Muhammadiyah Bawang
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Aplikasi Presensi & Nilai Siswa
          </p>
        </div>

        {/* Method Selector Tabs (A, B, C matching the instructions) */}
        <div className="w-full mb-6">
          <div className="flex p-1 bg-slate-100/90 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-600">
            <button
              id="tab-method-popup"
              type="button"
              onClick={() => {
                setActiveMethod('popup');
                setGoogleError(null);
              }}
              className={`flex-1 py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeMethod === 'popup'
                  ? 'bg-white text-indigo-700 shadow-sm font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              <MousePointerClick className="w-3.5 h-3.5" />
              <span>A. Popup Langsung</span>
            </button>
            <button
              id="tab-method-redirect"
              type="button"
              onClick={() => {
                setActiveMethod('redirect');
                setGoogleError(null);
              }}
              className={`flex-1 py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeMethod === 'redirect'
                  ? 'bg-white text-emerald-700 shadow-sm font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>B. Redirect (HP)</span>
            </button>
            <button
              id="tab-method-gis"
              type="button"
              onClick={() => {
                setActiveMethod('gis');
                setGoogleError(null);
              }}
              className={`flex-1 py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeMethod === 'gis'
                  ? 'bg-white text-blue-700 shadow-sm font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>C. Tombol GIS</span>
            </button>
          </div>
        </div>

        {/* Error Alert if Login Fails */}
        {googleError && (
          <div className="w-full mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-left flex items-start gap-2.5 text-rose-700 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block mb-0.5">Informasi Autentikasi:</span>
              <span>{googleError}</span>
            </div>
          </div>
        )}

        {/* Domain Whitelist Notice (if Firebase Auth Authorized Domain is needed) */}
        {domainErrorConfig && (
          <div className="w-full mb-5 p-4 bg-amber-50/90 border border-amber-200 rounded-2xl text-left text-xs text-amber-900 space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="font-bold">Konfigurasi Domain Firebase Diperlukan</div>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Domain preview aplikasi ini belum terdaftar di Authorized Domains Firebase Authentication:
            </p>
            <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-amber-200 font-mono text-[11px] text-slate-800">
              <span className="truncate flex-1 font-semibold">{domainErrorConfig.domain}</span>
              <button
                type="button"
                onClick={handleCopyDomain}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-indigo-600 transition-colors"
                title="Salin Domain"
              >
                {copiedDomain ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
            <a
              href={domainErrorConfig.consoleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 hover:text-indigo-800 underline"
            >
              <span>Buka Pengaturan Firebase Console</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* TAB CONTENT: Method A (Popup Langsung / User Gesture Sinkron) */}
        {activeMethod === 'popup' && (
          <div className="w-full space-y-3.5 text-left">
            <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-[11px] text-indigo-900 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">A. Panggilan Sinkron Langsung (User Gesture):</span>
                <span>
                  Popup dibuka langsung saat tombol diklik tanpa jeda <code>await</code>, sehingga tidak diblokir oleh browser desktop.
                </span>
              </div>
            </div>

            <button
              id="btn-google-popup-direct"
              type="button"
              onClick={handleDirectPopupLogin}
              disabled={isGoogleLoading}
              className="w-full relative flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-bold text-sm sm:text-base border-2 border-slate-200 hover:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100 shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                  <span>{loadingMessage}</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Masuk dengan Google (Popup Langsung)</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* TAB CONTENT: Method B (Redirect Bebas Blokir di HP / Android) */}
        {activeMethod === 'redirect' && (
          <div className="w-full space-y-3.5 text-left">
            <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-[11px] text-emerald-950 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">B. Metode Redirect (Bebas Blokir Browser / HP):</span>
                <span>
                  Memindahkan halaman pengguna langsung ke Google OAuth tanpa jendela popup. <strong>Tidak akan pernah diblokir</strong> oleh browser HP Android maupun webview.
                </span>
              </div>
            </div>

            <button
              id="btn-google-redirect"
              type="button"
              onClick={handleRedirectLogin}
              disabled={isGoogleLoading}
              className="w-full relative flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm sm:text-base focus:outline-none focus:ring-4 focus:ring-emerald-200 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                  <span>{loadingMessage}</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Masuk via Google (Metode Redirect)</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>
        )}

        {/* TAB CONTENT: Method C (Official Google Identity Services Button) */}
        {activeMethod === 'gis' && (
          <div className="w-full space-y-3.5 text-left">
            <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-200 text-[11px] text-blue-950 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">C. Google Identity Services (GIS) Button Resmi:</span>
                <span>
                  Menggunakan tombol standar <code>google.accounts.id.renderButton</code> dari SDK resmi Google untuk proses autentikasi aman.
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-200/90 rounded-2xl min-h-[64px]">
              <div id="gsi-official-button-container" className="flex items-center justify-center" />
              {!gisRendered && (
                <div className="flex items-center gap-2 text-xs text-slate-500 py-1 font-medium">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Memuat tombol resmi Google...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cloud & Security Info */}
        <div className="w-full pt-6 mt-2 border-t border-slate-100 flex flex-col items-center text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Autentikasi Resmi Firebase & Google Cloud</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed max-w-sm">
            Data absensi dan nilai tersimpan aman di Cloud Firestore dan terisolasi otomatis berdasarkan akun Google yang Anda gunakan.
          </p>
        </div>
      </div>

      {/* Clean Minimalist Footer */}
      <footer className="mt-6 text-center text-xs text-slate-500 font-medium">
        <p>© 2026 SMK Muhammadiyah Bawang • Batang, Jawa Tengah</p>
      </footer>
    </div>
  );
};
