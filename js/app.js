/**
 * 数据地图前端逻辑
 * 通过 supabase-js 从 Supabase REST API 读取 dw_tables 表
 * 安全说明：
 * 1. 此处使用的是 anon 公开密钥（设计上可暴露于前端），
 *    数据访问权限由数据库 RLS 策略控制（仅允许只读）。
 * 2. 渲染全部使用 DOM API + textContent，杜绝 XSS。
 */

const SUPABASE_URL = 'https://qrsyerzgxiybzusjmvbs.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyc3llcnpneGl5Ynp1c2ptdmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMTMxODUsImV4cCI6MjEwMTU4OTE4NX0.sZqmMSK4KWcQGPokH-R0mXtUI1-DF3Vewnd8ej4mShA';

const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 层级展示顺序
const LAYER_ORDER = ['ODS', 'DWD', 'DWS', 'DIM', 'ADS'];

let allRows = [];

// ---------- 初始化 ----------
document.addEventListener('DOMContentLoaded', init);

async function init() {
  bindEvents();
  await loadData();
}

async function loadData() {
  const { data, error } = await client
    .from('dw_tables')
    .select('project_name, layer, data_domain, table_cn_name, table_en_name, task_type')
    .order('layer', { ascending: true })
    .order('table_en_name', { ascending: true });

  const loading = document.getElementById('loading');
  const errorBox = document.getElementById('error');

  if (error) {
    loading.hidden = true;
    errorBox.hidden = false;
    errorBox.textContent = '加载失败：' + error.message + '（请检查 Supabase 连接配置）';
    return;
  }

  allRows = data || [];
  loading.hidden = true;
  renderStats();
  renderLayerNav();
  fillFilters();
  applyFilters();
}

// ---------- 渲染 ----------
function renderStats() {
  document.getElementById('stat-total').textContent = allRows.length;
  document.getElementById('stat-projects').textContent = new Set(allRows.map((r) => r.project_name)).size;
  document.getElementById('stat-layers').textContent = new Set(allRows.map((r) => r.layer)).size;
}

function renderLayerNav() {
  const nav = document.getElementById('layer-nav');
  nav.textContent = '';

  const counts = {};
  allRows.forEach((r) => (counts[r.layer] = (counts[r.layer] || 0) + 1));

  const chips = [{ layer: '', label: '全部', count: allRows.length }].concat(
    LAYER_ORDER.filter((l) => counts[l]).map((l) => ({ layer: l, label: l, count: counts[l] }))
  );

  chips.forEach((c) => {
    const chip = document.createElement('span');
    chip.className = 'layer-chip' + (c.layer === '' ? ' active' : '');
    chip.dataset.layer = c.layer;
    chip.append(c.label);

    const count = document.createElement('span');
    count.className = 'chip-count';
    count.textContent = c.count;
    chip.append(count);

    chip.addEventListener('click', () => {
      nav.querySelectorAll('.layer-chip').forEach((el) => el.classList.remove('active'));
      chip.classList.add('active');
      document.getElementById('filter-layer').value = c.layer;
      applyFilters();
    });

    nav.append(chip);
  });
}

function fillFilters() {
  fillSelect('filter-project', distinct(allRows.map((r) => r.project_name)));
  fillSelect('filter-layer', LAYER_ORDER.filter((l) => allRows.some((r) => r.layer === l)));
  fillSelect('filter-task', distinct(allRows.map((r) => r.task_type)));
}

function fillSelect(id, values) {
  const sel = document.getElementById(id);
  const firstOption = sel.options[0];
  sel.textContent = '';
  sel.append(firstOption);
  values.forEach((v) => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    sel.append(opt);
  });
}

function distinct(arr) {
  return [...new Set(arr)].sort();
}

// ---------- 过滤 ----------
function bindEvents() {
  ['search', 'filter-project', 'filter-layer', 'filter-task'].forEach((id) => {
    document.getElementById(id).addEventListener('input', applyFilters);
  });
  document.getElementById('btn-reset').addEventListener('click', () => {
    document.getElementById('search').value = '';
    ['filter-project', 'filter-layer', 'filter-task'].forEach((id) => (document.getElementById(id).value = ''));
    renderLayerNav();
    applyFilters();
  });
}

function applyFilters() {
  const kw = document.getElementById('search').value.trim().toLowerCase();
  const project = document.getElementById('filter-project').value;
  const layer = document.getElementById('filter-layer').value;
  const task = document.getElementById('filter-task').value;

  const rows = allRows.filter((r) => {
    if (project && r.project_name !== project) return false;
    if (layer && r.layer !== layer) return false;
    if (task && r.task_type !== task) return false;
    if (kw) {
      const text = [r.project_name, r.layer, r.data_domain, r.table_cn_name, r.table_en_name, r.task_type]
        .join(' ')
        .toLowerCase();
      if (!text.includes(kw)) return false;
    }
    return true;
  });

  renderTable(rows);
}

function renderTable(rows) {
  const table = document.getElementById('data-table');
  const empty = document.getElementById('empty');
  const tbody = document.getElementById('tbody');

  document.getElementById('footer-count').textContent = rows.length;

  if (!rows.length) {
    table.hidden = true;
    empty.hidden = false;
    return;
  }

  empty.hidden = true;
  table.hidden = false;
  tbody.textContent = '';

  rows.forEach((r, i) => {
    const tr = document.createElement('tr');

    const cells = [
      String(i + 1),
      r.project_name,
      null, // 层级徽章单独处理
      r.data_domain || '-',
      r.table_cn_name,
      null, // 英文表名单独处理
      r.task_type,
    ];

    cells.forEach((text, idx) => {
      const td = document.createElement('td');
      if (idx === 2) {
        const badge = document.createElement('span');
        badge.className = 'badge badge-layer-' + r.layer;
        badge.textContent = r.layer;
        td.append(badge);
      } else if (idx === 5) {
        td.className = 'col-en';
        td.textContent = r.table_en_name;
      } else {
        td.textContent = text;
      }
      tr.append(td);
    });

    tbody.append(tr);
  });
}
