import { useState, useCallback } from 'react';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  pattern?: RegExp;
  message: string;
}

interface ValidationRules {
  [key: string]: ValidationRule;
}

interface FormValues {
  [key: string]: string;
}

interface FormErrors {
  [key: string]: string;
}

interface FormTouched {
  [key: string]: boolean;
}

interface UseFormValidationReturn {
  values: FormValues;
  errors: FormErrors;
  touched: FormTouched;
  handleChange: (name: string, value: string) => void;
  handleBlur: (name: string) => void;
  validateForm: () => boolean;
  resetForm: () => void;
}

/**
 * Custom hook for form validation
 * @param {FormValues} initialValues - Initial form values
 * @param {ValidationRules} validationRules - Validation rules for each field
 * @returns {UseFormValidationReturn} Form validation state and handlers
 */
export function useFormValidation(
  initialValues: FormValues,
  validationRules: ValidationRules
): UseFormValidationReturn {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<FormTouched>({});

  const validateField = useCallback(
    (name: string, value: string) => {
      const rule = validationRules[name];
      if (!rule) return '';

      if (rule.required && !value) {
        return rule.message;
      }

      if (rule.minLength && value.length < rule.minLength) {
        return rule.message;
      }

      if (rule.pattern && !rule.pattern.test(value)) {
        return rule.message;
      }

      return '';
    },
    [validationRules]
  );

  const handleChange = useCallback(
    (name: string, value: string) => {
      setValues(prev => ({ ...prev, [name]: value }));
      if (touched[name]) {
        const error = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: error }));
      }
    },
    [touched, validateField]
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
    const newErrors: FormErrors = {};
    const newTouched: FormTouched = {};
    let isValid = true;

    Object.keys(validationRules).forEach(name => {
      const error = validateField(name, values[name]);
      newTouched[name] = true; // Mark all fields as touched during form validation
      if (error) {
        newErrors[name] = error;
        isValid = false;
      }
    });

    // Update both errors and touched states synchronously
    setErrors(newErrors);
    setTouched(prev => ({ ...prev, ...newTouched }));
    return isValid;
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
  };
}
