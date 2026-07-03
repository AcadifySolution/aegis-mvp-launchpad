export interface SwarmLog {
  agent: string;
  message: string;
  timestamp: number;
}

export interface UserStory {
  id: string;
  title: string;
  description: string;
  priority: 'Must-Have' | 'Should-Have' | 'Nice-to-Have';
  estimated_hours: number;
}

export interface APIEndpoint {
  path: string;
  method: string;
  description: string;
}

export interface DBSchema {
  table_name: string;
  columns: string[];
}

export interface TechSpec {
  languages: string[];
  frontend: string[];
  backend: string[];
  database: string;
  hosting: string;
  endpoints: APIEndpoint[];
  schemas: DBSchema[];
}

export interface BudgetMilestone {
  name: string;
  percentage: number;
  amount: number;
  completed: boolean;
}

export interface FinancialEstimate {
  total_hours: number;
  hourly_rate: number;
  total_cost: number;
  timeline_weeks: number;
  team_size: number;
  milestones: BudgetMilestone[];
}

export interface MVPEstimateResult {
  id: string;
  name: string;
  description: string;
  status: 'processing' | 'completed' | 'failed';
  user_stories: UserStory[];
  tech_spec: TechSpec | null;
  financials: FinancialEstimate | null;
  logs: SwarmLog[];
  created_at: number;
}
