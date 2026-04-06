#!/usr/bin/env node

import chalk from 'chalk';
import { checkForUpdate, runUpdate } from '../lib/updater.js';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { resolve, join } from 'path';
import { homedir } from 'os';

const command = process.argv[2];

/**
 * Detect runtime from .arete-runtime marker file or environment heuristics.
 */
function detectRuntime() {
  const candidates = [
    resolve(homedir(), 'arete-workspace', '.arete-runtime'),
    resolve(homedir(), '.openclaw', 'workspace', '.arete-runtime'),
  ];

  for (const marker of candidates) {
    if (existsSync(marker)) {
      const content = readFileSync(marker, 'utf-8').trim();
      if (content === 'hermes' || content === 'openclaw') {
        return { runtime: content, workspacePath: resolve(marker, '..') };
      }
    }
  }

  // Fallback: check for hermes config
  if (existsSync(resolve(homedir(), '.hermes', 'config.yaml'))) {
    const hermesWorkspace = resolve(homedir(), 'arete-workspace');
    if (existsSync(hermesWorkspace)) {
      return { runtime: 'hermes', workspacePath: hermesWorkspace };
    }
  }

  // Fallback: check for openclaw
  const openclawWorkspace = resolve(homedir(), '.openclaw', 'workspace');
  if (existsSync(openclawWorkspace)) {
    return { runtime: 'openclaw', workspacePath: openclawWorkspace };
  }

  return { runtime: 'unknown', workspacePath: null };
}

async function cmdUpdate() {
  console.log(chalk.blue('Checking for updates...'));
  const result = await checkForUpdate();

  if (!result.updateAvailable) {
    console.log(chalk.green(`Already on latest version (${result.currentVersion})`));
    return;
  }

  console.log(chalk.yellow(`Update available: ${result.currentVersion} → ${result.latestVersion}`));
  console.log('');

  await runUpdate(result.latestVersion);
  console.log(chalk.green('Update complete!'));
}

function cmdStatus() {
  console.log(chalk.bold('ARETE Status'));
  console.log('');

  const { runtime, workspacePath } = detectRuntime();

  if (runtime === 'hermes') {
    console.log(`  Runtime: ${chalk.cyan('Hermes (Anthropic)')}`);

    const hermesConfig = resolve(homedir(), '.hermes', 'config.yaml');
    if (existsSync(hermesConfig)) {
      console.log(`  Hermes config: ${chalk.green('found')}`);
    } else {
      console.log(`  Hermes config: ${chalk.red('not found (~/.hermes/config.yaml)')}`);
    }

    try {
      const out = execSync('hermes cron list', { stdio: 'pipe', timeout: 5000 }).toString();
      const jobCount = out.split('\n').filter((l) => l.trim()).length;
      console.log(`  Cron jobs: ${chalk.bold(jobCount)}`);
    } catch {
      console.log(`  Cron jobs: ${chalk.dim('unable to check')}`);
    }
  } else if (runtime === 'openclaw') {
    console.log(`  Runtime: ${chalk.blue('OpenClaw')}`);

    let openclawRunning = false;
    try {
      const out = execSync('openclaw status', { stdio: 'pipe', timeout: 5000 }).toString();
      openclawRunning = out.toLowerCase().includes('running');
      console.log(`  OpenClaw: ${openclawRunning ? chalk.green('running') : chalk.yellow('stopped')}`);
    } catch {
      console.log(`  OpenClaw: ${chalk.red('not detected')}`);
    }

    const agentsDir = resolve(homedir(), '.openclaw', 'agents');
    if (existsSync(agentsDir)) {
      try {
        const agents = readdirSync(agentsDir, { withFileTypes: true }).filter((f) =>
          f.isDirectory()
        );
        console.log(`  Agents: ${chalk.bold(agents.length)}`);
      } catch {
        console.log(`  Agents: ${chalk.dim('unknown')}`);
      }
    }
  } else {
    console.log(`  Runtime: ${chalk.red('not detected')}`);
    console.log(`  Run ${chalk.bold('npx create-arete-workspace')} to set up.`);
    console.log('');
    return;
  }

  if (workspacePath && existsSync(workspacePath)) {
    console.log(`  Workspace: ${chalk.dim(workspacePath)}`);
  } else {
    console.log(`  Workspace: ${chalk.red('not found')}`);
    console.log('');
    return;
  }

  const memoryDir = resolve(workspacePath, 'memory');
  if (existsSync(memoryDir)) {
    try {
      const files = readdirSync(memoryDir)
        .filter((f) => f.endsWith('.md') && !f.startsWith('.'))
        .sort()
        .reverse();
      if (files.length > 0) {
        console.log(`  Last memory: ${chalk.dim(files[0])}`);
      }
    } catch {
      console.log(`  Last memory: ${chalk.dim('unknown')}`);
    }
  }

  const seedPath = join(workspacePath, 'personality-seed.json');
  if (existsSync(seedPath)) {
    try {
      const seed = JSON.parse(readFileSync(seedPath, 'utf-8'));
      console.log(`  Personality: ${chalk.dim(seed.personalityStyle)}`);
    } catch {}
  }

  const sajuPath = join(workspacePath, 'saju-profile.json');
  if (existsSync(sajuPath)) {
    console.log(`  Saju profile: ${chalk.green('configured')}`);
  }

  try {
    const pkg = JSON.parse(
      readFileSync(new URL('../package.json', import.meta.url), 'utf-8')
    );
    console.log(`  Version: ${chalk.dim(pkg.version)}`);
  } catch {}

  console.log('');
}

function cmdStart() {
  const { runtime, workspacePath } = detectRuntime();

  if (!workspacePath) {
    console.log(chalk.red('No ARETE workspace found. Run npx create-arete-workspace first.'));
    process.exit(1);
  }

  const gatsaengDir = join(workspacePath, 'gatsaeng-os');

  if (!existsSync(gatsaengDir)) {
    console.log(chalk.red('갓생OS not found. Run create-arete-workspace with 갓생OS enabled.'));
    process.exit(1);
  }

  const pkgJson = join(gatsaengDir, 'package.json');
  if (!existsSync(pkgJson)) {
    console.log(chalk.red('갓생OS package.json not found.'));
    process.exit(1);
  }

  if (!existsSync(join(gatsaengDir, 'node_modules'))) {
    console.log(chalk.blue('Installing 갓생OS dependencies...'));
    try {
      execSync('npm install', { cwd: gatsaengDir, stdio: 'inherit' });
    } catch {
      console.log(chalk.red('Failed to install dependencies.'));
      process.exit(1);
    }
  }

  console.log(chalk.green('Starting 갓생OS...'));
  console.log(chalk.dim(`  Runtime: ${runtime}`));
  console.log(chalk.dim(`  ${gatsaengDir}`));
  console.log('');

  try {
    execSync('npm run dev', { cwd: gatsaengDir, stdio: 'inherit' });
  } catch (e) {
    if (e.signal !== 'SIGINT' && e.status !== null) {
      console.error(chalk.red(`Dev server exited with code ${e.status}`));
      process.exit(e.status || 1);
    }
  }
}

function cmdSetupCrons() {
  const { runtime, workspacePath } = detectRuntime();

  if (runtime !== 'hermes') {
    console.log(chalk.yellow('Cron setup is only available for Hermes runtime.'));
    if (runtime === 'openclaw') {
      console.log(chalk.dim('OpenClaw manages its own scheduling.'));
    }
    return;
  }

  if (!workspacePath) {
    console.log(chalk.red('No ARETE workspace found.'));
    process.exit(1);
  }

  const cronScript = join(workspacePath, 'scripts', 'setup-hermes-crons.sh');
  if (!existsSync(cronScript)) {
    console.log(chalk.red('Cron setup script not found. Re-run create-arete-workspace.'));
    process.exit(1);
  }

  console.log(chalk.blue('Setting up Hermes cron jobs...'));
  console.log(chalk.dim(`  Script: ${cronScript}`));
  console.log('');

  try {
    execSync(`bash "${cronScript}"`, { stdio: 'inherit' });
    console.log('');
    console.log(chalk.green('Cron jobs configured!'));
    console.log(chalk.dim('  View with: hermes cron list'));
  } catch (e) {
    console.log(chalk.red('Cron setup failed: ' + e.message));
    console.log(chalk.dim('  You can run the script manually:'));
    console.log(chalk.dim(`  bash ${cronScript}`));
    process.exit(1);
  }
}

function cmdGenerateSoul() {
  const { runtime, workspacePath } = detectRuntime();

  if (!workspacePath) {
    console.log(chalk.red('No ARETE workspace found.'));
    process.exit(1);
  }

  const promptPath = join(workspacePath, 'prompts', 'generate-soul.md');
  const seedPath = join(workspacePath, 'personality-seed.json');
  const soulOutputPath = join(workspacePath, 'SOUL.md');

  if (!existsSync(promptPath)) {
    console.log(chalk.red('generate-soul.md prompt not found.'));
    process.exit(1);
  }

  if (!existsSync(seedPath)) {
    console.log(chalk.red('personality-seed.json not found.'));
    process.exit(1);
  }

  const seed = JSON.parse(readFileSync(seedPath, 'utf-8'));
  let prompt = readFileSync(promptPath, 'utf-8');

  // Substitute variables
  prompt = prompt.replaceAll('{{AGENT_NAME}}', seed.agentName || 'Eve');
  prompt = prompt.replaceAll('{{NAME}}', seed.userName || '');
  prompt = prompt.replaceAll('{{PERSONALITY_STYLE}}', seed.personalityStyle || 'soft');
  prompt = prompt.replaceAll('{{PERSONALITY_CUSTOM}}', seed.personalityCustom || '');
  prompt = prompt.replaceAll('{{DOMAINS}}', (seed.domains || []).join(', '));

  // Saju profile
  const sajuPath = join(workspacePath, 'saju-profile.json');
  if (existsSync(sajuPath)) {
    const sajuData = readFileSync(sajuPath, 'utf-8');
    prompt = prompt.replaceAll('{{SAJU_PROFILE}}', sajuData);
  } else {
    prompt = prompt.replaceAll('{{SAJU_PROFILE}}', 'Not available');
  }

  // Write prepared prompt
  const preparedPromptPath = join(workspacePath, 'prompts', 'generate-soul-prepared.md');
  writeFileSync(preparedPromptPath, prompt, 'utf-8');

  console.log(chalk.blue('SOUL.md Generation'));
  console.log('');
  console.log('  Prepared prompt written to:');
  console.log(chalk.dim(`  ${preparedPromptPath}`));
  console.log('');

  if (runtime === 'hermes') {
    console.log('  To generate, send this to your Hermes agent:');
    console.log(chalk.cyan(`  "Read ${preparedPromptPath} and generate SOUL.md. Write output to ${soulOutputPath}"`));
  } else {
    console.log('  To generate, paste the prompt into your AI agent and save output to:');
    console.log(chalk.cyan(`  ${soulOutputPath}`));
  }
  console.log('');
}

function showHelp() {
  console.log('');
  console.log(chalk.bold('  arete') + ' — ARETE workspace manager');
  console.log('');
  console.log('  Commands:');
  console.log('    start          Launch 갓생OS dashboard');
  console.log('    status         Show workspace status');
  console.log('    update         Update framework files (Layer 1 only)');
  console.log('    setup-crons    Set up Hermes cron jobs');
  console.log('    generate-soul  Generate personalized SOUL.md');
  console.log('    help           Show this help');
  console.log('');
}

switch (command) {
  case 'start':
    cmdStart();
    break;
  case 'update':
    cmdUpdate().catch((e) => {
      console.error(chalk.red('Update failed: ' + e.message));
      process.exit(1);
    });
    break;
  case 'status':
    cmdStatus();
    break;
  case 'setup-crons':
    cmdSetupCrons();
    break;
  case 'generate-soul':
    cmdGenerateSoul();
    break;
  default:
    showHelp();
    break;
}
