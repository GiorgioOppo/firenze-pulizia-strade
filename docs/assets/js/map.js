/**
 * Draw the map and own its pan/zoom state. Calendar analysis and interface
 * controls live in separate modules; this module only receives their results.
 */
export function createMap({ root, roads, base, onSelect, onViewChange }) {
  const d3 = globalThis.d3;
  if (!d3) throw new Error('Impossibile caricare la libreria della mappa.');

  const container = root.querySelector('.fl-map');
  const svgElement = container?.querySelector('svg');
  if (!svgElement) throw new Error('Contenitore della mappa non trovato.');

  const svg = d3.select(svgElement);
  const map = svg.append('g');
  const districtLayer = map.append('g');
  const riverLayer = map.append('g');
  const roadLayer = map.append('g');
  const riskLayer = map.append('g');
  const checkLayer = map.append('g');
  const highlights = map.append('g');
  const labels = svg.append('g').attr('pointer-events', 'none');
  const projection = d3.geoMercator();
  const path = d3.geoPath(projection);
  const collection = featureCollection(roads);
  const roadsByIndex = new Map(roads.map(road => [road.properties.index, road]));
  const roadsByName = new Map();
  const roadCentres = new Map();

  for (const road of roads) {
    const nameIndex = road.properties.nameIndex;
    if (!roadsByName.has(nameIndex)) roadsByName.set(nameIndex, []);
    roadsByName.get(nameIndex).push(road);
    roadCentres.set(road, d3.geoCentroid(road));
  }

  let width = 0;
  let height = 0;
  let transform = d3.zoomIdentity;
  let selected = null;
  let selectedName = null;
  let statuses = null;
  let projectedRoads = [];
  let pendingView = null;
  let pendingFit = null;
  let destroyed = false;

  const zoom = d3.zoom()
    .scaleExtent([1, 35])
    .extent(() => [[0, 0], [width, height]])
    .on('zoom.map', event => {
      transform = event.transform;
      map.attr('transform', transform);
      drawLabels();
    })
    .on('end.map', event => {
      // Restoring state, resizing and fitting a search result also use
      // zoom.transform, but must not feed state changes back into the app.
      if (event.sourceEvent && !destroyed) onViewChange?.(getView());
    });

  svg.call(zoom).on('dblclick.zoom', null).on('click.pick', pickRoad);

  function featureCollection(features) {
    return { type: 'FeatureCollection', features };
  }

  function selectedRoads() {
    return selectedName === null ? [] : roadsByName.get(selectedName) || [];
  }

  function drawStatusLayers() {
    for (const [layer, status, className] of [
      [riskLayer, 2, 'fl-risk'],
      [checkLayer, 1, 'fl-check'],
    ]) {
      const features = statuses
        ? roads.filter(road => statuses[road.properties.index] === status)
        : [];
      layer.selectAll('path')
        .data([featureCollection(features)])
        .join('path')
        .attr('class', className)
        .attr('d', path);
    }
  }

  function drawHighlights() {
    highlights.selectAll('path').remove();
    const features = selectedRoads();
    const picked = roadsByIndex.get(selected);

    if (features.length) {
      highlights.append('path')
        .attr('class', 'fl-highlight')
        .attr('d', path(featureCollection(features)));
    }
    if (picked) {
      highlights.append('path')
        .attr('class', 'fl-picked')
        .attr('d', path(picked));
    }

    // Draw the status last so a thick selection outline cannot conceal a
    // washing restriction or a schedule that still needs to be checked.
    if (statuses) {
      const marked = picked && !features.includes(picked)
        ? [...features, picked]
        : features;
      for (const [status, className] of [[2, 'fl-risk'], [1, 'fl-check']]) {
        highlights.append('path')
          .attr('class', className)
          .attr('d', path(featureCollection(
            marked.filter(road => statuses[road.properties.index] === status),
          )));
      }
    }
  }

  function streetLabel(name) {
    return name.replace(/^VIALE /, 'V.le ').replace(/^VIA /, 'Via ');
  }

  function drawLabels() {
    labels.selectAll('*').remove();
    if (!width || !height || destroyed) return;
    const used = [];

    function addLabel(text, coordinates, className = '') {
      if (!coordinates?.every(Number.isFinite)) return;
      let [x, y] = transform.apply(projection(coordinates));
      if (x < 25 || x > width - 25 || y < 55 || y > height - 18) return;

      const label = labels.append('text')
        .attr('x', x)
        .attr('y', y)
        .attr('text-anchor', 'middle')
        .attr('class', className)
        .text(text);
      let bounds = label.node().getBBox();
      if (bounds.width > width - 12) {
        label.remove();
        return;
      }

      x = Math.max(bounds.width / 2 + 6, Math.min(width - bounds.width / 2 - 6, x));
      label.attr('x', x);
      bounds = label.node().getBBox();
      const overlaps = used.some(previous =>
        bounds.x < previous.x + previous.width + 8
        && bounds.x + bounds.width + 8 > previous.x
        && bounds.y < previous.y + previous.height + 5
        && bounds.y + bounds.height + 5 > previous.y);
      if (overlaps) label.remove();
      else used.push({
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
      });
    }

    const picked = roadsByIndex.get(selected) || selectedRoads()[0];
    if (picked) {
      addLabel(streetLabel(picked.properties.name), roadCentres.get(picked), 'fl-street');
    }
    for (const label of base.labels || []) addLabel(label.name, label.coordinates);

    if (transform.k > 2.5) {
      const seen = new Set(picked ? [picked.properties.name] : []);
      for (const road of roads) {
        if (seen.has(road.properties.name)) continue;
        const centre = roadCentres.get(road);
        const [x, y] = transform.apply(projection(centre));
        if (x <= 30 || x >= width - 30 || y <= 60 || y >= height - 20) continue;
        seen.add(road.properties.name);
        addLabel(streetLabel(road.properties.name), centre, 'fl-street');
        if (used.length > 15) break;
      }
    }
    drawScale();
  }

  function drawScale() {
    const centre = projection.invert(transform.invert([width / 2, height / 2]));
    if (!centre?.every(Number.isFinite)) return;
    const east = [centre[0] + 0.01, centre[1]];
    const pixels = Math.abs(projection(east)[0] - projection(centre)[0]) * transform.k;
    const metres = 111320 * Math.cos(centre[1] * Math.PI / 180) * 0.01;
    const scaleMetres = transform.k > 5 ? 200 : transform.k > 2 ? 500 : 1000;
    const label = root.querySelector('[data-scale]');
    const bar = root.querySelector('[data-scale-bar]');
    if (label) label.textContent = scaleMetres === 1000 ? '1 km' : `${scaleMetres} m`;
    if (bar) bar.style.width = `${scaleMetres / metres * pixels}px`;
  }

  function render() {
    if (destroyed) return;
    const nextWidth = container.clientWidth;
    const nextHeight = Number.parseFloat(getComputedStyle(svgElement).height) || 490;
    if (!nextWidth || !nextHeight) return;
    if (nextWidth === width && nextHeight === height) return;

    // Keep the geographic centre through responsive layout changes. Merely
    // scaling x/y loses the focused street when the map aspect ratio changes.
    const centre = width && height
      ? projection.invert(transform.invert([width / 2, height / 2]))
      : null;
    width = nextWidth;
    height = nextHeight;
    svg.attr('viewBox', `0 0 ${width} ${height}`);
    const boundary = base.districts?.features?.length ? base.districts : collection;
    projection.fitExtent([[15, 20], [width - 15, height - 20]], boundary);

    districtLayer.selectAll('path')
      .data(base.districts?.features || [])
      .join('path')
      .attr('class', 'fl-district')
      .attr('d', path);
    riverLayer.selectAll('path')
      .data(base.river?.features || [])
      .join('path')
      .attr('class', 'fl-river')
      .attr('d', path);
    roadLayer.selectAll('path')
      .data([collection])
      .join('path')
      .attr('class', 'fl-road')
      .attr('d', path);

    projectedRoads = roads.map(road => ({
      index: road.properties.index,
      lines: (road.geometry.type === 'MultiLineString'
        ? road.geometry.coordinates
        : [road.geometry.coordinates]).map(line => line.map(projection)),
    }));
    drawStatusLayers();
    drawHighlights();

    if (pendingView) {
      const view = pendingView;
      pendingView = null;
      restoreView(view);
    } else if (pendingFit) {
      const features = pendingFit;
      pendingFit = null;
      fitRoads(features);
    } else if (centre?.every(Number.isFinite)) {
      const [x, y] = projection(centre);
      svg.call(zoom.transform, d3.zoomIdentity
        .translate(width / 2 - transform.k * x, height / 2 - transform.k * y)
        .scale(transform.k));
    } else {
      svg.call(zoom.transform, d3.zoomIdentity);
    }
  }

  function distanceSquared(point, start, end) {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const fraction = Math.max(0, Math.min(1,
      ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy)
      / (dx * dx + dy * dy || 1)));
    return (point[0] - start[0] - fraction * dx) ** 2
      + (point[1] - start[1] - fraction * dy) ** 2;
  }

  function pickRoad(event) {
    if (event.defaultPrevented || destroyed) return;
    const point = transform.invert(d3.pointer(event, svgElement));
    let best = (14 / transform.k) ** 2;
    let index = null;
    for (const road of projectedRoads) {
      for (const line of road.lines) {
        for (let i = 1; i < line.length; i++) {
          const distance = distanceSquared(point, line[i - 1], line[i]);
          if (distance < best) {
            best = distance;
            index = road.index;
          }
        }
      }
    }
    if (index !== null) onSelect?.(index);
  }

  function setStatuses(nextStatuses) {
    if (destroyed) return;
    statuses = nextStatuses ?? null;
    drawStatusLayers();
    drawHighlights();
  }

  function setSelection(selection) {
    if (destroyed) return;
    selected = selection.selected ?? null;
    selectedName = selection.selectedName ?? null;
    drawHighlights();
    drawLabels();
  }

  function fitRoads(features) {
    if (destroyed || !features?.length) return;
    if (!width || !height) {
      pendingFit = features;
      pendingView = null;
      return;
    }
    const [[left, top], [right, bottom]] = path.bounds(featureCollection(features));
    if (![left, top, right, bottom].every(Number.isFinite)) return;
    const k = Math.max(1, Math.min(26,
      0.72 / Math.max((right - left) / width, (bottom - top) / height, 0.025)));
    const x = (left + right) / 2;
    const y = (top + bottom) / 2;
    svg.call(zoom.transform, d3.zoomIdentity
      .translate(width / 2 - k * x, height / 2 - k * y)
      .scale(k));
  }

  function reset() {
    if (destroyed) return;
    pendingFit = null;
    pendingView = null;
    svg.call(zoom.transform, d3.zoomIdentity);
  }

  function zoomBy(factor) {
    if (destroyed || !width || !Number.isFinite(factor) || factor <= 0) return;
    svg.call(zoom.scaleBy, factor);
  }

  function getView() {
    const view = {
      k: transform.k,
      x: width ? transform.x / width : 0,
      y: height ? transform.y / height : 0,
    };
    if (width && height) {
      const centre = projection.invert(transform.invert([width / 2, height / 2]));
      if (validCentre(centre)) view.center = centre;
    }
    return view;
  }

  function validCentre(value) {
    return Array.isArray(value) && value.length === 2
      && value.every(Number.isFinite)
      && Math.abs(value[0]) <= 180 && Math.abs(value[1]) < 90;
  }

  function restoreView(view) {
    if (destroyed || !view) return;
    const normalized = {
      k: Math.max(1, Math.min(35, Number(view.k) || 1)),
      x: Number.isFinite(Number(view.x)) ? Number(view.x) : 0,
      y: Number.isFinite(Number(view.y)) ? Number(view.y) : 0,
    };
    if (validCentre(view.center)) normalized.center = [...view.center];
    if (!width || !height) {
      pendingView = normalized;
      pendingFit = null;
      return;
    }
    // Geographic coordinates survive a reload at another viewport size;
    // normalized translations are retained for older saved preferences.
    const point = normalized.center ? projection(normalized.center) : null;
    const x = point ? width / 2 - normalized.k * point[0] : normalized.x * width;
    const y = point ? height / 2 - normalized.k * point[1] : normalized.y * height;
    svg.call(zoom.transform, d3.zoomIdentity.translate(x, y).scale(normalized.k));
  }

  const resizeObserver = new ResizeObserver(render);
  resizeObserver.observe(container);
  render();

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    resizeObserver.disconnect();
    svg.interrupt().on('.zoom', null).on('.pick', null);
    zoom.on('.map', null);
    map.remove();
    labels.remove();
    pendingFit = null;
    pendingView = null;
    projectedRoads = [];
  }

  return {
    setStatuses,
    setSelection,
    fitRoads,
    reset,
    zoomBy,
    getView,
    restoreView,
    destroy,
  };
}
