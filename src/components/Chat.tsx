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
    
    const [requiredDocuments, setRequiredDocuments] = useState<string[]>([]);
    const [validatedFiles, setValidatedFiles] = useState<ChatFileAttachment[]>([]);
    const [documentsExplanation, setDocumentsExplanation] = useState("");
    const [documentsInitialized, setDocumentsInitialized] = useState(false);

    async function initializeDocuments() {
        if (documentsInitialized) return;
        
        try {
            const res = await fetch("http://127.0.0.1:5000/api/determine-required-documents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session_id: sessionIdRef.current,
                    pathway: intake.pathway,
                    location: intake.state,
                    credit_history: intake.creditHistory,
                    proof_of_address: intake.proofOfAddress,
                    tax_id: intake.taxId,
                    income_type: intake.incomeType,
                    applying_for: intake.applyingFor,
                    response_language: intake.language,
                }),
            });

            if (res.ok) {
                const data = (await res.json()) as { required_documents: string[]; explanation: string };
                setRequiredDocuments(data.required_documents);
                setDocumentsExplanation(data.explanation);
                setDocumentsInitialized(true);
                
                setMessages((prev) => [
                    ...prev,
                    {
                        id: uid(),
                        role: "assistant",
                        ts: Date.now(),
                        content: `**Required Documents:**\n${data.required_documents.map((d) => `• ${d.replace(/_/g, " ")}`).join("\n")}\n\n${data.explanation}`,
                    },
                ]);
            }
        } catch (err) {
            console.error("Error initializing documents:", err);
        }
    }

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    async function syncValidatedDocuments() {
        try {
            const res = await fetch("http://127.0.0.1:5000/api/session-status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ session_id: sessionIdRef.current }),
            });
            if (res.ok) {
                const data = (await res.json()) as { validated_documents: string[] };
                const synced = (data.validated_documents || []).map((doc_type: string) => ({
                    fileId: "synced",
                    fileName: `${doc_type}.pdf`,
                    documentType: doc_type,
                    isValid: true,
                    uploadedAt: Date.now(),
                    fileSize: 0,
                    validationMessage: "✓ Validated",
                }));
                setValidatedFiles(synced);
            }
        } catch (err) {
            console.error("Error syncing validated documents:", err);
        }
    }

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

            let nextValidated = validatedFiles;
            if (data.isValid) {
                const filtered = validatedFiles.filter((f) => f.documentType !== data.documentType);
                nextValidated = [...filtered, data];
                setValidatedFiles(nextValidated);
            }

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

            setLoading(true);
            const chatRes = await fetch("http://127.0.0.1:5000/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session_id: sessionIdRef.current,
                    pathway: intake.pathway,
                    location: intake.state,
                    credit_history: intake.creditHistory,
                    proof_of_address: intake.proofOfAddress,
                    tax_id: intake.taxId,
                    income_type: intake.incomeType,
                    applying_for: intake.applyingFor,
                    response_language: intake.language,
                    validated_files: nextValidated.map((f) => f.documentType),
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
            
            await syncValidatedDocuments();
            
            const sessionStatusRes = await fetch("http://127.0.0.1:5000/api/session-status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ session_id: sessionIdRef.current }),
            });
            if (sessionStatusRes.ok) {
                const statusData = (await sessionStatusRes.json()) as { pending_documents: string[] };
                if (statusData.pending_documents && statusData.pending_documents.length > 0) {
                    const nextDoc = statusData.pending_documents[0];
                    setDocumentType(nextDoc as DocumentType);
                }
            }
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

    async function send(text: string, overrideApplyingFor?: string) {
        const trimmed = text.trim();
        if (!trimmed || loading) return;

        if (!documentsInitialized) {
            await initializeDocuments();
        }

        await syncValidatedDocuments();

        const userMsg: ChatMessage = { id: uid(), role: "user", content: trimmed, ts: Date.now() };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("http://127.0.0.1:5000/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session_id: sessionIdRef.current,
                    pathway: intake.pathway,
                    location: intake.state,
                    credit_history: intake.creditHistory,
                    proof_of_address: intake.proofOfAddress,
                    tax_id: intake.taxId,
                    income_type: intake.incomeType,
                    applying_for: overrideApplyingFor || intake.applyingFor,
                    response_language: intake.language,
                    validated_files: validatedFiles.map((f) => f.documentType),
                    messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
                }),
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = (await res.json()) as { reply: string };

            setMessages((prev) => [...prev, { id: uid(), role: "assistant", content: data.reply, ts: Date.now() }]);
        } catch {
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
        <div className="w-full max-w-6xl mx-auto">
            <div className="bg-white border border-gray-300 rounded-2xl shadow-md overflow-hidden">
                <div className="px-6 py-4 bg-white border-b border-gray-300 flex items-center justify-between" style={{ background: 'linear-gradient(to right, #004878, #003d63)' }}>
                    <div>
                        <div className="font-semibold text-xl text-white">{t(lang, "chat.title")}</div>
                        <div className="text-sm text-blue-100 mt-0.5">
                            Pathway: <span className="font-medium">{intake.pathway}</span> · State:{" "}
                            <span className="font-medium">{intake.state}</span> ·{" "}
                            <span className="font-medium">{lang.toUpperCase()}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={onOpenGlossary}
                            className="text-sm rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-white font-medium transition-all duration-200 ease-in-out hover:bg-white/20 hover:scale-105 flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            {t(lang, "chat.glossary")}
                        </button>
                        <button
                            onClick={onReset}
                            className="text-sm rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-white font-medium transition-all duration-200 ease-in-out hover:bg-white/20 hover:scale-105"
                        >
                            {t(lang, "chat.restart")}
                        </button>
                    </div>          
                </div>

                <div className="px-6 py-5 h-[520px] overflow-y-auto space-y-4 bg-gray-50">
                    {messages.map((m) => (
                        <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-fadeIn`}>
                            <div
                                className={`max-w-[80%] rounded-2xl px-6 py-4 leading-relaxed transition-all duration-200 ease-in-out ${
                                    m.role === "user" 
                                        ? "text-white text-base font-medium shadow-md" 
                                        : "bg-white text-gray-900 border-2 border-gray-300 text-base shadow-sm hover:shadow-md"
                                }`}
                                style={m.role === "user" ? { background: '#004878' } : {}}
                            >
                                <ReactMarkdown>{m.content}</ReactMarkdown>
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex justify-start animate-fadeIn">
                            <div className="bg-white border-2 border-gray-300 rounded-2xl px-6 py-4 text-base text-gray-600 shadow-sm flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#004878' }} />
                                <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#004878', animationDelay: '0.15s' }} />
                                <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#004878', animationDelay: '0.3s' }} />
                                <span className="ml-2">{t(lang, "chat.thinking")}</span>
                            </div>
                        </div>
                    )}

                    <div ref={bottomRef} />
                </div>

                <div className="px-6 py-5 bg-white border-t border-gray-300">
                    {validatedFiles.length > 0 && (
                        <div className="mb-4 p-4 bg-green-50 border-2 border-green-300 rounded-xl">
                            <div className="text-sm font-semibold text-green-800 mb-1">✓ Validated Documents:</div>
                            <div className="text-sm text-green-700 font-medium">
                                {validatedFiles.map(f => f.documentType.replace(/_/g, ' ')).join(', ')}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-3 mb-4">
                        <button
                            onClick={() => send(t(lang, "chat.quick.credit"), "credit_card")}
                            className="text-sm rounded-lg border-2 font-medium px-5 py-2.5 transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
                            style={{ 
                                background: 'rgba(0, 72, 120, 0.05)',
                                borderColor: '#004878',
                                color: '#004878'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 72, 120, 0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 72, 120, 0.05)'}
                        >
                            {t(lang, "chat.quick.credit")}
                        </button>
                        <button
                            onClick={() => send(t(lang, "chat.quick.secured"), "secured_card")}
                            className="text-sm rounded-lg border-2 font-medium px-5 py-2.5 transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
                            style={{ 
                                background: 'rgba(0, 72, 120, 0.05)',
                                borderColor: '#004878',
                                color: '#004878'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 72, 120, 0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 72, 120, 0.05)'}
                        >
                            {t(lang, "chat.quick.secured")}
                        </button>
                        <button
                            onClick={() => send(t(lang, "chat.quick.bank"), "bank_account")}
                            className="text-sm rounded-lg border-2 font-medium px-5 py-2.5 transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
                            style={{ 
                                background: 'rgba(0, 72, 120, 0.05)',
                                borderColor: '#004878',
                                color: '#004878'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 72, 120, 0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 72, 120, 0.05)'}
                        >
                            {t(lang, "chat.quick.bank")}
                        </button>
                    </div>

                    <div className="mb-4 flex flex-col sm:flex-row gap-3">
                        <select
                            value={documentType}
                            onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                            className="flex-1 rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-base font-medium text-gray-900 focus:outline-none transition-all duration-200 ease-in-out hover:border-gray-400"
                            onFocus={(e) => e.currentTarget.style.borderColor = '#004878'}
                            onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                        >
                            <option value="id">{t(lang, "chat.upload.docType.id")}</option>
                            <option value="income">{t(lang, "chat.upload.docType.income")}</option>
                            <option value="address">{t(lang, "chat.upload.docType.address")}</option>
                            <option value="enrollment">Proof of Enrollment</option>
                            <option value="financial_support">Financial Support</option>
                        </select>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf"
                            onChange={handleFileSelect}
                            disabled={uploadingFile || loading}
                            className="flex-1 rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none disabled:bg-gray-100 transition-all duration-200 ease-in-out hover:border-gray-400"
                            onFocus={(e) => e.currentTarget.style.borderColor = '#004878'}
                            onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                        />

                        <button
                            onClick={uploadFile}
                            disabled={!selectedFile || uploadingFile || loading}
                            className={`rounded-lg px-6 py-3 text-sm font-semibold text-white transition-all duration-200 ease-in-out ${
                                !selectedFile || uploadingFile || loading
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : "hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
                            }`}
                            style={selectedFile && !uploadingFile && !loading ? { background: '#D22B1E' } : {}}
                            onMouseEnter={(e) => {
                                if (selectedFile && !uploadingFile && !loading) {
                                    e.currentTarget.style.background = '#B82318';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (selectedFile && !uploadingFile && !loading) {
                                    e.currentTarget.style.background = '#D22B1E';
                                }
                            }}
                        >
                            {uploadingFile ? t(lang, "chat.upload.uploading") : t(lang, "chat.upload.label")}
                        </button>
                    </div>

                    {selectedFile && (
                        <div className="mb-4 text-sm text-gray-600 font-medium">
                            Selected: {selectedFile.name}
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && !loading) {
                                    send(input);
                                }
                            }}
                            placeholder={t(lang, "chat.placeholder")}
                            className="flex-1 rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-base focus:outline-none transition-all duration-200 ease-in-out hover:border-gray-400"
                            onFocus={(e) => e.currentTarget.style.borderColor = '#004878'}
                            onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                        />
                        <button
                            onClick={() => send(input)}
                            disabled={loading}
                            className={`rounded-lg px-8 py-3 text-base font-semibold text-white transition-all duration-200 ease-in-out ${
                                loading 
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                                    : "hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
                            }`}
                            style={!loading ? { background: '#D22B1E' } : {}}
                            onMouseEnter={(e) => {
                                if (!loading) e.currentTarget.style.background = '#B82318';
                            }}
                            onMouseLeave={(e) => {
                                if (!loading) e.currentTarget.style.background = '#D22B1E';
                            }}
                        >
                            {t(lang, "chat.send")}
                        </button>
                    </div>

                    <p className="text-xs text-gray-500 mt-4 text-center">{t(lang, "chat.footer")}</p>
                </div>
            </div>
        </div>
    );
}