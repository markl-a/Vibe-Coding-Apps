'use client';

import { useState } from 'react';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }

    setStatus('loading');

    try {
      // Simulate API call
      // In production: Call newsletter service API
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate success
      setStatus('success');
      setMessage('Thanks for subscribing! Check your email for confirmation.');
      setEmail('');

      // Reset after 5 seconds
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);
    } catch (error) {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');

      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);
    }
  };

  return (
    <section className="my-16 bg-gradient-to-r from-primary-50 via-purple-50 to-pink-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 rounded-2xl p-8 md:p-12 border border-primary-200 dark:border-gray-700">
      <div className="max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 text-white rounded-full mb-6">
          <Mail className="w-8 h-8" />
        </div>

        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Stay Updated with Our Newsletter
        </h2>

        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          Get the latest articles, tutorials, and insights delivered straight to your inbox.
          Join thousands of developers improving their skills every week.
        </p>

        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={status === 'loading' || status === 'success'}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              required
            />
            <button
              type="submit"
              disabled={status === 'loading' || status === 'success'}
              className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {status === 'loading' ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Subscribing...
                </>
              ) : status === 'success' ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Subscribed!
                </>
              ) : (
                'Subscribe'
              )}
            </button>
          </div>

          {/* Status Messages */}
          {message && (
            <div
              className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${
                status === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
              }`}
            >
              {status === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <p className="text-sm">{message}</p>
            </div>
          )}

          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            By subscribing, you agree to receive our weekly newsletter.
            Unsubscribe anytime. We respect your privacy.
          </p>
        </form>

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
          <div>
            <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              📚 Weekly Articles
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Curated tutorials and guides
            </p>
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              🎯 No Spam
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Quality content only
            </p>
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              🔓 Unsubscribe
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Leave anytime, no questions asked
            </p>
          </div>
        </div>
      </div>

      {/* Integration Note */}
      <div className="mt-8 max-w-3xl mx-auto p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          <strong>💡 Production Integration:</strong> Connect with newsletter services:
          <br />
          • <strong>ConvertKit</strong> - Creator-focused email marketing
          <br />
          • <strong>Mailchimp</strong> - Full-featured email platform
          <br />
          • <strong>Buttondown</strong> - Simple newsletter service
          <br />
          • <strong>Substack</strong> - Newsletter and monetization platform
        </p>
      </div>
    </section>
  );
}

/**
 * Integration Examples:
 *
 * 1. ConvertKit:
 * const response = await fetch('https://api.convertkit.com/v3/forms/{form_id}/subscribe', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     api_key: process.env.CONVERTKIT_API_KEY,
 *     email: email,
 *   }),
 * });
 *
 * 2. Mailchimp:
 * npm install @mailchimp/mailchimp_marketing
 *
 * import mailchimp from '@mailchimp/mailchimp_marketing';
 * mailchimp.setConfig({
 *   apiKey: process.env.MAILCHIMP_API_KEY,
 *   server: process.env.MAILCHIMP_SERVER_PREFIX,
 * });
 *
 * await mailchimp.lists.addListMember(listId, {
 *   email_address: email,
 *   status: 'subscribed',
 * });
 *
 * 3. Resend (Modern alternative):
 * npm install resend
 *
 * import { Resend } from 'resend';
 * const resend = new Resend(process.env.RESEND_API_KEY);
 *
 * await resend.contacts.create({
 *   email: email,
 *   audienceId: process.env.RESEND_AUDIENCE_ID,
 * });
 */
