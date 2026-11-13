// "Sat 14 Nov 2026, 6:00 pm"
export const formatDateTime = (date) =>
  new Date(date).toLocaleString('en-AU', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });

// { month: 'Nov', day: '14' } for the date badge
export const dateParts = (date) => {
  const d = new Date(date);
  return { month: d.toLocaleString('en-AU', { month: 'short' }), day: String(d.getDate()) };
};

// "6:00 pm"
export const formatTime = (date) =>
  new Date(date).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });

// "5m ago"
export const timeSince = (date) => {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(date)) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

// Date -> value for <input type="datetime-local"> in the browser's time zone
export const toLocalInput = (date) => {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const isPast = (date) => new Date(date) < new Date();
