#!/bin/bash
# GitLab 测试环境安装脚本
# 配置 GitLab 使用外部 RDS 和 Redis

set -e

# 配置参数 (请根据实际情况修改)
RDS_HOST="请填写 RDS 地址"
RDS_PORT="5432"
RDS_USER="gitlab"
RDS_PASSWORD="GitLab@Test123"
RDS_DATABASE="gitlabhq_production"

REDIS_HOST="请填写 Redis 地址"
REDIS_PORT="6379"
REDIS_PASSWORD="Redis@Test123"

GITLAB_URL="http://localhost"

echo "🦊 开始安装 GitLab..."
echo ""

# Step 1: 安装依赖
echo "📦 Step 1: 安装依赖..."
apt-get update
apt-get install -y curl openssh-server ca-certificates tzdata perl postfix

echo "   ✅ 依赖安装完成"
echo ""

# Step 2: 添加 GitLab 仓库
echo "📦 Step 2: 添加 GitLab 仓库..."
curl -sS https://packages.gitlab.com/install/repositories/gitlab/gitlab-ee/script.deb.sh | bash

echo "   ✅ GitLab 仓库已添加"
echo ""

# Step 3: 配置 GitLab
echo "⚙️  Step 3: 配置 GitLab..."

cat > /etc/gitlab/gitlab.rb << GITLABCONF
# 外部访问 URL
external_url '$GITLAB_URL'

# Nginx 配置
nginx['listen_port'] = 80
nginx['listen_https'] = false

# 数据库配置 (外部 RDS)
postgresql['enable'] = false
gitlab_rails['db_adapter'] = "postgresql"
gitlab_rails['db_encoding'] = "unicode"
gitlab_rails['db_host'] = "$RDS_HOST"
gitlab_rails['db_port'] = $RDS_PORT
gitlab_rails['db_username'] = "$RDS_USER"
gitlab_rails['db_password'] = "$RDS_PASSWORD"
gitlab_rails['db_database'] = "$RDS_DATABASE"

# Redis 配置 (外部 Redis)
redis['enable'] = false
gitlab_rails['redis_host'] = "$REDIS_HOST"
gitlab_rails['redis_port'] = $REDIS_PORT
gitlab_rails['redis_password'] = "$REDIS_PASSWORD"
gitlab_rails['redis_ssl'] = false

# GitLab Rails 配置
gitlab_rails['time_zone'] = 'Asia/Shanghai'
gitlab_rails['gitlab_email_from'] = 'gitlab@example.com'
gitlab_rails['gitlab_email_display_name'] = 'GitLab'

# 优化内存使用 (2GB ECS)
puma['worker_processes'] = 2
puma['max_threads'] = 2
sidekiq['max_concurrency'] = 10

# 禁用不需要的功能以节省资源
gitlab_rails['registry_enabled'] = false
gitlab_rails['grafana_enabled'] = false
prometheus['enable'] = false
node_exporter['enable'] = false
postgres_exporter['enable'] = false
redis_exporter['enable'] = false
alertmanager['enable'] = false

# 备份配置
gitlab_rails['backup_path'] = "/mnt/backup"
gitlab_rails['backup_keep_time'] = 604800
GITLABCONF

echo "   ✅ GitLab 配置完成"
echo ""

# Step 4: 创建备份目录
echo "💾 Step 4: 创建备份目录..."
mkdir -p /mnt/backup
chown git:git /mnt/backup
chmod 755 /mnt/backup

echo "   ✅ 备份目录已创建"
echo ""

# Step 5: 创建 Swap (防止内存不足)
echo "💾 Step 5: 创建 Swap..."
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "   ✅ Swap 已创建 (2GB)"
else
  echo "   ⚠️  Swap 已存在，跳过"
fi
echo ""

# Step 6: 重新配置 GitLab
echo "⏳ Step 6: 重新配置 GitLab (约 5-10 分钟)..."
gitlab-ctl reconfigure

echo "   ✅ GitLab 配置完成"
echo ""

# Step 7: 重启 GitLab
echo "🔄 Step 7: 重启 GitLab..."
gitlab-ctl restart

echo "   ✅ GitLab 已重启"
echo ""

# Step 8: 检查状态
echo "📊 Step 8: 检查服务状态..."
gitlab-ctl status

echo ""

# Step 9: 显示访问信息
echo "╔════════════════════════════════════════════════════════╗"
echo "║              ✅ GitLab 安装完成！                       ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "📋 访问信息:"
echo "   URL:      $GITLAB_URL"
echo "   用户名：  root"
echo "   密码：     首次登录需重置密码"
echo ""
echo "📊 服务状态:"
echo "   所有服务应该显示：run"
echo ""
echo "💡 提示:"
echo "   - 首次登录需要设置新密码"
echo "   - 建议配置域名和 HTTPS"
echo "   - 定期备份数据"
echo "   - 监控内存使用情况"
echo ""
echo "🔧 常用命令:"
echo "   gitlab-ctl status      # 查看服务状态"
echo "   gitlab-ctl restart     # 重启所有服务"
echo "   gitlab-ctl tail        # 查看日志"
echo "   gitlab-backup create   # 手动备份"
echo ""
