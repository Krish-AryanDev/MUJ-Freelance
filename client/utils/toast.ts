type ToastVariant = 'success' | 'error' | 'info';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
}

const variantClasses: Record<ToastVariant, string> = {
  success: 'border-green-200 bg-green-50 text-green-900',
  error: 'border-red-200 bg-red-50 text-red-900',
  info: 'border-zinc-200 bg-white text-zinc-900',
};

const ensureContainer = (): HTMLElement | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  const existing = document.getElementById('app-toaster');
  if (existing) {
    return existing;
  }

  const container = document.createElement('div');
  container.id = 'app-toaster';
  container.className = 'pointer-events-none fixed inset-0 z-[100]';
  document.body.appendChild(container);
  return container;
};

export const showToast = ({
  title,
  description,
  variant = 'info',
  durationMs = 2800,
}: ToastOptions): void => {
  const container = ensureContainer();
  if (!container) {
    return;
  }

  const toast = document.createElement('div');
  toast.className = [
    'pointer-events-auto absolute right-4 top-4 max-w-sm rounded-lg border px-4 py-3 shadow-lg',
    variantClasses[variant],
  ].join(' ');

  const titleNode = document.createElement('p');
  titleNode.className = 'text-sm font-semibold';
  titleNode.textContent = title;
  toast.appendChild(titleNode);

  if (description) {
    const descriptionNode = document.createElement('p');
    descriptionNode.className = 'mt-1 text-xs opacity-90';
    descriptionNode.textContent = description;
    toast.appendChild(descriptionNode);
  }

  container.appendChild(toast);

  window.setTimeout(() => {
    toast.remove();
  }, durationMs);
};

export const toast = {
  success: (title: string, description?: string) =>
    showToast({ title, description, variant: 'success' }),
  error: (title: string, description?: string) =>
    showToast({ title, description, variant: 'error' }),
  info: (title: string, description?: string) => showToast({ title, description, variant: 'info' }),
};

export default toast;