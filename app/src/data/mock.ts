export type LoanStatus = "Loan Funded" | "Clear to Close" | "Docs Out" | "Submitted to Underwriting" | "Disclosed" | "Loan Setup" | "Docs Signed" | "Closed";

export interface Loan {
  id: string;
  borrower: string;
  status: LoanStatus;
  fundedDate: string;
  calcCompleted: string | null;
  payrollProcessed: string | null;
  primaryLO: string;
  lo2: string | null;
  lo3: string | null;
  state: string;
  hasNotes: boolean;
  filesCount: number;
  property: string;
  baseLoanAmount: number;
  totalLoanAmount: number;
  loanExpDate: string;
  lockPricing: number;
  type: string;
  revenue: {
    originationA1: number;
    originationA2: number;
    originationA3: number;
    pointsA01: number;
    ysp: number;
  };
  deductions: {
    lockCost: number;
    lenderCredit: number;
    flatFee: number;
  };
}

export interface UserRecord {
  id: number;
  name: string;
  email: string;
  role: "Admin" | "Loan Officer" | "Processor" | "Accounting";
  status: "Registered" | "Pending" | "Deactivated";
  dateAdded: string;
  lastActive: string;
  online?: boolean;
}

export interface Note {
  id: number;
  author: string;
  initials: string;
  time: string;
  body: string;
}

export interface FileItem {
  id: number;
  name: string;
  type: string;
  size: string;
  folder: string;
}

export const STAGE_COLORS: Record<string, string> = {
  "Loan Setup": "#f0a24a",
  "Disclosed": "#e8873a",
  "Submitted to Underwriting": "#dd6b35",
  "Docs Out": "#d14f35",
  "Clear to Close": "#b83341",
  "Docs Signed": "#8f1d3a",
};

export const loans: Loan[] = [
  { id: "16314513", borrower: "Fiona Mellough", status: "Loan Funded", fundedDate: "2026-07-15", calcCompleted: null, payrollProcessed: null, primaryLO: "Bradley Yzermans", lo2: null, lo3: null, state: "CA", hasNotes: false, filesCount: 3, property: "4424 Cove Street, Hemet, RIVERSIDE, CA", baseLoanAmount: 370000, totalLoanAmount: 370000, loanExpDate: "2026-07-27", lockPricing: 99.875, type: "NON-DEL CORRESPONDENT", revenue: { originationA1: 4625, originationA2: 0, originationA3: 0, pointsA01: 1850, ysp: 2775 }, deductions: { lockCost: 925, lenderCredit: 500, flatFee: 1095 } },
  { id: "15589611", borrower: "Clarissa Ellwein", status: "Loan Funded", fundedDate: "2026-07-15", calcCompleted: "2026-07-15", payrollProcessed: null, primaryLO: "Steven Vallejo", lo2: "Bradley Yzermans", lo3: null, state: "CA", hasNotes: true, filesCount: 5, property: "812 Mesa Verde Dr, San Diego, CA", baseLoanAmount: 651500, totalLoanAmount: 651500, loanExpDate: "2026-07-30", lockPricing: 100.125, type: "RETAIL", revenue: { originationA1: 8144, originationA2: 0, originationA3: 0, pointsA01: 3258, ysp: 4886 }, deductions: { lockCost: 1303, lenderCredit: 0, flatFee: 1095 } },
  { id: "16716159", borrower: "Manuel Martinez-Ortiz", status: "Loan Funded", fundedDate: "2026-07-15", calcCompleted: null, payrollProcessed: "2026-07-16", primaryLO: "Matthew Clanton", lo2: null, lo3: null, state: "CA", hasNotes: false, filesCount: 2, property: "77 Palm Canyon Rd, Palm Springs, CA", baseLoanAmount: 425000, totalLoanAmount: 425000, loanExpDate: "2026-08-02", lockPricing: 99.5, type: "RETAIL", revenue: { originationA1: 5313, originationA2: 1063, originationA3: 0, pointsA01: 0, ysp: 3188 }, deductions: { lockCost: 850, lenderCredit: 750, flatFee: 1095 } },
  { id: "16717480", borrower: "Wayne Harris", status: "Loan Funded", fundedDate: "2026-07-14", calcCompleted: "2026-07-14", payrollProcessed: "2026-07-15", primaryLO: "Charles Vamadeva", lo2: "KATHY LEE QUACH", lo3: null, state: "NC", hasNotes: false, filesCount: 4, property: "19 Birchwood Ln, Charlotte, NC", baseLoanAmount: 388000, totalLoanAmount: 388000, loanExpDate: "2026-07-24", lockPricing: 100.0, type: "WHOLESALE", revenue: { originationA1: 4850, originationA2: 0, originationA3: 0, pointsA01: 1940, ysp: 2910 }, deductions: { lockCost: 776, lenderCredit: 0, flatFee: 1095 } },
  { id: "16099480", borrower: "Daniel Mather", status: "Loan Funded", fundedDate: "2026-07-14", calcCompleted: null, payrollProcessed: null, primaryLO: "Bradley Yzermans", lo2: null, lo3: null, state: "CA", hasNotes: false, filesCount: 1, property: "2204 Ocean View Ave, Carlsbad, CA", baseLoanAmount: 512000, totalLoanAmount: 512000, loanExpDate: "2026-07-29", lockPricing: 99.75, type: "RETAIL", revenue: { originationA1: 6400, originationA2: 0, originationA3: 0, pointsA01: 2560, ysp: 0 }, deductions: { lockCost: 1024, lenderCredit: 1200, flatFee: 1095 } },
  { id: "16834060", borrower: "Jennifer Enderud", status: "Loan Funded", fundedDate: "2026-07-14", calcCompleted: "2026-07-15", payrollProcessed: null, primaryLO: "Jerry Avila", lo2: "Danielle Reilman", lo3: null, state: "CO", hasNotes: true, filesCount: 6, property: "458 Flatiron Ct, Boulder, CO", baseLoanAmount: 602000, totalLoanAmount: 602000, loanExpDate: "2026-08-05", lockPricing: 100.25, type: "RETAIL", revenue: { originationA1: 7525, originationA2: 0, originationA3: 1505, pointsA01: 3010, ysp: 4515 }, deductions: { lockCost: 1505, lenderCredit: 0, flatFee: 1095 } },
  { id: "17039838", borrower: "Sarah Dowda", status: "Loan Funded", fundedDate: "2026-07-14", calcCompleted: null, payrollProcessed: null, primaryLO: "SHARILYN SNOW", lo2: null, lo3: null, state: "CA", hasNotes: false, filesCount: 2, property: "930 Sequoia Way, Fresno, CA", baseLoanAmount: 344000, totalLoanAmount: 344000, loanExpDate: "2026-07-31", lockPricing: 99.625, type: "WHOLESALE", revenue: { originationA1: 4300, originationA2: 0, originationA3: 0, pointsA01: 1720, ysp: 2580 }, deductions: { lockCost: 688, lenderCredit: 400, flatFee: 1095 } },
  { id: "15682338", borrower: "Stanley Nderitu", status: "Loan Funded", fundedDate: "2026-07-14", calcCompleted: "2026-07-14", payrollProcessed: "2026-07-14", primaryLO: "Charles Vamadeva", lo2: "Hannah Pennington", lo3: null, state: "CA", hasNotes: false, filesCount: 3, property: "1210 Delta King St, Sacramento, CA", baseLoanAmount: 476000, totalLoanAmount: 476000, loanExpDate: "2026-07-22", lockPricing: 100.0, type: "RETAIL", revenue: { originationA1: 5950, originationA2: 1190, originationA3: 0, pointsA01: 0, ysp: 3570 }, deductions: { lockCost: 952, lenderCredit: 0, flatFee: 1095 } },
  { id: "17013315", borrower: "Justine Asongna", status: "Loan Funded", fundedDate: "2026-07-13", calcCompleted: null, payrollProcessed: null, primaryLO: "Maritza Negrete", lo2: null, lo3: null, state: "AZ", hasNotes: false, filesCount: 0, property: "66 Saguaro Bend, Scottsdale, AZ", baseLoanAmount: 398000, totalLoanAmount: 398000, loanExpDate: "2026-07-26", lockPricing: 99.875, type: "RETAIL", revenue: { originationA1: 4975, originationA2: 0, originationA3: 0, pointsA01: 1990, ysp: 2985 }, deductions: { lockCost: 796, lenderCredit: 600, flatFee: 1095 } },
  { id: "16767771", borrower: "Vincent Coletti", status: "Loan Funded", fundedDate: "2026-07-13", calcCompleted: "2026-07-13", payrollProcessed: null, primaryLO: "Hannah Pennington", lo2: "John Medina", lo3: null, state: "TN", hasNotes: true, filesCount: 4, property: "315 Music Row, Nashville, TN", baseLoanAmount: 430000, totalLoanAmount: 430000, loanExpDate: "2026-07-28", lockPricing: 100.125, type: "RETAIL", revenue: { originationA1: 5375, originationA2: 0, originationA3: 0, pointsA01: 2150, ysp: 3225 }, deductions: { lockCost: 860, lenderCredit: 0, flatFee: 1095 } },
  { id: "16881627", borrower: "James Harrison", status: "Loan Funded", fundedDate: "2026-07-13", calcCompleted: null, payrollProcessed: "2026-07-16", primaryLO: "Carlos Martinez", lo2: null, lo3: null, state: "AZ", hasNotes: true, filesCount: 5, property: "48 Red Rock Pass, Sedona, AZ", baseLoanAmount: 565000, totalLoanAmount: 565000, loanExpDate: "2026-08-01", lockPricing: 99.75, type: "NON-DEL CORRESPONDENT", revenue: { originationA1: 7063, originationA2: 1413, originationA3: 0, pointsA01: 2825, ysp: 0 }, deductions: { lockCost: 1130, lenderCredit: 900, flatFee: 1095 } },
  { id: "17045220", borrower: "Priya Raman", status: "Docs Signed", fundedDate: "", calcCompleted: null, payrollProcessed: null, primaryLO: "Jerry Avila", lo2: null, lo3: null, state: "CA", hasNotes: true, filesCount: 7, property: "1500 Laurel St, San Carlos, CA", baseLoanAmount: 725000, totalLoanAmount: 725000, loanExpDate: "2026-07-21", lockPricing: 100.375, type: "RETAIL", revenue: { originationA1: 9063, originationA2: 0, originationA3: 0, pointsA01: 3625, ysp: 5438 }, deductions: { lockCost: 1813, lenderCredit: 0, flatFee: 1095 } },
  { id: "16923314", borrower: "Tom Beckett", status: "Clear to Close", fundedDate: "", calcCompleted: null, payrollProcessed: null, primaryLO: "Maritza Negrete", lo2: null, lo3: null, state: "WA", hasNotes: false, filesCount: 4, property: "883 Rainier Ave S, Seattle, WA", baseLoanAmount: 540000, totalLoanAmount: 540000, loanExpDate: "2026-07-20", lockPricing: 99.5, type: "WHOLESALE", revenue: { originationA1: 6750, originationA2: 0, originationA3: 0, pointsA01: 2700, ysp: 4050 }, deductions: { lockCost: 1080, lenderCredit: 500, flatFee: 1095 } },
  { id: "16948207", borrower: "Amara Okafor", status: "Docs Out", fundedDate: "", calcCompleted: null, payrollProcessed: null, primaryLO: "Steven Vallejo", lo2: "KATHY LEE QUACH", lo3: null, state: "TX", hasNotes: true, filesCount: 3, property: "27 Bluebonnet Trl, Austin, TX", baseLoanAmount: 462000, totalLoanAmount: 462000, loanExpDate: "2026-07-19", lockPricing: 100.0, type: "RETAIL", revenue: { originationA1: 5775, originationA2: 1155, originationA3: 0, pointsA01: 0, ysp: 3465 }, deductions: { lockCost: 924, lenderCredit: 0, flatFee: 1095 } },
  { id: "17012956", borrower: "Gregory Palmer", status: "Submitted to Underwriting", fundedDate: "", calcCompleted: null, payrollProcessed: null, primaryLO: "Charles Vamadeva", lo2: null, lo3: null, state: "FL", hasNotes: false, filesCount: 2, property: "642 Coconut Grove, Miami, FL", baseLoanAmount: 618000, totalLoanAmount: 618000, loanExpDate: "2026-07-25", lockPricing: 99.875, type: "RETAIL", revenue: { originationA1: 7725, originationA2: 0, originationA3: 1545, pointsA01: 3090, ysp: 0 }, deductions: { lockCost: 1236, lenderCredit: 800, flatFee: 1095 } },
  { id: "17058742", borrower: "Lena Kowalski", status: "Disclosed", fundedDate: "", calcCompleted: null, payrollProcessed: null, primaryLO: "Hannah Pennington", lo2: null, lo3: null, state: "OR", hasNotes: false, filesCount: 1, property: "90 Willamette View, Portland, OR", baseLoanAmount: 495000, totalLoanAmount: 495000, loanExpDate: "2026-08-03", lockPricing: 100.125, type: "WHOLESALE", revenue: { originationA1: 6188, originationA2: 0, originationA3: 0, pointsA01: 2475, ysp: 3713 }, deductions: { lockCost: 990, lenderCredit: 0, flatFee: 1095 } },
  { id: "17061183", borrower: "Marcus Webb", status: "Loan Setup", fundedDate: "", calcCompleted: null, payrollProcessed: null, primaryLO: "Carlos Martinez", lo2: null, lo3: null, state: "NV", hasNotes: false, filesCount: 0, property: "310 Desert Inn Rd, Las Vegas, NV", baseLoanAmount: 372000, totalLoanAmount: 372000, loanExpDate: "2026-08-08", lockPricing: 99.625, type: "RETAIL", revenue: { originationA1: 4650, originationA2: 0, originationA3: 0, pointsA01: 1860, ysp: 2790 }, deductions: { lockCost: 744, lenderCredit: 300, flatFee: 1095 } },
];

export const initialUsers: UserRecord[] = [
  { id: 1, name: "GERARD VERKUYLEN", email: "gverkuylen@gmail.com", role: "Loan Officer", status: "Registered", dateAdded: "Jun 2, 2026", lastActive: "23d ago" },
  { id: 2, name: "KATHY LEE QUACH", email: "kathylee@patriotpacific.com", role: "Admin", status: "Registered", dateAdded: "Apr 8, 2026", lastActive: "15d ago" },
  { id: 3, name: "John Paul Padilla", email: "johnpaul@patriotpacific.com", role: "Loan Officer", status: "Registered", dateAdded: "May 15, 2026", lastActive: "7d ago" },
  { id: 4, name: "Altaf Lalani", email: "altaf@patriotpacific.com", role: "Loan Officer", status: "Registered", dateAdded: "May 16, 2026", lastActive: "16d ago" },
  { id: 5, name: "Jesus Toscano", email: "jesus@patriotpacific.com", role: "Loan Officer", status: "Registered", dateAdded: "May 16, 2026", lastActive: "1mo ago" },
  { id: 6, name: "Joe Daquino", email: "joe@patriotpacific.com", role: "Loan Officer", status: "Registered", dateAdded: "May 16, 2026", lastActive: "16d ago" },
  { id: 7, name: "Marlene Hoffmann", email: "marlene@patriotpacific.com", role: "Loan Officer", status: "Registered", dateAdded: "May 16, 2026", lastActive: "2d ago" },
  { id: 8, name: "Dylan Rainey", email: "dylan@patriotpacific.com", role: "Loan Officer", status: "Pending", dateAdded: "Jun 1, 2026", lastActive: "7d ago" },
  { id: 9, name: "Jeffrey Manalo", email: "jeff.manalo@patriotpacific.com", role: "Admin", status: "Registered", dateAdded: "Apr 22, 2026", lastActive: "Just now", online: true },
  { id: 10, name: "Ronald Chapman", email: "ron@patriotpacific.com", role: "Loan Officer", status: "Registered", dateAdded: "Apr 20, 2026", lastActive: "28d ago" },
  { id: 11, name: "Bradley Yzermans", email: "brad@patriotpacific.com", role: "Loan Officer", status: "Registered", dateAdded: "Mar 12, 2026", lastActive: "1h ago", online: true },
  { id: 12, name: "Hannah Pennington", email: "hannah@patriotpacific.com", role: "Processor", status: "Registered", dateAdded: "Feb 28, 2026", lastActive: "3h ago", online: true },
  { id: 13, name: "Steven Vallejo", email: "steven@patriotpacific.com", role: "Loan Officer", status: "Registered", dateAdded: "Feb 14, 2026", lastActive: "5h ago" },
  { id: 14, name: "Maritza Negrete", email: "maritza@patriotpacific.com", role: "Loan Officer", status: "Pending", dateAdded: "Jun 20, 2026", lastActive: "Never" },
  { id: 15, name: "Carlos Martinez", email: "carlos@patriotpacific.com", role: "Loan Officer", status: "Registered", dateAdded: "Jan 30, 2026", lastActive: "2h ago", online: true },
  { id: 16, name: "Charles Vamadeva", email: "charles@patriotpacific.com", role: "Loan Officer", status: "Registered", dateAdded: "Jan 18, 2026", lastActive: "1d ago" },
  { id: 17, name: "Jerry Avila", email: "jerry@patriotpacific.com", role: "Loan Officer", status: "Deactivated", dateAdded: "Nov 4, 2025", lastActive: "3mo ago" },
  { id: 18, name: "SHARILYN SNOW", email: "sharilyn@patriotpacific.com", role: "Accounting", status: "Registered", dateAdded: "Oct 22, 2025", lastActive: "4h ago" },
];

export const initialNotes: Record<string, Note[]> = {
  "15589611": [
    { id: 1, author: "Steven Vallejo", initials: "SV", time: "Jul 15, 3:00 PM", body: "Cal-HERO lead 30% split with Brad. NO MLO support. $575.00 Broker split." },
    { id: 2, author: "Steven Vallejo", initials: "SV", time: "Jul 15, 6:51 PM", body: "Compensation 2.500  $16,323.88 × 70% = $11,426.71 − $575.00 = $10,851.71" },
  ],
  "16834060": [
    { id: 1, author: "Jerry Avila", initials: "JA", time: "Jul 14, 11:22 AM", body: "Borrower requested lender credit restructure — updated LE sent out for e-sign." },
  ],
  "16767771": [
    { id: 1, author: "Hannah Pennington", initials: "HP", time: "Jul 13, 9:14 AM", body: "VOE received. Waiting on final insurance binder before docs can go out." },
  ],
  "16881627": [
    { id: 1, author: "Carlos Martinez", initials: "CM", time: "Jul 13, 4:40 PM", body: "Non-del correspondant file — confirm warehouse line before scheduling funding." },
  ],
  "17045220": [
    { id: 1, author: "Jerry Avila", initials: "JA", time: "Jul 16, 8:05 AM", body: "Docs signed last night. Funding conditions cleared, targeting Friday disbursement." },
  ],
  "16948207": [
    { id: 1, author: "Steven Vallejo", initials: "SV", time: "Jul 12, 2:18 PM", body: "Rate lock expires in 3 days — escalate if CTC not issued by tomorrow EOD." },
  ],
};

export const initialFiles: Record<string, { folders: string[]; files: FileItem[] }> = {
  "16314513": {
    folders: ["Credit", "Income", "Closing"],
    files: [
      { id: 1, name: "Closing Disclosure.pdf", type: "PDF", size: "1.2 MB", folder: "Closing" },
      { id: 2, name: "Credit Report.pdf", type: "PDF", size: "840 KB", folder: "Credit" },
      { id: 3, name: "Paystubs - June.pdf", type: "PDF", size: "640 KB", folder: "Income" },
    ],
  },
  "15589611": {
    folders: ["Disclosures", "Title", "Income"],
    files: [
      { id: 1, name: "Initial LE.pdf", type: "PDF", size: "512 KB", folder: "Disclosures" },
      { id: 2, name: "Preliminary Title.pdf", type: "PDF", size: "2.1 MB", folder: "Title" },
      { id: 3, name: "W2 - 2025.pdf", type: "PDF", size: "388 KB", folder: "Income" },
      { id: 4, name: "Bank Statements.pdf", type: "PDF", size: "3.4 MB", folder: "Income" },
      { id: 5, name: "Wire Instructions.pdf", type: "PDF", size: "120 KB", folder: "Title" },
    ],
  },
};

export const fundedTrend = [
  { month: "Feb", funded: 8 },
  { month: "Mar", funded: 12 },
  { month: "Apr", funded: 11 },
  { month: "May", funded: 19 },
  { month: "Jun", funded: 27 },
  { month: "Jul", funded: 79 },
];

export const pipelineStages = [
  { stage: "Loan Setup", count: 23, pct: 29 },
  { stage: "Disclosed", count: 13, pct: 16 },
  { stage: "Submitted to Underwriting", count: 16, pct: 20 },
  { stage: "Docs Out", count: 9, pct: 11 },
  { stage: "Clear to Close", count: 12, pct: 15 },
  { stage: "Docs Signed", count: 7, pct: 9 },
];

export function totalRevenue(l: Loan) {
  const r = l.revenue;
  return r.originationA1 + r.originationA2 + r.originationA3 + r.pointsA01 + r.ysp;
}
export function totalDeductions(l: Loan) {
  const d = l.deductions;
  return d.lockCost + d.lenderCredit + d.flatFee;
}
export function netCommission(l: Loan) {
  return totalRevenue(l) - totalDeductions(l);
}
export function fmtMoney(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}
export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

export const AVATAR_PALETTES = [
  "bg-amber-100 text-amber-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700",
  "bg-rose-100 text-rose-700",
  "bg-orange-100 text-orange-700",
  "bg-teal-100 text-teal-700",
  "bg-indigo-100 text-indigo-700",
];
export function avatarPalette(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTES[h % AVATAR_PALETTES.length];
}
