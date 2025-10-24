// Dashboard domain exports
export { DashboardFeature } from "./features/dashboard";
export { DashboardOverview } from "./ui/dashboard-overview";

// Types
export interface DashboardStats {
  serverCount: number;
  dmCount: number;
  onlineFriends: number;
}

export interface RecentActivity {
  id: string;
  user: {
    id: string;
    username: string;
    avatar?: string;
  };
  action: string;
  channel: string;
  server: string;
  timestamp: string;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  action: () => void;
}
