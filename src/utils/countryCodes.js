/** Common country dial codes for admin phone fields. */
export const COUNTRY_CODES = [
  { code: 'QA', dial: '+974', flag: '🇶🇦', label: 'Qatar' },
  { code: 'SA', dial: '+966', flag: '🇸🇦', label: 'Saudi Arabia' },
  { code: 'AE', dial: '+971', flag: '🇦🇪', label: 'UAE' },
  { code: 'EG', dial: '+20', flag: '🇪🇬', label: 'Egypt' },
  { code: 'KW', dial: '+965', flag: '🇰🇼', label: 'Kuwait' },
  { code: 'BH', dial: '+973', flag: '🇧🇭', label: 'Bahrain' },
  { code: 'OM', dial: '+968', flag: '🇴🇲', label: 'Oman' },
  { code: 'JO', dial: '+962', flag: '🇯🇴', label: 'Jordan' },
  { code: 'LB', dial: '+961', flag: '🇱🇧', label: 'Lebanon' },
  { code: 'US', dial: '+1', flag: '🇺🇸', label: 'United States' },
  { code: 'GB', dial: '+44', flag: '🇬🇧', label: 'United Kingdom' },
];

export function parsePhoneWithDialCode(fullPhone, defaultDial = '+974') {
  const raw = String(fullPhone ?? '').trim();
  if (!raw) return { dialCode: defaultDial, localNumber: '' };
  const match = COUNTRY_CODES.find((c) => raw.startsWith(c.dial));
  if (match) {
    return { dialCode: match.dial, localNumber: raw.slice(match.dial.length).trim() };
  }
  if (raw.startsWith('+')) {
    const space = raw.indexOf(' ');
    if (space > 0) {
      return { dialCode: raw.slice(0, space), localNumber: raw.slice(space + 1).trim() };
    }
  }
  return { dialCode: defaultDial, localNumber: raw.replace(/^\+/, '') };
}

export function combinePhoneWithDialCode(dialCode, localNumber) {
  const dial = String(dialCode ?? '').trim();
  const local = String(localNumber ?? '').trim().replace(/\s+/g, '');
  if (!local) return '';
  if (!dial) return local;
  return `${dial}${local.startsWith('0') ? local.slice(1) : local}`;
}
