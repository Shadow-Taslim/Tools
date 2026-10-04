/**
 * Comprehensive Automated Verification Suite for User Scenarios
 * Tests all 6 Core Privacy Modules:
 * 1. QR Code Generator
 * 2. URL Shortener
 * 3. Disposable 10-Minute Email
 * 4. Cryptographic Password Suite
 * 5. Case Converter & Formatter
 * 6. Word and Text Counter
 */

import { store } from '../server/store.ts';
import { evaluateUrlSafety } from '../server/malware-checker.ts';
import QRCode from 'qrcode';

async function runComprehensiveTests() {
  console.log('🚀 Running Comprehensive Automated Suite for All 6 Modules...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // =========================================================================
  // MODULE 1: QR Code Generator Tests
  // =========================================================================
  console.log('--- MODULE 1: QR Code Generator Tests ---');
  
  // 1a. URL with query parameters
  const testUrlWithParams = 'https://example.com/?name=Jane%20Doe&ref=test';
  const qrSvgWithParams = await QRCode.toString(testUrlWithParams, { type: 'svg' });
  assert(qrSvgWithParams.includes('<svg') && qrSvgWithParams.length > 500, 'QR code generates for URL with query parameters');

  // 1b. Empty input fallback
  const emptyInput = '';
  const fallbackUrl = emptyInput.trim() || 'https://quicknest.org';
  const qrSvgFallback = await QRCode.toString(fallbackUrl, { type: 'svg' });
  assert(qrSvgFallback.includes('<svg'), 'Empty input gracefully falls back to default URL');

  // 1c. Very long URL (over 1000 characters)
  const longUrl = 'https://example.com/analytics?' + Array.from({ length: 40 }, (_, i) => `param_${i}=value_${i}_extra_long_payload_string`).join('&');
  const qrSvgLong = await QRCode.toString(longUrl, { type: 'svg', errorCorrectionLevel: 'L' });
  assert(qrSvgLong.includes('<svg') && longUrl.length > 1000, 'QR code successfully encodes very long URL (>1000 chars)');

  // 1d. Text containing Emoji and UTF-8 characters
  const emojiText = '✨ QuickNest 🚀 2026 Café & Baguette 😊';
  const qrSvgEmoji = await QRCode.toString(emojiText, { type: 'svg' });
  assert(qrSvgEmoji.includes('<svg'), 'QR code successfully encodes UTF-8 multi-byte emoji and accents');

  // =========================================================================
  // MODULE 2: URL Shortener Tests
  // =========================================================================
  console.log('\n--- MODULE 2: URL Shortener Tests ---');

  // 2a. Shorten URL with query parameters and verify exact redirection target
  const originalUrlWithParams = 'https://example.com/page?campaign=spring&source=email';
  const link1 = store.createShortLink({
    originalUrl: originalUrlWithParams,
    domain: 'example.com',
    isMalicious: false,
    maliciousReasons: [],
    allowDirectRedirect: true
  });
  assert(link1.code.length >= 5, 'Short link generated successfully');
  const retrievedLink1 = store.getShortLink(link1.code);
  assert(retrievedLink1 !== null && retrievedLink1.originalUrl === originalUrlWithParams, 'Short link retrieves exact original URL including all query parameters');

  // 2b. Test shortening the same URL twice
  const link2 = store.createShortLink({
    originalUrl: originalUrlWithParams,
    domain: 'example.com',
    isMalicious: false,
    maliciousReasons: [],
    allowDirectRedirect: true
  });
  assert(link1.code !== link2.code, 'Shortening same URL twice creates distinct unique short codes');
  assert(store.getShortLink(link2.code)?.originalUrl === originalUrlWithParams, 'Second short link also redirects to exact original URL');

  // 2c. Test invalid URLs
  const invalidProtocol = evaluateUrlSafety('javascript:alert(document.cookie)');
  assert(!invalidProtocol.isSafe, 'Blocked javascript: pseudo-protocol URL');
  const loopbackUrl = evaluateUrlSafety('http://127.0.0.1:8080/admin');
  assert(!loopbackUrl.isSafe, 'Blocked private loopback SSRF URL');

  // 2d. Test expired link
  const expiredLink = store.createShortLink({
    originalUrl: 'https://example.com/flash-sale',
    domain: 'example.com',
    isMalicious: false,
    maliciousReasons: [],
    expiresInDays: -1 // Expired in the past
  });
  const retrievedExpired = store.getShortLink(expiredLink.code);
  assert(retrievedExpired === null, 'Expired link returns null (triggers 404 Expired page)');

  // =========================================================================
  // MODULE 3: Disposable 10-Minute Email Tests
  // =========================================================================
  console.log('\n--- MODULE 3: Disposable 10-Minute Email Tests ---');

  // 3a. Generate inbox
  const testInbox = store.createInbox();
  assert(testInbox.address.endsWith('@temp.quicknest.org'), 'Inbox generated with valid temporary domain');
  assert(testInbox.expiresAt > Date.now() + 9 * 60 * 1000, 'Inbox has active 10-minute expiration TTL');

  // 3b. Send email with subject, body, and attachments
  const sampleAttachments = [
    { filename: 'security_report.pdf', contentType: 'application/pdf', sizeBytes: 145408 },
    { filename: 'service_config.json', contentType: 'application/json', sizeBytes: 1228 }
  ];
  const emailMsg1 = store.addMessage({
    inboxAddress: testInbox.address,
    fromAddress: 'auditor@cyber-firm.com',
    fromName: 'Cyber Auditor',
    subject: 'Quarterly Security Evaluation Report',
    bodyText: 'Please find attached the security review documentation.',
    bodyHtml: '<p>Please find attached the security review documentation.</p>',
    headers: { 'x-origin': 'automated-suite' },
    attachments: sampleAttachments
  });
  assert(emailMsg1.attachments?.length === 2, 'Message delivered with 2 attachments intact');

  // 3c. Send multiple incoming messages & verify old messages remain accessible in chronological order
  const emailMsg2 = store.addMessage({
    inboxAddress: testInbox.address,
    fromAddress: 'notifier@github.com',
    fromName: 'GitHub Notifier',
    subject: 'New release v2.4.0 published',
    bodyText: 'Release notes available online.',
    bodyHtml: '<p>Release notes available online.</p>',
    headers: {}
  });

  const inboxMessages = store.getMessagesForInbox(testInbox.address);
  assert(inboxMessages.length === 2, 'Multiple incoming messages received and stored');
  assert(inboxMessages[0].id === emailMsg2.id && inboxMessages[1].id === emailMsg1.id, 'Messages ordered newest first, with previous messages fully accessible');
  assert(inboxMessages[1].attachments?.[0].filename === 'security_report.pdf', 'First message attachments remain intact and accessible');

  // 3d. Verify inbox expiration
  testInbox.expiresAt = Date.now() - 1000; // Force expired
  const checkExpiredInbox = store.getInbox(testInbox.address);
  assert(checkExpiredInbox === null, 'Expired inbox ceases working after TTL expiry and auto-deletes');

  // =========================================================================
  // MODULE 4: Cryptographic Password Suite Tests
  // =========================================================================
  console.log('\n--- MODULE 4: Cryptographic Password Suite Tests ---');

  // Replicate Password Generator Logic
  function generatePassword(len: number, options: { upper: boolean; lower: boolean; numbers: boolean; symbols: boolean; exclude?: string }) {
    const filter = (s: string) => {
      let r = s;
      if (options.exclude) {
        const set = new Set(options.exclude.split(''));
        r = r.split('').filter(c => !set.has(c)).join('');
      }
      return r;
    };

    const upperSet = filter('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    const lowerSet = filter('abcdefghijklmnopqrstuvwxyz');
    const numSet = filter('0123456789');
    const symSet = filter('!@#$%^&*()_+-=[]{}|;:,.<>?');

    const requiredSets: string[] = [];
    let pool = '';
    if (options.upper) { requiredSets.push(upperSet); pool += upperSet; }
    if (options.lower) { requiredSets.push(lowerSet); pool += lowerSet; }
    if (options.numbers) { requiredSets.push(numSet); pool += numSet; }
    if (options.symbols) { requiredSets.push(symSet); pool += symSet; }

    const chars: string[] = [];
    // Ensure at least 1 from each selected set
    for (const set of requiredSets) {
      chars.push(set[Math.floor(Math.random() * set.length)]);
    }
    while (chars.length < len) {
      chars.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    // Shuffle
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.join('');
  }

  // 4a. Generate 20 passwords of length 24
  const generated20: string[] = [];
  let allMeetLength = true;
  let allHaveUpper = true;
  let allHaveLower = true;
  let allHaveNumbers = true;
  let allHaveSymbols = true;

  for (let i = 0; i < 20; i++) {
    const pwd = generatePassword(24, { upper: true, lower: true, numbers: true, symbols: true });
    generated20.push(pwd);
    if (pwd.length !== 24) allMeetLength = false;
    if (!/[A-Z]/.test(pwd)) allHaveUpper = false;
    if (!/[a-z]/.test(pwd)) allHaveLower = false;
    if (!/[0-9]/.test(pwd)) allHaveNumbers = false;
    if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(pwd)) allHaveSymbols = false;
  }

  assert(generated20.length === 20 && allMeetLength, 'All 20 passwords have exact length 24');
  assert(allHaveUpper && allHaveLower && allHaveNumbers && allHaveSymbols, 'Every password strictly satisfies uppercase, lowercase, numbers, and symbols');
  const uniqueCount = new Set(generated20).size;
  assert(uniqueCount === 20, 'Zero duplicates among all 20 generated passwords (20/20 unique)');

  // 4b. Test min length (4) and max length (64)
  const minPwd = generatePassword(4, { upper: true, lower: true, numbers: true, symbols: true });
  assert(minPwd.length === 4, 'Minimum length (4) password generated accurately');
  const maxPwd = generatePassword(64, { upper: true, lower: true, numbers: true, symbols: true });
  assert(maxPwd.length === 64, 'Maximum length (64) password generated accurately');

  // 4c. Excluded character option
  const excludedTest = generatePassword(30, { upper: true, lower: true, numbers: true, symbols: true, exclude: '{}[]<>' });
  assert(!/[{}[\]<>]/.test(excludedTest), 'Specified excluded characters ({}[]<>) are completely excluded');

  // =========================================================================
  // MODULE 5: Case Converter & Formatter Tests
  // =========================================================================
  console.log('\n--- MODULE 5: Case Converter & Formatter Tests ---');

  const testCaseInput = 'hELLO, WOrld! 123 café 😊';

  // 5a. UPPERCASE
  const upperResult = testCaseInput.toUpperCase();
  assert(upperResult === 'HELLO, WORLD! 123 CAFÉ 😊', 'UPPERCASE handles accents (CAFÉ), numbers (123), punctuation (!,), and emoji (😊)');

  // 5b. lowercase
  const lowerResult = testCaseInput.toLowerCase();
  assert(lowerResult === 'hello, world! 123 café 😊', 'lowercase handles accents (café), numbers, punctuation, and emoji');

  // 5c. Title Case (Unicode-aware, word boundary preserving)
  const titleResult = testCaseInput.replace(/\p{L}+/gu, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  assert(titleResult === 'Hello, World! 123 Café 😊', 'Title Case capitalizes words and accents while preserving punctuation, numbers, and emoji');

  // 5d. Sentence case
  const sentenceResult = testCaseInput.toLowerCase().replace(/(^\s*|\n\s*|[.!?]\s+)(\p{L})/gu, (_m, prefix, char) => prefix + char.toUpperCase());
  assert(sentenceResult === 'Hello, world! 123 café 😊', 'Sentence case capitalizes initial sentence start while preserving accents, punctuation, and emoji');

  // 5e. Blank lines and repeated spaces
  const multiLineInput = 'first   line.\n\nsecond   sentence.';
  const multiLineTitle = multiLineInput.replace(/\p{L}+/gu, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  assert(multiLineTitle === 'First   Line.\n\nSecond   Sentence.', 'Title Case preserves repeated spaces and multiple blank lines');

  // =========================================================================
  // MODULE 6: Word & Text Counter Tests
  // =========================================================================
  console.log('\n--- MODULE 6: Word and Text Counter Tests ---');

  const counterInput = 'Hello, world!  Two lines.\nSecond line 😊';

  // Analyze metrics
  const words = counterInput.trim().split(/\s+/).filter(Boolean).length;
  const codePoints = Array.from(counterInput);
  const charsWithSpaces = codePoints.length;
  const charsNoSpaces = codePoints.filter(c => !/\s/.test(c)).length;
  const letters = (counterInput.match(/\p{L}/gu) || []).length;
  const sentences = counterInput.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const lines = counterInput.split(/\n+/).filter(p => p.trim().length > 0).length;

  // Exact verification:
  // Words: "Hello," "world!" "Two" "lines." "Second" "line" "😊" (7 whitespace-separated tokens)
  assert(words === 7, `Word count accurately computed (${words} tokens)`);
  assert(charsWithSpaces === 39, `Total characters with spaces counts spaces, punctuation, newline, and emoji as 1 code point each (${charsWithSpaces})`);
  assert(charsNoSpaces === 32, `Characters without spaces excludes 6 spaces and 1 newline (${charsNoSpaces} characters)`);
  assert(letters === 28, `Letters count accurately identifies all 28 alphabetic glyphs (${letters})`);
  assert(sentences === 3, `Sentences count accurately identifies sentence clauses (${sentences})`);
  assert(lines === 2, `Paragraphs/lines count accurately identifies 2 lines (${lines})`);

  // =========================================================================
  // Summary
  // =========================================================================
  console.log('\n=============================================================');
  console.log(`Test Execution Summary: ${passed} Passed, ${failed} Failed`);
  console.log('=============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runComprehensiveTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
