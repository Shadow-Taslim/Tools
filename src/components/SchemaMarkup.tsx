import { useEffect } from 'react';
import { ActiveTool } from '../types.ts';

interface SchemaMarkupProps {
  activeTool?: ActiveTool;
}

export default function SchemaMarkup({ activeTool = 'home' }: SchemaMarkupProps) {
  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://quicknest.org';
    const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://quicknest.org';

    // Tool specific feature description
    const toolDescriptions: Record<string, string> = {
      'home': 'High-speed, zero-retention online utilities featuring disposable temporary email, safe URL shortener with link inspection, QR code generator, password builder, and text tools.',
      'temp-mail': 'Disposable 10-minute temporary email service with automated message deletion, live countdown timer, and secure inbound webhook routing.',
      'url-shortener': 'Secure URL shortener with automated malware checking, heuristic phishing protection, community abuse mitigation, and link preview inspection.',
      'qr-code': 'High-density multi-format QR code generator supporting URLs, WiFi credentials, vCards, text, and email payloads with customizable error correction.',
      'password-generator': 'Cryptographic high-entropy password suite generating secure alphanumeric passwords and memorable Diceware passphrases locally via Web Cryptography API.',
      'word-counter': 'Real-time text analytics tool calculating word counts, character density, sentence counts, reading time, and keyword frequency.',
      'text-case': 'Instant multi-case text converter supporting UPPERCASE, lowercase, Title Case, camelCase, PascalCase, snake_case, kebab-case, and CONSTANT_CASE.',
      'architecture': 'Complete production architecture specifications, PostgreSQL DDL schemas, Redis cache-aside topology, and DNS deployment documentation for QuickNest.'
    };

    const activeDescription = toolDescriptions[activeTool] || toolDescriptions['home'];

    // 1. WebApplication Schema
    const webApplicationSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      '@id': `${origin}/#webapp`,
      'name': 'QuickNest',
      'alternateName': 'QuickNest Privacy Utilities',
      'url': currentUrl,
      'applicationCategory': 'UtilitiesApplication',
      'operatingSystem': 'All',
      'browserRequirements': 'Requires JavaScript. Requires HTML5.',
      'softwareVersion': '1.0.0',
      'description': activeDescription,
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD',
        'availability': 'https://schema.org/InStock'
      },
      'featureList': [
        'Disposable 10-Minute Temporary Email with Real-Time Inbound Routing',
        'Malware and Phishing Filtered URL Shortener with Destination Preview',
        'Multi-Format QR Code Generator (URL, WiFi, vCard, Email, Text)',
        'Client-Side Cryptographic Password Generator with Entropy Calculation',
        'Real-Time Word, Character, and Reading Time Statistics Counter',
        'Multi-Format Text Case Converter',
        'Zero-Account, Zero-Data Retention Architecture'
      ],
      'creator': {
        '@type': 'Organization',
        'name': 'QuickNest',
        'url': origin
      }
    };

    // 2. FAQPage Schema
    const faqPageSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': `${origin}/#faq`,
      'mainEntity': [
        {
          '@type': 'Question',
          'name': 'What is QuickNest?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'QuickNest is a suite of free, zero-retention online utilities designed for privacy, speed, and developer efficiency. It provides disposable 10-minute temporary email inboxes, malicious-link-filtered URL shortening, dynamic QR code creation, client-side password generation, and text formatting tools.'
          }
        },
        {
          '@type': 'Question',
          'name': 'How does the disposable temporary email work?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'QuickNest generates an anonymous, disposable email address with a 10-minute lifespan. Incoming emails appear automatically in your browser in real time. Once the countdown expires or you manually wipe the inbox, all messages are permanently deleted with zero server retention.'
          }
        },
        {
          '@type': 'Question',
          'name': 'Can I extend the 10-minute temporary email countdown?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Yes. You can extend the countdown timer by 10 minutes or 30 minutes at any time before expiration to receive delayed verification emails or confirmation links.'
          }
        },
        {
          '@type': 'Question',
          'name': 'How does QuickNest protect against phishing and malicious shortened links?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Every shortened link is automatically scanned against known malware databases, phishing heuristics, credential scam patterns, and private network addresses (SSRF protection). Suspicious links are flagged and routed through a destination preview inspection screen before visitors can proceed.'
          }
        },
        {
          '@type': 'Question',
          'name': 'Are passwords generated on QuickNest secure and private?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Yes. Passwords and passphrases are generated entirely on your device using the browser\'s native Web Cryptography API (crypto.getRandomValues). No generated credentials are ever transmitted over the network or stored on any server.'
          }
        },
        {
          '@type': 'Question',
          'name': 'Is an account or credit card required to use QuickNest?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'No. QuickNest adheres to a strict zero-account and data-minimization architecture. All tools are 100% free to use immediately without signing up, creating accounts, or entering payment information.'
          }
        }
      ]
    };

    // Helper to inject or update script in document.head
    const injectScript = (id: string, schema: object) => {
      let script = document.head.querySelector<HTMLScriptElement>(`#${id}`);
      if (!script) {
        script = document.createElement('script');
        script.id = id;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(schema, null, 2);
    };

    injectScript('quicknest-schema-webapplication', webApplicationSchema);
    injectScript('quicknest-schema-faqpage', faqPageSchema);

    return () => {
      const webAppScript = document.head.querySelector('#quicknest-schema-webapplication');
      const faqScript = document.head.querySelector('#quicknest-schema-faqpage');
      if (webAppScript) webAppScript.remove();
      if (faqScript) faqScript.remove();
    };
  }, [activeTool]);

  return null;
}
