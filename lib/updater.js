import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'fs';
import { resolve, join } from 'path';
import { homedir } from 'os';
import chalk from 'chalk';

export async function checkForUpdate() {
  const pkg = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf-8')
  );
  const currentVersion = pkg.version;

  let latestVersion = currentVersion;
  try {
    latestVersion = execSync('npm show create-arete-workspace version', {
      stdio: 'pipe',
      timeout: 10000,
    })
      .toString()
      .trim();
  } catch {
    console.log(chalk.yellow('  Could not check npm registry. Are you online?'));
    return { currentVersion, latestVersion: currentVersion, updateAvailable: false };
  }

  return {
    currentVersion,
    latestVersion,
    updateAvailable: currentVersion !== latestVersion,
  };
}

// Layer 1 files: framework files that can be updated safely
const LAYER1_FILES = {
  scripts: ['session_indexer.py', 'tracer.py', 'forge_ship.sh', 'forge_qa.sh'],
};

// Layer 2 files: user config files that must NEVER be overwritten
const LAYER2_PROTECTED = [
  'MEMORY.md',
  'SOUL.md',
  'AGENTS.md',
  'USER.md',
  'TOOLS.md',
  'HEARTBEAT.md',
  'BOOTSTRAP.md',
  '.env',
];

export async function runUpdate(targetVersion) {
  console.log(chalk.blue(`  Updating to ${targetVersion}...`));

  // Install latest version globally to get new templates
  try {
    execSync(`npm install -g create-arete-workspace@${targetVersion}`, { stdio: 'pipe' });
  } catch (e) {
    throw new Error(`Failed to download update: ${e.message}`);
  }

  // Find installed package path
  let pkgPath;
  try {
    pkgPath = execSync('npm root -g', { stdio: 'pipe' }).toString().trim();
    pkgPath = join(pkgPath, 'create-arete-workspace');
  } catch {
    throw new Error('Could not locate installed package');
  }

  const workspacePath = resolve(homedir(), '.openclaw', 'workspace');
  if (!existsSync(workspacePath)) {
    console.log(chalk.yellow('  Workspace not found. Run create-arete-workspace first.'));
    return;
  }

  // Update Layer 1: scripts
  const srcScripts = join(pkgPath, 'templates', 'scripts');
  const destScripts = join(workspacePath, 'scripts');

  if (existsSync(srcScripts)) {
    mkdirSync(destScripts, { recursive: true });
    for (const file of LAYER1_FILES.scripts) {
      const srcFile = join(srcScripts, file + '.tmpl');
      const destFile = join(destScripts, file);
      if (existsSync(srcFile)) {
        const content = readFileSync(srcFile, 'utf-8');
        // Preserve existing variable values by reading current config
        writeFileSync(destFile, content, 'utf-8');
        console.log(chalk.dim(`  Updated: scripts/${file}`));
      }
    }
  }

  console.log('');
  console.log(chalk.dim('  Protected (not modified):'));
  for (const file of LAYER2_PROTECTED) {
    if (existsSync(join(workspacePath, file))) {
      console.log(chalk.dim(`    ${file}`));
    }
  }
}
