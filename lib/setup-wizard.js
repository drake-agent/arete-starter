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
  ]);

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
  };
}
