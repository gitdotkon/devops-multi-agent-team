# 部署标准操作手册

## 1. 部署前检查清单

### 1.1 代码检查
- [ ] 代码审查完成
- [ ] 所有测试通过
- [ ] 安全扫描通过
- [ ] 版本号已更新

### 1.2 环境检查
- [ ] 目标环境可用
- [ ] 资源充足
- [ ] 依赖服务正常
- [ ] 备份已完成

### 1.3 人员检查
- [ ] 值班人员就位
- [ ] 相关人员通知
- [ ] 回滚方案确认

## 2. 部署流程

### 2.1 准备阶段
```bash
# 拉取最新代码
git pull origin main

# 构建镜像
docker build -t {{image_name}}:{{version}} .

# 推送镜像
docker push {{registry}}/{{image_name}}:{{version}}

# 更新标签
docker tag {{image_name}}:{{version}} {{registry}}/{{image_name}}:latest
docker push {{registry}}/{{image_name}}:latest
```

### 2.2 部署阶段
```bash
# 更新 Kubernetes 配置
kubectl set image deployment/{{app_name}} \
  {{container_name}}={{registry}}/{{image_name}}:{{version}} \
  --namespace={{namespace}}

# 或者使用 Helm
helm upgrade {{release_name}} ./chart \
  --set image.tag={{version}} \
  --namespace={{namespace}}
```

### 2.3 验证阶段
```bash
# 检查部署状态
kubectl rollout status deployment/{{app_name}} --namespace={{namespace}}

# 检查 Pod 状态
kubectl get pods -l app={{app_name}} --namespace={{namespace}}

# 查看日志
kubectl logs -l app={{app_name}} --namespace={{namespace}} --tail=50

# 健康检查
curl -f http://{{service_endpoint}}/health/live
curl -f http://{{service_endpoint}}/health/ready
```

### 2.4 监控阶段
- 观察错误率
- 监控响应时间
- 检查资源使用
- 验证业务指标

## 3. 回滚流程

### 3.1 快速回滚
```bash
# Kubernetes 回滚
kubectl rollout undo deployment/{{app_name}} --namespace={{namespace}}

# 回滚到特定版本
kubectl rollout undo deployment/{{app_name}} \
  --to-revision={{revision}} \
  --namespace={{namespace}}

# Helm 回滚
helm rollback {{release_name}} {{revision}} --namespace={{namespace}}
```

### 3.2 回滚验证
```bash
# 确认回滚成功
kubectl rollout status deployment/{{app_name}} --namespace={{namespace}}

# 验证版本
kubectl get deployment {{app_name}} -o jsonpath='{.spec.template.spec.containers[0].image}'

# 功能验证
# 运行关键功能测试
```

## 4. 灰度发布

### 4.1 金丝雀部署
```yaml
# 10% 流量
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: {{app_name}}
spec:
  hosts:
    - {{app_name}}
  http:
    - route:
        - destination:
            host: {{app_name}}
            subset: stable
          weight: 90
        - destination:
            host: {{app_name}}
            subset: canary
          weight: 10
```

### 4.2 逐步放量
1. 10% 流量 - 观察 15 分钟
2. 25% 流量 - 观察 30 分钟
3. 50% 流量 - 观察 1 小时
4. 100% 流量 - 完成发布

## 5. 部署后检查

### 5.1 技术检查
- [ ] 所有 Pod 运行正常
- [ ] 服务发现正常
- [ ] 日志输出正常
- [ ] 指标采集正常

### 5.2 业务检查
- [ ] 核心功能正常
- [ ] 用户流程通畅
- [ ] 数据一致性
- [ ] 第三方集成正常

### 5.3 文档更新
- [ ] 更新变更记录
- [ ] 更新 API 文档
- [ ] 更新运维手册
- [ ] 通知相关团队
