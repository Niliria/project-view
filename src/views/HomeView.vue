<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { supabase } from '@/lib/supabase'

const router = useRouter()

/* 会话信息（仅用于顶栏展示，不读业务数据） */
const userEmail = ref('')
const avatarChar = ref('')
onMounted(async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  userEmail.value = session?.user?.email || ''
  avatarChar.value = (userEmail.value[0] || 'L').toUpperCase()
})

async function logout() {
  await supabase.auth.signOut()
  ElMessage.success('已退出登录')
  router.push({ name: 'login' })
}

/* 提示条 */
const toast = ref(null)
const toastMsg = ref('')
let toastTimer
function showToast(msg) {
  toastMsg.value = msg
  toast.value?.classList.add('show')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toast.value?.classList.remove('show'), 2200)
}
function enterModule(name) {
  /* 交付项目 - 跳转到 prototype/project.html */
  if (name === '交付项目') {
    window.location.href = '/prototype/project.html';
    return;
  }
  showToast(`进入「${name}」模块明细 —— 功能开发中`)
}
function plannedCategory(e, name) {
  e.stopPropagation()
  showToast(`「${name}」规划中 · 等待第一个项目把它沉淀出来`)
}

/* 动效：滚动入场 + 数字滚动（一次性播放） */
function animateNum(el) {
  const target = parseFloat(el.dataset.n)
  const textNode = el.childNodes[0]
  const dur = 900
  const t0 = performance.now()
  const tick = (t) => {
    const p = Math.min(1, (t - t0) / dur)
    const eased = 1 - Math.pow(1 - p, 3)
    textNode.nodeValue = Math.round(target * eased)
    if (p < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

let observer
onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return
        const el = en.target
        el.classList.add('in')
        const num = el.querySelector('.stat-num[data-n]')
        if (num) setTimeout(() => animateNum(num), 150)
        observer.unobserve(el)
      })
    },
    { threshold: 0.15 }
  )
  document.querySelectorAll('.home-page .reveal').forEach((el) => observer.observe(el))
  /* 资产版图行逐行错峰入场 */
  document.querySelectorAll('.home-page .layer-row.reveal').forEach((el, i) => {
    el.style.animationDelay = i * 0.07 + 's'
  })
})
onBeforeUnmount(() => {
  observer?.disconnect()
  clearTimeout(toastTimer)
})
</script>

<template>
  <div class="home-page">
    <header class="navbar">
      <div class="brand"><img src="/logo.png" alt="Lumen" />Lumen</div>
      <div class="nav-sep"></div>
      <span class="nav-title">交付项目里萃取出的行业认知与可复用资产</span>
      <div class="nav-right">
        <span class="nav-account"><span class="nav-avatar">{{ avatarChar }}</span>{{ userEmail }}</span>
        <button class="logout-btn" @click="logout">退出</button>
      </div>
    </header>

    <main class="page">
      <!-- 资产总览 -->
      <div class="sec-head">
        <h2>资产总览</h2>
        <span class="sec-desc">五类核心资产 · 点击卡片进入模块明细</span>
      </div>
      <div class="stats">
        <div class="stat-card reveal" @click="enterModule('交付项目')">
          <div class="stat-num" data-n="2">0<small>个</small></div>
          <div class="stat-label">交付项目</div>
          <div class="stat-delta">能源管网 · 城市燃气</div>
        </div>
        <div class="stat-card reveal" @click="enterModule('主数据')">
          <div class="stat-num" data-n="15">0<small>类</small></div>
          <div class="stat-label">主数据</div>
          <div class="stat-delta">人员/组织/客户/设备…</div>
        </div>
        <div class="stat-card reveal" @click="enterModule('数据域')">
          <div class="stat-num" data-n="12">0<small>个</small></div>
          <div class="stat-label">数据域</div>
          <div class="stat-delta">其中 5 个跨行业通用</div>
        </div>
        <div class="stat-card reveal" @click="enterModule('数据标准')">
          <div class="stat-num" data-n="68">0<small>条</small></div>
          <div class="stat-label">数据标准</div>
          <div class="stat-delta">命名/字段/代码标准</div>
        </div>
        <div class="stat-card reveal" @click="enterModule('指标定义')">
          <div class="stat-num" data-n="31">0<small>个</small></div>
          <div class="stat-label">指标定义</div>
          <div class="stat-delta">12 原子 · 19 派生</div>
        </div>
      </div>

      <!-- 资产版图 -->
      <div class="section">
        <div class="sec-head">
          <h2>资产版图</h2>
          <span class="sec-desc">五层十八类 · 点击进入模块明细</span>
        </div>
        <div class="card layer-card">
          <div class="layer-row reveal" @click="enterModule('行业认知层')">
            <div>
              <div class="layer-name"><span class="dot l1"></span>行业认知层</div>
              <div class="layer-sub">业务 know-how · 最稀缺</div>
            </div>
            <div class="cats">
              <span class="cat">术语词典<span class="n">24</span></span>
              <span class="cat">业务规则<span class="n">18</span></span>
              <span class="cat">指标定义<span class="n">31</span></span>
              <span class="cat planned" @click="plannedCategory($event, '业务流程')">业务流程</span>
              <span class="cat planned" @click="plannedCategory($event, '标准法规')">标准法规</span>
            </div>
            <div class="layer-total"><div class="big">73</div><div class="cap">条知识</div></div>
            <div class="arrow">›</div>
          </div>

          <div class="layer-row reveal" @click="enterModule('模型资产层')">
            <div>
              <div class="layer-name"><span class="dot l2"></span>模型资产层</div>
              <div class="layer-sub">可直接搬的半成品</div>
            </div>
            <div class="cats">
              <span class="cat">通用维模<span class="n">8</span></span>
              <span class="cat">参考模型<span class="n">3</span></span>
              <span class="cat planned" @click="plannedCategory($event, '数据域划分')">数据域划分</span>
              <span class="cat planned" @click="plannedCategory($event, '分层标准')">分层标准</span>
            </div>
            <div class="layer-total"><div class="big">11</div><div class="cap">条知识</div></div>
            <div class="arrow">›</div>
          </div>

          <div class="layer-row reveal" @click="enterModule('规范层')">
            <div>
              <div class="layer-name"><span class="dot l3"></span>规范层</div>
              <div class="layer-sub">语言与度量衡</div>
            </div>
            <div class="cats">
              <span class="cat">命名词根<span class="n">45</span></span>
              <span class="cat planned" @click="plannedCategory($event, '数据标准')">数据标准</span>
              <span class="cat planned" @click="plannedCategory($event, '开发规范')">开发规范</span>
              <span class="cat planned" @click="plannedCategory($event, '质量规则')">质量规则</span>
            </div>
            <div class="layer-total"><div class="big">45</div><div class="cap">条知识</div></div>
            <div class="arrow">›</div>
          </div>

          <div class="layer-row reveal" @click="enterModule('工程层')">
            <div>
              <div class="layer-name"><span class="dot l4"></span>工程层</div>
              <div class="layer-sub">手上功夫</div>
            </div>
            <div class="cats">
              <span class="cat planned" @click="plannedCategory($event, '代码片段')">代码片段</span>
              <span class="cat planned" @click="plannedCategory($event, '平台经验')">平台经验</span>
              <span class="cat planned" @click="plannedCategory($event, '调度模板')">调度模板</span>
            </div>
            <div class="layer-total"><div class="big">3</div><div class="cap">条知识</div></div>
            <div class="arrow">›</div>
          </div>

          <div class="layer-row reveal" @click="enterModule('方法论层')">
            <div>
              <div class="layer-name"><span class="dot l5"></span>方法论层</div>
              <div class="layer-sub">做事的方法</div>
            </div>
            <div class="cats">
              <span class="cat planned" @click="plannedCategory($event, '需求翻译案例')">需求翻译案例</span>
              <span class="cat planned" @click="plannedCategory($event, '交付 SOP')">交付 SOP</span>
            </div>
            <div class="layer-total"><div class="big">0</div><div class="cap">条知识</div></div>
            <div class="arrow">›</div>
          </div>
        </div>
      </div>

      <!-- 复用价值 -->
      <div class="section">
        <div class="sec-head">
          <h2>复用价值</h2>
          <span class="sec-desc">被最多项目复用的资产 · 复用次数 = 价值刻度</span>
        </div>
        <div class="panel reveal">
          <div class="top-list">
            <div class="top-item">
              <span class="rk">1</span>
              <span class="top-name mono">dim_date<span class="tp">通用维模 · 时间类</span></span>
              <span class="top-badge">2 个项目复用</span>
            </div>
            <div class="top-item">
              <span class="rk">2</span>
              <span class="top-name">日输差率<span class="tp">指标口径 · 原子指标</span></span>
              <span class="top-badge">2 个项目复用</span>
            </div>
            <div class="top-item">
              <span class="rk">3</span>
              <span class="top-name mono">cust<span class="tp">词根 · 客户</span></span>
              <span class="top-badge">2 个项目复用</span>
            </div>
            <div class="top-item">
              <span class="rk">4</span>
              <span class="top-name">财务核算参考模型<span class="tp">参考模型 · v0.2</span></span>
              <span class="top-badge hero">跨行业通用</span>
            </div>
            <div class="top-item">
              <span class="rk">5</span>
              <span class="top-name mono">dim_hr_emp<span class="tp">通用维模 · 人事类</span></span>
              <span class="top-badge hero">跨行业通用</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 行业覆盖 -->
      <div class="section">
        <div class="sec-head">
          <h2>行业覆盖</h2>
          <span class="sec-desc">做数仓 = 做一个行业的知识积累</span>
        </div>
        <div class="ind-grid">
          <div class="ind-card reveal" @click="enterModule('能源管网行业')">
            <div class="ind-name">能源管网</div>
            <div class="ind-nums">
              <div><div class="n">1</div><div class="c">交付项目</div></div>
              <div><div class="n">50</div><div class="c">模型表</div></div>
              <div><div class="n">84</div><div class="c">知识条目</div></div>
              <div><div class="n">92%</div><div class="c">命名合规</div></div>
            </div>
            <div class="ind-foot">计量诊断 · 输差治理 · 气质监测 —— 该行业知识已具备对外输出能力</div>
          </div>
          <div class="ind-card reveal" @click="enterModule('城市燃气行业')">
            <div class="ind-name">城市燃气</div>
            <div class="ind-nums">
              <div><div class="n">1</div><div class="c">交付项目</div></div>
              <div><div class="n">32</div><div class="c">模型表</div></div>
              <div><div class="n">48</div><div class="c">知识条目</div></div>
              <div><div class="n">87%</div><div class="c">命名合规</div></div>
            </div>
            <div class="ind-foot">供销差治理 · 抄表质量 · 购销存 —— 复用能源管网沉淀 12 项资产</div>
          </div>
        </div>
      </div>
    </main>

    <div class="toast" ref="toast">{{ toastMsg }}</div>
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  background: #ffffff;
  color: #141413;
  font-family: "Anthropic Sans", "Helvetica Neue", "PingFang SC", -apple-system, sans-serif;
}
.mono { font-family: "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace; }

/* ---------- 顶栏 ---------- */
.navbar {
  position: sticky; top: 0; z-index: 20;
  display: flex; align-items: center; gap: 12px;
  padding: 14px 40px;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid #e9e9e7;
}
.brand { display: flex; align-items: center; gap: 10px; font-weight: 600; font-size: 17px; }
.brand img { width: 26px; height: 26px; border-radius: 7px; border: 1px solid #e9e9e7; object-fit: contain; }
.nav-sep { width: 1px; height: 18px; background: #e9e9e7; }
.nav-title { font-size: 14px; color: #5e5d59; }
.nav-right { margin-left: auto; display: flex; align-items: center; gap: 12px; }
.nav-account { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #5e5d59; }
.nav-avatar {
  width: 26px; height: 26px; border-radius: 50%; background: #f5f5f4; border: 1px solid #e9e9e7;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 600; color: #5e5d59;
}
.logout-btn {
  height: 30px; padding: 0 13px; font-size: 12.5px; color: #5e5d59;
  background: #ffffff; border: 1px solid #e4e4e2; border-radius: 10px; cursor: pointer;
}
.logout-btn:hover { background: #f5f5f4; }

/* ---------- 主体 ---------- */
.page { max-width: 1160px; margin: 0 auto; padding: 38px 40px 90px; }

/* ---------- 全局数字 ---------- */
.stats { margin-top: 14px; display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; }
.stat-card { background: #ffffff; border: 1px solid #e9e9e7; border-radius: 14px; padding: 18px 20px; cursor: pointer; transition: border-color .15s, transform .3s ease; }
.stat-card:hover { border-color: #c9c8c3; transform: translateY(-2px); }
.stat-num { font-size: 28px; font-weight: 600; letter-spacing: -0.02em; }
.stat-num small { font-size: 14px; color: #9b9a94; font-weight: 400; margin-left: 2px; }
.stat-label { margin-top: 4px; font-size: 12.5px; color: #9b9a94; }
.stat-delta { margin-top: 8px; font-size: 11.5px; color: #3e6b4f; }

/* ---------- 区块 ---------- */
.section { margin-top: 34px; }
.sec-head { display: flex; align-items: baseline; gap: 10px; }
.sec-head h2 { font-size: 18px; font-weight: 600; }
.sec-desc { font-size: 12.5px; color: #9b9a94; margin-left: auto; }
.card { background: #ffffff; border: 1px solid #e9e9e7; border-radius: 16px; margin-top: 14px; }
.layer-card { padding: 8px 20px; }

/* ---------- 资产版图：五层 ---------- */
.layer-row {
  display: grid; grid-template-columns: 190px 1fr 120px 24px; gap: 18px; align-items: center;
  padding: 18px 6px; border-bottom: 1px solid #f0f0ee; cursor: pointer; border-radius: 10px;
}
.layer-row:last-child { border-bottom: none; }
.layer-row:hover { background: #fafafa; }
.layer-name { display: flex; align-items: center; gap: 10px; font-size: 14.5px; font-weight: 600; }
.layer-name .dot { width: 9px; height: 9px; border-radius: 3px; flex: none; }
.layer-sub { margin-top: 3px; margin-left: 19px; font-size: 11.5px; color: #9b9a94; font-weight: 400; }
.l1 { background: #c15f3c; } .l2 { background: #3d5a80; } .l3 { background: #3e6b4f; }
.l4 { background: #6b5b8e; } .l5 { background: #6e6a5e; }
.cats { display: flex; gap: 7px; flex-wrap: wrap; }
.cat {
  display: inline-flex; align-items: baseline; gap: 6px;
  font-size: 12.5px; color: #3b3a37; background: #ffffff;
  border: 1px solid #e9e9e7; border-radius: 999px; padding: 4px 12px;
}
.cat .n { color: #9b9a94; font-size: 11px; }
.cat.planned { color: #b9b8b3; border-style: dashed; background: #fafafa; }
.layer-total { text-align: right; }
.layer-total .big { font-size: 22px; font-weight: 600; }
.layer-total .cap { font-size: 11px; color: #9b9a94; }
.arrow { color: #c9c8c3; font-size: 15px; text-align: center; }
.layer-row:hover .arrow { color: #141413; }

/* ---------- 复用排行 ---------- */
.panel { background: #ffffff; border: 1px solid #e9e9e7; border-radius: 16px; padding: 22px 24px; margin-top: 14px; }
.top-list { margin-top: 0; }
.top-item {
  display: grid; grid-template-columns: 34px 1fr auto; align-items: center; gap: 10px;
  padding: 13px 10px; margin: 0 -10px; border-radius: 10px; font-size: 13.5px;
}
.top-item:hover { background: #fafafa; }
.top-item + .top-item { border-top: 1px solid #f0f0ee; }
.rk { font-size: 15px; color: #c9c8c3; font-weight: 600; text-align: center; font-family: Georgia, "Songti SC", serif; }
.top-item:first-child .rk { color: #141413; }
.top-name { color: #141413; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500; }
.top-name .tp { font-size: 11px; color: #9b9a94; margin-left: 8px; font-weight: 400; }
.top-badge {
  font-size: 11.5px; padding: 3px 11px; border-radius: 999px;
  background: #f5f5f4; color: #5e5d59; border: 1px solid #e9e9e7;
}
.top-badge.hero { background: #141413; color: #ffffff; border-color: #141413; font-weight: 600; }

/* ---------- 行业覆盖 ---------- */
.ind-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 14px; }
.ind-card { background: #ffffff; border: 1px solid #e9e9e7; border-radius: 16px; padding: 22px 24px; cursor: pointer; transition: border-color .15s, transform .3s ease; }
.ind-card:hover { border-color: #d6d5d0; transform: translateY(-2px); }
.ind-name { font-size: 15.5px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.ind-nums { margin-top: 14px; display: flex; gap: 28px; }
.ind-nums .n { font-size: 20px; font-weight: 600; }
.ind-nums .c { font-size: 11.5px; color: #9b9a94; margin-top: 2px; }
.ind-foot { margin-top: 14px; padding-top: 12px; border-top: 1px solid #f0f0ee; font-size: 12px; color: #9b9a94; }

/* ---------- 入场动效 ---------- */
.reveal { opacity: 0; }
.reveal.in { animation: fadeUp .6s ease forwards; }
.stat-card.reveal.in:nth-child(2) { animation-delay: .07s; }
.stat-card.reveal.in:nth-child(3) { animation-delay: .14s; }
.stat-card.reveal.in:nth-child(4) { animation-delay: .21s; }
.stat-card.reveal.in:nth-child(5) { animation-delay: .28s; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }

/* ---------- 提示条 ---------- */
.toast {
  position: fixed; left: 50%; bottom: 36px; transform: translateX(-50%) translateY(20px);
  background: #141413; color: #ffffff; font-size: 13px; padding: 10px 20px;
  border-radius: 10px; opacity: 0; pointer-events: none; transition: all .25s; z-index: 99;
}
.toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
</style>
