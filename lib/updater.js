import { execFileSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, cpSync, rmSync } from 'fs';
import { resolve, join } from 'path';
import { homedir } from 'os';
import chalk from 'chalk';

const SEMVER_RE = /^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.]+)?$/;

// Parse "MAJOR.MINOR.PATCH[-PRE]" into comparable parts.
// Returns null on invalid input.
function parseSemver(v) {
  const m = /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.]+))?$/.exec(String(v));
  if (!m) return null;
  return {
    major: Number(m[1]),
    minor: Number(m[2]),
    patch: Number(m[3]),
    pre: m[4] || null,
  };
}

// Compare semver per semver.org 11.2-11.4 rules (prerelease < release).
function compareSemver(a, b) {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa || !pb) return 0;
  if (pa.major !== pb.major) return pa.major - pb.major;
  if (pa.minor !== pb.minor) return pa.minor - pb.minor;
  if (pa.patch !== pb.patch) return pa.patch - pb.patch;
  if (!pa.pre && !pb.pre) return 0;
  if (!pa.pre) return 1;
  if (!pb.pre) return -1;
  return pa.pre < pb.pre ? -1 : pa.pre > pb.pre ? 1 : 0;
}

// Find the active workspace — supports both Hermes and OpenClaw locations.
function findWorkspace() {
  const candidates = [
    resolve(homedir(), '.openclaw', 'workspace'),
    resolve(homedir(), 'arete-workspace'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

export async function checkForUpdate() {
  const pkg = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf-8')
  );
  const currentVersion = pkg.version;

  let latestVersion = currentVersion;
  try {
    latestVersion = execFileSync('npm', ['show', 'create-arete-workspace', 'version'], {
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

  // Install latest version globally to get new templates (execFile — no shell)
  try {
    execFileSync('npm', ['install', '-g', `create-arete-workspace@${targetVersion}`], { stdio: 'pipe' });
  } catch (e) {
    throw new Error(`Failed to download update: ${e.message}`);
  }

  // Find installed package path
  let pkgPath;
  try {
    pkgPath = execFileSync('npm', ['root', '-g'], { stdio: 'pipe' }).toString().trim();
    pkgPath = join(pkgPath, 'create-arete-workspace');
  } catch {
    throw new Error('Could not locate installed package');
  }

  const workspacePath = findWorkspace();
  if (!workspacePath) {
    console.log(chalk.yellow('  Workspace not found at ~/.openclaw/workspace or ~/arete-workspace. Run create-arete-workspace first.'));
    return;
  }
  console.log(chalk.dim(`  Updating workspace: ${workspacePath}`));

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
        // Preserve existing variable values by parsing existing file line-by-line
        const preserved = new Map();
        if (existsSync(destFile)) {
          const existing = readFileSync(destFile, 'utf-8');
          for (const rawLine of existing.split('\n')) {
            const line = rawLine.trimStart();
            if (line.startsWith('#')) continue; // skip comments
            // Match exactly VARNAME = "value" or VARNAME = value, anchored to line start
            const m = /^([A-Z][A-Z0-9_]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^#\n]+?))\s*(?:#.*)?$/.exec(line);
            if (m) {
              const name = m[1];
              const value = (m[2] ?? m[3] ?? m[4] ?? '').trim();
              preserved.set(name, value);
            }
          }
        }
        const unresolved = new Set();
        content = content.replace(/\{\{([A-Z][A-Z0-9_]*)\}\}/g, (full, varName) => {
          if (preserved.has(varName)) return preserved.get(varName);
          unresolved.add(varName);
          return full; // keep placeholder, we'll warn below
        });
        if (unresolved.size > 0) {
          console.log(chalk.yellow(`  Warning: ${file} has unresolved placeholders: ${[...unresolved].join(', ')}`));
          // Leave placeholders in place rather than silently blanking them out.
        }
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
