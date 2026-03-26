import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FaqService } from '@/api';
import { DataTable, Button, Modal, Loading, IconView, IconEdit, IconTrash } from '@/components/ui';
import { useConfirm } from '@/utils/confirmDialog';
import { toast } from '@/utils/toast';
import { Input } from '@/components/ui/Input';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/LanguageContext';

export function Faqs() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formQuestionAr, setFormQuestionAr] = useState('');
  const [formQuestionEn, setFormQuestionEn] = useState('');
  const [formAnswerAr, setFormAnswerAr] = useState('');
  const [formAnswerEn, setFormAnswerEn] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const confirm = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await FaqService.getAll({
        search: search || undefined,
        page,
        per_page: 10,
      });
      setData(res.data);
      setMeta(res.meta);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, lang]);

  const fetchByUrl = useCallback(async (url) => {
    setLoading(true);
    try {
      const res = await FaqService.getPageByUrl(url);
      if (res) {
        setData(res.data);
        setMeta(res.meta);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const editId = searchParams.get('edit');
  useEffect(() => {
    if (!editId || loading) return;
    const id = Number(editId) || editId;
    const clearEdit = () => setSearchParams((p) => { const next = new URLSearchParams(p); next.delete('edit'); return next; });
    const row = data.find((r) => r.id == id || String(r.id) === String(id));
    if (row) {
      openEdit(row);
      clearEdit();
    } else {
      FaqService.getById(id)
        .then((res) => {
          const item = res?.faq ?? res?.data ?? res;
          if (item) openEdit(item);
          clearEdit();
        })
        .catch(() => clearEdit());
    }
  }, [editId, data, loading]);

  const openCreate = () => {
    setEditing(null);
    setFormQuestionAr('');
    setFormQuestionEn('');
    setFormAnswerAr('');
    setFormAnswerEn('');
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    const trans = row.translations || {};
    const ar = trans.ar || row;
    const en = trans.en || row;
    setFormQuestionAr(ar.question || row.question || '');
    setFormQuestionEn(en.question || row.question || '');
    setFormAnswerAr(ar.answer || row.answer || '');
    setFormAnswerEn(en.answer || row.answer || '');
    setModalOpen(true);
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append('question_ar', formQuestionAr || formQuestionEn || '');
    fd.append('question_en', formQuestionEn || formQuestionAr || '');
    fd.append('answer_ar', formAnswerAr || formAnswerEn || '');
    fd.append('answer_en', formAnswerEn || formAnswerAr || '');
    return fd;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await FaqService.update(editing.id, buildFormData());
        toast.success(t('faqs.toasts.updated', 'FAQ updated'));
      } else {
        await FaqService.create(buildFormData());
        toast.success(t('faqs.toasts.created', 'FAQ created'));
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (row) => {
    const q = row.question ?? row.translations?.ar?.question ?? row.translations?.en?.question ?? 'this';
    const ok = await confirm({
      title: t('faqs.deleteTitle'),
      message: t('faqs.deleteMessage', { question: q }),
      confirmLabel: t('common.delete'),
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await FaqService.remove(row.id);
      toast.success(t('faqs.toasts.deleted', 'FAQ deleted'));
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const getQuestion = (row) =>
    row.question ?? row.translations?.ar?.question ?? row.translations?.en?.question ?? '';

  const getAnswer = (row) =>
    row.answer ?? row.translations?.ar?.answer ?? row.translations?.en?.answer ?? '';

  if (loading && !data.length) return <Loading />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">{t('faqs.title')}</h1>
        <Button onClick={openCreate}>{t('faqs.add')}</Button>
      </div>
      <DataTable
        columns={[
          {
            key: 'question',
            header: t('faqs.columns.question'),
            render: (r) => getQuestion(r).slice(0, 60) + (getQuestion(r).length > 60 ? '...' : ''),
          },
          {
            key: 'answer',
            header: t('faqs.columns.answer'),
            render: (r) => getAnswer(r).slice(0, 50) + '...',
          },
        ]}
        data={data}
        meta={meta ?? undefined}
        onPageChange={(pageNum, linkUrl) => (linkUrl ? fetchByUrl(linkUrl) : setPage(pageNum))}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        emptyMessage={t('faqs.empty')}
        actions={(row) => (
          <div className="flex gap-1 justify-end">
            <Link to={`/faqs/${row.id}`}>
              <Button
                variant="ghost"
                className="!p-2 min-w-0"
                title={t('common.view')}
                aria-label={t('common.view')}
              >
                <IconView />
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="!p-2 min-w-0"
              title={t('common.edit')}
              aria-label={t('common.edit')}
              onClick={() => openEdit(row)}
            >
              <IconEdit />
            </Button>
            <Button
              variant="danger"
              className="!p-2 min-w-0"
              title={t('common.delete')}
              aria-label={t('common.delete')}
              onClick={() => handleDelete(row)}
            >
              <IconTrash />
            </Button>
          </div>
        )}
      />
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t('faqs.modalEdit') : t('faqs.modalCreate')}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('faqs.questionAr')}
            value={formQuestionAr}
            onChange={(e) => setFormQuestionAr(e.target.value)}
          />
          <Input
            label={t('faqs.questionEn')}
            value={formQuestionEn}
            onChange={(e) => setFormQuestionEn(e.target.value)}
            required
          />
          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">
              {t('faqs.answerAr')}
            </label>
            <textarea
              value={formAnswerAr}
              onChange={(e) => setFormAnswerAr(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)]"
              rows={3}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--color-primary)]">
              {t('faqs.answerEn')}
            </label>
            <textarea
              value={formAnswerEn}
              onChange={(e) => setFormAnswerEn(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-[var(--radius)] border border-[var(--color-border)]"
              rows={3}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={submitting}>
              {editing ? t('common.update') : t('common.create')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
