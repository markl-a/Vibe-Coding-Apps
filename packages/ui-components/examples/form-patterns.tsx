/**
 * Form Patterns Examples
 * Demonstrates form building with validation using ui-components
 */

import React, { useState, FormEvent } from 'react';
import { Input, Button, Card } from '@vibe/ui-components';

// Example 1: Basic Login Form with Validation
export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    // Email validation
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Login successful:', { email, password });
      alert('Login successful!');
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card padding="lg" className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-2xl font-bold mb-6">Login</h2>

        <Input
          id="email"
          type="email"
          label="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          placeholder="you@example.com"
          required
          disabled={isLoading}
          leftElement={
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          }
        />

        <Input
          id="password"
          type="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          placeholder="Enter your password"
          required
          disabled={isLoading}
          leftElement={
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          }
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          isLoading={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
    </Card>
  );
}

// Example 2: Registration Form with Complex Validation
export function RegistrationForm() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'username':
        if (!value) return 'Username is required';
        if (value.length < 3) return 'Username must be at least 3 characters';
        if (!/^[a-zA-Z0-9_-]+$/.test(value)) return 'Username can only contain letters, numbers, _ and -';
        break;

      case 'email':
        if (!value) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
        break;

      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!/(?=.*[a-z])/.test(value)) return 'Password must contain a lowercase letter';
        if (!/(?=.*[A-Z])/.test(value)) return 'Password must contain an uppercase letter';
        if (!/(?=.*\d)/.test(value)) return 'Password must contain a number';
        break;

      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== formData.password) return 'Passwords do not match';
        break;

      case 'phone':
        if (value && !/^[0-9\s\-()]+$/.test(value)) return 'Invalid phone number format';
        break;
    }
  };

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));

    // Validate on change if field has been touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error || '',
      }));
    }
  };

  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name as keyof typeof formData]);
    setErrors(prev => ({
      ...prev,
      [name]: error || '',
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: Record<string, string> = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) newErrors[key] = error;
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Registration successful:', formData);
      alert('Registration successful!');
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card padding="lg" className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-2xl font-bold mb-6">Create Account</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="username"
            label="Username"
            value={formData.username}
            onChange={(e) => handleChange('username', e.target.value)}
            onBlur={() => handleBlur('username')}
            error={touched.username ? errors.username : undefined}
            helperText="3-20 characters, letters, numbers, _ and - only"
            required
            disabled={isSubmitting}
          />

          <Input
            id="email"
            type="email"
            label="Email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            error={touched.email ? errors.email : undefined}
            required
            disabled={isSubmitting}
          />
        </div>

        <Input
          id="phone"
          type="tel"
          label="Phone Number"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          onBlur={() => handleBlur('phone')}
          error={touched.phone ? errors.phone : undefined}
          helperText="Optional"
          placeholder="+1 (555) 123-4567"
          disabled={isSubmitting}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="password"
            type="password"
            label="Password"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            onBlur={() => handleBlur('password')}
            error={touched.password ? errors.password : undefined}
            helperText="Min 8 chars, uppercase, lowercase, number"
            required
            disabled={isSubmitting}
          />

          <Input
            id="confirmPassword"
            type="password"
            label="Confirm Password"
            value={formData.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            onBlur={() => handleBlur('confirmPassword')}
            error={touched.confirmPassword ? errors.confirmPassword : undefined}
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="flex-1"
            disabled={isSubmitting}
            onClick={() => {
              setFormData({
                username: '',
                email: '',
                password: '',
                confirmPassword: '',
                phone: '',
              });
              setErrors({});
              setTouched({});
            }}
          >
            Reset
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="flex-1"
            isLoading={isSubmitting}
          >
            Create Account
          </Button>
        </div>
      </form>
    </Card>
  );
}

// Example 3: Form with Dynamic Fields
export function DynamicFieldsForm() {
  const [emails, setEmails] = useState<string[]>(['']);
  const [errors, setErrors] = useState<string[]>([]);

  const addEmail = () => {
    setEmails([...emails, '']);
    setErrors([...errors, '']);
  };

  const removeEmail = (index: number) => {
    setEmails(emails.filter((_, i) => i !== index));
    setErrors(errors.filter((_, i) => i !== index));
  };

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);

    // Validate
    const newErrors = [...errors];
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      newErrors[index] = 'Invalid email format';
    } else {
      newErrors[index] = '';
    }
    setErrors(newErrors);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const validEmails = emails.filter(email => email && !errors[emails.indexOf(email)]);
    console.log('Valid emails:', validEmails);
    alert(`Submitted ${validEmails.length} valid email(s)`);
  };

  return (
    <Card padding="lg" className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Team Invites</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addEmail}
            leftIcon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Add Email
          </Button>
        </div>

        {emails.map((email, index) => (
          <div key={index} className="flex gap-2 items-start">
            <div className="flex-1">
              <Input
                id={`email-${index}`}
                type="email"
                label={`Email ${index + 1}`}
                value={email}
                onChange={(e) => updateEmail(index, e.target.value)}
                error={errors[index]}
                placeholder="colleague@example.com"
              />
            </div>
            {emails.length > 1 && (
              <Button
                type="button"
                variant="danger"
                size="md"
                onClick={() => removeEmail(index)}
                className="mt-7"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </Button>
            )}
          </div>
        ))}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-6"
        >
          Send Invites
        </Button>
      </form>
    </Card>
  );
}

// Example 4: Search Form with Instant Validation
export function SearchForm() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const handleSearch = async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Simulate API search
      await new Promise(resolve => setTimeout(resolve, 500));
      setResults([
        `Result 1 for "${searchQuery}"`,
        `Result 2 for "${searchQuery}"`,
        `Result 3 for "${searchQuery}"`,
      ]);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Card padding="lg" className="max-w-2xl mx-auto">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Search</h2>

        <Input
          id="search"
          type="search"
          label="Search Query"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            handleSearch(e.target.value);
          }}
          placeholder="Type at least 3 characters..."
          helperText={`${query.length} characters entered`}
          leftElement={
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
          rightElement={
            isSearching ? (
              <svg className="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : null
          }
        />

        {results.length > 0 && (
          <div className="mt-4 space-y-2">
            <h3 className="font-semibold">Results:</h3>
            <ul className="list-disc list-inside space-y-1">
              {results.map((result, index) => (
                <li key={index} className="text-gray-700">{result}</li>
              ))}
            </ul>
          </div>
        )}

        {query.length > 0 && query.length < 3 && (
          <p className="text-sm text-gray-500">Type at least 3 characters to search</p>
        )}
      </div>
    </Card>
  );
}
