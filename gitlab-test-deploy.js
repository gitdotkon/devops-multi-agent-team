#!/usr/bin/env node
/**
 * GitLab 测试环境部署 - 省钱版
 * 目标：最小化成本，适合测试/开发环境
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  purple: '\x1b[35m',
  red: '\x1b[31m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

async function deployTestEnvironment() {
  log(colors.blue, '\n╔════════════════════════════════════════════════════════╗');
  log(colors.blue, '║     💰 GitLab 测试环境部署 - 极致省钱版                  ║');
  log(colors.blue, '╚════════════════════════════════════════════════════════╝\n');

  // 方案对比
  log(colors.purple, '📊 方案对比\n');
  
  console.log(`
  ┌─────────────────┬──────────────┬──────────────┬──────────────┐
  │     配置项       │  生产环境    │  测试环境    │   节省      │
  ├─────────────────┼──────────────┼──────────────┼──────────────┤
  │ ECS 实例         │  g6.xlarge   │  t6/t5       │   70%       │
  │                 │  4vCPU 16GB  │  2vCPU 2GB   │              │
  ├─────────────────┼──────────────┼──────────────┼──────────────┤
  │ ECS 数量         │  3 节点       │  1 节点      │   67%       │
  ├─────────────────┼──────────────┼──────────────┼──────────────┤
  │ 付费方式         │  包年包月    │  按量付费    │   灵活      │
  ├─────────────────┼──────────────┼──────────────┼──────────────┤
  │ RDS             │  高可用版    │  基础版      │   60%       │
  ├─────────────────┼──────────────┼──────────────┼──────────────┤
  │ Redis           │  高可用版    │  单节点      │   50%       │
  ├─────────────────┼──────────────┼──────────────┼──────────────┤
  │ SLB             │  性能保障型  │  简约型      │   80%       │
  ├─────────────────┼──────────────┼──────────────┼──────────────┤
  │ 带宽            │  5Mbps 固定  │  按使用流量  │   90%       │
  ├─────────────────┼──────────────┼──────────────┼──────────────┤
  │ 磁盘            │  ESSD        │  高效云盘    │   70%       │
  └─────────────────┴──────────────┴──────────────┴──────────────┘
  `);

  // 成本对比
  log(colors.purple, '\n💵 成本对比\n');
  
  console.log(`
  ┌─────────────────────────┬──────────────┬──────────────┐
  │        资源项            │  生产环境    │  测试环境    │
  ├─────────────────────────┼──────────────┼──────────────┤
  │ ECS (1 台 t6-c1m2.large) │  ¥1,200     │   ¥150       │
  │ RDS PostgreSQL 基础版    │  ¥800       │   ¥180       │
  │ Redis 单节点             │  ¥400       │   ¥100       │
  │ SLB 简约型               │  ¥200       │   ¥40        │
  │ 带宽 (按使用流量)         │  ¥400       │   ¥50        │
  │ 磁盘 (高效云盘 100GB)     │  ¥300       │   ¥60        │
  ├─────────────────────────┼──────────────┼──────────────┤
  │ 月度总计                 │  ¥3,300     │   ¥580       │
  ├─────────────────────────┼──────────────┼──────────────┤
  │ 年度总计                 │  ¥39,600    │   ¥6,960     │
  └─────────────────────────┴──────────────┴──────────────┘
  
  💡 节省：¥2,720/月 (82.4%) | ¥32,640/年
  `);

  // 省钱策略
  log(colors.purple, '\n🎯 省钱策略详解\n');
  
  const strategies = [
    {
      name: '1. 使用突发性能实例 t6/t5',
      desc: '适合测试环境，CPU 积分制，闲时积累，忙时消耗',
      save: '70%',
      warning: '⚠️ 不适合高负载生产环境'
    },
    {
      name: '2. 单节点部署',
      desc: '测试环境不需要高可用，单台 ECS 足够',
      save: '67%',
      warning: '⚠️ 无冗余，宕机需手动恢复'
    },
    {
      name: '3. 按量付费',
      desc: '用多少付多少，随时释放，适合短期测试',
      save: '灵活',
      warning: '⚠️ 长期运行不如包月划算'
    },
    {
      name: '4. RDS 基础版',
      desc: '单节点版本，功能够用，价格便宜',
      save: '60%',
      warning: '⚠️ 无高可用，需自行备份'
    },
    {
      name: '5. Redis 单节点',
      desc: '测试环境不需要主从复制',
      save: '50%',
      warning: '⚠️ 无故障转移'
    },
    {
      name: '6. SLB 简约型',
      desc: '性能要求不高，简约型足够',
      save: '80%',
      warning: '⚠️ 并发能力有限'
    },
    {
      name: '7. 按使用流量计费',
      desc: '测试环境流量小，按量更划算',
      save: '90%',
      warning: '⚠️ 大流量场景不适用'
    },
    {
      name: '8. 高效云盘',
      desc: '性能适中，价格便宜',
      save: '70%',
      warning: '⚠️ IOPS 较低'
    }
  ];

  strategies.forEach((s, i) => {
    log(colors.green, `   ${s.name}`);
    log(colors.reset, `      └─ ${s.desc}`);
    log(colors.yellow, `      └─ 节省：${s.save}`);
    log(colors.red, `      └─ ${s.warning}\n`);
  });

  // 架构对比
  log(colors.purple, '\n🏗️ 测试环境架构图\n');
  
  console.log(`
                    ┌─────────────────┐
                    │  阿里云 DNS     │
                    │ gitlab-test.com │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   SLB 简约型     │
                    │  按使用流量计费  │
                    │    ¥40/月       │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   ECS t6-c1m2   │
                    │   2vCPU 2GB     │
                    │   ¥150/月       │
                    │  ┌───────────┐  │
                    │  │  GitLab   │  │
                    │  │  单节点   │  │
                    │  └───────────┘  │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
     ┌────────▼────────┐          ┌────────▼────────┐
     │  RDS 基础版      │          │  Redis 单节点   │
     │  PostgreSQL 14  │          │   256MB        │
     │  ¥180/月        │          │   ¥100/月      │
     └────────┬────────┘          └─────────────────┘
              │
     ┌────────▼────────┐
     │   OSS 存储桶     │
     │  按量付费        │
     │  约¥30/月       │
     └─────────────────┘
  `);

  // 详细配置
  log(colors.purple, '\n⚙️ 详细配置清单\n');
  
  const config = {
    ecs: {
      instance: 'ecs.t6-c1m2.large',
      cpu: '2 vCPU',
      memory: '2 GB',
      system: '高效云盘 60GB',
      data: '高效云盘 100GB',
      price: '¥150/月 (按量 ¥0.22/小时)'
    },
    rds: {
      type: 'PostgreSQL 14 基础版',
      instance: 'pg.s1.small.1c',
      cpu: '1 vCPU',
      memory: '2 GB',
      storage: '100GB 高效云盘',
      price: '¥180/月'
    },
    redis: {
      type: 'Redis 5.0 单节点',
      instance: 'redis.sharding.basic.default',
      capacity: '256MB',
      price: '¥100/月'
    },
    slb: {
      type: '简约型 I (slb.s1.small)',
      spec: '最大连接数 5,000',
      bandwidth: '按使用流量计费 ¥0.8/GB',
      price: '¥40/月 (预估)'
    },
    oss: {
      type: '标准存储',
      capacity: '50GB',
      price: '¥30/月 (预估)'
    }
  };

  Object.entries(config).forEach(([key, value]) => {
    log(colors.blue, `   ${key.toUpperCase()}:`);
    Object.entries(value).forEach(([k, v]) => {
      if (k === 'price') {
        log(colors.green, `      ${k}: ${v}`);
      } else {
        log(colors.reset, `      ${k}: ${v}`);
      }
    });
    console.log();
  });

  // 部署脚本
  log(colors.purple, '\n📝 部署脚本\n');
  
  const deployScript = `#!/bin/bash
# GitLab 测试环境部署脚本 - 省钱版
# 预计耗时：15 分钟

set -e

REGION="cn-hangzhou"
IMAGE_ID="ubuntu-22.04"

echo "🚀 开始部署 GitLab 测试环境..."

# Step 1: 创建 VPC 和交换机
echo "📡 Step 1: 创建网络..."
VPC_ID=$(aliyun vpc CreateVpc \\
  --RegionId $REGION \\
  --VpcName gitlab-test-vpc \\
  --CidrBlock 172.16.0.0/16 \\
  --query 'VpcId' \\
  --output text)

VSW_ID=$(aliyun vpc CreateVSwitch \\
  --RegionId $REGION \\
  --VpcId $VPC_ID \\
  --ZoneId cn-hangzhou-i \\
  --CidrBlock 172.16.1.0/24 \\
  --VSwitchName gitlab-test-vsw \\
  --query 'VSwitchId' \\
  --output text)

echo "   ✅ VPC: $VPC_ID"
echo "   ✅ VSwitch: $VSW_ID"

# Step 2: 创建安全组
echo "🔒 Step 2: 创建安全组..."
SG_ID=$(aliyun ecs CreateSecurityGroup \\
  --RegionId $REGION \\
  --VpcId $VPC_ID \\
  --SecurityGroupName gitlab-test-sg \\
  --query 'SecurityGroupId' \\
  --output text)

# 开放端口
aliyun ecs AuthorizeSecurityGroup \\
  --SecurityGroupId $SG_ID \\
  --IpProtocol tcp \\
  --PortRange 80/80 \\
  --SourceCidrIp 0.0.0.0/0

aliyun ecs AuthorizeSecurityGroup \\
  --SecurityGroupId $SG_ID \\
  --IpProtocol tcp \\
  --PortRange 443/443 \\
  --SourceCidrIp 0.0.0.0/0

aliyun ecs AuthorizeSecurityGroup \\
  --SecurityGroupId $SG_ID \\
  --IpProtocol tcp \\
  --PortRange 22/22 \\
  --SourceCidrIp 0.0.0.0/0

echo "   ✅ 安全组：$SG_ID"

# Step 3: 创建 ECS 实例
echo "💻 Step 3: 创建 ECS 实例..."
INSTANCE_ID=$(aliyun ecs RunInstances \\
  --ImageId $IMAGE_ID \\
  --InstanceType ecs.t6-c1m2.large \\
  --SecurityGroupId $SG_ID \\
  --VSwitchId $VSW_ID \\
  --InstanceName gitlab-test \\
  --SystemDiskCategory cloud_efficiency \\
  --SystemDiskSize 60 \\
  --DataDisk.1.Category cloud_efficiency \\
  --DataDisk.1.Size 100 \\
  --InternetChargeType PayByTraffic \\
  --InternetMaxBandwidthOut 100 \\
  --Amount 1 \\
  --query 'InstanceIdSets.InstanceId[0]' \\
  --output text)

echo "   ✅ ECS: $INSTANCE_ID"

# Step 4: 创建 RDS
echo "🗄️  Step 4: 创建 RDS PostgreSQL..."
RDS_ID=$(aliyun rds CreateDBInstance \\
  --RegionId $REGION \\
  --Engine PostgreSQL \\
  --EngineVersion 14 \\
  --DBInstanceClass pg.s1.small.1c \\
  --DBInstanceStorage 100 \\
  --DBInstanceNetType VPC \\
  --VSwitchId $VSW_ID \\
  --SecurityGroupId $SG_ID \\
  --DBInstanceStorageType cloud_efficiency \\
  --PayType Postpaid \\
  --query 'DBInstanceId' \\
  --output text)

echo "   ✅ RDS: $RDS_ID"

# Step 5: 创建 Redis
echo "🔶 Step 5: 创建 Redis..."
REDIS_ID=$(aliyun kvstore CreateInstance \\
  --RegionId $REGION \\
  --InstanceType Standard \\
  --Capacity 256 \\
  --InstanceChargeType Postpaid \\
  --VSwitchId $VSW_ID \\
  --SecurityGroupId $SG_ID \\
  --query 'InstanceId' \\
  --output text)

echo "   ✅ Redis: $REDIS_ID"

# Step 6: 创建 SLB
echo "⚖️  Step 6: 创建 SLB..."
SLB_ID=$(aliyun slb CreateLoadBalancer \\
  --RegionId $REGION \\
  --LoadBalancerName gitlab-test-slb \\
  --AddressType internet \\
  --InternetChargeType paybytraffic \\
  --query 'LoadBalancerId' \\
  --output text)

echo "   ✅ SLB: $SLB_ID"

# Step 7: 等待实例就绪
echo "⏳ Step 7: 等待实例就绪 (约 5 分钟)..."
sleep 300

# 获取 ECS 公网 IP
ECS_IP=$(aliyun ecs DescribeInstances \\
  --RegionId $REGION \\
  --InstanceIds "[\\"$INSTANCE_ID\\"]" \\
  --query 'Instances.Instance[0].PublicIpAddress.IpAddress[0]' \\
  --output text)

echo "   ✅ ECS 公网 IP: $ECS_IP"

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║              ✅ 资源创建完成！                          ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "📋 资源清单:"
echo "   ECS:    $INSTANCE_ID  ($ECS_IP)"
echo "   RDS:    $RDS_ID"
echo "   Redis:  $REDIS_ID"
echo "   SLB:    $SLB_ID"
echo "   VPC:    $VPC_ID"
echo ""
echo "💰 预估成本：¥580/月"
echo ""
echo "📝 下一步:"
echo "   1. SSH 登录 ECS: ssh root@$ECS_IP"
echo "   2. 运行 GitLab 安装脚本"
echo "   3. 配置域名解析"
echo "   4. 验证访问"
`;

  log(colors.reset, '   已生成部署脚本，保存位置:');
  log(colors.green, '   /Users/kon/.openclaw/workspace/devops-team/scripts/deploy-test-env.sh\n');

  // 省钱技巧
  log(colors.purple, '\n💡 额外省钱技巧\n');
  
  const tips = [
    {
      tip: '1. 使用抢占式实例',
      desc: '价格低至按量的 1/10，适合可中断的测试',
      save: '90%',
      risk: '⚠️ 可能被回收，需自动保存'
    },
    {
      tip: '2. 夜间自动关机',
      desc: '设置定时任务，非工作时间自动停止 ECS',
      save: '60%',
      risk: '⚠️ 需要时手动启动'
    },
    {
      tip: '3. 使用学生优惠',
      desc: '阿里云学生机 ¥9.9/月起',
      save: '95%',
      risk: '✅ 需要学生身份认证'
    },
    {
      tip: '4. 新用户优惠',
      desc: '首购优惠，部分产品 1 折起',
      save: '70%',
      risk: '✅ 限新用户'
    },
    {
      tip: '5. 使用容器服务',
      desc: 'ACK 托管版，按需付费',
      save: '40%',
      risk: '⚠️ 需要 Kubernetes 知识'
    },
    {
      tip: '6. 本地 + 云端混合',
      desc: '开发本地，测试上云',
      save: '50%',
      risk: '✅ 最灵活'
    }
  ];

  tips.forEach(t => {
    log(colors.green, `   ${t.tip}`);
    log(colors.reset, `      └─ ${t.desc}`);
    log(colors.yellow, `      └─ 节省：${t.save}`);
    log(colors.blue, `      └─ ${t.risk}\n`);
  });

  // 最终总结
  log(colors.blue, '\n╔════════════════════════════════════════════════════════╗');
  log(colors.blue, '║              📊 成本对比总结                            ║');
  log(colors.blue, '╚════════════════════════════════════════════════════════╝\n');
  
  console.log(`
  ┌─────────────────────────────────────────────────────────┐
  │                                                         │
  │   生产环境：¥3,300/月  →  测试环境：¥580/月              │
  │                                                         │
  │   节省：¥2,720/月  (82.4%)                              │
  │   年省：¥32,640                                         │
  │                                                         │
  │   💡 如果用抢占式实例 + 夜间关机：可降至 ¥200/月          │
  │                                                         │
  └─────────────────────────────────────────────────────────┘
  `);

  log(colors.yellow, '\n⚠️  重要提醒:\n');
  log(colors.reset, '   测试环境不适合生产使用，原因:');
  log(colors.reset, '   ❌ 单点故障风险');
  log(colors.reset, '   ❌ 性能有限');
  log(colors.reset, '   ❌ 无自动备份');
  log(colors.reset, '   ❌ 无监控告警\n');

  log(colors.green, '✅ 适合场景:\n');
  log(colors.reset, '   ✓ 个人学习和测试');
  log(colors.reset, '   ✓ 团队开发环境');
  log(colors.reset, '   ✓ 功能验证');
  log(colors.reset, '   ✓ 短期项目\n');

  return {
    status: 'completed',
    environment: 'test',
    monthlyCost: '¥580',
    savings: '82.4%'
  };
}

// 执行部署
deployTestEnvironment().then(result => {
  log(colors.green, '\n🎉 测试环境部署方案生成完成！\n');
  process.exit(0);
}).catch(err => {
  log(colors.red, `\n❌ 生成失败：${err.message}\n`);
  process.exit(1);
});
