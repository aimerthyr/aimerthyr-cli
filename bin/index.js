#!/usr/bin/env node
import { Command } from 'commander';
import { createProject } from '../commands/create/index.js';

const program = new Command();

program
  .name('chao-cli')
  .description('前端项目脚手架')
  .version('1.0.0');

// create 命令（目前支持了创建命令，后续可新增其他命令）
program
  .command('create')
  .description('创建一个新项目')
  .argument('[projectName]', '项目名称')
  .action((projectName) => {
    if (!projectName) {
      console.log('\n❌ 项目名未填写，请使用：');
      console.log('   chao-cli create <project-name>\n');
      process.exit(1);
    }

    // 进入正常逻辑
    createProject(projectName);
  });

program.parse(process.argv);