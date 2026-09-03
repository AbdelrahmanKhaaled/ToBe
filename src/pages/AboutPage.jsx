import { useEffect, useState } from 'react';
import { AboutService } from '@/api';
import { Button, Loading, RichTextField } from '@/components/ui';
import { toast } from '@/utils/toast';
import { toastApiError } from '@/utils/apiErrors';
import { useTranslation } from 'react-i18next';

function extractAboutFields(raw) {
  const root = raw?.data ?? raw?.about ?? raw ?? {};
  return {
    aboutUsAr:
      root.about_us_ar ??
      root.about_ar ??
      root.ar ??
      '',
    aboutUsEn:
      root.about_us_en ??
      root.about_en ??
      root.en ??
      '',
  };
}

export function AboutPage() {
  const { t } = useTranslation();
  const [aboutUsAr, setAboutUsAr] = useState('');
  const [aboutUsEn, setAboutUsEn] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await AboutService.get();
        if (cancelled) return;
        const { aboutUsAr: ar, aboutUsEn: en } = extractAboutFields(res);
        setAboutUsAr(ar || '');
        setAboutUsEn(en || '');
      } catch (err) {
        if (!cancelled) {
          toastApiError(err, toast, 'Failed to load about-us content');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await AboutService.update({ aboutUsAr, aboutUsEn });
      toast.success(t('about.updated', 'About page updated'));
    } catch (err) {
      toastApiError(err, toast, 'Failed to update about-us content');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-2">
        {t('nav.about') || 'About page'}
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        {t('about.editHint', 'Edit the About Us content here. Changes appear in the mobile app after saving.')}
      </p>
      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow)] p-4">
          <RichTextField
            label={t('about.contentAr', 'Arabic content')}
            value={aboutUsAr}
            onChange={setAboutUsAr}
          />
        </section>

        <section className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow)] p-4">
          <RichTextField
            label={t('about.contentEn', 'English content')}
            value={aboutUsEn}
            onChange={setAboutUsEn}
          />
        </section>

        <div className="flex justify-end">
          <Button type="submit" loading={saving}>
            {saving ? t('common.saving', 'Saving...') : t('common.saveChanges', 'Save changes')}
          </Button>
        </div>
      </form>
    </div>
  );
}
