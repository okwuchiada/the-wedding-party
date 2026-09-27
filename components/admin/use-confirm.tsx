"use client";

import { useCallback, useRef, useState } from "react";
import ConfirmModal, { type ConfirmOptions } from "./confirm-modal";

export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  // The dialog animates out after closing; keep showing what it asked meanwhile.
  const [shown, setShown] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<(value: boolean) => void>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setShown(opts);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const settle = (value: boolean) => {
    resolverRef.current?.(value);
    // Closing the dialog after a confirm also reports a cancel; only the first answer counts.
    resolverRef.current = null;
    setOptions(null);
  };

  const handleConfirm = () => settle(true);
  const handleCancel = () => settle(false);

  const confirmDialog = (
    <ConfirmModal
      open={options !== null}
      title={shown?.title ?? ""}
      description={shown?.description}
      confirmLabel={shown?.confirmLabel}
      cancelLabel={shown?.cancelLabel}
      danger={shown?.danger}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { confirm, confirmDialog };
}
