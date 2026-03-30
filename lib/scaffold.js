import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, cpSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

function replaceVars(content, vars) {
  let result = content;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}

function generateDomainAgentsTable(domains) {
  if (!domains || domains.length === 0) return '(No domain agents configured)';
  const rows = domains.map(
    (d) => `| ${d} | ${d}-analyst sub-agent spawn |`
  );
  return `| Domain | Routing |\n|--------|--------|\n${rows.join('\n')}`;
}

function generateDomainAgentsConfig(domains) {
  if (!domains || domains.length === 0) return '{}';
  const config = {};
  for (const d of domains) {
    config[`${d}-analyst`] = { tag: d.charAt(0).toUpperCase() + d.slice(1), emoji: '📊' };
  }
  return JSON.stringify(config, null, 4);
}

export async function scaffold({ config, templateDir, dryRun = false }) {
  const { name, telegramToken, agentName, domains, workspacePath, openclawPath } = config;

  const vars = {
    NAME: name,
    AGENT_NAME: agentName,
    TELEGRAM_TOKEN: telegramToken,
    WORKSPACE_PATH: workspacePath,
    OPENCLAW_PATH: openclawPath,
    DOMAINS: domains.join(', '),
    DOMAIN_AGENTS_TABLE: generateDomainAgentsTable(domains),
    DOMAIN_AGENTS_CONFIG: generateDomainAgentsConfig(domains),
  };

  // Create workspace directories
  const dirs = [
    workspacePath,
    join(workspacePath, 'memory'),
    join(workspacePath, 'scripts'),
    join(workspacePath, 'data'),
    join(workspacePath, 'data', 'traces'),
    join(workspacePath, 'ref'),
  ];

  for (const dir of dirs) {
    if (dryRun) {
      console.log(chalk.yellow(`  [dry-run] Would create dir: ${dir}`));
    } else {
      mkdirSync(dir, { recursive: true });
    }
  }

  // Process workspace templates
  const wsTemplateDir = join(templateDir, 'workspace');
  if (existsSync(wsTemplateDir)) {
    const templates = readdirSync(wsTemplateDir).filter((f) => f.endsWith('.tmpl'));
    for (const tmpl of templates) {
      const outputName = tmpl.replace('.tmpl', '');
      const outputPath = join(workspacePath, outputName);
      const content = readFileSync(join(wsTemplateDir, tmpl), 'utf-8');
      const rendered = replaceVars(content, vars);

      if (dryRun) {
        console.log(chalk.yellow(`  [dry-run] Would write: ${outputPath}`));
      } else {
        writeFileSync(outputPath, rendered, 'utf-8');
        console.log(chalk.dim(`  Created: ${outputName}`));
      }
    }
  }

  // Process script templates
  const scriptTemplateDir = join(templateDir, 'scripts');
  if (existsSync(scriptTemplateDir)) {
    const scripts = readdirSync(scriptTemplateDir).filter((f) => f.endsWith('.tmpl'));
    for (const tmpl of scripts) {
      const outputName = tmpl.replace('.tmpl', '');
      const outputPath = join(workspacePath, 'scripts', outputName);
      const content = readFileSync(join(scriptTemplateDir, tmpl), 'utf-8');
      const rendered = replaceVars(content, vars);

      if (dryRun) {
        console.log(chalk.yellow(`  [dry-run] Would write: ${outputPath}`));
      } else {
        writeFileSync(outputPath, rendered, 'utf-8');
        console.log(chalk.dim(`  Created: scripts/${outputName}`));
      }
    }
  }

  // Create .env template
  const envPath = join(workspacePath, '.env.example');
  const envContent = `# ARETE Workspace Environment
# Copy to .env and fill in your values
TELEGRAM_BOT_TOKEN=your_token_here
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
`;

  if (dryRun) {
    console.log(chalk.yellow(`  [dry-run] Would write: ${envPath}`));
  } else {
    writeFileSync(envPath, envContent, 'utf-8');
    console.log(chalk.dim('  Created: .env.example'));
  }

  // Create .gitignore
  const gitignorePath = join(workspacePath, '.gitignore');
  const gitignoreContent = `.env
.env.*
!.env.example
node_modules/
__pycache__/
*.pyc
.session_indexer_state.json
`;

  if (dryRun) {
    console.log(chalk.yellow(`  [dry-run] Would write: ${gitignorePath}`));
  } else {
    writeFileSync(gitignorePath, gitignoreContent, 'utf-8');
    console.log(chalk.dim('  Created: .gitignore'));
  }

  // 사주 코칭 scaffold
  if (config.sajuCoaching && config.sajuProfile) {
    await scaffoldSajuCoaching({ config, dryRun });
  }

  // 갓생OS scaffold
  if (config.gatsaeng) {
    await scaffoldGatsaeng({ config, dryRun });
  }
}

export async function scaffoldSajuCoaching({ config, dryRun = false }) {
  const { workspacePath, sajuProfile } = config;

  const __filename = fileURLToPath(import.meta.url);
  const pkgRoot = resolve(dirname(__filename), '..');
  const sajuSrcDir = join(pkgRoot, 'packages', 'saju-engine');

  if (!existsSync(sajuSrcDir)) {
    console.log(chalk.red('  saju-engine source not found in package. Skipping.'));
    return;
  }

  console.log(chalk.blue('  Setting up 사주 코칭 프레임워크...'));

  // Copy saju-engine to workspace
  const sajuDstDir = join(workspacePath, 'saju-engine');
  if (dryRun) {
    console.log(chalk.yellow(`  [dry-run] Would copy saju-engine to: ${sajuDstDir}`));
  } else {
    cpSync(sajuSrcDir, sajuDstDir, { recursive: true });
    console.log(chalk.dim('  Copied: saju-engine/'));
  }

  // Install @orrery/core
  if (!dryRun) {
    const { execSync } = await import('child_process');
    try {
      execSync('npm install', { cwd: sajuDstDir, stdio: 'pipe' });
      console.log(chalk.dim('  Installed: @orrery/core'));
    } catch (e) {
      console.log(chalk.yellow('  Warning: npm install failed for saju-engine. Run manually.'));
    }
  }

  // Generate USER-PROFILE.md
  if (sajuProfile && !dryRun) {
    const { year, month, day, hour, gender } = sajuProfile;
    const h = hour !== null ? hour : 12;
    const { execSync } = await import('child_process');
    try {
      const cmd = `cd ${sajuDstDir} && PYTHONPATH=${workspacePath} python3 -c "
from saju_engine.coaching.profile_engine_v2 import generate_profile
from saju_engine.core.manseryeok_v2 import calculate_saju
saju = calculate_saju(${year}, ${month}, ${day}, ${h}, 0, '${gender}')
print(generate_profile(saju))
"`;
      const profile = execSync(cmd, { stdio: 'pipe', encoding: 'utf-8' });
      const profilePath = join(workspacePath, 'USER-PROFILE.md');
      writeFileSync(profilePath, profile);
      console.log(chalk.green('  ✅ Generated: USER-PROFILE.md (사주 기반 운영 매뉴얼)'));

      // Generate onboarding questions
      const questionsCmd = `cd ${sajuDstDir} && PYTHONPATH=${workspacePath} python3 -c "
import json
from saju_engine.coaching.onboarding import generate_onboarding_output
result = generate_onboarding_output(${year}, ${month}, ${day}, ${h}, 0, '${gender}')
print(json.dumps(result['questions'], ensure_ascii=False, indent=2))
"`;
      const questions = execSync(questionsCmd, { stdio: 'pipe', encoding: 'utf-8' });
      const questionsPath = join(workspacePath, 'data', 'onboarding-questions.json');
      writeFileSync(questionsPath, questions);
      console.log(chalk.dim('  Created: data/onboarding-questions.json'));
    } catch (e) {
      console.log(chalk.yellow(`  Warning: Profile generation failed. Run manually: python3 -m saju_engine.coaching.onboarding ${year} ${month} ${day}`));
    }
  }
}

export async function scaffoldGatsaeng({ config, dryRun = false }) {
  const { workspacePath, vaultPath } = config;
  const gatsaengDir = join(workspacePath, 'gatsaeng-os');

  const __filename = fileURLToPath(import.meta.url);
  const pkgRoot = resolve(dirname(__filename), '..');
  const srcDir = join(pkgRoot, 'packages', 'gatsaeng-os');

  if (!existsSync(srcDir)) {
    console.log(chalk.red('  갓생OS source not found in package. Skipping.'));
    return;
  }

  console.log(chalk.blue('  Setting up 갓생OS...'));

  if (dryRun) {
    console.log(chalk.yellow(`  [dry-run] Would copy 갓생OS to: ${gatsaengDir}`));
    console.log(chalk.yellow(`  [dry-run] VAULT_PATH = ${vaultPath}`));
    console.log(chalk.yellow(`  [dry-run] Would create Obsidian vault dirs in: ${vaultPath}`));
    console.log(chalk.yellow('  [dry-run] Would run: npm install in gatsaeng-os/'));
    return;
  }

  // Copy 갓생OS source
  cpSync(srcDir, gatsaengDir, { recursive: true });
  console.log(chalk.dim('  Copied 갓생OS source'));

  // Create .env with VAULT_PATH
  const envContent = `# 갓생OS Environment
VAULT_PATH=${vaultPath}
AUTH_USERNAME=admin
AUTH_PASSWORD=changeme
JWT_SECRET=${generateSecret()}
`;
  writeFileSync(join(gatsaengDir, '.env'), envContent, 'utf-8');
  console.log(chalk.dim('  Created gatsaeng-os/.env'));

  // Create Obsidian vault directories
  const vaultDirs = [
    vaultPath,
    join(vaultPath, 'areas'),
    join(vaultPath, 'goals'),
    join(vaultPath, 'milestones'),
    join(vaultPath, 'projects'),
    join(vaultPath, 'tasks'),
    join(vaultPath, 'routines'),
    join(vaultPath, 'reviews'),
    join(vaultPath, 'sessions'),
    join(vaultPath, 'timing'),
    join(vaultPath, 'books'),
    join(vaultPath, 'calendar'),
    join(vaultPath, 'notes'),
    join(vaultPath, 'logs', 'routine'),
    join(vaultPath, 'logs', 'energy'),
    join(vaultPath, 'logs', 'focus'),
  ];

  for (const dir of vaultDirs) {
    mkdirSync(dir, { recursive: true });
  }
  console.log(chalk.dim(`  Created Obsidian vault dirs at ${vaultPath}`));

  console.log(chalk.green('  갓생OS ready — run `arete start` to launch'));
}

function generateSecret() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 48; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
