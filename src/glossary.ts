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
    definition: "How much of your credit limit you’re using.",
    example: "Using $300 of a $1,000 limit is 30% utilization."
  }
]
