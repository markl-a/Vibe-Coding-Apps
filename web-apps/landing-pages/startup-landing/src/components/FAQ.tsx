import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { Plus, Minus } from 'lucide-react'

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const faqs = [
    {
      question: 'How does the free trial work?',
      answer:
        'You can start a 14-day free trial with no credit card required. You get full access to all features during the trial period. Cancel anytime before the trial ends and you won\'t be charged.',
    },
    {
      question: 'Can I change my plan later?',
      answer:
        'Absolutely! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate any payments or credits automatically.',
    },
    {
      question: 'What payment methods do you accept?',
      answer:
        'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for annual plans. All payments are processed securely through our payment partners.',
    },
    {
      question: 'Is my data secure?',
      answer:
        'Yes! We use bank-level 256-bit SSL encryption for all data transmission and storage. We\'re SOC 2 Type II certified and fully GDPR compliant. Your data is backed up daily and stored in multiple secure locations.',
    },
    {
      question: 'Do you offer refunds?',
      answer:
        'Yes, we offer a 30-day money-back guarantee. If you\'re not satisfied with our service for any reason, contact us within 30 days of your purchase for a full refund.',
    },
    {
      question: 'Can I use this for my team?',
      answer:
        'Yes! All paid plans include team collaboration features. You can invite team members, assign roles and permissions, and work together in real-time. Our Professional and Enterprise plans are specifically designed for teams.',
    },
    {
      question: 'What kind of support do you offer?',
      answer:
        'We offer email support for all users, with 24-hour response time for free users and priority support for paid plans. Enterprise customers get dedicated account managers and 24/7 phone support.',
    },
    {
      question: 'Do you offer custom enterprise solutions?',
      answer:
        'Yes! Our Enterprise plan includes custom features, dedicated infrastructure, API access, and more. Contact our sales team to discuss your specific needs and get a custom quote.',
    },
  ]

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
      },
    },
  }

  return (
    <section id="faq" className="section-padding bg-white">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <h2 className="heading-lg mb-4 text-gray-900">
            Frequently Asked{' '}
            <span className="text-gradient">Questions</span>
          </h2>
          <p className="text-lg text-gray-600">
            Have questions? We have answers. If you can't find what you're looking
            for, feel free to contact us.
          </p>
        </motion.div>

        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="mx-auto mt-12 max-w-3xl"
        >
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="mb-4 overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-lg"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-gray-50"
              >
                <span className="pr-8 text-lg font-semibold text-gray-900">
                  {faq.question}
                </span>
                <div className="flex-shrink-0">
                  {openIndex === index ? (
                    <Minus className="h-5 w-5 text-primary-600" />
                  ) : (
                    <Plus className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </button>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="border-t border-gray-200 px-6 py-4">
                      <p className="text-gray-600">{faq.answer}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="mb-4 text-gray-600">Still have questions?</p>
          <a href="#contact" className="btn-primary">
            Contact Support
          </a>
        </motion.div>
      </div>
    </section>
  )
}

export default FAQ
