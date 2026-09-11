import React, { useState } from 'react';
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
}

export const SchoolMapView: React.FC<SchoolMapViewProps> = ({
  students = [],
  sessions = [],
}) => {
  const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';
  const [activeMarker, setActiveMarker] = useState<StudentLocation | 'school' | null>('school');
  const [filterMode, setFilterMode] = useState<'all' | 'needsVisit' | 'safe'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');

  // Calculate student absences & mock realistic regional addresses in Bawang area
  const locations: StudentLocation[] = (students || []).map((st, idx) => {
    let alfa = 0;
    (sessions || []).forEach((s) => {
      if (s.records?.[st.id]?.status === 'A') alfa++;
    });

    // Realistic village coordinates scattered around Bawang, Batang (radius 1 - 8 km)
    const offsets = [
      { desa: 'Bawang Krajan', kec: 'Bawang', dLat: 0.005, dLng: -0.004 },
      { desa: 'Candigugur', kec: 'Bawang', dLat: -0.012, dLng: 0.008 },
      { desa: 'Jambangan', kec: 'Bawang', dLat: 0.018, dLng: 0.012 },
      { desa: 'Gunungsari', kec: 'Bawang', dLat: -0.015, dLng: -0.018 },
      { desa: 'Kebumen', kec: 'Bawang', dLat: 0.009, dLng: 0.021 },
      { desa: 'Pangempon', kec: 'Bawang', dLat: -0.008, dLng: 0.014 },
      { desa: 'Suroyudan', kec: 'Bawang', dLat: 0.022, dLng: -0.015 },
      { desa: 'Delisen', kec: 'Bawang', dLat: -0.025, dLng: -0.009 },
      { desa: 'Kalirejo', kec: 'Bawang', dLat: 0.014, dLng: -0.022 },
      { desa: 'Pranten (Dieng Utara)', kec: 'Bawang', dLat: -0.035, dLng: 0.028 },
    ];

    const loc = offsets[idx % offsets.length];
    return {
      student: st,
      lat: SCHOOL_CENTER.lat + loc.dLat + ((idx * 7) % 5) * 0.001,
      lng: SCHOOL_CENTER.lng + loc.dLng + ((idx * 11) % 5) * 0.001,
      desa: loc.desa,
      kecamatan: loc.kec,
      alfaCount: alfa,
      needsVisit: alfa >= 1,
    };
  });

  const filteredLocations = locations.filter((loc) => {
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

  const needsVisitCount = locations.filter((l) => l.needsVisit).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm mb-1">
            <Compass className="w-4 h-4 text-emerald-600" />
            <span>Google Maps Platform Integration</span>
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
            title="Ganti Tampilan Peta"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>{mapType === 'roadmap' ? 'Satelit' : 'Jalan'}</span>
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200/80 shadow-xs">
        <div className="relative w-full h-[520px] rounded-xl overflow-hidden bg-slate-100">
          <APIProvider apiKey={apiKey}>
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
                      NISN: {activeMarker.student.nisn || '-'} • No. Absen: {activeMarker.student.no}
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
                    <div className="text-xs text-slate-600 flex items-center gap-1.5 mb-3">
                      <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>Desa {loc.desa}, Kec. {loc.kecamatan}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-amber-200/60">
                    <button
                      onClick={() => setActiveMarker(loc)}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex-1 text-center shadow-2xs"
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
