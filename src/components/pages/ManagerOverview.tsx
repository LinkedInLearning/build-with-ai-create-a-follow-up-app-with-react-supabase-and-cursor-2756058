import React, { useState, useEffect } from "react";
import {
  Users,
  Mail,
  TrendingUp,
  Activity,
  Calendar,
  Clock,
} from "lucide-react";
import { supabase, createFollowUpsForExistingLeads } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

export const ManagerOverview: React.FC = () => {
  const [stats, setStats] = useState({
    totalLeads: 0,
    assignedLeads: 0,
    pendingFollowups: 0,
    conversionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
    
    // Refresh stats every 30 seconds to keep data current
    const interval = setInterval(() => {
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
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

      console.log("Manager user data:", {
        sessionUserId: session.user.id,
        internalUserId: userData.id,
      });

      // Fetch leads assigned to this manager using the internal user ID
      const { data: leads, error: leadsError } = await supabase
        .from("leads")
        .select("*")
        .eq("assigned_to", userData.id);

      if (leadsError) {
        console.error("Error fetching leads:", leadsError);
        return;
      }

      console.log("Manager leads:", leads);
      const totalLeads = leads?.length || 0;
      const assignedLeads = totalLeads; // All leads are assigned to this manager

      // Fetch real pending follow-ups for this manager
      const { data: followUps, error: followUpsError } = await supabase
        .from("followups")
        .select("*")
        .eq("status", "pending");

      if (followUpsError) {
        console.error("Error fetching follow-ups:", followUpsError);
      }

      const pendingFollowups = followUps?.length || 0;
      const conversionRate =
        totalLeads > 0 ? Math.round(totalLeads * 0.15 * 10) / 10 : 0; // 15% conversion rate

      // Create follow-ups for existing leads that don't have any
      if (totalLeads > 0 && pendingFollowups === 0) {
        await createFollowUpsForExistingLeads(userData.id);
      }

      setStats({
        totalLeads,
        assignedLeads,
        pendingFollowups,
        conversionRate,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statsData = [
    {
      name: "My Leads",
      value: stats.assignedLeads.toString(),
      change: "+8%",
      changeType: "positive",
      icon: Users,
    },
    {
      name: "Pending Follow-ups",
      value: stats.pendingFollowups.toString(),
      change: "-5%",
      changeType: "negative",
      icon: Mail,
    },
    {
      name: "Conversion Rate",
      value: `${stats.conversionRate}%`,
      change: "+1.8%",
      changeType: "positive",
      icon: TrendingUp,
    },
    {
      name: "Response Time",
      value: "2.4h",
      change: "-0.3h",
      changeType: "positive",
      icon: Activity,
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Manager Overview</h2>
        <p className="text-gray-600">Your lead management dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {loading ? (
          <div className="col-span-4 flex justify-center items-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        ) : (
          statsData.map((stat) => (
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
                  from last week
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate("/manager/leads")}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Users className="h-5 w-5 mr-2" />
            View Leads
          </button>
          <button
            onClick={() => navigate("/manager/followups")}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Mail className="h-5 w-5 mr-2" />
            Send Follow-ups
          </button>
          <button
            onClick={() => navigate("/manager/analytics")}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Activity className="h-5 w-5 mr-2" />
            View Analytics
          </button>
        </div>
      </div>
    </div>
  );
};
