import React from "react";
import { useNavigate } from "react-router-dom";
import { LoginPage as LoginForm } from "../LoginPage";
import { useToast } from "@/hooks/use-toast";

export const LoginPageWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = (userData: any) => {
    // Redirect based on user role
    if (userData.role === "super_admin") {
      navigate("/admin");
    } else if (userData.role === "sub_admin") {
      navigate("/manager");
    } else {
      console.error("Unknown role:", userData.role);
      toast({
        variant: "destructive",
        title: "Role Error",
        description: "Unknown user role. Please contact an administrator.",
      });
    }
  };

  return <LoginForm onLogin={handleLogin} />;
};
