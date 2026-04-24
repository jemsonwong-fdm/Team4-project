import {
  LayoutDashboard,
  type LucideIcon,
  TrendingUp,
  Mail,
  Building2,
  LineChart,
  ChartCandlestick,
  Briefcase,
  FileCode2,
} from "lucide-react";

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Cross-Ecosystem Opportunity Finder",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Opportunities",
        url: "/opportunities",
        icon: TrendingUp,
      },
      {
        title: "Invitations",
        url: "/invitations",
        icon: Mail,
      },
      {
        title: "Clients",
        url: "/clients",
        icon: Building2,
      },
      {
        title: "Python Backend",
        url: "/python-matching",
        icon: FileCode2,
      },
    ],
  },
  {
    id: 2,
    label: "Demo Dashboards",
    items: [
      {
        title: "Analytics",
        url: "/dashboard/analytics",
        icon: LineChart,
      },
      {
        title: "Finance",
        url: "/dashboard/finance",
        icon: ChartCandlestick,
      },
      {
        title: "CRM",
        url: "/dashboard/crm",
        icon: Briefcase,
      },
    ],
  },
];
