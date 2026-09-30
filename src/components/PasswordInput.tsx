import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  label = 'Password',
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || `pwd_${Math.random().toString(36).substring(2, 9)}`;

  const toggleVisibility = () => {
    setShowPassword(prev => !prev);
  };

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-bold text-zinc-300 uppercase tracking-wider"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        <input
          {...props}
          id={inputId}
          type={showPassword ? 'text' : 'password'}
          className={`w-full px-3.5 py-2.5 pr-11 bg-[#0D131C] border ${
            error
              ? 'border-red-500/80 focus:border-red-400'
              : 'border-white/15 focus:border-[#00A86B]'
          } text-white text-sm rounded-xl outline-none placeholder:text-zinc-500 transition-colors ${className}`}
        />

        <button
          type="button"
          onClick={toggleVisibility}
          tabIndex={-1}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          className="absolute right-3 p-1.5 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer select-none focus:outline-none"
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4 text-[#00A86B]" />
          ) : (
            <Eye className="w-4 h-4 text-zinc-400" />
          )}
        </button>
      </div>

      {error ? (
        <p className="text-[11px] text-red-400 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-zinc-400">{helperText}</p>
      ) : null}
    </div>
  );
};
