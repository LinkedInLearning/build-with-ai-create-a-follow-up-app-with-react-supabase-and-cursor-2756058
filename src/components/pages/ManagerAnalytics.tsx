import React, { useState, useEffect } from "react";
import { TrendingUp, Users, Mail, Calendar } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface AnalyticsData {
  totalLeads: number;
  leadsThisMonth: number;
  conversionRate: number;
  averageResponseTime: number;
  leadsBySource: { source: string; count: number }[];
  leadsByMonth: { month: string; count: number }[];
}

export const ManagerAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalLeads: 0,
    leadsThisMonth: 0,
    conversionRate: 0,
    averageResponseTime: 0,
    leadsBySource: [],
    leadsByMonth: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Get current user ID
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Get the internal user ID (users.id) from the users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (userError) {
        console.error("Error fetching user data:", userError);
        return;
      }

      // Manager Analytics user data retrieved

      // Fetch leads assigned to this manager using the internal user ID
      const { data: leads, error: leadsError } = await supabase
        .from("leads")
        .select("*")
        .eq("assigned_to", userData.id);

      if (leadsError) {
        console.error("Error fetching leads:", leadsError);
        return;
      }

      // Manager Analytics leads retrieved
      const totalLeads = leads?.length || 0;
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const leadsThisMonth =
        leads?.filter((lead) => {
          const leadDate = new Date(lead.created_at);
          return (
            leadDate.getMonth() === currentMonth &&
            leadDate.getFullYear() === currentYear
          );
        }).length || 0;

      // Calculate conversion rate (mock: 15% of total leads)
      const conversionRate =
        totalLeads > 0 ? Math.round(totalLeads * 0.15 * 10) / 10 : 0;

      // Calculate average response time (mock: 2.4 hours)
      const averageResponseTime = 2.4;

      // Group leads by source
      const sourceCounts: { [key: string]: number } = {};
      leads?.forEach((lead) => {
        sourceCounts[lead.source] = (sourceCounts[lead.source] || 0) + 1;
      });

      const leadsBySource = Object.entries(sourceCounts).map(
        ([source, count]) => ({
          source,
          count,
        })
      );

      // Group leads by month (last 6 months)
      const monthCounts: { [key: string]: number } = {};
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = months[date.getMonth()];
        monthCounts[monthKey] = 0;
      }

      leads?.forEach((lead) => {
        const leadDate = new Date(lead.created_at);
        const monthKey = months[leadDate.getMonth()];
        if (monthCounts[monthKey] !== undefined) {
          monthCounts[monthKey]++;
        }
      });

      const leadsByMonth = Object.entries(monthCounts).map(
        ([month, count]) => ({
          month,
          count,
        })
      );

      setAnalytics({
        totalLeads,
        leadsThisMonth,
        conversionRate,
        averageResponseTime,
        leadsBySource,
        leadsByMonth,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      name: "Total Leads",
      value: analytics.totalLeads.toString(),
      change: "+12%",
      changeType: "positive",
      icon: Users,
    },
    {
      name: "Leads This Month",
      value: analytics.leadsThisMonth.toString(),
      change: "+8%",
      changeType: "positive",
      icon: Calendar,
    },
    {
      name: "Conversion Rate",
      value: `${analytics.conversionRate}%`,
      change: "+1.8%",
      changeType: "positive",
      icon: TrendingUp,
    },
    {
      name: "Avg Response Time",
      value: `${analytics.averageResponseTime}h`,
      change: "-0.3h",
      changeType: "positive",
      icon: Mail,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
        <p className="text-gray-600">Your lead management performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {loading ? (
          <div className="col-span-4 flex justify-center items-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        ) : (
          stats.map((stat) => (
            <div
              key={stat.name}
              className="bg-white rounded-lg shadow p-6 border border-gray-200"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-500">
                    {stat.name}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    stat.changeType === "positive"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500 ml-2">
                  from last month
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads by Source */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Leads by Source
          </h3>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-3">
              {analytics.leadsBySource.map((item) => (
                <div
                  key={item.source}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm font-medium text-gray-700">
                    {item.source}
                  </span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${
                            (item.count / analytics.totalLeads) * 100
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 w-8">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leads by Month */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Leads by Month
          </h3>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-3">
              {analytics.leadsByMonth.map((item) => (
                <div
                  key={item.month}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm font-medium text-gray-700">
                    {item.month}
                  </span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${
                            (item.count /
                              Math.max(
                                ...analytics.leadsByMonth.map((l) => l.count)
                              )) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 w-8">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Performance Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {analytics.conversionRate}%
            </div>
            <div className="text-sm text-gray-500">Conversion Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {analytics.averageResponseTime}h
            </div>
            <div className="text-sm text-gray-500">Avg Response Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {analytics.leadsThisMonth}
            </div>
            <div className="text-sm text-gray-500">New Leads This Month</div>
          </div>
        </div>
      </div>
    </div>
  );
};
