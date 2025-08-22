import React, { useState, useEffect } from "react";
import { supabase, AuditLog } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Activity, Search, Filter, Download, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const AdminAuditLogs: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [tableFilter, setTableFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [searching, setSearching] = useState(false);
  const { toast } = useToast();

  const itemsPerPage = 20;

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from("audit_logs")
        .select(
          `
          *,
          users(email),
          leads(name, email)
        `,
          { count: "exact" }
        )
        .order("event_time", { ascending: false });

      // Apply filters
      if (searchTerm) {
        // Use a more efficient search approach
        const searchLower = searchTerm.toLowerCase();
        query = query.or(
          `action.ilike.%${searchLower}%,table_name.ilike.%${searchLower}%`
        );
      }

      if (actionFilter !== "all") {
        query = query.eq("action", actionFilter);
      }

      if (tableFilter !== "all") {
        query = query.eq("table_name", tableFilter);
      }

      if (roleFilter !== "all") {
        query = query.eq("role", roleFilter);
      }

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error("Error fetching audit logs:", error);
        toast({
          title: "Error",
          description: "Failed to fetch audit logs",
          variant: "destructive",
        });
        return;
      }

      setAuditLogs(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error in fetchAuditLogs:", error);
      toast({
        title: "Error",
        description: "Failed to fetch audit logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchAuditLogs();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [currentPage, actionFilter, tableFilter, roleFilter]);

  // Debounced search effect
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
      setSearching(true);
      fetchAuditLogs().finally(() => setSearching(false));
    }, 300);

    setSearchTimeout(timeout);

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [searchTerm]);

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case "create":
      case "insert":
        return "bg-green-100 text-green-800";
      case "update":
      case "modify":
        return "bg-blue-100 text-blue-800";
      case "delete":
      case "remove":
        return "bg-red-100 text-red-800";
      case "login":
      case "logout":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-red-100 text-red-800";
      case "sub_admin":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const exportAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select(
          `
          *,
          users(email),
          leads(name, email)
        `
        )
        .order("event_time", { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to export audit logs",
          variant: "destructive",
        });
        return;
      }

      // Convert to CSV
      const csvContent = [
        "Event Time,User Email,Role,Action,Table Name,Lead Name,IP Address,User Agent",
        ...(data || []).map((log) =>
          [
            formatDate(log.event_time),
            log.users?.email || "N/A",
            log.role,
            log.action,
            log.table_name,
            log.leads?.name || "N/A",
            log.ip_address || "N/A",
            log.user_agent || "N/A",
          ].join(",")
        ),
      ].join("\n");

      // Download file
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Audit logs exported successfully",
      });
    } catch (error) {
      console.error("Error exporting audit logs:", error);
      toast({
        title: "Error",
        description: "Failed to export audit logs",
        variant: "destructive",
      });
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const clearFilters = () => {
    setSearchTerm("");
    setActionFilter("all");
    setTableFilter("all");
    setRoleFilter("all");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600">
            Monitor all system activities and user actions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={refreshData} disabled={refreshing}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button onClick={exportAuditLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search actions, tables, users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  disabled={searching}
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Action
              </label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Table</label>
              <Select value={tableFilter} onValueChange={setTableFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All tables" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tables</SelectItem>
                  <SelectItem value="leads">Leads</SelectItem>
                  <SelectItem value="users">Users</SelectItem>
                  <SelectItem value="followups">Followups</SelectItem>
                  <SelectItem value="audit_logs">Audit Logs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Role</label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="sub_admin">Sub Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Clear Filters Button */}
          {(searchTerm ||
            actionFilter !== "all" ||
            tableFilter !== "all" ||
            roleFilter !== "all") && (
            <div className="mt-4 flex justify-end">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Log ({totalCount} total events)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ||
              actionFilter !== "all" ||
              tableFilter !== "all" ||
              roleFilter !== "all"
                ? "No audit logs match your current filters"
                : "No audit logs found yet. Activity will appear here once users start using the system."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Event Time
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      User
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Role
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Action
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Table
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Lead
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      IP Address
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(log.event_time)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {log.users?.email || "N/A"}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getRoleColor(log.role)}>
                          {log.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {log.table_name}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {log.leads?.name || "N/A"}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {log.ip_address || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, totalCount)} of{" "}
                {totalCount} results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
