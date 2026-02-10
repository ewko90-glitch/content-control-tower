"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type CopyUrlButtonProps = {
  value: string;
  className?: string;
};

export function CopyUrlButton({ value, className }: CopyUrlButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Button onClick={handleCopy} variant="ghost" className={className}>
      {copied ? "Skopiowano" : "Kopiuj URL"}
    </Button>
  );
}
