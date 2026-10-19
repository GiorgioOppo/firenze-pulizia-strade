export const WEEK_LABELS = [
  '1ª occorrenza del mese',
  '2ª occorrenza del mese',
  '3ª occorrenza del mese',
  '4ª occorrenza del mese',
  '5ª occorrenza del mese',
  'settimane pari · cadenza da verificare',
  'settimane dispari · cadenza da verificare',
  'ogni settimana',
];

export const DAY_LABELS = [
  'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato', 'domenica',
];

const dateFormatter = new Intl.DateTimeFormat('it-IT', {
  timeZone: 'UTC',
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function dateLabel(timestamp) {
  return dateFormatter.format(new Date(timestamp));
}

export function timeLabel(timestamp) {
  return new Date(timestamp).toISOString().slice(11, 16);
}

export function eventLabel(event) {
  const sameDay = dateLabel(event.start) === dateLabel(event.end);
  const endDate = sameDay ? '' : `${dateLabel(event.end)} `;
  return `${dateLabel(event.start)} · ${timeLabel(event.start)}–${endDate}${timeLabel(event.end)}`;
}

export function scheduleLabel(schedule) {
  const [week, day, start, end] = schedule;
  const warning = start === end ? ' · orario incongruente' : '';
  return `${DAY_LABELS[day]} · ${WEEK_LABELS[week]} · ${start}–${end}${warning}`;
}

export function normalizeStreetName(value) {
  return value.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();
}

export function currentRomeTime(now = new Date()) {
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Rome',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });
  const parts = Object.fromEntries(formatter.formatToParts(now).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}
