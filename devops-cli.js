#!/usr/bin/env node

/**
 * DevOps 多 Agent 团队 CLI 工具
 * 
 * 主入口脚本，用于协调和管理 DevOps 多 Agent 团队
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { execSync } = require('child_process');

// 配置
const CONFIG = {
  workspaceBase: path.join(__dirname),
  version: '1.0.0',
  agents: ['manager', 'infra', 'security', 'cicd', 'sre']
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// 加载 Agent 配置
function loadAgentConfig(agentName) {
  const configPath = path.join(CONFIG.workspaceBase, agentName, 'agent.yaml');
  if (!fs.existsSync(configPath)) {
    error(`Agent 配置文件不存在：${configPath}`);
    return null;
  }
  
  try {
    const content = fs.readFileSync(configPath, 'utf8');
    return yaml.load(content);
  } catch (err) {
    error(`加载 Agent 配置失败：${err.message}`);
    return null;
  }
}

// 加载共享工具配置
function loadSharedTools() {
  const toolsPath = path.join(CONFIG.workspaceBase, 'shared', 'tools.yaml');
  if (!fs.existsSync(toolsPath)) {
    error(`共享工具配置不存在：${toolsPath}`);
    return null;
  }
  
  try {
    const content = fs.readFileSync(toolsPath, 'utf8');
    return yaml.load(content);
  } catch (err) {
    error(`加载共享工具配置失败：${err.message}`);
    return null;
  }
}

// 显示帮助信息
function showHelp() {
  console.log(`
${colors.cyan}DevOps 多 Agent 团队 CLI 工具 v${CONFIG.version}${colors.reset}

用法：devops-cli.js <command> [options]

${colors.yellow}命令:${colors.reset}
  status          显示所有 Agent 状态
  info <agent>    显示指定 Agent 详细信息
  list            列出所有可用 Agent
  tools           显示共享工具配置
  dispatch        分发任务到指定 Agent
  workflow        执行预定义工作流
  validate        验证所有配置
  init            初始化团队配置
  help            显示此帮助信息

${colors.yellow}示例:${colors.reset}
  node devops-cli.js status
  node devops-cli.js info infra
  node devops-cli.js dispatch infra "创建 ECS 实例"
  node devops-cli.js workflow deploy-production
  node devops-cli.js validate

${colors.yellow}可用 Agent:${colors.reset}
  ${CONFIG.agents.join(', ')}

${colors.yellow}预定义工作流:${colors.reset}
  deploy-production    生产环境部署
  emergency-response   应急响应流程
  security-audit       安全审计流程
  infra-provision      基础设施配置
  monitoring-setup     监控体系搭建
`);
}

// 显示状态
function showStatus() {
  log('\n📊 DevOps 多 Agent 团队状态\n', 'cyan');
  
  const statusData = [];
  
  CONFIG.agents.forEach(agentName => {
    const config = loadAgentConfig(agentName);
    if (config) {
      statusData.push({
        name: agentName,
        role: config.agent.role,
        status: '✅ 就绪',
        model: config.model.model
      });
    } else {
      statusData.push({
        name: agentName,
        role: '未知',
        status: '❌ 配置错误',
        model: '-'
      });
    }
  });
  
  // 简单的表格输出
  log('Agent 名称         角色                    状态        模型', 'magenta');
  log('─'.repeat(70), 'magenta');
  
  statusData.forEach(data => {
    const name = data.name.padEnd(16);
    const role = (data.role || '-').padEnd(24);
    const status = data.status.padEnd(12);
    log(`${name} ${role} ${status} ${data.model}`, 'green');
  });
  
  log('\n');
  
  // 检查共享资源
  const toolsConfig = loadSharedTools();
  if (toolsConfig) {
    success('共享工具配置：已加载');
  } else {
    error('共享工具配置：加载失败');
  }
  
  // 检查模板
  const templatesDir = path.join(CONFIG.workspaceBase, 'shared', 'templates');
  if (fs.existsSync(templatesDir)) {
    const templates = fs.readdirSync(templatesDir);
    success(`模板文件：${templates.length} 个`);
  }
  
  // 检查 Playbooks
  const playbooksDir = path.join(CONFIG.workspaceBase, 'shared', 'playbooks');
  if (fs.existsSync(playbooksDir)) {
    const playbooks = fs.readdirSync(playbooksDir);
    success(`操作手册：${playbooks.length} 个`);
  }
  
  log('\n');
}

// 显示 Agent 信息
function showAgentInfo(agentName) {
  if (!CONFIG.agents.includes(agentName)) {
    error(`未知的 Agent: ${agentName}`);
    log(`可用 Agent: ${CONFIG.agents.join(', ')}`, 'yellow');
    return;
  }
  
  const config = loadAgentConfig(agentName);
  if (!config) {
    return;
  }
  
  log(`\n🤖 ${config.agent.role} - ${config.agent.name}\n`, 'cyan');
  
  log('角色定义:', 'magenta');
  log(config.role_definition.description);
  
  log('\n主要职责:', 'magenta');
  config.role_definition.responsibilities.forEach((resp, i) => {
    log(`  ${i + 1}. ${resp}`, 'green');
  });
  
  log('\n模型配置:', 'magenta');
  log(`  提供商：${config.model.provider}`);
  log(`  模型：${config.model.model}`);
  log(`  Temperature: ${config.model.temperature}`);
  log(`  Max Tokens: ${config.model.max_tokens}`);
  
  log('\n工具权限:', 'magenta');
  log(`  允许：${config.tools.allowed.length} 个`);
  log(`  拒绝：${config.tools.denied.length} 个`);
  
  log('\n工作区:', 'magenta');
  log(`  基础路径：${config.workspace.base_path}`);
  
  log('\n');
}

// 列出所有 Agent
function listAgents() {
  log('\n📋 可用 Agent 列表\n', 'cyan');
  
  CONFIG.agents.forEach((agentName, index) => {
    const config = loadAgentConfig(agentName);
    if (config) {
      log(`${index + 1}. ${agentName} - ${config.agent.role}`, 'green');
    } else {
      log(`${index + 1}. ${agentName} - ❌ 配置错误`, 'red');
    }
  });
  
  log('\n');
}

// 显示共享工具
function showTools() {
  const toolsConfig = loadSharedTools();
  if (!toolsConfig) {
    return;
  }
  
  log('\n🔧 共享工具配置\n', 'cyan');
  
  // 云提供商
  if (toolsConfig.cloud_providers) {
    log('云提供商:', 'magenta');
    Object.keys(toolsConfig.cloud_providers).forEach(provider => {
      const config = toolsConfig.cloud_providers[provider];
      const status = config.enabled ? '✅' : '❌';
      log(`  ${status} ${provider}: ${config.services.length} 个服务`);
    });
  }
  
  // 容器工具
  if (toolsConfig.container_tools) {
    log('\n容器工具:', 'magenta');
    Object.keys(toolsConfig.container_tools).forEach(tool => {
      const config = toolsConfig.container_tools[tool];
      const status = config.enabled ? '✅' : '❌';
      log(`  ${status} ${tool}`);
    });
  }
  
  // CI/CD 工具
  if (toolsConfig.cicd_tools) {
    log('\nCI/CD 工具:', 'magenta');
    Object.keys(toolsConfig.cicd_tools).forEach(tool => {
      const config = toolsConfig.cicd_tools[tool];
      const status = config.enabled ? '✅' : '❌';
      log(`  ${status} ${tool}`);
    });
  }
  
  // 监控工具
  if (toolsConfig.monitoring_tools) {
    log('\n监控工具:', 'magenta');
    Object.keys(toolsConfig.monitoring_tools).forEach(tool => {
      const config = toolsConfig.monitoring_tools[tool];
      const status = config.enabled ? '✅' : '❌';
      log(`  ${status} ${tool}`);
    });
  }
  
  // 安全工具
  if (toolsConfig.security_tools) {
    log('\n安全工具:', 'magenta');
    Object.keys(toolsConfig.security_tools).forEach(tool => {
      const config = toolsConfig.security_tools[tool];
      const status = config.enabled ? '✅' : '❌';
      log(`  ${status} ${tool}`);
    });
  }
  
  // IaC 工具
  if (toolsConfig.iac_tools) {
    log('\n基础设施即代码工具:', 'magenta');
    Object.keys(toolsConfig.iac_tools).forEach(tool => {
      const config = toolsConfig.iac_tools[tool];
      const status = config.enabled ? '✅' : '❌';
      log(`  ${status} ${tool}`);
    });
  }
  
  log('\n');
}

// 任务分发（模拟）
function dispatchTask(agentName, taskDescription) {
  if (!CONFIG.agents.includes(agentName)) {
    error(`未知的 Agent: ${agentName}`);
    return;
  }
  
  const config = loadAgentConfig(agentName);
  if (!config) {
    return;
  }
  
  log('\n📤 任务分发\n', 'cyan');
  log(`目标 Agent: ${config.agent.role}`, 'magenta');
  log(`任务描述：${taskDescription}`, 'green');
  log(`任务 ID: TASK-${Date.now()}`, 'yellow');
  log(`状态：已分发（模拟）`, 'green');
  log('\n提示：实际任务分发需要集成消息队列或 API 调用\n');
}

// 执行工作流（模拟）
function executeWorkflow(workflowName) {
  const workflows = {
    'deploy-production': '生产环境部署流程',
    'emergency-response': '应急响应流程',
    'security-audit': '安全审计流程',
    'infra-provision': '基础设施配置流程',
    'monitoring-setup': '监控体系搭建流程'
  };
  
  if (!workflows[workflowName]) {
    error(`未知的工作流：${workflowName}`);
    log(`可用工作流：${Object.keys(workflows).join(', ')}`, 'yellow');
    return;
  }
  
  log('\n⚙️ 执行工作流\n', 'cyan');
  log(`工作流名称：${workflowName}`, 'magenta');
  log(`工作流描述：${workflows[workflowName]}`, 'green');
  log(`状态：执行中（模拟）`, 'yellow');
  log('\n提示：实际工作流执行需要集成各 Agent 的 API\n');
}

// 验证配置
function validateConfig() {
  log('\n✅ 验证配置\n', 'cyan');
  
  let hasErrors = false;
  
  // 验证每个 Agent 配置
  CONFIG.agents.forEach(agentName => {
    const config = loadAgentConfig(agentName);
    if (config) {
      // 检查必需字段
      const requiredFields = ['agent', 'role_definition', 'model', 'tools', 'workspace', 'prompts'];
      const missingFields = requiredFields.filter(field => !config[field]);
      
      if (missingFields.length > 0) {
        error(`${agentName}: 缺少字段 ${missingFields.join(', ')}`);
        hasErrors = true;
      } else {
        success(`${agentName}: 配置完整`);
      }
    } else {
      error(`${agentName}: 配置加载失败`);
      hasErrors = true;
    }
  });
  
  // 验证共享工具配置
  const toolsConfig = loadSharedTools();
  if (toolsConfig) {
    success('共享工具配置：验证通过');
  } else {
    error('共享工具配置：验证失败');
    hasErrors = true;
  }
  
  // 验证模板文件
  const templatesDir = path.join(CONFIG.workspaceBase, 'shared', 'templates');
  if (fs.existsSync(templatesDir)) {
    const templates = fs.readdirSync(templatesDir);
    if (templates.length > 0) {
      success(`模板目录：${templates.length} 个文件`);
    } else {
      warning('模板目录：空目录');
    }
  } else {
    error('模板目录：不存在');
    hasErrors = true;
  }
  
  // 验证 Playbooks
  const playbooksDir = path.join(CONFIG.workspaceBase, 'shared', 'playbooks');
  if (fs.existsSync(playbooksDir)) {
    const playbooks = fs.readdirSync(playbooksDir);
    if (playbooks.length > 0) {
      success(`Playbooks 目录：${playbooks.length} 个文件`);
    } else {
      warning('Playbooks 目录：空目录');
    }
  } else {
    error('Playbooks 目录：不存在');
    hasErrors = true;
  }
  
  log('\n');
  
  if (hasErrors) {
    error('配置验证失败，请检查上述错误');
    process.exit(1);
  } else {
    success('所有配置验证通过！');
  }
}

// 初始化团队配置
function initTeam() {
  log('\n🚀 初始化 DevOps 多 Agent 团队\n', 'cyan');
  
  // 创建必要的目录
  const dirs = [
    'logs',
    'state',
    'examples',
    'tests'
  ];
  
  dirs.forEach(dir => {
    const dirPath = path.join(CONFIG.workspaceBase, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      success(`创建目录：${dir}`);
    } else {
      info(`目录已存在：${dir}`);
    }
  });
  
  // 创建日志目录
  CONFIG.agents.forEach(agentName => {
    const logDir = path.join(CONFIG.workspaceBase, agentName, 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
      success(`创建日志目录：${agentName}/logs`);
    }
  });
  
  success('团队初始化完成！');
  log('\n');
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    return;
  }
  
  switch (command) {
    case 'status':
      showStatus();
      break;
      
    case 'info':
      if (!args[1]) {
        error('请指定 Agent 名称');
        log(`可用 Agent: ${CONFIG.agents.join(', ')}`, 'yellow');
      } else {
        showAgentInfo(args[1]);
      }
      break;
      
    case 'list':
      listAgents();
      break;
      
    case 'tools':
      showTools();
      break;
      
    case 'dispatch':
      if (!args[1] || !args[2]) {
        error('请指定 Agent 名称和任务描述');
        log('用法：devops-cli.js dispatch <agent> <task>', 'yellow');
      } else {
        dispatchTask(args[1], args.slice(2).join(' '));
      }
      break;
      
    case 'workflow':
      if (!args[1]) {
        error('请指定工作流名称');
      } else {
        executeWorkflow(args[1]);
      }
      break;
      
    case 'validate':
      validateConfig();
      break;
      
    case 'init':
      initTeam();
      break;
      
    default:
      error(`未知命令：${command}`);
      showHelp();
      process.exit(1);
  }
}

// 运行
main();
