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

const STREET_TYPES = new Set([
  'via', 'viale', 'piazza', 'piazzale', 'piazzetta', 'borgo', 'largo',
  'lungarno', 'corso', 'vicolo', 'viuzzo', 'chiasso', 'costa', 'rampa',
  'stradone', 'passaggio', 'ponte',
]);

const STREET_CONNECTORS = new Set([
  'a', 'ad', 'al', 'allo', 'alla', 'ai', 'agli', 'alle',
  'da', 'dal', 'dallo', 'dalla', 'dai', 'dagli', 'dalle',
  'd', 'de', 'di', 'dei', 'del', 'dello', 'della', 'degli', 'delle',
  'e', 'in', 'nel', 'nello', 'nella', 'nei', 'negli', 'nelle',
  'su', 'sul', 'sullo', 'sulla', 'sui', 'sugli', 'sulle',
  'l', 'il', 'lo', 'la', 'i', 'gli', 'le',
]);

// The municipality records Calzaiuoli as a variant of its current Calzaioli:
// https://linkedopendata.comune.fi.it/lodview/toponym/D61200002960.html
const VERIFIED_NAME_VARIANTS = new Map([['calzaiuoli', 'calzaioli']]);

function streetSearchParts(value) {
  const normalized = value.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/^v\s*\.\s*le\b\.?/, 'viale ')
    .replace(/^p\s*\.\s*zza\b\.?/, 'piazza ')
    .replace(/^p\s*\.\s*le\b\.?/, 'piazzale ')
    .replace(/^l\s*\.\s*go\b\.?/, 'largo ')
    .replace(/^c\s*\.\s*so\b\.?/, 'corso ')
    .replace(/^b\s*\.\s*go\b\.?/, 'borgo ')
    .replace(/^v\s*\.(?=\s|[a-z])/, 'via ')
    .replace(/^pzza\b/, 'piazza')
    // The apostrophe in Sant'Antonino is optional when typing a street name.
    .replace(/\bsant[\s'’‘`´]+(?=[a-z])/, 'sant');
  const tokens = (normalized.match(/[a-z0-9]+/g) || [])
    .map(token => VERIFIED_NAME_VARIANTS.get(token) || token);
  const type = STREET_TYPES.has(tokens[0]) ? tokens[0] : null;
  return {
    type,
    tokens,
    meaningful: tokens.filter((token, index) =>
      !(index === 0 && type) && !STREET_CONNECTORS.has(token)),
  };
}

// Compare names from two municipal sources without treating a prefix or a
// similar person/place name as evidence that the street is the same.
export function streetNameKey(value) {
  const street = streetSearchParts(value);
  return `${street.type || ''}:${street.meaningful.join('')}`;
}

/** Match actual words (or their prefixes), without guessing misspelled streets. */
export function findStreetMatches(query, names) {
  const term = typeof query === 'string' ? query : '';
  const search = streetSearchParts(term);
  if (!search.meaningful.length) return [];
  const exact = normalizeStreetName(term);
  const matches = [];

  names.forEach((name, index) => {
    const street = streetSearchParts(name);
    if (search.type && search.type !== street.type) return;
    let position = 0;
    let prefixes = 0;
    for (const word of search.meaningful) {
      const offset = street.meaningful.findIndex((candidate, candidateIndex) =>
        candidateIndex >= position && candidate.startsWith(word));
      if (offset === -1) return;
      if (street.meaningful[offset] !== word) prefixes += 1;
      position = offset + 1;
    }
    let rank = 4;
    if (normalizeStreetName(name) === exact) rank = 0;
    else if (street.tokens.join(' ') === search.tokens.join(' ')) rank = 1;
    else if (street.meaningful.join(' ') === search.meaningful.join(' ')) rank = 2;
    else if (prefixes === 0) rank = 3;
    matches.push({ name, index, rank, prefixes });
  });

  return matches.sort((a, b) => a.rank - b.rank || a.prefixes - b.prefixes || a.index - b.index)
    .map(({ name, index }) => ({ name, index }));
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
