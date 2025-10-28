import * as React from 'react';
import { cn } from '@/lib/cn';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'ghost'; size?: 'sm' | 'md' };
export function Button({ className, variant='default', size='md', ...props }: Props) {
  const base = 'inline-flex items-center justify-center rounded-lg font-medium transition';
  const sizes = size === 'sm' ? 'h-8 px-3 text-xs' : 'h-10 px-4 text-sm';
  const variants = variant === 'ghost'
    ? 'bg-transparent hover:bg-muted'
    : 'bg-primary text-primary-foreground hover:opacity-90';
  return <button className={cn(base, sizes, variants, className)} {...props} />;
}
