# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

**DevOps 多 Agent 团队** - 一个基于 AI Agent 协作的云 DevOps 团队系统，专为 GitLab 高可用部署设计。

### Agent 架构

| Agent | 职责 | 模型 | 配置文件 |
|-------|------|------|---------|
| **Manager** | 任务分解、协调、汇总 | qwen3.5-plus | `manager/agent.yaml` |
| **Infra** | 基础设施规划与 IaC | qwen-coder-plus | `infra/agent.yaml` |
| **Security** | 安全审核与合规 | qwen3.5-plus | `security/agent.yaml` |
| **CI/CD** | 自动化流水线 | qwen-coder-plus | `cicd/agent.yaml` |
| **SRE** | 监控与告警 | qwen3.5-plus | `sre/agent.yaml` |

### 部署方案

| 方案 | 配置 | 月成本 | 脚本 |
|------|------|--------|------|
| **All-in-One** | 单 ECS 自建 | ¥270 | `scripts/install-gitlab-test.sh` |
| **测试环境** | ECS+RDS+Redis | ¥580 | `scripts/deploy-test-env.sh` |
| **生产环境** | 3 节点高可用 | ¥3,300 | Terraform |

## 快速开始

### 部署 All-in-One GitLab（推荐新手）

```bash
# 1. 配置阿里云 CLI
aliyun configure

# 2. 运行部署脚本
cd devops-multi-agent-team
bash scripts/install-gitlab-test.sh

# 3. 访问 GitLab
# http://<ECS_PUBLIC_IP>
# 用户名：root
# 密码：/etc/gitlab/initial_root_password
```

### 使用 CLI 工具

```bash
# 查看所有 Agent
node devops-cli.js list

# 查看 Agent 信息
node devops-cli.js info manager

# 验证配置
node devops-cli.js validate

# 查看可用工作流
node devops-cli.js workflow list
```

## CI/CD 配置

### GitHub Actions 工作流

- `.github/workflows/ci.yml` - 持续集成（代码检查、测试、安全扫描）
- `.github/workflows/cd-gitlab.yml` - 部署 GitLab 到阿里云
- `.github/workflows/cd-all-in-one.yml` - All-in-One 快速部署

### 必需的 GitHub Secrets

```bash
ALIYUN_ACCESS_KEY_ID      # 阿里云 AccessKey ID
ALIYUN_ACCESS_KEY_SECRET  # 阿里云 AccessKey Secret
SSH_PRIVATE_KEY           # SSH 私钥（连接 ECS）
```

详见：`.github/CI_CD_GUIDE.md`

## 常用命令

### 测试
```bash
npm test                    # 运行测试
node devops-cli.js validate # 验证配置
```

### 部署
```bash
bash scripts/deploy-test-env.sh     # 部署测试环境
bash scripts/install-gitlab-test.sh # 安装 GitLab
bash scripts/backup-test-env.sh     # 备份配置
```

### CLI 工具
```bash
node devops-cli.js list             # 列出 Agent
node devops-cli.js info <agent>     # 查看 Agent 信息
node devops-cli.js dispatch <agent> <task>  # 分发任务
node devops-cli.js workflow <name>  # 执行工作流
```

## 文件结构

```
devops-multi-agent-team/
├── manager/           # 总协调 Agent
├── infra/             # 基础设施工程师
├── security/          # 安全工程师
├── cicd/              # CI/CD 工程师
├── sre/               # SRE/监控工程师
├── scripts/           # 部署脚本
│   ├── deploy-test-env.sh
│   ├── install-gitlab-test.sh
│   └── backup-test-env.sh
├── docs/              # 部署文档
│   └── gitlab-deployment-guide.md
├── shared/            # 共享配置
│   ├── agent.yaml
│   ├── tools.yaml
│   └── templates/
├── examples/          # 示例工作流
├── tests/             # 测试用例
├── .github/workflows/ # GitHub Actions
└── devops-cli.js      # CLI 工具
```

## 阿里云资源配置

### 最小权限 RAM 策略

```json
{
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["ecs:*", "vpc:*", "rds:*", "slb:*", "oss:*"],
      "Resource": "*"
    }
  ],
  "Version": "1"
}
```

### 区域选择

默认区域：`cn-hangzhou`（杭州）

可在以下区域部署：
- `cn-beijing`（北京）
- `cn-shanghai`（上海）
- `cn-shenzhen`（深圳）

## 故障排查

### GitLab 无法访问

```bash
# 检查服务状态
ssh root@<ECS_IP> "gitlab-ctl status"

# 检查端口
ssh root@<ECS_IP> "netstat -tlnp | grep :80"

# 查看日志
ssh root@<ECS_IP> "tail -f /var/log/gitlab/nginx/error.log"
```

### 成本问题

```bash
# 查看阿里云账单
aliyun bssopenapi QueryAccountBill
```

## 相关文档

- [GitLab 部署详细指南](docs/gitlab-deployment-guide.md)
- [CI/CD 配置指南](.github/CI_CD_GUIDE.md)
- [环境配置指南](.github/ENVIRONMENT_SETUP.md)
- [部署流程](shared/playbooks/deployment-procedure.md)
- [事件响应](shared/playbooks/incident-response.md)

## 注意事项

1. **首次部署**：建议使用 All-in-One 方案测试
2. **密码管理**：RDS/Redis 密码需妥善保存
3. **HTTPS**：生产环境必须配置 SSL 证书
4. **备份**：配置每日自动备份到 OSS
5. **监控**：关注 ECS 内存使用情况
