/**
 * Automated Verification Test Suite for Robots.txt & SEO Auditor
 * Run with: npx tsx tests/robots_audit.test.ts
 */

import fs from 'fs';
import path from 'path';
import { auditRobotsContent, testPathAgainstRobots, parseRobotsTxt } from '../server/robots-scanner.ts';

async function runRobotsTests() {
  console.log('🧪 Starting Robots.txt & SEO Auditor Test Suite...\n');
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

  // --- Test 1: Static Files Verification ---
  console.log('--- 1. Static Configuration Verification ---');
  const robotsPath = path.resolve(process.cwd(), 'public', 'robots.txt');
  const sitemapPath = path.resolve(process.cwd(), 'public', 'sitemap.xml');

  assert(fs.existsSync(robotsPath), 'public/robots.txt exists on filesystem');
  assert(fs.existsSync(sitemapPath), 'public/sitemap.xml exists on filesystem');

  const robotsContent = fs.readFileSync(robotsPath, 'utf8');
  assert(robotsContent.includes('User-agent: *'), 'robots.txt includes universal User-agent: *');
  assert(robotsContent.includes('Disallow: /api/'), 'robots.txt protects private /api/ endpoints');
  assert(robotsContent.includes('Disallow: /s/'), 'robots.txt protects unvetted short redirect links');
  assert(robotsContent.includes('Disallow: /preview/'), 'robots.txt protects destination previews');
  assert(robotsContent.includes('Sitemap: https://quicknest.org/sitemap.xml'), 'robots.txt declares canonical sitemap');
  assert(robotsContent.includes('User-agent: GPTBot'), 'robots.txt configures AI crawler policies');

  const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
  assert(sitemapContent.startsWith('<?xml'), 'sitemap.xml has XML declaration');
  assert(sitemapContent.includes('<loc>https://quicknest.org/robots-audit</loc>'), 'sitemap.xml indexes /robots-audit');

  // --- Test 2: Catastrophic Disallow: / Pitfall Detection ---
  console.log('\n--- 2. Indexing Pitfall Auditing ---');
  const catastrophicConfig = `
    User-agent: *
    Disallow: /
  `;
  const catastrophicAudit = auditRobotsContent(catastrophicConfig);
  assert(catastrophicAudit.isSiteBlocked === true, 'Successfully detects catastrophic Disallow: / site-wide block');
  assert(catastrophicAudit.healthScore < 70, 'Health score is severely penalized for blocking all search engines');
  assert(catastrophicAudit.issues.some(i => i.severity === 'critical' && i.title.includes('Catastrophic Block')), 'Issues list contains critical alert for site-wide block');

  // --- Test 3: CSS/JS Asset Blockage Pitfall Detection ---
  const assetBlockingConfig = `
    User-agent: *
    Allow: /
    Disallow: /*.css$
    Disallow: /_next/static/
    Sitemap: https://example.com/sitemap.xml
  `;
  const assetAudit = auditRobotsContent(assetBlockingConfig);
  assert(assetAudit.blocksAssets === true, 'Successfully detects asset blockage violations (Disallow: /*.css$)');
  assert(assetAudit.issues.some(i => i.title.includes('Asset Blocking Directive')), 'Issues list warns about Google mobile-friendly rendering penalty');

  // --- Test 4: Sensitive Internal Route Exposure Detection ---
  const sensitiveExposedConfig = `
    User-agent: *
    Allow: /
    Disallow: /admin/
    Disallow: /wp-admin/
    Disallow: /internal/
    Sitemap: https://example.com/sitemap.xml
  `;
  const sensitiveAudit = auditRobotsContent(sensitiveExposedConfig);
  assert(sensitiveAudit.privatePathsExposed.length >= 3, 'Flags multiple sensitive internal paths exposed in public robots.txt');
  assert(sensitiveAudit.issues.some(i => i.title.includes('Sensitive Path Exposed')), 'Issues list explains robots.txt provides attack roadmaps if unauthenticated');

  // --- Test 5: QuickNest Production Configuration Audit ---
  console.log('\n--- 3. QuickNest Production Configuration Audit ---');
  const qnAudit = auditRobotsContent(robotsContent, 'https://quicknest.org/robots.txt');
  assert(qnAudit.isSiteBlocked === false, 'QuickNest public site is NOT blocked');
  assert(qnAudit.blocksAssets === false, 'QuickNest does NOT block CSS or JS assets');
  assert(qnAudit.hasSitemap === true, 'QuickNest has valid sitemap declared');
  assert(qnAudit.aiBotsManaged === true, 'QuickNest manages AI bot crawlers');
  assert(qnAudit.healthScore >= 95, `QuickNest health score is exceptional (${qnAudit.healthScore}/100)`);

  // --- Test 6: RFC 9309 Path Simulator Accuracy ---
  console.log('\n--- 4. RFC 9309 Path Simulation Engine ---');
  // Public pages should be allowed
  const testHome = testPathAgainstRobots(robotsContent, 'Googlebot', '/');
  assert(testHome.allowed === true, 'Googlebot is ALLOWED to crawl / (Home)');

  const testTempMail = testPathAgainstRobots(robotsContent, 'Googlebot', '/temp-mail');
  assert(testTempMail.allowed === true, 'Googlebot is ALLOWED to crawl /temp-mail');

  const testRobotsAudit = testPathAgainstRobots(robotsContent, 'Googlebot', '/robots-audit');
  assert(testRobotsAudit.allowed === true, 'Googlebot is ALLOWED to crawl /robots-audit');

  // Private routes must be disallowed
  const testApi = testPathAgainstRobots(robotsContent, 'Googlebot', '/api/email/inbox');
  assert(testApi.allowed === false, 'Googlebot is DISALLOWED from /api/email/inbox');

  const testShort = testPathAgainstRobots(robotsContent, 'Googlebot', '/s/testcode');
  assert(testShort.allowed === false, 'Googlebot is DISALLOWED from /s/testcode (prevents duplicate redirection scraping)');

  const testPreview = testPathAgainstRobots(robotsContent, 'Googlebot', '/preview/testcode');
  assert(testPreview.allowed === false, 'Googlebot is DISALLOWED from /preview/testcode (prevents indexing untrusted URLs)');

  // AI bot test
  const testGptBot = testPathAgainstRobots(robotsContent, 'GPTBot', '/api/email/inbox');
  assert(testGptBot.allowed === false, 'GPTBot is DISALLOWED from /api/email/inbox');

  console.log(`\n===========================================`);
  console.log(`Robots Audit Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`===========================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runRobotsTests();
