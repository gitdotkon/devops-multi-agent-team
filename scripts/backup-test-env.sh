#!/bin/bash
# GitLab 测试环境备份脚本
# 每天凌晨 2 点自动备份到 OSS

set -e

BACKUP_DIR="/mnt/backup"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/gitlab/backup_$TIMESTAMP.log"

# OSS 配置 (请根据实际情况修改)
OSS_BUCKET="gitlab-test-backup"
OSS_ENDPOINT="oss-cn-hangzhou.aliyuncs.com"
OSS_ACCESS_KEY="你的 AccessKey"
OSS_SECRET_KEY="你的 SecretKey"

echo "开始 GitLab 备份 - $TIMESTAMP" | tee -a $LOG_FILE

# Step 1: 创建备份目录
mkdir -p $BACKUP_DIR

# Step 2: 执行 GitLab 备份
echo "执行 GitLab 备份..." | tee -a $LOG_FILE
gitlab-backup create BACKUP=$TIMESTAMP >> $LOG_FILE 2>&1

# Step 3: 备份 PostgreSQL (额外备份)
echo "备份 PostgreSQL..." | tee -a $LOG_FILE
RDS_HOST="请填写 RDS 地址"
RDS_USER="gitlab"
RDS_PASSWORD="GitLab@Test123"
RDS_DATABASE="gitlabhq_production"

pg_dump -h $RDS_HOST -U $RDS_USER -d $RDS_DATABASE > $BACKUP_DIR/pg_$TIMESTAMP.sql
echo "   ✅ PostgreSQL 备份完成" | tee -a $LOG_FILE

# Step 4: 备份 Redis
echo "备份 Redis..." | tee -a $LOG_FILE
REDIS_HOST="请填写 Redis 地址"
REDIS_PASSWORD="Redis@Test123"

redis-cli -h $REDIS_HOST -a $REDIS_PASSWORD SAVE
cp /var/lib/redis/dump.rdb $BACKUP_DIR/redis_$TIMESTAMP.rdb
echo "   ✅ Redis 备份完成" | tee -a $LOG_FILE

# Step 5: 备份 GitLab 配置
echo "备份 GitLab 配置..." | tee -a $LOG_FILE
tar -czf $BACKUP_DIR/gitlab_config_$TIMESTAMP.tar.gz /etc/gitlab
echo "   ✅ GitLab 配置备份完成" | tee -a $LOG_FILE

# Step 6: 上传到 OSS (可选)
echo "上传到 OSS..." | tee -a $LOG_FILE
if command -v ossutil &> /dev/null; then
  # 配置 ossutil
  ossutil config -e $OSS_ENDPOINT -i $OSS_ACCESS_KEY -k $OSS_SECRET_KEY -L cn
  
  # 上传备份文件
  ossutil cp $BACKUP_DIR/gitlab_$TIMESTAMP_gitlab_backup.tar \
    oss://$OSS_BUCKET/backups/ \
    --endpoint $OSS_ENDPOINT >> $LOG_FILE 2>&1
  
  # 上传 PostgreSQL 备份
  ossutil cp $BACKUP_DIR/pg_$TIMESTAMP.sql \
    oss://$OSS_BUCKET/backups/ \
    --endpoint $OSS_ENDPOINT >> $LOG_FILE 2>&1
  
  echo "   ✅ OSS 上传完成" | tee -a $LOG_FILE
else
  echo "   ⚠️  ossutil 未安装，跳过 OSS 上传" | tee -a $LOG_FILE
fi

# Step 7: 清理本地 7 天前的备份
echo "清理旧备份..." | tee -a $LOG_FILE
find $BACKUP_DIR -name "*_gitlab_backup.tar" -mtime +7 -delete
find $BACKUP_DIR -name "pg_*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "redis_*.rdb" -mtime +7 -delete
find $BACKUP_DIR -name "gitlab_config_*.tar.gz" -mtime +7 -delete
echo "   ✅ 旧备份已清理" | tee -a $LOG_FILE

# Step 8: 清理 OSS 30 天前的备份 (可选)
if command -v ossutil &> /dev/null; then
  echo "清理 OSS 旧备份..." | tee -a $LOG_FILE
  ossutil lifecycle oss://$OSS_BUCKET >> $LOG_FILE 2>&1
fi

echo "" | tee -a $LOG_FILE
echo "备份完成 - $(date)" | tee -a $LOG_FILE
echo "" | tee -a $LOG_FILE
echo "备份文件:" | tee -a $LOG_FILE
ls -lh $BACKUP_DIR/*$TIMESTAMP* | tee -a $LOG_FILE
