import React, { useState } from 'react';
import { Sidebar, ActiveView } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { OverviewView } from './components/views/OverviewView';
import { HideWorkspace } from './components/HideWorkspace';
import { ExtractWorkspace } from './components/ExtractWorkspace';
import { BitInspectorView } from './components/views/BitInspectorView';
import { SecurityTestingTable } from './components/SecurityTestingTable';
import { HowItWorks } from './components/HowItWorks';
import { MediaSection } from './components/MediaSection';
import { AboutSection } from './components/AboutSection';
import { RegistrationForm } from './components/RegistrationForm';
import { SettingsView } from './components/views/SettingsView';
import { SecurityProvider } from './context/SecurityContext';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [quickStartMessage, setQuickStartMessage] = useState('');

  const [transferredStegoImage, setTransferredStegoImage] = useState<{
    dataUrl: string;
    filename: string;
  } | null>(null);

  const handleTransferToExtract = (dataUrl: string, filename: string) => {
    setTransferredStegoImage({ dataUrl, filename });
    setActiveView('extract');
  };

  const handleClearCache = () => {
    setTransferredStegoImage(null);
    setQuickStartMessage('');
  };

  return (
    <SecurityProvider>
      <div className="flex h-screen overflow-hidden bg-[#EDEEF6] text-slate-800 antialiased selection:bg-violet-600/20 selection:text-violet-900">
        {/* Cybersecurity Light Sidebar */}
        <Sidebar
          activeView={activeView}
          onSelectView={setActiveView}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden bg-[#EDEEF6]">
          {/* Top Header */}
          <TopHeader
            activeView={activeView}
            onSelectView={setActiveView}
            onOpenMobile={() => setMobileSidebarOpen(true)}
          />

          {/* Dynamic View Canvas */}
          <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl pb-10">
              {activeView === 'overview' && (
                <OverviewView
                  onNavigate={(view) => setActiveView(view)}
                  onQuickStart={(msg) => setQuickStartMessage(msg)}
                />
              )}

              {activeView === 'hide' && (
                <HideWorkspace
                  onTransferToExtract={handleTransferToExtract}
                  initialMessage={quickStartMessage}
                />
              )}

              {activeView === 'extract' && (
                <ExtractWorkspace
                  transferredImage={transferredStegoImage}
                  onClearTransferredImage={() => setTransferredStegoImage(null)}
                />
              )}

              {activeView === 'inspector' && <BitInspectorView />}

              {activeView === 'verification' && <SecurityTestingTable />}

              {activeView === 'how-it-works' && <HowItWorks />}

              {activeView === 'media' && <MediaSection />}

              {activeView === 'about' && <AboutSection />}

              {activeView === 'operator' && <RegistrationForm />}

              {activeView === 'settings' && (
                <SettingsView onClearCache={handleClearCache} />
              )}

              {/* Clean Cybersecurity Product Footer */}
              <footer className="mt-12 pt-6 border-t border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_#10B981]"></span>
                  <span className="font-semibold text-slate-800">SecretPixel</span>
                  <span className="text-slate-300">·</span>
                  <span>Zero-Trust In-Memory Cryptographic Enclave</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
                  <span>AES-256-GCM</span>
                  <span className="text-slate-300">·</span>
                  <span>PBKDF2 100k</span>
                  <span className="text-slate-300">·</span>
                  <span>Lossless RGB LSB</span>
                </div>
              </footer>
            </div>
          </main>
        </div>
      </div>
    </SecurityProvider>
  );
}
