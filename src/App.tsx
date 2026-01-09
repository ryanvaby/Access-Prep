import { useState } from "react";
import IntakeForm from "./components/IntakeForm";
import Chat from "./components/Chat";
import type { IntakeData } from "./types";
import type { Lang } from "./i18n";
import { t } from "./i18n";
import GlossaryModal from "./components/GlossaryModal.tsx"
import { glossaryEN, glossaryES } from "./glossary"

// Add CSS animation
const styles = `
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}
`;

export default function App() {
    const [lang, setLang] = useState<Lang>("en");
    const [intake, setIntake] = useState<IntakeData | null>(null);
    const [glossaryOpen, setGlossaryOpen] = useState(false)


    return (
        <>
            <style>{styles}</style>
            <div className="min-h-screen bg-white relative overflow-hidden">
            {/* Translucent background image */}
            <div 
                className="absolute inset-0 opacity-[0.08] pointer-events-none"
                style={{
                    backgroundImage: 'url(https://trainingindustry.com/content/uploads/2023/01/1.16.23-mentoring-.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}
            />
            
            {/* Content overlay */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
                <div className="mb-12 text-center">
                    <div className="text-xs uppercase tracking-widest mb-3 font-medium" style={{ color: '#D22B1E' }}>{t(lang, "app.kicker")}</div>
                    <h1 className="text-5xl font-light mb-4 tracking-tight" style={{ color: '#004878' }}>{t(lang, "app.title")}</h1>
                    <p className="text-xl text-gray-600 font-light max-w-2xl mx-auto">{t(lang, "app.subtitle")}</p>
                </div>

                {!intake ? (
                    <IntakeForm lang={lang} onLangChange={setLang} onSubmit={setIntake} />
                ) : (
                    <Chat
                    intake={intake}
                    onReset={() => setIntake(null)}
                    onOpenGlossary={() => setGlossaryOpen(true)}
                    />

                )}
            </div>
                <GlossaryModal
                open={glossaryOpen}
                onClose={() => setGlossaryOpen(false)}
                items={lang === "es" ? glossaryES : glossaryEN}
                lang={lang}
                />
            </div>
        </>
    );
}

