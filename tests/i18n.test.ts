/**
 * Internationalization (i18n) Verification Test Suite for QuickNest
 * Run with: npx tsx tests/i18n.test.ts
 */

import { SUPPORTED_LANGUAGES, Language } from '../src/i18n/types.ts';
import { translations } from '../src/i18n/translations.ts';

async function runI18nTests() {
  console.log('🧪 Starting QuickNest Internationalization (i18n) Test Suite...\n');
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

  // Test 1: Supported Languages List
  console.log('--- 1. Supported Languages Metadata ---');
  assert(SUPPORTED_LANGUAGES.length === 10, `Exactly 10 languages supported (found ${SUPPORTED_LANGUAGES.length})`);
  
  const expectedCodes: Language[] = ['en', 'es', 'fr', 'de', 'bn', 'ja', 'zh', 'ar', 'pt', 'ru'];
  for (const code of expectedCodes) {
    const found = SUPPORTED_LANGUAGES.find(l => l.code === code);
    assert(found !== undefined, `Language '${code}' is configured with metadata`);
    if (found) {
      assert(found.name.length > 0 && found.nativeName.length > 0 && found.flag.length > 0, `Language '${code}' has name, nativeName, and flag emoji`);
    }
  }

  // Test 2: RTL Detection
  console.log('\n--- 2. RTL & Directionality ---');
  const arabic = SUPPORTED_LANGUAGES.find(l => l.code === 'ar');
  assert(arabic !== undefined && arabic.dir === 'rtl', 'Arabic is marked as dir="rtl" for right-to-left layout');
  
  const english = SUPPORTED_LANGUAGES.find(l => l.code === 'en');
  assert(english !== undefined && english.dir === 'ltr', 'English is marked as dir="ltr" for left-to-right layout');

  // Test 3: Key UI Namespace Coverage across all 10 languages
  console.log('\n--- 3. Namespace Coverage Across Languages ---');
  const essentialKeys = [
    'nav.brand',
    'nav.home',
    'nav.tempMail',
    'nav.urlShortener',
    'nav.securityChecker',
    'common.copy',
    'common.copied',
    'common.refresh',
    'common.language',
    'home.heroTitle',
    'home.heroSubtitle',
    'home.statPrivacy',
    'home.statDelivery',
    'tempMail.title',
    'tempMail.subtitle',
    'tempMail.activeAddress',
    'tempMail.copyAddress',
    'tempMail.retryNew',
    'shortener.title',
    'shortener.shortenBtn',
    'checker.title',
    'checker.analyzeBtn',
    'qrcode.title',
    'password.title',
    'wordCounter.title',
    'textCase.title',
    'footer.ttlPurgeTitle',
    'footer.zeroAccountTitle',
  ];

  for (const lang of expectedCodes) {
    const langDict = translations[lang];
    assert(langDict !== undefined, `Translation dictionary exists for '${lang}'`);
    if (langDict) {
      let missingCount = 0;
      for (const k of essentialKeys) {
        if (!langDict[k] || langDict[k].trim() === '') {
          missingCount++;
          console.error(`    ⚠️ Missing key '${k}' in language '${lang}'`);
        }
      }
      assert(missingCount === 0, `Language '${lang}' has all ${essentialKeys.length} essential translation keys`);
    }
  }

  // Test 4: Language Dictionary Size
  console.log('\n--- 4. Dictionary Completeness ---');
  for (const lang of expectedCodes) {
    const keyCount = Object.keys(translations[lang] || {}).length;
    assert(keyCount >= 30, `Language '${lang}' has comprehensive translation dictionary (${keyCount} keys)`);
  }

  console.log(`\n===========================================`);
  console.log(`i18n Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`===========================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runI18nTests();
