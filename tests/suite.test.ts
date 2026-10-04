/**
 * Integration Test Suite for QuickNest
 * Run with: npx tsx tests/suite.test.ts
 */

import { store } from '../server/store.ts';
import { evaluateUrlSafety } from '../server/malware-checker.ts';

async function runTests() {
  console.log('🧪 Starting QuickNest Core Verification Test Suite...\n');
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

  // --- Test 1: Temporary Email Inbox Creation ---
  console.log('--- 1. Temporary Email Service Tests ---');
  const inbox = store.createInbox('test_agent_user');
  assert(inbox.address.startsWith('test_agent_user@'), 'Inbox created with requested handle');
  assert(inbox.expiresAt > Date.now(), 'Inbox has valid future expiration timestamp (10 min TTL)');
  assert(!inbox.token.includes(' '), 'Inbox has secure alphanumeric token');

  // Test 2: Inbound Email Webhook & Message Delivery
  const message = store.addMessage({
    inboxAddress: inbox.address,
    fromAddress: 'security@service.org',
    fromName: 'Security Service',
    subject: 'Your 6-Digit Verification Code',
    bodyText: 'Code: 981245',
    bodyHtml: '<b>Code: 981245</b>',
    headers: { 'x-received': 'test-suite' }
  });
  assert(message.id.startsWith('msg_'), 'Message generated with unique ID');

  const messages = store.getMessagesForInbox(inbox.address);
  assert(messages.length === 1 && messages[0].subject === 'Your 6-Digit Verification Code', 'Message delivered to inbox successfully');

  // Test 3: Extend Timer
  const previousExpiry = inbox.expiresAt;
  const extended = store.extendInbox(inbox.address, 15);
  assert(extended !== null && extended.expiresAt > previousExpiry, 'Timer successfully extended by 15 minutes');

  // Test 4: Delete Inbox (Zero Retention)
  const deleted = store.deleteInbox(inbox.address);
  assert(deleted === true, 'Inbox deleted successfully');
  assert(store.getInbox(inbox.address) === null, 'Deleted inbox cannot be retrieved');
  assert(store.getMessagesForInbox(inbox.address).length === 0, 'Associated messages permanently wiped (zero retention)');

  // Test 4b: Multi-User Inbox & Message Isolation
  const userA = store.createInbox();
  const userB = store.createInbox();
  assert(userA.address !== userB.address, 'Two random users receive completely distinct email addresses');

  // Same requested custom handle by two different users
  const userC1 = store.createInbox('developer_bob');
  const userC2 = store.createInbox('developer_bob');
  assert(userC1.address !== userC2.address, 'Second user claiming same active handle is assigned isolated unique inbox');

  // Verify User A does not get User B's mail
  store.addMessage({
    inboxAddress: userA.address,
    fromAddress: 'a@service.org',
    fromName: 'Service A',
    subject: 'Confidential Mail for User A',
    bodyText: 'Top secret token for User A',
    bodyHtml: '<p>Top secret</p>',
    headers: {}
  });

  const msgsUserA = store.getMessagesForInbox(userA.address);
  const msgsUserB = store.getMessagesForInbox(userB.address);
  assert(msgsUserA.length === 1 && msgsUserA[0].subject === 'Confidential Mail for User A', 'User A receives their mail');
  assert(msgsUserB.length === 0, 'User B has zero messages (strict inbox isolation - no cross-user leakage)');

  // Clean up test inboxes
  store.deleteInbox(userA.address);
  store.deleteInbox(userB.address);
  store.deleteInbox(userC1.address);
  store.deleteInbox(userC2.address);

  // --- Test 5: URL Shortener & Safety Heuristic Checks ---
  console.log('\n--- 2. URL Shortener & Anti-Abuse Tests ---');
  const safeCheck = evaluateUrlSafety('https://github.com/torvalds/linux');
  assert(safeCheck.isSafe === true && safeCheck.riskScore === 0, 'Legitimate public URL verified safe');

  // Test private IP / SSRF rejection
  const ssrfCheck = evaluateUrlSafety('http://127.0.0.1:8080/admin');
  assert(ssrfCheck.isSafe === false, 'Private loopback IP 127.0.0.1 blocked');

  const ssrfCheck2 = evaluateUrlSafety('http://192.168.1.1/secret');
  assert(ssrfCheck2.isSafe === false, 'RFC1918 private subnet blocked');

  // Test phishing pattern rejection
  const phishingCheck = evaluateUrlSafety('https://login-paypal-security-update.com/signin');
  assert(phishingCheck.isSafe === false, 'Known credential phishing pattern blocked');

  // Test Short Link creation & custom alias
  const shortLink = store.createShortLink({
    originalUrl: 'https://developer.mozilla.org/en-US/',
    customCode: 'mdn_docs',
    domain: 'developer.mozilla.org',
    isMalicious: false,
    maliciousReasons: [],
    allowDirectRedirect: true
  });
  assert(shortLink.code === 'mdn_docs', 'Short link created with custom alias');
  assert(shortLink.clickCount === 0, 'Initial click count is zero');

  // Record click
  const clicked = store.recordLinkClick('mdn_docs');
  assert(clicked !== null && clicked.clickCount === 1, 'Click counter incremented upon redirection');

  // Test Abuse Reporting & Auto-Quarantine
  store.reportLink('mdn_docs', 'phishing', 'Test report 1', '1.1.1.1');
  store.reportLink('mdn_docs', 'phishing', 'Test report 2', '2.2.2.2');
  assert(store.getShortLink('mdn_docs')?.isMalicious === false, 'Link remains active prior to report threshold');

  store.reportLink('mdn_docs', 'phishing', 'Test report 3', '3.3.3.3');
  const quarantined = store.getShortLink('mdn_docs');
  assert(quarantined?.isMalicious === true, 'Link automatically quarantined after reaching 3 abuse reports');

  // --- Test 6: Rate Limiter Token Bucket ---
  console.log('\n--- 3. Rate Limiter Tests ---');
  const testIp = '198.51.100.42';
  let allowedCount = 0;
  for (let i = 0; i < 20; i++) {
    if (store.checkRateLimit(testIp, 5, 10_000)) {
      allowedCount++;
    }
  }
  assert(allowedCount === 5, 'Rate limiter strictly enforced 5 requests limit in window');

  console.log(`\n===========================================`);
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`===========================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
