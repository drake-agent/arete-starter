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
      timezone: 'UTC',
      primaryChannel: 'telegram',
      useCalendar: false,
      meetingSource: 'none',
      useObsidian: false,
      gatsaeng: true,
      vaultPath: resolve(homedir(), 'Documents', 'Obsidian', 'GatsaengOS'),
      runtime: 'openclaw',
      personalityStyle: 'direct',
      personalityCustom: '',
      sajuEnabled: false,
      birthDate: '',
      birthTime: '',
      gender: '',
    };
  }

  const { default: inquirer } = await import('inquirer');

  // Runtime selection — FIRST question
  const { runtime } = await inquirer.prompt([
    {
      type: 'list',
      name: 'runtime',
      message: 'Agent runtime:',
      choices: [
        { name: 'OpenClaw', value: 'openclaw' },
        { name: 'Hermes (Anthropic)', value: 'hermes' },
      ],
      default: 'openclaw',
    },
  ]);

  // Core questions — some conditional on runtime
  const coreQuestions = [
    {
      type: 'input',
      name: 'name',
      message: 'Your name (English):',
      validate: (v) => (v.trim().length > 0 ? true : 'Name is required'),
    },
  ];

  // Telegram token — only for OpenClaw (Hermes handles it)
  if (runtime === 'openclaw') {
    coreQuestions.push({
      type: 'input',
      name: 'telegramToken',
      message: 'Telegram bot token:',
      validate: (v) => (v.trim().length > 0 ? true : 'Token is required'),
    });
  }

  coreQuestions.push(
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
      type: 'input',
      name: 'timezone',
      message: 'Your timezone (e.g. Asia/Seoul, America/New_York, UTC):',
      default: 'UTC',
    },
    {
      type: 'list',
      name: 'primaryChannel',
      message: 'Primary input channel for daily signals:',
      choices: [
        { name: 'Telegram bot', value: 'telegram' },
        { name: 'Manual (daily log files)', value: 'manual' },
        { name: 'Both', value: 'both' },
      ],
      default: 'telegram',
    },
    {
      type: 'confirm',
      name: 'useCalendar',
      message: 'Enable calendar source for schedule signals? (can be configured later)',
      default: false,
    },
    {
      type: 'list',
      name: 'meetingSource',
      message: 'Meeting intel source:',
      choices: [
        { name: 'None (skip meeting intel)', value: 'none' },
        { name: 'Manual transcripts (paste text into chat)', value: 'manual' },
        { name: 'Audio files (voice-inbox directory)', value: 'audio' },
      ],
      default: 'none',
    },
    {
      type: 'confirm',
      name: 'useObsidian',
      message: 'Use Obsidian for wiki viewing? (optional — wiki works without it)',
      default: false,
    },
  );

  const answers = await inquirer.prompt(coreQuestions);

  // Personality style
  const { personalityStyle } = await inquirer.prompt([
    {
      type: 'list',
      name: 'personalityStyle',
      message: 'Agent personality style:',
      choices: [
        { name: 'Soft & respectful — gentle tone, professional', value: 'soft' },
        { name: 'Direct & opinionated — strong takes, no hedging', value: 'direct' },
        { name: 'Custom — describe your preferred style', value: 'custom' },
      ],
      default: 'soft',
    },
  ]);

  let personalityCustom = '';
  if (personalityStyle === 'custom') {
    const { customDesc } = await inquirer.prompt([
      {
        type: 'input',
        name: 'customDesc',
        message: "Describe your ideal assistant's personality in 1-2 sentences:",
        validate: (v) => (v.trim().length > 0 ? true : 'Description is required for custom style'),
      },
    ]);
    personalityCustom = customDesc.trim();
  }

  // Saju onboarding
  const { sajuEnabled } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'sajuEnabled',
      message: 'Enable 사주 (Korean astrology) personality profiling?',
      default: false,
    },
  ]);

  let birthDate = '';
  let birthTime = '';
  let gender = '';
  let sajuProfile = null;

  if (sajuEnabled) {
    const sajuAnswers = await inquirer.prompt([
      {
        type: 'input',
        name: 'birthDate',
        message: 'Birth date (YYYY-MM-DD):',
        validate: (v) => /^\d{4}-\d{2}-\d{2}$/.test(v.trim()) ? true : 'Format: YYYY-MM-DD',
      },
      {
        type: 'input',
        name: 'birthTime',
        message: 'Birth time (HH:MM, 24h format, or "unknown"):',
        default: 'unknown',
        validate: (v) => {
          const t = v.trim();
          return t === 'unknown' || /^\d{2}:\d{2}$/.test(t) ? true : 'Format: HH:MM or "unknown"';
        },
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

    birthDate = sajuAnswers.birthDate.trim();
    birthTime = sajuAnswers.birthTime.trim();
    gender = sajuAnswers.gender;

    // Build legacy sajuProfile for backward compat with saju-engine
    const [y, m, d] = birthDate.split('-').map(Number);
    const hour = birthTime === 'unknown' ? null : parseInt(birthTime.split(':')[0]);
    sajuProfile = { year: y, month: m, day: d, hour, gender };
  }

  // Legacy saju coaching question (kept for OpenClaw compat)
  const sajuCoaching = sajuEnabled;

  // 갓생OS
  const { gatsaeng } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'gatsaeng',
      message: 'Install 갓생OS? (neuroscience-based habit & productivity dashboard)',
      default: true,
    },
  ]);

  let vaultPath = '';
  if (gatsaeng) {
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
    telegramToken: runtime === 'openclaw' ? answers.telegramToken.trim() : '',
    agentName: answers.agentName.trim(),
    domains,
    workspacePath: resolve(answers.workspacePath),
    openclawPath: runtime === 'openclaw' ? resolve(homedir(), '.openclaw') : '',
    timezone: answers.timezone.trim() || 'UTC',
    primaryChannel: answers.primaryChannel,
    useCalendar: answers.useCalendar,
    meetingSource: answers.meetingSource,
    useObsidian: answers.useObsidian,
    sajuCoaching,
    sajuProfile,
    gatsaeng,
    vaultPath,
    // New fields
    runtime,
    personalityStyle,
    personalityCustom,
    sajuEnabled,
    birthDate,
    birthTime,
    gender,
  };
}
