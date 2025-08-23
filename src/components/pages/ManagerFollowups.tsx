import React, { useState, useEffect } from "react";
import { Mail, Calendar } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
// import type { FollowUp } from "@/lib/supabase";

// Local interface for the component's expected format
interface FollowUpDisplay {
  id: string;
  lead_id: string;
  lead_name: string;
  lead_email: string;
  status: "pending" | "in_progress" | "done";
  scheduled_date: string;
  notes: string;
  created_at: string;
}

export const ManagerFollowups: React.FC = () => {
  const [followups, setFollowups] = useState<FollowUpDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  useEffect(() => {
    fetchFollowups();
  }, []);

  const fetchFollowups = async () => {
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

      // Fetch all leads assigned to this manager
      const { data: leads, error: leadsError } = await supabase
        .from("leads")
        .select("*")
        .eq("assigned_to", userData.id);

      if (leadsError) {
        console.error("Error fetching leads:", leadsError);
        return;
      }

      // Transform all assigned leads into follow-up display format
      const allFollowups: FollowUpDisplay[] =
        leads?.map((lead) => ({
          id: `lead-${lead.id}`, // Use lead ID as the display ID
          lead_id: lead.id,
          lead_name: lead.name,
          lead_email: lead.email,
          status: "pending", // Default status for all leads
          scheduled_date: lead.created_at, // Use lead creation date
          notes: `Follow-up for ${lead.name} regarding ${lead.interest}`,
          created_at: lead.created_at,
        })) || [];

      setFollowups(allFollowups);
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
      // Extract the actual lead ID from the display ID
      const leadId = followUpId.replace("lead-", "");

      // Check if a follow-up record exists for this lead
      const { data: existingFollowUp, error: checkError } = await supabase
        .from("followups")
        .select("id")
        .eq("lead_id", leadId)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        // PGRST116 = no rows returned
        console.error("Error checking existing follow-up:", checkError);
      }

      if (existingFollowUp) {
        // Update existing follow-up
        const { error } = await supabase
          .from("followups")
          .update({ status: status as "pending" | "in_progress" | "done" })
          .eq("id", existingFollowUp.id);

        if (error) {
          console.error("Error updating follow-up:", error);
          toast({
            title: "Error",
            description: "Failed to update follow-up status",
            variant: "destructive",
          });
          return;
        }
      } else {
        // Create new follow-up record
        const { error } = await supabase.from("followups").insert({
          lead_id: leadId,
          sent_at: new Date().toISOString(),
          status: status as "pending" | "completed" | "overdue",
          template: `Follow-up status: ${status}`,
        });

        if (error) {
          console.error("Error creating follow-up:", error);
          toast({
            title: "Error",
            description: "Failed to create follow-up record",
            variant: "destructive",
          });
          return;
        }
      }

      // Update local state
      setFollowups((prev) =>
        prev.map((followup) =>
          followup.id === followUpId
            ? {
                ...followup,
                status: status as "pending" | "in_progress" | "done",
              }
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

  const filteredFollowups =
    selectedStatus === "all"
      ? followups
      : followups.filter((followup) => followup.status === selectedStatus);

  // const getStatusIcon = (status: string) => {
  //   switch (status) {
  //     case "done":
  //       return <CheckCircle className="h-5 w-5 text-green-500" />;
  //     case "in_progress":
  //       return <Clock className="h-5 w-5 text-blue-500" />;
  //     case "pending":
  //       return <Clock className="h-5 w-5 text-yellow-500" />;
  //     default:
  //       return <Clock className="h-5 w-5 text-gray-500" />;
  //   }
  // };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "done":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
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
                        <select
                          value={followup.status}
                          onChange={(e) =>
                            updateFollowUpStatus(followup.id, e.target.value)
                          }
                          className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full border-0 focus:ring-2 focus:ring-blue-500 ${getStatusBadge(
                            followup.status
                          )}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="done">Done</option>
                        </select>
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
                        <span className="text-gray-400">
                          Status updated via dropdown
                        </span>
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
