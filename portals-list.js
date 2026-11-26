// @author         teo96
// @modifier       Takurua(@yuehuTi)
// @name           Portals list
// @category       Info
// @version        0.5.46
// @description    Show faction statistics and a sortable portal list for the current view.

/* exported setup, changelog --eslint */
/* global IITC -- eslint */

var changelog = [
  {
    version: '0.5.46',
    changes: ['Fetch full portal details for all selected portals before CSV export'],
  },
  {
    version: '0.5.45',
    changes: ['Avoid duplicate OK/确定 buttons on the CSV export dialog'],
  },
  {
    version: '0.5.44',
    changes: ['Trim unused helpers, merge pie/metric helpers, and shrink the changelog'],
  },
  {
    version: '0.5.43',
    changes: ['Add a Guid column as the second CSV export column'],
  },
  {
    version: '0.5.42',
    changes: ['Keep Cap/Visit/Un visit/Scout/Un scout labels in English'],
  },
  {
    version: '0.5.41',
    changes: ['Keep Portals list entry, Visit/Cap·Scout pie title, table and CSV headers in English'],
  },
  {
    version: '0.5.40',
    changes: ['Localize buttons, titles and UI copy for Chinese or English system language'],
  },
];

window.plugin.portalslist = function () {};

var USE_ZH = (navigator.languages && navigator.languages.length
  ? navigator.languages
  : [navigator.language || navigator.userLanguage || ''])
  .some(function (lang) { return /^zh\b/i.test(lang || ''); });

var I18N_EN = {
  portalsCount: 'Portals: {n} {unit}',
  portalUnit: 'portal',
  portalsUnit: 'portals',
  onlyInPolygons: ' Only In Polygons',
  onlyInPolygonsTip: 'Show only portals inside polygons drawn with Draw tools',
  stats: 'Statistics',
  details: 'Details',
  bookmark: 'Bookmark',
  bookmarkTip: 'Add selected portals to Bookmarks',
  addMarker: 'Add Marker',
  addMarkerTip: 'Add Draw tools markers for selected portals',
  exportCsv: 'Export CSV',
  exportCsvTip: 'Export selected portals as CSV',
  saveToFile: 'Save to file',
  ok: 'OK',
  selectFirst: 'Select portals first',
  needBookmarks: 'Enable the Bookmarks plugin first',
  needDrawTools: 'Enable the Draw tools plugin first',
  nothingToShow: 'Nothing to show!',
  help: 'Help',
  helpBody: '<p>Click table headers to sort.</p><p>Click a pie legend to filter that group; click again to clear.</p>',
  selectAllTip: 'Select / deselect all in the current list',
  loadingDetails: 'Loading occupied portal details {cur}/{total}',
  filterTip: 'Show only {label} portals',
  faction: 'Faction',
  levelPie: 'Level',
};
var I18N_ZH = {
  portalsCount: 'Portal：{n} 个',
  onlyInPolygons: ' 仅多边形内',
  onlyInPolygonsTip: '只显示 Draw tools 多边形内的Portal',
  stats: '统计',
  details: '详细数据',
  bookmark: '收藏',
  bookmarkTip: '将勾选的Portal加入 Bookmarks',
  addMarker: '增加 Marker',
  addMarkerTip: '在 Draw tools 中为勾选的Portal添加 marker',
  exportCsv: '导出 CSV',
  exportCsvTip: '导出勾选的Portal为 CSV',
  saveToFile: '保存到文件',
  ok: 'OK',
  selectFirst: '请先勾选要操作的Portal',
  needBookmarks: '需要先启用 Bookmarks 插件',
  needDrawTools: '需要先启用 Draw tools 插件',
  nothingToShow: '没有可显示的内容',
  help: '帮助',
  helpBody: '<p>点击表头可排序。</p><p>点击饼图图例可筛选该分组，再点一次清除筛选。</p>',
  selectAllTip: '全选 / 取消全选当前列表',
  loadingDetails: '正在读取已占领Portal的详细信息 {cur}/{total}',
  filterTip: '只显示 {label} Portal',
  faction: '阵营',
  levelPie: '等级',
};

function t(key, vars) {
  var text = (USE_ZH && I18N_ZH[key] != null) ? I18N_ZH[key] : I18N_EN[key];
  if (text == null) return key;
  if (!vars) return text;
  return String(text).replace(/\{(\w+)\}/g, function (_, name) {
    return vars[name] == null ? '' : vars[name];
  });
}

function portalsCountTitle(count) {
  return t('portalsCount', {
    n: count,
    unit: count === 1 ? t('portalUnit') : t('portalsUnit'),
  });
}

function el(tag, className, text) {
  var node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function abbreviate(label) {
  return label.replaceAll(/[^a-z]/gi, '').substring(0, 3).capitalize();
}

function polygonTestFn() {
  return window.pnpoly || (window.IITC && window.IITC.utils && window.IITC.utils.isPointInPolygon);
}

function ringFromLayer(layer) {
  if (!(window.L && layer instanceof L.Polygon)) return null;
  var ring = layer._rings && layer._rings[0] && layer._rings[0].length ? layer._rings[0] : null;
  if (!ring && layer.getLatLngs) {
    var latlngs = layer.getLatLngs();
    var outer = latlngs && latlngs[0] && latlngs[0].lat == null ? latlngs[0] : latlngs;
    if (outer && outer.length && outer[0] && outer[0].lat != null) {
      ring = [];
      for (var i = 0; i < outer.length; i++) ring.push(window.map.latLngToLayerPoint(outer[i]));
    }
  }
  return ring && ring.length ? ring : null;
}

function collectPolygonRings() {
  var drawTools = window.plugin.drawTools;
  var rings = [];
  if (!drawTools || !drawTools.drawnItems || !polygonTestFn()) return rings;
  drawTools.drawnItems.eachLayer(function (layer) {
    var ring = ringFromLayer(layer);
    if (ring) rings.push(ring);
  });
  return rings;
}

function portalInsideDrawnPolygon(portal) {
  if (!portal || !portal.getLatLng) return false;
  var test = polygonTestFn();
  if (!test) return false;
  var rings = window.plugin.portalslist.polygonRings || collectPolygonRings();
  if (!rings.length) return false;
  var point = window.map.latLngToLayerPoint(portal.getLatLng());
  for (var i = 0; i < rings.length; i++) {
    if (test(rings[i], point)) return true;
  }
  return false;
}
window.plugin.portalslist.portalInsideDrawnPolygon = portalInsideDrawnPolygon;

function onlyInPolygonsControl() {
  var label = document.createElement('label');
  label.className = 'only-in-polygons';
  var box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = !!window.plugin.portalslist.onlyInPolygons;
  box.addEventListener('change', function () {
    window.plugin.portalslist.onlyInPolygons = box.checked;
    reloadPortalsInPlace();
  });
  var text = document.createElement('span');
  text.textContent = t('onlyInPolygons');
  text.title = t('onlyInPolygonsTip');
  label.appendChild(box);
  label.appendChild(text);
  return label;
}

function listShell(pies, body) {
  var container = $('<div>');
  container.append(onlyInPolygonsControl());
  container.append(sectionTitle(t('stats')));
  container.append(statsPies(pies));
  container.append(sectionTitle(t('details')));
  container.append(body);
  container.append(detailStatusNode());
  container.append(selectionActionsBar());
  return container;
}

var ROW_LEADING = 2; // checkbox + index

function selectionActionsBar() {
  var bar = document.createElement('div');
  bar.className = 'selection-actions';
  [
    { label: t('bookmark'), title: t('bookmarkTip'), action: bookmarkSelectedPortals },
    { label: t('addMarker'), title: t('addMarkerTip'), action: addDrawMarkersForSelected },
    { label: t('exportCsv'), title: t('exportCsvTip'), action: exportSelectedPortalsCsv },
  ].forEach(function (item) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = item.label;
    btn.title = item.title;
    btn.addEventListener('click', item.action);
    bar.appendChild(btn);
  });
  return bar;
}

function visibleListPortals() {
  return filteredListPortals().filter(function (obj) {
    return obj.row && obj.row.style.display !== 'none';
  });
}

function getSelectedPortalObjs() {
  return visibleListPortals().filter(function (obj) {
    var box = obj.row.querySelector('input.portal-select');
    return !!(box && box.checked);
  });
}

function syncSelectAllCheckbox() {
  var root = document.getElementById('portalslist');
  var master = root && root.querySelector('th.col-select input.select-all');
  if (!master) return;
  var visible = visibleListPortals();
  var checked = visible.filter(function (obj) {
    var box = obj.row.querySelector('input.portal-select');
    return box && box.checked;
  }).length;
  master.checked = visible.length > 0 && checked === visible.length;
  master.indeterminate = checked > 0 && checked < visible.length;
}

function setVisibleSelection(checked) {
  visibleListPortals().forEach(function (obj) {
    var box = obj.row.querySelector('input.portal-select');
    if (box) box.checked = checked;
  });
  syncSelectAllCheckbox();
}

function requireSelectedPortals() {
  var selected = getSelectedPortalObjs();
  if (!selected.length) {
    alert(t('selectFirst'));
    return null;
  }
  return selected;
}

function bookmarkSelectedPortals() {
  var selected = requireSelectedPortals();
  if (!selected) return;
  var bookmarks = window.plugin.bookmarks;
  if (!bookmarks || typeof bookmarks.addPortalBookmarkByMarker !== 'function') {
    alert(t('needBookmarks'));
    return;
  }
  var addedGuids = [];
  selected.forEach(function (obj) {
    var guid = obj.portal.options.guid;
    if (typeof bookmarks.findByGuid === 'function' && bookmarks.findByGuid(guid)) return;
    bookmarks.addPortalBookmarkByMarker(obj.portal, false);
    addedGuids.push(guid);
  });
  if (!addedGuids.length) return;
  if (typeof bookmarks.saveStorage === 'function') bookmarks.saveStorage();
  if (typeof bookmarks.refreshBkmrks === 'function') bookmarks.refreshBkmrks();
  addedGuids.forEach(function (guid) {
    window.runHooks('pluginBkmrksEdit', { target: 'portal', action: 'add', guid: guid });
  });
}

function addDrawMarkersForSelected() {
  var selected = requireSelectedPortals();
  if (!selected) return;
  var drawTools = window.plugin.drawTools;
  if (!drawTools || !drawTools.drawnItems || !window.L) {
    alert(t('needDrawTools'));
    return;
  }
  var opts = L.extend({}, drawTools.markerOptions || {});
  selected.forEach(function (obj) {
    var marker = L.marker(obj.portal.getLatLng(), opts);
    drawTools.drawnItems.addLayer(marker);
    if (typeof window.registerMarkerForOMS === 'function') window.registerMarkerForOMS(marker);
    window.runHooks('pluginDrawTools', { event: 'layerCreated', layer: marker });
  });
  if (typeof drawTools.save === 'function') drawTools.save();
}

function csvEscape(value) {
  var text = value == null ? '' : String(value);
  if (/[",\n\r]/.test(text)) return '"' + text.replace(/"/g, '""') + '"';
  return text;
}

function csvFieldValue(field, portal) {
  var value = field.value(portal);
  if (field.title === 'Links' && value && value.in && value.out) return value.in.length + value.out.length;
  if (field.title === 'AP' && value && typeof value === 'object') return value.enemyAp;
  if (field.title === 'Resonators' && Array.isArray(value)) {
    return value.map(function (reso) { return reso.level || 0; }).join(' ');
  }
  if (field.title === 'Mods' && Array.isArray(value)) return value.map(modLabel).join(' ');
  if (field.title === 'V/C') return value === 2 ? 'Cap' : value === 1 ? 'Visited' : '';
  if (field.title === 'S') return value === 1 ? 'Scout' : '';
  return value == null ? '' : value;
}

function whenDetailRequestSettles(request, done) {
  if (request && typeof request.always === 'function') request.always(done);
  else if (request && typeof request.then === 'function') request.then(done, done);
  else done();
}

function stopBackgroundDetailLoading() {
  var ns = window.plugin.portalslist;
  ns.detailLoadGeneration = (ns.detailLoadGeneration || 0) + 1;
  if (ns.detailTimer) {
    clearTimeout(ns.detailTimer);
    ns.detailTimer = null;
  }
  ns.detailStreaming = false;
  ns.detailQueue = null;
  ns.detailQueueIndex = 0;
}

function loadDetailsForGuids(guids, onProgress, onDone) {
  var index = 0;
  var total = guids.length;
  function step() {
    if (index >= total) {
      if (onDone) onDone();
      return;
    }
    var guid = guids[index];
    index += 1;
    if (onProgress) onProgress(index, total);
    var request = null;
    try {
      request = window.portalDetail.request(guid);
    } catch (err) { /* ignore */ }
    whenDetailRequestSettles(request, function () {
      mergeFreshDetails(guid);
      repaintDetailGuid(guid);
      window.setTimeout(step, 10);
    });
  }
  step();
}

function buildCsvText(selected) {
  var fields = window.plugin.portalslist.fields;
  var headers = ['#', 'Guid'].concat(fields.map(function (field) { return field.title; }));
  var lines = [headers.map(csvEscape).join(',')];
  selected.forEach(function (obj, index) {
    var portal = obj.portal;
    var row = [String(index + 1), portal.options.guid || ''];
    fields.forEach(function (field) {
      row.push(csvFieldValue(field, portal));
    });
    lines.push(row.map(csvEscape).join(','));
  });
  return lines.join('\n');
}

function showCsvExportDialog(selected) {
  var area = document.createElement('textarea');
  area.className = 'portalslist-csv-export';
  area.value = buildCsvText(selected);
  area.readOnly = true;
  var saveLabel = t('saveToFile');
  var okLabel = t('ok');
  function saveCsvFile() {
    var payload = '\ufeff' + area.value;
    if (typeof window.saveFile === 'function') {
      window.saveFile(payload, 'portals-list.csv', 'text/csv');
      return;
    }
    var blob = new Blob([payload], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'portals-list.csv';
    link.click();
    URL.revokeObjectURL(url);
  }
  function fitCsvTextarea(content) {
    var node = content && (content.jquery ? content[0] : content);
    if (!node) return;
    var style = window.getComputedStyle(node);
    var padY = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
    // Keep clear of the button pane: size to content box only, with a small safety gap.
    var height = Math.max(120, node.clientHeight - padY - 8);
    area.style.height = height + 'px';
    area.style.width = '100%';
  }
  // IITC dialog deep-merges buttons with a default OK; keep that key and only relabel it.
  var buttons = {
    OK: function () {
      $(this).dialog('close');
    },
  };
  buttons[saveLabel] = saveCsvFile;
  window.dialog({
    title: 'Export CSV (copyable)',
    id: 'portalslist-csv-export',
    dialogClass: 'ui-dialog-portalslist-csv',
    html: area,
    width: Math.min(window.innerWidth - 40, 720),
    height: Math.min(window.innerHeight - 48, 520),
    minHeight: 280,
    buttons: buttons,
    resize: function () {
      fitCsvTextarea(this);
    },
    resizeStop: function () {
      fitCsvTextarea(this);
    },
    focusCallback: function () {
      var buttonset = $(this).closest('.ui-dialog').find('.ui-dialog-buttonset');
      buttonset.children('.ui-button').each(function () {
        var $btn = $(this);
        var $text = $btn.find('.ui-button-text');
        var label = ($text.length ? $text : $btn).text();
        if (label === 'OK' && okLabel !== 'OK') {
          ($text.length ? $text : $btn).text(okLabel);
        }
      });
      var saveBtn = buttonset.children('.ui-button').filter(function () {
        var $btn = $(this);
        var $text = $btn.find('.ui-button-text');
        return ($text.length ? $text : $btn).text() === saveLabel;
      });
      if (saveBtn.length) buttonset.prepend(saveBtn);
      fitCsvTextarea(this);
      area.focus();
      area.select();
    },
  });
}

function exportSelectedPortalsCsv() {
  var selected = requireSelectedPortals();
  if (!selected) return;
  if (!window.portalDetail || typeof window.portalDetail.request !== 'function') {
    showCsvExportDialog(selected);
    return;
  }

  var needGuids = [];
  selected.forEach(function (obj) {
    var portal = obj.portal;
    var guid = portal.options.guid;
    if (!guid) return;
    if (applyCachedDetails(portal)) {
      repaintDetailGuid(guid);
      return;
    }
    needGuids.push(guid);
  });

  function openExport() {
    selected.forEach(function (obj) {
      var fresh = window.portals[obj.portal.options.guid];
      if (fresh) obj.portal = fresh;
    });
    setDetailStatus('');
    showCsvExportDialog(selected);
    scheduleLoadOccupiedPortalDetails();
  }

  if (!needGuids.length) {
    openExport();
    return;
  }

  stopBackgroundDetailLoading();
  setDetailStatus(t('loadingDetails', { cur: 0, total: needGuids.length }));
  loadDetailsForGuids(needGuids, function (cur, total) {
    setDetailStatus(t('loadingDetails', { cur: cur, total: total }));
  }, openExport);
}

function portalsListBody() {
  if (getPortals()) {
    return portalTable(
      window.plugin.portalslist.sortBy,
      window.plugin.portalslist.sortOrder,
      window.plugin.portalslist.filter
    );
  }
  return listShell([], $('<table class="noPortals"><tr><td>' + t('nothingToShow') + '</td></tr></table>'));
}

// fields: { title, value(portal), sortValue?, sort?, format?, defaultOrder? }
var RESO_XM = [0, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000];
var MOD_CHIP_COLOR = { COMMON: '#0d7a45', RARE: '#1d4e9e', VERY_RARE: '#6a3db8' };
var NEUTRAL_COLOR = '#666666';

function isShieldMod(mod) {
  if (!mod) return false;
  if (mod.stats && mod.stats.MITIGATION) return true;
  return /shield/i.test(mod.name || '');
}

function shieldLabel(mod) {
  var mit = mod.stats && mod.stats.MITIGATION ? String(mod.stats.MITIGATION) : '';
  if (/aegis/i.test(mod.name || '')) return 'Aegis' + mit;
  var rarity = mod.rarity || '';
  var prefix = rarity === 'VERY_RARE' ? 'VR' : rarity === 'RARE' ? 'R' : rarity === 'COMMON' ? 'C' : '';
  return prefix + mit || mod.name || '?';
}

function modLabel(mod) {
  if (isShieldMod(mod)) return shieldLabel(mod);
  var name = (mod.name || '').toLowerCase();
  if (name.indexOf('force amp') >= 0) return 'FA';
  if (name.indexOf('turret') >= 0) return 'Turret';
  if (name.indexOf('heat sink') >= 0) return 'HS';
  if (name.indexOf('multi') >= 0) return 'MH';
  if (name.indexOf('softbank') >= 0) return 'SBUL';
  if (name.indexOf('ultra') >= 0 && name.indexOf('link') >= 0) return 'UL';
  if (name.indexOf('link amp') >= 0) return 'LA';
  if (name.indexOf('transmuter') >= 0 && name.indexOf('attack') >= 0) return '-ATK';
  if (name.indexOf('transmuter') >= 0 && name.indexOf('defense') >= 0) return '+DEF';
  if (name.indexOf('ito') >= 0) return 'ITO';
  return mod.name || '?';
}

function shieldMitigationTotal(mods) {
  return mods.reduce(function (sum, mod) {
    if (!isShieldMod(mod)) return sum;
    return sum + (parseInt(mod.stats && mod.stats.MITIGATION, 10) || 0);
  }, 0);
}

function modTooltip(mod) {
  var lines = [];
  var name = mod.name || 'mod';
  if (mod.rarity) name = String(mod.rarity).replace(/_/g, ' ') + ' ' + name;
  lines.push(name);
  if (mod.owner) lines.push(mod.owner);
  if (mod.stats) {
    Object.keys(mod.stats).forEach(function (key) {
      if (key === 'REMOVAL_STICKINESS') return;
      lines.push(key + ' ' + mod.stats[key]);
    });
  }
  return lines.join('\n');
}

function appendGearChip(cell, text, background, title, lightText) {
  var chip = document.createElement('span');
  chip.className = 'gear-chip';
  chip.textContent = text;
  if (background) chip.style.backgroundColor = background;
  chip.style.color = lightText ? '#111' : '#fff';
  if (title) chip.title = title;
  cell.appendChild(chip);
}

function formatGearCell(cell, mods, labeler) {
  cell.className = 'equip';
  if (!mods.length) {
    cell.textContent = '-';
    return;
  }
  mods.forEach(function (mod) {
    var rarity = mod.rarity || '';
    var background = MOD_CHIP_COLOR[rarity] || '#355';
    appendGearChip(cell, labeler(mod), background, modTooltip(mod), false);
  });
}

function formatResonatorCell(cell, list) {
  if (!list) return;
  cell.className = 'equip';
  if (!list.length) {
    cell.textContent = '-';
    return;
  }
  var ordered = list.slice().sort(function (a, b) {
    return b.level - a.level;
  });
  ordered.forEach(function (reso) {
    var level = parseInt(reso.level, 10) || 0;
    var background = (window.COLORS_LVL && window.COLORS_LVL[level]) || '#333';
    var max = RESO_XM[level] || 0;
    var pct = max && reso.energy != null ? ' ' + Math.round((reso.energy / max) * 100) + '%' : '';
    var title = 'L' + level + (reso.owner ? ' ' + reso.owner : '') + pct;
    appendGearChip(cell, String(level), background, title, level > 0 && level <= 2);
  });
}

function gearSignature(list, pick) {
  if (!list) return '';
  return list
    .map(function (item) {
      return item ? pick(item) : '-';
    })
    .join(',');
}

window.plugin.portalslist.fields = [
  {
    title: 'Portal Name',
    value: function (portal) {
      return portal.options.data.title;
    },
    sortValue: function (value) {
      return value.toLowerCase();
    },
    format: function (cell, portal) {
      $(cell).append(window.plugin.portalslist.getPortalLink(portal)).addClass('portalTitle');
    },
  },
  {
    title: 'Level',
    value: function (portal) {
      return portalLevelOf(portal);
    },
    format: function (cell, portal, value) {
      var color = value === 0
        ? NEUTRAL_COLOR
        : (window.COLORS_LVL && window.COLORS_LVL[value]) || NEUTRAL_COLOR;
      $(cell).css('background-color', color).text('L' + value);
    },
    defaultOrder: -1,
  },
  {
    title: 'Team',
    value: function (portal) {
      return portal.options.team;
    },
    format: function (cell, portal, value) {
      $(cell).text(window.plugin.portalslist.FACTION_ABBREVS[value]);
    },
  },
  {
    title: 'Health',
    value: function (portal) {
      return portal.options.data.health;
    },
    sortValue: function (value, portal) {
      return portal.options.team === window.TEAM_NONE ? -1 : value;
    },
    format: function (cell, portal, value) {
      $(cell)
        .addClass('alignR')
        .text(portal.options.team === window.TEAM_NONE ? '-' : value + '%');
    },
    defaultOrder: -1,
  },
  {
    title: 'Res',
    value: function (portal) {
      return portal.options.data.resCount;
    },
    format: function (cell, portal, value) {
      $(cell).addClass('alignR').text(value);
    },
    defaultOrder: -1,
  },
  {
    title: 'Resonators',
    value: function (portal) {
      var data = portal.options.data || {};
      if (!data.resonators) return null;
      return data.resonators.filter(function (reso) {
        return reso && reso.level;
      });
    },
    sortValue: function (value) {
      if (!value) return -1;
      return value.reduce(function (sum, reso) {
        return sum + (parseInt(reso.level, 10) || 0);
      }, 0);
    },
    format: function (cell, portal, value) {
      formatResonatorCell(cell, value);
    },
    defaultOrder: -1,
  },
  {
    title: 'Shields',
    value: function (portal) {
      var data = portal.options.data || {};
      if (!data.mods) return null;
      return shieldMitigationTotal(data.mods.filter(Boolean));
    },
    sortValue: function (value) {
      return value == null ? -1 : value;
    },
    format: function (cell, portal, value) {
      if (value == null) return;
      $(cell).addClass('alignR').text(value ? String(value) : '-');
    },
    defaultOrder: -1,
  },
  {
    title: 'Mods',
    value: function (portal) {
      var data = portal.options.data || {};
      if (!data.mods) return null;
      return data.mods.filter(Boolean);
    },
    sortValue: function (value) {
      return value ? value.length : -1;
    },
    format: function (cell, portal, value) {
      if (value == null) return;
      formatGearCell(cell, value, modLabel);
    },
    defaultOrder: -1,
  },
  {
    title: 'Owner',
    value: function (portal) {
      var data = portal.options.data || {};
      if (!data.resonators && !data.mods && (data.owner === undefined || data.owner === null)) return null;
      return data.owner || '';
    },
    sortValue: function (value) {
      return value ? String(value).toLowerCase() : '';
    },
    format: function (cell, portal, value) {
      if (value == null) return;
      cell.textContent = value || '-';
    },
  },
  {
    title: 'Links',
    value: function (portal) {
      return portalLinks(portal.options.guid);
    },
    sortValue: function (value) {
      return value.in.length + value.out.length;
    },
    format: function (cell, portal, value) {
      $(cell)
        .addClass('alignR')
        .addClass('help')
        .attr('title', 'In:\t' + value.in.length + '\nOut:\t' + value.out.length)
        .text(value.in.length + value.out.length);
    },
    defaultOrder: -1,
  },
  {
    title: 'Fields',
    value: function (portal) {
      return portalFieldCount(portal.options.guid);
    },
    format: function (cell, portal, value) {
      $(cell).addClass('alignR').text(value);
    },
    defaultOrder: -1,
  },
  {
    title: 'AP',
    value: function (portal) {
      var links = portalLinks(portal.options.guid);
      var fields = portalFieldCount(portal.options.guid);
      return window.plugin.portalslist.portalApGainMaths(portal.options.data.resCount, links.in.length + links.out.length, fields);
    },
    sortValue: function (value) {
      return value.enemyAp;
    },
    format: function (cell, portal, value) {
      var title = '';
      if (window.teamStringToId(window.PLAYER.team) === portal.options.team) {
        title += `Friendly AP:\t${value.friendlyAp}\n- deploy ${8 - portal.options.data.resCount} resonator(s)\n- upgrades/mods unknown\n`;
      }
      title += `Enemy AP:\t${value.enemyAp}\n- Destroy AP:\t${value.destroyAp}\n- Capture AP:\t${value.captureAp}`;

      $(cell).addClass('alignR').addClass('help').prop('title', title).html(window.digits(value.enemyAp));
    },
    defaultOrder: -1,
  },
  {
    title: 'V/C',
    value: function (portal) {
      var history = portal.options.data.history;
      if (history) {
        return history.captured ? 2 : history.visited ? 1 : 0;
      }
      return -1;
    },
    format: function (cell, portal, value) {
      if (value === -1) {
        return;
      }
      $(cell).addClass('history ' + ['unvisited', 'visited', 'captured'][value]);
      if (value === 1) cell.textContent = 'Visited';
      else if (value === 2) cell.textContent = 'Cap';
    },
  },
  {
    title: 'S',
    value: function (portal) {
      var history = portal.options.data.history;
      if (history) {
        return history.scoutControlled ? 1 : 0;
      }
      return -1;
    },
    format: function (cell, portal, value) {
      cell.classList.add('col-s');
      if (value === -1) {
        return;
      }
      $(cell).addClass('history ' + ['unvisited', 'scoutControlled'][value]);
      if (value === 1) cell.textContent = 'Scout';
    },
  },
];

function cachedPortalMetric(cacheName, guid, getter) {
  var cache = window.plugin.portalslist[cacheName];
  if (!cache) return getter(guid);
  if (guid in cache) return cache[guid];
  return (cache[guid] = getter(guid));
}

function portalLinks(guid) {
  return cachedPortalMetric('linkCache', guid, window.getPortalLinks);
}

function portalFieldCount(guid) {
  return cachedPortalMetric('fieldCache', guid, window.getPortalFieldsCount);
}

function withPortalMetricCache(fn) {
  var ns = window.plugin.portalslist;
  if (ns.linkCache && ns.fieldCache) return fn();
  var previousLinks = ns.linkCache;
  var previousFields = ns.fieldCache;
  if (!ns.linkCache) ns.linkCache = Object.create(null);
  if (!ns.fieldCache) ns.fieldCache = Object.create(null);
  try {
    return fn();
  } finally {
    ns.linkCache = previousLinks || null;
    ns.fieldCache = previousFields || null;
  }
}

function portalMetricSignature(portal) {
  var guid = portal.options.guid;
  var links = portalLinks(guid);
  var inbound = links && links.in ? links.in.length : 0;
  var outbound = links && links.out ? links.out.length : 0;
  return inbound + ':' + outbound + ':' + portalFieldCount(guid);
}

function paintCell(cell, field, portal, value) {
  cell.className = '';
  cell.removeAttribute('style');
  cell.removeAttribute('title');
  cell.textContent = '';
  if (field.format) field.format(cell, portal, value);
  else cell.textContent = value == null ? '' : value;
}

function rowMatchesFields(row) {
  var fields = window.plugin.portalslist.fields;
  return !!(row && fields && row.cells.length === fields.length + ROW_LEADING);
}

function createPortalRow(portal) {
  var row = document.createElement('tr');
  row.dataset.guid = portal.options.guid;
  var selectCell = row.insertCell(-1);
  selectCell.className = 'col-select';
  var box = document.createElement('input');
  box.type = 'checkbox';
  box.className = 'portal-select';
  box.addEventListener('click', function (event) {
    event.stopPropagation();
  });
  box.addEventListener('change', syncSelectAllCheckbox);
  selectCell.appendChild(box);
  var indexCell = row.insertCell(-1);
  indexCell.className = 'alignR';
  var count = window.plugin.portalslist.fields.length;
  for (var i = 0; i < count; i++) row.insertCell(-1);
  return { portal: portal, sortValues: [], row: row };
}

function fillPortalRow(obj) {
  var portal = obj.portal;
  var fields = window.plugin.portalslist.fields;
  var signature = portalDetailSignature(portal);
  var metrics = portalMetricSignature(portal);
  var dirty = obj.row.dataset.sig !== signature || obj.row.dataset.metrics !== metrics;
  obj.sortValues = [];
  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];
    var value = field.value(portal);
    obj.sortValues.push(field.sortValue ? field.sortValue(value, portal) : value);
    if (dirty) paintCell(obj.row.cells[i + ROW_LEADING], field, portal, value);
  }
  if (dirty) {
    obj.row.className = window.TEAM_TO_CSS[portal.options.team];
    obj.row.dataset.sig = signature;
    obj.row.dataset.metrics = metrics;
  }
  return dirty;
}

function getPortals(reuseRows) {
  var ns = window.plugin.portalslist;
  var found = false;
  var displayBounds = window.map.getBounds();
  var previous = reuseRows ? (ns.byGuid || {}) : {};

  ns.listPortals = [];
  ns.byGuid = Object.create(null);
  ns.linkCache = Object.create(null);
  ns.fieldCache = Object.create(null);
  if (ns.onlyInPolygons) ns.polygonRings = collectPolygonRings();

  try {
    $.each(window.portals, function (i, portal) {
      if (!displayBounds.contains(portal.getLatLng())) return true;
      if (!('title' in portal.options.data)) return true;
      if (ns.onlyInPolygons && !ns.portalInsideDrawnPolygon(portal)) return true;

      found = true;
      var guid = portal.options.guid;
      var obj = previous[guid];
      if (!obj || !rowMatchesFields(obj.row)) obj = createPortalRow(portal);
      else obj.portal = portal;
      fillPortalRow(obj);
      ns.byGuid[guid] = obj;
      ns.listPortals.push(obj);
    });
  } finally {
    ns.linkCache = null;
    ns.fieldCache = null;
    ns.polygonRings = null;
  }

  return found;
}
window.plugin.portalslist.getPortals = getPortals;

function updatePortalListTitle() {
  var count = filteredListPortals().length;
  var root = document.getElementById('portalslist');
  var titleNode = root && root.closest('.ui-dialog') && root.closest('.ui-dialog').querySelector('.ui-dialog-title');
  if (titleNode) titleNode.textContent = portalsCountTitle(count);
}

function sortListPortals() {
  var ns = window.plugin.portalslist;
  var sortBy = ns.sortBy;
  var sortOrder = ns.sortOrder;
  var sortField = ns.fields[sortBy];
  ns.listPortals.sort(function (a, b) {
    var valueA = a.sortValues[sortBy];
    var valueB = b.sortValues[sortBy];
    var cmp = 0;
    if (sortField && sortField.sort) cmp = sortField.sort(valueA, valueB, a.portal, b.portal);
    else if (valueA < valueB) cmp = -1;
    else if (valueA > valueB) cmp = 1;
    if (cmp) return sortOrder * cmp;
    var guidA = a.portal.options.guid;
    var guidB = b.portal.options.guid;
    if (guidA < guidB) return -1;
    if (guidA > guidB) return 1;
    return 0;
  });
}

function placePortalRows(table) {
  var ns = window.plugin.portalslist;
  var filter = ns.filter || 0;
  var keep = Object.create(null);
  ns.listPortals.forEach(function (obj) {
    if (obj.row && obj.row.dataset.guid) keep[obj.row.dataset.guid] = true;
  });
  Array.prototype.slice.call(table.rows).forEach(function (row) {
    if (row.dataset.guid && !keep[row.dataset.guid]) row.parentNode.removeChild(row);
  });
  var index = 0;
  ns.listPortals.forEach(function (obj) {
    var row = obj.row;
    table.appendChild(row);
    if (!portalMatchesFilter(obj.portal, filter)) {
      row.style.display = 'none';
      return;
    }
    row.style.display = '';
    index += 1;
    row.cells[1].textContent = String(index);
  });
  syncSelectAllCheckbox();
}

function updateSortHeaders(table) {
  var ns = window.plugin.portalslist;
  if (!table) {
    var root = document.getElementById('portalslist');
    table = root && root.querySelector('table.portals');
  }
  var headRow = table && table.tHead && table.tHead.rows[0];
  if (!headRow) return;
  for (var i = 0; i < ns.fields.length; i++) {
    var cell = headRow.cells[i + ROW_LEADING];
    if (!cell) continue;
    if (i === ns.sortBy) cell.classList.add('sorted');
    else cell.classList.remove('sorted');
  }
}

function resortPortals(sortBy, sortOrder) {
  var ns = window.plugin.portalslist;
  ns.sortBy = sortBy;
  ns.sortOrder = sortOrder;
  var root = document.getElementById('portalslist');
  var table = root && root.querySelector('table.portals');
  if (!table) {
    $('#portalslist').empty().append(portalTable(sortBy, sortOrder, ns.filter));
    return;
  }
  sortListPortals();
  placePortalRows(table);
  updateSortHeaders();
}

function setPortalFilter(filter) {
  var ns = window.plugin.portalslist;
  ns.filter = filter;
  var root = document.getElementById('portalslist');
  var table = root && root.querySelector('table.portals');
  if (!table) {
    $('#portalslist').empty().append(portalTable(ns.sortBy, ns.sortOrder, filter));
    scheduleLoadOccupiedPortalDetails();
    return;
  }
  placePortalRows(table);
  refreshStatsPanels();
  updatePortalListTitle();
  scheduleLoadOccupiedPortalDetails();
}

function afterLayout(fn) {
  window.requestAnimationFrame(function () {
    window.requestAnimationFrame(fn);
  });
}

function reloadPortalsInPlace() {
  var ns = window.plugin.portalslist;
  var root = document.getElementById('portalslist');
  var table = root && root.querySelector('table.portals');
  if (!root || !table || !getPortals(true)) {
    $('#portalslist').empty().append(portalsListBody());
    updatePortalListTitle();
    scheduleLoadOccupiedPortalDetails();
    afterLayout(fitPortalsListLayout);
    return;
  }
  sortListPortals();
  placePortalRows(table);
  refreshStatsPanels();
  updatePortalListTitle();
  scheduleLoadOccupiedPortalDetails();
  scheduleFitLayout();
}


function detailStatusNode() {
  return el('div', 'detail-status', window.plugin.portalslist.detailStatus || '');
}

function portalsListIsOpen() {
  var root = document.getElementById('portalslist');
  if (!root) return false;
  if (root.classList.contains('mobile')) return true;
  var dialog = root.closest('.ui-dialog');
  return !!(dialog && dialog.offsetParent !== null);
}

function copyDetailFields(target, fresh) {
  if (!target || !fresh) return;
  ['level', 'health', 'resCount', 'owner', 'image', 'title'].forEach(function (key) {
    if (fresh[key] !== undefined && fresh[key] !== null) target[key] = fresh[key];
  });
  if (fresh.mods) target.mods = fresh.mods;
  if (fresh.resonators) target.resonators = fresh.resonators;
  if (fresh.history) target.history = fresh.history;
}

function mergeFreshDetails(guid, details) {
  var portal = window.portals[guid];
  if (!portal) return;
  var cached = window.portalDetail && typeof window.portalDetail.get === 'function' ? window.portalDetail.get(guid) : null;
  var targets = [];
  if (portal.options && portal.options.data) targets.push(portal.options.data);
  if (portal._details && targets.indexOf(portal._details) < 0) targets.push(portal._details);
  targets.forEach(function (target) {
    copyDetailFields(target, cached);
    if (details && details !== target) copyDetailFields(target, details);
  });
}

function applyCachedDetails(portal) {
  if (!window.portalDetail || typeof window.portalDetail.isFresh !== 'function') return false;
  var guid = portal.options.guid;
  if (!window.portalDetail.isFresh(guid)) return false;
  mergeFreshDetails(guid);
  return !!(portal.options.data && portal.options.data.history);
}

function scheduleStatsRefresh() {
  var ns = window.plugin.portalslist;
  ns.statsDirty = true;
  if (ns.statsRefreshTimer) return;
  var interval = ns.detailStreaming ? 1000 : 0;
  var elapsed = ns.statsShownAt ? Date.now() - ns.statsShownAt : interval;
  ns.statsRefreshTimer = window.setTimeout(flushStatsRefresh, Math.max(0, interval - elapsed));
}

function flushStatsRefresh() {
  var ns = window.plugin.portalslist;
  ns.statsRefreshTimer = 0;
  if (!ns.statsDirty) return;
  if (!document.getElementById('portalslist')) {
    ns.statsDirty = false;
    return;
  }
  ns.statsDirty = false;
  ns.statsShownAt = Date.now();
  refreshStatsPanels();
}

function scheduleFitLayout() {
  var ns = window.plugin.portalslist;
  if (ns.detailFitFrame) return;
  ns.detailFitFrame = window.requestAnimationFrame(function () {
    ns.detailFitFrame = 0;
    fitPortalsListLayout();
  });
}

function onPortalDetailLoaded(data) {
  if (!data || !data.success || !data.guid) return;
  if (!document.getElementById('portalslist')) return;
  mergeFreshDetails(data.guid, data.details);
  repaintDetailGuid(data.guid);
}

function setDetailStatus(text) {
  window.plugin.portalslist.detailStatus = text || '';
  var root = document.getElementById('portalslist');
  if (!root) return;
  var node = root.querySelector('.detail-status');
  if (!node) {
    node = detailStatusNode();
    root.appendChild(node);
  }
  node.textContent = window.plugin.portalslist.detailStatus;
}

function portalDetailSignature(portal) {
  var data = (portal && portal.options && portal.options.data) || {};
  var history = data.history || {};
  return [
    portal.options.team,
    data.level,
    data.health,
    data.resCount,
    data.history ? 1 : 0,
    history._raw || 0,
    history.visited ? 1 : 0,
    history.captured ? 1 : 0,
    history.scoutControlled ? 1 : 0,
    data.owner || '',
    data.mods ? 'M' + gearSignature(data.mods, function (mod) {
      return (mod.name || '') + '/' + (mod.rarity || '') + '/' + (mod.owner || '');
    }) : '',
    data.resonators ? 'R' + gearSignature(data.resonators, function (reso) {
      return (reso.level || 0) + '/' + (reso.owner || '') + '/' + (reso.energy || 0);
    }) : '',
  ].join(':');
}

function repaintDetailRow(row) {
  var guid = row.dataset.guid;
  var ns = window.plugin.portalslist;
  var obj = guid && ns.byGuid && ns.byGuid[guid];
  var portal = (obj && obj.portal) || (guid && window.portals[guid]);
  if (!portal || !obj) return false;
  if (row.dataset.sig === portalDetailSignature(portal)) return false;
  obj.portal = portal;
  return withPortalMetricCache(function () {
    return fillPortalRow(obj);
  });
}

function repaintDetailGuid(guid) {
  var obj = window.plugin.portalslist.byGuid && window.plugin.portalslist.byGuid[guid];
  if (!obj || !obj.row) return;
  if (!repaintDetailRow(obj.row)) return;
  scheduleStatsRefresh();
  scheduleFitLayout();
}

function isRowInView(row) {
  if (!row || row.style.display === 'none') return false;
  var root = document.getElementById('portalslist');
  var container = root && root.querySelector('.table-container');
  if (!container) return false;
  var cRect = container.getBoundingClientRect();
  var rRect = row.getBoundingClientRect();
  if (rRect.height <= 0) return false;
  return rRect.bottom > cRect.top + 1 && rRect.top < cRect.bottom - 1;
}

function refreshVisibleDetailRows() {
  var root = document.getElementById('portalslist');
  if (!root || !portalsListIsOpen()) return;
  var container = root.querySelector('.table-container');
  var table = container && container.querySelector('table.portals');
  if (!table) return;
  var changed = false;
  Array.prototype.forEach.call(table.rows, function (row) {
    if (!row.dataset.guid || !isRowInView(row)) return;
    if (repaintDetailRow(row)) changed = true;
  });
  if (changed) scheduleStatsRefresh();
}

function onDetailScroll() {
  var ns = window.plugin.portalslist;
  if (ns.detailScrollFrame) return;
  ns.detailScrollFrame = window.requestAnimationFrame(function () {
    ns.detailScrollFrame = 0;
    refreshVisibleDetailRows();
    enqueueVisibleDetailRequests();
  });
}

function fitPortalsListLayout() {
  var root = document.getElementById('portalslist');
  if (!root || root.classList.contains('mobile')) return;
  var dialog = root.closest('.ui-dialog');
  var content = dialog && dialog.querySelector('.ui-dialog-content');
  if (!content) return;
  root.style.height = content.clientHeight + 'px';
  var table = root.querySelector('table.portals');
  if (!table) return;
  var needed = Math.max(table.offsetWidth || 0, table.scrollWidth || 0);
  if (!needed) return;
  var chrome = Math.max(0, dialog.offsetWidth - content.clientWidth);
  var width = Math.min(window.innerWidth - 8, Math.max(480, Math.ceil(needed + chrome + 16)));
  if (Math.abs(dialog.offsetWidth - width) <= 2) return;
  var $content = window.jQuery && window.jQuery(content);
  if ($content && $content.data('ui-dialog')) $content.dialog('option', 'width', width);
  else dialog.style.width = width + 'px';
}

function isOccupiedPortal(portal) {
  return !!(portal && portal.options && portal.options.team !== window.TEAM_NONE && portal.options.guid);
}

function occupiedDetailCandidates() {
  return filteredListPortals().filter(function (obj) {
    return isOccupiedPortal(obj && obj.portal);
  });
}

function portalNeedsDetailRequest(portal) {
  if (!isOccupiedPortal(portal)) return false;
  if (!window.portalDetail || typeof window.portalDetail.isFresh !== 'function') return true;
  return !window.portalDetail.isFresh(portal.options.guid);
}

function tableContainerReady() {
  var root = document.getElementById('portalslist');
  var container = root && root.querySelector('.table-container');
  return !!(container && container.clientHeight > 0);
}

function finishDetailLoad(generation) {
  var ns = window.plugin.portalslist;
  if (generation != null && generation !== ns.detailLoadGeneration) return;
  ns.detailTimer = null;
  ns.detailQueue = null;
  ns.detailQueueIndex = 0;
  ns.detailStreaming = false;
  setDetailStatus('');
  if (ns.statsRefreshTimer) {
    clearTimeout(ns.statsRefreshTimer);
    ns.statsRefreshTimer = 0;
  }
  if (ns.statsDirty) flushStatsRefresh();
  refreshVisibleDetailRows();
}

function enqueueVisibleDetailRequests() {
  var ns = window.plugin.portalslist;
  if (!portalsListIsOpen() || !ns.detailRequested) return;
  var queue = ns.detailQueue || (ns.detailQueue = []);
  var index = ns.detailQueueIndex || 0;
  var pending = Object.create(null);
  for (var i = index; i < queue.length; i++) pending[queue[i]] = true;
  var added = 0;
  occupiedDetailCandidates().forEach(function (obj) {
    var guid = obj.portal.options.guid;
    if (ns.detailRequested[guid] || pending[guid]) return;
    if (!portalNeedsDetailRequest(obj.portal) || !isRowInView(obj.row)) return;
    queue.push(guid);
    pending[guid] = true;
    added += 1;
  });
  if (!added) return;
  if (!ns.detailStreaming) pumpDetailQueue();
  else setDetailStatus(t('loadingDetails', {
    cur: (ns.detailQueueIndex || 0) + 1,
    total: queue.length,
  }));
}

function pumpDetailQueue() {
  var ns = window.plugin.portalslist;
  var generation = ns.detailLoadGeneration;
  if (ns.detailTimer) return;
  var queue = ns.detailQueue || [];
  if ((ns.detailQueueIndex || 0) >= queue.length) {
    finishDetailLoad(generation);
    return;
  }
  ns.detailStreaming = true;

  var step = function () {
    if (generation !== ns.detailLoadGeneration || !portalsListIsOpen()) return;
    queue = ns.detailQueue || [];
    var index = ns.detailQueueIndex || 0;
    if (index >= queue.length) {
      finishDetailLoad(generation);
      return;
    }
    setDetailStatus(t('loadingDetails', {
      cur: index + 1,
      total: queue.length,
    }));
    var guid = queue[index];
    ns.detailQueueIndex = index + 1;
    ns.detailRequested[guid] = true;
    var request = null;
    try {
      request = window.portalDetail.request(guid);
    } catch (err) { /* ignore */ }
    var proceed = function () {
      if (generation !== ns.detailLoadGeneration || !portalsListIsOpen()) return;
      var portal = window.portals[guid];
      var row = ns.byGuid && ns.byGuid[guid] && ns.byGuid[guid].row;
      if (portal && row && row.dataset.sig !== portalDetailSignature(portal)) {
        mergeFreshDetails(guid);
        repaintDetailGuid(guid);
      }
      ns.detailTimer = window.setTimeout(step, 100);
    };
    if (request && typeof request.always === 'function') request.always(proceed);
    else if (request && typeof request.then === 'function') request.then(proceed, proceed);
    else proceed();
  };
  step();
}

function scheduleLoadOccupiedPortalDetails() {
  var ns = window.plugin.portalslist;
  ns.detailLoadGeneration = (ns.detailLoadGeneration || 0) + 1;
  if (ns.detailTimer) {
    clearTimeout(ns.detailTimer);
    ns.detailTimer = null;
  }
  ns.detailStreaming = false;
  ns.detailQueue = null;
  ns.detailQueueIndex = 0;
  ns.detailRequested = Object.create(null);
  afterLayout(function () {
    loadOccupiedPortalDetails(0);
  });
}

function loadOccupiedPortalDetails(attempt) {
  var ns = window.plugin.portalslist;
  var generation = ns.detailLoadGeneration;
  if (ns.statsRefreshTimer) {
    clearTimeout(ns.statsRefreshTimer);
    ns.statsRefreshTimer = 0;
  }
  ns.statsDirty = false;
  if (!window.portalDetail || typeof window.portalDetail.request !== 'function' || !ns.listPortals) {
    setDetailStatus('');
    return;
  }
  if (!portalsListIsOpen()) return;

  var candidates = occupiedDetailCandidates();
  var cachedGuids = [];
  var needNet = [];
  candidates.forEach(function (obj) {
    var portal = obj.portal;
    var guid = portal.options.guid;
    if (applyCachedDetails(portal)) {
      ns.detailRequested[guid] = true;
      cachedGuids.push(guid);
      return;
    }
    if (portalNeedsDetailRequest(portal)) needNet.push(obj);
    else ns.detailRequested[guid] = true;
  });
  cachedGuids.forEach(repaintDetailGuid);

  if (!needNet.length) {
    setDetailStatus('');
    return;
  }

  if (!tableContainerReady() && (attempt || 0) < 12) {
    window.requestAnimationFrame(function () {
      if (generation !== ns.detailLoadGeneration) return;
      loadOccupiedPortalDetails((attempt || 0) + 1);
    });
    return;
  }

  var guids = [];
  needNet.forEach(function (obj) {
    if (isRowInView(obj.row)) guids.push(obj.portal.options.guid);
  });
  // Layout not ready yet: only prefetch a small first page of the shown list.
  if (!guids.length && !tableContainerReady()) {
    needNet.slice(0, 20).forEach(function (obj) {
      guids.push(obj.portal.options.guid);
    });
  }

  ns.detailQueue = guids;
  ns.detailQueueIndex = 0;
  if (!ns.detailQueue.length) {
    ns.detailQueue = null;
    setDetailStatus('');
    return;
  }
  pumpDetailQueue();
}


function installPortalsListHelpButton() {
  var root = document.getElementById('portalslist');
  var titlebar = root && root.closest('.ui-dialog') && root.closest('.ui-dialog').querySelector('.ui-dialog-titlebar');
  if (!titlebar || titlebar.querySelector('.ui-dialog-titlebar-button-help')) return;
  var help = document.createElement('button');
  help.type = 'button';
  help.className = 'ui-dialog-titlebar-button ui-dialog-titlebar-button-help';
  help.textContent = '?';
  help.title = t('help');
  help.addEventListener('mousedown', function (event) {
    event.stopPropagation();
  });
  help.addEventListener('click', function (event) {
    event.preventDefault();
    event.stopPropagation();
    window.dialog({
      title: 'Portals list',
      id: 'portalslist-help',
      html: '<div class="portalslist-help">' + t('helpBody') + '</div>',
      width: 460,
    });
  });
  titlebar.appendChild(help);
}

window.plugin.portalslist.displayPL = function () {
  var ns = window.plugin.portalslist;
  ns.sortBy = ns.fields.map(function (f) { return f.title; }).indexOf('Level');
  ns.sortOrder = -1;
  ns.filter = 0;
  var list = portalsListBody();
  var count = filteredListPortals().length;

  if (window.useAppPanes()) {
    $('<div id="portalslist" class="mobile">').append(list).appendTo(document.body);
  } else {
    window.dialog({
      html: $('<div id="portalslist">').append(list),
      dialogClass: 'ui-dialog-portalslist',
      title: portalsCountTitle(count),
      id: 'portal-list',
      width: Math.min(window.innerWidth - 8, 960),
      height: Math.min(window.innerHeight - 48, 720),
      minHeight: 360,
      autofocus: false,
      resize: fitPortalsListLayout,
    });
  }
  installPortalsListHelpButton();
  scheduleLoadOccupiedPortalDetails();
  afterLayout(fitPortalsListLayout);
};

function portalLevelOf(portal) {
  if (portal.options.team === window.TEAM_NONE) return 0;
  var level = parseInt(portal.options.data && portal.options.data.level != null
    ? portal.options.data.level
    : portal.options.level, 10);
  var maxLevel = window.MAX_PORTAL_LEVEL || 8;
  if (isNaN(level) || level < 0) return 0;
  return level > maxLevel ? maxLevel : level;
}

var FILTER_CAPTURED = 6;
var FILTER_VISITED_ONLY = 8;
var FILTER_SCOUT = 9;
var FILTER_UNVISIT = 10;
var FILTER_UNSCOUT = 11;
var FILTER_LEVEL_BASE = 20;

function portalMatchesFilter(portal, filter) {
  if (!filter) return true;
  if (filter >= 1 && filter <= 4) return 1 + portal.options.team === filter;
  var maxLevel = window.MAX_PORTAL_LEVEL || 8;
  if (filter >= FILTER_LEVEL_BASE && filter <= FILTER_LEVEL_BASE + maxLevel) {
    return portalLevelOf(portal) === filter - FILTER_LEVEL_BASE;
  }
  var history = (portal.options.data && portal.options.data.history) || {};
  if (filter === FILTER_CAPTURED) return !!history.captured;
  if (filter === FILTER_VISITED_ONLY) return !!(history.visited && !history.captured);
  if (filter === FILTER_UNVISIT) return !history.visited && !history.captured;
  if (filter === FILTER_SCOUT) return !!history.scoutControlled;
  if (filter === FILTER_UNSCOUT) return !history.scoutControlled;
  return false;
}

function filteredListPortals() {
  var ns = window.plugin.portalslist;
  var portals = ns.listPortals || [];
  var filter = ns.filter || 0;
  if (!filter) return portals;
  return portals.filter(function (obj) {
    return portalMatchesFilter(obj.portal, filter);
  });
}

function slicesTotal(slices) {
  return slices.reduce(function (sum, slice) {
    return sum + (slice.value || 0);
  }, 0);
}

function drawPieRing(ctx, cx, cy, outerR, innerR, slices) {
  var total = slicesTotal(slices);
  if (!total) {
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    if (innerR > 0) ctx.arc(cx, cy, innerR, 0, Math.PI * 2, true);
    ctx.fillStyle = '#1b415e';
    ctx.fill();
    return;
  }
  var angle = -Math.PI / 2;
  slices.forEach(function (slice) {
    if (!slice.value) return;
    var sweep = (slice.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, angle, angle + sweep);
    ctx.arc(cx, cy, innerR, angle + sweep, angle, true);
    ctx.closePath();
    ctx.fillStyle = slice.color;
    ctx.fill();
    angle += sweep;
  });
}

function drawPieCanvas(canvas, layers) {
  var ctx = canvas.getContext('2d');
  var w = canvas.width;
  var h = canvas.height;
  var cx = w / 2;
  var cy = h / 2;
  var maxR = Math.min(w, h) / 2 - 2;
  ctx.clearRect(0, 0, w, h);
  layers.forEach(function (layer) {
    drawPieRing(ctx, cx, cy, maxR * layer.outer, maxR * layer.inner, layer.slices);
  });
}

function appendLegendItems(list, slices, options) {
  options = options || {};
  var hideEmpty = options.hideEmpty !== false;
  var total = slicesTotal(slices);
  slices.forEach(function (slice) {
    if (hideEmpty && !slice.value) return;
    var li = document.createElement('li');
    li.style.backgroundColor = slice.color;
    li.style.color = '#fff';
    var pct = total ? Math.round((slice.value / total) * 100) : 0;
    var label = document.createElement('span');
    label.className = 'stats-legend-label';
    label.textContent = slice.label;
    var value = document.createElement('span');
    value.className = 'stats-legend-value';
    value.textContent = slice.value + ' (' + pct + '%)';
    li.appendChild(label);
    li.appendChild(value);
    if (slice.filterIndex > 0) {
      li.classList.add('stats-filter');
      if (window.plugin.portalslist.filter === slice.filterIndex) {
        li.classList.add('active');
      }
      li.title = t('filterTip', { label: slice.label });
      li.addEventListener('click', function () {
        var current = window.plugin.portalslist.filter || 0;
        setPortalFilter(current === slice.filterIndex ? 0 : slice.filterIndex);
      });
    }
    list.appendChild(li);
  });
}

function makePieCanvas(size) {
  var canvas = document.createElement('canvas');
  var ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(size * ratio);
  canvas.height = Math.round(size * ratio);
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';
  return canvas;
}

function pieCard(title, slices, outerSlices) {
  var card = el('div', 'stats-pie');
  card.appendChild(el('div', 'stats-pie-title', title));
  var body = el('div', 'stats-pie-body');
  var dual = !!outerSlices;
  var hasValues = slicesTotal(slices) > 0 || (dual && slicesTotal(outerSlices) > 0);
  if (!dual) {
    var list = el('ul', 'stats-legend');
    appendLegendItems(list, slices);
    body.appendChild(list);
  } else if (hasValues) {
    var legends = el('div', 'stats-legend-groups');
    var innerList = el('ul', 'stats-legend');
    appendLegendItems(innerList, slices, { hideEmpty: false });
    legends.appendChild(innerList);
    var outerList = el('ul', 'stats-legend');
    appendLegendItems(outerList, outerSlices, { hideEmpty: false });
    legends.appendChild(outerList);
    body.appendChild(legends);
  }
  var canvas = makePieCanvas(120);
  body.appendChild(canvas);
  if (dual) {
    var gap = 0.04;
    var mid = 0.62;
    drawPieCanvas(canvas, [
      { outer: 1, inner: mid, slices: outerSlices },
      { outer: mid - gap, inner: 0.18, slices: slices },
    ]);
  } else {
    drawPieCanvas(canvas, [{ outer: 1, inner: 0, slices: slices }]);
  }
  card.appendChild(body);
  return card;
}

function statsPies(portals) {
  var wrap = document.createElement('div');
  wrap.className = 'stats-pies';
  var maxLevel = window.MAX_PORTAL_LEVEL || 8;
  var factionCounts = {};
  var levelCounts = [];
  var cap = 0;
  var visitedOnly = 0;
  var unvisit = 0;
  var scout = 0;
  var unscout = 0;
  window.TEAM_NAMES.forEach(function (_, index) {
    factionCounts[index] = 0;
  });
  for (var level = 0; level <= maxLevel; level++) levelCounts[level] = 0;
  portals.forEach(function (obj) {
    var portal = obj.portal;
    var team = portal.options.team;
    if (factionCounts[team] == null) factionCounts[team] = 0;
    factionCounts[team]++;
    levelCounts[portalLevelOf(portal)]++;
    var history = (portal.options.data && portal.options.data.history) || {};
    if (history.captured) cap++;
    else if (history.visited) visitedOnly++;
    else unvisit++;
    if (history.scoutControlled) scout++;
    else unscout++;
  });
  var factionColors = [NEUTRAL_COLOR, '#005684', '#017f01', '#aa0000'];
  var factionSlices = window.TEAM_NAMES.map(function (name, index) {
    return {
      label: name,
      value: factionCounts[index] || 0,
      color: factionColors[index] || NEUTRAL_COLOR,
      filterIndex: index + 1,
    };
  });
  var visitSlices = [
    { label: 'Cap', value: cap, color: '#e40000', filterIndex: FILTER_CAPTURED },
    { label: 'Visit', value: visitedOnly, color: '#c9a000', filterIndex: FILTER_VISITED_ONLY },
    { label: 'Un visit', value: unvisit, color: NEUTRAL_COLOR, filterIndex: FILTER_UNVISIT },
  ];
  var scoutSlices = [
    { label: 'Scout', value: scout, color: '#6a1b9a', filterIndex: FILTER_SCOUT },
    { label: 'Un scout', value: unscout, color: '#4a667a', filterIndex: FILTER_UNSCOUT },
  ];
  var levelSlices = [];
  for (var lv = maxLevel; lv >= 1; lv--) {
    levelSlices.push({
      label: 'L' + lv,
      value: levelCounts[lv],
      color: (window.COLORS_LVL && window.COLORS_LVL[lv]) || NEUTRAL_COLOR,
      filterIndex: FILTER_LEVEL_BASE + lv,
    });
  }
  if (levelCounts[0]) {
    levelSlices.push({
      label: 'L0',
      value: levelCounts[0],
      color: NEUTRAL_COLOR,
      filterIndex: FILTER_LEVEL_BASE,
    });
  }
  wrap.appendChild(pieCard(t('faction'), factionSlices));
  wrap.appendChild(pieCard('Visit / Cap · Scout', visitSlices, scoutSlices));
  wrap.appendChild(pieCard(t('levelPie'), levelSlices));
  return wrap;
}

function refreshStatsPanels() {
  var root = document.getElementById('portalslist');
  if (!root) return;
  var portals = filteredListPortals();
  var pies = root.querySelector('.stats-pies');
  if (pies && pies.parentNode) pies.parentNode.replaceChild(statsPies(portals), pies);
}

function sectionTitle(text) {
  return el('div', 'section-title', text);
}

function portalTable(sortBy, sortOrder, filter) {
  var ns = window.plugin.portalslist;
  ns.sortBy = sortBy;
  ns.sortOrder = sortOrder;
  ns.filter = filter;
  sortListPortals();

  var tableDiv = document.createElement('div');
  tableDiv.className = 'table-container';
  tableDiv.addEventListener('scroll', onDetailScroll);
  var table = document.createElement('table');
  table.className = 'portals';
  tableDiv.appendChild(table);

  var headRow = table.appendChild(document.createElement('thead')).insertRow(-1);
  var selectHead = headRow.appendChild(document.createElement('th'));
  selectHead.className = 'col-select';
  var selectAll = document.createElement('input');
  selectAll.type = 'checkbox';
  selectAll.className = 'select-all';
  selectAll.title = t('selectAllTip');
  selectAll.addEventListener('change', function () {
    setVisibleSelection(selectAll.checked);
  });
  selectHead.appendChild(selectAll);
  headRow.appendChild(document.createElement('th')).textContent = '#';
  ns.fields.forEach(function (field, i) {
    var cell = headRow.appendChild(document.createElement('th'));
    cell.textContent = field.title;
    if (field.title === 'Portal Name') cell.classList.add('portalTitle');
    if (field.title === 'S') cell.classList.add('col-s');
    if (field.sort !== null) {
      cell.classList.add('sortable');
      $(cell).on('click', function () {
        var order = i === ns.sortBy ? -ns.sortOrder : (field.defaultOrder < 0 ? -1 : 1);
        resortPortals(i, order);
      });
    }
  });

  placePortalRows(table);
  updateSortHeaders(table);
  return listShell(filteredListPortals(), tableDiv);
}
window.plugin.portalslist.portalTable = portalTable;

window.plugin.portalslist.getPortalLink = function (portal) {
  var coord = portal.getLatLng();
  var link = document.createElement('a');
  link.textContent = portal.options.data.title;
  link.title = portal.options.data.title || '';
  link.href = window.makePermalink(coord);
  link.addEventListener('click', function (ev) {
    window.renderPortalDetails(portal.options.guid);
    ev.preventDefault();
    return false;
  });
  link.addEventListener('dblclick', function (ev) {
    window.zoomToAndShowPortal(portal.options.guid, [coord.lat, coord.lng]);
    ev.preventDefault();
    return false;
  });
  return link;
};

window.plugin.portalslist.onPaneChanged = function (pane) {
  if (pane === 'plugin-portalslist') window.plugin.portalslist.displayPL();
  else $('#portalslist').remove();
};

var setup = function () {
  window.plugin.portalslist.FACTION_ABBREVS = window.TEAM_NAMES.map(abbreviate);

  window.plugin.portalslist.listPortals = [];
  window.plugin.portalslist.byGuid = Object.create(null);
  window.plugin.portalslist.sortBy = 1; // second column: level
  window.plugin.portalslist.sortOrder = -1;
  window.plugin.portalslist.filter = 0;
  window.plugin.portalslist.onlyInPolygons = false;

  if (!window.plugin.portalslist.detailHook && window.addHook) {
    window.plugin.portalslist.detailHook = onPortalDetailLoaded;
    window.addHook('portalDetailLoaded', window.plugin.portalslist.detailHook);
  }

  if (window.useAppPanes()) {
    window.app.addPane('plugin-portalslist', 'Portals list', 'ic_action_paste');
    window.addHook('paneChanged', window.plugin.portalslist.onPaneChanged);
  } else {
    IITC.toolbox.addButton({
      label: 'Portals list',
      title: 'Statistics and portal details for the current view [t]',
      action: window.plugin.portalslist.displayPL,
      accesskey: 't',
    });
  }

  $('<style>').prop('type', 'text/css').html('@include_string:portals-list.css@').appendTo('head');
};

window.plugin.portalslist.portalApGainMaths = function (resCount, linkCount, fieldCount) {
  var deployAp = (8 - resCount) * window.DEPLOY_RESONATOR;
  if (resCount === 0) deployAp += window.CAPTURE_PORTAL;
  if (resCount !== 8) deployAp += window.COMPLETION_BONUS;
  var destroyAp = resCount * window.DESTROY_RESONATOR
    + linkCount * window.DESTROY_LINK
    + fieldCount * window.DESTROY_FIELD;
  var captureAp = window.CAPTURE_PORTAL + 8 * window.DEPLOY_RESONATOR + window.COMPLETION_BONUS;
  return {
    friendlyAp: deployAp,
    enemyAp: destroyAp + captureAp,
    destroyAp: destroyAp,
    destroyResoAp: resCount * window.DESTROY_RESONATOR,
    captureAp: captureAp,
  };
};
