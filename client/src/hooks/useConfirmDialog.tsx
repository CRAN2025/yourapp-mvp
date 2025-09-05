import { useState } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";

type ConfirmOpts = { title: string; description?: string; confirmText?: string; cancelText?: string };

export function useConfirmDialog() {
  const [state, setState] = useState<{open:boolean; opts: ConfirmOpts; resolve?: (v:boolean)=>void}>({
    open: false, opts: { title: "", description: "" }
  });

  const confirm = (opts: ConfirmOpts) =>
    new Promise<boolean>((resolve) => setState({ open: true, opts, resolve }));

  const close = (value: boolean) => {
    state.resolve?.(value);
    setState(s => ({ ...s, open: false }));
  };

  const dialog = (
    <AlertDialog open={state.open} onOpenChange={(o) => !o && close(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{state.opts.title}</AlertDialogTitle>
          {state.opts.description && (
            <AlertDialogDescription>{state.opts.description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => close(false)}>
            {state.opts.cancelText ?? "Cancel"}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => close(true)}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {state.opts.confirmText ?? "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { confirm, dialog };
}