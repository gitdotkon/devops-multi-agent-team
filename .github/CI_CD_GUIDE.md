# GitHub Actions CI/CD 快速入门

本指南帮助你快速配置和使用 GitHub Actions 自动化部署 GitLab 到阿里云。

---

## 📁 工作流文件说明

已创建以下工作流文件：

| 文件 | 用途 | 触发条件 |
|------|------|---------|
| `.github/workflows/ci.yml` | 持续集成（代码检查、测试、安全扫描） | Push/PR |
| `.github/workflows/cd-gitlab.yml` | 部署 GitLab 到阿里云（生产/测试/开发） | CI 成功后/手动 |
| `.github/workflows/cd-all-in-one.yml` | 快速部署 All-in-One GitLab | 手动 |

---

## 🚀 快速开始

### 步骤 1: Fork 仓库

```bash
# 在 GitHub 上 Fork 此仓库
# 或克隆到本地
git clone https://github.com/gitdotkon/devops-multi-agent-team.git
cd devops-multi-agent-team
```

### 步骤 2: 配置阿里云凭证

1. 获取阿里云 AccessKey：
   - 登录 [阿里云 RAM 控制台](https://ram.console.aliyun.com/)
   - 创建用户并授予 `AliyunECSFullAccess`, `AliyunVPCFullAccess` 权限
   - 创建 AccessKey

2. 生成 SSH 密钥：
```bash
ssh-keygen -t ed25519 -C "gitlab-deploy" -f ~/.ssh/gitlab-deploy
```

### 步骤 3: 配置 GitHub Secrets

```bash
# 使用 GitHub CLI 配置（推荐）
gh secret set ALIYUN_ACCESS_KEY_ID --body "your-access-key-id"
gh secret set ALIYUN_ACCESS_KEY_SECRET --body "your-access-key-secret"
gh secret set SSH_PRIVATE_KEY --body-file ~/.ssh/gitlab-deploy

# 或在 GitHub Web UI 配置：
# Settings → Secrets and variables → Actions → New repository secret
```

### 步骤 4: 触发部署

#### 方式 1: 自动触发

```bash
# 提交代码触发 CI
git commit --allow-empty -m "test: trigger CI/CD"
git push
```

#### 方式 2: 手动触发

1. 进入 GitHub Actions
2. 选择 "CD - GitLab All-in-One Deploy"
3. 点击 "Run workflow"
4. 选择配置后运行

---

## 📊 工作流详解

### CI 工作流 (ci.yml)

```
┌─────────────────────────────────────────────────────────────┐
│                     CI Pipeline                             │
├─────────────────────────────────────────────────────────────┤
│  1. Code Lint        → 代码风格检查                         │
│  2. Validate Agents  → Agent 配置验证                        │
│  3. Unit Tests       → 单元测试                              │
│  4. Validate TF      → Terraform 格式验证                    │
│  5. Security Scan    → Trivy 安全扫描                        │
│  6. Build            → 构建验证                              │
└─────────────────────────────────────────────────────────────┘
```

### CD 工作流 (cd-gitlab.yml)

```
┌─────────────────────────────────────────────────────────────┐
│                  CD Pipeline (生产/测试)                    │
├─────────────────────────────────────────────────────────────┤
│  1. Pre-check        → 部署前检查                           │
│  2. Configure Aliyun → 配置阿里云凭证                       │
│  3. Terraform Init   → 初始化 Terraform                     │
│  4. Deploy Infra     → 部署基础设施 (VPC/ECS/RDS/SLB)        │
│  5. Deploy GitLab    → 部署 GitLab 应用                      │
│  6. Health Check     → 健康验证                             │
│  7. Notify           → 发送通知                             │
└─────────────────────────────────────────────────────────────┘
```

### All-in-One 工作流 (cd-all-in-one.yml)

```
┌─────────────────────────────────────────────────────────────┐
│               CD Pipeline (All-in-One 快速部署)             │
├─────────────────────────────────────────────────────────────┤
│  1. Create ECS       → 创建 ECS 实例                          │
│  2. Install GitLab   → 安装 GitLab                          │
│  3. Configure Backup → 配置自动备份（可选）                 │
│  4. Output Info      → 输出访问信息                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 💰 成本对比

| 方案 | 配置 | 月成本 | 部署时间 | 适用场景 |
|------|------|--------|---------|---------|
| **All-in-One** | 单 ECS | ¥270 | 10 分钟 | 个人学习 |
| **测试环境** | ECS+RDS+Redis | ¥580 | 20 分钟 | 开发测试 |
| **生产环境** | 3 节点高可用 | ¥3,300 | 40 分钟 | 企业生产 |

---

## 🔧 自定义配置

### 修改部署参数

编辑工作流文件中的环境变量：

```yaml
# .github/workflows/cd-gitlab.yml
env:
  ALIYUN_REGION: cn-hangzhou  # 修改区域
```

### 添加通知渠道

```yaml
# 添加钉钉通知
- name: Send DingTalk notification
  uses: zhanglongfei001/dingtalk-action@v1
  with:
    webhook: ${{ secrets.DINGTALK_WEBHOOK }}
    message: |
      ## GitLab 部署完成
      - 环境：${{ github.event.inputs.environment }}
      - 结果：成功 ✅
```

### 添加审批流程

```yaml
# 在需要审批的 job 中添加
environment:
  name: production
  url: https://gitlab.example.com
```

---

## 📝 常见任务

### 1. 查看部署状态

```bash
# GitHub CLI
gh run list          # 查看所有运行
gh run view <ID>     # 查看详情
gh run watch <ID>    # 实时查看
```

### 2. 重新运行失败的部署

```bash
gh run rerun <ID>
```

### 3. 取消运行中的部署

```bash
gh run cancel <ID>
```

### 4. 查看日志

```bash
gh run view <ID> --log
```

---

## ⚠️ 故障排查

### 问题 1: 阿里云认证失败

```
Error: InvalidAccessKeyId.NotFound
```

**解决**：
1. 检查 AccessKey ID 和 Secret 是否正确
2. 确认 RAM 用户有足够权限

### 问题 2: SSH 连接失败

```
Permission denied (publickey)
```

**解决**：
1. 确认 SSH 私钥格式正确
2. 确认 ECS 安全组允许 SSH

### 问题 3: GitLab 启动超时

**解决**：
```bash
# SSH 登录 ECS 查看日志
ssh root@<ECS_IP>
tail -f /var/log/gitlab/gitlab-rails/production.log
```

---

## 🔐 安全最佳实践

1. **使用 RAM 用户**：不要使用主账号 AccessKey
2. **定期轮换密钥**：每 90 天更换 AccessKey
3. **启用环境防护**：生产环境需要审批
4. **最小权限原则**：只授予必要权限
5. **审计日志**：定期检查部署日志

---

## 📚 相关文档

- [环境和 Secrets 配置](ENVIRONMENT_SETUP.md)
- [GitLab 部署指南](../docs/gitlab-deployment-guide.md)
- [README](../README.md)

---

## 💡 下一步

1. ✅ 配置 Secrets 和环境
2. ✅ 触发测试部署
3. ✅ 验证 GitLab 访问
4. ✅ 配置域名和 HTTPS
5. ✅ 设置自动备份

有任何问题，请提交 Issue！
