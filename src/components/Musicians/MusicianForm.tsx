import React from 'react';
import { useFormValidation } from '../../hooks/useFormValidation';
import { FormInput } from '../Common/FormInput';

interface MusicianFormProps {
  initialValues?: {
    name: string;
    instrument: string;
    email: string;
    phone: string;
    experience: string;
    availability: string;
    notes: string;
    status: 'active' | 'inactive';
  };
  onSubmit: (values: any) => void;
  onCancel: () => void;
}

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

const defaultValues = {
  name: '',
  instrument: '',
  email: '',
  phone: '',
  experience: '',
  availability: '',
  notes: '',
  status: 'active' as const,
};

export function MusicianForm({ initialValues = defaultValues, onSubmit, onCancel }: MusicianFormProps): JSX.Element {
  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
    resetForm,
  } = useFormValidation(initialValues, validationRules);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(values);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
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
        </div>

        <div className="sm:col-span-2">
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
        </div>

        <div className="sm:col-span-2 sm:grid sm:grid-cols-2 sm:gap-4">
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
        </div>

        <div className="sm:col-span-2 sm:grid sm:grid-cols-2 sm:gap-4">
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
        </div>

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

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {initialValues ? 'Update' : 'Add'} Musician
        </button>
      </div>
    </form>
  );
} 