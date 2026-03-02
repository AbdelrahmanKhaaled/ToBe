import { useEffect, useState } from 'react';
import { toast as toastUtil } from '@/utils/toast';

const typeStyles = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-blue-600 text-white',
  warning: 'bg-amber-600 text-white',
};

export function ToastContainer() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let id = 0;
    return toastUtil.subscribe((message, type) => {
      const currentId = ++id;
      setItems((prev) => [...prev, { id: currentId, message, type }]);
      setTimeout(() => {
        setItems((prev) => prev.filter((i) => i.id !== currentId));
      }, 4000);
    });
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {items.map(({ id, message, type }) => (
        <div
          key={id}
          className={`px-4 py-3 rounded-[var(--radius)] shadow-[var(--shadow-md)] ${typeStyles[type]}`}
        >
          {message}
        </div>
      ))}
    </div>
  );
}
