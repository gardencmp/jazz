import React from "react";

interface AlertProps {
  children: React.ReactNode;
  variant?: "default" | "destructive";
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  children,
  variant = "default",
  className = "",
}) => {
  const baseClasses = "p-4 rounded-md mb-4";
  const variantClasses = {
    default: "bg-blue-100 text-blue-700",
    destructive: "bg-red-100 text-red-700",
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;

  return (
    <div className={classes} role="alert">
      {children}
    </div>
  );
};

interface AlertDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const AlertDescription: React.FC<AlertDescriptionProps> = ({
  children,
  className = "",
}) => {
  const classes = `text-sm ${className}`;

  return <p className={classes}>{children}</p>;
};
