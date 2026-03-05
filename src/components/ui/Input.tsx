'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-colors ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
export default Input;
