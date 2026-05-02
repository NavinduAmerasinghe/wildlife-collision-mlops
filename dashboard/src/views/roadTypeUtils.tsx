// roadTypeUtils.ts
export type RoadType = 'Highways' | 'Local Roads' | 'City Streets';

export const classifyRoadType = (name: string): RoadType => {
  if (/\b(e\d+|vt\s*\d+|valtatie\b)/i.test(name)) {
    return 'Highways';
  }
  if (/\b(kt\s*\d+|kantatie\b|mt\s*\d+|seututie\b|yhdystie\b)/i.test(name)) {
    return 'Local Roads';
  }
  return 'City Streets';
};
