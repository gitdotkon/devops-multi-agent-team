# 🤖 DevOps Multi-Agent Team

一个基于多 Agent 协作的云 DevOps 团队系统，专为 GitLab 高可用部署设计。

## 📋 项目简介

本项目包含 5 个专业 DevOps Agent，可协作完成 GitLab 的完整部署：

| Agent | 职责 | 模型 |
|-------|------|------|
| **Manager** | 任务分解、协调、汇总 | qwen3.5-plus |
| **Infra Engineer** | 基础设施规划与 IaC | qwen-coder-plus |
| **Security Engineer** | 安全审核与合规 | qwen3.5-plus |
| **CI/CD Engineer** | 自动化流水线 | qwen-coder-plus |
| **SRE Engineer** | 监控与告警 | qwen3.5-plus |

## 🚀 快速开始

### 1. 查看部署方案

```bash
# 生产环境 (高可用，¥3,300/月)
node gitlab-deploy.js

# 测试环境 (省钱版，¥580/月) ⭐ 推荐
node gitlab-test-deploy.js

# All-in-One (极致省钱，¥270/月)
node gitlab-aio-deploy.js
```

### 2. 部署 GitLab 测试环境

```bash
# Step 1: 创建云资源
bash scripts/deploy-test-env.sh

# Step 2: SSH 登录 ECS
ssh root@<ECS_IP>

# Step 3: 安装 GitLab
bash install-gitlab-test.sh

# Step 4: 配置自动备份
crontab -e
# 添加：0 2 * * * /root/backup-test-env.sh
```

## 📁 目录结构

```
devops-team/
├── manager/agent.yaml          # 总协调 Agent
├── infra/agent.yaml            # 基础设施工程师
├── security/agent.yaml         # 安全工程师
├── cicd/agent.yaml             # CI/CD 工程师
├── sre/agent.yaml              # SRE/监控工程师
├── shared/
│   ├── tools.yaml              # 共享工具配置
│   ├── templates/              # Terraform/K8s 模板
│   └── playbooks/              # 标准操作手册
├── scripts/
│   ├── deploy-test-env.sh      # 资源创建脚本
│   ├── install-gitlab-test.sh  # GitLab 安装脚本
│   └── backup-test-env.sh      # 自动备份脚本
├── docs/
│   └── gitlab-deployment-guide.md  # 详细部署手册
├── examples/                   # 工作流示例
├── tests/                      # 测试用例 (231 项)
├── devops-cli.js               # CLI 工具
└── README.md                   # 本文件
```

## 💰 成本对比

| 环境 | 配置 | 月成本 | 节省 |
|------|------|--------|------|
| **生产环境** | 3 节点高可用 | ¥3,300 | - |
| **测试环境** | 单节点+RDS+Redis | ¥580 | 82% |
| **All-in-One** | 全部自建 | ¥270 | 92% |

## 🛠️ 使用 CLI 工具

```bash
# 查看所有 Agent
node devops-cli.js list

# 查看某个 Agent 信息
node devops-cli.js info manager

# 查看可用工具
node devops-cli.js tools

# 分发任务
node devops-cli.js dispatch manager "部署 GitLab"

# 执行工作流
node devops-cli.js workflow deploy-production
```

## 📊 架构特点

### 生产环境 (¥3,300/月)
- ✅ 3 节点 GitLab 集群
- ✅ RDS PostgreSQL 高可用版
- ✅ Redis 高可用版
- ✅ SLB 负载均衡
- ✅ 可用性 99.95%

### 测试环境 (¥580/月) ⭐
- ✅ 单节点 GitLab
- ✅ RDS PostgreSQL 基础版
- ✅ Redis 单节点
- ✅ SLB 简约型
- ✅ 适合开发测试

### All-in-One (¥270/月)
- ✅ 所有服务在一台 ECS
- ✅ 自建 PostgreSQL + Redis
- ✅ 成本最低
- ✅ 适合个人学习

## 📚 文档

- [详细部署手册](docs/gitlab-deployment-guide.md)
- [部署流程](shared/playbooks/deployment-procedure.md)
- [事件响应](shared/playbooks/incident-response.md)

## 🧪 测试

```bash
cd tests
node agent-config.test.js    # 配置测试 (176 项)
node integration.test.js     # 集成测试 (55 项)
```

## 🔧 自定义配置

### 修改 Agent 配置

编辑 `*/agent.yaml` 文件：

```yaml
# manager/agent.yaml
model: qwen3.5-plus
workspace: ~/workspace/devops/manager
tools:
  allow: [sessions_spawn, sessions_send]
```

### 添加新 Agent

1. 创建目录：`mkdir new-agent`
2. 创建配置：`vim new-agent/agent.yaml`
3. 更新 CLI 工具识别新 Agent

## 🤝 协作流程

```
用户请求
   │
   ▼
┌─────────┐
│ Manager │ 分解任务
└────┬────┘
     │
   ┌─┴─┬─────┬───────┬───────┐
   ▼   ▼     ▼       ▼       ▼
Infra Security CI/CD  SRE  汇总
   │   │     │       │       │
   └───┴─────┴───────┴───────┘
           │
           ▼
      交付结果
```

## ⚠️ 注意事项

### 测试环境限制
- ❌ 单点故障风险
- ❌ 性能有限 (2GB 内存)
- ❌ 无自动备份 (需手动配置)
- ❌ 无监控告警

### 适合场景
- ✅ 个人学习和测试
- ✅ 小团队开发环境 (< 10 人)
- ✅ 短期项目 (1-3 个月)
- ✅ 预算有限的场景

## 📝 许可证

MIT License

## 🙏 致谢

- OpenClaw 多 Agent 框架
- GitLab 团队
- 阿里云

---

**开始部署你的 GitLab 实例吧！** 🚀
