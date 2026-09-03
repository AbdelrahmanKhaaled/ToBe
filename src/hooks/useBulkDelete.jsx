import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui';
import { toast } from '@/utils/toast';
import { toastApiError } from '@/utils/apiErrors';

async function deleteSequentially(ids, removeOne) {
  let failed = 0;
  for (const id of ids) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await removeOne(id);
    } catch {
      failed += 1;
    }
  }
  return failed;
}

/**
 * Bulk row selection + delete for DataTable list pages.
 * Pass `bulkDelete` when the API supports bulk-delete; otherwise pass `removeOne`.
 */
export function useBulkDelete({
  confirm,
  onDeleted,
  bulkDelete,
  removeOne,
  confirmTitle,
  confirmMessage,
  successMessage,
  partialErrorMessage,
  errorMessage,
}) {
  const { t } = useTranslation();
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const handleBulkDelete = useCallback(async () => {
    if (!selectedIds.length) return;
    const count = selectedIds.length;
    const message =
      typeof confirmMessage === 'function'
        ? confirmMessage(count)
        : confirmMessage ??
          t('common.bulkDeleteMessage', {
            count,
            defaultValue: 'Delete {{count}} items?',
          });

    const ok = await confirm({
      title: confirmTitle ?? t('common.bulkDeleteTitle', 'Delete selected items'),
      message,
      confirmLabel: t('common.delete'),
      variant: 'danger',
    });
    if (!ok) return;

    setBulkDeleting(true);
    try {
      if (bulkDelete) {
        await bulkDelete(selectedIds);
        toast.success(successMessage ?? t('common.bulkDeleted', 'Selected items deleted'));
      } else if (removeOne) {
        const failed = await deleteSequentially(selectedIds, removeOne);
        if (failed === 0) {
          toast.success(successMessage ?? t('common.bulkDeleted', 'Selected items deleted'));
        } else {
          toast.error(
            typeof partialErrorMessage === 'function'
              ? partialErrorMessage(failed)
              : t('common.bulkDeletePartial', {
                  failed,
                  defaultValue: '{{failed}} item(s) could not be deleted.',
                })
          );
        }
      }
      setSelectedIds([]);
      await onDeleted?.();
    } catch (err) {
      toastApiError(err, toast, errorMessage ?? t('common.bulkDeleteFailed', 'Bulk delete failed'));
    } finally {
      setBulkDeleting(false);
    }
  }, [
    selectedIds,
    confirm,
    bulkDelete,
    removeOne,
    confirmTitle,
    confirmMessage,
    successMessage,
    partialErrorMessage,
    errorMessage,
    onDeleted,
    t,
  ]);

  const tableSelectionProps = useMemo(
    () => ({
      selectable: true,
      selectedIds,
      onSelectionChange: setSelectedIds,
      bulkActions: (
        <Button variant="danger" loading={bulkDeleting} onClick={handleBulkDelete}>
          {t('common.deleteSelected', 'Delete selected')}
        </Button>
      ),
    }),
    [selectedIds, bulkDeleting, handleBulkDelete, t]
  );

  return { selectedIds, setSelectedIds, bulkDeleting, handleBulkDelete, tableSelectionProps };
}
