const MENTOR_PHONE_STORAGE_KEY = 'mentor_phone';

export function getStoredMentorPhone(mentorId) {
  try {
    const raw = localStorage.getItem(MENTOR_PHONE_STORAGE_KEY);
    if (!raw) return '';
    const map = JSON.parse(raw);
    return map[String(mentorId)] ?? '';
  } catch {
    return '';
  }
}

export function setStoredMentorPhone(mentorId, phone) {
  if (!phone) return;
  try {
    const raw = localStorage.getItem(MENTOR_PHONE_STORAGE_KEY) || '{}';
    const map = JSON.parse(raw);
    map[String(mentorId)] = phone;
    localStorage.setItem(MENTOR_PHONE_STORAGE_KEY, JSON.stringify(map));
  } catch {}
}
