import * as React from "react"

// Simple tooltip components without Radix UI dependency
const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div>{children}</div>;
};

const Tooltip: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div>{children}</div>;
};

const TooltipTrigger: React.FC<{ children: React.ReactNode; asChild?: boolean }> = ({ children }) => {
  return <div>{children}</div>;
};

const TooltipContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return <div className={className}>{children}</div>;
};

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
