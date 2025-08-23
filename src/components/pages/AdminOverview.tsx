import React, { useState, useEffect } from "react";
import { Users, BarChart3, TrendingUp, Activity } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

export const AdminOverview: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState([
    {
      name: "Total Users",
      value: "0",
      change: "0%",
      changeType: "neutral" as const,
      icon: Users,
    },
    {
      name: "Total Leads",
      value: "0",
      change: "0%",
      changeType: "neutral" as const,
      icon: BarChart3,
    },
    {
      name: "Conversion Rate",
      value: "0%",
      change: "0%",
      changeType: "neutral" as const,
      icon: TrendingUp,
    },
    {
      name: "Active Sessions",
      value: "0",
      change: "0%",
      changeType: "neutral" as const,
      icon: Activity,
    },
  ]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch total users
        const { count: userCount } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true });

        // Fetch total leads
        const { count: leadCount } = await supabase
          .from("leads")
          .select("*", { count: "exact", head: true });

        // Calculate conversion rate (placeholder)
        const conversionRate =
          userCount && leadCount
            ? Math.round((leadCount / (userCount * 10)) * 100)
            : 0;

        setStats([
          {
            name: "Total Users",
            value: userCount?.toString() || "0",
            change: "+0%",
            changeType: "neutral",
            icon: Users,
          },
          {
            name: "Total Leads",
            value: leadCount?.toString() || "0",
            change: "+0%",
            changeType: "neutral",
            icon: BarChart3,
          },
          {
            name: "Conversion Rate",
            value: `${conversionRate}%`,
            change: "+0%",
            changeType: "neutral",
            icon: TrendingUp,
          },
          {
            name: "Active Sessions",
            value: "1",
            change: "+0%",
            changeType: "neutral",
            icon: Activity,
          },
        ]);
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Admin Overview</h2>
        <p className="text-gray-600">Welcome to your admin control panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-lg shadow p-6 border border-gray-200"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <stat.icon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
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
                    : stat.changeType === "negative"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {stat.change}
              </span>
              <span className="text-sm text-gray-500 ml-2">
                from last month
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate("/admin/users")}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Users className="h-5 w-5 mr-2" />
            Manage Users
          </button>
          <button
            onClick={() => navigate("/admin/analytics")}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <BarChart3 className="h-5 w-5 mr-2" />
            View Analytics
          </button>
          <button
            onClick={() => navigate("/admin/settings")}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Activity className="h-5 w-5 mr-2" />
            System Settings
          </button>
        </div>
      </div>
    </div>
  );
};
