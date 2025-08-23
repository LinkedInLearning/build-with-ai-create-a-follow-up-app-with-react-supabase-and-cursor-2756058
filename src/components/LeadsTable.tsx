import React, { useState, useEffect } from "react";
import { supabase, logAuditEvent, getLeadsData } from "@/lib/supabase";
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
  Filter,
  X,
  Send,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // New filter states
  const [sourceFilter, setSourceFilter] = useState<string>("All");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // Follow-up states
  const [selectedTemplates, setSelectedTemplates] = useState<{
    [key: string]: string;
  }>({});
  const [sendingFollowUp, setSendingFollowUp] = useState<string | null>(null);

  // Edit states
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    source: "",
    interest: "",
    note: "",
  });
  const [isEditing, setIsEditing] = useState(false);

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
        setIsSuperAdmin(userRole === "super_admin");

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

        // Use the new utility function to get role-appropriate data
        const { data, error } = await getLeadsData();

        if (error) {
          throw error;
        }

        // Filter leads based on user role
        let filteredData = data || [];
        if (userRole === "sub_admin") {
          // Sub-admin can only see leads assigned to them
          filteredData = filteredData.filter(
            (lead) => lead.assigned_to === userId
          );
        }
        // Super admin can see all leads (no filter needed)

        if (error) {
          if (error.message === "Supabase not configured") {
            setError(
              "Database not configured. Please set up your Supabase environment variables."
            );
            return;
          }
          throw error;
        }

        console.log("Fetched leads:", filteredData);
        setLeads(filteredData);
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
        template: "Initial follow-up for newly assigned lead",
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

      // Log audit event for lead assignment
      const assignedSubAdmin = subAdmins.find(
        (admin) => admin.id === subAdminId
      );
      await logAuditEvent("update", "leads", leadId, {
        action: "lead_assignment",
        assigned_to: assignedSubAdmin?.email || subAdminId,
        previous_assignment: null,
      });

      // Show success message
      toast({
        title: "Success",
        description:
          "Lead assigned successfully! Follow-up scheduled for tomorrow.",
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

  // Filter and sort leads based on search term, filters, and sort configuration
  const filteredAndSortedLeads = React.useMemo(() => {
    let filtered = leads;

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (lead) =>
          lead.name.toLowerCase().includes(searchLower) ||
          lead.email.toLowerCase().includes(searchLower)
      );
    }

    // Apply source filter
    if (sourceFilter !== "All") {
      filtered = filtered.filter((lead) => lead.source === sourceFilter);
    }

    // Apply date range filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((lead) => {
        const leadDate = new Date(lead.created_at);
        return leadDate >= fromDate;
      });
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((lead) => {
        const leadDate = new Date(lead.created_at);
        return leadDate <= toDate;
      });
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
  }, [leads, searchTerm, sourceFilter, dateFrom, dateTo, sortConfig]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredAndSortedLeads.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentLeads = filteredAndSortedLeads.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sourceFilter, dateFrom, dateTo]);

  // Clear all filters
  const clearFilters = () => {
    setSourceFilter("All");
    setDateFrom("");
    setDateTo("");
    setSearchTerm("");
  };

  // Check if any filters are active
  const hasActiveFilters =
    sourceFilter !== "All" || dateFrom || dateTo || searchTerm.trim();

  // Function to submit follow-up
  const submitFollowUp = async (leadId: string, template: string) => {
    if (!template) {
      toast({
        title: "Error",
        description: "Please select a template before sending.",
        variant: "destructive",
      });
      return;
    }

    setSendingFollowUp(leadId);

    try {
      const { data, error } = await supabase.functions.invoke("sendFollowUp", {
        body: { leadId, template },
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: `Follow-up email sent successfully using ${template} template.`,
      });

      // Clear the selected template for this lead
      setSelectedTemplates((prev) => {
        const updated = { ...prev };
        delete updated[leadId];
        return updated;
      });
    } catch (error) {
      console.error("Error sending follow-up:", error);
      toast({
        title: "Error",
        description: "Failed to send follow-up email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSendingFollowUp(null);
    }
  };

  // Function to open edit modal
  const openEditModal = (lead: Lead) => {
    setEditingLead(lead);
    setEditForm({
      name: lead.name,
      email: lead.email,
      phone: lead.phone || "",
      source: lead.source,
      interest: lead.interest,
      note: lead.note || "",
    });
  };

  // Function to save edited lead
  const saveEditedLead = async () => {
    if (!editingLead) return;

    setIsEditing(true);

    try {
      const { error } = await supabase
        .from("leads")
        .update({
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone || null,
          source: editForm.source,
          interest: editForm.interest,
          note: editForm.note || null,
        })
        .eq("id", editingLead.id);

      if (error) {
        throw error;
      }

      // Update local state
      setLeads((prevLeads) =>
        prevLeads.map((lead) =>
          lead.id === editingLead.id
            ? {
                ...lead,
                name: editForm.name,
                email: editForm.email,
                phone: editForm.phone || null,
                source: editForm.source,
                interest: editForm.interest,
                note: editForm.note || null,
              }
            : lead
        )
      );

      // Log audit event
      await logAuditEvent("update", "leads", editingLead.id, {
        action: "lead_edited",
        previous_data: editingLead,
        new_data: editForm,
      });

      toast({
        title: "Success",
        description: "Lead information updated successfully.",
      });

      setEditingLead(null);
    } catch (error) {
      console.error("Error updating lead:", error);
      toast({
        title: "Error",
        description: "Failed to update lead information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEditing(false);
    }
  };

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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Leads ({leads.length})
            </h2>
            {hasActiveFilters && (
              <p className="text-sm text-gray-600 mt-1">
                Showing {filteredAndSortedLeads.length} of {leads.length} leads
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isSuperAdmin && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-full">
                <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                <span className="text-sm font-medium">Data Privacy Mode</span>
              </div>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                showFilters
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full">
                  {[
                    sourceFilter !== "All" ? 1 : 0,
                    dateFrom ? 1 : 0,
                    dateTo ? 1 : 0,
                    searchTerm.trim() ? 1 : 0,
                  ].reduce((a, b) => a + b, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      {showFilters && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Bar */}
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

            {/* Source Filter */}
            <div>
              <label
                htmlFor="source-filter"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Source
              </label>
              <select
                id="source-filter"
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="All">All Sources</option>
                <option value="Google">Google</option>
                <option value="Referral">Referral</option>
                <option value="Others">Others</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <label
                htmlFor="date-from"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                From Date
              </label>
              <input
                type="date"
                id="date-from"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* Date To */}
            <div>
              <label
                htmlFor="date-to"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                To Date
              </label>
              <input
                type="date"
                id="date-to"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Search Bar (when filters are hidden) */}
      {!showFilters && (
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
      )}

      <div className="overflow-x-auto w-full">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors min-w-[120px] max-w-[200px]"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center space-x-1">
                  <span>Name</span>
                  {getSortIcon("name")}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors min-w-[180px] max-w-[250px]"
                onClick={() => handleSort("email")}
              >
                <div className="flex items-center space-x-1">
                  <span>Email</span>
                  {getSortIcon("email")}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors min-w-[120px] max-w-[150px]"
                onClick={() => handleSort("phone")}
              >
                <div className="flex items-center space-x-1">
                  <span>Phone</span>
                  {getSortIcon("phone")}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors min-w-[100px] max-w-[120px]"
                onClick={() => handleSort("source")}
              >
                <div className="flex items-center space-x-1">
                  <span>Source</span>
                  {getSortIcon("source")}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors min-w-[120px] max-w-[200px]"
                onClick={() => handleSort("interest")}
              >
                <div className="flex items-center space-x-1">
                  <span>Interest</span>
                  {getSortIcon("interest")}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors min-w-[140px] max-w-[180px]"
                onClick={() => handleSort("created_at")}
              >
                <div className="flex items-center space-x-1">
                  <span>Date</span>
                  {getSortIcon("created_at")}
                </div>
              </th>
              {userRole === "super_admin" && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px] max-w-[200px]">
                  Assignment
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[280px] max-w-[350px]">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentLeads.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 min-w-[120px] max-w-[200px]">
                  <div className="truncate" title={lead.name}>
                    {lead.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[180px] max-w-[250px]">
                  <a
                    href={`mailto:${lead.email}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline truncate block"
                    title={lead.email}
                  >
                    {lead.email}
                  </a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[120px] max-w-[150px]">
                  {lead.phone ? (
                    <a
                      href={`tel:${lead.phone}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline truncate block"
                      title={lead.phone}
                    >
                      {lead.phone}
                    </a>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[100px] max-w-[120px]">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {lead.source}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 min-w-[120px] max-w-[200px]">
                  <div className="truncate" title={lead.interest}>
                    {lead.interest}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[140px] max-w-[180px]">
                  {formatDate(lead.created_at)}
                </td>
                {userRole === "super_admin" && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[140px] max-w-[200px]">
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[280px] max-w-[350px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={selectedTemplates[lead.id] || ""}
                      onChange={(e) =>
                        setSelectedTemplates((prev) => ({
                          ...prev,
                          [lead.id]: e.target.value,
                        }))
                      }
                      className="text-sm border border-gray-300 rounded px-2 py-1 min-w-[120px]"
                      disabled={sendingFollowUp === lead.id}
                    >
                      <option value="">Select template...</option>
                      <option value="welcome">Welcome</option>
                      <option value="check-in">Check-In</option>
                      <option value="reminder">Reminder</option>
                      <option value="update">Update</option>
                    </select>
                    <Button
                      size="sm"
                      onClick={() =>
                        submitFollowUp(
                          lead.id,
                          selectedTemplates[lead.id] || ""
                        )
                      }
                      disabled={
                        !selectedTemplates[lead.id] ||
                        sendingFollowUp === lead.id
                      }
                      className="flex items-center gap-1"
                    >
                      <Send className="h-3 w-3" />
                      {sendingFollowUp === lead.id ? "Sending..." : "Send"}
                    </Button>
                    {isSuperAdmin && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(lead)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                    )}
                  </div>
                </td>
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

      {/* Edit Lead Modal */}
      <Dialog open={!!editingLead} onOpenChange={() => setEditingLead(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Lead Information</DialogTitle>
            <DialogDescription>
              Update the contact information for this lead. Click save when
              you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="Enter email"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-source">Source *</Label>
                <select
                  id="edit-source"
                  value={editForm.source}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, source: e.target.value }))
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select source...</option>
                  <option value="Google">Google</option>
                  <option value="Referral">Referral</option>
                  <option value="Others">Others</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-interest">Interest *</Label>
              <Input
                id="edit-interest"
                value={editForm.interest}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, interest: e.target.value }))
                }
                placeholder="Enter interest"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-note">Note</Label>
              <Textarea
                id="edit-note"
                value={editForm.note}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, note: e.target.value }))
                }
                placeholder="Enter additional notes"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingLead(null)}
              disabled={isEditing}
            >
              Cancel
            </Button>
            <Button onClick={saveEditedLead} disabled={isEditing}>
              {isEditing ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
