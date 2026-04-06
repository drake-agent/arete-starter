import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, cpSync, rmSync } from 'fs';
import { resolve, join } from 'path';
import { homedir } from 'os';
import chalk from 'chalk';

const SEMVER_RE = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/;

function compareSemver(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (pa[i] > pb[i]) return 1;
    if (pa[i] < pb[i]) return -1;
  }
  return 0;
}

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
    updateAvailable: compareSemver(latestVersion, currentVersion) > 0,
  };
}

// Layer 1 files: framework files that can be updated safely
const LAYER1_FILES = {
  scripts: ['session_indexer.py', 'tracer.py', 'forge_ship.sh', 'forge_qa.sh'],
  gatsaengOs: true,
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
  if (!SEMVER_RE.test(targetVersion)) {
    throw new Error(`Invalid version format: ${targetVersion}`);
  }
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
        let content = readFileSync(srcFile, 'utf-8');
        // Preserve existing variable values by reading current config
        if (existsSync(destFile)) {
          const existing = readFileSync(destFile, 'utf-8');
          const varRe = /\{\{(\w+)\}\}/g;
          let match;
          while ((match = varRe.exec(content)) !== null) {
            const varName = match[1];
            const existingRe = new RegExp(varName + '\\s*=\\s*(.+)');
            const found = existing.match(existingRe);
            if (found) {
              content = content.replaceAll(`{{${varName}}}`, found[1].trim());
            }
          }
        }
        content = content.replace(/\{\{\w+\}\}/g, '');
        writeFileSync(destFile, content, 'utf-8');
        console.log(chalk.dim(`  Updated: scripts/${file}`));
      }
    }
  }

  // Update Layer 1: 갓생OS source (preserves user .env)
  const gatsaengDest = join(workspacePath, 'gatsaeng-os');
  const gatsaengSrc = join(pkgPath, 'packages', 'gatsaeng-os');
  if (existsSync(gatsaengDest) && existsSync(gatsaengSrc)) {
    // Preserve user's .env
    let savedEnv = null;
    const envFile = join(gatsaengDest, '.env');
    if (existsSync(envFile)) {
      savedEnv = readFileSync(envFile, 'utf-8');
    }

    // Remove old source (except node_modules)
    const entries = readdirSync(gatsaengDest);
    for (const entry of entries) {
      if (entry === 'node_modules' || entry === '.env' || entry === '.next') continue;
      rmSync(join(gatsaengDest, entry), { recursive: true, force: true });
    }

    // Copy new source
    cpSync(gatsaengSrc, gatsaengDest, { recursive: true });

    // Restore .env
    if (savedEnv) {
      writeFileSync(envFile, savedEnv, 'utf-8');
    }

    console.log(chalk.dim('  Updated: 갓생OS source'));
  }

  console.log('');
  console.log(chalk.dim('  Protected (not modified):'));
  for (const file of LAYER2_PROTECTED) {
    if (existsSync(join(workspacePath, file))) {
      console.log(chalk.dim(`    ${file}`));
    }
  }
}
