import React, { useState, useMemo } from 'react';
import { ActiveTool, KnowledgeArticle, TopicalOpportunity } from '../types.ts';
import { 
  KNOWLEDGE_ARTICLES, 
  TOPICAL_OPPORTUNITIES, 
  BRAND_AUTHORITY_MATERIALS, 
  AI_TESTING_FRAMEWORK 
} from '../data/knowledgeHubData.ts';
import { 
  BookOpen, Search, ArrowLeft, ArrowRight, Clock, Calendar, 
  User, CheckCircle2, Copy, Check, ChevronDown, ChevronUp, 
  Sparkles, ExternalLink, ShieldCheck, Terminal, Compass, 
  Layers, Lightbulb, Share2, FileCode, Target, HelpCircle,
  BarChart3, Bot, Rocket
} from 'lucide-react';

interface KnowledgeHubViewProps {
  onSelectTool: (tool: ActiveTool) => void;
  onShowToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  initialArticleSlug?: string;
}

export default function KnowledgeHubView({ onSelectTool, onShowToast, initialArticleSlug }: KnowledgeHubViewProps) {
  const [activeTab, setActiveTab] = useState<'guides' | 'catalog' | 'brand' | 'testing'>('guides');
  const [selectedArticleSlug, setSelectedArticleSlug] = useState<string | null>(initialArticleSlug || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Selected article
  const currentArticle = useMemo(() => {
    if (!selectedArticleSlug) return null;
    return KNOWLEDGE_ARTICLES.find(a => a.slug === selectedArticleSlug) || null;
  }, [selectedArticleSlug]);

  // Categories
  const categories = ['All', 'Search & AI Crawlers', 'Cryptography & Security', 'Privacy Engineering'];

  // Filtered articles
  const filteredArticles = useMemo(() => {
    return KNOWLEDGE_ARTICLES.filter(article => {
      const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory;
      const matchesSearch = 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.targetKeyword.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Filtered topical opportunities
  const filteredOpportunities = useMemo(() => {
    return TOPICAL_OPPORTUNITIES.filter(opp => {
      const query = searchQuery.toLowerCase();
      return (
        opp.title.toLowerCase().includes(query) ||
        opp.mainKeyword.toLowerCase().includes(query) ||
        opp.targetAudience.toLowerCase().includes(query) ||
        opp.toolName.toLowerCase().includes(query)
      );
    });
  }, [searchQuery]);

  const copyToClipboard = (text: string, id: string, label = 'Copied to clipboard') => {
    navigator.clipboard.writeText(text);
    setCopiedCodeIndex(id);
    onShowToast(label, 'success');
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  return (
    <div className="space-y-8 py-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>QuickNest Knowledge Hub &amp; Topical Authority</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            {currentArticle ? currentArticle.title : 'Technical Guides & Topical Authority'}
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            {currentArticle 
              ? currentArticle.subtitle 
              : 'In-depth engineering guides, RFC standards documentation, and machine-readable context for search engines and generative AI agents.'}
          </p>
        </div>

        {/* Back to Hub button if reading article */}
        {currentArticle ? (
          <button
            onClick={() => { setSelectedArticleSlug(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors w-fit shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Guides</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectTool('ai-observability')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/60 text-xs font-mono text-cyan-300 hover:bg-cyan-900/60 transition-colors cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>AI Observability (74/100)</span>
            </button>
            <a
              href="/llms.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white transition-colors"
            >
              <FileCode className="w-3.5 h-3.5 text-cyan-400" />
              <span>/llms.txt</span>
            </a>
          </div>
        )}
      </div>

      {/* ARTICLE READER VIEW */}
      {currentArticle ? (
        <article className="space-y-10">
          {/* Metadata bar */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-4 text-slate-400">
              <span className="px-2.5 py-1 rounded-md bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 font-mono font-medium">
                {currentArticle.category}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{currentArticle.readTimeMinutes} min read</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Published {currentArticle.publishDate}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>{currentArticle.author.name}</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(window.location.href, 'share-url', 'Article link copied')}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
              <button
                onClick={() => {
                  onSelectTool(currentArticle.relatedToolId);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold transition-colors cursor-pointer text-xs"
              >
                <span>Launch {currentArticle.relatedToolName}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Key Takeaways Box (GEO Direct Answer Extraction) */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-950/30 to-slate-900 border border-cyan-500/30 space-y-4">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm uppercase tracking-wider font-mono">
              <Lightbulb className="w-4 h-4 text-cyan-400" />
              <span>Executive Summary &amp; Key Takeaways</span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              {currentArticle.summary}
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
              {currentArticle.keyTakeaways.map((takeaway, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{takeaway}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Article Body Sections */}
          <div className="space-y-8">
            {currentArticle.sections.map((section, idx) => (
              <div key={idx} className="space-y-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 p-6 sm:p-8">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {section.heading}
                </h2>
                {section.subheading && (
                  <h3 className="text-sm font-semibold text-cyan-300 font-mono">
                    {section.subheading}
                  </h3>
                )}
                <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line space-y-2">
                  {section.content}
                </div>

                {section.codeSnippet && (
                  <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
                    <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between text-xs font-mono text-slate-400">
                      <span>{section.codeSnippet.caption || section.codeSnippet.language}</span>
                      <button
                        onClick={() => copyToClipboard(section.codeSnippet!.code, `code-${idx}`)}
                        className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 cursor-pointer"
                      >
                        {copiedCodeIndex === `code-${idx}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCodeIndex === `code-${idx}` ? 'Copied' : 'Copy Code'}</span>
                      </button>
                    </div>
                    <pre className="p-4 text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed">
                      <code>{section.codeSnippet.code}</code>
                    </pre>
                  </div>
                )}

                {section.callout && (
                  <div className="mt-4 p-4 rounded-xl bg-cyan-950/40 border border-cyan-800/60 text-xs text-cyan-200 flex items-start gap-2.5">
                    <Lightbulb className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{section.callout.text}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Structured FAQs Accordion (Schema.org FAQPage eligible) */}
          <div className="space-y-4 rounded-2xl bg-slate-900/60 border border-slate-800 p-6 sm:p-8">
            <h2 className="flex items-center gap-2 text-white font-bold text-lg mb-2">
              <HelpCircle className="w-5 h-5 text-cyan-400" />
              <span>Frequently Asked Questions</span>
            </h2>
            <div className="space-y-3">
              {currentArticle.faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden transition-colors"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full p-4 flex items-center justify-between text-left text-sm font-semibold text-slate-200 hover:text-cyan-300 cursor-pointer"
                    >
                      <span>{faq.question}</span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-cyan-400" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                    </button>
                    {isOpen && (
                      <div className="p-4 pt-0 text-xs text-slate-400 border-t border-slate-850 leading-relaxed">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-white">Experience {currentArticle.relatedToolName}</p>
              <p className="text-xs text-slate-400">Run the live tool directly in your browser with zero sign-up.</p>
            </div>
            <button
              onClick={() => {
                onSelectTool(currentArticle.relatedToolId);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer flex items-center gap-2"
            >
              <span>Launch {currentArticle.relatedToolName}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </article>
      ) : (
        /* KNOWLEDGE HUB DIRECTORY & TABS */
        <div className="space-y-8">
          {/* View Mode Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-4">
            <button
              onClick={() => setActiveTab('guides')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'guides' 
                  ? 'bg-cyan-500 text-slate-950' 
                  : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Technical Guides (5 Published)</span>
            </button>

            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'catalog' 
                  ? 'bg-cyan-500 text-slate-950' 
                  : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Topical Catalog (30 Mapped Topics)</span>
            </button>

            <button
              onClick={() => setActiveTab('brand')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'brand' 
                  ? 'bg-cyan-500 text-slate-950' 
                  : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>Brand Authority Materials</span>
            </button>

            <button
              onClick={() => setActiveTab('testing')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'testing' 
                  ? 'bg-cyan-500 text-slate-950' 
                  : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>AI Visibility Testing Matrix</span>
            </button>
          </div>

          {/* Search & Category Filter Controls */}
          {(activeTab === 'guides' || activeTab === 'catalog') && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={activeTab === 'guides' ? 'Search technical guides...' : 'Search 30 topical opportunities, keywords, intent...'}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              {activeTab === 'guides' && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 1: PUBLISHED TECHNICAL GUIDES */}
          {activeTab === 'guides' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredArticles.map((article) => (
                <div
                  key={article.slug}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900/90 hover:border-slate-700 p-6 flex flex-col justify-between transition-all duration-200 shadow-md group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/80">
                        {article.category}
                      </span>
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{article.readTimeMinutes} min</span>
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {article.title}
                    </h2>

                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                      {article.summary}
                    </p>

                    <div className="pt-2">
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-850">
                        Target Keyword: {article.targetKeyword}
                      </span>
                    </div>
                  </div>

                  <div className="pt-6 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">
                      Tool: {article.relatedToolName}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedArticleSlug(article.slug);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-4 py-2 bg-slate-950 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 text-xs font-semibold rounded-xl border border-slate-800 group-hover:border-cyan-400 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Read Guide</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: TOPICAL OPPORTUNITY CATALOG (30 TOPICS) */}
          {activeTab === 'catalog' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4 text-xs">
                <div>
                  <h2 className="font-bold text-white block text-sm">Topical Authority Architecture</h2>
                  <span className="text-slate-400">
                    Showing {filteredOpportunities.length} of 30 mapped high-intent article blueprints across security, SEO, and developer tools.
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono text-xs font-bold">
                  30 Mapped Topics
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {filteredOpportunities.map((opp) => (
                  <div
                    key={opp.id}
                    className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-colors space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-slate-950 border border-slate-800 text-cyan-400 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                          #{opp.id}
                        </span>
                        <h3 className="text-sm font-bold text-white">
                          {opp.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-violet-950/80 text-violet-300 border border-violet-800/80">
                          {opp.intent}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          Audience: {opp.targetAudience}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-850 space-y-1">
                        <span className="text-[10px] uppercase font-mono text-slate-500 block">Primary Keyword</span>
                        <span className="font-mono text-cyan-300">{opp.mainKeyword}</span>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {opp.relatedKeywords.map((kw, i) => (
                            <span key={i} className="text-[9px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-850 space-y-1">
                        <span className="text-[10px] uppercase font-mono text-slate-500 block">Questions Answered</span>
                        <ul className="space-y-0.5 text-[11px] text-slate-300">
                          {opp.questionsAnswered.map((q, i) => (
                            <li key={i} className="truncate">• {q}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-850 space-y-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-mono text-slate-500 block">Relevant Tool</span>
                          <span className="font-semibold text-slate-200">{opp.toolName}</span>
                        </div>
                        <button
                          onClick={() => {
                            onSelectTool(opp.relevantTool);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="w-full mt-2 py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 text-[11px] font-semibold border border-slate-800 hover:border-cyan-400 transition-colors cursor-pointer flex items-center justify-center gap-1"
                        >
                          <span>Open Tool Workspace</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: BRAND AUTHORITY MATERIALS */}
          {activeTab === 'brand' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-cyan-400" />
                    <span>Product Hunt Launch Listing Blueprint</span>
                  </h2>
                  <button
                    onClick={() => copyToClipboard(BRAND_AUTHORITY_MATERIALS.productHunt.makerComment, 'ph-copy', 'Product Hunt comment copied')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-400 hover:text-white cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Comment</span>
                  </button>
                </div>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <p><strong className="text-white">Product Title:</strong> {BRAND_AUTHORITY_MATERIALS.productHunt.title}</p>
                  <p><strong className="text-white">Tagline:</strong> {BRAND_AUTHORITY_MATERIALS.productHunt.tagline}</p>
                </div>
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-850 text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {BRAND_AUTHORITY_MATERIALS.productHunt.makerComment}
                </pre>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-violet-400" />
                    <span>Hacker News Show HN Submission Blueprint</span>
                  </h2>
                  <button
                    onClick={() => copyToClipboard(BRAND_AUTHORITY_MATERIALS.hackerNews.text, 'hn-copy', 'Hacker News text copied')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-violet-400 hover:text-white cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Post</span>
                  </button>
                </div>
                <p className="text-xs text-slate-300"><strong className="text-white">Title:</strong> {BRAND_AUTHORITY_MATERIALS.hackerNews.title}</p>
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-850 text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {BRAND_AUTHORITY_MATERIALS.hackerNews.text}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: AI VISIBILITY TESTING MATRIX */}
          {activeTab === 'testing' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 text-white font-bold text-lg">
                  <BarChart3 className="w-5 h-5 text-cyan-400" />
                  <span>Repeatable AI Search Visibility Testing Framework</span>
                </div>
                <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                  To measure Generative Engine Optimization (GEO) progress empirically, test these six standardized queries monthly across ChatGPT Search, Google Gemini, and Perplexity. Record whether QuickNest is mentioned, whether the canonical URL is cited, and the accuracy of the synthesized response.
                </p>

                <div className="grid grid-cols-1 gap-3 pt-2">
                  {AI_TESTING_FRAMEWORK.benchmarkPrompts.map((bench) => (
                    <div
                      key={bench.id}
                      className="p-4 rounded-xl bg-slate-950/80 border border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-cyan-950 text-cyan-400 font-mono text-[10px] font-bold flex items-center justify-center">
                            #{bench.id}
                          </span>
                          <span className="font-semibold text-white">"{bench.query}"</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          <strong>Criteria:</strong> {bench.successCriteria}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-400 border border-slate-800">
                          {bench.intent}
                        </span>
                        <button
                          onClick={() => copyToClipboard(bench.query, `bench-${bench.id}`, 'Query copied for testing')}
                          className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-800 transition-colors cursor-pointer text-[11px]"
                        >
                          Copy Query
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly Tracking Matrix */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <h3 className="text-base font-bold text-white">Monthly Tracking Benchmarks</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                      <tr>
                        <th className="py-2.5 pr-4 font-semibold">Evaluation Metric</th>
                        <th className="py-2.5 px-4 font-semibold">Target Standard</th>
                        <th className="py-2.5 px-4 font-semibold">Engine / Provider</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-slate-300">
                      {AI_TESTING_FRAMEWORK.monthlyTrackingMetrics.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-950/40">
                          <td className="py-2.5 pr-4 font-semibold text-white">{row.metric}</td>
                          <td className="py-2.5 px-4 font-mono text-cyan-300">{row.target}</td>
                          <td className="py-2.5 px-4 text-slate-400">{row.engine}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
