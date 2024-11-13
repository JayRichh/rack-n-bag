import { XMarkIcon } from '@heroicons/react/24/outline';

interface FilterBadgeProps {
  label: string;
  value: string;
  onRemove: () => void;
}

export function FilterBadge({ label, value, onRemove }: FilterBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 max-w-full break-words">
      <span className="truncate">
        <span className="font-normal text-blue-600 dark:text-blue-300">{label}:</span>{' '}
        {value}
      </span>
      <button
        type="button"
        onClick={onRemove}
        className="inline-flex rounded-full p-1 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
      >
        <XMarkIcon className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="sr-only">Remove {label} filter</span>
      </button>
    </span>
  );
}
