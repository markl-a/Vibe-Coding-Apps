/**
 * Modal Dialog Examples
 * Demonstrates various modal patterns including confirmations, forms, and nested modals
 */

import React, { useState } from 'react';
import { Modal, Button, Input, Card } from '@vibe/ui-components';

// Example 1: Confirmation Modal
export function ConfirmationModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsDeleting(false);
    setIsOpen(false);
    alert('Item deleted successfully!');
  };

  return (
    <div className="p-6">
      <Button variant="danger" onClick={() => setIsOpen(true)}>
        Delete Item
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => !isDeleting && setIsOpen(false)}
        title="Confirm Deletion"
        size="sm"
        closeOnOverlayClick={!isDeleting}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Are you sure?
              </h3>
              <p className="text-sm text-gray-600">
                This action cannot be undone. This will permanently delete the item and remove all associated data.
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Example 2: Form Modal
export function FormModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Form submitted:', formData);
      alert('Message sent successfully!');
      setIsOpen(false);
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      console.error('Submit failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setIsOpen(false);
      setFormData({ name: '', email: '', message: '' });
      setErrors({});
    }
  };

  return (
    <div className="p-6">
      <Button variant="primary" onClick={() => setIsOpen(true)}>
        Contact Us
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Send us a message"
        size="md"
        closeOnOverlayClick={!isSubmitting}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="name"
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
            placeholder="Your name"
            required
            disabled={isSubmitting}
          />

          <Input
            id="email"
            type="email"
            label="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={errors.email}
            placeholder="your@email.com"
            required
            disabled={isSubmitting}
          />

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
              placeholder="Type your message here..."
              disabled={isSubmitting}
            />
            {errors.message && (
              <p className="mt-1 text-sm text-red-600">{errors.message}</p>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// Example 3: Nested Modals
export function NestedModals() {
  const [primaryOpen, setPrimaryOpen] = useState(false);
  const [secondaryOpen, setSecondaryOpen] = useState(false);
  const [tertiaryOpen, setTertiaryOpen] = useState(false);

  return (
    <div className="p-6">
      <Button variant="primary" onClick={() => setPrimaryOpen(true)}>
        Open Settings
      </Button>

      {/* Primary Modal - Settings */}
      <Modal
        isOpen={primaryOpen}
        onClose={() => setPrimaryOpen(false)}
        title="Settings"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Account Settings</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Profile Information</p>
                  <p className="text-sm text-gray-600">Update your personal details</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSecondaryOpen(true)}>
                  Edit
                </Button>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Privacy Settings</p>
                  <p className="text-sm text-gray-600">Control your data visibility</p>
                </div>
                <Button variant="outline" size="sm">
                  Manage
                </Button>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Notifications</p>
                  <p className="text-sm text-gray-600">Configure notification preferences</p>
                </div>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setPrimaryOpen(false)}>
              Close
            </Button>
            <Button variant="primary">
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Secondary Modal - Edit Profile */}
      <Modal
        isOpen={secondaryOpen}
        onClose={() => setSecondaryOpen(false)}
        title="Edit Profile"
        size="md"
      >
        <div className="space-y-4">
          <Input
            id="displayName"
            label="Display Name"
            defaultValue="John Doe"
            placeholder="Your display name"
          />

          <Input
            id="bio"
            label="Bio"
            defaultValue="Software Developer"
            placeholder="Tell us about yourself"
          />

          <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
            <div>
              <p className="font-medium text-yellow-900">Delete Account</p>
              <p className="text-sm text-yellow-700">Permanently remove your account</p>
            </div>
            <Button variant="danger" size="sm" onClick={() => setTertiaryOpen(true)}>
              Delete
            </Button>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={() => setSecondaryOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary">
              Save Profile
            </Button>
          </div>
        </div>
      </Modal>

      {/* Tertiary Modal - Delete Confirmation */}
      <Modal
        isOpen={tertiaryOpen}
        onClose={() => setTertiaryOpen(false)}
        title="Delete Account"
        size="sm"
      >
        <div className="space-y-4">
          <div className="text-center p-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              This action is irreversible
            </h3>
            <p className="text-sm text-gray-600">
              Are you absolutely sure you want to delete your account? All of your data will be permanently removed.
            </p>
          </div>

          <Input
            id="confirm"
            label="Type 'DELETE' to confirm"
            placeholder="DELETE"
          />

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setTertiaryOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger">
              Permanently Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Example 4: Multi-Step Modal (Wizard)
export function WizardModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const [wizardData, setWizardData] = useState({
    step1: { projectName: '', projectType: '' },
    step2: { framework: '', template: '' },
    step3: { features: [] as string[] },
  });

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    console.log('Wizard completed:', wizardData);
    alert('Project created successfully!');
    setIsOpen(false);
    setCurrentStep(1);
  };

  const handleClose = () => {
    setIsOpen(false);
    setCurrentStep(1);
  };

  return (
    <div className="p-6">
      <Button variant="primary" onClick={() => setIsOpen(true)}>
        Create New Project
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={`Create Project - Step ${currentStep} of ${totalSteps}`}
        size="lg"
        closeOnOverlayClick={false}
      >
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>

          {/* Step Content */}
          <div className="min-h-[300px]">
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <Input
                  id="projectName"
                  label="Project Name"
                  value={wizardData.step1.projectName}
                  onChange={(e) => setWizardData({
                    ...wizardData,
                    step1: { ...wizardData.step1, projectName: e.target.value }
                  })}
                  placeholder="my-awesome-project"
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Type
                  </label>
                  <select
                    value={wizardData.step1.projectType}
                    onChange={(e) => setWizardData({
                      ...wizardData,
                      step1: { ...wizardData.step1, projectType: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select type...</option>
                    <option value="web">Web Application</option>
                    <option value="mobile">Mobile App</option>
                    <option value="api">API Service</option>
                  </select>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Technology Stack</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Framework
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['React', 'Vue', 'Angular', 'Svelte'].map((framework) => (
                      <button
                        key={framework}
                        type="button"
                        onClick={() => setWizardData({
                          ...wizardData,
                          step2: { ...wizardData.step2, framework }
                        })}
                        className={`p-4 border-2 rounded-lg transition-colors ${
                          wizardData.step2.framework === framework
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {framework}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Additional Features</h3>
                <div className="space-y-2">
                  {['Authentication', 'Database', 'API Integration', 'Testing', 'CI/CD'].map((feature) => (
                    <label key={feature} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={wizardData.step3.features.includes(feature)}
                        onChange={(e) => {
                          const features = e.target.checked
                            ? [...wizardData.step3.features, feature]
                            : wizardData.step3.features.filter(f => f !== feature);
                          setWizardData({
                            ...wizardData,
                            step3: { features }
                          });
                        }}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="font-medium">{feature}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={currentStep === 1 ? handleClose : handleBack}
            >
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </Button>

            <div className="flex gap-2">
              <span className="text-sm text-gray-600 py-2">
                Step {currentStep} of {totalSteps}
              </span>
              {currentStep < totalSteps ? (
                <Button variant="primary" onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button variant="primary" onClick={handleFinish}>
                  Finish
                </Button>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Example 5: Info/Alert Modal
export function AlertModals() {
  const [successOpen, setSuccessOpen] = useState(false);
  const [warningOpen, setWarningOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <div className="p-6 space-y-4">
      <Card padding="md">
        <h2 className="text-xl font-bold mb-4">Alert Modals</h2>
        <div className="flex gap-3">
          <Button variant="primary" onClick={() => setSuccessOpen(true)}>
            Success Alert
          </Button>
          <Button variant="secondary" onClick={() => setWarningOpen(true)}>
            Warning Alert
          </Button>
          <Button variant="outline" onClick={() => setInfoOpen(true)}>
            Info Alert
          </Button>
        </div>
      </Card>

      {/* Success Modal */}
      <Modal isOpen={successOpen} onClose={() => setSuccessOpen(false)} size="sm" showCloseButton={false}>
        <div className="text-center py-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Success!</h3>
          <p className="text-gray-600 mb-6">Your changes have been saved successfully.</p>
          <Button variant="primary" onClick={() => setSuccessOpen(false)}>
            Got it
          </Button>
        </div>
      </Modal>

      {/* Warning Modal */}
      <Modal isOpen={warningOpen} onClose={() => setWarningOpen(false)} size="sm" showCloseButton={false}>
        <div className="text-center py-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Warning</h3>
          <p className="text-gray-600 mb-6">You have unsaved changes. Please save before proceeding.</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => setWarningOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setWarningOpen(false)}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Info Modal */}
      <Modal isOpen={infoOpen} onClose={() => setInfoOpen(false)} size="md" title="Information">
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold mb-2">Did you know?</h4>
              <p className="text-sm text-gray-600">
                You can customize these modal components by adjusting the props. Available options include:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
                <li>Size: sm, md, lg, xl, full</li>
                <li>Close on overlay click</li>
                <li>Show/hide close button</li>
                <li>Custom titles and content</li>
              </ul>
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button variant="primary" onClick={() => setInfoOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
