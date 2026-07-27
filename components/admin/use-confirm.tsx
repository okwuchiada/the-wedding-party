"use client";

import { useCallback, useRef, useState } from "react";
import ConfirmModal, { type ConfirmOptions } from "./confirm-modal";

export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<(value: boolean) => void>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const handleConfirm = () => {
    resolverRef.current?.(true);
    setOptions(null);
  };

  const handleCancel = () => {
    resolverRef.current?.(false);
    setOptions(null);
  };

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
