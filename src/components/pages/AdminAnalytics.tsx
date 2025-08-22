import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Users, TrendingUp, Activity, Target } from "lucide-react";

interface AnalyticsData {
  totalUsers: number;
  totalLeads: number;
  leadsThisMonth: number;
  conversionRate: number;
}

export const AdminAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalUsers: 0,
    totalLeads: 0,
    leadsThisMonth: 0,
    conversionRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);

        // Fetch total users
        const { count: userCount } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true });

        // Fetch total leads
        const { count: leadCount } = await supabase
          .from("leads")
          .select("*", { count: "exact", head: true });

        // Fetch leads this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count: monthlyLeads } = await supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .gte("created_at", startOfMonth.toISOString());

        // Calculate conversion rate (placeholder - you can customize this)
        const conversionRate =
          leadCount && userCount
            ? Math.round((leadCount / (userCount * 10)) * 100)
            : 0;

        setAnalytics({
          totalUsers: userCount || 0,
          totalLeads: leadCount || 0,
          leadsThisMonth: monthlyLeads || 0,
          conversionRate: Math.min(conversionRate, 100),
        });
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const stats = [
    {
      title: "Total Users",
      value: analytics.totalUsers,
      icon: Users,
      color: "bg-blue-500",
      description: "Registered users in the system",
    },
    {
      title: "Total Leads",
      value: analytics.totalLeads,
      icon: Target,
      color: "bg-green-500",
      description: "Leads captured from website",
    },
    {
      title: "Leads This Month",
      value: analytics.leadsThisMonth,
      icon: TrendingUp,
      color: "bg-purple-500",
      description: "New leads this month",
    },
    {
      title: "Conversion Rate",
      value: `${analytics.conversionRate}%`,
      icon: Activity,
      color: "bg-orange-500",
      description: "Lead to customer conversion",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Analytics Dashboard
        </h1>
        <p className="text-gray-600">Overview of your system performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">New Lead Captured</p>
                <p className="text-sm text-gray-600">
                  From website contact form
                </p>
              </div>
              <span className="text-sm text-gray-500">2 min ago</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">User Registration</p>
                <p className="text-sm text-gray-600">New sub-admin created</p>
              </div>
              <span className="text-sm text-gray-500">1 hour ago</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">System Update</p>
                <p className="text-sm text-gray-600">
                  Database backup completed
                </p>
              </div>
              <span className="text-sm text-gray-500">3 hours ago</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <p className="font-medium text-gray-900">Export User Data</p>
              <p className="text-sm text-gray-600">Download user information</p>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <p className="font-medium text-gray-900">Generate Report</p>
              <p className="text-sm text-gray-600">
                Create monthly analytics report
              </p>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <p className="font-medium text-gray-900">System Health Check</p>
              <p className="text-sm text-gray-600">Run diagnostic tests</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
