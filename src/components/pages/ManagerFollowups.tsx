import React, { useState, useEffect } from "react";
import { Mail, Clock, CheckCircle, AlertCircle, Calendar } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

interface FollowUp {
  id: string;
  lead_id: string;
  lead_name: string;
  lead_email: string;
  status: "pending" | "completed" | "overdue";
  scheduled_date: string;
  notes: string;
  created_at: string;
}

export const ManagerFollowups: React.FC = () => {
  const [followups, setFollowups] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  useEffect(() => {
    fetchFollowups();
  }, []);

  const fetchFollowups = async () => {
    try {
      // Get current user ID
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Fetch leads assigned to this manager and create follow-ups
      const { data: leads, error: leadsError } = await supabase
        .from("leads")
        .select("*")
        .eq("assigned_to", session.user.id);

      if (leadsError) {
        console.error("Error fetching leads:", leadsError);
        return;
      }

      // Create mock follow-ups based on leads
      const mockFollowups: FollowUp[] = leads?.map((lead, index) => ({
        id: `followup-${lead.id}`,
        lead_id: lead.id,
        lead_name: lead.name,
        lead_email: lead.email,
        status: index % 3 === 0 ? "pending" : index % 3 === 1 ? "completed" : "overdue",
        scheduled_date: new Date(Date.now() + (index * 24 * 60 * 60 * 1000)).toISOString(),
        notes: `Follow-up for ${lead.name} regarding ${lead.interest}`,
        created_at: lead.created_at,
      })) || [];

      setFollowups(mockFollowups);
    } catch (error) {
      console.error("Error fetching follow-ups:", error);
      toast({
        title: "Error",
        description: "Failed to fetch follow-ups",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFollowUpStatus = async (followUpId: string, status: string) => {
    try {
      // In a real app, you would update the follow-up in the database
      setFollowups(prev => 
        prev.map(followup => 
          followup.id === followUpId 
            ? { ...followup, status: status as "pending" | "completed" | "overdue" }
            : followup
        )
      );
      
      toast({
        title: "Success",
        description: "Follow-up status updated",
      });
    } catch (error) {
      console.error("Error updating follow-up:", error);
      toast({
        title: "Error",
        description: "Failed to update follow-up status",
        variant: "destructive",
      });
    }
  };

  const filteredFollowups = selectedStatus === "all" 
    ? followups 
    : followups.filter(followup => followup.status === selectedStatus);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "overdue":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Follow-ups</h1>
          <p className="text-gray-600">Manage your lead follow-ups</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scheduled
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFollowups.map((followup) => (
                  <tr key={followup.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {followup.lead_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {followup.lead_email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(followup.status)}
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(followup.status)}`}>
                          {followup.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(followup.scheduled_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {followup.notes}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {followup.status === "pending" && (
                          <>
                            <button
                              onClick={() => updateFollowUpStatus(followup.id, "completed")}
                              className="text-green-600 hover:text-green-900"
                            >
                              Mark Complete
                            </button>
                            <button
                              onClick={() => updateFollowUpStatus(followup.id, "overdue")}
                              className="text-red-600 hover:text-red-900"
                            >
                              Mark Overdue
                            </button>
                          </>
                        )}
                        {followup.status === "overdue" && (
                          <button
                            onClick={() => updateFollowUpStatus(followup.id, "completed")}
                            className="text-green-600 hover:text-green-900"
                          >
                            Mark Complete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredFollowups.length === 0 && (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No follow-ups found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
