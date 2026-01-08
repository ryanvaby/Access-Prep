import ReactMarkdown from "react-markdown";
import { useEffect, useRef, useState } from "react";
import type { ChatMessage, IntakeData, DocumentType, ChatFileAttachment } from "../types";
import { t } from "../i18n";

type Props = {
    intake: IntakeData;
    onReset: () => void;
    onOpenGlossary: () => void;
};

function uid() {
    return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function generateSessionId() {
    return "session_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

export default function Chat({ intake, onReset, onOpenGlossary }: Props) {
    const lang = intake.language;
    const sessionIdRef = useRef(generateSessionId());

    const [messages, setMessages] = useState<ChatMessage[]>(() => [
        { id: uid(), role: "assistant", ts: Date.now(), content: t(lang, "chat.greeting") },
    ]);

    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [documentType, setDocumentType] = useState<DocumentType>("id");
    const [uploadingFile, setUploadingFile] = useState(false);
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type !== "application/pdf") {
                alert(t(lang, "chat.upload.invalid"));
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                alert("File too large. " + t(lang, "chat.upload.maxSize"));
                return;
            }
            setSelectedFile(file);
        }
    }

    async function uploadFile() {
        if (!selectedFile) return;

        setUploadingFile(true);
        try {
            const formData = new FormData();
            formData.append("file", selectedFile);
            formData.append("document_type", documentType);
            formData.append("session_id", sessionIdRef.current);

            const res = await fetch("http://127.0.0.1:5000/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = (await res.json()) as ChatFileAttachment;

            // Create a user message with the attachment
            const userMsg: ChatMessage = {
                id: uid(),
                role: "user",
                content: `[Document uploaded: ${data.fileName}]`,
                ts: Date.now(),
                attachments: [data],
            };

            setMessages((prev) => [...prev, userMsg]);
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";

            // Now send to chat with the validated file info
            setLoading(true);
            const chatRes = await fetch("http://127.0.0.1:5000/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    student_status: intake.pathway,
                    location: intake.state,
                    credit_history: intake.creditHistory,
                    id_type: intake.idType,
                    income_type: intake.incomeType,
                    response_language: intake.language,
                    session_id: sessionIdRef.current,
                    validated_files: [data],
                    messages: [...messages, userMsg].map((m) => ({
                        role: m.role,
                        content: m.content,
                        attachments: m.attachments,
                    })),
                }),
            });

            if (!chatRes.ok) throw new Error(`HTTP ${chatRes.status}`);
            const chatData = (await chatRes.json()) as { reply: string };

            setMessages((prev) => [
                ...prev,
                { id: uid(), role: "assistant", content: chatData.reply, ts: Date.now() },
            ]);
        } catch (err) {
            const fallback =
                lang === "es"
                    ? "Hubo un error al procesar el documento. Por favor intenta de nuevo."
                    : "There was an error processing the document. Please try again.";
            setMessages((prev) => [...prev, { id: uid(), role: "assistant", content: fallback, ts: Date.now() }]);
        } finally {
            setUploadingFile(false);
            setLoading(false);
        }
    }

    async function send(text: string) {
        const trimmed = text.trim();
        if (!trimmed || loading) return;

        const userMsg: ChatMessage = { id: uid(), role: "user", content: trimmed, ts: Date.now() };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("http://127.0.0.1:5000/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    student_status: intake.pathway,
                    location: intake.state,
                    credit_history: intake.creditHistory,
                    id_type: intake.idType,
                    income_type: intake.incomeType,
                    response_language: intake.language,
                    session_id: sessionIdRef.current,
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
                                <ReactMarkdown>{m.content}</ReactMarkdown>
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

                    <div className="mb-3 flex flex-col sm:flex-row gap-2">
                        <select
                            value={documentType}
                            onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                            className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                        >
                            <option value="id">{t(lang, "chat.upload.docType.id")}</option>
                            <option value="income">{t(lang, "chat.upload.docType.income")}</option>
                            <option value="address">{t(lang, "chat.upload.docType.address")}</option>
                        </select>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf"
                            onChange={handleFileSelect}
                            disabled={uploadingFile || loading}
                            className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:bg-gray-100"
                        />

                        <button
                            onClick={uploadFile}
                            disabled={!selectedFile || uploadingFile || loading}
                            className={[
                                "rounded-xl px-4 py-2 text-sm font-medium text-white",
                                selectedFile && !uploadingFile && !loading
                                    ? "bg-black hover:bg-gray-800"
                                    : "bg-gray-300 cursor-not-allowed",
                            ].join(" ")}
                        >
                            {uploadingFile ? t(lang, "chat.upload.uploading") : t(lang, "chat.upload.label")}
                        </button>
                    </div>

                    {selectedFile && (
                        <div className="mb-3 text-xs text-gray-600">
                            {t(lang, "chat.upload.placeholder")}: {selectedFile.name}
                        </div>
                    )}

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