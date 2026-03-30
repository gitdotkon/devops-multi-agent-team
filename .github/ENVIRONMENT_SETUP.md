# GitHub Actions 环境和 Secrets 配置指南

## 📋 目录

1. [Environment 配置](#environment-配置)
2. [Secrets 配置](#secrets-配置)
3. [Variables 配置](#variables-配置)
4. [使用指南](#使用指南)

---

## Environment 配置

在 GitHub 仓库中创建以下环境：

### 1. `all-in-one` 环境

用于 All-in-One 快速部署方案。

**配置步骤**：
1. 进入 Settings → Environments → New environment
2. 输入环境名称：`all-in-one`
3. 配置部署分支限制（可选）

### 2. `dev` 环境

开发环境，自动部署。

### 3. `test` 环境

测试环境，需要手动触发。

**部署保护规则**（可选）：
- ✅ Required reviewers: 添加审批人
- ✅ Wait timer: 设置等待时间

### 4. `production` 环境

生产环境，严格保护。

**部署保护规则**（推荐）：
- ✅ Required reviewers: 至少 1 人审批
- ✅ Wait timer: 15 分钟
- ✅ Deployment branches: 仅 `main` 分支

---

## Secrets 配置

### 必需 Secrets

| Secret 名称 | 说明 | 获取方式 |
|------------|------|---------|
| `ALIYUN_ACCESS_KEY_ID` | 阿里云 AccessKey ID | 阿里云 RAM 控制台 |
| `ALIYUN_ACCESS_KEY_SECRET` | 阿里云 AccessKey Secret | 阿里云 RAM 控制台 |
| `SSH_PRIVATE_KEY` | SSH 私钥（用于连接 ECS） | 本地生成或阿里云密钥对 |

### 可选 Secrets

| Secret 名称 | 说明 | 用途 |
|------------|------|------|
| `DINGTALK_WEBHOOK` | 钉钉机器人 Webhook | 部署通知 |
| `SLACK_WEBHOOK_URL` | Slack Webhook | 部署通知 |
| `GRAFANA_API_KEY` | Grafana API Key | 监控集成 |

---

## 获取阿里云 AccessKey

### 方式 1: RAM 用户（推荐）

1. 登录 [阿里云 RAM 控制台](https://ram.console.aliyun.com/)
2. 创建 RAM 用户
3. 授予权限：`AliyunECSFullAccess`, `AliyunVPCFullAccess`, `AliyunRDSFullAccess`
4. 创建 AccessKey

### 方式 2: 主账号（不推荐用于生产）

1. 登录 [阿里云控制台](https://ram.console.aliyun.com/manage/ak)
2. AccessKey 管理 → 创建 AccessKey

### 最小权限策略

```json
{
  "Version": "1",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecs:*",
        "vpc:*",
        "rds:*",
        "slb:*",
        "oss:*"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## 生成 SSH 密钥对

### 本地生成

```bash
# 生成 SSH 密钥
ssh-keygen -t ed25519 -C "gitlab-deploy" -f ~/.ssh/gitlab-deploy

# 查看公钥（添加到 ECS）
cat ~/.ssh/gitlab-deploy.pub

# 查看私钥（添加到 GitHub Secrets）
cat ~/.ssh/gitlab-deploy
```

### 使用阿里云密钥对

1. 登录 [阿里云 ECS 控制台](https://ecs.console.aliyun.com/#/keyPair/region/)
2. 创建密钥对
3. 下载私钥
4. 转换为 OpenSSH 格式（如需要）

---

## Variables 配置

| Variable 名称 | 说明 | 示例值 |
|--------------|------|--------|
| `GITLAB_URL` | GitLab 访问 URL | `https://gitlab.example.com` |
| `ALIYUN_REGION` | 阿里云区域 | `cn-hangzhou` |
| `ECS_INSTANCE_TYPE` | 默认实例规格 | `ecs.g6.xlarge` |

---

## 使用指南

### 1. 配置 Secrets

```bash
# 方式 1: 通过 GitHub CLI
gh secret set ALIYUN_ACCESS_KEY_ID --body "your-access-key-id"
gh secret set ALIYUN_ACCESS_KEY_SECRET --body "your-access-key-secret"
gh secret set SSH_PRIVATE_KEY --body-file ~/.ssh/gitlab-deploy

# 方式 2: 通过 GitHub Web UI
# Settings → Secrets and variables → Actions → New repository secret
```

### 2. 配置 Environment Secrets

```bash
# 为特定环境设置 Secrets
gh secret set ALIYUN_ACCESS_KEY_ID --env test --body "your-test-access-key-id"
```

### 3. 触发部署

#### 自动部署
- Push 到 `main` 分支自动触发 CI
- CI 成功后自动部署到开发环境

#### 手动部署

1. 进入 Actions → CD - Deploy GitLab to Aliyun
2. 点击 "Run workflow"
3. 选择部署环境和策略
4. 点击 "Run workflow"

---

## 成本监控

### 阿里云成本

| 方案 | 月成本 | 说明 |
|------|--------|------|
| All-in-One | ¥270 | 单 ECS，适合学习 |
| 测试环境 | ¥580 | ECS+RDS+Redis |
| 生产环境 | ¥3,300 | 3 节点高可用 |

### GitHub Actions 用量

- 公共仓库：免费（无限制）
- 私有仓库：2000 分钟/月（免费）

---

## 故障排查

### 常见问题

#### 1. 阿里云认证失败
```
Error: InvalidAccessKeyId.NotFound
```
**解决**：检查 AccessKey ID 和 Secret 是否正确

#### 2. SSH 连接失败
```
Permission denied (publickey)
```
**解决**：
- 确认 SSH 私钥已正确添加到 Secrets
- 确认 ECS 安全组允许 SSH 访问

#### 3. GitLab 启动超时
```
GitLab failed to start
```
**解决**：
- 检查 ECS 资源是否充足（内存至少 4GB）
- 查看 GitLab 日志：`ssh root@IP "tail -f /var/log/gitlab/gitlab-rails/production.log"`

---

## 安全最佳实践

1. **最小权限原则**：RAM 用户只授予必要权限
2. **定期轮换密钥**：每 90 天更换 AccessKey
3. **使用环境变量**：不在代码中硬编码敏感信息
4. **启用部署保护**：生产环境需要审批
5. **审计日志**：定期检查 GitHub Actions 日志

---

## 下一步

配置完成后，运行以下命令验证：

```bash
# 验证 GitHub Actions 配置
cd devops-multi-agent-team
node devops-cli.js validate

# 触发测试部署
git commit --allow-empty -m "test: trigger CI/CD"
git push
```
