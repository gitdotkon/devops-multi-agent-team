#!/usr/bin/env node

/**
 * 集成测试
 * 测试多 Agent 协作场景
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// 测试配置
const TEST_CONFIG = {
  workspaceBase: path.join(__dirname, '..')
};

// 测试结果
const results = {
  passed: 0,
  failed: 0,
  scenarios: []
};

// 测试断言
function assert(condition, message) {
  if (condition) {
    results.passed++;
    results.scenarios.push({ status: 'PASS', message });
    console.log(`✅ PASS: ${message}`);
  } else {
    results.failed++;
    results.scenarios.push({ status: 'FAIL', message });
    console.log(`❌ FAIL: ${message}`);
  }
}

// 场景 1: 生产部署协作
function testProductionDeployment() {
  console.log('\n🚀 场景测试 1: 生产环境部署协作\n');
  
  // 加载相关 Agent 配置
  const cicdConfig = loadAgentConfig('cicd');
  const securityConfig = loadAgentConfig('security');
  const sreConfig = loadAgentConfig('sre');
  const managerConfig = loadAgentConfig('manager');
  
  assert(
    cicdConfig !== null,
    'CI/CD Agent 配置加载成功'
  );
  
  assert(
    securityConfig !== null,
    'Security Agent 配置加载成功'
  );
  
  assert(
    sreConfig !== null,
    'SRE Agent 配置加载成功'
  );
  
  assert(
    managerConfig !== null,
    'Manager Agent 配置加载成功'
  );
  
  // 验证 CI/CD Agent 有部署权限
  assert(
    cicdConfig.tools.allowed.includes('kubectl'),
    'CI/CD Agent 有 kubectl 权限'
  );
  
  assert(
    cicdConfig.tools.allowed.includes('helm'),
    'CI/CD Agent 有 helm 权限'
  );
  
  // 验证 Security Agent 有扫描权限
  assert(
    securityConfig.tools.allowed.includes('trivy'),
    'Security Agent 有 trivy 权限'
  );
  
  // 验证 SRE Agent 有监控权限
  assert(
    sreConfig.tools.allowed.includes('prometheus'),
    'SRE Agent 有 prometheus 权限'
  );
  
  assert(
    sreConfig.tools.allowed.includes('grafana'),
    'SRE Agent 有 grafana 权限'
  );
  
  // 验证 Manager Agent 有协调权限
  assert(
    managerConfig.tools.allowed.includes('task_dispatch'),
    'Manager Agent 有任务分发权限'
  );
  
  assert(
    managerConfig.tools.allowed.includes('result_aggregator'),
    'Manager Agent 有结果汇总权限'
  );
  
  // 验证工作流配置
  const workflowPath = path.join(TEST_CONFIG.workspaceBase, 'examples', 'deploy-production.yaml');
  assert(
    fs.existsSync(workflowPath),
    '生产部署工作流配置存在'
  );
  
  const workflowContent = fs.readFileSync(workflowPath, 'utf8');
  const workflow = yaml.load(workflowContent);
  
  assert(
    workflow.workflow.name === 'deploy-production',
    '工作流名称正确'
  );
  
  assert(
    workflow.stages.length >= 5,
    '工作流包含足够的阶段'
  );
  
  assert(
    workflow.agents.includes('manager'),
    '工作流包含 Manager Agent'
  );
  
  assert(
    workflow.agents.includes('security'),
    '工作流包含 Security Agent'
  );
  
  assert(
    workflow.agents.includes('cicd'),
    '工作流包含 CI/CD Agent'
  );
  
  assert(
    workflow.agents.includes('sre'),
    '工作流包含 SRE Agent'
  );
}

// 场景 2: 应急响应协作
function testEmergencyResponse() {
  console.log('\n🚨 场景测试 2: 应急响应协作\n');
  
  // 加载相关 Agent 配置
  const sreConfig = loadAgentConfig('sre');
  const managerConfig = loadAgentConfig('manager');
  const infraConfig = loadAgentConfig('infra');
  
  assert(
    sreConfig !== null,
    'SRE Agent 配置加载成功'
  );
  
  assert(
    managerConfig !== null,
    'Manager Agent 配置加载成功'
  );
  
  assert(
    infraConfig !== null,
    'Infra Agent 配置加载成功'
  );
  
  // 验证 SRE Agent 有事件响应权限
  assert(
    sreConfig.role_definition.responsibilities.includes('事件响应'),
    'SRE Agent 职责包含事件响应'
  );
  
  assert(
    sreConfig.tools.allowed.includes('alertmanager'),
    'SRE Agent 有 alertmanager 权限'
  );
  
  // 验证 Manager Agent 有通知权限
  assert(
    managerConfig.tools.allowed.includes('notification'),
    'Manager Agent 有通知权限'
  );
  
  // 验证 Infra Agent 有基础设施访问权限
  assert(
    infraConfig.tools.allowed.includes('aliyun_cli'),
    'Infra Agent 有 aliyun_cli 权限'
  );
  
  // 验证应急响应工作流
  const workflowPath = path.join(TEST_CONFIG.workspaceBase, 'examples', 'emergency-response.yaml');
  assert(
    fs.existsSync(workflowPath),
    '应急响应工作流配置存在'
  );
  
  const workflowContent = fs.readFileSync(workflowPath, 'utf8');
  const workflow = yaml.load(workflowContent);
  
  assert(
    workflow.workflow.priority === 'critical',
    '应急响应工作流优先级正确'
  );
  
  assert(
    workflow.severity_levels !== undefined,
    '工作流定义了事件分级'
  );
  
  assert(
    workflow.escalation !== undefined,
    '工作流定义了升级策略'
  );
}

// 场景 3: 安全审计协作
function testSecurityAudit() {
  console.log('\n🔒 场景测试 3: 安全审计协作\n');
  
  const securityConfig = loadAgentConfig('security');
  const cicdConfig = loadAgentConfig('cicd');
  
  assert(
    securityConfig !== null,
    'Security Agent 配置加载成功'
  );
  
  assert(
    cicdConfig !== null,
    'CI/CD Agent 配置加载成功'
  );
  
  // 验证 Security Agent 职责
  assert(
    securityConfig.role_definition.responsibilities.includes('漏洞评估'),
    'Security Agent 职责包含漏洞评估'
  );
  
  assert(
    securityConfig.role_definition.responsibilities.includes('合规检查'),
    'Security Agent 职责包含合规检查'
  );
  
  // 验证 Security Agent 工具权限
  assert(
    securityConfig.tools.allowed.includes('sonarqube'),
    'Security Agent 有 sonarqube 权限'
  );
  
  assert(
    securityConfig.tools.allowed.includes('vault'),
    'Security Agent 有 vault 权限'
  );
  
  // 验证安全基线
  assert(
    securityConfig.security_baselines !== undefined,
    'Security Agent 定义了安全基线'
  );
  
  assert(
    securityConfig.security_baselines.container.length > 0,
    '定义了容器安全基线'
  );
  
  assert(
    securityConfig.security_baselines.kubernetes.length > 0,
    '定义了 Kubernetes 安全基线'
  );
}

// 场景 4: 基础设施配置协作
function testInfraProvisioning() {
  console.log('\n☁️  场景测试 4: 基础设施配置协作\n');
  
  const infraConfig = loadAgentConfig('infra');
  const securityConfig = loadAgentConfig('security');
  
  assert(
    infraConfig !== null,
    'Infra Agent 配置加载成功'
  );
  
  // 验证 Infra Agent 职责
  assert(
    infraConfig.role_definition.responsibilities.includes('云资源 provisioning'),
    'Infra Agent 职责包含云资源 provisioning'
  );
  
  assert(
    infraConfig.role_definition.responsibilities.includes('IaC 编写与维护'),
    'Infra Agent 职责包含 IaC 编写'
  );
  
  // 验证 Infra Agent 工具权限
  assert(
    infraConfig.tools.allowed.includes('terraform'),
    'Infra Agent 有 terraform 权限'
  );
  
  assert(
    infraConfig.tools.allowed.includes('ansible'),
    'Infra Agent 有 ansible 权限'
  );
  
  // 验证模板文件
  const terraformTemplate = path.join(
    TEST_CONFIG.workspaceBase,
    'shared',
    'templates',
    'terraform-ecs.tf'
  );
  
  assert(
    fs.existsSync(terraformTemplate),
    'Terraform ECS 模板存在'
  );
  
  const templateContent = fs.readFileSync(terraformTemplate, 'utf8');
  assert(
    templateContent.includes('resource "alicloud_instance"'),
    'Terraform 模板包含 ECS 资源定义'
  );
}

// 场景 5: 监控体系搭建协作
function testMonitoringSetup() {
  console.log('\n📊 场景测试 5: 监控体系搭建协作\n');
  
  const sreConfig = loadAgentConfig('sre');
  const infraConfig = loadAgentConfig('infra');
  
  assert(
    sreConfig !== null,
    'SRE Agent 配置加载成功'
  );
  
  // 验证 SRE Agent 职责
  assert(
    sreConfig.role_definition.responsibilities.includes('监控体系建设'),
    'SRE Agent 职责包含监控体系建设'
  );
  
  assert(
    sreConfig.role_definition.responsibilities.includes('SLI/SLO 定义'),
    'SRE Agent 职责包含 SLI/SLO 定义'
  );
  
  // 验证 SRE Agent 工具权限
  assert(
    sreConfig.tools.allowed.includes('prometheus'),
    'SRE Agent 有 prometheus 权限'
  );
  
  assert(
    sreConfig.tools.allowed.includes('grafana'),
    'SRE Agent 有 grafana 权限'
  );
  
  // 验证 SLO 模板
  assert(
    sreConfig.slo_templates !== undefined,
    'SRE Agent 定义了 SLO 模板'
  );
  
  assert(
    sreConfig.slo_templates.availability !== undefined,
    '定义了可用性 SLO'
  );
  
  assert(
    sreConfig.slo_templates.latency !== undefined,
    '定义了延迟 SLO'
  );
  
  // 验证告警级别
  assert(
    sreConfig.alert_severities !== undefined,
    'SRE Agent 定义了告警级别'
  );
  
  assert(
    sreConfig.alert_severities.critical !== undefined,
    '定义了 critical 级别'
  );
}

// 辅助函数：加载 Agent 配置
function loadAgentConfig(agentName) {
  const configPath = path.join(TEST_CONFIG.workspaceBase, agentName, 'agent.yaml');
  if (!fs.existsSync(configPath)) {
    return null;
  }
  
  try {
    const content = fs.readFileSync(configPath, 'utf8');
    return yaml.load(content);
  } catch (err) {
    return null;
  }
}

// 运行所有场景测试
function runAllScenarios() {
  console.log('='.repeat(60));
  console.log('🧪 DevOps 多 Agent 团队 - 集成测试');
  console.log('='.repeat(60));
  
  testProductionDeployment();
  testEmergencyResponse();
  testSecurityAudit();
  testInfraProvisioning();
  testMonitoringSetup();
  
  // 测试总结
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试结果总结');
  console.log('='.repeat(60));
  console.log(`✅ 通过：${results.passed}`);
  console.log(`❌ 失败：${results.failed}`);
  console.log(`📝 总计：${results.passed + results.failed}`);
  console.log('='.repeat(60));
  
  if (results.failed > 0) {
    console.log('\n❌ 测试失败，请检查上述错误\n');
    process.exit(1);
  } else {
    console.log('\n✅ 所有集成测试通过！\n');
    process.exit(0);
  }
}

// 执行测试
runAllScenarios();
