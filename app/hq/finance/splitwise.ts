// Splitwise-style balance math for the two-partner petty-cash ledger.
// Pure module (no "use client") so both the server finance page and the client
// petty-cash panel can share it. Every entry is split 50/50 between Vansh &
// Russhil; settlements move money between them to square the balance.

import { type Person } from "@/lib/hq";

type PettyEntry = { payer: string | null; amount: number; currency: string };
type SettlementLike = {
  from_person: string;
  to_person: string;
  amount: number;
  currency: string;
};

export type Balance = {
  currency: string;
  // netVansh: what Vansh is owed. > 0 → Russhil owes Vansh; < 0 → Vansh owes Russhil.
  net: number;
  debtor: Person | null; // who owes
  creditor: Person | null; // who is owed
  amount: number; // |net| — the outstanding amount to settle
};

// Sub-rupee residue is treated as settled (money is displayed to 0 decimals).
const EPSILON = 0.005;

export function computeBalances(
  entries: PettyEntry[],
  settlements: SettlementLike[]
): Balance[] {
  const currencies = new Set<string>();
  for (const e of entries) currencies.add(e.currency);
  for (const s of settlements) currencies.add(s.currency);

  const balances: Balance[] = [];
  for (const currency of Array.from(currencies)) {
    const curEntries = entries.filter((e) => e.currency === currency);
    const total = curEntries.reduce((s, e) => s + Number(e.amount || 0), 0);
    const paidByVansh = curEntries
      .filter((e) => e.payer === "Vansh")
      .reduce((s, e) => s + Number(e.amount || 0), 0);

    // Vansh should bear half the total; the rest of what he paid is owed back.
    let net = paidByVansh - total / 2;

    // A settlement from X→Y means X paid Y, reducing what X is owed.
    for (const st of settlements) {
      if (st.currency !== currency) continue;
      if (st.from_person === "Vansh") net -= Number(st.amount || 0);
      if (st.to_person === "Vansh") net += Number(st.amount || 0);
    }

    let debtor: Person | null = null;
    let creditor: Person | null = null;
    if (net > EPSILON) {
      creditor = "Vansh";
      debtor = "Russhil";
    } else if (net < -EPSILON) {
      creditor = "Russhil";
      debtor = "Vansh";
    }

    balances.push({ currency, net, debtor, creditor, amount: Math.abs(net) });
  }

  // INR first (the common case), then alphabetical.
  return balances.sort((a, b) => {
    if (a.currency === "INR") return -1;
    if (b.currency === "INR") return 1;
    return a.currency.localeCompare(b.currency);
  });
}

// The "primary" balance to surface on the collapsed card headline: INR if it
// exists, otherwise the largest outstanding amount.
export function primaryBalance(balances: Balance[]): Balance | null {
  if (balances.length === 0) return null;
  const inr = balances.find((b) => b.currency === "INR");
  if (inr) return inr;
  return balances.reduce((a, b) => (b.amount > a.amount ? b : a));
}
