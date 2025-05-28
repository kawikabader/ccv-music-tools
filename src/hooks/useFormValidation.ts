import { useState, useCallback } from 'react';

interface ValidationRules {
  [key: string]: {
    required?: boolean;
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
    custom?: (value: string) => boolean;
    message?: string;
  };
}

interface ValidationErrors {
  [key: string]: string;
}

export function useFormValidation(
  initialValues: { [key: string]: string },
  validationRules: ValidationRules
) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  const validateField = useCallback(
    (name: string, value: string) => {
      const rules = validationRules[name];
      if (!rules) return '';

      if (rules.required && !value) {
        return rules.message || `${name} is required`;
      }

      if (rules.pattern && !rules.pattern.test(value)) {
        return rules.message || `${name} is invalid`;
      }

      if (rules.minLength && value.length < rules.minLength) {
        return rules.message || `${name} must be at least ${rules.minLength} characters`;
      }

      if (rules.maxLength && value.length > rules.maxLength) {
        return rules.message || `${name} must be at most ${rules.maxLength} characters`;
      }

      if (rules.custom && !rules.custom(value)) {
        return rules.message || `${name} is invalid`;
      }

      return '';
    },
    [validationRules]
  );

  const handleChange = useCallback(
    (name: string, value: string) => {
      setValues(prev => ({ ...prev, [name]: value }));
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    },
    [validateField]
  );

  const handleBlur = useCallback(
    (name: string) => {
      setTouched(prev => ({ ...prev, [name]: true }));
      const error = validateField(name, values[name]);
      setErrors(prev => ({ ...prev, [name]: error }));
    },
    [validateField, values]
  );

  const validateForm = useCallback(() => {
    const newErrors: ValidationErrors = {};
    Object.keys(validationRules).forEach(name => {
      const error = validateField(name, values[name]);
      if (error) {
        newErrors[name] = error;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [validateField, validationRules, values]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
    resetForm,
    setValues,
  };
}
