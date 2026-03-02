import { useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { AboutService } from '@/api';
import { Button, Loading } from '@/components/ui';
import { toast } from '@/utils/toast';
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
          toast.error(err.message || 'Failed to load about-us content');
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
      toast.success('About page updated');
    } catch (err) {
      toast.error(err.message || 'Failed to update about-us content');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6">
        {t('nav.about') || 'About page'}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow)] p-4">
          <h2 className="text-lg font-semibold text-[var(--color-primary)] mb-2">
            المحتوى العربي
          </h2>
          <p className="text-xs text-gray-500 mb-3">
            يمكنك كتابة المحتوى كاملاً (العناوين، الفقرات، القوائم) كما يظهر في صفحة "من نحن" في الموقع،
            وسيتم حفظه في حقل واحد `about_us_ar` كنص منسَّق (HTML).
          </p>
          <ReactQuill
            theme="snow"
            value={aboutUsAr}
            onChange={setAboutUsAr}
          />
        </section>

        <section className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow)] p-4">
          <h2 className="text-lg font-semibold text-[var(--color-primary)] mb-2">
            English content
          </h2>
          <p className="text-xs text-gray-500 mb-3">
            Write the full English version of the About page here. It will be stored in `about_us_en`.
          </p>
          <ReactQuill
            theme="snow"
            value={aboutUsEn}
            onChange={setAboutUsEn}
          />
        </section>

        <div className="flex justify-end">
          <Button type="submit" loading={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}

