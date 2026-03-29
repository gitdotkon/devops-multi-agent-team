# DevOps 多 Agent 团队

一个基于 AI Agent 的云 DevOps 多 Agent 协作系统，通过专业化的 Agent 分工协作，实现基础设施管理、安全审计、CI/CD 自动化、监控与稳定性保障等 DevOps 全流程。

## 📋 目录

- [架构设计](#架构设计)
- [Agent 角色](#agent-角色)
- [快速开始](#快速开始)
- [配置说明](#配置说明)
- [使用示例](#使用示例)
- [工作流](#工作流)
- [最佳实践](#最佳实践)

## 🏗️ 架构设计

```
┌─────────────────────────────────────────────────────────┐
│                    Manager Agent                        │
│                   (总协调 Agent)                         │
│  - 任务分解与分配    - 跨 Agent 协调    - 进度跟踪       │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Infra Agent   │   │ Security      │   │ CI/CD Agent   │
│               │   │ Agent         │   │               │
│ 基础设施工程师 │   │ 安全工程师    │   │ CI/CD 工程师   │
│               │   │               │   │               │
│ • 云资源管理  │   │ • 安全扫描    │   │ • 流水线管理  │
│ • 网络配置    │   │ • 漏洞管理    │   │ • 部署自动化  │
│ • IaC         │   │ • 合规检查    │   │ • 发布管理    │
└───────────────┘   └───────────────┘   └───────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
                   ┌───────────────┐
                   │ SRE Agent     │
                   │               │
                   │ SRE/监控工程师│
                   │               │
                   │ • 监控体系    │
                   │ • 告警管理    │
                   │ • 事件响应    │
                   └───────────────┘
                            │
                            ▼
                   ┌───────────────┐
                   │ Shared Tools  │
                   │               │
                   │ • 云平台 CLI  │
                   │ • K8s/Docker  │
                   │ • 监控工具    │
                   │ • 安全工具    │
                   └───────────────┘
```

## 🤖 Agent 角色

### 1. Manager Agent (总协调 Agent)
**职责**: 协调整个 DevOps 团队，分配任务，监控进度

- 接收和解析用户需求
- 将任务分配给合适的专业 Agent
- 协调多个 Agent 之间的协作
- 汇总结果并交付给用户
- 监控任务执行进度和质量

**配置文件**: `manager/agent.yaml`

### 2. Infra Agent (基础设施工程师)
**职责**: 云资源管理、网络配置、计算资源等

- 云服务器 (ECS/EC2) 的创建、配置和管理
- 网络配置 (VPC、子网、路由、安全组)
- 负载均衡器配置
- 存储资源管理
- 基础设施即代码 (Terraform)
- 资源优化和成本控制

**配置文件**: `infra/agent.yaml`

### 3. Security Agent (安全工程师)
**职责**: 安全扫描、漏洞管理、合规检查、安全策略

- 容器镜像安全扫描
- 代码安全审计
- 基础设施安全配置
- 漏洞管理与修复
- 合规性检查
- 安全策略制定

**配置文件**: `security/agent.yaml`

### 4. CI/CD Agent (CI/CD 工程师)
**职责**: 持续集成、持续部署、发布管理

- CI/CD 流水线设计与实现
- 自动化测试集成
- 构建与发布管理
- 环境管理
- 部署策略实施
- 回滚管理

**配置文件**: `cicd/agent.yaml`

### 5. SRE Agent (SRE/监控工程师)
**职责**: 监控、告警、事件响应、稳定性保障

- 监控系统设计与实施
- 告警策略管理
- 事件响应与处理
- 故障排查
- SLI/SLO 管理
- 容量规划

**配置文件**: `sre/agent.yaml`

## 🚀 快速开始

### 1. 环境要求

- Node.js >= 18.0
- npm >= 9.0
- 各云平台 CLI (aliyun, aws 等)
- kubectl, helm, terraform (可选)

### 2. 安装依赖

```bash
cd devops-team
npm install js-yaml
```

### 3. 验证配置

```bash
node devops-cli.js validate
```

### 4. 查看状态

```bash
node devops-cli.js status
```

### 5. 查看 Agent 信息

```bash
node devops-cli.js info infra
node devops-cli.js info security
node devops-cli.js info cicd
node devops-cli.js info sre
```

## ⚙️ 配置说明

### Agent 配置结构

每个 Agent 的配置文件 (`agent.yaml`) 包含以下部分：

```yaml
version: "1.0"
agent:
  name: "agent-name"
  role: "角色名称"
  type: "specialist|coordinator"

role_definition:
  title: "角色标题"
  description: "详细描述"
  responsibilities:
    - "职责 1"
    - "职责 2"

model:
  provider: "bailian"
  model: "qwen3.5-plus"
  temperature: 0.5
  max_tokens: 4096

tools:
  allowed:
    - "tool-1"
    - "tool-2"
  denied:
    - "tool-3"

workspace:
  base_path: "./path"
  # ...

prompts:
  system: "系统提示词"
  # ...
```

### 共享工具配置

`shared/tools.yaml` 定义了所有 Agent 可以使用的工具：

- **云提供商**: 阿里云、AWS 等
- **容器工具**: Kubernetes, Docker, Helm
- **CI/CD 工具**: GitHub Actions, GitLab CI
- **监控工具**: Prometheus, Grafana
- **安全工具**: Trivy, SonarQube
- **IaC 工具**: Terraform, Ansible

### 模板文件

`shared/templates/` 包含可复用的模板：

- `terraform-ecs.tf` - ECS 实例 Terraform 模板
- `k8s-deployment.yaml` - Kubernetes 部署模板

### 操作手册

`shared/playbooks/` 包含标准操作手册：

- `incident-response.md` - 事件响应流程
- `deployment-procedure.md` - 部署标准流程

## 📖 使用示例

### 示例 1: 创建云基础设施

```bash
# 分发任务给 Infra Agent
node devops-cli.js dispatch infra "创建 3 台 ECS 实例，规格 ecs.c6.large，部署在杭州可用区 B"
```

### 示例 2: 执行安全扫描

```bash
# 分发任务给 Security Agent
node devops-cli.js dispatch security "对镜像 registry.cn-hangzhou.aliyuncs.com/myapp:v1.0 进行安全扫描"
```

### 示例 3: 部署应用

```bash
# 执行部署工作流
node devops-cli.js workflow deploy-production
```

### 示例 4: 查看共享工具

```bash
node devops-cli.js tools
```

## 🔄 工作流

### 预定义工作流

1. **deploy-production** - 生产环境部署流程
   - 代码审查 → 构建 → 测试 → 安全扫描 → 部署 → 验证

2. **emergency-response** - 应急响应流程
   - 告警接收 → 初步诊断 → 缓解措施 → 根因分析 → 恢复 → 总结

3. **security-audit** - 安全审计流程
   - 资产发现 → 漏洞扫描 → 风险评估 → 修复建议 → 验证

4. **infra-provision** - 基础设施配置流程
   - 需求分析 → 设计 → IaC 编写 → 审查 → 部署 → 验证

5. **monitoring-setup** - 监控体系搭建流程
   - 指标定义 → 采集配置 → 告警规则 → 仪表盘 → 通知策略

### 自定义工作流

在 `examples/` 目录下创建自定义工作流配置。

## 📚 最佳实践

### 1. 任务分配原则

- **Infra**: 所有云资源相关操作
- **Security**: 所有安全相关检查和策略
- **CI/CD**: 所有构建、测试、部署操作
- **SRE**: 所有监控、告警、事件响应
- **Manager**: 协调、汇总、复杂任务分解

### 2. 安全原则

- 生产环境操作需要审批
- 所有变更必须有记录
- 敏感信息使用密钥管理
- 定期安全审计

### 3. 监控原则

- 定义清晰的 SLI/SLO
- 告警要有明确的响应流程
- 定期进行混沌工程演练
- 持续优化告警噪音

### 4. 成本优化

- 定期审查资源使用率
- 使用自动伸缩
- 选择合适的实例类型
- 利用预留实例

## 📁 目录结构

```
devops-team/
├── manager/              # 总协调 Agent
│   └── agent.yaml
├── infra/                # 基础设施工程师
│   └── agent.yaml
├── security/             # 安全工程师
│   └── agent.yaml
├── cicd/                 # CI/CD 工程师
│   └── agent.yaml
├── sre/                  # SRE/监控工程师
│   └── agent.yaml
├── shared/               # 共享资源
│   ├── tools.yaml        # 共享工具配置
│   ├── templates/        # Terraform/K8s 模板
│   └── playbooks/        # 标准操作手册
├── examples/             # 示例工作流
├── tests/                # 测试用例
├── devops-cli.js         # CLI 入口
└── README.md             # 本文档
```

## 🔧 CLI 命令

| 命令 | 描述 |
|------|------|
| `status` | 显示所有 Agent 状态 |
| `info <agent>` | 显示指定 Agent 详细信息 |
| `list` | 列出所有可用 Agent |
| `tools` | 显示共享工具配置 |
| `dispatch <agent> <task>` | 分发任务到指定 Agent |
| `workflow <name>` | 执行预定义工作流 |
| `validate` | 验证所有配置 |
| `init` | 初始化团队配置 |
| `help` | 显示帮助信息 |

## 🤝 协作模式

### 单 Agent 任务
```
用户 → Manager → 专业 Agent → 结果
```

### 多 Agent 协作
```
用户 → Manager → [Infra + Security + CI/CD] → 汇总 → 结果
```

### 复杂任务分解
```
用户 → Manager → 分解为子任务 → 分发 → 协调 → 汇总 → 结果
```

## 📝 版本历史

- **v1.0.0** (2026-03-29) - 初始版本
  - 5 个专业 Agent 配置
  - 共享工具配置
  - CLI 工具
  - 模板和 Playbooks

## 📞 支持

如有问题或建议，请查看各 Agent 的配置文件或联系 DevOps 团队。

---

**DevOps 多 Agent 团队** - 让 AI 协作提升 DevOps 效率 🚀
