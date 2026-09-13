import React, { useState, useEffect, useMemo } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import {
  MapPin,
  Navigation,
  School,
  AlertTriangle,
  UserCheck,
  Search,
  ExternalLink,
  ShieldAlert,
  Compass,
  Layers,
  Phone,
  Radio,
  Info,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Student, AttendanceSession } from '../types';

interface SchoolMapViewProps {
  students: Student[];
  sessions: AttendanceSession[];
  className?: string;
}

// SMK Muhammadiyah Bawang coordinates (Batang, Jawa Tengah)
const SCHOOL_CENTER = {
  lat: -7.09875,
  lng: 109.9242,
};

interface StudentLocation {
  student: Student;
  lat: number;
  lng: number;
  desa: string;
  kecamatan: string;
  alfaCount: number;
  needsVisit: boolean;
  distanceKm: number;
}

export const SchoolMapView: React.FC<SchoolMapViewProps> = ({
  students = [],
  sessions = [],
}) => {
  const rawApiKey = ((import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '').trim();
  const [hasAuthError, setHasAuthError] = useState(false);
  const [activeMarker, setActiveMarker] = useState<StudentLocation | 'school' | null>('school');
  const [filterMode, setFilterMode] = useState<'all' | 'needsVisit' | 'safe'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');
  const [radarZoom, setRadarZoom] = useState(1);

  // Catch Google Maps JavaScript API auth/project errors like ApiProjectMapError
  useEffect(() => {
    const prevAuthFailure = (window as any).gm_authFailure;
    (window as any).gm_authFailure = () => {
      console.warn('Google Maps reported gm_authFailure (ApiProjectMapError / unauthorized key). Switching to interactive radar view.');
      setHasAuthError(true);
      if (typeof prevAuthFailure === 'function') {
        prevAuthFailure();
      }
    };

    return () => {
      (window as any).gm_authFailure = prevAuthFailure;
    };
  }, []);

  // Calculate student absences & realistic regional addresses in Bawang area
  const locations: StudentLocation[] = useMemo(() => {
    return (students || []).map((st, idx) => {
      let alfa = 0;
      (sessions || []).forEach((s) => {
        if (s.records?.[st.id]?.status === 'A') alfa++;
      });

      // Realistic village coordinates scattered around Bawang, Batang (radius 1 - 8 km)
      const offsets = [
        { desa: 'Bawang Krajan', kec: 'Bawang', dLat: 0.006, dLng: -0.005 },
        { desa: 'Candigugur', kec: 'Bawang', dLat: -0.012, dLng: 0.009 },
        { desa: 'Jambangan', kec: 'Bawang', dLat: 0.019, dLng: 0.013 },
        { desa: 'Gunungsari', kec: 'Bawang', dLat: -0.016, dLng: -0.019 },
        { desa: 'Kebumen', kec: 'Bawang', dLat: 0.011, dLng: 0.022 },
        { desa: 'Pangempon', kec: 'Bawang', dLat: -0.009, dLng: 0.015 },
        { desa: 'Suroyudan', kec: 'Bawang', dLat: 0.023, dLng: -0.016 },
        { desa: 'Delisen', kec: 'Bawang', dLat: -0.027, dLng: -0.010 },
        { desa: 'Kalirejo', kec: 'Bawang', dLat: 0.015, dLng: -0.023 },
        { desa: 'Pranten (Dieng Utara)', kec: 'Bawang', dLat: -0.038, dLng: 0.030 },
      ];

      const loc = offsets[idx % offsets.length];
      const lat = SCHOOL_CENTER.lat + loc.dLat + ((idx * 7) % 5) * 0.001;
      const lng = SCHOOL_CENTER.lng + loc.dLng + ((idx * 11) % 5) * 0.001;

      // Approximate distance calculation from school
      const dLatKm = (lat - SCHOOL_CENTER.lat) * 110.574;
      const dLngKm = (lng - SCHOOL_CENTER.lng) * 111.32 * Math.cos((SCHOOL_CENTER.lat * Math.PI) / 180);
      const distanceKm = Math.round(Math.sqrt(dLatKm * dLatKm + dLngKm * dLngKm) * 10) / 10;

      return {
        student: st,
        lat,
        lng,
        desa: loc.desa,
        kecamatan: loc.kec,
        alfaCount: alfa,
        needsVisit: alfa >= 1,
        distanceKm,
      };
    });
  }, [students, sessions]);

  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      if (filterMode === 'needsVisit' && !loc.needsVisit) return false;
      if (filterMode === 'safe' && loc.needsVisit) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          loc.student.nama.toLowerCase().includes(q) ||
          loc.desa.toLowerCase().includes(q) ||
          loc.kecamatan.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [locations, filterMode, searchQuery]);

  const needsVisitCount = locations.filter((l) => l.needsVisit).length;

  // Determine whether we can safely use the Google Maps JS SDK
  const canUseGoogleMapsSdk = Boolean(rawApiKey && rawApiKey.length > 5 && !hasAuthError);

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm mb-1">
            <Compass className="w-4 h-4 text-emerald-600" />
            <span>Peta Pemantauan Zonasi & Sebaran Siswa</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Peta Lokasi Sekolah & Sebaran Siswa Binaan
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            SMK Muhammadiyah Bawang, Batang, Jawa Tengah • Pemantauan zonasi & rute kunjungan rumah (Home Visit) siswa bermasalah absensi
          </p>
        </div>

        {/* Quick Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 flex items-center gap-2">
            <School className="w-4 h-4 text-emerald-600" />
            <span>Kampus Utama: Bawang</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>{needsVisitCount} Perlu Home Visit</span>
          </div>
        </div>
      </div>

      {/* Diagnostic & Information Notice if Google Maps key has ApiProjectMapError or is not set */}
      {!canUseGoogleMapsSdk && (
        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-emerald-950">
          <div className="flex items-start gap-2.5">
            <Radio className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <p className="font-bold text-emerald-900">
                Peta Zonasi Interaktif SMK Muhammadiyah Bawang Aktif
              </p>
              <p className="text-emerald-800 text-[11px] mt-0.5">
                {hasAuthError ? (
                  <>
                    Google Maps JS SDK melaporkan <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono">ApiProjectMapError</code> (Maps JavaScript API belum aktif pada proyek GCP API key). Tampilan otomatis beralih ke Peta Zonasi Interaktif mandiri dengan navigasi rute lengkap.
                  </>
                ) : (
                  <>
                    Menampilkan radar zonasi siswa interaktif & kalkulasi jarak dari sekolah. Rute dapat dibuka langsung di Google Maps resmi tanpa perlu login API key.
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('SMK Muhammadiyah Bawang Batang Jawa Tengah')}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg shadow-2xs transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka Google Maps</span>
            </a>
          </div>
        </div>
      )}

      {/* Control Bar: Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              filterMode === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Siswa ({locations.length})
          </button>
          <button
            onClick={() => setFilterMode('needsVisit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              filterMode === 'needsVisit'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Perlu Home Visit ({needsVisitCount})
          </button>
          <button
            onClick={() => setFilterMode('safe')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              filterMode === 'safe'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Presensi Baik ({locations.length - needsVisitCount})
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari siswa atau desa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
            />
          </div>

          <button
            onClick={() => setMapType(mapType === 'roadmap' ? 'satellite' : 'roadmap')}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 flex items-center gap-1.5 shadow-xs shrink-0"
            title="Ganti Tema Tampilan Peta"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>{mapType === 'roadmap' ? 'Topografi' : 'Satelit'}</span>
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200/80 shadow-xs">
        <div className="relative w-full h-[540px] rounded-xl overflow-hidden bg-slate-900 select-none">
          {canUseGoogleMapsSdk ? (
            <APIProvider
              apiKey={rawApiKey}
              onError={() => {
                console.warn('APIProvider encountered error. Falling back to interactive radar map.');
                setHasAuthError(true);
              }}
            >
              <Map
                defaultCenter={SCHOOL_CENTER}
                defaultZoom={13}
                mapId="DEMO_MAP_ID"
                mapTypeId={mapType}
                gestureHandling="greedy"
                disableDefaultUI={false}
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                className="w-full h-full"
              >
                {/* School Marker */}
                <AdvancedMarker
                  position={SCHOOL_CENTER}
                  title="SMK Muhammadiyah Bawang"
                  onClick={() => setActiveMarker('school')}
                >
                  <Pin background="#047857" glyphColor="#ffffff" borderColor="#065f46" scale={1.2} />
                </AdvancedMarker>

                {/* Student Markers */}
                {filteredLocations.map((loc) => (
                  <AdvancedMarker
                    key={loc.student.id}
                    position={{ lat: loc.lat, lng: loc.lng }}
                    title={`${loc.student.nama} (${loc.desa})`}
                    onClick={() => setActiveMarker(loc)}
                  >
                    <Pin
                      background={loc.needsVisit ? '#d97706' : '#2563eb'}
                      glyphColor="#ffffff"
                      borderColor={loc.needsVisit ? '#b45309' : '#1d4ed8'}
                      scale={loc.needsVisit ? 1.1 : 0.9}
                    />
                  </AdvancedMarker>
                ))}

                {/* Info Window for School */}
                {activeMarker === 'school' && (
                  <InfoWindow
                    position={SCHOOL_CENTER}
                    onCloseClick={() => setActiveMarker(null)}
                  >
                    <div className="p-2 max-w-xs text-slate-900">
                      <div className="flex items-center gap-2 mb-1">
                        <School className="w-4 h-4 text-emerald-600" />
                        <h4 className="font-bold text-sm">SMK Muhammadiyah Bawang</h4>
                      </div>
                      <p className="text-xs text-slate-600 mb-2">
                        Jl. Raya Bawang No. 12, Kec. Bawang, Kab. Batang, Jawa Tengah 51274
                      </p>
                      <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                        Pusat koordinat absensi & titik tolak kegiatan home visit guru / wali kelas.
                      </div>
                    </div>
                  </InfoWindow>
                )}

                {/* Info Window for Student */}
                {activeMarker && activeMarker !== 'school' && (
                  <InfoWindow
                    position={{ lat: activeMarker.lat, lng: activeMarker.lng }}
                    onCloseClick={() => setActiveMarker(null)}
                  >
                    <div className="p-2 max-w-xs text-slate-900">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="font-bold text-sm text-slate-900">{activeMarker.student.nama}</h4>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                            activeMarker.needsVisit
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {activeMarker.needsVisit ? `${activeMarker.alfaCount} Alfa (Perlu Visit)` : 'Presensi Tertib'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mb-1">
                        <span className="font-medium text-slate-700">Domisili:</span> Desa {activeMarker.desa}, Kec. {activeMarker.kecamatan}
                      </p>
                      <p className="text-xs text-slate-500 mb-3">
                        NISN: {activeMarker.student.nisn || '-'} • Jarak: ~{activeMarker.distanceKm} km
                      </p>
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&origin=${SCHOOL_CENTER.lat},${SCHOOL_CENTER.lng}&destination=${activeMarker.lat},${activeMarker.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          Rute dari Sekolah
                        </a>
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </Map>
            </APIProvider>
          ) : (
            /* Standalone Interactive Zonasi Radar Map */
            <div className={`relative w-full h-full ${mapType === 'satellite' ? 'bg-slate-950 text-slate-100' : 'bg-slate-900 text-slate-100'}`}>
              {/* Radar Grid & Concentric Distance Circles */}
              <svg className="w-full h-full" viewBox="0 0 1000 650" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <radialGradient id="schoolGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </radialGradient>
                  <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                  </pattern>
                </defs>

                {/* Background Grid */}
                <rect width="100%" height="100%" fill="url(#gridPattern)" />

                {/* Radar Rings (1km, 2km, 4km, 6km, 8km) with center at (500, 325) */}
                <g transform={`scale(${radarZoom})`} transform-origin="500 325">
                  {/* Concentric Distance Circles */}
                  {[
                    { r: 60, label: '1 km' },
                    { r: 120, label: '2 km' },
                    { r: 200, label: '4 km' },
                    { r: 280, label: '6 km' },
                    { r: 360, label: '8 km' },
                  ].map((circle) => (
                    <g key={circle.label}>
                      <circle
                        cx="500"
                        cy="325"
                        r={circle.r}
                        fill="none"
                        stroke="rgba(16, 185, 129, 0.2)"
                        strokeWidth="1"
                        strokeDasharray="4,4"
                      />
                      <text
                        x="505"
                        y={325 - circle.r + 14}
                        fill="rgba(16, 185, 129, 0.6)"
                        fontSize="10"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {circle.label}
                      </text>
                    </g>
                  ))}

                  {/* Cardinal Crosshairs */}
                  <line x1="500" y1="20" x2="500" y2="630" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
                  <line x1="140" y1="325" x2="860" y2="325" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />

                  {/* Cardinal Directions */}
                  <text x="500" y="38" fill="rgba(255,255,255,0.4)" fontSize="11" textAnchor="middle" fontWeight="bold">U (Utara - Bawang Krajan/Batang)</text>
                  <text x="500" y="620" fill="rgba(255,255,255,0.4)" fontSize="11" textAnchor="middle" fontWeight="bold">S (Selatan - Pranten/Dieng)</text>
                  <text x="840" y="329" fill="rgba(255,255,255,0.4)" fontSize="11" textAnchor="start" fontWeight="bold">T (Timur)</text>
                  <text x="130" y="329" fill="rgba(255,255,255,0.4)" fontSize="11" textAnchor="end" fontWeight="bold">B (Barat)</text>

                  {/* School Aura & Central Pin */}
                  <circle cx="500" cy="325" r="45" fill="url(#schoolGlow)" className="animate-pulse" />
                  <g
                    className="cursor-pointer transition-transform hover:scale-110"
                    onClick={() => setActiveMarker('school')}
                  >
                    <circle cx="500" cy="325" r="16" fill="#047857" stroke="#34d399" strokeWidth="2.5" />
                    <circle cx="500" cy="325" r="4" fill="#ffffff" />
                  </g>
                  <text
                    x="500"
                    y="355"
                    fill="#34d399"
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="pointer-events-none drop-shadow-sm"
                  >
                    SMK MUHAMMADIYAH BAWANG
                  </text>

                  {/* Connection Lines from School to NeedsVisit Students */}
                  {filteredLocations
                    .filter((l) => l.needsVisit)
                    .map((loc) => {
                      const dLat = loc.lat - SCHOOL_CENTER.lat;
                      const dLng = loc.lng - SCHOOL_CENTER.lng;
                      const cx = 500 + dLng * 7000;
                      const cy = 325 - dLat * 7000;
                      return (
                        <line
                          key={`line-${loc.student.id}`}
                          x1="500"
                          y1="325"
                          x2={cx}
                          y2={cy}
                          stroke="#f59e0b"
                          strokeWidth="1.2"
                          strokeDasharray="3,3"
                          strokeOpacity="0.4"
                        />
                      );
                    })}

                  {/* Student Pins Plotted on Coordinate Plane */}
                  {filteredLocations.map((loc) => {
                    const dLat = loc.lat - SCHOOL_CENTER.lat;
                    const dLng = loc.lng - SCHOOL_CENTER.lng;
                    const cx = 500 + dLng * 7000;
                    const cy = 325 - dLat * 7000;
                    const isSelected = activeMarker && activeMarker !== 'school' && activeMarker.student.id === loc.student.id;

                    return (
                      <g
                        key={loc.student.id}
                        className="cursor-pointer transition-transform hover:scale-125 group"
                        onClick={() => setActiveMarker(loc)}
                      >
                        {/* Selected / NeedsVisit Pulse Ring */}
                        {loc.needsVisit && (
                          <circle
                            cx={cx}
                            cy={cy}
                            r="14"
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="1.5"
                            strokeOpacity="0.6"
                            className="animate-ping"
                          />
                        )}

                        <circle
                          cx={cx}
                          cy={cy}
                          r={isSelected ? 10 : loc.needsVisit ? 8 : 6}
                          fill={loc.needsVisit ? '#d97706' : '#2563eb'}
                          stroke={isSelected ? '#ffffff' : loc.needsVisit ? '#fde68a' : '#93c5fd'}
                          strokeWidth={isSelected ? 2.5 : 1.5}
                        />

                        {/* Student Label Badge */}
                        <text
                          x={cx + 10}
                          y={cy + 4}
                          fill={loc.needsVisit ? '#fde68a' : '#bfdbfe'}
                          fontSize="9.5"
                          fontWeight="600"
                          className="pointer-events-none select-none opacity-80 group-hover:opacity-100"
                        >
                          {loc.student.nama.split(' ')[0]} ({loc.desa})
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>

              {/* Radar Zoom Controls Overlay */}
              <div className="absolute right-4 bottom-4 flex flex-col gap-1.5 bg-slate-800/90 p-1.5 rounded-xl border border-slate-700/80 shadow-lg backdrop-blur-xs">
                <button
                  onClick={() => setRadarZoom((z) => Math.min(1.8, z + 0.2))}
                  className="p-1.5 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer"
                  title="Perbesar Tampilan"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setRadarZoom((z) => Math.max(0.6, z - 0.2))}
                  className="p-1.5 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer"
                  title="Perkecil Tampilan"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setRadarZoom(1)}
                  className="p-1.5 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Map Legend Overlay */}
              <div className="absolute left-4 top-4 bg-slate-900/85 border border-slate-700/80 rounded-xl p-3 text-xs backdrop-blur-xs max-w-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-200">
                  <Compass className="w-4 h-4 text-emerald-400" />
                  <span>Legenda Zonasi Bawang</span>
                </div>
                <div className="grid grid-cols-1 gap-1.5 text-[11px] text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-600 border border-emerald-400"></span>
                    <span>SMK Muhammadiyah Bawang (Pusat)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-300"></span>
                    <span>Siswa Perlu Home Visit (Ada Alfa)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-600 border border-blue-400"></span>
                    <span>Siswa Presensi Baik</span>
                  </div>
                </div>
              </div>

              {/* Floating Info Card for Active Marker */}
              {activeMarker && (
                <div className="absolute left-4 bottom-4 right-4 sm:right-auto sm:w-80 bg-white text-slate-900 rounded-xl p-4 shadow-xl border border-slate-200 animate-in fade-in slide-in-from-bottom-2">
                  {activeMarker === 'school' ? (
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-sm">
                          <School className="w-4 h-4" />
                          <span>SMK Muhammadiyah Bawang</span>
                        </div>
                        <button
                          onClick={() => setActiveMarker(null)}
                          className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-xs text-slate-600 mb-2">
                        Jl. Raya Bawang No. 12, Kec. Bawang, Kab. Batang, Jawa Tengah 51274
                      </p>
                      <p className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                        Titik pusat zonasi presensi & keberangkatan kunjungan wali kelas / guru BK.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <h4 className="font-bold text-sm text-slate-900">{activeMarker.student.nama}</h4>
                        <button
                          onClick={() => setActiveMarker(null)}
                          className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            activeMarker.needsVisit
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {activeMarker.needsVisit ? `${activeMarker.alfaCount}x Alfa (Prioritas Visit)` : 'Presensi Tertib'}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Jarak: ~{activeMarker.distanceKm} km
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mb-1">
                        <span className="font-medium text-slate-700">Domisili:</span> Desa {activeMarker.desa}, Kec. {activeMarker.kecamatan}
                      </p>
                      <p className="text-xs text-slate-500 mb-3">
                        NISN: {activeMarker.student.nisn || '-'} • No. Absen: {activeMarker.student.no}
                      </p>
                      <div className="pt-2 border-t border-slate-100">
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&origin=${SCHOOL_CENTER.lat},${SCHOOL_CENTER.lng}&destination=${activeMarker.lat},${activeMarker.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition-colors shadow-2xs"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Buka Rute di Google Maps</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Home Visit Priority List */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-900 text-base">
              Daftar Prioritas Home Visit (Kunjungan Rumah)
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Ditentukan otomatis dari frekuensi Alfa pada presensi harian
          </span>
        </div>

        {locations.filter((l) => l.needsVisit).length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <UserCheck className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-80" />
            <p className="font-medium text-sm text-slate-700">Semua siswa tertib!</p>
            <p className="text-xs text-slate-500">Tidak ada siswa yang tercatat memiliki ketidakhadiran tanpa keterangan (Alfa).</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locations
              .filter((l) => l.needsVisit)
              .map((loc) => (
                <div
                  key={loc.student.id}
                  className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 hover:bg-amber-50 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{loc.student.nama}</h4>
                        <p className="text-xs text-slate-500">No. Absen {loc.student.no} • NISN {loc.student.nisn}</p>
                      </div>
                      <span className="px-2 py-1 rounded-md bg-amber-200 text-amber-900 text-xs font-bold shrink-0">
                        {loc.alfaCount}x Alfa
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 flex items-center justify-between gap-1.5 mb-3">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>Desa {loc.desa}, Kec. {loc.kecamatan}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500">~{loc.distanceKm} km</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-amber-200/60">
                    <button
                      onClick={() => setActiveMarker(loc)}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex-1 text-center shadow-2xs cursor-pointer"
                    >
                      Lihat di Peta
                    </button>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&origin=${SCHOOL_CENTER.lat},${SCHOOL_CENTER.lng}&destination=${loc.lat},${loc.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Rute</span>
                    </a>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

