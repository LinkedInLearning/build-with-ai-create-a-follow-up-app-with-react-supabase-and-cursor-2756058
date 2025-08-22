import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Lead, FollowUpInsert } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  UserCheck,
} from "lucide-react";

type SortField =
  | "name"
  | "email"
  | "phone"
  | "source"
  | "interest"
  | "created_at";
type SortDirection = "asc" | "desc" | null;

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export const LeadsTable: React.FC = () => {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: "created_at",
    direction: "desc",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [userRole, setUserRole] = useState<string>("");
  const [subAdmins, setSubAdmins] = useState<any[]>([]);
  const [assigningLead, setAssigningLead] = useState<string | null>(null);
  const rowsPerPage = 10;

  // Fetch leads from Supabase
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current user session
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) {
          setError("User not authenticated");
          return;
        }

        // Get user role and ID
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select(
            `
            id,
            role_id,
            roles (
              name
            )
          `
          )
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (userError) {
          console.error("Error fetching user role:", userError);
          setError("Failed to fetch user role");
          return;
        }

        const userRole = (userData?.roles as any)?.name;
        const userId = userData?.id;
        console.log("Current user:", {
          userRole,
          userId,
          sessionUserId: session.user.id,
        });
        setUserRole(userRole);

        // If super admin, fetch sub-admins for assignment
        if (userRole === "super_admin") {
          // First get the sub_admin role ID
          const { data: roleData, error: roleError } = await supabase
            .from("roles")
            .select("id")
            .eq("name", "sub_admin")
            .single();

          if (roleError) {
            console.error("Error fetching sub_admin role:", roleError);
          } else if (roleData) {
            // Then fetch users with that role
            const { data: subAdminData, error: subAdminError } = await supabase
              .from("users")
              .select("id, email")
              .eq("role_id", roleData.id);

            if (subAdminError) {
              console.error("Error fetching sub-admins:", subAdminError);
            } else if (subAdminData) {
              console.log("Fetched sub-admins:", subAdminData);
              setSubAdmins(subAdminData);
            }
          }
        }

        let query = supabase.from("leads").select("*");

        // Filter leads based on user role
        if (userRole === "sub_admin") {
          // Sub-admin can only see leads assigned to them
          query = query.eq("assigned_to", userId);
        }
        // Super admin can see all leads (no filter needed)

        const { data, error } = await query.order("created_at", {
          ascending: false,
        });

        if (error) {
          if (error.message === "Supabase not configured") {
            setError(
              "Database not configured. Please set up your Supabase environment variables."
            );
            return;
          }
          throw error;
        }

        console.log("Fetched leads:", data);
        setLeads(data || []);
      } catch (err) {
        console.error("Error fetching leads:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch leads");
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  // Function to assign lead to sub-admin
  const assignLead = async (leadId: string, subAdminId: string) => {
    console.log("Assigning lead", leadId, "to sub-admin", subAdminId);

    if (!subAdminId || subAdminId === "") {
      console.error("Invalid sub-admin ID");
      toast({
        title: "Error",
        description: "Please select a valid sub-admin to assign the lead to.",
        variant: "destructive",
      });
      return;
    }

    setAssigningLead(leadId);

    try {
      const { error } = await supabase
        .from("leads")
        .update({ assigned_to: subAdminId })
        .eq("id", leadId);

      if (error) {
        console.error("Error assigning lead:", error);
        toast({
          title: "Error",
          description: "Failed to assign lead: " + error.message,
          variant: "destructive",
        });
        return;
      }

      console.log("Lead assigned successfully");

      // Create a follow-up for the assigned lead
      const followUpData: FollowUpInsert = {
        lead_id: leadId,
        sent_at: new Date().toISOString(),
        status: "pending",
        template: "Initial follow-up for newly assigned lead"
      };

      const { error: followUpError } = await supabase
        .from("followups")
        .insert(followUpData);

      if (followUpError) {
        console.error("Error creating follow-up:", followUpError);
        // Don't fail the assignment if follow-up creation fails
      }

      // Update the leads state locally instead of reloading
      setLeads((prevLeads) =>
        prevLeads.map((lead) =>
          lead.id === leadId ? { ...lead, assigned_to: subAdminId } : lead
        )
      );

      // Show success message
      toast({
        title: "Success",
        description: "Lead assigned successfully! Follow-up scheduled for tomorrow.",
      });
    } catch (error) {
      console.error("Error assigning lead:", error);
      toast({
        title: "Error",
        description:
          "Failed to assign lead: " +
          (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive",
      });
    } finally {
      setAssigningLead(null);
    }
  };

  // Filter and sort leads based on search term and sort configuration
  const filteredAndSortedLeads = React.useMemo(() => {
    let filtered = leads;

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = leads.filter(
        (lead) =>
          lead.name.toLowerCase().includes(searchLower) ||
          lead.email.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    if (!sortConfig.direction) return filtered;

    return filtered.sort((a, b) => {
      let aValue = a[sortConfig.field];
      let bValue = b[sortConfig.field];

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) aValue = "";
      if (bValue === null || bValue === undefined) bValue = "";

      // Convert to strings for comparison
      const aString = String(aValue).toLowerCase();
      const bString = String(bValue).toLowerCase();

      if (sortConfig.direction === "asc") {
        return aString.localeCompare(bString);
      } else {
        return bString.localeCompare(aString);
      }
    });
  }, [leads, searchTerm, sortConfig]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredAndSortedLeads.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentLeads = filteredAndSortedLeads.slice(startIndex, endIndex);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Handle column header click for sorting
  const handleSort = (field: SortField) => {
    setSortConfig((prevConfig) => {
      if (prevConfig.field === field) {
        // Cycle through: asc -> desc -> null -> asc
        if (prevConfig.direction === "asc") {
          return { field, direction: "desc" };
        } else if (prevConfig.direction === "desc") {
          return { field, direction: null };
        } else {
          return { field, direction: "asc" };
        }
      } else {
        // New field, start with ascending
        return { field, direction: "asc" };
      }
    });
  };

  // Get sort icon for column header
  const getSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) {
      return <ChevronsUpDown className="w-4 h-4" />;
    }
    if (sortConfig.direction === "asc") {
      return <ChevronUp className="w-4 h-4" />;
    }
    if (sortConfig.direction === "desc") {
      return <ChevronDown className="w-4 h-4" />;
    }
    return <ChevronsUpDown className="w-4 h-4" />;
  };

  // Format date to user-friendly format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          Error Loading Leads
        </h3>
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          No Leads Found
        </h3>
        <p className="text-sm text-gray-600">
          No leads have been submitted yet.
        </p>
      </div>
    );
  }

  if (searchTerm.trim() && filteredAndSortedLeads.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Leads ({leads.length})
          </h2>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="px-6 py-8 text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            No Results Found
          </h3>
          <p className="text-sm text-gray-600">
            No leads match your search for "{searchTerm}".
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          Leads ({leads.length})
        </h2>
        {searchTerm.trim() && (
          <p className="text-sm text-gray-600 mt-1">
            Showing {filteredAndSortedLeads.length} of {leads.length} leads
          </p>
        )}
      </div>

      {/* Search Bar */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center space-x-1">
                  <span>Name</span>
                  {getSortIcon("name")}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort("email")}
              >
                <div className="flex items-center space-x-1">
                  <span>Email</span>
                  {getSortIcon("email")}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort("phone")}
              >
                <div className="flex items-center space-x-1">
                  <span>Phone</span>
                  {getSortIcon("phone")}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort("source")}
              >
                <div className="flex items-center space-x-1">
                  <span>Source</span>
                  {getSortIcon("source")}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort("interest")}
              >
                <div className="flex items-center space-x-1">
                  <span>Interest</span>
                  {getSortIcon("interest")}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort("created_at")}
              >
                <div className="flex items-center space-x-1">
                  <span>Date</span>
                  {getSortIcon("created_at")}
                </div>
              </th>
              {userRole === "super_admin" && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assignment
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentLeads.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {lead.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <a
                    href={`mailto:${lead.email}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {lead.email}
                  </a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {lead.phone ? (
                    <a
                      href={`tel:${lead.phone}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {lead.phone}
                    </a>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {lead.source}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                  <div className="truncate" title={lead.interest}>
                    {lead.interest}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(lead.created_at)}
                </td>
                {userRole === "super_admin" && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {lead.assigned_to ? (
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-green-500" />
                        <span className="text-green-700">Assigned</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <select
                          onChange={(e) => assignLead(lead.id, e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                          defaultValue=""
                          disabled={assigningLead === lead.id}
                        >
                          <option value="" disabled>
                            {assigningLead === lead.id
                              ? "Assigning..."
                              : "Assign to..."}
                          </option>
                          {subAdmins.map((admin) => (
                            <option key={admin.id} value={admin.id}>
                              {admin.email}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-700">
              <span>
                Showing {startIndex + 1} to{" "}
                {Math.min(endIndex, filteredAndSortedLeads.length)} of{" "}
                {filteredAndSortedLeads.length} results
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`inline-flex items-center px-3 py-2 border text-sm font-medium rounded-md ${
                        currentPage === page
                          ? "border-blue-500 bg-blue-50 text-blue-600"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>

              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
