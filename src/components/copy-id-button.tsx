"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type CopyIdButtonProps = {
  value: string;
};

export function CopyIdButton({ value }: CopyIdButtonProps) {
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
    <Button onClick={handleCopy} variant="secondary" className="text-xs">
      {copied ? "Skopiowano" : "Kopiuj ID"}
    </Button>
  );
}
