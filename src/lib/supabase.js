/**
 * Supabase 客户端单例
 * anon key 为公开密钥（设计上允许暴露于前端），
 * 数据访问权限由数据库 RLS 策略控制。
 */
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error('缺少 Supabase 环境变量，请参照 .env.example 创建 .env.local')
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
