import { useMemo } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';

/** Word-like point sizes shown in the toolbar dropdown. */
export const FONT_SIZES = [
  '8pt', '9pt', '10pt', '11pt', '12pt', '14pt', '16pt', '18pt', '20pt',
  '22pt', '24pt', '26pt', '28pt', '36pt', '48pt', '72pt',
];

const SizeStyle = Quill.import('attributors/style/size');
SizeStyle.whitelist = FONT_SIZES;
Quill.register(SizeStyle, true);

const DEFAULT_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ size: FONT_SIZES }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ script: 'sub' }, { script: 'super' }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    [{ align: [] }],
    ['blockquote', 'code-block'],
    ['link', 'image', 'video'],
    ['clean'],
  ],
};

const DEFAULT_FORMATS = [
  'header', 'size',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'script',
  'list', 'bullet', 'indent',
  'align',
  'blockquote', 'code-block',
  'link', 'image', 'video',
];

/**
 * Rich text editor — full Word-like toolbar with numeric font sizes (pt).
 */
export function RichTextEditor({ value, onChange, placeholder, className = '' }) {
  const modules = useMemo(() => DEFAULT_MODULES, []);

  return (
    <div className={`rich-text-editor ${className}`.trim()}>
      <ReactQuill
        theme="snow"
        value={value ?? ''}
        onChange={onChange}
        modules={modules}
        formats={DEFAULT_FORMATS}
        placeholder={placeholder}
      />
    </div>
  );
}

/** Label + rich text editor — use for bilingual content/description fields in forms. */
export function RichTextField({ label, value, onChange, placeholder, hint, className = '' }) {
  return (
    <div className={className}>
      {label ? (
        <label className="text-sm font-medium text-[var(--color-primary)] block mb-1">
          {label}
        </label>
      ) : null}
      {hint ? <p className="text-xs text-gray-500 mb-2">{hint}</p> : null}
      <RichTextEditor value={value} onChange={onChange} placeholder={placeholder} />
    </div>
  );
}
