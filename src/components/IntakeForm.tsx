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
        <div className="w-full max-w-2xl">
            <div className="rounded-2xl border bg-white shadow-sm p-6">
                <h1 className="text-2xl font-semibold">{t(lang, "intake.title")}</h1>
                <p className="text-sm text-gray-600 mt-1">{t(lang, "intake.subtitle")}</p>

                <div className="mt-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-900">
                            {t(lang, "intake.pathway.label")}
                        </label>
                        <p className="text-xs text-gray-500 mt-1">{t(lang, "intake.pathway.help")}</p>

                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {pathways.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => update("pathway", opt.value)}
                                    className={[
                                        "text-left rounded-xl border p-4 transition",
                                        form.pathway === opt.value
                                            ? "border-black ring-2 ring-black"
                                            : "border-gray-200 hover:border-gray-300",
                                    ].join(" ")}
                                >
                                    <div className="font-medium">{opt.label}</div>
                                    <div className="text-xs text-gray-600 mt-1">{opt.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-900">{t(lang, "intake.state")}</label>
                            <select
                                value={form.state}
                                onChange={(e) => update("state", e.target.value)}
                                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                            >
                                {usStates.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-900">
                                {t(lang, "intake.preferredLanguage")}
                            </label>
                            <select
                                value={form.language}
                                onChange={(e) => {
                                    const next = e.target.value as Lang;
                                    update("language", next); // store in intake
                                    onLangChange(next); // updates entire page language
                                }}
                                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                            >
                                <option value="en">English</option>
                                <option value="es">Español</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-900">{t(lang, "intake.creditHistory")}</label>
                            <select
                                value={form.creditHistory}
                                onChange={(e) => update("creditHistory", e.target.value as IntakeData["creditHistory"])}
                                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                            >
                                <option value="unknown">{t(lang, "opt.unknown")}</option>
                                <option value="none">{t(lang, "opt.credit.none")}</option>
                                <option value="thin">{t(lang, "opt.credit.thin")}</option>
                                <option value="has">{t(lang, "opt.credit.has")}</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-900">{t(lang, "intake.incomeType")}</label>
                            <select
                                value={form.incomeType}
                                onChange={(e) => update("incomeType", e.target.value as IntakeData["incomeType"])}
                                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-900">{t(lang, "intake.proofOfAddress")}</label>
                            <select
                                value={form.proofOfAddress}
                                onChange={(e) => update("proofOfAddress", e.target.value as IntakeData["proofOfAddress"])}
                                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                            >
                                <option value="not_sure">{t(lang, "opt.addr.not_sure")}</option>
                                <option value="yes">{t(lang, "opt.addr.yes")}</option>
                                <option value="no">{t(lang, "opt.addr.no")}</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-900">{t(lang, "intake.idType")}</label>
                            <select
                                value={form.taxId}
                                onChange={(e) => update("taxId", e.target.value as IntakeData["taxId"])}
                                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                            >
                                <option value="prefer_not_say">{t(lang, "opt.id.prefer")}</option>
                                <option value="ssn">{t(lang, "opt.id.ssn")}</option>
                                <option value="itin">{t(lang, "opt.id.itin")}</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">{t(lang, "intake.idType.help")}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <p className="text-xs text-gray-500 max-w-md">{t(lang, "intake.disclaimer")}</p>
                        <button
                            type="button"
                            disabled={!canSubmit}
                            onClick={() => onSubmit(form)}
                            className={[
                                "rounded-xl px-4 py-2 text-sm font-medium text-white",
                                canSubmit ? "bg-black hover:bg-gray-800" : "bg-gray-300 cursor-not-allowed",
                            ].join(" ")}
                        >
                            {t(lang, "intake.continue")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
