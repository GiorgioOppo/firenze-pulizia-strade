import { DAY, parseWall, analyzeSchedule, statusForRoad } from './calendar.js?v=20261019-coverage';
import { loadDataset } from './data.js?v=20261019-coverage';
import { currentRomeTime, normalizeStreetName, findStreetMatches } from './format.js?v=20261019-coverage';
import { createMap } from './map.js?v=20261019-coverage';
import { createPreferenceStore } from './storage.js';
import { populateStreetSuggestions, renderDetails, renderStatusSummary } from './ui.js?v=20261019-coverage';

const root = document.getElementById('firenze-lavaggio');

async function main() {
  const query = selector => root.querySelector(selector);
  const controls = query('[data-controls]');
  const arrival = query('[data-arrival]');
  const departure = query('[data-departure]');
  const search = query('[data-search]');
  const error = query('[data-error]');
  const result = query('[data-result]');
  const detail = query('[data-detail]');
  const dataset = await loadDataset();
  const { roads, names, schedules, byName, base, metadata } = dataset;
  const preferenceStore = createPreferenceStore();
  const saved = preferenceStore.read();
  const initialArrival = currentRomeTime();
  arrival.value = saved?.arrival || initialArrival;
  departure.value = saved?.departure
    || `${new Date(parseWall(initialArrival) + DAY).toISOString().slice(0, 10)}T09:00`;
  query('[data-snapshot]').dateTime = metadata.snapshot_date;
  query('[data-snapshot]').textContent = metadata.snapshot_date.split('-').reverse().join('/');
  populateStreetSuggestions(query('#fl-streets'), names);

  const state = {
    selected: Number.isInteger(saved?.selected) && roads[saved.selected] ? saved.selected : null,
    selectedName: Number.isInteger(saved?.name) && names[saved.name] ? saved.name : null,
    from: NaN,
    until: NaN,
    valid: false,
    analysis: [],
    statuses: null,
  };
  if (state.selected !== null) state.selectedName = roads[state.selected].properties.nameIndex;
  if (state.selectedName !== null) search.value = names[state.selectedName];

  const map = createMap({
    root,
    roads,
    base,
    onSelect: selectSegment,
    onViewChange: savePreferences,
  });

  function savePreferences() {
    preferenceStore.write({
      arrival: arrival.value,
      departure: departure.value,
      name: state.selectedName,
      selected: state.selected,
      zoom: map.getView(),
    });
  }

  function renderSelection() {
    map.setSelection({ selected: state.selected, selectedName: state.selectedName });
    renderDetails(detail, { ...dataset, ...state, onSegmentSelect: selectSegment });
  }

  function selectSegment(index) {
    state.selected = index;
    if (index !== null) state.selectedName = roads[index].properties.nameIndex;
    if (state.selectedName !== null) search.value = names[state.selectedName];
    renderSelection();
    savePreferences();
  }

  function recalculate({ persist = false } = {}) {
    state.from = parseWall(arrival.value);
    state.until = parseWall(departure.value);
    state.valid = Number.isFinite(state.from) && Number.isFinite(state.until)
      && state.until > state.from && state.until - state.from <= 366 * DAY;
    error.hidden = state.valid;
    error.textContent = state.valid ? '' : 'Inserisci arrivo e partenza validi, '
      + 'con partenza successiva all’arrivo ed entro 366 giorni.';
    if (state.valid) {
      state.analysis = schedules.map(schedule => analyzeSchedule(schedule, state.from, state.until));
      state.statuses = roads.map(road => statusForRoad(road.properties.schedule, state.analysis));
    } else {
      state.analysis = [];
      state.statuses = null;
    }
    renderStatusSummary(result, state.statuses, roads.length);
    map.setStatuses(state.statuses);
    renderSelection();
    if (persist) savePreferences();
  }

  function findStreet(event) {
    event.preventDefault();
    const term = normalizeStreetName(search.value);
    if (!term) return;
    const matches = findStreetMatches(search.value, names);
    const exact = matches.find(item => normalizeStreetName(item.name) === term);
    if (!exact && matches.length !== 1) {
      result.textContent = matches.length
        ? `${matches.length} strade corrispondenti · scegli il nome completo dai suggerimenti`
        : 'Nessuna strada trovata nel dataset';
      return;
    }
    state.selectedName = (exact || matches[0]).index;
    state.selected = null;
    search.value = names[state.selectedName];
    renderStatusSummary(result, state.statuses, roads.length);
    map.fitRoads(byName.get(state.selectedName));
    renderSelection();
    savePreferences();
  }

  query('[data-search-form]').addEventListener('submit', findStreet);
  arrival.addEventListener('change', () => recalculate({ persist: true }));
  departure.addEventListener('change', () => recalculate({ persist: true }));
  query('[data-zoom-in]').addEventListener('click', () => { map.zoomBy(1.6); savePreferences(); });
  query('[data-zoom-out]').addEventListener('click', () => { map.zoomBy(1 / 1.6); savePreferences(); });
  query('[data-home]').addEventListener('click', () => {
    state.selected = null;
    state.selectedName = null;
    search.value = '';
    map.reset();
    renderStatusSummary(result, state.statuses, roads.length);
    renderSelection();
    savePreferences();
  });

  controls.disabled = false;
  root.querySelectorAll('[data-zoom-in], [data-zoom-out], [data-home]').forEach(button => { button.disabled = false; });
  recalculate();
  if (saved?.zoom?.center) {
    map.restoreView(saved.zoom);
  } else if (saved?.zoom && state.selectedName !== null) {
    // The old export stored pixel offsets without the viewport's geographic
    // centre. Fit its selected street once when migrating to the new layout.
    map.fitRoads(byName.get(state.selectedName));
  } else if (saved?.zoom) {
    map.restoreView(saved.zoom);
  }
  root.setAttribute('aria-busy', 'false');
}

main().catch(error => {
  const message = root.querySelector('[data-error]');
  message.hidden = false;
  message.textContent = `${error.message} Ricarica la pagina per riprovare.`;
  root.querySelector('[data-result]').textContent = 'Mappa non disponibile';
  root.setAttribute('aria-busy', 'false');
});
