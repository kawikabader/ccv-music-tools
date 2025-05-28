import React from 'react';

interface FormInputProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  error?: string;
  touched?: boolean;
  onChange: (name: string, value: string) => void;
  onBlur: (name: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function FormInput({
  label,
  name,
  type = 'text',
  value,
  error,
  touched,
  onChange,
  onBlur,
  placeholder,
  required,
  className = '',
}: FormInputProps): JSX.Element {
  const showError = touched && error;

  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="mt-1">
        <input
          type={type}
          name={name}
          id={name}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          onBlur={() => onBlur(name)}
          placeholder={placeholder}
          className={`block w-full rounded-md shadow-sm sm:text-sm ${showError
              ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
            }`}
        />
      </div>
      {showError && (
        <p className="mt-2 text-sm text-red-600" id={`${name}-error`}>
          {error}
        </p>
      )}
    </div>
  );
} 