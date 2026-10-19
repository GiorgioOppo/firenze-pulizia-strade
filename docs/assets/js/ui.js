import { nextConfirmedEvent } from './calendar.js?v=20261019-coverage';
import { DAY_LABELS, eventLabel, scheduleLabel } from './format.js?v=20261019-coverage';

const MISSING_CALENDAR_NOTE = 'La strada è presente nello stradario comunale ma non nel dataset dei lavaggi. '
  + 'Questo non indica che si possa parcheggiare.';

function addText(parent, text, className = '') {
  const element = document.createElement('div');
  element.className = className;
  element.textContent = text;
  parent.append(element);
  return element;
}

export function populateStreetSuggestions(datalist, names) {
  const options = document.createDocumentFragment();
  for (const name of names) {
    const option = document.createElement('option');
    option.value = name;
    options.append(option);
  }
  datalist.replaceChildren(options);
}

export function renderStatusSummary(element, statuses, total) {
  if (!statuses) {
    element.textContent = `Calcolo sospeso · correggi l’intervallo · ${total.toLocaleString('it-IT')} tratti mappati`;
    return;
  }
  const confirmed = statuses.filter(status => status === 2).length;
  const uncertain = statuses.filter(status => status === 1).length;
  const missing = statuses.filter(status => status === 3).length;
  element.textContent = `${confirmed.toLocaleString('it-IT')} tratti con lavaggio · `
    + `${uncertain.toLocaleString('it-IT')} da verificare · `
    + `${missing.toLocaleString('it-IT')} con calendario non disponibile · `
    + `${total.toLocaleString('it-IT')} tratti mappati`;
}

function renderSegmentPicker(container, { streetRoads, selected, schedules, onSegmentSelect }) {
  const label = document.createElement('label');
  label.className = 'form-label';
  label.textContent = 'Tratto della strada';
  const picker = document.createElement('select');
  picker.className = 'form-select';
  picker.setAttribute('aria-label', 'Tratto della strada');
  const all = document.createElement('option');
  all.value = '';
  all.textContent = `Tutti i tratti (${streetRoads.length})`;
  picker.append(all);

  for (const road of streetRoads) {
    const option = document.createElement('option');
    option.value = road.properties.index;
    const days = [...new Set(road.properties.schedule.map(id => DAY_LABELS[schedules[id][1]]))];
    option.textContent = `Tratto ${road.properties.code} · ${days.length ? days.join(', ') : 'Calendario non disponibile'}`;
    picker.append(option);
  }
  picker.value = selected === null ? '' : String(selected);
  picker.addEventListener('change', () => {
    onSegmentSelect(picker.value === '' ? null : Number(picker.value));
    container.querySelector('select')?.focus({ preventScroll: true });
  });
  label.append(picker);
  container.append(label);
}

export function renderDetails(container, context) {
  const {
    roads, names, schedules, byName, selected, selectedName, statuses,
    analysis, from, valid, onSegmentSelect,
  } = context;
  container.replaceChildren();
  if (selected === null && selectedName === null) {
    container.textContent = 'Calendario del tratto · seleziona una strada o tocca la mappa';
    return;
  }

  const streetRoads = byName.get(selectedName) || [];
  const heading = document.createElement('h2');
  heading.textContent = names[selectedName];
  container.append(heading);

  if (selected === null) {
    const missing = streetRoads.filter(road => !road.properties.schedule.length).length;
    if (missing === streetRoads.length) {
      addText(container, `${streetRoads.length} tratti · Calendario non disponibile`);
      addText(container, MISSING_CALENDAR_NOTE, 'text-small');
    } else if (valid) {
      const counts = [0, 0, 0, 0];
      streetRoads.forEach(road => counts[road.properties.schedule.length ? statuses[road.properties.index] : 3]++);
      addText(container, `${streetRoads.length} tratti · ${counts[2]} con lavaggio · `
        + `${counts[1]} da verificare · ${counts[0]} senza lavaggi calcolati · `
        + `${counts[3]} con calendario non disponibile`);
    } else {
      addText(container, `${streetRoads.length} tratti · ${missing} con calendario non disponibile`);
    }
    addText(container, 'Tocca il tratto in cui vuoi parcheggiare per leggere il suo calendario.', 'text-small');
  } else {
    const road = roads[selected];
    const statusesText = [
      'Nessun lavaggio calcolato durante la sosta',
      'Turno da verificare durante la sosta',
      'Lavaggio durante la sosta',
      'Calendario non disponibile',
    ];
    const scheduleIds = road.properties.schedule;
    addText(container, `Tratto ${road.properties.code} · `
      + (!scheduleIds.length ? statusesText[3] : valid ? statusesText[statuses[selected]] : 'Intervallo non valido'), 'text-small');
    if (!scheduleIds.length) {
      addText(container, MISSING_CALENDAR_NOTE, 'text-small');
    } else {
      const confirmed = scheduleIds.flatMap(id => analysis[id]?.events.filter(event => !event.uncertain) || [])
        .sort((a, b) => a.start - b.start);
      if (confirmed.length) {
        addText(container, `Prima sovrapposizione: ${eventLabel(confirmed[0])}`);
      } else if (valid) {
        const next = scheduleIds.map(id => nextConfirmedEvent(schedules[id], from))
          .filter(Boolean).sort((a, b) => a.start - b.start)[0];
        if (next) addText(container, `Prossimo turno calcolabile: ${eventLabel(next)}`);
      }

      const list = document.createElement('ul');
      const orderedIds = [...scheduleIds].sort((a, b) => schedules[a][1] - schedules[b][1] || schedules[a][0] - schedules[b][0]);
      for (const id of orderedIds) {
        const item = document.createElement('li');
        item.textContent = scheduleLabel(schedules[id]);
        list.append(item);
      }
      container.append(list);

      if (scheduleIds.some(id => [5, 6].includes(schedules[id][0]))) {
        addText(container, 'Pari/dispari: il dataset non chiarisce la cadenza. Verifica il cartello; '
          + 'i giorni potenzialmente interessati sono tratteggiati.', 'text-small');
      }
      if (scheduleIds.some(id => schedules[id][2] === schedules[id][3])) {
        addText(container, 'Inizio e fine coincidono nel dataset: orario da verificare sul posto.', 'text-small');
      }
      if (scheduleIds.some(id => schedules[id][2] === '00:00')) {
        addText(container, '00:00 indica l’inizio del giorno indicato: '
          + 'martedì 00–06 = notte fra lunedì e martedì.', 'text-small');
      }
    }
  }
  renderSegmentPicker(container, { streetRoads, selected, schedules, onSegmentSelect });
}
