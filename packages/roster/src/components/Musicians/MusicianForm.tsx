import React from 'react';
import { useFormValidation } from '../../hooks/useFormValidation';
import { FormInput } from '../Common/FormInput';
import type { Musician } from '../../types';

/**
 * Props for the MusicianForm component
 * @interface MusicianFormProps
 * @property {Musician} [initialValues] - Initial values for the form when editing an existing musician
 * @property {function} onSubmit - Callback function when form is submitted with valid data
 * @property {function} onCancel - Callback function when form submission is cancelled
 */
interface MusicianFormProps {
  initialValues?: Musician;
  onSubmit: (values: Musician) => void;
  onCancel: () => void;
}

/**
 * Form validation rules for musician data
 * @constant
 */
const validationRules = {
  name: {
    required: true,
    minLength: 2,
    message: 'Name must be at least 2 characters long',
  },
  instrument: {
    required: true,
    message: 'Instrument is required',
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
  experience: {
    required: true,
    message: 'Experience is required',
  },
  availability: {
    required: true,
    message: 'Availability is required',
  },
};

/**
 * MusicianForm Component
 * 
 * A form component for adding or editing musician information.
 * Handles form validation, submission, and cancellation.
 * 
 * @param {MusicianFormProps} props - Component props
 * @returns {JSX.Element} Rendered form component
 */
export const MusicianForm: React.FC<MusicianFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
}) => {
  // Initialize form with default values or provided initial values
  const defaultValues = {
    name: '',
    instrument: '',
    email: '',
    phone: '',
    experience: '',
    availability: '',
    notes: '',
    status: 'active' as const,
    ...initialValues,
  };

  // Use custom form validation hook
  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
    resetForm,
  } = useFormValidation(defaultValues, validationRules);

  /**
   * Handles form submission
   * @param {React.FormEvent} e - Form submission event
   */
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(values as unknown as Musician);
      if (!initialValues) {
        resetForm();
      }
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
        {/* Name input field */}
        <FormInput
          label="Name"
          name="name"
          type="text"
          value={values.name}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.name}
          touched={touched.name}
          required
        />

        {/* Instrument input field */}
        <FormInput
          label="Instrument"
          name="instrument"
          type="text"
          value={values.instrument}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.instrument}
          touched={touched.instrument}
          required
        />

        {/* Email input field */}
        <FormInput
          label="Email"
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.email}
          touched={touched.email}
          required
        />

        {/* Phone input field */}
        <FormInput
          label="Phone"
          name="phone"
          type="tel"
          value={values.phone}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.phone}
          touched={touched.phone}
          required
        />

        {/* Experience input field */}
        <FormInput
          label="Experience"
          name="experience"
          type="text"
          value={values.experience}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.experience}
          touched={touched.experience}
          required
        />

        {/* Availability input field */}
        <FormInput
          label="Availability"
          name="availability"
          type="text"
          value={values.availability}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.availability}
          touched={touched.availability}
          required
        />

        {/* Notes textarea field */}
        <div className="sm:col-span-2">
          <FormInput
            label="Notes"
            name="notes"
            type="textarea"
            value={values.notes}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.notes}
            touched={touched.notes}
          />
        </div>

        {/* Status select field */}
        <div className="sm:col-span-2">
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={values.status}
            onChange={(e) => handleChange('status', e.target.value)}
            onBlur={() => handleBlur('status')}
            className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md ${touched.status && errors.status ? 'border-red-300' : ''
              }`}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {touched.status && errors.status && (
            <p className="mt-2 text-sm text-red-600">{errors.status}</p>
          )}
        </div>
      </div>

      {/* Form action buttons */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {initialValues ? 'Update Musician' : 'Add Musician'}
        </button>
      </div>
    </form>
  );
}; 