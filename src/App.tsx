import { useState } from "react";
import IntakeForm from "./components/IntakeForm";
import Chat from "./components/Chat";
import type { IntakeData } from "./types";
import type { Lang } from "./i18n";
import { t } from "./i18n";

export default function App() {
    const [lang, setLang] = useState<Lang>("en");
    const [intake, setIntake] = useState<IntakeData | null>(null);

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-6xl mx-auto px-4 py-10">
                <div className="mb-8">
                    <div className="text-sm text-gray-500">{t(lang, "app.kicker")}</div>
                    <div className="text-3xl font-bold">{t(lang, "app.title")}</div>
                    <div className="text-gray-600 mt-1">{t(lang, "app.subtitle")}</div>
                </div>

                {!intake ? (
                    <IntakeForm lang={lang} onLangChange={setLang} onSubmit={setIntake} />
                ) : (
                    <Chat intake={intake} onReset={() => setIntake(null)} />
                )}
            </div>
        </div>
    );
}
