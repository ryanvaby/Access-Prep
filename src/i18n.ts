export type Lang = "en" | "es";

type Dict = Record<string, string>;

const EN: Dict = {
    // App
    "app.kicker": "Hackathon MVP",
    "app.title": "Access Prep",
    "app.subtitle": "A guidance counselor for assembling application-ready documents and next steps.",

    // Intake
    "intake.title": "Access Prep",
    "intake.subtitle": "Answer a few questions so we can generate the right checklist and guidance.",
    "intake.pathway.label": "Which situation best matches you?",
    "intake.pathway.help": "We use this to tailor guidance. We’re not making approval decisions.",
    "intake.state": "State",
    "intake.preferredLanguage": "Preferred language",
    "intake.creditHistory": "Credit history (roughly)",
    "intake.incomeType": "Income type",
    "intake.proofOfAddress": "Proof of address available?",
    "intake.idType": "SSN vs ITIN (optional)",
    "intake.idType.help": "We don’t need the number.",
    "intake.disclaimer": "We help prepare documents and steps. We don’t determine approvals.",
    "intake.continue": "Continue to chat",

    // Pathways
    "path.student": "Student / first credit",
    "path.student.desc": "No or limited credit history",
    "path.newcomer": "Newcomer to the U.S.",
    "path.newcomer.desc": "New to U.S. credit system / docs",
    "path.gig": "Gig / freelance worker",
    "path.gig.desc": "Non-traditional income",
    "path.seasonal": "Seasonal / migrant worker",
    "path.seasonal.desc": "Income or address may change",
    "path.not_sure": "Not sure",
    "path.not_sure.desc": "Help me figure out the best path",

    // Options
    "opt.unknown": "Not sure",
    "opt.credit.none": "No credit history",
    "opt.credit.thin": "Thin credit file",
    "opt.credit.has": "I have credit history",

    "opt.income.student": "Student / family support",
    "opt.income.w2": "W-2 paycheck",
    "opt.income.gig": "Gig / freelance",
    "opt.income.benefits": "Benefits",
    "opt.income.cash": "Mostly cash",
    "opt.income.other": "Other",

    "opt.addr.not_sure": "Not sure",
    "opt.addr.yes": "Yes",
    "opt.addr.no": "No / difficult",

    "opt.id.prefer": "Prefer not to say",
    "opt.id.ssn": "SSN",
    "opt.id.itin": "ITIN",

    // Chat
    "chat.title": "Access Prep Chat",
    "chat.restart": "Restart",
    "chat.placeholder": "Type your message…",
    "chat.send": "Send",
    "chat.thinking": "Thinking…",
    "chat.footer": "We don’t determine approvals. We help prepare documents and next steps.",
    "chat.quick.credit": "Credit card",
    "chat.quick.secured": "Secured card",
    "chat.quick.bank": "Bank account",
    "chat.greeting":
        "Hi, I’m Access Prep. What are you applying for today: a credit card, secured card, or a bank account?",
};

const ES: Dict = {
    // App
    "app.kicker": "MVP del hackathon",
    "app.title": "Access Prep",
    "app.subtitle": "Un orientador para preparar documentos y próximos pasos para tu solicitud.",

    // Intake
    "intake.title": "Access Prep",
    "intake.subtitle": "Responde unas preguntas para generar una lista clara de documentos y guía.",
    "intake.pathway.label": "¿Cuál situación te describe mejor?",
    "intake.pathway.help": "Usamos esto para personalizar la guía. No tomamos decisiones de aprobación.",
    "intake.state": "Estado",
    "intake.preferredLanguage": "Idioma preferido",
    "intake.creditHistory": "Historial de crédito (aprox.)",
    "intake.incomeType": "Tipo de ingresos",
    "intake.proofOfAddress": "¿Tienes comprobante de domicilio?",
    "intake.idType": "SSN o ITIN (opcional)",
    "intake.idType.help": "No necesitamos el número.",
    "intake.disclaimer": "Ayudamos con documentos y próximos pasos. No determinamos aprobaciones.",
    "intake.continue": "Continuar al chat",

    // Pathways
    "path.student": "Estudiante / primer crédito",
    "path.student.desc": "Sin historial o historial limitado",
    "path.newcomer": "Recién llegado(a) a EE. UU.",
    "path.newcomer.desc": "Nuevo(a) en el sistema de crédito/documentos",
    "path.gig": "Trabajo independiente (gig/freelance)",
    "path.gig.desc": "Ingresos no tradicionales",
    "path.seasonal": "Trabajo temporal / migrante",
    "path.seasonal.desc": "Ingresos o domicilio pueden cambiar",
    "path.not_sure": "No estoy seguro(a)",
    "path.not_sure.desc": "Ayúdame a elegir el camino correcto",

    // Options
    "opt.unknown": "No estoy seguro(a)",
    "opt.credit.none": "Sin historial de crédito",
    "opt.credit.thin": "Historial delgado",
    "opt.credit.has": "Tengo historial de crédito",

    "opt.income.student": "Estudiante / apoyo familiar",
    "opt.income.w2": "Sueldo (W-2)",
    "opt.income.gig": "Independiente (gig/freelance)",
    "opt.income.benefits": "Beneficios",
    "opt.income.cash": "Mayormente efectivo",
    "opt.income.other": "Otro",

    "opt.addr.not_sure": "No estoy seguro(a)",
    "opt.addr.yes": "Sí",
    "opt.addr.no": "No / es difícil",

    "opt.id.prefer": "Prefiero no decirlo",
    "opt.id.ssn": "SSN",
    "opt.id.itin": "ITIN",

    // Chat
    "chat.title": "Chat de Access Prep",
    "chat.restart": "Reiniciar",
    "chat.placeholder": "Escribe tu mensaje…",
    "chat.send": "Enviar",
    "chat.thinking": "Pensando…",
    "chat.footer": "No determinamos aprobaciones. Ayudamos con documentos y próximos pasos.",
    "chat.quick.credit": "Tarjeta de crédito",
    "chat.quick.secured": "Tarjeta asegurada",
    "chat.quick.bank": "Cuenta bancaria",
    "chat.greeting":
        "Hola. Soy Access Prep. ¿Qué quieres solicitar hoy: tarjeta de crédito, tarjeta asegurada o cuenta bancaria?",
};

export function t(lang: Lang, key: string): string {
    const dict = lang === "es" ? ES : EN;
    return dict[key] ?? key;
}
