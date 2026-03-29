# GitLab 阿里云高可用部署手册

## 📋 目录

1. [架构概述](#架构概述)
2. [前置条件](#前置条件)
3. [资源规划](#资源规划)
4. [部署步骤](#部署步骤)
5. [配置 GitLab](#配置-gitlab)
6. [备份配置](#备份配置)
7. [监控告警](#监控告警)
8. [故障排查](#故障排查)

---

## 架构概述

### 高可用架构图

```
                              ┌─────────────────┐
                              │   阿里云 DNS    │
                              └────────┬────────┘
                                       │
                              ┌────────▼────────┐
                              │      SLB        │
                              │  (负载均衡器)    │
                              │  HTTPS:443      │
                              └────────┬────────┘
                                       │
              ┌────────────────────────┼────────────────────────┐
              │                        │                        │
     ┌────────▼────────┐    ┌────────▼────────┐    ┌────────▼────────┐
     │   GitLab Node1  │    │   GitLab Node2  │    │   GitLab Node3  │
     │   172.16.2.10   │    │   172.16.2.11   │    │   172.16.2.12   │
     │   ecs.g6.xlarge │    │   ecs.g6.xlarge │    │   ecs.g6.xlarge │
     │   Active        │    │   Active        │    │   Active        │
     └────────┬────────┘    └────────┬────────┘    └────────┬────────┘
              │                        │                        │
              └────────────────────────┼────────────────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    │                                     │
           ┌────────▼────────┐                   ┌────────▼────────┐
           │  RDS PostgreSQL │                   │  Redis Cluster  │
           │   高可用版       │                   │    高可用版      │
           │  主从 + 只读副本  │                   │   主从热备      │
           └────────┬────────┘                   └─────────────────┘
                    │
           ┌────────▼────────┐
           │   OSS 存储桶     │
           │  自动备份目标    │
           └─────────────────┘
```

### 组件说明

| 组件 | 规格 | 数量 | 用途 |
|------|------|------|------|
| SLB | slb.s1.small | 1 | 负载均衡，SSL 终止 |
| ECS | g6.xlarge (4vCPU 16GB) | 3 | GitLab 应用节点 |
| 系统盘 | ESSD 100GB | 3 | 操作系统和 GitLab 程序 |
| 数据盘 | ESSD 200GB | 3 | GitLab 数据存储 |
| RDS | PostgreSQL 14 (2vCPU 4GB) | 1 | 主数据库，高可用版 |
| Redis | 6.0 (256MB) | 1 | 缓存和会话存储 |
| OSS | 标准存储 | 1 | 备份存储 |

---

## 前置条件

### 1. 阿里云账号准备

```bash
# 确认已安装阿里云 CLI
aliyun version

# 登录阿里云
aliyun configure
```

### 2. 本地工具准备

```bash
# Terraform
terraform version  # 需要 >= 1.5.0

# SSH 客户端
ssh -V

# Git
git --version
```

### 3. 域名和证书

- 已备案域名：`gitlab.yourdomain.com`
- SSL 证书（可使用阿里云免费 SSL）

### 4. 预算确认

- 月度成本：约 ¥3,300
- 确保账号余额充足

---

## 资源规划

### 网络规划

```
VPC: 172.16.0.0/16
├── 可用区：cn-hangzhou-i
└── 可用区：cn-hangzhou-j

交换机:
├── 公共子网：172.16.1.0/24 (用于 NAT Gateway)
└── 私有子网：172.16.2.0/24 (用于 GitLab 节点)
```

### IP 地址规划

| 资源 | 私有 IP | 用途 |
|------|---------|------|
| GitLab Node1 | 172.16.2.10 | GitLab 应用 |
| GitLab Node2 | 172.16.2.11 | GitLab 应用 |
| GitLab Node3 | 172.16.2.12 | GitLab 应用 |
| SLB (内网) | 172.16.2.100 | 内网负载均衡 |

### 端口规划

| 端口 | 协议 | 来源 | 用途 |
|------|------|------|------|
| 443 | HTTPS | 0.0.0.0/0 | GitLab Web 访问 |
| 80 | HTTP | 0.0.0.0/0 | 重定向到 HTTPS |
| 22 | SSH | 办公 IP | 运维管理 |

---

## 部署步骤

### Step 1: 初始化 Terraform

```bash
cd /Users/kon/.openclaw/workspace/devops-team/terraform

# 初始化 Terraform
terraform init

# 查看执行计划
terraform plan -out=tfplan

# 确认无误后执行
terraform apply tfplan
```

### Step 2: 配置安全组

```bash
# 创建安全组
aliyun ecs CreateSecurityGroup \
  --RegionId cn-hangzhou \
  --VpcId vpc-xxx \
  --SecurityGroupName gitlab-sg

# 添加入站规则
# HTTPS
aliyun ecs AuthorizeSecurityGroup \
  --SecurityGroupId sg-xxx \
  --IpProtocol tcp \
  --PortRange 443/443 \
  --SourceCidrIp 0.0.0.0/0

# HTTP (重定向)
aliyun ecs AuthorizeSecurityGroup \
  --SecurityGroupId sg-xxx \
  --IpProtocol tcp \
  --PortRange 80/80 \
  --SourceCidrIp 0.0.0.0/0

# SSH (限制办公 IP)
aliyun ecs AuthorizeSecurityGroup \
  --SecurityGroupId sg-xxx \
  --IpProtocol tcp \
  --PortRange 22/22 \
  --SourceCidrIp YOUR_OFFICE_IP/32
```

### Step 3: 部署 GitLab 节点

```bash
#!/bin/bash
# deploy-gitlab-nodes.sh

REGION="cn-hangzhou"
IMAGE_ID="ubuntu-22.04"
INSTANCE_TYPE="ecs.g6.xlarge"
SECURITY_GROUP="sg-xxx"
VSWITCH_ID="vsw-xxx"

# GitLab 安装脚本
GITLAB_INSTALL=$(cat << 'EOF'
#!/bin/bash
# 安装依赖
apt-get update
apt-get install -y curl openssh-server nginx postfix ca-certificates

# 添加 GitLab 仓库
curl -sS https://packages.gitlab.com/install/repositories/gitlab/gitlab-ee/script.deb.sh | bash

# 设置 GitLab URL
echo "external_url 'https://gitlab.yourdomain.com'" >> /etc/gitlab/gitlab.rb

# 配置 SSL
mkdir -p /etc/gitlab/ssl
cp /tmp/gitlab.crt /etc/gitlab/ssl/
cp /tmp/gitlab.key /etc/gitlab/ssl/
chmod 600 /etc/gitlab/ssl/*

# 配置 GitLab
cat >> /etc/gitlab/gitlab.rb << 'GITLAB'
nginx['redirect_http_to_https'] = true
nginx['ssl_certificate'] = "/etc/gitlab/ssl/gitlab.crt"
nginx['ssl_certificate_key'] = "/etc/gitlab/ssl/gitlab.key"

# GitLab Runner 配置
gitlab_rails['registry_enabled'] = false

# 备份配置
gitlab_rails['backup_path'] = "/mnt/backup"
gitlab_rails['backup_keep_time'] = 604800
GITLAB

# 重新配置 GitLab
gitlab-ctl reconfigure
gitlab-ctl restart
EOF
)

# 创建 3 个节点
for i in 1 2 3; do
  INSTANCE_NAME="gitlab-node-$i"
  
  aliyun ecs RunInstances \
    --ImageId $IMAGE_ID \
    --InstanceType $INSTANCE_TYPE \
    --SecurityGroupId $SECURITY_GROUP \
    --VSwitchId $VSWITCH_ID \
    --InstanceName $INSTANCE_NAME \
    --SystemDiskCategory cloud_essd \
    --SystemDiskSize 100 \
    --DataDisk.1.Category cloud_essd \
    --DataDisk.1.Size 200 \
    --UserData "$(echo $GITLAB_INSTALL | base64)" \
    --Amount 1
done
```

### Step 4: 配置 SLB 负载均衡

```bash
# 创建负载均衡实例
aliyun slb CreateLoadBalancer \
  --RegionId cn-hangzhou \
  --LoadBalancerName gitlab-slb \
  --AddressType internet \
  --InternetChargeType paybytraffic \
  --Bandwidth 5

# 添加后端服务器
aliyun slb AddBackendServers \
  --LoadBalancerId lb-xxx \
  --BackendServers '[
    {"ServerId":"i-xxx1","Weight":100},
    {"ServerId":"i-xxx2","Weight":100},
    {"ServerId":"i-xxx3","Weight":100}
  ]'

# 创建 HTTPS 监听
aliyun slb CreateLoadBalancerHTTPSListener \
  --LoadBalancerId lb-xxx \
  --ListenerPort 443 \
  --BackendServerPort 443 \
  --Bandwidth 5 \
  --ServerCertificateId cert-xxx
```

### Step 5: 配置 RDS PostgreSQL

```bash
# 创建 RDS 实例
aliyun rds CreateDBInstance \
  --RegionId cn-hangzhou \
  --Engine PostgreSQL \
  --EngineVersion 14 \
  --DBInstanceClass pg.n2.medium.2c \
  --DBInstanceStorage 200 \
  --DBInstanceNetType VPC \
  --VSwitchId vsw-xxx \
  --SecurityGroupId sg-xxx \
  --DBInstanceStorageType cloud_essd \
  --PayType Postpaid

# 创建数据库
aliyun rds CreateDatabase \
  --DBInstanceId rds-xxx \
  --DBName gitlabhq_production \
  --CharacterSetName UTF8

# 创建账号
aliyun rds CreateAccount \
  --DBInstanceId rds-xxx \
  --AccountName gitlab \
  --AccountPassword YOUR_STRONG_PASSWORD
```

### Step 6: 配置 Redis

```bash
# 创建 Redis 实例
aliyun kvstore CreateInstance \
  --RegionId cn-hangzhou \
  --InstanceType MasterSlave \
  --Capacity 256 \
  --InstanceChargeType Postpaid \
  --VSwitchId vsw-xxx \
  --SecurityGroupId sg-xxx
```

---

## 配置 GitLab

### 修改 gitlab.rb

```ruby
# /etc/gitlab/gitlab.rb

# 外部访问 URL
external_url 'https://gitlab.yourdomain.com'

# Nginx 配置
nginx['redirect_http_to_https'] = true
nginx['ssl_certificate'] = "/etc/gitlab/ssl/gitlab.crt"
nginx['ssl_certificate_key'] = "/etc/gitlab/ssl/gitlab.key"
nginx['ssl_ciphers'] = "ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256"
nginx['ssl_prefer_server_ciphers'] = on
nginx['ssl_session_cache'] = "builtin:1000 shared:SSL:10m"

# GitLab Rails 配置
gitlab_rails['time_zone'] = 'Asia/Shanghai'
gitlab_rails['gitlab_email_from'] = 'gitlab@yourdomain.com'
gitlab_rails['gitlab_email_display_name'] = 'GitLab'

# 数据库配置（外部 RDS）
gitlab_rails['db_adapter'] = "postgresql"
gitlab_rails['db_encoding'] = "unicode"
gitlab_rails['db_host'] = "rds-xxx.rds.aliyuncs.com"
gitlab_rails['db_port'] = 5432
gitlab_rails['db_username'] = "gitlab"
gitlab_rails['db_password'] = "YOUR_PASSWORD"
gitlab_rails['db_database'] = "gitlabhq_production"

# Redis 配置（外部 Redis）
gitlab_rails['redis_host'] = "r-xxx.redis.rds.aliyuncs.com"
gitlab_rails['redis_port'] = 6379
gitlab_rails['redis_password'] = "YOUR_REDIS_PASSWORD"

# 备份配置
gitlab_rails['backup_path'] = "/mnt/backup"
gitlab_rails['backup_keep_time'] = 604800  # 7 天
gitlab_rails['backup_upload_connection'] = {
  'provider' => 'Aliyun',
  'awsaccesskeyid' => 'YOUR_ACCESS_KEY',
  'awssecretaccesskey' => 'YOUR_SECRET_KEY',
  'region' => 'cn-hangzhou',
  'host' => 'oss-cn-hangzhou.aliyuncs.com',
  'path_style' => false
}
gitlab_rails['backup_upload_remote_directory'] = 'gitlab-backup'

# 邮件配置（SMTP）
gitlab_rails['smtp_enable'] = true
gitlab_rails['smtp_address'] = "smtp.yourdomain.com"
gitlab_rails['smtp_port'] = 587
gitlab_rails['smtp_user_name'] = "gitlab@yourdomain.com"
gitlab_rails['smtp_password'] = "YOUR_SMTP_PASSWORD"
gitlab_rails['smtp_domain'] = "yourdomain.com"
gitlab_rails['smtp_authentication'] = "login"
gitlab_rails['smtp_starttls_auto'] = true
```

### 应用配置

```bash
# 重新配置 GitLab
gitlab-ctl reconfigure

# 重启 GitLab
gitlab-ctl restart

# 检查状态
gitlab-ctl status
```

---

## 备份配置

### 自动备份脚本

```bash
#!/bin/bash
# /usr/local/bin/gitlab-backup.sh

set -e

BACKUP_DIR="/mnt/backup"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/gitlab/backup_$TIMESTAMP.log"

echo "开始 GitLab 备份 - $TIMESTAMP" | tee -a $LOG_FILE

# 执行备份
gitlab-backup create BACKUP=$TIMESTAMP >> $LOG_FILE 2>&1

# 上传到 OSS
ossutil cp $BACKUP_DIR/gitlab_$TIMESTAMP_gitlab_backup.tar \
  oss://gitlab-backup/backups/ \
  --endpoint oss-cn-hangzhou.aliyuncs.com >> $LOG_FILE 2>&1

# 清理本地 7 天前的备份
find $BACKUP_DIR -name "*_gitlab_backup.tar" -mtime +7 -delete

# 清理 OSS 30 天前的备份
ossutil lifecycle oss://gitlab-backup >> $LOG_FILE 2>&1

echo "备份完成 - $(date)" | tee -a $LOG_FILE
```

### 配置 Cron 定时任务

```bash
# 编辑 crontab
crontab -e

# 添加每日凌晨 2 点备份
0 2 * * * /usr/local/bin/gitlab-backup.sh
```

### 恢复脚本

```bash
#!/bin/bash
# /usr/local/bin/gitlab-restore.sh

set -e

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "用法：$0 <备份文件>"
  echo "示例：$0 1774779011_2026_03_29_gitlab_backup.tar"
  exit 1
fi

echo "开始恢复 GitLab..."

# 停止相关服务
gitlab-ctl stop puma
gitlab-ctl stop sidekiq

# 确认
read -p "这将覆盖当前数据，确认继续？(yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  echo "取消恢复"
  exit 1
fi

# 执行恢复
gitlab-backup restore BACKUP=$(echo $BACKUP_FILE | sed 's/_gitlab_backup.tar//')

# 启动服务
gitlab-ctl restart

echo "恢复完成！"
```

---

## 监控告警

### Prometheus 配置

```yaml
# /etc/prometheus/prometheus.yml

global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'gitlab'
    static_configs:
      - targets: ['172.16.2.10:9168']
      - targets: ['172.16.2.11:9168']
      - targets: ['172.16.2.12:9168']
    metrics_path: '/-/metrics'

  - job_name: 'node'
    static_configs:
      - targets: ['172.16.2.10:9100']
      - targets: ['172.16.2.11:9100']
      - targets: ['172.16.2.12:9100']

  - job_name: 'postgresql'
    static_configs:
      - targets: ['rds-xxx.rds.aliyuncs.com:9187']
```

### 告警规则

```yaml
# /etc/prometheus/alerts.yml

groups:
  - name: gitlab
    rules:
      - alert: GitLabDown
        expr: up{job="gitlab"} == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "GitLab 实例宕机"
          description: "{{ $labels.instance }} 已宕机超过 5 分钟"

      - alert: GitLabHighCPU
        expr: rate(node_cpu_seconds_total{mode="user"}[5m]) > 0.8
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "GitLab CPU 使用率过高"
          description: "{{ $labels.instance }} CPU 使用率超过 80%"

      - alert: GitLabHighMemory
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.9
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "GitLab 内存使用率过高"
          description: "{{ $labels.instance }} 内存使用率超过 90%"

      - alert: GitLabDiskFull
        expr: (node_filesystem_size_bytes - node_filesystem_free_bytes) / node_filesystem_size_bytes > 0.85
        for: 30m
        labels:
          severity: warning
        annotations:
          summary: "GitLab 磁盘空间不足"
          description: "{{ $labels.instance }} 磁盘使用率超过 85%"
```

### 告警通知配置

```yaml
# /etc/alertmanager/alertmanager.yml

global:
  smtp_smarthost: 'smtp.yourdomain.com:587'
  smtp_from: 'alertmanager@yourdomain.com'
  smtp_auth_username: 'alertmanager@yourdomain.com'
  smtp_auth_password: 'YOUR_PASSWORD'

route:
  group_by: ['alertname']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'email-notifications'

receivers:
  - name: 'email-notifications'
    email_configs:
      - to: 'devops-team@yourdomain.com'
        send_resolved: true
```

---

## 故障排查

### 常见问题

#### 1. GitLab 无法访问

```bash
# 检查服务状态
gitlab-ctl status

# 检查 Nginx 日志
tail -f /var/log/gitlab/nginx/access.log
tail -f /var/log/gitlab/nginx/error.log

# 检查端口监听
netstat -tlnp | grep :443

# 检查防火墙
iptables -L -n | grep 443
```

#### 2. 数据库连接失败

```bash
# 测试数据库连接
psql -h rds-xxx.rds.aliyuncs.com -U gitlab -d gitlabhq_production

# 检查 RDS 白名单
aliyun rds DescribeDBInstanceNetInfo --DBInstanceId rds-xxx

# 检查 GitLab 数据库配置
grep -A 10 "db_host" /etc/gitlab/gitlab.rb
```

#### 3. 备份失败

```bash
# 检查备份目录权限
ls -la /mnt/backup

# 检查 OSS 配置
ossutil ls oss://gitlab-backup

# 查看备份日志
tail -f /var/log/gitlab/backup_*.log

# 手动执行备份测试
gitlab-backup create
```

#### 4. 性能问题

```bash
# 检查系统资源
top
free -h
df -h

# 检查 GitLab 进程
gitlab-ctl status

# 查看慢查询
grep "slow" /var/log/gitlab/postgresql/log/*.log

# 检查 Redis 性能
redis-cli -h r-xxx.redis.rds.aliyuncs.com info stats
```

### 应急联系

| 问题类型 | 联系人 | 联系方式 |
|---------|--------|---------|
| 基础设施 | Infra Team | infra@yourdomain.com |
| 应用问题 | Dev Team | dev@yourdomain.com |
| 安全问题 | Security Team | security@yourdomain.com |
| 紧急故障 | On-Call | +86-xxx-xxxx-xxxx |

---

## 附录

### A. 性能基准

| 指标 | 目标值 |
|------|--------|
| 页面响应时间 | < 2s |
| API 响应时间 | < 500ms |
| Git clone 速度 | > 10MB/s |
| 可用性 | > 99.95% |

### B. 扩容指南

**水平扩容**（增加 GitLab 节点）：
```bash
# 添加新节点到 SLB
aliyun slb AddBackendServers \
  --LoadBalancerId lb-xxx \
  --BackendServers '[{"ServerId":"i-new","Weight":100}]'
```

**垂直扩容**（升级配置）：
```bash
# 升级 ECS 规格
aliyun ecs ModifyInstanceSpec \
  --InstanceId i-xxx \
  --InstanceType ecs.g6.2xlarge
```

### C. 相关文档

- [GitLab 官方文档](https://docs.gitlab.com/)
- [阿里云 ECS 文档](https://help.aliyun.com/product/25362.html)
- [阿里云 RDS 文档](https://help.aliyun.com/product/26090.html)
- [Terraform 阿里云 Provider](https://registry.terraform.io/providers/aliyun/aliyun/latest/docs)

---

**文档版本**: v1.0  
**最后更新**: 2026-03-29  
**维护团队**: DevOps Team
