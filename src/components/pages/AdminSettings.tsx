import React, { useState } from "react";
import { Save, Shield, Database, Bell, Globe, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface SettingsForm {
  siteName: string;
  contactEmail: string;
  enableNotifications: boolean;
  autoBackup: boolean;
  maintenanceMode: boolean;
  maxUsers: number;
}

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsForm>({
    siteName: "Lead Management System",
    contactEmail: "admin@example.com",
    enableNotifications: true,
    autoBackup: true,
    maintenanceMode: false,
    maxUsers: 100,
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simulate saving settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Settings Saved",
        description: "Your settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof SettingsForm, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const settingsSections = [
    {
      title: "General Settings",
      icon: Globe,
      fields: [
        {
          label: "Site Name",
          type: "text",
          value: settings.siteName,
          onChange: (value: string) => handleInputChange("siteName", value),
        },
        {
          label: "Contact Email",
          type: "email",
          value: settings.contactEmail,
          onChange: (value: string) => handleInputChange("contactEmail", value),
        },
        {
          label: "Maximum Users",
          type: "number",
          value: settings.maxUsers,
          onChange: (value: number) => handleInputChange("maxUsers", value),
        },
      ],
    },
    {
      title: "System Settings",
      icon: Database,
      fields: [
        {
          label: "Enable Notifications",
          type: "checkbox",
          value: settings.enableNotifications,
          onChange: (value: boolean) => handleInputChange("enableNotifications", value),
        },
        {
          label: "Auto Backup",
          type: "checkbox",
          value: settings.autoBackup,
          onChange: (value: boolean) => handleInputChange("autoBackup", value),
        },
        {
          label: "Maintenance Mode",
          type: "checkbox",
          value: settings.maintenanceMode,
          onChange: (value: boolean) => handleInputChange("maintenanceMode", value),
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600">Configure your application settings</p>
        </div>
        <Button onClick={handleSave} disabled={loading} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          {loading ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      {/* Settings Sections */}
      <div className="space-y-8">
        {settingsSections.map((section) => (
          <div key={section.title} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <section.icon className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
            </div>
            
            <div className="space-y-4">
              {section.fields.map((field) => (
                <div key={field.label} className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      {field.label}
                    </label>
                    {field.type === "checkbox" && (
                      <p className="text-xs text-gray-500 mt-1">
                        {field.value ? "Enabled" : "Disabled"}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center">
                    {field.type === "checkbox" ? (
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    ) : field.type === "number" ? (
                      <input
                        type="number"
                        value={field.value}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <input
                        type={field.type}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Security Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Security</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Password Policy</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Minimum 8 characters
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Must include uppercase letter
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Must include number
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Session Management</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Session timeout</span>
                  <span className="font-medium">30 minutes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Max login attempts</span>
                  <span className="font-medium">5 attempts</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Two-factor auth</span>
                  <span className="font-medium text-green-600">Enabled</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Key className="h-5 w-5 text-red-600" />
          <h2 className="text-lg font-semibold text-red-900">Danger Zone</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-red-900">Delete All Data</h3>
              <p className="text-sm text-red-700">
                Permanently delete all leads and user data. This action cannot be undone.
              </p>
            </div>
            <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
              Delete All Data
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-red-900">Reset System</h3>
              <p className="text-sm text-red-700">
                Reset all settings to default values. This will affect all users.
              </p>
            </div>
            <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
              Reset System
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
