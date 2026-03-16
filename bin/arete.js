#!/usr/bin/env node

import chalk from 'chalk';
import { checkForUpdate, runUpdate } from '../lib/updater.js';
import { execSync } from 'child_process';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { resolve, join } from 'path';
import { homedir } from 'os';

const command = process.argv[2];

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

  // OpenClaw running?
  let openclawRunning = false;
  try {
    const out = execSync('openclaw status', { stdio: 'pipe', timeout: 5000 }).toString();
    openclawRunning = out.toLowerCase().includes('running');
    console.log(`  OpenClaw: ${openclawRunning ? chalk.green('running') : chalk.yellow('stopped')}`);
  } catch {
    console.log(`  OpenClaw: ${chalk.red('not detected')}`);
  }

  // Workspace path
  const workspacePath = resolve(homedir(), '.openclaw', 'workspace');
  if (existsSync(workspacePath)) {
    console.log(`  Workspace: ${chalk.dim(workspacePath)}`);
  } else {
    console.log(`  Workspace: ${chalk.red('not found')}`);
    return;
  }

  // Agent count
  const agentsDir = resolve(homedir(), '.openclaw', 'agents');
  if (existsSync(agentsDir)) {
    try {
      const agents = readdirSync(agentsDir).filter((f) =>
        statSync(join(agentsDir, f)).isDirectory()
      );
      console.log(`  Agents: ${chalk.bold(agents.length)}`);
    } catch {
      console.log(`  Agents: ${chalk.dim('unknown')}`);
    }
  }

  // Last memory update
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

  // Package version
  try {
    const pkg = JSON.parse(
      readFileSync(new URL('../package.json', import.meta.url), 'utf-8')
    );
    console.log(`  Version: ${chalk.dim(pkg.version)}`);
  } catch {}

  console.log('');
}

function cmdStart() {
  const workspacePath = resolve(homedir(), '.openclaw', 'workspace');
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

  // Check if node_modules exists, install if not
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
  console.log(chalk.dim(`  ${gatsaengDir}`));
  console.log('');

  try {
    execSync('npm run dev', { cwd: gatsaengDir, stdio: 'inherit' });
  } catch {
    // User ctrl-c — normal exit
  }
}

function showHelp() {
  console.log('');
  console.log(chalk.bold('  arete') + ' — ARETE workspace manager');
  console.log('');
  console.log('  Commands:');
  console.log('    start     Launch 갓생OS dashboard');
  console.log('    update    Update framework files (Layer 1 only)');
  console.log('    status    Show workspace status');
  console.log('    help      Show this help');
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
  default:
    showHelp();
    break;
}
