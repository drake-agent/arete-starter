import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, cpSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomBytes } from 'crypto';
import { execFileSync } from 'child_process';
import chalk from 'chalk';
import { generateCronSetup } from './setup-crons-hermes.js';

const SAFE_PATH_RE = /^[a-zA-Z0-9._\-/\\ ~]+$/;

function validatePath(p, label) {
  const resolved = resolve(p);
  if (!SAFE_PATH_RE.test(resolved)) {
    throw new Error(`Unsafe characters in ${label}: ${resolved}`);
  }
  return resolved;
}

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

/**
 * Resolve template file — prefer runtime-specific variant if it exists.
 * e.g. for hermes runtime: AGENTS.md.hermes.tmpl > AGENTS.md.tmpl
 */
function resolveTemplate(templateDir, filename, runtime) {
  if (runtime === 'hermes') {
    // filename is like "AGENTS.md.tmpl" — try "AGENTS.md.hermes.tmpl"
    const hermesTmpl = filename.replace('.tmpl', '.hermes.tmpl');
    const hermesPath = join(templateDir, hermesTmpl);
    if (existsSync(hermesPath)) {
      return { path: hermesPath, outputName: hermesTmpl.replace('.hermes.tmpl', '') };
    }
  }
  return { path: join(templateDir, filename), outputName: filename.replace('.tmpl', '') };
}

export async function scaffold({ config, templateDir, dryRun = false }) {
  const { name, telegramToken, agentName, domains, workspacePath, openclawPath } = config;
  const runtime = config.runtime || 'openclaw';

  const vars = {
    NAME: name,
    AGENT_NAME: agentName,
    TELEGRAM_TOKEN: telegramToken || '',
    WORKSPACE_PATH: workspacePath,
    OPENCLAW_PATH: openclawPath || '',
    DOMAINS: domains.join(', '),
    DOMAIN_AGENTS_TABLE: generateDomainAgentsTable(domains),
    DOMAIN_AGENTS_CONFIG: generateDomainAgentsConfig(domains),
    TIMEZONE: config.timezone || 'UTC',
    PERSONALITY_STYLE: config.personalityStyle || 'soft',
    PERSONALITY_CUSTOM: config.personalityCustom || '',
  };

  // Create workspace directories
  const dirs = [
    workspacePath,
    join(workspacePath, 'memory'),
    join(workspacePath, 'scripts'),
    join(workspacePath, 'data'),
    join(workspacePath, 'data', 'traces'),
    join(workspacePath, 'ref'),
    join(workspacePath, 'logs'),
    join(workspacePath, 'chat-signals'),
    join(workspacePath, 'meeting-signals'),
    join(workspacePath, 'schedule-signals'),
    join(workspacePath, 'voice-inbox'),
    join(workspacePath, 'prompts'),
  ];

  // Hermes gets additional directories
  if (runtime === 'hermes') {
    dirs.push(join(workspacePath, 'wiki'));
    dirs.push(join(workspacePath, 'drake-compass'));
    dirs.push(join(workspacePath, 'drake-compass', 'prompts'));
  }

  for (const dir of dirs) {
    if (dryRun) {
      console.log(chalk.yellow(`  [dry-run] Would create dir: ${dir}`));
    } else {
      mkdirSync(dir, { recursive: true });
    }
  }

  // Copy drake-compass seed files (wiki/, prompts/, data/normalized|quality|query-results/) to workspace root
  const wsTemplateDir = join(templateDir, 'workspace');
  const compassDir = join(wsTemplateDir, 'drake-compass');
  if (existsSync(compassDir)) {
    if (dryRun) {
      console.log(chalk.yellow(`  [dry-run] Would copy drake-compass seed files to: ${workspacePath}`));
    } else {
      cpSync(compassDir, workspacePath, { recursive: true });
      console.log(chalk.dim('  Seeded: wiki/, prompts/, data/normalized/, data/quality/, data/query-results/'));
    }
  }

  // Process workspace templates
  if (existsSync(wsTemplateDir)) {
    const allTemplates = readdirSync(wsTemplateDir).filter((f) => f.endsWith('.tmpl'));

    // Filter templates based on runtime
    const templates = allTemplates.filter((f) => {
      if (runtime === 'hermes') {
        // Skip non-hermes variants if a hermes variant exists
        if (!f.includes('.hermes.') ) {
          const hermesVariant = f.replace('.tmpl', '.hermes.tmpl');
          if (allTemplates.includes(hermesVariant)) {
            return false; // skip base, hermes variant will be used
          }
        }
        return true;
      } else {
        // OpenClaw: skip hermes-specific templates
        return !f.includes('.hermes.');
      }
    });

    for (const tmpl of templates) {
      let outputName, templatePath;
      if (tmpl.includes('.hermes.')) {
        outputName = tmpl.replace('.hermes.tmpl', '');
        templatePath = join(wsTemplateDir, tmpl);
      } else {
        outputName = tmpl.replace('.tmpl', '');
        templatePath = join(wsTemplateDir, tmpl);
      }

      const outputPath = join(workspacePath, outputName);
      const content = readFileSync(templatePath, 'utf-8');
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
  let envContent;
  if (runtime === 'hermes') {
    envContent = `# ARETE Workspace Environment (Hermes)
# Copy to .env and fill in your values
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
`;
  } else {
    envContent = `# ARETE Workspace Environment
# Copy to .env and fill in your values
TELEGRAM_BOT_TOKEN=***
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
`;
  }

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

  // --- Personality generation files ---
  // Copy generate-soul.md prompt template
  const promptsTemplateDir = join(templateDir, 'prompts');
  const generateSoulSrc = join(promptsTemplateDir, 'generate-soul.md');
  if (existsSync(generateSoulSrc)) {
    const generateSoulDst = join(workspacePath, 'prompts', 'generate-soul.md');
    const content = readFileSync(generateSoulSrc, 'utf-8');
    const rendered = replaceVars(content, vars);

    if (dryRun) {
      console.log(chalk.yellow(`  [dry-run] Would write: ${generateSoulDst}`));
    } else {
      writeFileSync(generateSoulDst, rendered, 'utf-8');
      console.log(chalk.dim('  Created: prompts/generate-soul.md'));
    }
  }

  // Write personality-seed.json
  const personalitySeedPath = join(workspacePath, 'personality-seed.json');
  const personalitySeed = {
    personalityStyle: config.personalityStyle || 'soft',
    personalityCustom: config.personalityCustom || '',
    agentName: config.agentName || 'Eve',
    userName: config.name || '',
    domains: config.domains || [],
  };

  if (dryRun) {
    console.log(chalk.yellow(`  [dry-run] Would write: ${personalitySeedPath}`));
  } else {
    writeFileSync(personalitySeedPath, JSON.stringify(personalitySeed, null, 2), 'utf-8');
    console.log(chalk.dim('  Created: personality-seed.json'));
  }

  // --- Saju profiling ---
  if (config.sajuEnabled) {
    const sajuProfilePath = join(workspacePath, 'saju-profile.json');
    const sajuData = {
      birthDate: config.birthDate,
      birthTime: config.birthTime,
      gender: config.gender,
    };

    if (dryRun) {
      console.log(chalk.yellow(`  [dry-run] Would write: ${sajuProfilePath}`));
    } else {
      writeFileSync(sajuProfilePath, JSON.stringify(sajuData, null, 2), 'utf-8');
      console.log(chalk.dim('  Created: saju-profile.json'));
    }
  }

  // --- Hermes-specific: cron setup script ---
  if (runtime === 'hermes') {
    const { script: cronScript } = generateCronSetup(config);
    const cronScriptPath = join(workspacePath, 'scripts', 'setup-hermes-crons.sh');

    if (dryRun) {
      console.log(chalk.yellow(`  [dry-run] Would write: ${cronScriptPath}`));
    } else {
      writeFileSync(cronScriptPath, cronScript, { mode: 0o755 });
      console.log(chalk.dim('  Created: scripts/setup-hermes-crons.sh'));
    }

    // Write runtime marker for detection
    const runtimePath = join(workspacePath, '.arete-runtime');
    if (!dryRun) {
      writeFileSync(runtimePath, 'hermes\n', 'utf-8');
    }
  } else {
    // OpenClaw runtime marker
    const runtimePath = join(workspacePath, '.arete-runtime');
    if (!dryRun) {
      writeFileSync(runtimePath, 'openclaw\n', 'utf-8');
    }
  }

  // 사주 코칭 scaffold (legacy — runs saju-engine Python if available)
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
    const safeGender = gender === 'F' ? 'F' : 'M';
    const safeSajuDir = validatePath(sajuDstDir, 'sajuDstDir');
    const safeWorkspace = validatePath(workspacePath, 'workspacePath');
    try {
      const profileScript = `
from saju_engine.coaching.profile_engine_v2 import generate_profile
from saju_engine.core.manseryeok_v2 import calculate_saju
saju = calculate_saju(${parseInt(year, 10)}, ${parseInt(month, 10)}, ${parseInt(day, 10)}, ${parseInt(h, 10)}, 0, '${safeGender}')
print(generate_profile(saju))
`;
      const profile = execFileSync('python3', ['-c', profileScript], {
        cwd: safeSajuDir,
        env: { ...process.env, PYTHONPATH: safeWorkspace },
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      const profilePath = join(workspacePath, 'USER-PROFILE.md');
      writeFileSync(profilePath, profile);
      console.log(chalk.green('  Generated: USER-PROFILE.md (사주 기반 운영 매뉴얼)'));

      // Generate onboarding questions
      const questionsScript = `
import json
from saju_engine.coaching.onboarding import generate_onboarding_output
result = generate_onboarding_output(${parseInt(year, 10)}, ${parseInt(month, 10)}, ${parseInt(day, 10)}, ${parseInt(h, 10)}, 0, '${safeGender}')
print(json.dumps(result['questions'], ensure_ascii=False, indent=2))
`;
      const questions = execFileSync('python3', ['-c', questionsScript], {
        cwd: safeSajuDir,
        env: { ...process.env, PYTHONPATH: safeWorkspace },
        encoding: 'utf-8',
        stdio: 'pipe',
      });
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
  const jwtSecret = generateSecret();
  const envContent = `# 갓생OS Environment
VAULT_PATH=${vaultPath}
AUTH_USERNAME=admin
AUTH_PASSWORD=
JWT_SECRET=${jwtSecret}
`;
  console.log(chalk.yellow('  ⚠ AUTH_PASSWORD is empty — set it in gatsaeng-os/.env before running!'));
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
  return randomBytes(32).toString('hex');
}
