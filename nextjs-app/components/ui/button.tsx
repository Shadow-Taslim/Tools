import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all rounded-xl cursor-pointer disabled:opacity-50 disabled:pointer-events-none select-none';
    
    const variants = {
      primary: 'bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 active:bg-cyan-600 text-slate-950 shadow-md shadow-cyan-500/20',
      secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80',
      outline: 'bg-transparent border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-white',
      danger: 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60',
      ghost: 'bg-transparent hover:bg-slate-800/60 text-slate-400 hover:text-white'
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3.5 text-base'
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {isLoading && (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
