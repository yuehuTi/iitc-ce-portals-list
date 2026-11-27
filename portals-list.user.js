// ==UserScript==
// @author         teo96
// @modifier       Takurua(@yuehuTi)
// @name           IITC plugin: Portals list
// @category       Info
// @version        0.5.51
// @description    Show faction statistics and a sortable portal list for the current view.
// @id             portals-list
// @namespace      https://github.com/IITC-CE/ingress-intel-total-conversion
// @updateURL      https://github.com/yuehuTi/iitc-ce-portals-list/raw/refs/heads/master/portals-list.meta.js
// @downloadURL    https://github.com/yuehuTi/iitc-ce-portals-list/raw/refs/heads/master/portals-list.user.js
// @match          https://intel.ingress.com/*
// @match          https://intel-x.ingress.com/*
// @icon           https://iitc.app/extras/plugin-icons/portals-list.svg
// @grant          none
// ==/UserScript==

function wrapper(plugin_info) {
  // ensure plugin framework is there, even if iitc is not yet loaded
  if(typeof window.plugin !== 'function') window.plugin = function() {};
  
  //PLUGIN AUTHORS: writing a plugin outside of the IITC build environment? if so, delete these lines!!
  //(leaving them in place might break the 'About IITC' page or break update checks)
  plugin_info.buildName = 'release';
  plugin_info.dateTimeVersion = '2025-04-19-124553';
  plugin_info.pluginId = 'portals-list';
  //END PLUGIN AUTHORS NOTE
  
  /* exported setup, changelog --eslint */
  /* global IITC -- eslint */

  var changelog = [
    {
      version: '0.5.51',
      changes: ['Collapse the Visit/Cap·Scout pie to the clicked legend, matching the other pies'],
    },
    {
      version: '0.5.50',
      changes: ['Label mod chips with rarity and type short names'],
    },
    {
      version: '0.5.49',
      changes: ['Document query operators, factions, lists and flags in the help dialog'],
    },
    {
      version: '0.5.48',
      changes: ['Keep the window at least wide enough for three pies and their legends, and keep the action bar in place when the list is empty'],
    },
    {
      version: '0.5.47',
      changes: ['Filter the detail list with a boolean query beside Export CSV'],
    },
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
    queryFilter: 'Filter',
    queryReset: 'Reset',
    queryPlaceholder: 'level >= 6 AND team = ENL',
    queryTip: 'Filter the detail list. Reset, or an empty expression, shows every portal again.',
    queryInvalid: 'Invalid expression',
    queryIncomplete: 'Incomplete expression',
    queryParen: 'Missing closing parenthesis',
    queryValue: 'Missing value',
    queryTail: 'Unexpected text after the expression',
    queryTeam: 'Unknown faction',
    queryOp: 'Operator not valid here',
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
    queryFilter: '过滤',
    queryReset: '重置',
    queryPlaceholder: 'level >= 6 AND team = ENL',
    queryTip: '按表达式过滤详细列表。点重置，或表达式为空，即显示全部 Portal。',
    queryInvalid: '表达式无效',
    queryIncomplete: '表达式不完整',
    queryParen: '缺少右括号',
    queryValue: '缺少比较值',
    queryTail: '表达式末尾有多余内容',
    queryTeam: '无法识别的阵营',
    queryOp: '这里不能使用这个运算符',
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

  function helpBodyHtml() {
    if (USE_ZH) {
      return [
        '<p>点击表头可排序。</p>',
        '<p>点击饼图图例可筛选该分组，再点一次清除筛选。</p>',
        '<p>导出 CSV 右侧的过滤框可筛选详细列表。点重置，或表达式为空，即恢复全部。表达式写错时输入会标红，当前列表不变。饼图筛选仍然同时生效。</p>',
        '<h3>运算符</h3>',
        '<ul>',
        '<li><code>AND</code>、<code>且</code>：两个条件都成立。紧挨着写的条件也是 AND，例如 <code>level &gt;= 6 team = ENL</code>。</li>',
        '<li><code>OR</code>、<code>或</code>：任一条件成立。<code>AND</code> 比 <code>OR</code> 更紧，需要先算的一组用括号。</li>',
        '<li><code>NOT</code>、<code>非</code>，或在条件前加 <code>-</code>：否定。例如 <code>NOT visited</code>、<code>-captured</code>。</li>',
        '<li><code>=</code> 相等，<code>!=</code> 不相等。文字不区分大小写。</li>',
        '<li><code>&gt;</code> <code>&gt;=</code> <code>&lt;</code> <code>&lt;=</code> 只用于数值。</li>',
        '<li><code>~</code> 包含，用于名字、主人和共振器主人。</li>',
        '<li><code>:</code> 是简写。文字表示包含（<code>name:park</code>），数值表示相等（<code>level:6</code>），也可以带比较符（<code>level:&gt;=6</code>）。</li>',
        '<li><code>6..8</code> 是闭区间，含两端。<code>level:6..8</code> 等于 <code>level &gt;= 6 AND level &lt;= 8</code>。</li>',
        '<li><code>has</code> 表示列表里有这一项。</li>',
        '</ul>',
        '<p>没写字段的词按名字包含来匹配。名字里有空格时加引号：<code>name ~ "central park"</code>。</p>',
        '<h3>字段</h3>',
        '<ul>',
        '<li>名字：<code>name</code> <code>title</code> <code>portal</code> <code>名字</code> <code>名称</code></li>',
        '<li>等级：<code>level</code> <code>lvl</code> <code>lv</code> <code>等级</code></li>',
        '<li>阵营：<code>team</code> <code>faction</code> <code>阵营</code></li>',
        '<li>血量：<code>health</code> <code>hp</code> <code>血量</code></li>',
        '<li>共振器数量：<code>res</code> <code>rescount</code></li>',
        '<li>盾的减伤合计：<code>shields</code> <code>shield</code> <code>盾</code></li>',
        '<li>链接数：<code>links</code> <code>link</code> <code>链接</code></li>',
        '<li>区域数：<code>fields</code> <code>field</code> <code>区域</code></li>',
        '<li>敌方 AP：<code>ap</code></li>',
        '<li>主人：<code>owner</code> <code>主人</code>。<code>me</code> 表示当前玩家。</li>',
        '</ul>',
        '<h3>阵营</h3>',
        '<ul>',
        '<li>启蒙：<code>ENL</code> <code>E</code> <code>enlightened</code> <code>green</code> <code>绿</code> <code>启蒙</code></li>',
        '<li>抵抗：<code>RES</code> <code>R</code> <code>resistance</code> <code>blue</code> <code>蓝</code> <code>抵抗</code></li>',
        '<li>中立：<code>NEU</code> <code>N</code> <code>neutral</code> <code>none</code> <code>白</code> <code>中立</code> <code>灰</code></li>',
        '<li>Machina：<code>MAC</code> <code>machina</code> <code>红</code></li>',
        '<li>我方：<code>friendly</code> <code>友方</code> <code>我方</code></li>',
        '<li>敌方：<code>enemy</code> <code>敌方</code>。有阵营，并且不是自己的阵营。</li>',
        '</ul>',
        '<p>例如 <code>team = ENL</code>、<code>team = friendly</code>、<code>阵营 != 中立</code>。</p>',
        '<h3>列表</h3>',
        '<ul>',
        '<li><code>mods</code> / <code>mod</code>：<code>has</code> 按短名、插件名或稀有度匹配，不区分大小写。短名包括 <code>CS</code> / <code>RS</code> / <code>VRS</code>、<code>Aegis</code>、<code>CMH</code> / <code>RMH</code> / <code>VRMH</code>、<code>CHS</code> / <code>RHS</code> / <code>VRHS</code>、<code>LA</code> / <code>VRLA</code>、<code>Turret</code>、<code>FA</code>、<code>SBUL</code>、<code>ITON-</code>、<code>ITON+</code>。例如 <code>mods has VRS</code>、<code>mods has MH</code>、<code>mods has shield</code>。</li>',
        '<li><code>mods &gt;= 2</code> 比较的是插件个数，不是等级。</li>',
        '<li><code>resonator</code> / <code>resonators</code>：比较的是任意一个共振器的等级。<code>resonator &gt;= 7</code> 表示至少有一个 7 级或以上。<code>resonator = 8</code> 和 <code>resonator has 8</code> 表示有 8 级共振器。</li>',
        '<li><code>resonator.owner</code>：任意一个共振器的主人，可用 <code>=</code>、<code>!=</code>、<code>~</code> 和 <code>me</code>。例如 <code>resonator.owner = me</code>。</li>',
        '</ul>',
        '<h3>标志</h3>',
        '<p>单独写表示成立，也可以写成 <code>visited = true</code> 或 <code>visited = false</code>。真：<code>true</code> <code>yes</code> <code>1</code> <code>是</code>。假：<code>false</code> <code>no</code> <code>0</code> <code>否</code>。</p>',
        '<ul>',
        '<li><code>visited</code> / <code>visit</code>：到访过，包括已占领。</li>',
        '<li><code>captured</code> / <code>cap</code>：已占领。</li>',
        '<li><code>scout</code>：已侦察控制。</li>',
        '</ul>',
        '<p>盾、插件、主人、共振器、到访、占领和侦察要等 Portal 详情。详情还没到时，这些条件先不匹配，读到后再筛。<code>NOT visited</code> 在详情未知时也不会把该 Portal 放进来。</p>',
      ].join('');
    }
    return [
      '<p>Click table headers to sort.</p>',
      '<p>Click a pie legend to filter that group; click again to clear.</p>',
      '<p>The filter box beside Export CSV filters the detail list. Reset, or an empty expression, shows every portal again. An invalid expression turns red and leaves the current list unchanged. A pie filter still applies.</p>',
      '<h3>Operators</h3>',
      '<ul>',
      '<li><code>AND</code>: both sides match. Adjacent terms are also AND, for example <code>level &gt;= 6 team = ENL</code>.</li>',
      '<li><code>OR</code>: either side matches. <code>AND</code> binds tighter than <code>OR</code>. Use parentheses to group.</li>',
      '<li><code>NOT</code>, or <code>-</code> before a term: negation. Examples: <code>NOT visited</code>, <code>-captured</code>.</li>',
      '<li><code>=</code> equals, <code>!=</code> does not equal. Text is case-insensitive.</li>',
      '<li><code>&gt;</code> <code>&gt;=</code> <code>&lt;</code> <code>&lt;=</code> apply to numbers.</li>',
      '<li><code>~</code> contains. Use it for name, owner, and resonator owner.</li>',
      '<li><code>:</code> is shorthand. For text it means contains (<code>name:park</code>). For numbers it means equals (<code>level:6</code>), and it can carry a comparison (<code>level:&gt;=6</code>).</li>',
      '<li><code>6..8</code> is an inclusive range. <code>level:6..8</code> means <code>level &gt;= 6 AND level &lt;= 8</code>.</li>',
      '<li><code>has</code> means the list contains that item.</li>',
      '</ul>',
      '<p>A bare word matches a name that contains it. Quote a name that has spaces: <code>name ~ "central park"</code>.</p>',
      '<h3>Fields</h3>',
      '<ul>',
      '<li>Name: <code>name</code> <code>title</code> <code>portal</code></li>',
      '<li>Level: <code>level</code> <code>lvl</code> <code>lv</code></li>',
      '<li>Faction: <code>team</code> <code>faction</code></li>',
      '<li>Health: <code>health</code> <code>hp</code></li>',
      '<li>Resonator count: <code>res</code> <code>rescount</code></li>',
      '<li>Shield mitigation total: <code>shields</code> <code>shield</code></li>',
      '<li>Link count: <code>links</code> <code>link</code></li>',
      '<li>Field count: <code>fields</code> <code>field</code></li>',
      '<li>Enemy AP: <code>ap</code></li>',
      '<li>Owner: <code>owner</code>. <code>me</code> is the current player.</li>',
      '</ul>',
      '<h3>Factions</h3>',
      '<ul>',
      '<li>Enlightened: <code>ENL</code> <code>E</code> <code>enlightened</code> <code>green</code></li>',
      '<li>Resistance: <code>RES</code> <code>R</code> <code>resistance</code> <code>blue</code></li>',
      '<li>Neutral: <code>NEU</code> <code>N</code> <code>neutral</code> <code>none</code></li>',
      '<li>Machina: <code>MAC</code> <code>machina</code></li>',
      '<li>Your faction: <code>friendly</code></li>',
      '<li>The other faction: <code>enemy</code>. A faction portal that is not yours.</li>',
      '</ul>',
      '<p>Examples: <code>team = ENL</code>, <code>team = friendly</code>, <code>team != NEU</code>.</p>',
      '<h3>Lists</h3>',
      '<ul>',
      '<li><code>mods</code> / <code>mod</code>: <code>has</code> matches the short label, mod name, or rarity, ignoring case. Short labels include <code>CS</code> / <code>RS</code> / <code>VRS</code>, <code>Aegis</code>, <code>CMH</code> / <code>RMH</code> / <code>VRMH</code>, <code>CHS</code> / <code>RHS</code> / <code>VRHS</code>, <code>LA</code> / <code>VRLA</code>, <code>Turret</code>, <code>FA</code>, <code>SBUL</code>, <code>ITON-</code>, and <code>ITON+</code>. Examples: <code>mods has VRS</code>, <code>mods has MH</code>, <code>mods has shield</code>.</li>',
      '<li><code>mods &gt;= 2</code> compares how many mods are installed, not their level.</li>',
      '<li><code>resonator</code> / <code>resonators</code>: the comparison applies to any one resonator level. <code>resonator &gt;= 7</code> means at least one resonator is level 7 or higher. <code>resonator = 8</code> and <code>resonator has 8</code> mean an R8 is present.</li>',
      '<li><code>resonator.owner</code>: any resonator owner, with <code>=</code>, <code>!=</code>, <code>~</code>, and <code>me</code>. Example: <code>resonator.owner = me</code>.</li>',
      '</ul>',
      '<h3>Flags</h3>',
      '<p>A bare flag means true. <code>visited = true</code> and <code>visited = false</code> also work. True: <code>true</code> <code>yes</code> <code>1</code>. False: <code>false</code> <code>no</code> <code>0</code>.</p>',
      '<ul>',
      '<li><code>visited</code> / <code>visit</code>: visited, including captured.</li>',
      '<li><code>captured</code> / <code>cap</code>: captured.</li>',
      '<li><code>scout</code>: scout controlled.</li>',
      '</ul>',
      '<p>Shields, mods, owner, resonators, visited, captured, and scout wait for portal details. Until those details arrive, such a condition does not match; the list is filtered again when they do. <code>NOT visited</code> does not include a portal whose history is still unknown.</p>',
    ].join('');
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
    bar.appendChild(portalQueryControl());
    return bar;
  }

  function portalQueryInput() {
    var root = document.getElementById('portalslist');
    return root && root.querySelector('input.portal-query-input');
  }

  function portalQueryControl() {
    var ns = window.plugin.portalslist;
    var wrap = document.createElement('span');
    wrap.className = 'portal-query';
    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'portal-query-input';
    input.spellcheck = false;
    input.autocomplete = 'off';
    input.placeholder = t('queryPlaceholder');
    input.title = ns.queryErrorMessage || t('queryTip');
    input.value = ns.queryText || '';
    input.setAttribute('aria-label', t('queryFilter'));
    if (ns.queryError) input.classList.add('query-error');
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        applyPortalQuery();
      }
    });
    input.addEventListener('input', function () {
      input.classList.remove('query-error');
      ns.queryError = false;
      ns.queryErrorMessage = '';
      input.title = t('queryTip');
    });
    wrap.appendChild(input);
    wrap.appendChild(queryActionButton(t('queryFilter'), t('queryTip'), applyPortalQuery));
    wrap.appendChild(queryActionButton(t('queryReset'), t('queryTip'), resetPortalQuery));
    return wrap;
  }

  function queryActionButton(label, title, action) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    btn.title = title;
    btn.addEventListener('click', action);
    return btn;
  }

  function markPortalQuery(input, invalid, message) {
    var ns = window.plugin.portalslist;
    ns.queryError = !!invalid;
    ns.queryErrorMessage = invalid ? (message || t('queryInvalid')) : '';
    if (!input) return;
    input.classList.toggle('query-error', !!invalid);
    input.title = ns.queryErrorMessage || t('queryTip');
  }

  function applyPortalQuery() {
    var input = portalQueryInput();
    if (!input) return;
    var ns = window.plugin.portalslist;
    var text = input.value.trim();
    if (!text) {
      ns.queryText = input.value;
      ns.queryPredicate = null;
      markPortalQuery(input, false);
      refreshDetailFilter();
      return;
    }
    try {
      ns.queryPredicate = compilePortalQuery(text);
      ns.queryText = input.value;
      markPortalQuery(input, false);
      refreshDetailFilter();
      ensureQueryDetails();
    } catch (err) {
      markPortalQuery(input, true, err && err.message);
    }
  }

  function resetPortalQuery() {
    var input = portalQueryInput();
    var ns = window.plugin.portalslist;
    ns.queryText = '';
    ns.queryPredicate = null;
    if (input) input.value = '';
    markPortalQuery(input, false);
    refreshDetailFilter();
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
    return listShell([], emptyDetailTable());
  }

  function emptyDetailTable() {
    var tableDiv = document.createElement('div');
    tableDiv.className = 'table-container';
    var table = document.createElement('table');
    table.className = 'noPortals';
    table.insertRow(-1).insertCell(-1).textContent = t('nothingToShow');
    tableDiv.appendChild(table);
    return tableDiv;
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

  function rarityPrefix(mod) {
    var rarity = mod.rarity || '';
    if (rarity === 'VERY_RARE') return 'VR';
    if (rarity === 'RARE') return 'R';
    if (rarity === 'COMMON') return 'C';
    return '';
  }

  function shieldLabel(mod) {
    if (/aegis/i.test(mod.name || '')) return 'Aegis';
    var prefix = rarityPrefix(mod);
    return prefix ? prefix + 'S' : (mod.name || '?');
  }

  function itoLabel(name) {
    if (name.indexOf('transmuter') < 0 && name.indexOf('ito') < 0) return '';
    if (name.indexOf('attack') >= 0) return 'ITON-';
    if (name.indexOf('defense') >= 0 || name.indexOf('defence') >= 0) return 'ITON+';
    if (name.indexOf('+') >= 0) return 'ITON+';
    if (name.indexOf('-') >= 0 || name.indexOf('−') >= 0 || name.indexOf('–') >= 0) return 'ITON-';
    return '';
  }

  function modLabel(mod) {
    if (isShieldMod(mod)) return shieldLabel(mod);
    var name = (mod.name || '').toLowerCase();
    var prefix = rarityPrefix(mod);
    if (name.indexOf('force amp') >= 0) return 'FA';
    if (name.indexOf('turret') >= 0) return 'Turret';
    if (name.indexOf('heat sink') >= 0) return prefix + 'HS';
    if (name.indexOf('multi') >= 0) return prefix + 'MH';
    if (name.indexOf('softbank') >= 0) return 'SBUL';
    if (name.indexOf('link amp') >= 0) return prefix === 'VR' ? 'VRLA' : 'LA';
    var ito = itoLabel(name);
    if (ito) return ito;
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
    var count = shownPortalCount();
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
      if (!portalMatchesFilter(obj.portal, filter) || !portalMatchesQuery(obj.portal)) {
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
    if (window.plugin.portalslist.queryPredicate) refreshDetailFilter();
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

  function pieCardsMinWidth(root) {
    var pies = root.querySelector('.stats-pies');
    if (!pies) return 0;
    var cards = pies.querySelectorAll('.stats-pie');
    if (!cards.length) return 0;
    var sum = 0;
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      var prevFlex = card.style.flex;
      var prevWidth = card.style.width;
      var prevMin = card.style.minWidth;
      card.style.flex = '0 0 auto';
      card.style.width = 'max-content';
      card.style.minWidth = 'max-content';
      sum += card.offsetWidth;
      card.style.flex = prevFlex;
      card.style.width = prevWidth;
      card.style.minWidth = prevMin;
    }
    var gap = parseFloat(window.getComputedStyle(pies).columnGap);
    if (isNaN(gap)) gap = 20;
    if (cards.length > 1) sum += gap * (cards.length - 1);
    return Math.ceil(sum);
  }

  function fitPortalsListLayout() {
    var root = document.getElementById('portalslist');
    if (!root || root.classList.contains('mobile')) return;
    var dialog = root.closest('.ui-dialog');
    var content = dialog && dialog.querySelector('.ui-dialog-content');
    if (!content) return;
    root.style.height = content.clientHeight + 'px';
    var contentStyle = window.getComputedStyle(content);
    var pad = (parseFloat(contentStyle.paddingLeft) || 0) + (parseFloat(contentStyle.paddingRight) || 0);
    var inner = Math.max(0, content.clientWidth - pad);
    var pieWidth = pieCardsMinWidth(root);
    var minWidth = pieWidth ? Math.ceil(dialog.offsetWidth + (pieWidth - inner)) : dialog.offsetWidth;
    var floor = Math.min(Math.max(minWidth, 0), window.innerWidth - 8);
    var table = root.querySelector('table.portals');
    var tableWidth = table ? Math.max(table.offsetWidth || 0, table.scrollWidth || 0) : 0;
    var width = floor;
    if (tableWidth) width = Math.max(floor, Math.ceil(dialog.offsetWidth + (tableWidth - inner) + 16));
    width = Math.min(window.innerWidth - 8, width);
    var $content = window.jQuery && window.jQuery(content);
    if ($content && $content.data('ui-dialog')) {
      if ($content.dialog('option', 'minWidth') !== floor) $content.dialog('option', 'minWidth', floor);
      if (Math.abs(dialog.offsetWidth - width) > 2) $content.dialog('option', 'width', width);
    } else {
      dialog.style.minWidth = floor + 'px';
      if (Math.abs(dialog.offsetWidth - width) > 2) dialog.style.width = width + 'px';
    }
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
        html: '<div class="portalslist-help">' + helpBodyHtml() + '</div>',
        width: Math.min(window.innerWidth - 40, 680),
        height: Math.min(window.innerHeight - 80, 640),
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
    var count = shownPortalCount();

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

  function portalMatchesQuery(portal) {
    var predicate = window.plugin.portalslist.queryPredicate;
    if (!predicate) return true;
    try {
      return predicate(portal) === true;
    } catch (err) {
      return false;
    }
  }

  function shownPortalCount() {
    var ns = window.plugin.portalslist;
    var portals = ns.listPortals || [];
    var filter = ns.filter || 0;
    var count = 0;
    for (var i = 0; i < portals.length; i++) {
      if (portalMatchesFilter(portals[i].portal, filter) && portalMatchesQuery(portals[i].portal)) count++;
    }
    return count;
  }

  function refreshDetailFilter() {
    var root = document.getElementById('portalslist');
    var table = root && root.querySelector('table.portals');
    if (table) placePortalRows(table);
    updatePortalListTitle();
  }

  function ensureQueryDetails() {
    var ns = window.plugin.portalslist;
    var predicate = ns.queryPredicate;
    if (!predicate || !predicate.needsDetail) return;
    if (!window.portalDetail || typeof window.portalDetail.request !== 'function') return;
    if (!ns.detailRequested) ns.detailRequested = Object.create(null);
    var queue = ns.detailQueue || (ns.detailQueue = []);
    var index = ns.detailQueueIndex || 0;
    var pending = Object.create(null);
    for (var i = index; i < queue.length; i++) pending[queue[i]] = true;
    occupiedDetailCandidates().forEach(function (obj) {
      var guid = obj.portal.options.guid;
      if (!guid || ns.detailRequested[guid] || pending[guid]) return;
      if (!portalNeedsDetailRequest(obj.portal)) return;
      queue.push(guid);
      pending[guid] = true;
    });
    ns.detailQueue = queue;
    if (index < queue.length && !ns.detailTimer) pumpDetailQueue();
  }

  function queryError(key) {
    var err = new Error(t(key));
    err.query = true;
    return err;
  }

  var QUERY_FIELDS = {
    name: 'name', title: 'name', portal: 'name', '名字': 'name', '名称': 'name',
    level: 'level', lvl: 'level', lv: 'level', '等级': 'level',
    team: 'team', faction: 'team', '阵营': 'team',
    health: 'health', hp: 'health', '血量': 'health',
    res: 'res', rescount: 'res',
    shields: 'shields', shield: 'shields', '盾': 'shields',
    mods: 'mods', mod: 'mods',
    owner: 'owner', '主人': 'owner',
    links: 'links', link: 'links', '链接': 'links',
    fields: 'fields', field: 'fields', '区域': 'fields',
    ap: 'ap',
    resonator: 'resonator', resonators: 'resonator',
    'resonator.owner': 'resonatorOwner',
    visited: 'visited', visit: 'visited',
    captured: 'captured', cap: 'captured',
    scout: 'scout',
  };

  var QUERY_DETAIL_FIELDS = {
    shields: 1, mods: 1, owner: 1, resonator: 1, resonatorOwner: 1,
    visited: 1, captured: 1, scout: 1,
  };

  function canonicalQueryField(raw) {
    return QUERY_FIELDS[String(raw).trim().toLowerCase()] || null;
  }

  function isQueryFlag(field) {
    return field === 'visited' || field === 'captured' || field === 'scout';
  }

  function isQueryBreak(ch) {
    return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' ||
      ch === '(' || ch === ')' || ch === '=' || ch === '>' || ch === '<' ||
      ch === '~' || ch === ':' || ch === '"' || ch === '\'';
  }

  function tokenizeQuery(input) {
    var tokens = [];
    var i = 0;
    while (i < input.length) {
      var ch = input.charAt(i);
      if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
        i++;
        continue;
      }
      if (ch === '(' || ch === ')') {
        tokens.push({ type: ch });
        i++;
        continue;
      }
      if (ch === '"' || ch === '\'') {
        var quote = ch;
        i++;
        var text = '';
        while (i < input.length && input.charAt(i) !== quote) {
          if (input.charAt(i) === '\\' && i + 1 < input.length) {
            text += input.charAt(i + 1);
            i += 2;
            continue;
          }
          text += input.charAt(i);
          i++;
        }
        if (i >= input.length) throw queryError('queryValue');
        i++;
        tokens.push({ type: 'value', value: text, quoted: true });
        continue;
      }
      if (input.substr(i, 2) === '>=' || input.substr(i, 2) === '<=' || input.substr(i, 2) === '!=') {
        tokens.push({ type: 'op', value: input.substr(i, 2) });
        i += 2;
        continue;
      }
      if (ch === '=' || ch === '>' || ch === '<' || ch === '~' || ch === ':') {
        tokens.push({ type: 'op', value: ch });
        i++;
        continue;
      }
      if (ch === '-' && (i + 1 >= input.length || /[\s(A-Za-z_\u4e00-\u9fff]/.test(input.charAt(i + 1)))) {
        tokens.push({ type: 'not' });
        i++;
        continue;
      }
      var start = i;
      while (i < input.length && !isQueryBreak(input.charAt(i))) i++;
      if (start === i) throw queryError('queryIncomplete');
      tokens.push({ type: 'word', value: input.slice(start, i) });
    }
    return tokens;
  }

  function keywordKind(token) {
    if (!token) return '';
    if (token.type === 'not') return 'not';
    if (token.type !== 'word') return '';
    var word = token.value.toUpperCase();
    if (word === 'OR' || token.value === '或') return 'or';
    if (word === 'AND' || token.value === '且') return 'and';
    if (word === 'NOT' || token.value === '非') return 'not';
    return '';
  }

  function compilePortalQuery(source) {
    var tokens = tokenizeQuery(source);
    var pos = 0;

    function peek() { return tokens[pos]; }
    function take() { return tokens[pos++]; }

    function startsTerm(token) {
      if (!token || token.type === ')') return false;
      if (keywordKind(token) === 'or' || keywordKind(token) === 'and') return false;
      return token.type === '(' || token.type === 'word' || token.type === 'value' || keywordKind(token) === 'not';
    }

    function parseOr() {
      var left = parseAnd();
      while (keywordKind(peek()) === 'or') {
        take();
        left = { type: 'or', left: left, right: parseAnd() };
      }
      return left;
    }

    function parseAnd() {
      var left = parseNot();
      while (peek()) {
        if (keywordKind(peek()) === 'or' || peek().type === ')') break;
        if (keywordKind(peek()) === 'and') {
          take();
          left = { type: 'and', left: left, right: parseNot() };
          continue;
        }
        if (!startsTerm(peek())) break;
        left = { type: 'and', left: left, right: parseNot() };
      }
      return left;
    }

    function parseNot() {
      if (keywordKind(peek()) === 'not') {
        take();
        return { type: 'not', arg: parseNot() };
      }
      if (peek() && peek().type === '(') {
        take();
        var inner = parseOr();
        if (!peek() || peek().type !== ')') throw queryError('queryParen');
        take();
        return inner;
      }
      return parsePredicate();
    }

    function parsePredicate() {
      var token = peek();
      if (!token || (token.type !== 'word' && token.type !== 'value')) throw queryError('queryIncomplete');
      if (keywordKind(token) === 'and' || keywordKind(token) === 'or') throw queryError('queryIncomplete');
      if (token.type === 'value') {
        take();
        return { type: 'name', op: '~', value: token.value };
      }
      var field = canonicalQueryField(token.value);
      var ahead = tokens[pos + 1];
      var aheadIsOp = ahead && (ahead.type === 'op' || (ahead.type === 'word' && ahead.value.toUpperCase() === 'HAS'));
      if (field && aheadIsOp) {
        take();
        return parseComparison(field);
      }
      if (field && isQueryFlag(field)) {
        take();
        return { type: 'flag', field: field };
      }
      take();
      return { type: 'name', op: '~', value: token.value };
    }

    function parseComparison(field) {
      var opToken = take();
      var op = opToken.type === 'word' ? 'has' : opToken.value;
      if (op === ':') {
        var nextToken = peek();
        if (nextToken && nextToken.type === 'op' && nextToken.value !== ':') op = take().value;
        else op = defaultQueryOp(field);
      }
      var valueToken = peek();
      if (!valueToken || (valueToken.type !== 'word' && valueToken.type !== 'value')) throw queryError('queryValue');
      take();
      var range = !valueToken.quoted && parseQueryRange(valueToken.value);
      if (range) {
        if (!(isQueryNumeric(field) && op === '=')) throw queryError('queryOp');
        op = 'range';
      }
      validateQueryOp(field, op);
      var node = {
        type: 'cmp',
        field: field,
        op: op,
        value: range || valueToken.value,
        quoted: !!valueToken.quoted,
      };
      if (field === 'team') {
        var team = canonicalTeam(valueToken.value);
        if (!team) throw queryError('queryTeam');
        node.team = team;
      }
      if (isQueryFlag(field)) {
        var flagValue = parseQueryBool(valueToken.value);
        if (flagValue == null) throw queryError('queryValue');
        node.flag = flagValue;
      }
      return node;
    }

    var ast = parseOr();
    if (peek()) throw queryError('queryTail');
    var predicate = function (portal) {
      return evalQuery(ast, portal) === true;
    };
    predicate.needsDetail = queryNodeNeedsDetail(ast);
    return predicate;
  }

  function defaultQueryOp(field) {
    if (field === 'name' || field === 'owner' || field === 'resonatorOwner') return '~';
    if (field === 'mods') return 'has';
    return '=';
  }

  function isQueryNumeric(field) {
    return field === 'level' || field === 'health' || field === 'res' || field === 'shields' ||
      field === 'links' || field === 'fields' || field === 'ap' || field === 'mods' || field === 'resonator';
  }

  function validateQueryOp(field, op) {
    var numeric = { '=': 1, '!=': 1, '>': 1, '>=': 1, '<': 1, '<=': 1, range: 1 };
    var text = { '=': 1, '!=': 1, '~': 1 };
    if (field === 'name' || field === 'owner' || field === 'resonatorOwner') {
      if (!text[op]) throw queryError('queryOp');
      return;
    }
    if (field === 'team' || isQueryFlag(field)) {
      if (op !== '=' && op !== '!=') throw queryError('queryOp');
      return;
    }
    if (field === 'mods' || field === 'resonator') {
      if (op !== 'has' && !numeric[op]) throw queryError('queryOp');
      return;
    }
    if (!numeric[op]) throw queryError('queryOp');
  }

  function parseQueryRange(value) {
    var match = /^(-?\d+(?:\.\d+)?)\.\.(-?\d+(?:\.\d+)?)$/.exec(String(value));
    if (!match) return null;
    return [Number(match[1]), Number(match[2])];
  }

  function parseQueryNumber(value) {
    if (typeof value === 'number') return value;
    if (!/^-?\d+(?:\.\d+)?$/.test(String(value))) return null;
    return Number(value);
  }

  function parseQueryBool(value) {
    var key = String(value).trim().toLowerCase();
    if (key === 'true' || key === 'yes' || key === '1' || key === '是') return true;
    if (key === 'false' || key === 'no' || key === '0' || key === '否') return false;
    return null;
  }

  function canonicalTeam(value) {
    var key = String(value).trim().toLowerCase();
    var map = {
      enl: 'enl', e: 'enl', enlightened: 'enl', green: 'enl', '绿': 'enl', '启蒙': 'enl',
      res: 'res', r: 'res', resistance: 'res', blue: 'res', '蓝': 'res', '抵抗': 'res',
      neu: 'neu', n: 'neu', neutral: 'neu', none: 'neu', '白': 'neu', '中立': 'neu', '灰': 'neu',
      mac: 'mac', machina: 'mac', '红': 'mac',
      friendly: 'friendly', '友方': 'friendly', '我方': 'friendly',
      enemy: 'enemy', '敌方': 'enemy',
    };
    return map[key] || null;
  }

  function queryNodeNeedsDetail(node) {
    if (!node) return false;
    if (node.type === 'cmp' || node.type === 'flag') return !!QUERY_DETAIL_FIELDS[node.field];
    if (node.type === 'not') return queryNodeNeedsDetail(node.arg);
    if (node.type === 'and' || node.type === 'or') {
      return queryNodeNeedsDetail(node.left) || queryNodeNeedsDetail(node.right);
    }
    return false;
  }

  function evalQuery(node, portal) {
    if (node.type === 'or') return evalQueryOr(evalQuery(node.left, portal), evalQuery(node.right, portal));
    if (node.type === 'and') return evalQueryAnd(evalQuery(node.left, portal), evalQuery(node.right, portal));
    if (node.type === 'not') return evalQueryNot(evalQuery(node.arg, portal));
    if (node.type === 'name') return cmpQueryString(queryPortalName(portal), node.op, node.value);
    if (node.type === 'flag') {
      var flag = evalQueryFlag(portal, node.field);
      if (flag === 'unknown') return 'unknown';
      return flag === true;
    }
    return evalQueryCmp(node, portal);
  }

  function evalQueryOr(left, right) {
    if (left === true || right === true) return true;
    if (left === false && right === false) return false;
    return 'unknown';
  }

  function evalQueryAnd(left, right) {
    if (left === false || right === false) return false;
    if (left === true && right === true) return true;
    return 'unknown';
  }

  function evalQueryNot(value) {
    if (value === 'unknown') return 'unknown';
    return !value;
  }

  function queryPortalData(portal) {
    return (portal && portal.options && portal.options.data) || {};
  }

  function queryPortalName(portal) {
    var title = queryPortalData(portal).title;
    return title == null ? '' : String(title);
  }

  function queryKnownNumber(value) {
    if (value == null || value === '') return null;
    var number = Number(value);
    return isNaN(number) ? null : number;
  }

  function queryPlayerName() {
    return window.PLAYER && window.PLAYER.nickname ? String(window.PLAYER.nickname) : '';
  }

  function queryPlayerTeam() {
    if (!window.PLAYER || typeof window.teamStringToId !== 'function') return null;
    var team = window.teamStringToId(window.PLAYER.team);
    return team == null ? null : team;
  }

  function queryTeamId(token) {
    if (token === 'enl') return window.TEAM_ENL != null ? window.TEAM_ENL : 2;
    if (token === 'res') return window.TEAM_RES != null ? window.TEAM_RES : 1;
    if (token === 'neu') return window.TEAM_NONE != null ? window.TEAM_NONE : 0;
    if (token === 'mac') return window.TEAM_MAC != null ? window.TEAM_MAC : null;
    return null;
  }

  function queryResolveText(value, quoted) {
    if (!quoted && String(value).toLowerCase() === 'me') return queryPlayerName();
    return String(value);
  }

  function cmpQueryString(actual, op, expected) {
    var left = String(actual == null ? '' : actual).toLowerCase();
    var right = String(expected == null ? '' : expected).toLowerCase();
    if (op === '=' ) return left === right;
    if (op === '!=') return left !== right;
    if (op === '~') return left.indexOf(right) >= 0;
    return false;
  }

  function cmpQueryNumber(actual, op, expected) {
    if (actual == null) return 'unknown';
    if (op === 'range') {
      var low = expected[0];
      var high = expected[1];
      if (low > high) {
        var swap = low;
        low = high;
        high = swap;
      }
      return actual >= low && actual <= high;
    }
    var number = parseQueryNumber(expected);
    if (number == null) return false;
    if (op === '=') return actual === number;
    if (op === '!=') return actual !== number;
    if (op === '>') return actual > number;
    if (op === '>=') return actual >= number;
    if (op === '<') return actual < number;
    if (op === '<=') return actual <= number;
    return false;
  }

  function queryMods(portal) {
    var mods = queryPortalData(portal).mods;
    if (!mods) return null;
    return mods.filter(Boolean);
  }

  function queryResonators(portal) {
    var list = queryPortalData(portal).resonators;
    if (!list) return null;
    return list.filter(function (reso) { return reso && reso.level; });
  }

  function queryOwner(portal) {
    var data = queryPortalData(portal);
    if (!data.resonators && !data.mods && (data.owner === undefined || data.owner === null)) return null;
    return data.owner || '';
  }

  function modMatchesNeedle(mod, needle) {
    var wanted = String(needle).toLowerCase();
    if (!wanted) return false;
    var label = modLabel(mod).toLowerCase();
    var name = String(mod.name || '').toLowerCase();
    var rarity = String(mod.rarity || '').toLowerCase().replace(/_/g, ' ');
    return label.indexOf(wanted) >= 0 || name.indexOf(wanted) >= 0 || rarity.indexOf(wanted) >= 0;
  }

  function evalQueryFlag(portal, field) {
    var history = queryPortalData(portal).history;
    if (!history) return 'unknown';
    if (field === 'captured') return !!history.captured;
    if (field === 'scout') return !!history.scoutControlled;
    return !!(history.visited || history.captured);
  }

  function evalQueryTeam(portal, node) {
    var team = portal.options.team;
    var token = node.team;
    var matches;
    if (token === 'friendly' || token === 'enemy') {
      var mine = queryPlayerTeam();
      if (mine == null) return 'unknown';
      if (token === 'friendly') matches = team === mine;
      else matches = team !== window.TEAM_NONE && team !== mine;
    } else {
      var id = queryTeamId(token);
      if (id == null) return false;
      matches = team === id;
    }
    return node.op === '!=' ? !matches : matches;
  }

  function evalQueryCmp(node, portal) {
    var field = node.field;
    var data = queryPortalData(portal);
    if (field === 'level') return cmpQueryNumber(portalLevelOf(portal), node.op, node.value);
    if (field === 'team') return evalQueryTeam(portal, node);
    if (field === 'health') return cmpQueryNumber(queryKnownNumber(data.health), node.op, node.value);
    if (field === 'res') return cmpQueryNumber(queryKnownNumber(data.resCount), node.op, node.value);
    if (field === 'links') return cmpQueryNumber(queryLinkCount(portal), node.op, node.value);
    if (field === 'fields') return cmpQueryNumber(queryFieldCount(portal), node.op, node.value);
    if (field === 'ap') return cmpQueryNumber(queryEnemyAp(portal), node.op, node.value);
    if (field === 'shields') {
      var mods = queryMods(portal);
      if (!mods) return 'unknown';
      return cmpQueryNumber(shieldMitigationTotal(mods), node.op, node.value);
    }
    if (field === 'owner') {
      var owner = queryOwner(portal);
      if (owner == null) return 'unknown';
      return cmpQueryString(owner, node.op, queryResolveText(node.value, node.quoted));
    }
    if (field === 'name') return cmpQueryString(queryPortalName(portal), node.op, queryResolveText(node.value, node.quoted));
    if (field === 'mods') return evalQueryMods(portal, node);
    if (field === 'resonator') return evalQueryResonators(portal, node);
    if (field === 'resonatorOwner') return evalQueryResonatorOwners(portal, node);
    if (isQueryFlag(field)) {
      var flag = evalQueryFlag(portal, field);
      if (flag === 'unknown') return 'unknown';
      var wanted = node.flag === true;
      var match = flag === wanted;
      return node.op === '!=' ? !match : match;
    }
    return false;
  }

  function evalQueryMods(portal, node) {
    var mods = queryMods(portal);
    if (!mods) return 'unknown';
    if (node.op === 'has') return mods.some(function (mod) { return modMatchesNeedle(mod, node.value); });
    return cmpQueryNumber(mods.length, node.op, node.value);
  }

  function evalQueryResonators(portal, node) {
    var list = queryResonators(portal);
    if (!list) return 'unknown';
    if (!list.length) return false;
    if (node.op === 'has' || node.op === '=') {
      var level = parseQueryNumber(node.value);
      if (level == null) return false;
      return list.some(function (reso) { return Number(reso.level) === level; });
    }
    var found = false;
    for (var i = 0; i < list.length; i++) {
      if (cmpQueryNumber(Number(list[i].level) || 0, node.op, node.value) === true) found = true;
    }
    return found;
  }

  function evalQueryResonatorOwners(portal, node) {
    var list = queryPortalData(portal).resonators;
    if (!list) return 'unknown';
    var needle = queryResolveText(node.value, node.quoted);
    var found = false;
    list.filter(Boolean).forEach(function (reso) {
      if (cmpQueryString(reso.owner || '', node.op, needle)) found = true;
    });
    return found;
  }

  function queryLinkCount(portal) {
    if (!portal || !portal.options || typeof window.getPortalLinks !== 'function') return null;
    var links = portalLinks(portal.options.guid);
    if (!links) return 0;
    return (links.in ? links.in.length : 0) + (links.out ? links.out.length : 0);
  }

  function queryFieldCount(portal) {
    if (!portal || !portal.options || typeof window.getPortalFieldsCount !== 'function') return null;
    var count = portalFieldCount(portal.options.guid);
    return count == null ? 0 : count;
  }

  function queryEnemyAp(portal) {
    var resCount = queryKnownNumber(queryPortalData(portal).resCount);
    var links = queryLinkCount(portal);
    var fields = queryFieldCount(portal);
    if (resCount == null || links == null || fields == null) return null;
    return window.plugin.portalslist.portalApGainMaths(resCount, links, fields).enemyAp;
  }

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

  function sliceForActiveFilter(slices) {
    var filter = window.plugin.portalslist.filter || 0;
    if (!filter || !slices) return null;
    for (var i = 0; i < slices.length; i++) {
      if (slices[i].filterIndex === filter) return slices[i];
    }
    return null;
  }

  function pieCard(title, slices, outerSlices) {
    var active = sliceForActiveFilter(slices) || sliceForActiveFilter(outerSlices);
    if (active) {
      slices = [active];
      outerSlices = null;
    }
    var card = el('div', 'stats-pie');
    card.appendChild(el('div', 'stats-pie-title', title));
    var body = el('div', 'stats-pie-body');
    var dual = !!outerSlices;
    var hasValues = slicesTotal(slices) > 0 || (dual && slicesTotal(outerSlices) > 0);
    if (!dual) {
      var list = el('ul', 'stats-legend');
      appendLegendItems(list, slices, active ? { hideEmpty: false } : undefined);
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
    scheduleFitLayout();
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
    if (window.plugin.portalslist.queryText == null) window.plugin.portalslist.queryText = '';

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

    $('<style>').prop('type', 'text/css').html('\
  #portalslist.mobile {\
    background: transparent;\
    border: 0 none;\
    height: 100%;\
    width: 100%;\
    left: 0;\
    top: 0;\
    position: absolute;\
    overflow: hidden;\
    display: flex;\
    flex-direction: column;\
  }\
  \
  #portalslist .only-in-polygons {\
    display: inline-block;\
    margin: 6px 0;\
    cursor: pointer;\
    color: #fff;\
  }\
  #portalslist .only-in-polygons input {\
    margin-right: 6px;\
    vertical-align: middle;\
  }\
  \
  #portalslist .section-title {\
    margin: 10px 0 4px;\
    font-weight: bold;\
    font-size: 18px;\
    color: #FFCE00;\
  }\
  \
  #portalslist .stats-pies {\
    display: flex;\
    flex-wrap: nowrap;\
    align-items: stretch;\
    gap: 12px 20px;\
    margin: 4px 0 6px;\
  }\
  \
  #portalslist .stats-pie {\
    display: flex;\
    flex-direction: column;\
    flex: 1 1 auto;\
    min-width: max-content;\
  }\
  \
  #portalslist .stats-pie-title {\
    color: #FFCE00;\
    font-weight: bold;\
    font-size: 14px;\
    margin-bottom: 4px;\
  }\
  \
  #portalslist .stats-pie-body {\
    display: flex;\
    flex: 1 1 auto;\
    flex-direction: row;\
    align-items: center;\
    gap: 10px;\
  }\
  \
  #portalslist .stats-pie canvas {\
    display: block;\
    flex: 0 0 auto;\
  }\
  \
  #portalslist .stats-legend-groups {\
    display: flex;\
    flex-direction: column;\
    align-items: stretch;\
    gap: 8px;\
    flex: 1 1 auto;\
    min-width: max-content;\
  }\
  \
  #portalslist .stats-legend {\
    display: flex;\
    flex-direction: column;\
    align-items: stretch;\
    gap: 3px;\
    list-style: none;\
    margin: 0;\
    padding: 0;\
    flex: 1 1 auto;\
    min-width: max-content;\
  }\
  \
  #portalslist .stats-legend li {\
    display: flex;\
    align-items: baseline;\
    justify-content: space-between;\
    gap: 8px;\
    color: #fff;\
    padding: 1px 6px;\
    border-radius: 2px;\
    line-height: 1.4;\
    text-shadow: 0 0 2px rgba(0, 0, 0, 0.8);\
    white-space: nowrap;\
  }\
  \
  #portalslist .stats-legend-label {\
    min-width: max-content;\
    overflow: visible;\
    text-overflow: clip;\
  }\
  \
  #portalslist .stats-legend-value {\
    margin-left: auto;\
    text-align: right;\
    flex: 0 0 auto;\
    font-variant-numeric: tabular-nums;\
  }\
  \
  #portalslist .stats-legend .stats-filter {\
    cursor: pointer;\
  }\
  \
  #portalslist .stats-legend .active {\
    outline: 2px solid #FFCE00;\
    color: #fff;\
    font-weight: bold;\
  }\
  \
  #portalslist table {\
    margin-top: 5px;\
    border-collapse: collapse;\
    empty-cells: show;\
    width: 100%;\
    clear: both;\
  }\
  \
  #portalslist table td, #portalslist table th {\
    background-color: #1b415e;\
    border-bottom: 1px solid #0b314e;\
    color: white;\
    padding: 1px 3px;\
    white-space: nowrap;\
    vertical-align: middle;\
  }\
  \
  #portalslist table th {\
    text-align: center;\
    padding: 1px 2px;\
    font-weight: normal;\
  }\
  \
  #portalslist table .alignR {\
    text-align: right;\
  }\
  \
  #portalslist table.portals {\
    width: max-content;\
  }\
  \
  #portalslist table.portals td,\
  #portalslist table.portals th {\
    width: 1%;\
  }\
  \
  #portalslist table th.sortable {\
    cursor: pointer;\
  }\
  \
  #portalslist table .portalTitle {\
    max-width: 20ch;\
    width: 20ch;\
    overflow: hidden;\
    text-overflow: ellipsis;\
    white-space: nowrap;\
  }\
  \
  #portalslist table.portals .col-s {\
    width: auto !important;\
    min-width: 48px;\
    box-sizing: border-box;\
    text-align: center;\
    padding-left: 10px;\
    padding-right: 10px;\
  }\
  \
  #portalslist table td.portalTitle a {\
    display: block;\
    overflow: hidden;\
    text-overflow: ellipsis;\
    white-space: nowrap;\
    max-width: 100%;\
  }\
  \
  #portalslist .gear-chip {\
    display: inline-block;\
    margin: 0 1px 0 0;\
    padding: 0 2px;\
    border-radius: 2px;\
    line-height: 14px;\
    font-size: 11px;\
    color: #fff;\
    white-space: nowrap;\
  }\
  \
  #portalslist .sorted {\
    color: #FFCE00;\
  }\
  \
  #portalslist .table-container {\
    overflow-x: hidden;\
    overflow-y: auto;\
    flex: 1 1 auto;\
    min-height: 140px;\
    scrollbar-gutter: stable;\
    padding-right: 2px;\
  }\
  \
  #portalslist,\
  #portalslist > div {\
    display: flex;\
    flex-direction: column;\
    min-height: 0;\
    height: 100%;\
  }\
  \
  #portalslist {\
    overflow: hidden;\
    box-sizing: border-box;\
  }\
  \
  #portalslist .only-in-polygons,\
  #portalslist .section-title,\
  #portalslist .stats-pies,\
  #portalslist .detail-status,\
  #portalslist .selection-actions {\
    flex-shrink: 0;\
  }\
  \
  #portalslist .detail-status {\
    color: #FFCE00;\
    margin-top: 10px;\
    min-height: 1.2em;\
  }\
  \
  #portalslist .detail-status:empty {\
    display: none;\
  }\
  \
  #portalslist .selection-actions {\
    display: flex;\
    flex-wrap: wrap;\
    gap: 8px;\
    margin-top: 8px;\
  }\
  \
  #portalslist .selection-actions button {\
    cursor: pointer;\
    padding: 4px 10px;\
    border: 1px solid #0b314e;\
    background: #1b415e;\
    color: #FFCE00;\
  }\
  \
  #portalslist .selection-actions button:hover {\
    background: #25557a;\
  }\
  \
  #portalslist .portal-query {\
    display: inline-flex;\
    align-items: center;\
    gap: 6px;\
    flex: 1 1 240px;\
    min-width: 0;\
  }\
  \
  #portalslist .portal-query-input {\
    flex: 1 1 180px;\
    width: 220px;\
    min-width: 120px;\
    padding: 4px 8px;\
    border: 1px solid #0b314e;\
    background: #0d2c42;\
    color: #fff;\
    font: inherit;\
  }\
  \
  #portalslist .portal-query-input.query-error {\
    color: #ff4d4d;\
    border-color: #ff4d4d;\
    box-shadow: inset 0 0 0 1px #ff4d4d;\
  }\
  \
  .ui-dialog.ui-dialog-portalslist-csv .ui-dialog-content {\
    overflow: hidden !important;\
    box-sizing: border-box;\
    padding-bottom: 10px;\
  }\
  \
  .portalslist-csv-export {\
    display: block;\
    width: 100%;\
    box-sizing: border-box;\
    resize: none;\
    margin: 0;\
    font-family: Menlo, Consolas, monospace;\
    font-size: 12px;\
    white-space: pre;\
  }\
  \
  .ui-dialog.ui-dialog-portalslist-csv .ui-dialog-buttonpane {\
    text-align: right;\
  }\
  \
  .ui-dialog.ui-dialog-portalslist-csv .ui-dialog-buttonset {\
    display: inline-flex;\
    flex-wrap: wrap;\
    justify-content: flex-end;\
    float: none;\
    gap: 12px;\
  }\
  \
  .ui-dialog.ui-dialog-portalslist-csv .ui-dialog-buttonset .ui-button {\
    margin: 0 !important;\
  }\
  \
  #portalslist table .col-select {\
    width: 28px !important;\
    text-align: center;\
    padding-left: 4px;\
    padding-right: 4px;\
  }\
  \
  #portalslist table .col-select input {\
    margin: 0;\
    vertical-align: middle;\
  }\
  \
  #portalslist .table-container table.portals thead th {\
    position: sticky;\
    top: 0;\
    z-index: 2;\
    background-color: #1b415e;\
  }\
  \
  #portalslist table.portals td.history {\
    text-align: center;\
  }\
  \
  #portalslist table.portals td.history.unvisited {\
    background-color: #666666 !important;\
    color: #fff !important;\
  }\
  \
  #portalslist table.portals td.history.visited {\
    background-color: #c9a000 !important;\
    color: #fff !important;\
  }\
  \
  #portalslist table.portals td.history.captured {\
    background-color: #e40000 !important;\
    color: #fff !important;\
  }\
  \
  #portalslist table.portals td.history.scoutControlled {\
    background-color: #6a1b9a !important;\
    color: #fff !important;\
  }\
  \
  #portalslist table tr.res td {\
    background-color: #005684;\
  }\
  \
  #portalslist table tr.enl td {\
    background-color: #017f01;\
  }\
  \
  #portalslist table tr.mac td {\
    background-color: #a00;\
  }\
  \
  #portalslist table tr.none td {\
    background-color: #666666;\
  }\
  \
  .ui-dialog.ui-dialog-portalslist .ui-dialog-titlebar-button-help {\
    right: 46px;\
    color: rgb(32, 168, 177);\
    font-weight: bold;\
    font-size: 14px;\
    line-height: 15px;\
  }\
  \
  .ui-dialog.ui-dialog-portalslist .ui-dialog-titlebar-button-help:active {\
    color: rgba(8, 60, 78, 0.9);\
  }\
  \
  .ui-dialog.ui-dialog-portalslist .ui-dialog-title {\
    margin-right: 72px;\
  }\
  \
  .ui-dialog.ui-dialog-portalslist {\
    max-width: calc(100vw - 2px);\
    max-height: calc(100vh - 8px);\
  }\
  \
  .ui-dialog.ui-dialog-portalslist .ui-dialog-content {\
    overflow: hidden;\
    display: flex;\
    flex-direction: column;\
    box-sizing: border-box;\
  }\
  \
  .portalslist-help h3 {\
    margin: 14px 0 6px;\
    color: #FFCE00;\
    font-size: 15px;\
  }\
  \
  .portalslist-help p,\
  .portalslist-help li {\
    margin: 4px 0;\
  }\
  \
  .portalslist-help ul {\
    margin: 4px 0 8px;\
    padding-left: 1.2em;\
  }\
  \
  .portalslist-help code {\
    font-family: Menlo, Consolas, monospace;\
    font-size: 12px;\
  }\
  ').appendTo('head');
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
  setup.info = plugin_info; //add the script info data to the function as a property
  if (typeof changelog !== 'undefined') setup.info.changelog = changelog;
  if(!window.bootPlugins) window.bootPlugins = [];
  window.bootPlugins.push(setup);
  // if IITC has already booted, immediately run the 'setup' function
  if(window.iitcLoaded && typeof setup === 'function') setup();
  } // wrapper end
  // inject code into site context
  var script = document.createElement('script');
  var info = {};
  if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
  script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
  (document.body || document.head || document.documentElement).appendChild(script);
  
  