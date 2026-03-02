import { useContext } from 'react';
import { ConfirmContext } from '@/utils/confirmDialog';
import { Modal } from './Modal';
import { Button } from './Button';

export function ConfirmDialog() {
  const ctx = useContext(ConfirmContext);

  if (!ctx || !ctx.open || !ctx.options) return null;

  const { title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'default' } = ctx.options;
  const isDanger = variant === 'danger';

  return (
    <Modal open={ctx.open} onClose={ctx.onCancel} title={title}>
      <p className="text-[var(--color-primary)] mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={ctx.onCancel}>
          {cancelLabel}
        </Button>
        <Button variant={isDanger ? 'danger' : 'primary'} onClick={ctx.onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
