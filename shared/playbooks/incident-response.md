# 事件响应标准操作手册

## 1. 事件分类与优先级

### P0 - 严重事件 (Critical)
- 核心服务完全不可用
- 数据丢失或损坏
- 安全漏洞被利用
- **响应时间**: 立即 (5 分钟内)

### P1 - 高优先级事件 (High)
- 核心服务性能严重下降
- 部分功能不可用
- 潜在安全风险
- **响应时间**: 15 分钟内

### P2 - 中优先级事件 (Medium)
- 非核心服务问题
- 性能轻微下降
- 配置错误
- **响应时间**: 1 小时内

### P3 - 低优先级事件 (Low)
- 轻微问题
- 功能请求
- 优化建议
- **响应时间**: 24 小时内

## 2. 事件响应流程

### 2.1 检测与告警
```bash
# 检查告警状态
kubectl get events --namespace={{namespace}} --sort-by='.lastTimestamp'

# 查看 Pod 状态
kubectl get pods --namespace={{namespace}} -o wide

# 查看服务日志
kubectl logs -l app={{app_name}} --namespace={{namespace}} --tail=100
```

### 2.2 初步评估
1. 确认影响范围
2. 确定优先级
3. 通知相关人员
4. 创建事件工单

### 2.3 诊断步骤
```bash
# 检查资源使用
kubectl top pods --namespace={{namespace}}

# 检查节点状态
kubectl get nodes

# 检查持久化存储
kubectl get pvc --namespace={{namespace}}

# 检查网络策略
kubectl get networkpolicy --namespace={{namespace}}
```

### 2.4 缓解措施
- 重启故障 Pod
- 回滚到稳定版本
- 扩容资源
- 切换流量到备用环境

### 2.5 根因分析
使用 5 Why 方法:
1. 为什么服务不可用？
2. 为什么会出现这个问题？
3. 为什么没有检测到？
4. 为什么预防措施失效？
5. 为什么流程有漏洞？

### 2.6 恢复验证
```bash
# 健康检查
curl -f http://{{service_endpoint}}/health/live

# 功能测试
# 运行自动化测试套件

# 监控验证
# 确认指标恢复正常
```

### 2.7 事后总结
- 编写事件报告
- 记录时间线
- 确定改进行动项
- 更新运行手册

## 3. 联系人列表

| 角色 | 姓名 | 电话 | 邮箱 |
|------|------|------|------|
| On-Call 工程师 | - | - | - |
| DevOps 负责人 | - | - | - |
| 安全负责人 | - | - | - |
| 产品负责人 | - | - | - |

## 4. 升级流程

```
P3 → 值班工程师处理
P2 → 通知团队负责人
P1 → 通知部门负责人 + 启动应急响应
P0 → 通知 CTO + 全员应急响应
```

## 5. 沟通模板

### 初始通知
```
【事件通知】
级别：P{{priority}}
服务：{{service_name}}
影响：{{impact_description}}
时间：{{timestamp}}
状态：调查中
下次更新：{{next_update_time}}
```

### 状态更新
```
【事件更新】
级别：P{{priority}}
服务：{{service_name}}
当前状态：{{current_status}}
已采取措施：{{actions_taken}}
下一步计划：{{next_steps}}
预计恢复时间：{{eta}}
```

### 解决通知
```
【事件解决】
级别：P{{priority}}
服务：{{service_name}}
状态：已恢复
根本原因：{{root_cause}}
解决措施：{{resolution}}
事件报告：{{report_link}}
```
