import { useEffect, useRef, useState } from "react";
import type { ChatMessage, IntakeData } from "../types";
import { t } from "../i18n";

type Props = {
    intake: IntakeData;
    onReset: () => void;
    onOpenGlossary: () => void;
};

function uid() {
    return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export default function Chat({ intake, onReset, onOpenGlossary }: Props) {
    const lang = intake.language;

    const [messages, setMessages] = useState<ChatMessage[]>(() => [
        { id: uid(), role: "assistant", ts: Date.now(), content: t(lang, "chat.greeting") },
    ]);

    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    async function send(text: string) {
        const trimmed = text.trim();
        if (!trimmed || loading) return;

        const userMsg: ChatMessage = { id: uid(), role: "user", content: trimmed, ts: Date.now() };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    intake,
                    messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
                }),
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = (await res.json()) as { reply: string };

            setMessages((prev) => [...prev, { id: uid(), role: "assistant", content: data.reply, ts: Date.now() }]);
        } catch {
            // fallback so demo works without backend
            const fallback =
                lang === "es"
                    ? "Perfecto. Para empezar: ¿tienes una identificación con foto vigente y algún documento con tu dirección (factura, contrato, estado de cuenta)?"
                    : "Great. To start: do you have a valid photo ID and any document showing your address (bill, lease, bank statement)?";

            setMessages((prev) => [...prev, { id: uid(), role: "assistant", content: fallback, ts: Date.now() }]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="w-full max-w-3xl">
            <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b flex items-center justify-between">
                    <div>
                        <div className="font-semibold">{t(lang, "chat.title")}</div>
                        <div className="text-xs text-gray-500">
                            Pathway: <span className="font-medium">{intake.pathway}</span> · State:{" "}
                            <span className="font-medium">{intake.state}</span> ·{" "}
                            <span className="font-medium">{lang.toUpperCase()}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={onOpenGlossary}
                            className="text-sm rounded-xl border border-gray-200 px-3 py-1.5 hover:bg-gray-50 flex items-center gap-1.5"
                            title="Open glossary"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <span className="hidden sm:inline">{t(lang, "chat.glossary")}</span>
                        </button>
                        <button
                            onClick={onReset}
                            className="text-sm rounded-xl border border-gray-200 px-3 py-1.5 hover:bg-gray-50"
                        >
                            {t(lang, "chat.restart")}
                        </button>
                    </div>          
                </div>

                <div className="px-5 py-4 h-[520px] overflow-y-auto space-y-3 bg-gray-50">
                    {messages.map((m) => (
                        <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                            <div
                                className={[
                                    "max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm",
                                    m.role === "user" ? "bg-black text-white" : "bg-white text-gray-900 border",
                                ].join(" ")}
                            >
                                {m.content}
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-white border rounded-2xl px-4 py-2 text-sm text-gray-600 shadow-sm">
                                {t(lang, "chat.thinking")}
                            </div>
                        </div>
                    )}

                    <div ref={bottomRef} />
                </div>

                <div className="px-5 py-4 bg-white border-t">
                    <div className="flex flex-wrap gap-2 mb-3">
                        <button
                            onClick={() => send(t(lang, "chat.quick.credit"))}
                            className="text-sm rounded-full border border-gray-200 px-3 py-1.5 hover:bg-gray-50"
                        >
                            {t(lang, "chat.quick.credit")}
                        </button>
                        <button
                            onClick={() => send(t(lang, "chat.quick.secured"))}
                            className="text-sm rounded-full border border-gray-200 px-3 py-1.5 hover:bg-gray-50"
                        >
                            {t(lang, "chat.quick.secured")}
                        </button>
                        <button
                            onClick={() => send(t(lang, "chat.quick.bank"))}
                            className="text-sm rounded-full border border-gray-200 px-3 py-1.5 hover:bg-gray-50"
                        >
                            {t(lang, "chat.quick.bank")}
                        </button>
                    </div>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            send(input);
                        }}
                        className="flex items-center gap-3"
                    >
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={t(lang, "chat.placeholder")}
                            className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className={[
                                "rounded-xl px-4 py-2 text-sm font-medium text-white",
                                loading ? "bg-gray-300 cursor-not-allowed" : "bg-black hover:bg-gray-800",
                            ].join(" ")}
                        >
                            {t(lang, "chat.send")}
                        </button>
                    </form>

                    <p className="text-xs text-gray-500 mt-2">{t(lang, "chat.footer")}</p>
                </div>
            </div>
        </div>
    );
}