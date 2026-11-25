"use client";

import { Trash2 } from "lucide-react";
import { Button, Sheet } from "./ui";

/** A gentle "are you sure?" that works everywhere (some in-app browsers block window.confirm). */
export function ConfirmSheet({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Sheet
      open
      role="alertdialog"
      size="sm"
      onClose={onCancel}
      title={title}
      description={message}
      footer={
        <div className="flex flex-col gap-2">
          <Button variant="danger" size="lg" icon={Trash2} onClick={onConfirm} className="w-full">
            {confirmLabel}
          </Button>
          <Button variant="ghost" size="lg" onClick={onCancel} className="w-full" data-autofocus>
            Cancel
          </Button>
        </div>
      }
    />
  );
}
