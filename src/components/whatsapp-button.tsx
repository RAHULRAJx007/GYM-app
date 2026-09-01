"use client";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { waLink } from "@/lib/whatsapp-link";

export function WhatsAppButton({ phone, message, label = "WhatsApp", size = "sm" as const, className = "" }: { phone: string; message: string; label?: string; size?: "sm" | "default"; className?: string }) {
  const href = waLink(phone, message);
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      <Button size={size} variant="outline" className="gap-1.5 bg-green-50 hover:bg-green-100 text-green-700 border-green-200 hover:text-green-800 h-8">
        <MessageCircle className="h-3.5 w-3.5" />
        {label}
      </Button>
    </a>
  );
}
