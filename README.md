# 🤖 DevOps 多 Agent 团队 & OpenClaw 配置备份

本仓库包含两个核心项目：
1. **DevOps 多 Agent 团队** - GitLab 自动化部署系统
2. **OpenClaw 配置备份** - 配置管理和恢复工具

---

## 📁 项目结构

```
├── devops-multi-agent-team/    # DevOps 多 Agent 项目
│   ├── manager/                # 总协调 Agent
│   ├── infra/                  # 基础设施工程师
│   ├── security/               # 安全工程师
│   ├── cicd/                   # CI/CD 工程师
│   ├── sre/                    # SRE/监控工程师
│   ├── scripts/                # 部署脚本
│   └── docs/                   # 部署文档
│
└── openclaw-config-backup/     # OpenClaw 配置备份
    ├── config/                 # 配置文件
    ├── identity/               # 身份配置
    ├── workspace/              # 工作区文档
    └── scripts/                # 备份/恢复脚本
```

---

## 🚀 项目一：DevOps 多 Agent 团队

### 简介

一个基于多 Agent 协作的云 DevOps 团队系统，专为 GitLab 高可用部署设计。

| Agent | 职责 | 模型 |
|-------|------|------|
| **Manager** | 任务分解、协调、汇总 | qwen3.5-plus |
| **Infra Engineer** | 基础设施规划与 IaC | qwen-coder-plus |
| **Security Engineer** | 安全审核与合规 | qwen3.5-plus |
| **CI/CD Engineer** | 自动化流水线 | qwen-coder-plus |
| **SRE Engineer** | 监控与告警 | qwen3.5-plus |

### 快速部署 GitLab

#### 1. 选择部署方案

| 方案 | 配置 | 月成本 | 适用场景 |
|------|------|--------|---------|
| **生产环境** | 3 节点高可用 | ¥3,300 | 企业生产 |
| **测试环境** ⭐ | 单节点+RDS+Redis | ¥580 | 开发测试 |
| **All-in-One** | 全部自建 | ¥270 | 个人学习 |

#### 2. 部署测试环境（推荐）

```bash
# 克隆仓库
git clone https://github.com/gitdotkon/devops-multi-agent-team.git
cd devops-multi-agent-team

# Step 1: 创建云资源（阿里云）
bash scripts/deploy-test-env.sh
# 输出：ECS/RDS/Redis/SLB 信息

# Step 2: SSH 登录 ECS
ssh root@<ECS_IP>

# Step 3: 安装 GitLab
bash install-gitlab-test.sh
# 耗时：5-10 分钟

# Step 4: 配置自动备份
crontab -e
# 添加：0 2 * * * /root/backup-test-env.sh
```

#### 3. 访问 GitLab

```
URL: http://<SLB_IP>
用户名：root
密码：首次登录需重置
```

### 使用 CLI 工具

```bash
# 查看所有 Agent
node devops-cli.js list

# 查看某个 Agent 信息
node devops-cli.js info manager

# 分发任务
node devops-cli.js dispatch manager "部署 GitLab"

# 执行工作流
node devops-cli.js workflow deploy-production
```

### 成本对比

```
生产环境：¥3,300/月
   ↓ 82% 节省
测试环境：¥580/月
   ↓ 53% 节省
All-in-One: ¥270/月
```

### 详细文档

- [部署手册](devops-multi-agent-team/docs/gitlab-deployment-guide.md)
- [部署流程](devops-multi-agent-team/shared/playbooks/deployment-procedure.md)
- [事件响应](devops-multi-agent-team/shared/playbooks/incident-response.md)

---

## 💾 项目二：OpenClaw 配置备份

### 简介

OpenClaw 配置备份和恢复工具，支持：
- ✅ 配置备份
- ✅ 一键恢复
- ✅ 多设备同步
- ✅ 版本控制

### 备份内容

| 类型 | 文件 | 说明 |
|------|------|------|
| **主配置** | openclaw.json | 模型/Agent/工具配置 |
| **身份** | device.json | 设备标识 |
| **工作区** | *.md | IDENTITY/USER/SOUL/AGENTS/TOOLS/MEMORY |
| **脚本** | backup.sh/restore.sh | 备份恢复工具 |

### 安全说明

**✅ 已备份**（安全）:
- 配置文件
- 设备标识（不含认证）
- 工作区文档

**❌ 已排除**（敏感）:
- API Keys
- Token 文件
- 设备认证信息
- 会话数据
- 日志文件

### 使用方法

#### 备份配置

```bash
# 方式 1: 使用脚本
cd ~/openclaw-backup
bash scripts/backup.sh
git add -A
git commit -m "Backup $(date '+%Y-%m-%d')"
git push

# 方式 2: 手动备份
cp ~/.openclaw/openclaw.json ~/openclaw-backup/config/
cp -r ~/.openclaw/identity/ ~/openclaw-backup/
cp ~/.openclaw/workspace/*.md ~/openclaw-backup/workspace/
```

#### 恢复配置

```bash
# 方式 1: 使用脚本（推荐）
cd ~/openclaw-backup
bash scripts/restore.sh

# 方式 2: 手动恢复
cp ~/openclaw-backup/config/openclaw.json ~/.openclaw/
cp -r ~/openclaw-backup/identity/ ~/.openclaw/
cp ~/openclaw-backup/workspace/*.md ~/.openclaw/workspace/
openclaw gateway restart
```

#### 多设备同步

```bash
# 设备 1: 备份并推送
cd ~/openclaw-backup
bash scripts/backup.sh
git push

# 设备 2: 拉取并恢复
cd ~/openclaw-backup
git pull
bash scripts/restore.sh
```

### 自动化备份

#### macOS / Linux (cron)

```bash
# 编辑 crontab
crontab -e

# 每天凌晨 3 点自动备份
0 3 * * * cd ~/openclaw-backup && bash scripts/backup.sh && git add -A && git commit -m "Auto backup $(date '+\%Y-\%m-\%d')" && git push
```

### 恢复流程

#### 场景 1: 本机恢复

```bash
cd ~/openclaw-backup
bash scripts/restore.sh
openclaw gateway restart
```

#### 场景 2: 新设备恢复

```bash
# 1. 安装 OpenClaw
# 2. 克隆备份仓库
git clone https://github.com/gitdotkon/openclaw-config-backup.git
cd openclaw-config-backup

# 3. 运行恢复脚本
bash scripts/restore.sh

# 4. 配置 API Keys（手动）
openclaw secrets configure

# 5. 重启 Gateway
openclaw gateway restart
```

---

## 🛠️ 工具集

### DevOps CLI

```bash
cd devops-multi-agent-team

# 查看帮助
node devops-cli.js help

# 列出所有 Agent
node devops-cli.js list

# 查看 Agent 信息
node devops-cli.js info <agent-name>

# 查看可用工具
node devops-cli.js tools

# 分发任务
node devops-cli.js dispatch <agent> <task>

# 执行工作流
node devops-cli.js workflow <workflow-name>

# 验证配置
node devops-cli.js validate
```

### 备份脚本

```bash
cd openclaw-backup

# 备份
bash scripts/backup.sh

# 恢复
bash scripts/restore.sh
```

---

## 📊 统计信息

### DevOps 多 Agent 团队

```
文件统计:
  - 总文件数：66
  - 代码行数：24,031
  - Agent 配置：5
  - 部署脚本：6
  - 文档：4
  - 测试：2 (231 项测试 ✅)

成本统计:
  - 生产环境：¥3,300/月
  - 测试环境：¥580/月 (节省 82%)
  - All-in-One: ¥270/月 (节省 92%)
```

### OpenClaw 配置备份

```
文件统计:
  - 总文件数：19
  - 配置文件：1
  - 工作区文档：13
  - 脚本工具：2

安全:
  - 仓库类型：私有 ✅
  - 敏感信息：已排除 ✅
  - 自动备份：支持 ✅
```

---

## 🔧 自定义配置

### DevOps Agent 配置

编辑 `devops-multi-agent-team/*/agent.yaml`:

```yaml
# manager/agent.yaml
model: qwen3.5-plus
workspace: ~/workspace/devops/manager
tools:
  allow: [sessions_spawn, sessions_send]
```

### OpenClaw 配置

编辑 `~/.openclaw/openclaw.json`:

```json
{
  "models": {
    "providers": {
      "bailian": {
        "apiKey": "your-api-key"
      }
    }
  },
  "mcp": {
    "servers": {
      "github": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-github"]
      }
    }
  }
}
```

---

## ⚠️ 注意事项

### DevOps 部署

| 风险 | 缓解措施 |
|------|---------|
| **单点故障** | 定期备份，快速恢复 |
| **内存紧张** | 配置 Swap，监控内存 |
| **性能有限** | 优化配置，限制并发 |

### 配置备份

| 注意 | 说明 |
|------|------|
| **API Keys** | 不要提交到 Git，手动配置 |
| **Token** | 使用 `openclaw secrets` 管理 |
| **定期测试** | 测试恢复流程确保可用 |

---

## 📚 相关资源

### DevOps 多 Agent

- [GitLab 官方文档](https://docs.gitlab.com/)
- [阿里云 ECS 文档](https://help.aliyun.com/product/25362.html)
- [Terraform 阿里云 Provider](https://registry.terraform.io/providers/aliyun/aliyun/latest/docs)

### OpenClaw

- [OpenClaw 文档](https://docs.openclaw.ai/)
- [配置管理](https://docs.openclaw.ai/config)
- [安全指南](https://docs.openclaw.ai/security)
- [MCP 服务器](https://docs.openclaw.ai/mcp)

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发流程

```bash
# 1. Fork 仓库
# 2. 创建分支
git checkout -b feature/your-feature

# 3. 提交更改
git commit -m "feat: add your feature"

# 4. 推送分支
git push origin feature/your-feature

# 5. 创建 Pull Request
```

---

## 📄 许可证

MIT License

---

## 🙏 致谢

- OpenClaw 团队
- GitLab 团队
- 阿里云
- 社区贡献者

---

## 📞 支持

遇到问题？

1. 查看文档
2. 提交 Issue
3. 联系作者

---

**开始部署你的 GitLab 实例，备份你的配置吧！** 🚀💾
