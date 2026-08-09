<script setup>
/**
 * Lumen 首页：数仓元数据总览
 * 视觉延续登录页的 Claude 暖色语言：#FAF9F5 背景、Anthropic Serif 标题、
 * 白底/同色大圆角卡片 + #E3E1DA 边框、近黑主按钮。
 * 数据源：Supabase dw_tables（登录后可读，见产品文档 §六 RLS）。
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { supabase } from '@/lib/supabase'

// 层级展示顺序
const LAYER_ORDER = ['ODS', 'DWD', 'DWS', 'DIM', 'ADS']

const router = useRouter()
const email = ref('')

const loading = ref(true)
const loadError = ref('')
const allRows = ref([])

// 筛选状态
const search = ref('')
const filterProject = ref('')
const filterLayer = ref('')
const filterTask = ref('')

function distinct(arr) {
  return [...new Set(arr)].sort()
}

const projects = computed(() => distinct(allRows.value.map((r) => r.project_name)))
const tasks = computed(() => distinct(allRows.value.map((r) => r.task_type)))
const domains = computed(() =>
  distinct(allRows.value.map((r) => r.data_domain).filter(Boolean))
)

const stats = computed(() => ({
  total: allRows.value.length,
  projects: projects.value.length,
  layers: distinct(allRows.value.map((r) => r.layer)).length,
  domains: domains.value.length,
}))

// 层级胶囊：全部 + 有数据的层级
const layerChips = computed(() => {
  const counts = {}
  allRows.value.forEach((r) => (counts[r.layer] = (counts[r.layer] || 0) + 1))
  return [{ layer: '', count: allRows.value.length }].concat(
    LAYER_ORDER.filter((l) => counts[l]).map((l) => ({ layer: l, count: counts[l] }))
  )
})

const filteredRows = computed(() => {
  const kw = search.value.trim().toLowerCase()
  return allRows.value.filter((r) => {
    if (filterProject.value && r.project_name !== filterProject.value) return false
    if (filterLayer.value && r.layer !== filterLayer.value) return false
    if (filterTask.value && r.task_type !== filterTask.value) return false
    if (kw) {
      const text = [
        r.project_name,
        r.layer,
        r.data_domain,
        r.table_cn_name,
        r.table_en_name,
        r.task_type,
      ]
        .join(' ')
        .toLowerCase()
      if (!text.includes(kw)) return false
    }
    return true
  })
})

onMounted(async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  email.value = session?.user?.email || ''
  await loadData()
})

async function loadData() {
  loading.value = true
  loadError.value = ''
  const { data, error } = await supabase
    .from('dw_tables')
    .select('project_name, layer, data_domain, table_cn_name, table_en_name, task_type')
    .order('layer', { ascending: true })
    .order('table_en_name', { ascending: true })
  if (error) {
    loadError.value = error.message
  } else {
    allRows.value = data || []
  }
  loading.value = false
}

function pickLayer(layer) {
  filterLayer.value = layer
}

function resetFilters() {
  search.value = ''
  filterProject.value = ''
  filterLayer.value = ''
  filterTask.value = ''
}

async function logout() {
  await supabase.auth.signOut()
  ElMessage.success('已退出登录')
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="map-page">
    <!-- 毛玻璃吸顶导航栏 -->
    <nav class="navbar">
      <div class="nav-inner">
        <div class="brand">
          <img class="brand-logo" src="/logo.png" alt="Lumen" />
          <span class="brand-name">Lumen</span>
        </div>
        <div class="nav-right">
          <span class="user-email">{{ email }}</span>
          <button class="logout-btn" type="button" @click="logout">退出登录</button>
        </div>
      </div>
    </nav>

    <main class="container">
      <!-- Hero -->
      <header class="hero">
        <h1>数仓元数据总览</h1>
        <p class="hero-sub">Illuminate what&rsquo;s stored · 项目 / 层级 / 数据域 / 任务类型，一览无余</p>
      </header>

      <!-- 统计卡片 -->
      <section class="stats">
        <div class="stat-card">
          <span class="stat-num">{{ stats.total }}</span>
          <span class="stat-label">表总数</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">{{ stats.projects }}</span>
          <span class="stat-label">项目</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">{{ stats.layers }}</span>
          <span class="stat-label">层级</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">{{ stats.domains }}</span>
          <span class="stat-label">数据域</span>
        </div>
      </section>

      <!-- 层级胶囊 -->
      <section class="chips">
        <button
          v-for="c in layerChips"
          :key="c.layer || 'all'"
          type="button"
          class="layer-chip"
          :class="{ active: filterLayer === c.layer }"
          @click="pickLayer(c.layer)"
        >
          {{ c.layer || '全部' }}
          <span class="chip-count">{{ c.count }}</span>
        </button>
      </section>

      <!-- 筛选工具条 -->
      <section class="toolbar">
        <input
          v-model="search"
          class="search-input"
          type="text"
          placeholder="搜索表名 / 数据域 / 项目…"
        />
        <select v-model="filterProject" class="filter-select">
          <option value="">全部项目</option>
          <option v-for="p in projects" :key="p" :value="p">{{ p }}</option>
        </select>
        <select v-model="filterTask" class="filter-select">
          <option value="">全部任务类型</option>
          <option v-for="t in tasks" :key="t" :value="t">{{ t }}</option>
        </select>
        <button class="reset-btn" type="button" @click="resetFilters">重置</button>
      </section>

      <!-- 数据表格 -->
      <section class="table-card">
        <div v-if="loading" class="state-box">正在点亮数据…</div>

        <div v-else-if="loadError" class="state-box">
          <p>加载失败：{{ loadError }}</p>
          <button class="retry-btn" type="button" @click="loadData">重试</button>
        </div>

        <div v-else-if="!filteredRows.length" class="state-box">
          没有匹配的表，试试调整筛选条件
        </div>

        <table v-else class="data-table">
          <thead>
            <tr>
              <th class="col-idx">#</th>
              <th>项目</th>
              <th>层级</th>
              <th>数据域</th>
              <th>中文表名</th>
              <th>英文表名</th>
              <th>任务类型</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in filteredRows" :key="r.table_en_name + i">
              <td class="col-idx">{{ i + 1 }}</td>
              <td>{{ r.project_name }}</td>
              <td><span class="badge" :class="'badge-' + r.layer">{{ r.layer }}</span></td>
              <td class="col-muted">{{ r.data_domain || '-' }}</td>
              <td>{{ r.table_cn_name }}</td>
              <td class="col-en">{{ r.table_en_name }}</td>
              <td>{{ r.task_type }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <footer class="table-footer">共 {{ filteredRows.length }} 张表</footer>
    </main>
  </div>
</template>

<style scoped>
.map-page {
  min-height: 100vh;
  background: #ffffff;
  color: #141413;
  font-family: 'Anthropic Sans', -apple-system, 'Helvetica Neue', 'PingFang SC',
    Arial, sans-serif;
}

/* 导航栏 */
.navbar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-bottom: 1px solid #e9e9e7;
}
.nav-inner {
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 24px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}
.brand-logo {
  width: 26px;
  height: 26px;
  border-radius: 7px;
  border: 1px solid #e9e9e7;
  object-fit: contain;
}
.brand-name {
  font-family: 'Anthropic Serif', 'Tiempos Headline', Georgia, 'Songti SC',
    'Times New Roman', serif;
  font-size: 19px;
  font-weight: 600;
}
.nav-right {
  display: flex;
  align-items: center;
  gap: 14px;
}
.user-email {
  font-size: 13px;
  color: #5e5d59;
}
.logout-btn {
  height: 32px;
  padding: 0 14px;
  border: 1px solid #e9e9e7;
  border-radius: 999px;
  background: transparent;
  color: #141413;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s ease;
}
.logout-btn:hover {
  background: #f5f5f4;
}

.container {
  max-width: 1080px;
  margin: 0 auto;
  padding: 48px 24px 64px;
}

/* Hero */
.hero h1 {
  font-family: 'Anthropic Serif', 'Tiempos Headline', Georgia, 'Songti SC',
    'Times New Roman', serif;
  font-size: clamp(32px, 3.6vw, 48px);
  font-weight: 400;
  letter-spacing: -0.5px;
}
.hero-sub {
  margin-top: 10px;
  font-family: 'Anthropic Serif', 'Tiempos Headline', Georgia, 'Songti SC',
    'Times New Roman', serif;
  font-size: 16px;
  color: #5e5d59;
}

/* 统计卡片 */
.stats {
  margin-top: 36px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.stat-card {
  background: #ffffff;
  border: 1px solid #e9e9e7;
  border-radius: 16px;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.stat-num {
  font-family: 'Anthropic Serif', 'Tiempos Headline', Georgia, 'Songti SC',
    'Times New Roman', serif;
  font-size: 32px;
  line-height: 1.1;
}
.stat-label {
  font-size: 13px;
  color: #5e5d59;
}

/* 层级胶囊 */
.chips {
  margin-top: 28px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.layer-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 34px;
  padding: 0 14px;
  border: 1px solid #e9e9e7;
  border-radius: 999px;
  background: transparent;
  color: #141413;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}
.layer-chip:hover {
  background: #f5f5f4;
}
.layer-chip.active {
  background: #141413;
  border-color: #141413;
  color: #faf9f5;
}
.chip-count {
  font-size: 12px;
  opacity: 0.65;
}

/* 筛选工具条 */
.toolbar {
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}
.search-input {
  flex: 1;
  min-width: 220px;
  height: 40px;
  padding: 0 14px;
  font-size: 14px;
  font-family: inherit;
  color: #141413;
  background: #ffffff;
  border: 1px solid #e4e4e2;
  border-radius: 10px;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.search-input::placeholder {
  color: #9b9a94;
}
.search-input:focus {
  border-color: #409eff;
  box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.15);
}
.filter-select {
  height: 40px;
  padding: 0 12px;
  font-size: 14px;
  font-family: inherit;
  color: #141413;
  background: #ffffff;
  border: 1px solid #e4e4e2;
  border-radius: 10px;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.filter-select:focus {
  border-color: #409eff;
  box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.15);
}
.reset-btn {
  height: 40px;
  padding: 0 18px;
  border: none;
  border-radius: 10px;
  background: #141413;
  color: #faf9f5;
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s ease;
}
.reset-btn:hover {
  background: #000000;
}

/* 表格卡片 */
.table-card {
  margin-top: 20px;
  background: #ffffff;
  border: 1px solid #e9e9e7;
  border-radius: 16px;
  overflow: hidden;
}
.state-box {
  padding: 64px 24px;
  text-align: center;
  color: #5e5d59;
  font-size: 15px;
}
.retry-btn {
  margin-top: 16px;
  height: 36px;
  padding: 0 20px;
  border: none;
  border-radius: 10px;
  background: #141413;
  color: #faf9f5;
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.data-table th {
  padding: 14px 16px;
  text-align: left;
  font-size: 12px;
  font-weight: 500;
  color: #5e5d59;
  background: #fafafa;
  border-bottom: 1px solid #e9e9e7;
  white-space: nowrap;
}
.data-table td {
  padding: 13px 16px;
  border-bottom: 1px solid #f2f2f0;
  vertical-align: middle;
}
.data-table tbody tr:last-child td {
  border-bottom: none;
}
.data-table tbody tr:hover {
  background: #fafafa;
}
.col-idx {
  width: 44px;
  color: #9b9a94;
}
.col-muted {
  color: #5e5d59;
}
.col-en {
  font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
  font-size: 13px;
  color: #3d3c38;
}

/* 层级徽章：暖色系分层配色 */
.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.4px;
}
.badge-ODS {
  background: #efede5;
  color: #6e6a5e;
}
.badge-DWD {
  background: #e5efe7;
  color: #3e6b4f;
}
.badge-DWS {
  background: #e5ecf3;
  color: #3d5a80;
}
.badge-DIM {
  background: #ece7f2;
  color: #6b5b8e;
}
.badge-ADS {
  background: #f6e7df;
  color: #c15f3c;
}

.table-footer {
  margin-top: 14px;
  font-size: 13px;
  color: #5e5d59;
  text-align: right;
}

/* 窄屏适配 */
@media (max-width: 720px) {
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .table-card {
    overflow-x: auto;
  }
  .data-table {
    min-width: 720px;
  }
}
</style>
