import type { ReactNode } from "react";
import clsx from "clsx";

type AlertProps = {
  children: ReactNode;
  variant?: "info" | "error" | "success";
  className?: string;
};

export function Alert({ children, variant = "info", className }: AlertProps) {
  return (
    <div
      className={clsx(
        "rounded-md border px-4 py-3 text-sm",
        variant === "info" && "border-blue-200 bg-blue-50 text-blue-900",
        variant === "error" && "border-red-200 bg-red-50 text-red-900",
        variant === "success" && "border-green-200 bg-green-50 text-green-900",
        className
      )}
    >
      {children}
    </div>
  );
}
