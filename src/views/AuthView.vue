<script setup>
/**
 * Lumen 登录页（复刻 Claude 登录页布局：左文右图，两步式交互）
 * 第一步：输入邮箱或用户名 → 继续
 * 第二步：输入密码 → 登录
 *
 * 视觉规范（实测自 claude.ai）：
 * - 背景 #FAF9F5；标题 Anthropic Serif（回退 Georgia）；正文 Anthropic Sans
 * - 主按钮近黑 #141413；深色文字 #141413；次级文字 #5E5D59
 *
 * 安全说明：本系统不开放自助注册，账号由管理员分配。
 */
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { supabase } from '@/lib/supabase'
import heroImg from '@/assets/login-hero.jpg'

const route = useRoute()
const router = useRouter()

// 用户名 → 邮箱 别名表（不开放注册，账号由管理员分配）
const ACCOUNT_ALIAS = {
  yuanwdii: 'yuanwdii@gmail.com',
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// 'account' = 第一步（账号），'password' = 第二步（密码）
const step = ref('account')
const loading = ref(false)

const accountInput = ref('')
const resolvedEmail = ref('')
const password = ref('')

const accountRef = ref()
const passwordRef = ref()

function resolveAccount(input) {
  const v = input.trim()
  if (!v) return null
  if (EMAIL_RE.test(v)) return v.toLowerCase()
  return ACCOUNT_ALIAS[v.toLowerCase()] || null
}

async function handleContinue() {
  if (loading.value) return
  const email = resolveAccount(accountInput.value)
  if (!email) {
    ElMessage.error({
      message: '账号不存在。本系统不开放注册，请联系管理员获取账号',
      duration: 3500,
    })
    return
  }
  resolvedEmail.value = email
  step.value = 'password'
}

// 步骤过渡动画结束后自动聚焦当前输入框（out-in 模式下 nextTick 时新节点尚未挂载）
function focusAfterEnter() {
  if (step.value === 'password') passwordRef.value?.focus()
}

// Supabase 英文错误 → 友好中文提示
function friendlyError(error) {
  const msg = error?.message || ''
  if (/invalid login credentials/i.test(msg)) return '邮箱或密码错误，请重试'
  if (/email not confirmed/i.test(msg)) return '邮箱尚未完成验证，请先点击确认邮件中的链接'
  if (/rate limit/i.test(msg)) return '操作过于频繁，请稍后再试'
  if (/failed to fetch|network/i.test(msg)) return '网络连接失败，请检查网络后重试'
  return msg || '登录失败，请稍后重试'
}

async function handleLogin() {
  if (loading.value) return
  if (!password.value) {
    ElMessage.warning('请输入密码')
    return
  }
  loading.value = true
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: resolvedEmail.value,
      password: password.value,
    })
    if (error) {
      ElMessage.error({ message: friendlyError(error), duration: 3500 })
      return
    }
    ElMessage.success('登录成功，欢迎回来')
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.push(redirect)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <!-- 左上角品牌标识 -->
    <span class="brand-mark"><img class="brand-logo" src="/logo.png" alt="Lumen" />Lumen</span>

    <!-- 左侧：标题 + 登录卡片 -->
    <section class="left">
      <h1 class="hero-title">Illuminate what&rsquo;s stored</h1>
      <p class="hero-subtitle">Your metadata partner for the modern data warehouse</p>

      <div class="card">
        <!-- 第一步：账号 -->
        <transition name="step" mode="out-in" @after-enter="focusAfterEnter">
          <section v-if="step === 'account'" key="account" class="step">
            <input
              ref="accountRef"
              v-model="accountInput"
              class="field-input"
              type="text"
              placeholder="Enter your email"
              autocomplete="username"
              autofocus
              @keyup.enter="handleContinue"
            />
            <button class="primary-btn" type="button" @click="handleContinue">继续</button>
          </section>

          <!-- 第二步：密码 -->
          <section v-else key="password" class="step">
            <div class="account-chip">
              <span class="chip-avatar">{{ resolvedEmail.charAt(0).toUpperCase() }}</span>
              <span class="chip-email">{{ resolvedEmail }}</span>
            </div>

            <input
              ref="passwordRef"
              v-model="password"
              class="field-input"
              type="password"
              placeholder="输入密码"
              autocomplete="current-password"
              @keyup.enter="handleLogin"
            />
            <button
              class="primary-btn"
              type="button"
              :disabled="loading"
              @click="handleLogin"
            >
              {{ loading ? '登录中…' : '登录' }}
            </button>
          </section>
        </transition>
      </div>
    </section>

    <!-- 右侧：主视觉图 -->
    <aside class="right">
      <img :src="heroImg" alt="Lumen · 照亮数仓元数据" />
    </aside>
  </div>
</template>

<style scoped>
.auth-page {
  position: relative;
  height: 100vh;
  overflow: hidden;
  display: flex;
  gap: 56px;
  padding: 24px;
  background: #ffffff;
  font-family: 'Anthropic Sans', -apple-system, 'Helvetica Neue', 'PingFang SC',
    Arial, sans-serif;
}

/* 左侧 */
.left {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-width: 0;
  overflow-y: auto;
}

.brand-mark {
  position: absolute;
  top: 26px;
  left: clamp(24px, 3vw, 48px);
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'Anthropic Serif', 'Tiempos Headline', Georgia, 'Songti SC',
    'Times New Roman', serif;
  font-size: 21px;
  font-weight: 600;
  color: #141413;
  letter-spacing: 0.2px;
}
.brand-logo {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid #e9e9e7;
  object-fit: contain;
}

.hero-title {
  font-family: 'Anthropic Serif', 'Tiempos Headline', Georgia, 'Songti SC',
    'Times New Roman', serif;
  font-size: clamp(36px, 4.4vw, 64px);
  font-weight: 400;
  line-height: 1.15;
  letter-spacing: -0.5px;
  color: #141413;
}
@media (min-width: 961px) {
  .hero-title {
    white-space: nowrap;
  }
}
.hero-subtitle {
  margin-top: 18px;
  font-family: 'Anthropic Serif', 'Tiempos Headline', Georgia, 'Songti SC',
    'Times New Roman', serif;
  font-size: clamp(16px, 1.4vw, 20px);
  color: #141413;
}

/* 登录卡片：与页面背景同色，用边框区分 */
.card {
  margin-top: 44px;
  width: 100%;
  max-width: 440px;
  background: #ffffff;
  border: 1px solid #e9e9e7;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(20, 20, 19, 0.05);
  padding: 28px;
}

/* 步骤切换过渡 */
.step-enter-active,
.step-leave-active {
  transition: opacity 0.28s ease, transform 0.28s ease;
}
.step-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.step-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.step {
  display: flex;
  flex-direction: column;
}

.field-input {
  width: 100%;
  height: 44px;
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
.field-input::placeholder {
  color: #9b9a94;
}
.field-input:focus {
  border-color: #409eff;
}

.primary-btn {
  margin-top: 14px;
  width: 100%;
  height: 46px;
  border: none;
  border-radius: 10px;
  background: #141413;
  color: #faf9f5;
  font-size: 15px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.1s ease;
}
.primary-btn:hover:not(:disabled) {
  background: #000000;
}
.primary-btn:active:not(:disabled) {
  transform: scale(0.985);
}
.primary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 第二步：账号胶囊 */
.account-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  margin-bottom: 14px;
  background: #f6f6f4;
  border: 1px solid #e9e9e7;
  border-radius: 10px;
}
.chip-avatar {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #141413;
  color: #faf9f5;
  font-size: 13px;
  font-weight: 600;
}
.chip-email {
  flex: 1;
  font-size: 14px;
  color: #141413;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 右侧主视觉：内收悬浮，不擑高页面 */
.right {
  width: 36%;
  max-width: 540px;
  flex-shrink: 0;
  height: min(88vh, 960px);
  align-self: center;
  margin-right: clamp(16px, 4vw, 96px);
}
.right img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 24px;
  display: block;
  box-shadow: 0 16px 48px rgba(20, 20, 19, 0.1);
}

/* 窄屏隐藏右图 */
@media (max-width: 960px) {
  .auth-page {
    height: auto;
    min-height: 100vh;
    overflow: visible;
    justify-content: center;
  }
  .right {
    display: none;
  }
  .left {
    overflow: visible;
  }
}
</style>
