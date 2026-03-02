import { createContext, useCallback, useContext, useState } from 'react';

export const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState(null);
  const [resolveRef, setResolveRef] = useState(null);

  const confirm = useCallback((opts) => {
    return new Promise((resolve) => {
      setOptions(opts);
      setResolveRef(() => resolve);
      setOpen(true);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    resolveRef?.(true);
    setOpen(false);
    setOptions(null);
    setResolveRef(null);
  }, [resolveRef]);

  const handleCancel = useCallback(() => {
    resolveRef?.(false);
    setOpen(false);
    setOptions(null);
    setResolveRef(null);
  }, [resolveRef]);

  return (
    <ConfirmContext.Provider
      value={{
        confirm,
        open,
        options,
        resolve: resolveRef,
        onConfirm: handleConfirm,
        onCancel: handleCancel,
      }}
    >
      {children}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx.confirm;
}
