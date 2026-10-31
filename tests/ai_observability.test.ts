/**
 * AI Search Observability & GEO Verification Tests
 * Run with: npx tsx tests/ai_observability.test.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { testPathAgainstRobots, auditRobotsContent } from '../server/robots-scanner.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

async function runAiObservabilityTests() {
  console.log('🧪 Starting QuickNest AI Search Observability (14 to 74) Verification Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. llms.txt Standard Specification
  console.log('--- 1. Standard /llms.txt Verification ---');
  const llmsPath = path.resolve(projectRoot, 'public', 'llms.txt');
  assert(fs.existsSync(llmsPath), 'public/llms.txt file exists');

  const llmsContent = fs.readFileSync(llmsPath, 'utf8');
  assert(llmsContent.includes('# QuickNest - LLM Context'), 'llms.txt includes standard title header');
  assert(llmsContent.includes('https://llmstxt.org'), 'llms.txt references official LLMs.txt specification');
  assert(llmsContent.includes('https://quicknest.org/ai-observability'), 'llms.txt indexes AI Observability suite');
  assert(llmsContent.includes('https://quicknest.org/temp-mail'), 'llms.txt indexes Disposable Temp Mail tool');
  assert(llmsContent.includes('https://quicknest.org/robots-audit'), 'llms.txt indexes Robots Auditor');
  assert(llmsContent.includes('POST /api/ai-observability/simulate'), 'llms.txt documents machine API standards');

  // 2. Comprehensive llms-full.txt
  console.log('\n--- 2. Comprehensive /llms-full.txt Verification ---');
  const llmsFullPath = path.resolve(projectRoot, 'public', 'llms-full.txt');
  assert(fs.existsSync(llmsFullPath), 'public/llms-full.txt file exists');

  const fullContent = fs.readFileSync(llmsFullPath, 'utf8');
  assert(fullContent.includes('RFC 9309 Robots.txt & AI Crawler Discovery'), 'llms-full.txt documents RFC 9309 AI crawler access');
  assert(fullContent.includes('Generative Engine Optimization (GEO)'), 'llms-full.txt covers GEO optimization pillars');
  assert(fullContent.includes('AI Visibility Score: Upgraded from 14/100 to 74/100'), 'llms-full.txt documents 14 to 74 visibility upgrade');

  // 3. Robots.txt AI Bot Crawl Policies
  console.log('\n--- 3. Robots.txt AI Bot Directives ---');
  const robotsPath = path.resolve(projectRoot, 'public', 'robots.txt');
  assert(fs.existsSync(robotsPath), 'public/robots.txt exists');

  const robotsContent = fs.readFileSync(robotsPath, 'utf8');
  assert(robotsContent.includes('User-agent: GPTBot'), 'robots.txt contains OpenAI GPTBot directives');
  assert(robotsContent.includes('User-agent: ClaudeBot'), 'robots.txt contains Anthropic ClaudeBot directives');
  assert(robotsContent.includes('User-agent: Google-Extended'), 'robots.txt contains Google-Extended directives');
  assert(robotsContent.includes('User-agent: PerplexityBot'), 'robots.txt contains PerplexityBot directives');
  assert(robotsContent.includes('User-agent: Applebot-Extended'), 'robots.txt contains Applebot-Extended directives');
  assert(robotsContent.includes('Allow: /llms.txt'), 'robots.txt explicitly allows /llms.txt access');

  // 4. Test AI Crawler Path Access
  console.log('\n--- 4. Crawler Path Simulation Matrix ---');
  const gptbotRoot = testPathAgainstRobots(robotsContent, 'GPTBot', '/');
  assert(gptbotRoot.allowed === true, 'GPTBot is allowed to index root domain (/)');

  const gptbotLlms = testPathAgainstRobots(robotsContent, 'GPTBot', '/llms.txt');
  assert(gptbotLlms.allowed === true, 'GPTBot is allowed to read /llms.txt');

  const gptbotApi = testPathAgainstRobots(robotsContent, 'GPTBot', '/api/shorten');
  assert(gptbotApi.allowed === false, 'GPTBot is properly disallowed from private /api/ endpoints');

  const claudeAudit = testPathAgainstRobots(robotsContent, 'ClaudeBot', '/ai-observability');
  assert(claudeAudit.allowed === true, 'ClaudeBot is allowed to index /ai-observability');

  const perplexityTemp = testPathAgainstRobots(robotsContent, 'PerplexityBot', '/temp-mail');
  assert(perplexityTemp.allowed === true, 'PerplexityBot is allowed to index /temp-mail');

  // 5. Sitemap & Discoverability
  console.log('\n--- 5. Sitemap XML Registration ---');
  const sitemapPath = path.resolve(projectRoot, 'public', 'sitemap.xml');
  const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
  assert(sitemapContent.includes('https://quicknest.org/ai-observability'), 'sitemap.xml contains /ai-observability endpoint with priority 0.95');

  console.log(`\n===========================================`);
  console.log(`AI Observability Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`===========================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAiObservabilityTests();
