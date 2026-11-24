import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Code2,
  Copy,
  Download,
  Eye,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  EpidemiologicalMetrics,
  SurveillanceRecord,
} from '../types/surveillance';
import {
  buildGoogleSitesEmbedHTML,
  readPersistedBarangayPopulations,
  triggerHTMLDownload,
} from '../utils/googleSitesEmbedGenerator';

interface GoogleSitesEmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: SurveillanceRecord[];
  metrics: EpidemiologicalMetrics;
  onDownloaded?: (filename: string) => void;
}

export const GoogleSitesEmbedModal: React.FC<GoogleSitesEmbedModalProps> = ({
  isOpen,
  onClose,
  records,
  metrics,
  onDownloaded,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const bundle = useMemo(() => {
    if (!isOpen) return null;
    const overrides = readPersistedBarangayPopulations();
    return buildGoogleSitesEmbedHTML(records, metrics, overrides);
  }, [isOpen, records, metrics]);

  if (!isOpen || !bundle) return null;

  const sizeKb = (bundle.byteSize / 1024).toFixed(1);

  const handleCopy = async () => {
    let success = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(bundle.html);
        success = true;
      }
    } catch {
      success = false;
    }

    if (!success) {
      const temp = document.createElement('textarea');
      temp.value = bundle.html;
      temp.setAttribute('readonly', 'true');
      temp.className = 'fixed -left-[9999px] top-0 opacity-0';
      document.body.appendChild(temp);
      temp.select();
      try {
        success = document.execCommand('copy');
      } catch {
        success = false;
      }
      document.body.removeChild(temp);
    }

    if (success) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } else if (textareaRef.current) {
      setActiveTab('code');
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  };

  const handleDownload = () => {
    const filename = triggerHTMLDownload(bundle.html);
    onDownloaded?.(filename);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="google-sites-modal-title"
    >
      <div className="w-full max-w-5xl rounded-2xl bg-[#111318] border border-white/[0.12] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-blue-400 shrink-0" />
              <h2
                id="google-sites-modal-title"
                className="text-base sm:text-lg font-bold text-white tracking-tight"
              >
                Google Sites Full-Embed HTML Script
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono tabular-nums">
              Self-contained read-only BI dashboard · {bundle.totalCases.toLocaleString()} cases ·{' '}
              {bundle.coverageRange} · {sizeKb} KB
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Google Sites embed modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action & Tab Strip */}
        <div className="px-5 py-3 border-b border-white/[0.08] bg-[#0b0c0e]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="inline-flex rounded-lg bg-[#171a21] p-0.5 border border-white/[0.08] text-xs font-medium self-start">
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live Preview</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'code'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>HTML Embed Script</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownload}
              className="px-3.5 py-2 rounded-lg bg-[#171a21] hover:bg-slate-800 border border-white/[0.1] text-xs font-semibold text-slate-100 flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download .html</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                copied
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied HTML Script</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy HTML Script</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Main Inspection Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Verification & Risk Distribution Strip */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="px-3.5 py-2.5 rounded-lg bg-[#171a21] border border-white/[0.08] flex items-center gap-2.5 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                RA 10173 Safe: Aggregate counts &amp; charts only (zero patient PII, zero external JS bundles)
              </span>
            </div>
            <div className="px-3.5 py-2.5 rounded-lg bg-[#171a21] border border-white/[0.08] font-mono tabular-nums text-slate-300 flex items-center justify-between gap-2">
              <span className="text-slate-400">Risk Tiers ({bundle.barangayCount} Brgys):</span>
              <span>
                <span className="text-red-400">{bundle.riskCounts.Critical} Crit</span> ·{' '}
                <span className="text-amber-400">{bundle.riskCounts.High} High</span> ·{' '}
                <span className="text-blue-400">{bundle.riskCounts.Moderate} Mod</span> ·{' '}
                <span className="text-slate-300">{bundle.riskCounts.Low} Low</span> ·{' '}
                <span className="text-slate-500">{bundle.riskCounts['No Case']} Clear</span>
              </span>
            </div>
          </div>

          {activeTab === 'preview' ? (
            <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-[#0b0c0e]">
              <iframe
                srcDoc={bundle.html}
                title="Google Sites Self-Contained Dengue BI Dashboard Preview"
                sandbox="allow-scripts"
                className="w-full h-[500px] border-0 bg-[#0b0c0e]"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Standalone HTML5 document (ready for Google Sites Embed code)</span>
                <span>{bundle.html.length.toLocaleString()} chars · {sizeKb} KB</span>
              </div>
              <textarea
                ref={textareaRef}
                readOnly
                value={bundle.html}
                aria-label="Generated Google Sites HTML embed script"
                onClick={e => e.currentTarget.select()}
                className="w-full h-[460px] rounded-xl bg-[#0b0c0e] border border-white/[0.1] p-4 font-mono text-[11px] leading-relaxed text-slate-200 focus:outline-none focus:border-blue-500/60 resize-none"
              />
            </div>
          )}

          {/* 4-Step Google Sites Instructions */}
          <div className="px-4 py-3 rounded-xl bg-[#0b0c0e] border border-white/[0.08] text-xs text-slate-300">
            <div className="font-semibold text-white mb-1.5">
              How to embed in Google Sites:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-slate-400 font-mono text-[11px]">
              <div>1. Click Copy HTML Script</div>
              <div>2. Open Google Sites → Insert → Embed</div>
              <div>3. Choose Embed code &amp; Paste</div>
              <div>4. Click Next → Insert &amp; drag full width</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
