import type { ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

/** A button that asks for confirmation before doing something that can't be undone. */
export function ConfirmButton({
  label,
  ariaLabel,
  title,
  description,
  confirm,
  onConfirm,
  variant = "outline",
}: {
  label: ReactNode;
  ariaLabel?: string;
  title: string;
  description: string;
  confirm: string;
  onConfirm: () => void;
  /** "ghost" is a small icon button, e.g. a bin in a list. */
  variant?: "outline" | "ghost";
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          size={variant === "ghost" ? "icon" : "default"}
          aria-label={ariaLabel}
        >
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{confirm}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
