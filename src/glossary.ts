export type GlossaryItem = {
  term: string
  definition: string
  example?: string
}

export const glossaryEN: GlossaryItem[] = [
  {
    term: "APR",
    definition: "The yearly cost of borrowing money, shown as a percent.",
    example: "If your card has a 24% APR, carrying a balance can get expensive."
  },
  {
    term: "Credit limit",
    definition: "The maximum amount you can borrow on your credit card at once."
  },
  {
    term: "Utilization",
    definition: "How much of your credit limit you're using.",
    example: "Using $300 of a $1,000 limit is 30% utilization."
  }
]

export const glossaryES: GlossaryItem[] = [
  {
    term: "APR (Tasa de Porcentaje Anual)",
    definition: "El costo anual de pedir dinero prestado, mostrado como un porcentaje.",
    example: "Si tu tarjeta tiene un APR del 24%, mantener un saldo puede ser costoso."
  },
  {
    term: "Límite de crédito",
    definition: "La cantidad máxima que puedes pedir prestada en tu tarjeta de crédito a la vez."
  },
  {
    term: "Utilización",
    definition: "Cuánto de tu límite de crédito estás usando.",
    example: "Usar $300 de un límite de $1,000 es 30% de utilización."
  }
]