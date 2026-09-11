import { StudentGrade, CalculatedGrade } from '../types';

export interface FormattedGradeDetail {
  formatif1: number | null;
  formatif2: number | null;
  formatif3: number | null;
  formatif4: number | null;
  formatif5: number | null;
  formatif6: number | null;
  formatif7: number | null;
  formatif8: number | null;
  sumatifTengah: number | null;
  sumatifAkhir: number | null;
  rataFormatif: number;
  nilaiAkhir: number;
  predikat: 'A' | 'B' | 'C' | 'D';
  isTuntas: boolean;
  status: 'Tuntas' | 'Belum Tuntas';
}

/**
 * Extracts normalized 10 grade columns from StudentGrade with backward compatibility
 */
export function extractGradeValues(g?: StudentGrade) {
  const formatif1 = g?.formatif1 ?? g?.tugas1 ?? null;
  const formatif2 = g?.formatif2 ?? g?.tugas2 ?? null;
  const formatif3 = g?.formatif3 ?? g?.tugas3 ?? null;
  const formatif4 = g?.formatif4 ?? g?.praktik ?? null;
  const formatif5 = g?.formatif5 ?? null;
  const formatif6 = g?.formatif6 ?? null;
  const formatif7 = g?.formatif7 ?? null;
  const formatif8 = g?.formatif8 ?? null;
  // Asesmen Sumatif (pengganti UTS dan UAS)
  const sumatifTengah = g?.sumatifTengah ?? g?.uts ?? null;
  const sumatifAkhir = g?.sumatifAkhir ?? g?.uas ?? null;

  return {
    formatif1,
    formatif2,
    formatif3,
    formatif4,
    formatif5,
    formatif6,
    formatif7,
    formatif8,
    sumatifTengah,
    sumatifAkhir,
  };
}

/**
 * Calculates student assessment results for 10 columns:
 * - 8 Asesmen Formatif (F1..F8)
 * - 2 Asesmen Sumatif (STS & SAS)
 */
export function calculateStudentGrade(g?: StudentGrade, kkm: number = 75): FormattedGradeDetail {
  const {
    formatif1,
    formatif2,
    formatif3,
    formatif4,
    formatif5,
    formatif6,
    formatif7,
    formatif8,
    sumatifTengah,
    sumatifAkhir,
  } = extractGradeValues(g);

  const formatifList = [
    formatif1,
    formatif2,
    formatif3,
    formatif4,
    formatif5,
    formatif6,
    formatif7,
    formatif8,
  ].filter((v): v is number => v !== null && !isNaN(v));

  const rataFormatif =
    formatifList.length > 0
      ? Math.round(formatifList.reduce((acc, val) => acc + val, 0) / formatifList.length)
      : 0;

  // Weighting calculation:
  // Kurikulum Merdeka: 50% Rata-rata Asesmen Formatif + 25% Sumatif STS + 25% Sumatif SAS
  let totalWeightedScore = 0;
  let totalWeight = 0;

  if (formatifList.length > 0) {
    totalWeightedScore += rataFormatif * 0.5;
    totalWeight += 0.5;
  }

  if (sumatifTengah !== null && !isNaN(sumatifTengah)) {
    totalWeightedScore += sumatifTengah * 0.25;
    totalWeight += 0.25;
  }

  if (sumatifAkhir !== null && !isNaN(sumatifAkhir)) {
    totalWeightedScore += sumatifAkhir * 0.25;
    totalWeight += 0.25;
  }

  const nilaiAkhir =
    totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : rataFormatif;

  let predikat: 'A' | 'B' | 'C' | 'D' = 'D';
  if (nilaiAkhir >= 88) predikat = 'A';
  else if (nilaiAkhir >= 76) predikat = 'B';
  else if (nilaiAkhir >= 60) predikat = 'C';

  const isTuntas = nilaiAkhir >= kkm;
  const status: 'Tuntas' | 'Belum Tuntas' = isTuntas ? 'Tuntas' : 'Belum Tuntas';

  return {
    formatif1,
    formatif2,
    formatif3,
    formatif4,
    formatif5,
    formatif6,
    formatif7,
    formatif8,
    sumatifTengah,
    sumatifAkhir,
    rataFormatif,
    nilaiAkhir,
    predikat,
    isTuntas,
    status,
  };
}
