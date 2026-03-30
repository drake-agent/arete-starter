import { resolve } from 'path';
import { homedir } from 'os';

export async function runWizard({ dryRun = false } = {}) {
  if (dryRun) {
    return {
      name: 'TestUser',
      telegramToken: 'dry-run-token',
      agentName: 'Eve',
      domains: ['invest', 'design'],
      workspacePath: resolve(homedir(), 'arete-workspace'),
      openclawPath: resolve(homedir(), '.openclaw'),
      gatsaeng: true,
      vaultPath: resolve(homedir(), 'Documents', 'Obsidian', 'GatsaengOS'),
    };
  }

  const { default: inquirer } = await import('inquirer');

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Your name (English):',
      validate: (v) => (v.trim().length > 0 ? true : 'Name is required'),
    },
    {
      type: 'input',
      name: 'telegramToken',
      message: 'Telegram bot token:',
      validate: (v) => (v.trim().length > 0 ? true : 'Token is required'),
    },
    {
      type: 'input',
      name: 'agentName',
      message: 'Assistant name (default: Eve):',
      default: 'Eve',
    },
    {
      type: 'input',
      name: 'domainsRaw',
      message: 'Primary domains (comma-separated, e.g. invest, design, marketing):',
      default: 'general',
    },
    {
      type: 'input',
      name: 'workspacePath',
      message: `Workspace path (default: ${resolve(homedir(), 'arete-workspace')}):`,
      default: resolve(homedir(), 'arete-workspace'),
    },
    {
      type: 'confirm',
      name: 'sajuCoaching',
      message: 'Enable 사주 기반 코칭? (명리 공명 프레임워크로 맞춤 코칭)',
      default: true,
    },
    {
      type: 'confirm',
      name: 'gatsaeng',
      message: 'Install 갓생OS? (neuroscience-based habit & productivity dashboard)',
      default: true,
    },
  ]);

  // 사주 프로파일링 (사주 코칭 활성화 시)
  let sajuProfile = null;
  if (answers.sajuCoaching) {
    const sajuAnswers = await inquirer.prompt([
      {
        type: 'input',
        name: 'birthYear',
        message: 'Birth year (양력, e.g. 1990):',
        validate: (v) => {
          const n = parseInt(v);
          return n >= 1900 && n <= 2026 ? true : 'Enter a valid year (1900-2026)';
        },
      },
      {
        type: 'input',
        name: 'birthMonth',
        message: 'Birth month (1-12):',
        validate: (v) => {
          const n = parseInt(v);
          return n >= 1 && n <= 12 ? true : 'Enter 1-12';
        },
      },
      {
        type: 'input',
        name: 'birthDay',
        message: 'Birth day (1-31):',
        validate: (v) => {
          const n = parseInt(v);
          return n >= 1 && n <= 31 ? true : 'Enter 1-31';
        },
      },
      {
        type: 'input',
        name: 'birthHour',
        message: 'Birth hour (0-23, or "unknown"):',
        default: 'unknown',
      },
      {
        type: 'list',
        name: 'gender',
        message: 'Gender:',
        choices: [
          { name: '남 (Male)', value: 'M' },
          { name: '여 (Female)', value: 'F' },
        ],
      },
    ]);

    sajuProfile = {
      year: parseInt(sajuAnswers.birthYear),
      month: parseInt(sajuAnswers.birthMonth),
      day: parseInt(sajuAnswers.birthDay),
      hour: sajuAnswers.birthHour === 'unknown' ? null : parseInt(sajuAnswers.birthHour),
      gender: sajuAnswers.gender,
    };
  }

  let vaultPath = '';
  if (answers.gatsaeng) {
    const vaultAnswer = await inquirer.prompt([
      {
        type: 'input',
        name: 'vaultPath',
        message: 'Obsidian vault path for 갓생OS data:',
        default: resolve(homedir(), 'Documents', 'Obsidian', 'GatsaengOS'),
        validate: (v) => (v.trim().length > 0 ? true : 'Vault path is required for 갓생OS'),
      },
    ]);
    vaultPath = resolve(vaultAnswer.vaultPath);
  }

  const domains = answers.domainsRaw
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);

  return {
    name: answers.name.trim(),
    telegramToken: answers.telegramToken.trim(),
    agentName: answers.agentName.trim(),
    domains,
    workspacePath: resolve(answers.workspacePath),
    openclawPath: resolve(homedir(), '.openclaw'),
    sajuCoaching: answers.sajuCoaching,
    sajuProfile,
    gatsaeng: answers.gatsaeng,
    vaultPath,
  };
}
