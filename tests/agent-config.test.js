#!/usr/bin/env node

/**
 * Agent 配置测试
 * 验证所有 Agent 配置文件的完整性和正确性
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// 测试配置
const TEST_CONFIG = {
  workspaceBase: path.join(__dirname, '..'),
  agents: ['manager', 'infra', 'security', 'cicd', 'sre']
};

// 测试结果
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// 测试断言
function assert(condition, message) {
  if (condition) {
    results.passed++;
    results.tests.push({ status: 'PASS', message });
    console.log(`✅ PASS: ${message}`);
  } else {
    results.failed++;
    results.tests.push({ status: 'FAIL', message });
    console.log(`❌ FAIL: ${message}`);
  }
}

// 测试：Agent 配置文件存在
function testAgentConfigExists() {
  console.log('\n📁 测试：Agent 配置文件存在\n');
  
  TEST_CONFIG.agents.forEach(agent => {
    const configPath = path.join(TEST_CONFIG.workspaceBase, agent, 'agent.yaml');
    assert(
      fs.existsSync(configPath),
      `${agent}/agent.yaml 文件存在`
    );
  });
}

// 测试：Agent 配置结构
function testAgentConfigStructure() {
  console.log('\n📋 测试：Agent 配置结构\n');
  
  const requiredFields = [
    'version',
    'agent',
    'role_definition',
    'model',
    'tools',
    'workspace',
    'prompts'
  ];
  
  TEST_CONFIG.agents.forEach(agent => {
    const configPath = path.join(TEST_CONFIG.workspaceBase, agent, 'agent.yaml');
    const content = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(content);
    
    requiredFields.forEach(field => {
      assert(
        config[field] !== undefined,
        `${agent}: 包含必需字段 "${field}"`
      );
    });
  });
}

// 测试：Agent 基本信息
function testAgentBasicInfo() {
  console.log('\n🤖 测试：Agent 基本信息\n');
  
  TEST_CONFIG.agents.forEach(agent => {
    const configPath = path.join(TEST_CONFIG.workspaceBase, agent, 'agent.yaml');
    const content = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(content);
    
    assert(
      config.agent.name !== undefined,
      `${agent}: 定义了 agent.name`
    );
    
    assert(
      config.agent.role !== undefined,
      `${agent}: 定义了 agent.role`
    );
    
    assert(
      config.agent.type !== undefined,
      `${agent}: 定义了 agent.type`
    );
    
    assert(
      ['coordinator', 'specialist'].includes(config.agent.type),
      `${agent}: agent.type 是有效值`
    );
  });
}

// 测试：角色定义
function testRoleDefinition() {
  console.log('\n📝 测试：角色定义\n');
  
  TEST_CONFIG.agents.forEach(agent => {
    const configPath = path.join(TEST_CONFIG.workspaceBase, agent, 'agent.yaml');
    const content = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(content);
    
    assert(
      config.role_definition.title !== undefined,
      `${agent}: 定义了角色标题`
    );
    
    assert(
      config.role_definition.description !== undefined,
      `${agent}: 定义了角色描述`
    );
    
    assert(
      Array.isArray(config.role_definition.responsibilities),
      `${agent}: 职责是数组`
    );
    
    assert(
      config.role_definition.responsibilities.length > 0,
      `${agent}: 至少定义了一个职责`
    );
  });
}

// 测试：模型配置
function testModelConfig() {
  console.log('\n🧠 测试：模型配置\n');
  
  const requiredModelFields = ['provider', 'model', 'temperature', 'max_tokens'];
  
  TEST_CONFIG.agents.forEach(agent => {
    const configPath = path.join(TEST_CONFIG.workspaceBase, agent, 'agent.yaml');
    const content = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(content);
    
    requiredModelFields.forEach(field => {
      assert(
        config.model[field] !== undefined,
        `${agent}: 模型配置包含 "${field}"`
      );
    });
    
    assert(
      config.model.temperature >= 0 && config.model.temperature <= 1,
      `${agent}: temperature 在有效范围 [0, 1]`
    );
    
    assert(
      config.model.max_tokens > 0,
      `${agent}: max_tokens 是正数`
    );
  });
}

// 测试：工具权限
function testToolPermissions() {
  console.log('\n🔧 测试：工具权限\n');
  
  TEST_CONFIG.agents.forEach(agent => {
    const configPath = path.join(TEST_CONFIG.workspaceBase, agent, 'agent.yaml');
    const content = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(content);
    
    assert(
      Array.isArray(config.tools.allowed),
      `${agent}: allowed 是数组`
    );
    
    assert(
      Array.isArray(config.tools.denied),
      `${agent}: denied 是数组`
    );
    
    assert(
      config.tools.allowed.length > 0,
      `${agent}: 至少允许一个工具`
    );
  });
}

// 测试：工作区配置
function testWorkspaceConfig() {
  console.log('\n📂 测试：工作区配置\n');
  
  TEST_CONFIG.agents.forEach(agent => {
    const configPath = path.join(TEST_CONFIG.workspaceBase, agent, 'agent.yaml');
    const content = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(content);
    
    assert(
      config.workspace.base_path !== undefined,
      `${agent}: 定义了 base_path`
    );
    
    assert(
      config.workspace.logs_path !== undefined,
      `${agent}: 定义了 logs_path`
    );
    
    assert(
      config.workspace.state_path !== undefined,
      `${agent}: 定义了 state_path`
    );
  });
}

// 测试：提示词模板
function testPrompts() {
  console.log('\n💬 测试：提示词模板\n');
  
  TEST_CONFIG.agents.forEach(agent => {
    const configPath = path.join(TEST_CONFIG.workspaceBase, agent, 'agent.yaml');
    const content = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(content);
    
    assert(
      config.prompts.system !== undefined,
      `${agent}: 定义了 system 提示词`
    );
    
    assert(
      config.prompts.system.length > 50,
      `${agent}: system 提示词内容充足`
    );
  });
}

// 测试：共享工具配置
function testSharedTools() {
  console.log('\n🛠️  测试：共享工具配置\n');
  
  const toolsPath = path.join(TEST_CONFIG.workspaceBase, 'shared', 'tools.yaml');
  
  assert(
    fs.existsSync(toolsPath),
    'shared/tools.yaml 文件存在'
  );
  
  const content = fs.readFileSync(toolsPath, 'utf8');
  const config = yaml.load(content);
  
  assert(
    config.cloud_providers !== undefined,
    '定义了云提供商配置'
  );
  
  assert(
    config.container_tools !== undefined,
    '定义了容器工具配置'
  );
  
  assert(
    config.cicd_tools !== undefined,
    '定义了 CI/CD 工具配置'
  );
  
  assert(
    config.monitoring_tools !== undefined,
    '定义了监控工具配置'
  );
  
  assert(
    config.security_tools !== undefined,
    '定义了安全工具配置'
  );
  
  assert(
    config.iac_tools !== undefined,
    '定义了 IaC 工具配置'
  );
}

// 测试：模板文件
function testTemplates() {
  console.log('\n📄 测试：模板文件\n');
  
  const templatesDir = path.join(TEST_CONFIG.workspaceBase, 'shared', 'templates');
  
  assert(
    fs.existsSync(templatesDir),
    'shared/templates 目录存在'
  );
  
  const templates = fs.readdirSync(templatesDir);
  
  assert(
    templates.length > 0,
    `templates 目录包含 ${templates.length} 个文件`
  );
  
  templates.forEach(template => {
    const templatePath = path.join(templatesDir, template);
    const content = fs.readFileSync(templatePath, 'utf8');
    
    assert(
      content.length > 0,
      `模板文件 ${template} 非空`
    );
  });
}

// 测试：Playbooks
function testPlaybooks() {
  console.log('\n📚 测试：Playbooks\n');
  
  const playbooksDir = path.join(TEST_CONFIG.workspaceBase, 'shared', 'playbooks');
  
  assert(
    fs.existsSync(playbooksDir),
    'shared/playbooks 目录存在'
  );
  
  const playbooks = fs.readdirSync(playbooksDir);
  
  assert(
    playbooks.length > 0,
    `playbooks 目录包含 ${playbooks.length} 个文件`
  );
  
  playbooks.forEach(playbook => {
    const playbookPath = path.join(playbooksDir, playbook);
    const content = fs.readFileSync(playbookPath, 'utf8');
    
    assert(
      content.length > 0,
      `Playbook ${playbook} 非空`
    );
  });
}

// 测试：示例工作流
function testExamples() {
  console.log('\n📖 测试：示例工作流\n');
  
  const examplesDir = path.join(TEST_CONFIG.workspaceBase, 'examples');
  
  assert(
    fs.existsSync(examplesDir),
    'examples 目录存在'
  );
  
  const examples = fs.readdirSync(examplesDir);
  
  assert(
    examples.length > 0,
    `examples 目录包含 ${examples.length} 个文件`
  );
  
  examples.forEach(example => {
    const examplePath = path.join(examplesDir, example);
    
    if (example.endsWith('.yaml')) {
      const content = fs.readFileSync(examplePath, 'utf8');
      const config = yaml.load(content);
      
      assert(
        config.workflow !== undefined,
        `示例 ${example} 包含 workflow 配置`
      );
      
      assert(
        config.stages !== undefined,
        `示例 ${example} 定义了 stages`
      );
    }
  });
}

// 测试：CLI 工具
function testCLI() {
  console.log('\n🔨 测试：CLI 工具\n');
  
  const cliPath = path.join(TEST_CONFIG.workspaceBase, 'devops-cli.js');
  
  assert(
    fs.existsSync(cliPath),
    'devops-cli.js 文件存在'
  );
  
  const content = fs.readFileSync(cliPath, 'utf8');
  
  assert(
    content.includes('#!/usr/bin/env node'),
    'CLI 包含 shebang'
  );
  
  assert(
    content.includes('function main()'),
    'CLI 包含 main 函数'
  );
  
  assert(
    content.includes('showHelp'),
    'CLI 包含帮助功能'
  );
  
  assert(
    content.includes('showStatus'),
    'CLI 包含状态功能'
  );
}

// 运行所有测试
function runAllTests() {
  console.log('='.repeat(60));
  console.log('🧪 DevOps 多 Agent 团队 - 配置测试');
  console.log('='.repeat(60));
  
  testAgentConfigExists();
  testAgentConfigStructure();
  testAgentBasicInfo();
  testRoleDefinition();
  testModelConfig();
  testToolPermissions();
  testWorkspaceConfig();
  testPrompts();
  testSharedTools();
  testTemplates();
  testPlaybooks();
  testExamples();
  testCLI();
  
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
    console.log('\n✅ 所有测试通过！\n');
    process.exit(0);
  }
}

// 执行测试
runAllTests();
