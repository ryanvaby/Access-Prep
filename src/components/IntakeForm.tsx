import { useMemo, useState } from "react";
import type { IntakeData, Pathway } from "../types";
import type { Lang } from "../i18n";
import { t } from "../i18n";

type Props = {
    lang: Lang;
    onLangChange: (lang: Lang) => void;
    onSubmit: (data: IntakeData) => void;
};

const usStates = [
    "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI",
    "MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT",
    "VT","VA","WA","WV","WI","WY",
];

export default function IntakeForm({ lang, onLangChange, onSubmit }: Props) {
    const [form, setForm] = useState<IntakeData>({
        pathway: "student",
        language: lang,
        state: "IN",
        creditHistory: "unknown",
        incomeType: "student",
        proofOfAddress: "not_sure",
        taxId: "prefer_not_say",
        applyingFor: "credit_card",
    });

    const pathways: Array<{ value: Pathway; label: string; desc: string }> = [
        { value: "student", label: t(lang, "path.student"), desc: t(lang, "path.student.desc") },
        { value: "newcomer", label: t(lang, "path.newcomer"), desc: t(lang, "path.newcomer.desc") },
        { value: "gig", label: t(lang, "path.gig"), desc: t(lang, "path.gig.desc") },
        { value: "seasonal", label: t(lang, "path.seasonal"), desc: t(lang, "path.seasonal.desc") },
        { value: "not_sure", label: t(lang, "path.not_sure"), desc: t(lang, "path.not_sure.desc") },
    ];

    const canSubmit = useMemo(() => Boolean(form.pathway && form.state && form.language), [form]);

    function update<K extends keyof IntakeData>(key: K, value: IntakeData[K]) {
        setForm((p) => ({ ...p, [key]: value }));
    }

    return (
        <div className="w-full max-w-5xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg">
                <div className="px-8 py-6 bg-gray-50 border-b border-gray-200 rounded-t-lg">
                    <p className="text-base text-gray-600 font-light text-center">{t(lang, "intake.subtitle")}</p>
                </div>

                <div className="p-10 space-y-10">
                    <div className="flex justify-end">
                        <div className="inline-flex rounded-md border border-gray-300 overflow-hidden">
                            <button
                                onClick={() => { setForm(f => ({ ...f, language: "en" })); onLangChange("en"); }}
                                className={`px-6 py-2 text-sm font-medium transition-all duration-200 ease-in-out ${
                                    form.language === "en" 
                                        ? "text-white transform scale-105" 
                                        : "bg-white text-gray-700 hover:bg-gray-50"
                                }`}
                                style={form.language === "en" ? { background: '#004878' } : {}}
                            >
                                English
                            </button>
                            <button
                                onClick={() => { setForm(f => ({ ...f, language: "es" })); onLangChange("es"); }}
                                className={`px-6 py-2 text-sm font-medium transition-all duration-200 ease-in-out border-l border-gray-300 ${
                                    form.language === "es" 
                                        ? "text-white transform scale-105" 
                                        : "bg-white text-gray-700 hover:bg-gray-50"
                                }`}
                                style={form.language === "es" ? { background: '#004878' } : {}}
                            >
                                Español
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-2xl font-light text-gray-900 mb-3">
                            {t(lang, "intake.pathway.label")}
                        </label>
                        <p className="text-sm text-gray-500 mb-8 font-light">{t(lang, "intake.pathway.help")}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {pathways.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => update("pathway", opt.value)}
                                    className={`text-left rounded-lg border-2 p-6 transition-all duration-300 ease-in-out ${
                                        form.pathway === opt.value
                                            ? "border-gray-200 transform scale-[1.02]"
                                            : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5"
                                    }`}
                                    style={form.pathway === opt.value ? { 
                                        borderColor: '#004878',
                                        backgroundColor: 'rgba(0, 72, 120, 0.03)'
                                    } : {}}
                                >
                                    <div className="font-medium text-lg text-gray-900 mb-2">{opt.label}</div>
                                    <div className="text-sm text-gray-600 font-light leading-relaxed">{opt.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-3">{t(lang, "intake.state")}</label>
                            <select
                                value={form.state}
                                onChange={(e) => update("state", e.target.value)}
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3.5 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent shadow-sm transition-all duration-200 ease-in-out hover:border-gray-400"
                                onFocus={(e) => e.currentTarget.style.borderColor = '#004878'}
                                onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                            >
                                {usStates.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-3">
                                {t(lang, "intake.preferredLanguage")}
                            </label>
                            <select
                                value={form.language}
                                onChange={(e) => {
                                    const next = e.target.value as Lang;
                                    update("language", next);
                                    onLangChange(next);
                                }}
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3.5 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent shadow-sm transition-all duration-200 ease-in-out hover:border-gray-400"
                                onFocus={(e) => e.currentTarget.style.borderColor = '#004878'}
                                onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                            >
                                <option value="en">English</option>
                                <option value="es">Español</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-3">{t(lang, "intake.creditHistory")}</label>
                            <select
                                value={form.creditHistory}
                                onChange={(e) => update("creditHistory", e.target.value as IntakeData["creditHistory"])}
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3.5 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent shadow-sm transition-all duration-200 ease-in-out hover:border-gray-400"
                                onFocus={(e) => e.currentTarget.style.borderColor = '#004878'}
                                onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                            >
                                <option value="unknown">{t(lang, "opt.unknown")}</option>
                                <option value="none">{t(lang, "opt.credit.none")}</option>
                                <option value="thin">{t(lang, "opt.credit.thin")}</option>
                                <option value="has">{t(lang, "opt.credit.has")}</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-3">{t(lang, "intake.incomeType")}</label>
                            <select
                                value={form.incomeType}
                                onChange={(e) => update("incomeType", e.target.value as IntakeData["incomeType"])}
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3.5 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent shadow-sm transition-all duration-200 ease-in-out hover:border-gray-400"
                                onFocus={(e) => e.currentTarget.style.borderColor = '#004878'}
                                onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                            >
                                <option value="student">{t(lang, "opt.income.student")}</option>
                                <option value="w2">{t(lang, "opt.income.w2")}</option>
                                <option value="gig">{t(lang, "opt.income.gig")}</option>
                                <option value="benefits">{t(lang, "opt.income.benefits")}</option>
                                <option value="cash">{t(lang, "opt.income.cash")}</option>
                                <option value="other">{t(lang, "opt.income.other")}</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-3">{t(lang, "intake.proofOfAddress")}</label>
                            <select
                                value={form.proofOfAddress}
                                onChange={(e) => update("proofOfAddress", e.target.value as IntakeData["proofOfAddress"])}
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3.5 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent shadow-sm transition-all duration-200 ease-in-out hover:border-gray-400"
                                onFocus={(e) => e.currentTarget.style.borderColor = '#004878'}
                                onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                            >
                                <option value="not_sure">{t(lang, "opt.addr.not_sure")}</option>
                                <option value="yes">{t(lang, "opt.addr.yes")}</option>
                                <option value="no">{t(lang, "opt.addr.no")}</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-3">{t(lang, "intake.idType")}</label>
                            <select
                                value={form.taxId}
                                onChange={(e) => update("taxId", e.target.value as IntakeData["taxId"])}
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3.5 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent shadow-sm transition-all duration-200 ease-in-out hover:border-gray-400"
                                onFocus={(e) => e.currentTarget.style.borderColor = '#004878'}
                                onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                            >
                                <option value="prefer_not_say">{t(lang, "opt.id.prefer")}</option>
                                <option value="ssn">{t(lang, "opt.id.ssn")}</option>
                                <option value="itin">{t(lang, "opt.id.itin")}</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-2.5 font-light">{t(lang, "intake.idType.help")}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-8 border-t border-gray-200">
                        <p className="text-xs text-gray-500 max-w-md font-light leading-relaxed">{t(lang, "intake.disclaimer")}</p>
                        <button
                            type="button"
                            disabled={!canSubmit}
                            onClick={() => onSubmit(form)}
                            className={`rounded-lg px-10 py-4 text-base font-medium text-white transition-all duration-200 ease-in-out shadow-sm ${
                                canSubmit 
                                    ? "hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0" 
                                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                            }`}
                            style={canSubmit ? { 
                                background: '#D22B1E',
                            } : {}}
                            onMouseEnter={(e) => {
                                if (canSubmit) e.currentTarget.style.background = '#B82318';
                            }}
                            onMouseLeave={(e) => {
                                if (canSubmit) e.currentTarget.style.background = '#D22B1E';
                            }}
                        >
                            {t(lang, "intake.continue")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}