import React from 'react';

interface FormInputProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'tel' | 'textarea';
  value: string;
  onChange: (name: string, value: string) => void;
  onBlur: (name: string) => void;
  error?: string;
  touched?: boolean;
  required?: boolean;
  placeholder?: string;
}

export function FormInput({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  touched,
  required,
  placeholder,
}: FormInputProps): JSX.Element {
  const showError = touched && error;
  const inputClasses = `block w-full rounded-md shadow-sm sm:text-sm ${showError
      ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
    }`;

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="mt-1">
        {type === 'textarea' ? (
          <textarea
            id={name}
            name={name}
            rows={3}
            className={inputClasses}
            value={value}
            onChange={(e) => onChange(name, e.target.value)}
            onBlur={() => onBlur(name)}
            placeholder={placeholder}
          />
        ) : (
          <input
            type={type}
            id={name}
            name={name}
            className={inputClasses}
            value={value}
            onChange={(e) => onChange(name, e.target.value)}
            onBlur={() => onBlur(name)}
            placeholder={placeholder}
            required={required}
          />
        )}
      </div>
      {showError && (
        <p className="mt-2 text-sm text-red-600" id={`${name}-error`}>
          {error}
        </p>
      )}
    </div>
  );
} 