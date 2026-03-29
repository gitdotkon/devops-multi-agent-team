#!/bin/bash
# GitLab 测试环境部署脚本 - 省钱版 (RDS + Redis 独立)
# 成本：¥580/月
# 预计耗时：15 分钟

set -e

REGION="cn-hangzhou"
IMAGE_ID="ubuntu-22.04"

echo "🚀 开始部署 GitLab 测试环境..."
echo ""

# Step 1: 创建 VPC 和交换机
echo "📡 Step 1: 创建网络..."
VPC_ID=$(aliyun vpc CreateVpc \
  --RegionId $REGION \
  --VpcName gitlab-test-vpc \
  --CidrBlock 172.16.0.0/16 \
  --query 'VpcId' \
  --output text)

VSW_ID=$(aliyun vpc CreateVSwitch \
  --RegionId $REGION \
  --VpcId $VPC_ID \
  --ZoneId cn-hangzhou-i \
  --CidrBlock 172.16.1.0/24 \
  --VSwitchName gitlab-test-vsw \
  --query 'VSwitchId' \
  --output text)

echo "   ✅ VPC: $VPC_ID"
echo "   ✅ VSwitch: $VSW_ID"
echo ""

# Step 2: 创建安全组
echo "🔒 Step 2: 创建安全组..."
SG_ID=$(aliyun ecs CreateSecurityGroup \
  --RegionId $REGION \
  --VpcId $VPC_ID \
  --SecurityGroupName gitlab-test-sg \
  --query 'SecurityGroupId' \
  --output text)

# 开放端口
echo "   添加安全组规则..."
aliyun ecs AuthorizeSecurityGroup \
  --SecurityGroupId $SG_ID \
  --IpProtocol tcp \
  --PortRange 80/80 \
  --SourceCidrIp 0.0.0.0/0

aliyun ecs AuthorizeSecurityGroup \
  --SecurityGroupId $SG_ID \
  --IpProtocol tcp \
  --PortRange 443/443 \
  --SourceCidrIp 0.0.0.0/0

aliyun ecs AuthorizeSecurityGroup \
  --SecurityGroupId $SG_ID \
  --IpProtocol tcp \
  --PortRange 22/22 \
  --SourceCidrIp 0.0.0.0/0

echo "   ✅ 安全组：$SG_ID"
echo ""

# Step 3: 创建 ECS 实例
echo "💻 Step 3: 创建 ECS 实例..."
INSTANCE_ID=$(aliyun ecs RunInstances \
  --ImageId $IMAGE_ID \
  --InstanceType ecs.t6-c1m2.large \
  --SecurityGroupId $SG_ID \
  --VSwitchId $VSW_ID \
  --InstanceName gitlab-test \
  --SystemDiskCategory cloud_efficiency \
  --SystemDiskSize 60 \
  --DataDisk.1.Category cloud_efficiency \
  --DataDisk.1.Size 100 \
  --InternetChargeType PayByTraffic \
  --InternetMaxBandwidthOut 100 \
  --Amount 1 \
  --query 'InstanceIdSets.InstanceId[0]' \
  --output text)

echo "   ✅ ECS: $INSTANCE_ID"
echo ""

# Step 4: 创建 RDS PostgreSQL
echo "🗄️  Step 4: 创建 RDS PostgreSQL..."
RDS_ID=$(aliyun rds CreateDBInstance \
  --RegionId $REGION \
  --Engine PostgreSQL \
  --EngineVersion 14 \
  --DBInstanceClass pg.s1.small.1c \
  --DBInstanceStorage 100 \
  --DBInstanceNetType VPC \
  --VSwitchId $VSW_ID \
  --SecurityGroupId $SG_ID \
  --DBInstanceStorageType cloud_efficiency \
  --PayType Postpaid \
  --query 'DBInstanceId' \
  --output text)

echo "   ✅ RDS: $RDS_ID"

# 创建数据库
echo "   创建数据库..."
aliyun rds CreateDatabase \
  --DBInstanceId $RDS_ID \
  --DBName gitlabhq_production \
  --CharacterSetName UTF8

# 创建账号
RDS_PASSWORD="GitLab@Test123"
aliyun rds CreateAccount \
  --DBInstanceId $RDS_ID \
  --AccountName gitlab \
  --AccountPassword $RDS_PASSWORD

echo "   ✅ 数据库：gitlabhq_production"
echo "   ✅ 账号：gitlab"
echo "   ✅ 密码：$RDS_PASSWORD (请保存！)"
echo ""

# Step 5: 创建 Redis
echo "🔶 Step 5: 创建 Redis..."
REDIS_ID=$(aliyun kvstore CreateInstance \
  --RegionId $REGION \
  --InstanceType Standard \
  --Capacity 256 \
  --InstanceChargeType Postpaid \
  --VSwitchId $VSW_ID \
  --SecurityGroupId $SG_ID \
  --query 'InstanceId' \
  --output text)

echo "   ✅ Redis: $REDIS_ID"

# 获取 Redis 连接信息
REDIS_HOST=$(aliyun kvstore DescribeInstances \
  --RegionId $REGION \
  --InstanceId $REDIS_ID \
  --query 'Instances.DBInstance[0].ConnectionDomain' \
  --output text)

REDIS_PASSWORD="Redis@Test123"
aliyun kvstore SetInstancePassword \
  --InstanceId $REDIS_ID \
  --Password $REDIS_PASSWORD

echo "   ✅ Redis 地址：$REDIS_HOST:6379"
echo "   ✅ Redis 密码：$REDIS_PASSWORD (请保存！)"
echo ""

# Step 6: 创建 SLB
echo "⚖️  Step 6: 创建 SLB..."
SLB_ID=$(aliyun slb CreateLoadBalancer \
  --RegionId $REGION \
  --LoadBalancerName gitlab-test-slb \
  --AddressType internet \
  --InternetChargeType paybytraffic \
  --query 'LoadBalancerId' \
  --output text)

echo "   ✅ SLB: $SLB_ID"
echo ""

# Step 7: 等待实例就绪
echo "⏳ Step 7: 等待实例就绪 (约 5 分钟)..."
for i in {1..10}; do
  echo "   等待中... $i/10"
  sleep 30
done

# 获取 ECS 公网 IP
ECS_IP=$(aliyun ecs DescribeInstances \
  --RegionId $REGION \
  --InstanceIds "[\"$INSTANCE_ID\"]" \
  --query 'Instances.Instance[0].PublicIpAddress.IpAddress[0]' \
  --output text)

# 获取 RDS 连接地址
RDS_HOST=$(aliyun rds DescribeDBInstanceNetInfo \
  --DBInstanceId $RDS_ID \
  --query 'DBInstanceNetInfos.DBInstanceNetInfo[0].ConnectionString' \
  --output text)

echo ""
echo "   ✅ ECS 公网 IP: $ECS_IP"
echo "   ✅ RDS 地址：$RDS_HOST"
echo "   ✅ Redis 地址：$REDIS_HOST"
echo ""

# Step 8: 添加后端服务器到 SLB
echo "📡 Step 8: 配置 SLB 后端服务器..."
aliyun slb AddBackendServers \
  --LoadBalancerId $SLB_ID \
  --BackendServers "[{\"ServerId\":\"$INSTANCE_ID\",\"Weight\":100}]"

# 创建 HTTP 监听
aliyun slb CreateLoadBalancerHTTPListener \
  --LoadBalancerId $SLB_ID \
  --ListenerPort 80 \
  --BackendServerPort 80 \
  --Bandwidth 100

echo "   ✅ SLB 后端服务器已添加"
echo "   ✅ SLB 监听已配置"
echo ""

# 获取 SLB 公网 IP
SLB_IP=$(aliyun slb DescribeLoadBalancers \
  --LoadBalancerId $SLB_ID \
  --query 'LoadBalancers.LoadBalancer[0].Address' \
  --output text)

echo "╔════════════════════════════════════════════════════════╗"
echo "║              ✅ 资源创建完成！                          ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "📋 资源清单:"
echo "   ┌─────────────────────────────────────────────────┐"
echo "   │ ECS:    $INSTANCE_ID"
echo "   │ IP:     $ECS_IP"
echo "   ├─────────────────────────────────────────────────┤"
echo "   │ RDS:    $RDS_ID"
echo "   │ 地址：  $RDS_HOST"
echo "   │ 数据库：gitlabhq_production"
echo "   │ 账号：  gitlab"
echo "   │ 密码：  $RDS_PASSWORD"
echo "   ├─────────────────────────────────────────────────┤"
echo "   │ Redis:  $REDIS_ID"
echo "   │ 地址：  $REDIS_HOST:6379"
echo "   │ 密码：  $REDIS_PASSWORD"
echo "   ├─────────────────────────────────────────────────┤"
echo "   │ SLB:    $SLB_ID"
echo "   │ IP:     $SLB_IP"
echo "   ├─────────────────────────────────────────────────┤"
echo "   │ VPC:    $VPC_ID"
echo "   │ VSW:    $VSW_ID"
echo "   │ SG:     $SG_ID"
echo "   └─────────────────────────────────────────────────┘"
echo ""
echo "💰 预估成本：¥580/月"
echo "   - ECS:    ¥150/月"
echo "   - RDS:    ¥180/月"
echo "   - Redis:  ¥100/月"
echo "   - SLB:    ¥40/月"
echo "   - 带宽：  ¥50/月 (预估)"
echo "   - 磁盘：  ¥60/月"
echo ""
echo "📝 下一步:"
echo "   1. SSH 登录 ECS:"
echo "      ssh root@$ECS_IP"
echo ""
echo "   2. 运行 GitLab 安装脚本:"
echo "      bash install-gitlab-test.sh"
echo ""
echo "   3. 配置域名解析 (可选):"
echo "      CNAME gitlab-test.example.com -> $SLB_IP"
echo ""
echo "   4. 验证访问:"
echo "      http://$SLB_IP"
echo ""
echo "⚠️  重要:"
echo "   - 请保存 RDS 和 Redis 密码！"
echo "   - 建议尽快配置 HTTPS"
echo "   - 定期备份数据"
echo ""
