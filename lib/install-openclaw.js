import { execSync } from 'child_process';
import chalk from 'chalk';

export async function checkEnvironment({ dryRun = false } = {}) {
  const errors = [];

  // OS check
  const platform = process.platform;
  if (platform !== 'darwin' && platform !== 'linux') {
    errors.push(`Unsupported OS: ${platform}. ARETE requires macOS or Linux.`);
  }

  // Node.js 18+
  const nodeVersion = process.versions.node;
  const major = parseInt(nodeVersion.split('.')[0], 10);
  if (major < 18) {
    errors.push(`Node.js ${nodeVersion} detected. ARETE requires Node.js 18+.`);
    console.log(chalk.dim('  Install: https://nodejs.org/'));
  } else {
    console.log(chalk.dim(`  Node.js ${nodeVersion}`));
  }

  // Python 3.10+
  try {
    const pyVersion = execSync('python3 --version', { stdio: 'pipe' }).toString().trim();
    const match = pyVersion.match(/Python (\d+)\.(\d+)/);
    if (match) {
      const pyMajor = parseInt(match[1], 10);
      const pyMinor = parseInt(match[2], 10);
      if (pyMajor < 3 || (pyMajor === 3 && pyMinor < 10)) {
        errors.push(`${pyVersion} detected. ARETE requires Python 3.10+.`);
      } else {
        console.log(chalk.dim(`  ${pyVersion}`));
      }
    }
  } catch {
    errors.push('Python 3 not found. ARETE requires Python 3.10+.');
    console.log(chalk.dim('  Install: https://www.python.org/downloads/'));
  }

  if (errors.length > 0) {
    console.log('');
    for (const err of errors) {
      console.log(chalk.red('  ' + err));
    }
    return false;
  }

  return true;
}
