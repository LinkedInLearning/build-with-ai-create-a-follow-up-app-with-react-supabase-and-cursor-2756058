import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { UserPlus, Users, Trash2, Shield, ShieldOff } from "lucide-react";

const assignRoleSchema = z.object({
  userId: z.string().min(1, "Please select a user"),
  roleId: z.string().min(1, "Please select a role"),
});

type AssignRoleForm = z.infer<typeof assignRoleSchema>;

interface User {
  id: string;
  created_at: string;
  user_id: string;
  email: string;
  role_id: string;
  role_name: string;
}

interface Role {
  id: string;
  name: string;
}

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AssignRoleForm>({
    resolver: zodResolver(assignRoleSchema),
  });

  // Fetch all users and roles
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch users
      const { data: usersData, error: usersError } = await supabase.from(
        "users"
      ).select(`
          id,
          created_at,
          user_id,
          email,
          role_id,
          roles (
            name
          )
        `);

      if (usersError) throw usersError;

      const formattedUsers =
        usersData?.map((user: any) => ({
          id: user.id,
          created_at: user.created_at,
          user_id: user.user_id,
          email: user.email,
          role_id: user.role_id,
          role_name: user.roles?.name || "No Role",
        })) || [];

      setUsers(formattedUsers);

      // Fetch roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("roles")
        .select("id, name");

      if (rolesError) throw rolesError;
      setRoles(rolesData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users and roles",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onAssignRole = async (data: AssignRoleForm) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({ role_id: data.roleId })
        .eq("id", data.userId);

      if (error) {
        console.error("Role assignment error:", error);
        throw new Error(`Failed to assign role: ${error.message}`);
      }

      toast({
        title: "Success",
        description: "Role assigned successfully!",
      });

      reset();
      setShowAssignForm(false);
      fetchData(); // Refresh the users list
    } catch (error: any) {
      console.error("Error assigning role:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to assign role",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const removeRole = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this user's role?")) return;

    try {
      const { error } = await supabase
        .from("users")
        .update({ role_id: null })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Role removed successfully",
      });

      fetchData(); // Refresh the users list
    } catch (error: any) {
      console.error("Error removing role:", error);
      toast({
        title: "Error",
        description: "Failed to remove role",
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (userId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    )
      return;

    try {
      // Delete from users table
      const { error: userError } = await supabase
        .from("users")
        .delete()
        .eq("id", userId);

      if (userError) throw userError;

      toast({
        title: "Success",
        description: "User deleted successfully",
      });

      fetchData(); // Refresh the users list
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage user roles and permissions</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchData}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            onClick={() => setShowAssignForm(!showAssignForm)}
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Assign Role
          </Button>
        </div>
      </div>

      {showAssignForm && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Assign Role to User</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Users must sign up first at the sign-up
              page before you can assign them a role. New users will appear with
              "No Role" status.
            </p>
          </div>
          <form onSubmit={handleSubmit(onAssignRole)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select User
                </label>
                <select
                  {...register("userId")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Choose a user...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.email}{" "}
                      {user.role_name !== "No Role" && `(${user.role_name})`}
                    </option>
                  ))}
                </select>
                {errors.userId && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.userId.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Role
                </label>
                <select
                  {...register("roleId")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Choose a role...</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
                {errors.roleId && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.roleId.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={isUpdating}
                className="flex items-center gap-2"
              >
                {isUpdating ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Shield className="h-4 w-4" />
                )}
                {isUpdating ? "Assigning..." : "Assign Role"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAssignForm(false);
                  reset();
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">All Users</h3>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role_name === "super_admin"
                            ? "bg-red-100 text-red-800"
                            : user.role_name === "sub_admin"
                            ? "bg-green-100 text-green-800"
                            : user.role_name === "No Role"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.role_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {user.role_name !== "No Role" && (
                          <Button
                            onClick={() => removeRole(user.id)}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            <ShieldOff className="h-3 w-3" />
                            Remove Role
                          </Button>
                        )}
                        <Button
                          onClick={() => deleteUser(user.id)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
