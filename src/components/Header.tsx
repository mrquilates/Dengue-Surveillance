import React from 'react';

export type PrimaryBIView = 'dashboard' | 'collection';

interface HeaderProps {
  activeView?: PrimaryBIView;
  onSelectView: (view: PrimaryBIView) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onSelectView,
}) => {
  return (
    <header className="no-print w-full border-b border-white/[0.08] bg-[#0b0c0e]/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Wordmark */}
        <button
          onClick={() => onSelectView('dashboard')}
          className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
        >
          Dengue Surveillance
        </button>
      </div>
    </header>
  );
};
