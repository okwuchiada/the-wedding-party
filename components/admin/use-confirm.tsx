"use client";

import { useCallback, useRef, useState } from "react";
import ConfirmModal, { type ConfirmOptions } from "./confirm-modal";

export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<(value: boolean) => void>(null);
  // Whatever had focus when the dialog opened gets it back when it closes.
  const openerRef = useRef<HTMLElement | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    openerRef.current = document.activeElement as HTMLElement | null;
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const close = (value: boolean) => {
    resolverRef.current?.(value);
    setOptions(null);
    const opener = openerRef.current;
    setTimeout(() => opener?.focus(), 0);
  };

  const handleConfirm = () => close(true);
  const handleCancel = () => close(false);

  const confirmDialog = (
    <ConfirmModal
      open={options !== null}
      title={options?.title ?? ""}
      description={options?.description}
      confirmLabel={options?.confirmLabel}
      cancelLabel={options?.cancelLabel}
      danger={options?.danger}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { confirm, confirmDialog };
}
