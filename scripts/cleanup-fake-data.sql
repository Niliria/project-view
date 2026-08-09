-- ========================================
-- 清理假数据脚本
-- 用途：移除开发过程中使用的测试/假数据
-- 执行时间：首次部署前运行一次
-- ========================================

-- 1. 备份现有数据（重要！）
CREATE TABLE IF NOT EXISTS dw_tables_backup_20240809 AS SELECT * FROM dw_tables;

-- 2. 检查假数据占比（仅当存在 id 包含 'test'、'demo' 等特征时）
SELECT 
  COUNT(*) as total_rows,
  COUNT(CASE WHEN table_name LIKE '%test%' OR table_name LIKE '%demo%' THEN 1 END) as fake_rows
FROM dw_tables;

-- 3. 选择清理策略：
-- 方案①：只删除假数据，保留真实数据
DELETE FROM dw_tables 
WHERE table_name LIKE '%test%' 
   OR table_name LIKE '%demo%' 
   OR table_comment LIKE '%假%';

-- 方案②：清空整张表（谨慎使用！）
-- DELETE FROM dw_tables;

-- 方案③：删除整张表（如果不再需要）
-- DROP TABLE IF EXISTS dw_tables;

-- 4. 释放空间（VACUUM 回收空间给数据库）
VACUUM ANALYZE dw_tables;

-- 5. 验证结果
SELECT '剩余行数：' || COUNT(*) || ' 行' as result FROM dw_tables;

-- ========================================
-- ✅ 执行完成
-- ⚠️ 请确认业务表已正确创建后再继续
-- ========================================
