export const typography = {
  hero: 'text-4xl font-bold tracking-tight',
  h1: 'text-3xl font-bold tracking-tight',
  h2: 'text-2xl font-bold tracking-tight',
  h3: 'text-xl font-bold tracking-tight',
  h4: 'text-lg font-bold tracking-tight',
  body: 'text-base',
  small: 'text-sm',
  tiny: 'text-xs',
  subtitle: 'text-sm text-gray-500 dark:text-gray-400'
};

export const containers = {
  content: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  card: 'bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700',
  wrapper: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  section: 'max-w-7xl mx-auto'
};

export const interactive = {
  button: {
    accent: 'inline-flex items-center px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors',
    ghost: 'inline-flex items-center px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors',
    danger: 'inline-flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors'
  }
};

export const status = {
  success: {
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800'
  },
  error: {
    text: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800'
  },
  warning: {
    text: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800'
  },
  info: {
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800'
  },
  accent: {
    text: 'text-accent',
    bg: 'bg-accent/10',
    border: 'border-accent/20'
  }
};

export const spacing = {
  section: 'space-y-8',
  subsection: 'space-y-4',
  stack: 'space-y-2',
  inline: 'space-x-2',
  sm: 'space-y-2',
  md: 'space-y-4',
  lg: 'space-y-8',
  xl: 'space-y-12'
};

export const layout = {
  grid: {
    base: 'grid gap-4',
    cols2: 'grid-cols-1 sm:grid-cols-2',
    cols3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    cols4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  },
  flex: {
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    start: 'flex items-center justify-start',
    end: 'flex items-center justify-end',
    col: 'flex flex-col'
  },
  maxWidth: {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl'
  },
  contentPadding: {
    sm: 'px-4 py-2',
    md: 'px-6 py-4',
    lg: 'px-8 py-6',
    xl: 'px-12 py-8'
  },
  sectionSpacing: 'py-12 space-y-12'
};

export const forms = {
  input: 'w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent focus:border-transparent',
  select: 'w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-accent focus:border-transparent',
  checkbox: 'rounded border-gray-300 text-accent focus:ring-accent',
  radio: 'rounded-full border-gray-300 text-accent focus:ring-accent',
  label: 'block text-sm font-medium text-gray-700 dark:text-gray-300'
};
