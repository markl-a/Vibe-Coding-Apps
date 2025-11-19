#!/usr/bin/env node

/**
 * AI Assistant CLI
 */

import { Command } from 'commander';
import { AIAssistant } from './assistant';

const program = new Command();
const assistant = new AIAssistant();

program
  .name('vibe-ai')
  .description('AI-powered development assistant for Vibe-Coding-Apps')
  .version('1.0.0');

program
  .command('analyze <file>')
  .description('Analyze code file')
  .action(async (file) => {
    console.log(`Analyzing ${file}...`);
    const result = await assistant.analyze(file);
    console.log(JSON.stringify(result, null, 2));
  });

program
  .command('optimize <file>')
  .description('Get optimization suggestions')
  .action(async (file) => {
    console.log(`Optimizing ${file}...`);
    const result = await assistant.optimize(file);
    console.log(JSON.stringify(result, null, 2));
  });

program
  .command('review <file>')
  .description('Review code file')
  .action(async (file) => {
    console.log(`Reviewing ${file}...`);
    const result = await assistant.review(file);
    console.log(JSON.stringify(result, null, 2));
  });

program
  .command('health <project>')
  .description('Get project health report')
  .action(async (project) => {
    console.log(`Analyzing project health for ${project}...`);
    const result = await assistant.getProjectHealth(project);
    console.log(JSON.stringify(result, null, 2));
  });

program.parse();
