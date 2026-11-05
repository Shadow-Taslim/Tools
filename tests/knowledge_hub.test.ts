import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 
  KNOWLEDGE_ARTICLES, 
  TOPICAL_OPPORTUNITIES, 
  BRAND_AUTHORITY_MATERIALS, 
  AI_TESTING_FRAMEWORK 
} from '../src/data/knowledgeHubData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🧪 Starting QuickNest Knowledge Hub & Topical Authority Verification Suite...\n');

let passedTests = 0;

function test(description: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✅ PASS: ${description}`);
    passedTests++;
  } catch (err: any) {
    console.error(`  ❌ FAIL: ${description}`);
    console.error(`     Reason: ${err.message}`);
    process.exit(1);
  }
}

// --- 1. Published Technical Guides Verification ---
console.log('--- 1. Published Technical Guides Verification ---');

test('KNOWLEDGE_ARTICLES contains exactly 5 detailed technical guides', () => {
  assert.strictEqual(KNOWLEDGE_ARTICLES.length, 5);
});

test('Every guide has required metadata and author attribution', () => {
  for (const article of KNOWLEDGE_ARTICLES) {
    assert.ok(article.slug && article.slug.length > 5, `Missing slug on ${article.title}`);
    assert.ok(article.title && article.title.length > 10, `Title too short on ${article.slug}`);
    assert.ok(article.subtitle && article.subtitle.length > 20, `Subtitle too short on ${article.slug}`);
    assert.ok(article.summary && article.summary.length > 50, `Summary too short on ${article.slug}`);
    assert.ok(article.readTimeMinutes >= 5, `Read time under 5 min on ${article.slug}`);
    assert.ok(article.author.name && article.author.role, `Missing author on ${article.slug}`);
    assert.ok(article.targetKeyword && article.targetKeyword.length > 3, `Missing target keyword on ${article.slug}`);
  }
});

test('Every guide contains at least 3 sections and key takeaways', () => {
  for (const article of KNOWLEDGE_ARTICLES) {
    assert.ok(article.keyTakeaways.length >= 3, `Key takeaways under 3 on ${article.slug}`);
    assert.ok(article.sections.length >= 3, `Sections under 3 on ${article.slug}`);
    for (const section of article.sections) {
      assert.ok(section.heading && section.heading.length > 5, `Missing heading in section of ${article.slug}`);
      assert.ok(section.content && section.content.length > 50, `Content too short in section of ${article.slug}`);
    }
  }
});

test('Every guide contains at least 2 structured FAQs', () => {
  for (const article of KNOWLEDGE_ARTICLES) {
    assert.ok(article.faqs.length >= 2, `FAQs under 2 on ${article.slug}`);
    for (const faq of article.faqs) {
      assert.ok(faq.question.endsWith('?'), `FAQ question does not end with question mark in ${article.slug}`);
      assert.ok(faq.answer.length > 20, `FAQ answer too short in ${article.slug}`);
    }
  }
});

// --- 2. 30 Mapped Topical Authority Opportunities ---
console.log('\n--- 2. 30 Mapped Topical Authority Opportunities ---');

test('TOPICAL_OPPORTUNITIES contains exactly 30 mapped opportunities', () => {
  assert.strictEqual(TOPICAL_OPPORTUNITIES.length, 30);
});

test('Every opportunity has sequential ID from 1 to 30', () => {
  TOPICAL_OPPORTUNITIES.forEach((opp, index) => {
    assert.strictEqual(opp.id, index + 1, `Mismatched ID on index ${index}`);
  });
});

test('Every opportunity has primary search intent, target audience, and keyword', () => {
  for (const opp of TOPICAL_OPPORTUNITIES) {
    assert.ok(['Informational', 'Technical', 'Commercial', 'Educational', 'Architecture'].includes(opp.intent));
    assert.ok(opp.targetAudience.length > 5, `Target audience missing on #${opp.id}`);
    assert.ok(opp.mainKeyword.length > 5, `Main keyword missing on #${opp.id}`);
    assert.ok(opp.relatedKeywords.length >= 2, `Related keywords under 2 on #${opp.id}`);
    assert.ok(opp.questionsAnswered.length >= 2, `Questions answered under 2 on #${opp.id}`);
    assert.ok(opp.relevantTool, `Missing relevant tool on #${opp.id}`);
    assert.ok(opp.internalLinking.length >= 1, `Missing internal links on #${opp.id}`);
  }
});

// --- 3. External Brand Authority & Distribution Materials ---
console.log('\n--- 3. Brand Authority & Launch Materials ---');

test('Product Hunt launch copy is prepared with maker comment', () => {
  assert.ok(BRAND_AUTHORITY_MATERIALS.productHunt.title.includes('QuickNest'));
  assert.ok(BRAND_AUTHORITY_MATERIALS.productHunt.tagline.length > 20);
  assert.ok(BRAND_AUTHORITY_MATERIALS.productHunt.makerComment.length > 100);
});

test('Hacker News Show HN draft is prepared with technical depth', () => {
  assert.ok(BRAND_AUTHORITY_MATERIALS.hackerNews.title.startsWith('Show HN: QuickNest'));
  assert.ok(BRAND_AUTHORITY_MATERIALS.hackerNews.text.includes('RFC 9309'));
  assert.ok(BRAND_AUTHORITY_MATERIALS.hackerNews.text.includes('crypto.getRandomValues'));
});

// --- 4. AI Search Testing Framework ---
console.log('\n--- 4. AI Visibility Testing Framework ---');

test('AI Testing framework contains at least 6 standard benchmark prompts', () => {
  assert.ok(AI_TESTING_FRAMEWORK.benchmarkPrompts.length >= 6);
  for (const prompt of AI_TESTING_FRAMEWORK.benchmarkPrompts) {
    assert.ok(prompt.query.length > 10);
    assert.ok(prompt.successCriteria.length > 10);
  }
});

test('Monthly tracking matrix is defined with composite targets', () => {
  assert.ok(AI_TESTING_FRAMEWORK.monthlyTrackingMetrics.length >= 4);
});

// --- 5. Sitemap & LLMs.txt Sync ---
console.log('\n--- 5. Sitemap & Machine-Readable Spec Sync ---');

test('public/sitemap.xml registers /guides and all 5 individual guide URLs', () => {
  const sitemapPath = path.resolve(rootDir, 'public', 'sitemap.xml');
  const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
  assert.ok(sitemapContent.includes('<loc>https://quicknest.ai.studio/guides</loc>'));
  for (const article of KNOWLEDGE_ARTICLES) {
    assert.ok(sitemapContent.includes(`<loc>https://quicknest.ai.studio/guides/${article.slug}</loc>`), `Missing in sitemap: ${article.slug}`);
  }
});

test('public/llms.txt indexes the Knowledge Hub section', () => {
  const llmsPath = path.resolve(rootDir, 'public', 'llms.txt');
  const llmsContent = fs.readFileSync(llmsPath, 'utf8');
  assert.ok(llmsContent.includes('### 9. Knowledge Hub & Technical Guides'));
  assert.ok(llmsContent.includes('https://quicknest.ai.studio/guides'));
  assert.ok(llmsContent.includes('Mastering RFC 9309'));
});

console.log('\n===========================================');
console.log(`Knowledge Hub Verification: ${passedTests} Passed, 0 Failed`);
console.log('===========================================\n');
