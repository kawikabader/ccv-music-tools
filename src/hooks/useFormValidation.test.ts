import { renderHook, act } from '@testing-library/react';
import { useFormValidation } from './useFormValidation';

describe('useFormValidation', () => {
  const initialValues = {
    name: '',
    email: '',
    phone: '',
  };

  const validationRules = {
    name: {
      required: true,
      minLength: 2,
      message: 'Name must be at least 2 characters long',
    },
    email: {
      required: true,
      pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: 'Invalid email address',
    },
    phone: {
      required: true,
      pattern: /^\+?[\d\s-]{10,}$/,
      message: 'Invalid phone number',
    },
  };

  it('initializes with default values', () => {
    const { result } = renderHook(() => useFormValidation(initialValues, validationRules));

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
  });

  it('handles field changes', () => {
    const { result } = renderHook(() => useFormValidation(initialValues, validationRules));

    act(() => {
      result.current.handleChange('name', 'John');
    });

    expect(result.current.values.name).toBe('John');
  });

  it('handles field blur', () => {
    const { result } = renderHook(() => useFormValidation(initialValues, validationRules));

    act(() => {
      result.current.handleBlur('name');
    });

    expect(result.current.touched.name).toBe(true);
  });

  it('validates required fields', () => {
    const { result } = renderHook(() => useFormValidation(initialValues, validationRules));

    act(() => {
      result.current.handleBlur('name');
    });

    expect(result.current.errors.name).toBe('Name must be at least 2 characters long');
  });

  it('validates email format', () => {
    const { result } = renderHook(() => useFormValidation(initialValues, validationRules));

    act(() => {
      result.current.handleChange('email', 'invalid-email');
      result.current.handleBlur('email');
    });

    expect(result.current.errors.email).toBe('Invalid email address');
  });

  it('validates phone number format', () => {
    const { result } = renderHook(() => useFormValidation(initialValues, validationRules));

    act(() => {
      result.current.handleChange('phone', '123');
      result.current.handleBlur('phone');
    });

    expect(result.current.errors.phone).toBe('Invalid phone number');
  });

  it('clears errors when valid values are entered', () => {
    const { result } = renderHook(() => useFormValidation(initialValues, validationRules));

    act(() => {
      result.current.handleChange('name', 'John');
      result.current.handleBlur('name');
    });

    expect(result.current.errors.name).toBeUndefined();
  });

  it('validates entire form', () => {
    const { result } = renderHook(() => useFormValidation(initialValues, validationRules));

    act(() => {
      const isValid = result.current.validateForm();
      expect(isValid).toBe(false);
    });

    expect(result.current.errors).toEqual({
      name: 'Name must be at least 2 characters long',
      email: 'Invalid email address',
      phone: 'Invalid phone number',
    });
  });

  it('returns true when form is valid', () => {
    const { result } = renderHook(() => useFormValidation(initialValues, validationRules));

    act(() => {
      result.current.handleChange('name', 'John');
      result.current.handleChange('email', 'john@example.com');
      result.current.handleChange('phone', '+1234567890');
    });

    act(() => {
      const isValid = result.current.validateForm();
      expect(isValid).toBe(true);
    });

    expect(result.current.errors).toEqual({});
  });

  it('resets form to initial values', () => {
    const { result } = renderHook(() => useFormValidation(initialValues, validationRules));

    act(() => {
      result.current.handleChange('name', 'John');
      result.current.handleChange('email', 'john@example.com');
      result.current.handleChange('phone', '+1234567890');
    });

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
  });
});
