// Typography scale
export const typography = {
  hero: 'text-4xl font-black tracking-tight text-foreground font-display [text-shadow:_0_1px_2px_rgba(0,0,0,0.1)]',
  h1: 'text-4xl font-bold tracking-tight text-foreground font-display [text-shadow:_0_1px_1px_rgba(0,0,0,0.05)]',
  h2: 'text-2xl font-semibold tracking-tight text-foreground [text-shadow:_0_1px_1px_rgba(0,0,0,0.05)]',
  h3: 'text-xl font-medium text-foreground',
  body: 'text-base leading-relaxed text-foreground/90 font-medium',
  small: 'text-sm text-muted-foreground',
  tiny: 'text-xs uppercase tracking-wider text-muted-foreground',
  subtitle: 'text-lg sm:text-xl font-medium tracking-wide text-foreground/80 [text-shadow:_0_1px_1px_rgba(255,255,255,0.1)]',
};

// Spacing scale (in rem units, multiply by 4 for pixels)
export const spacing = {
  xs: 'space-y-2',  // 8px
  sm: 'space-y-4',  // 16px
  md: 'space-y-6',  // 24px
  lg: 'space-y-8',  // 32px
  xl: 'space-y-12', // 48px
};

// Container styles
export const containers = {
  card: 'bg-card text-card-foreground rounded-xl shadow-sm hover:shadow-md transition-shadow duration-150 border border-border p-6',
  section: 'bg-card text-card-foreground rounded-xl shadow-sm p-6 border border-border',
  grid: 'grid gap-6',
  content: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12',
  wrapper: 'w-full max-w-7xl mx-auto',
  hero: 'relative backdrop-blur-[2px] rounded-xl bg-gradient-to-b from-background/40 to-transparent p-6',
};

// Interactive element styles
export const interactive = {
  button: {
    primary: 'inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors duration-150',
    secondary: 'inline-flex items-center justify-center px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-medium hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 transition-colors duration-150 border border-border',
    ghost: 'inline-flex items-center justify-center px-4 py-2 rounded-lg text-foreground font-medium hover:bg-muted/10 focus:outline-none focus:ring-2 focus:ring-muted focus:ring-offset-2 transition-colors duration-150',
    accent: 'inline-flex items-center justify-center px-4 py-2 rounded-lg bg-accent text-accent-foreground font-medium hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-colors duration-150',
  },
  input: 'w-full rounded-lg border border-border/30 dark:border-border/50 bg-background dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark placeholder-text-secondary-light/50 dark:placeholder-text-secondary-dark/50 focus:border-primary-400 dark:focus:border-primary-300 focus:ring-2 focus:ring-primary-400/20 dark:focus:ring-primary-300/20 transition-colors duration-150 px-4 py-2 font-medium',
  select: 'w-full rounded-lg border border-border/30 dark:border-border/50 bg-background dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark focus:border-primary-400 dark:focus:border-primary-300 focus:ring-2 focus:ring-primary-400/20 dark:focus:ring-primary-300/20 transition-colors duration-150 px-4 py-2 font-medium',
};

// Status and state colors
export const status = {
  success: {
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  warning: {
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/50',
    border: 'border-amber-200 dark:border-amber-800',
  },
  error: {
    text: 'text-accent dark:text-accent',
    bg: 'bg-accent/10 dark:bg-accent/20',
    border: 'border-accent/20 dark:border-accent/30',
  },
  info: {
    text: 'text-primary dark:text-primary',
    bg: 'bg-primary/10 dark:bg-primary/20',
    border: 'border-primary/20 dark:border-primary/30',
  },
};

// Layout utilities
export const layout = {
  maxWidth: 'max-w-7xl mx-auto',
  contentPadding: 'px-4 sm:px-6 lg:px-8 py-6 sm:py-8',
  sectionSpacing: 'py-8 sm:py-12',
  pageWrapper: 'min-h-screen bg-background text-foreground',
};

// Table styles
export const table = {
  container: 'overflow-x-auto rounded-xl border border-border',
  wrapper: 'min-w-full',
  header: 'bg-muted/10 dark:bg-muted/5',
  headerCell: 'px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider',
  row: 'hover:bg-muted/5 dark:hover:bg-muted/10 transition-colors duration-150',
  cell: 'px-6 py-4 whitespace-nowrap text-sm text-foreground',
  footer: 'bg-muted/10 dark:bg-muted/5',
};

// Animation utilities
export const animation = {
  fadeIn: 'animate-fadeIn',
  slideIn: 'animate-slideIn',
  pulse: 'animate-pulse',
};
