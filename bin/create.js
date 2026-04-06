#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import chalk from 'chalk';
import { checkEnvironment } from '../lib/install-openclaw.js';
import { runWizard } from '../lib/setup-wizard.js';
import { scaffold } from '../lib/scaffold.js';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  console.log('');
  console.log(chalk.bold('  ARETE Workspace Setup'));
  console.log(chalk.dim('  AI Operating System in 5 minutes'));
  console.log('');

  // Step 1: Environment check
  console.log(chalk.blue('[1/5]') + ' Checking environment...');
  const envOk = await checkEnvironment({ dryRun: DRY_RUN });
  if (!envOk) {
    process.exit(1);
  }
  console.log(chalk.green('  Environment OK'));
  console.log('');

  // Step 2: Interactive wizard (runtime selection happens here)
  console.log(chalk.blue('[2/5]') + ' Configuration...');
  const config = await runWizard({ dryRun: DRY_RUN });
  console.log('');

  const isHermes = config.runtime === 'hermes';

  // Step 3: Runtime check (OpenClaw or Hermes)
  if (isHermes) {
    console.log(chalk.blue('[3/5]') + ' Checking Hermes...');
    // Check for hermes CLI or config
    try {
      execSync('which hermes', { stdio: 'pipe' });
      console.log(chalk.green('  Hermes CLI found'));
    } catch {
      console.log(chalk.yellow('  Hermes CLI not found — cron setup will need to be done manually'));
      console.log(chalk.dim('  Install: https://docs.anthropic.com/hermes'));
    }
    console.log('');
  } else {
    console.log(chalk.blue('[3/5]') + ' Checking OpenClaw...');
    let openclawInstalled = false;
    try {
      execSync('openclaw --version', { stdio: 'pipe' });
      openclawInstalled = true;
      console.log(chalk.green('  OpenClaw found'));
    } catch {
      openclawInstalled = false;
    }

    if (!openclawInstalled) {
      const { default: inquirer } = await import('inquirer');
      const { install } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'install',
          message: 'OpenClaw not found. Install now?',
          default: true,
        },
      ]);
      if (install) {
        if (DRY_RUN) {
          console.log(chalk.yellow('  [dry-run] Would run: npm install -g openclaw'));
        } else {
          console.log('  Installing OpenClaw...');
          try {
            execSync('npm install -g openclaw', { stdio: 'inherit' });
            console.log(chalk.green('  OpenClaw installed'));
          } catch (e) {
            console.log(chalk.red('  Failed to install OpenClaw.'));
            console.log(chalk.dim('  Try manually: npm install -g openclaw'));
            process.exit(1);
          }
        }
      } else {
        console.log(chalk.red('  OpenClaw is required. Exiting.'));
        process.exit(1);
      }
    }
    console.log('');
  }

  // Step 4: Scaffold workspace
  console.log(chalk.blue('[4/5]') + ' Creating workspace...');
  await scaffold({ config, templateDir: resolve(ROOT, 'templates'), dryRun: DRY_RUN });
  console.log(chalk.green('  Workspace created at ' + config.workspacePath));
  console.log('');

  // Step 5: Runtime registration
  if (isHermes) {
    console.log(chalk.blue('[5/5]') + ' Hermes setup...');
    if (DRY_RUN) {
      console.log(chalk.yellow('  [dry-run] Would set up Hermes cron jobs'));
    } else {
      console.log(chalk.dim('  Cron setup script generated at: scripts/setup-hermes-crons.sh'));
      console.log(chalk.dim('  Run `arete setup-crons` to register cron jobs'));
    }
  } else {
    console.log(chalk.blue('[5/5]') + ' Registering with OpenClaw...');
    if (DRY_RUN) {
      console.log(chalk.yellow('  [dry-run] Would run: openclaw init in ' + config.workspacePath));
    } else {
      try {
        execSync('openclaw init', { cwd: config.workspacePath, stdio: 'inherit' });
      } catch {
        console.log(chalk.yellow('  openclaw init skipped (may need manual setup)'));
      }
    }
  }

  // Done
  console.log('');
  console.log(chalk.green.bold('  ARETE workspace setup complete!'));
  console.log('');
  console.log('  Next steps:');

  if (isHermes) {
    console.log(`    1. Run ${chalk.bold('arete generate-soul')} to create your personalized SOUL.md`);
    console.log(`    2. Run ${chalk.bold('arete setup-crons')} to register pipeline cron jobs`);
    console.log(`    3. Start chatting with your agent on Telegram`);
  } else {
    console.log(`    1. Find your bot on Telegram and send ${chalk.bold('/start')}`);
    console.log(`    2. Run ${chalk.bold('openclaw start')}`);
    console.log('    3. Send your first message');
  }

  if (config.gatsaeng) {
    console.log(`    ${isHermes ? '4' : '4'}. Run ${chalk.bold('arete start')} to launch 갓생OS dashboard`);
  }

  console.log('');
}

main().catch((err) => {
  console.error(chalk.red('Error: ' + err.message));
  process.exit(1);
});
