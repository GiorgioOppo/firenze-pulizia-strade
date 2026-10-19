// Dates are Europe/Rome wall-clock values represented on a UTC calendar.
// This keeps monthly recurrences independent of the viewer's time zone and DST.
export const DAY = 86_400_000;
const MINUTE = 60_000;

export function minutes(value) {
  const [hours, minute] = value.split(':').map(Number);
  return hours * 60 + minute;
}

export function parseWall(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value || '');
  if (!match) return NaN;

  const [, year, month, day, hour, minute] = match.map(Number);
  const result = Date.UTC(year, month - 1, day, hour, minute);
  const date = new Date(result);
  const valid = date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
    && hour < 24
    && minute < 60;

  return valid ? result : NaN;
}

export function dayMatches(schedule, date) {
  // Compact schedules use Monday = 0, while Date uses Sunday = 0.
  const weekday = (date.getUTCDay() + 6) % 7;
  if (weekday !== schedule[1]) return false;
  if (schedule[0] < 5) {
    return Math.floor((date.getUTCDate() - 1) / 7) === schedule[0];
  }

  // The supplied 'settimane pari/dispari' labels have no documented mapping.
  // Their weekday remains usable; parity is deliberately not inferred.
  return true;
}

export function scheduleEvents(schedule, from, until) {
  const startMinute = minutes(schedule[2]);
  const endMinute = minutes(schedule[3]);
  const allDay = startMinute === endMinute;
  const uncertain = schedule[0] === 5 || schedule[0] === 6 || allDay;
  const events = [];

  // Include the previous day so a shift across midnight can overlap the stay.
  const firstDay = Math.floor(from / DAY) * DAY - DAY;
  const lastDay = Math.floor(until / DAY) * DAY;
  for (let day = firstDay; day <= lastDay; day += DAY) {
    if (!dayMatches(schedule, new Date(day))) continue;

    const start = allDay ? day : day + startMinute * MINUTE;
    const end = allDay
      ? day + DAY
      : day + endMinute * MINUTE + (endMinute < startMinute ? DAY : 0);

    // Both the stay and the cleaning shift are half-open intervals.
    if (start < until && end > from) events.push({ start, end, uncertain });
  }

  return events;
}

export function analyzeSchedule(schedule, from, until) {
  const events = scheduleEvents(schedule, from, until);
  const status = events.some(event => !event.uncertain) ? 2 : events.length ? 1 : 0;
  return { status, events };
}

export function nextConfirmedEvent(schedule, from) {
  if ([5, 6].includes(schedule[0]) || schedule[2] === schedule[3]) return null;
  return scheduleEvents(schedule, from, from + 370 * DAY)
    .find(event => !event.uncertain) || null;
}

// Status 3 is missing source data, never a successful "no washing" result.
export function statusForRoad(scheduleIds, analysis) {
  if (!scheduleIds.length) return 3;
  return Math.max(...scheduleIds.map(id => analysis[id].status));
}
