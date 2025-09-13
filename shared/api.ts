/**
 * Shared types for the AI-Powered Personal Finance Assistant
 */

export interface DemoResponse {
  message: string;
}

// Categories of data
export type DataCategory =
  | "assets"
  | "liabilities"
  | "transactions"
  | "epf"
  | "creditScore"
  | "investments";

export type Permissions = Record<DataCategory, boolean>;

// Data models
export interface Asset {
  id: string;
  name: string;
  type: "cash" | "bank" | "property" | "other";
  value: number; // current value in currency units
}

export interface Liability {
  id: string;
  name: string;
  balance: number; // outstanding principal
  interestRate: number; // APR as decimal, e.g. 0.159 for 15.9%
}

export interface Transaction {
  id: string;
  date: string; // ISO date
  amount: number; // positive for income, negative for expense; transfers may be 0 or either side
  category: string; // e.g. groceries, rent, salary
  description: string;
  type: "income" | "expense" | "transfer";
}

export interface EPF {
  employeeContribution: number; // cumulative
  employerContribution: number; // cumulative
  currentBalance: number;
}

export interface CreditScore {
  score: number; // 300-850 typical
  rating: "Poor" | "Fair" | "Good" | "Very Good" | "Excellent" | string;
}

export interface Investment {
  id: string;
  name: string;
  type: "mutual_fund" | "stock" | "bond" | "other";
  currentValue: number;
}

export interface LoadDataResponse {
  assets?: Asset[];
  liabilities?: Liability[];
  transactions?: Transaction[];
  epf?: EPF;
  creditScore?: CreditScore;
  investments?: Investment[];
}

export interface ChatRequest {
  sessionId: string;
  message: string;
}

export interface InsightChip {
  category: DataCategory;
  label: string;
}

export interface ChatResponse {
  reply: string;
  usedCategories: DataCategory[];
  insights?: Array<{
    id: string;
    title: string;
    description: string;
    severity?: "info" | "warning" | "critical";
    usedCategories: DataCategory[];
  }>;
}
