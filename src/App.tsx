/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { ActiveTool, TempInbox } from './types.ts';
import ThreeCanvas from './components/ThreeCanvas.tsx';
import Navbar from './components/Navbar.tsx';
import Footer from './components/Footer.tsx';
import Toast, { ToastMessage } from './components/Toast.tsx';
import SchemaMarkup from './components/SchemaMarkup.tsx';
import SEOManager from './components/SEOManager.tsx';

import HomeView from './views/HomeView.tsx';
import TempMailView from './views/TempMailView.tsx';
import ShortenerView from './views/ShortenerView.tsx';
import PreviewView from './views/PreviewView.tsx';
import QrCodeView from './views/QrCodeView.tsx';
import PasswordGeneratorView from './views/PasswordGeneratorView.tsx';
import WordCounterView from './views/WordCounterView.tsx';
import TextCaseView from './views/TextCaseView.tsx';
import ArchitectureView from './views/ArchitectureView.tsx';
import PrivacyView from './views/PrivacyView.tsx';
import TermsView from './views/TermsView.tsx';
import ContactView from './views/ContactView.tsx';

export default function App() {
  const [activeTool, setActiveTool] = useState<ActiveTool>('home');
  const [previewCode, setPreviewCode] = useState<string>('');
  const [currentInbox, setCurrentInbox] = useState<TempInbox | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Initialize router from URL path
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      if (path.startsWith('/preview/')) {
        const code = path.replace('/preview/', '').trim();
        setPreviewCode(code);
        setActiveTool('preview');
      } else if (path === '/temp-mail') {
        setActiveTool('temp-mail');
      } else if (path === '/url-shortener') {
        setActiveTool('url-shortener');
      } else if (path === '/qr-code') {
        setActiveTool('qr-code');
      } else if (path === '/password-generator') {
        setActiveTool('password-generator');
      } else if (path === '/word-counter') {
        setActiveTool('word-counter');
      } else if (path === '/text-case') {
        setActiveTool('text-case');
      } else if (path === '/architecture') {
        setActiveTool('architecture');
      } else if (path === '/privacy') {
        setActiveTool('privacy');
      } else if (path === '/terms') {
        setActiveTool('terms');
      } else if (path === '/contact') {
        setActiveTool('contact');
      } else {
        setActiveTool('home');
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigateTo = (tool: ActiveTool, code?: string) => {
    setActiveTool(tool);
    let targetPath = '/';
    if (tool === 'preview' && code) {
      setPreviewCode(code);
      targetPath = `/preview/${code}`;
    } else if (tool !== 'home') {
      targetPath = `/${tool}`;
    }

    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({
      id: Math.random().toString(),
      type,
      text
    });
  };

  const handleQuickInbox = async () => {
    try {
      const res = await fetch('/api/email/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok && data.inbox) {
        setCurrentInbox(data.inbox);
        navigateTo('temp-mail');
        showToast('Generated fresh 10-minute temporary inbox', 'success');
      } else {
        showToast(data.error || 'Failed to generate inbox', 'error');
      }
    } catch {
      showToast('Network error creating inbox', 'error');
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Dynamic Head SEO & Meta Tags Manager */}
      <SEOManager activeTool={activeTool} previewCode={previewCode} />

      {/* Dynamic JSON-LD Structured Data Schema Markup */}
      <SchemaMarkup activeTool={activeTool} />

      {/* Interactive 3D Spatial Canvas */}
      <ThreeCanvas activeTool={activeTool} />

      {/* Top Bar Navigation (Strict 3-zone contract) */}
      <Navbar
        activeTool={activeTool}
        onSelectTool={navigateTo}
        onQuickInbox={handleQuickInbox}
      />

      {/* Main View Area */}
      <main className="relative z-10 flex-1">
        {activeTool === 'home' && (
          <HomeView
            onSelectTool={navigateTo}
            onQuickInbox={handleQuickInbox}
            currentInbox={currentInbox}
            onShowToast={showToast}
          />
        )}

        {activeTool === 'temp-mail' && (
          <TempMailView
            currentInbox={currentInbox}
            onInboxCreated={setCurrentInbox}
            onShowToast={showToast}
          />
        )}

        {activeTool === 'url-shortener' && (
          <ShortenerView
            onShowToast={showToast}
            onNavigateToPreview={(code) => navigateTo('preview', code)}
          />
        )}

        {activeTool === 'preview' && (
          <PreviewView
            code={previewCode}
            onShowToast={showToast}
            onBack={() => navigateTo('url-shortener')}
          />
        )}

        {activeTool === 'qr-code' && (
          <QrCodeView onShowToast={showToast} />
        )}

        {activeTool === 'password-generator' && (
          <PasswordGeneratorView onShowToast={showToast} />
        )}

        {activeTool === 'word-counter' && (
          <WordCounterView onShowToast={showToast} />
        )}

        {activeTool === 'text-case' && (
          <TextCaseView onShowToast={showToast} />
        )}

        {activeTool === 'architecture' && (
          <ArchitectureView onShowToast={showToast} />
        )}

        {activeTool === 'privacy' && (
          <PrivacyView />
        )}

        {activeTool === 'terms' && (
          <TermsView />
        )}

        {activeTool === 'contact' && (
          <ContactView onShowToast={showToast} />
        )}
      </main>

      {/* Global Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Universal Footer */}
      <Footer onSelectTool={navigateTo} />
    </div>
  );
}
