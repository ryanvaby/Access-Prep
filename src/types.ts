import type { Lang } from "./i18n";

export type Pathway = "student" | "newcomer" | "gig" | "seasonal" | "not_sure";
export type CreditHistory = "none" | "thin" | "has" | "unknown";
export type IncomeType = "student" | "w2" | "gig" | "cash" | "benefits" | "other";
export type ProofOfAddress = "yes" | "no" | "not_sure";
export type IdType = "ssn" | "itin" | "prefer_not_say";

export interface IntakeData {
    pathway: Pathway;
    language: Lang;
    state: string;
    creditHistory: CreditHistory;
    incomeType: IncomeType;
    proofOfAddress: ProofOfAddress;
    idType: IdType;
}

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
    id: string;
    role: ChatRole;
    content: string;
    ts: number;
}
