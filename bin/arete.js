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

function showHelp() {
  console.log('');
  console.log(chalk.bold('  arete') + ' — ARETE workspace manager');
  console.log('');
  console.log('  Commands:');
  console.log('    update    Update framework files (Layer 1 only)');
  console.log('    status    Show workspace status');
  console.log('    help      Show this help');
  console.log('');
}

switch (command) {
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
