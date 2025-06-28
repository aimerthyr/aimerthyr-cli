import { spawn } from 'child_process';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import cliProgress from 'cli-progress';

const REPO_URL_MAP = new Map([
  ['fullstack', 'git@github.com:aimerthyr/fullstack-template.git'],
]);

export async function createProject(projectName) {
  const { templateType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'templateType',
      message: '请选择项目模板类型：',
      choices: [
        { name: 'fullstack 模板（Vue3+NestJS）', value: 'fullstack' },
      ],
    },
  ]);

  await cloneWithProgress(projectName, REPO_URL_MAP.get(templateType));
}

async function cloneWithProgress(projectName, repoUrl) {
  const targetDir = path.resolve(process.cwd(), projectName);
  if (fs.existsSync(targetDir)) {
    console.log(chalk.red(`❌ 目录 ${projectName} 已存在，请更换名称`));
    return;
  }

  const bar = new cliProgress.SingleBar({
    format: chalk.cyan('📦 下载进度 |{bar}| {percentage}% | 对象: {count} | 已下载: {size}'),
    barCompleteChar: '█',
    barIncompleteChar: '░',
    hideCursor: true,
    clearOnComplete: true,
  }, cliProgress.Presets.shades_classic);

  bar.start(100, 0, {
    size: '0.00',
    count: '0/0',
  });

  const gitProcess = spawn('git', ['clone', '--depth=1', '--progress', repoUrl, projectName]);

  gitProcess.stderr.on('data', (data) => {
    const message = data.toString();

    const receiveMatch = message.match(/Receiving objects:\s+(\d+)%\s+\((\d+)\/(\d+)\),\s+([\d.]+\s\w+iB)/);

    if (receiveMatch) {
      const percent = parseInt(receiveMatch[1], 10);
      const current = receiveMatch[2];
      const total = receiveMatch[3];
      const size = receiveMatch[4];

      bar.update(percent, {
        count: `${current}/${total}`,
        size: size,
      });
    } else {
      bar.update(0, {
        count: '解析中...',
        size: '0.00',
      });
    }
  });

  gitProcess.on('close', (code) => {
    if (code === 0) {
      bar.update(100, { count: '完成', size: '' });
      bar.stop();

      const gitPath = path.join(targetDir, '.git');
      if (fs.existsSync(gitPath)) {
        fs.rmSync(gitPath, { recursive: true, force: true });
      }

      console.log(chalk.green(`✅ 模板拉取成功：${projectName}`));
      console.log(chalk.cyan(`📁 cd ${projectName}`));
      console.log(chalk.cyan(`📦 pnpm install`));
      console.log(chalk.cyan(`🚀 pnpm dev`));
    } else {
      bar.stop();
      console.log(chalk.red(`❌ 模板拉取失败（退出码 ${code}）`));
    }
  });
}