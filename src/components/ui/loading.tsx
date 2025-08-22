import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  size = "md",
  text = "Loading...",
  className,
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div
      className={cn("flex items-center justify-center space-x-2", className)}
    >
      <Loader2 className={cn("animate-spin", sizeClasses[size])} />
      {text && <span className="text-sm text-gray-600">{text}</span>}
    </div>
  );
};

export const LoadingSpinner: React.FC<{ className?: string }> = ({
  className,
}) => (
  <div className={cn("flex items-center justify-center p-8", className)}>
    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
  </div>
);

export const LoadingOverlay: React.FC<{
  isVisible: boolean;
  text?: string;
  className?: string;
}> = ({ isVisible, text = "Processing...", className }) => {
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",
        className
      )}
    >
      <div className="bg-white rounded-lg p-6 shadow-xl">
        <Loading size="lg" text={text} />
      </div>
    </div>
  );
};
