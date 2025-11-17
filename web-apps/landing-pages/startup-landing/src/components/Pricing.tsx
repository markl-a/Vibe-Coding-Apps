import { useState } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { Check, X } from 'lucide-react'

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(false)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const plans = [
    {
      name: 'Starter',
      description: 'Perfect for individuals and small projects',
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        { text: 'Up to 3 projects', included: true },
        { text: '5 GB storage', included: true },
        { text: 'Basic analytics', included: true },
        { text: 'Community support', included: true },
        { text: 'Advanced features', included: false },
        { text: 'Priority support', included: false },
        { text: 'Custom integrations', included: false },
      ],
      cta: 'Start Free',
      popular: false,
    },
    {
      name: 'Professional',
      description: 'For growing teams and businesses',
      monthlyPrice: 29,
      annualPrice: 290,
      features: [
        { text: 'Unlimited projects', included: true },
        { text: '100 GB storage', included: true },
        { text: 'Advanced analytics', included: true },
        { text: 'Priority email support', included: true },
        { text: 'All advanced features', included: true },
        { text: 'Team collaboration', included: true },
        { text: 'Custom integrations', included: false },
      ],
      cta: 'Start Free Trial',
      popular: true,
    },
    {
      name: 'Enterprise',
      description: 'For large organizations with custom needs',
      monthlyPrice: 99,
      annualPrice: 990,
      features: [
        { text: 'Unlimited everything', included: true },
        { text: 'Unlimited storage', included: true },
        { text: 'Custom analytics', included: true },
        { text: '24/7 phone & email support', included: true },
        { text: 'All features included', included: true },
        { text: 'Dedicated account manager', included: true },
        { text: 'Custom integrations & API', included: true },
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  }

  return (
    <section id="pricing" className="section-padding bg-white">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <h2 className="heading-lg mb-4 text-gray-900">
            Simple, Transparent{' '}
            <span className="text-gradient">Pricing</span>
          </h2>
          <p className="mb-8 text-lg text-gray-600">
            Choose the perfect plan for your needs. Always know what you'll pay.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center rounded-full bg-gray-100 p-1">
            <button
              onClick={() => setIsAnnual(false)}
              className={`rounded-full px-6 py-2 text-sm font-semibold transition-all ${
                !isAnnual
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`rounded-full px-6 py-2 text-sm font-semibold transition-all ${
                isAnnual
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              Annual
              <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                Save 17%
              </span>
            </button>
          </div>
        </motion.div>

        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="mt-16 grid gap-8 lg:grid-cols-3"
        >
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className={`relative flex flex-col rounded-2xl border-2 bg-white p-8 ${
                plan.popular
                  ? 'border-primary-500 shadow-2xl'
                  : 'border-gray-200 shadow-lg'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <span className="rounded-full bg-gradient-to-r from-primary-600 to-secondary-600 px-4 py-1 text-sm font-semibold text-white shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-6">
                <h3 className="heading-sm mb-2 text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-600">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-5xl font-bold text-gray-900">
                    ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                  </span>
                  {plan.monthlyPrice > 0 && (
                    <span className="ml-2 text-gray-600">
                      /{isAnnual ? 'year' : 'month'}
                    </span>
                  )}
                </div>
                {isAnnual && plan.monthlyPrice > 0 && (
                  <p className="mt-1 text-sm text-gray-500">
                    ${(plan.annualPrice / 12).toFixed(2)} per month
                  </p>
                )}
              </div>

              {/* CTA Button */}
              <a
                href="#contact"
                className={`mb-6 ${
                  plan.popular ? 'btn-primary' : 'btn-secondary'
                } w-full`}
              >
                {plan.cta}
              </a>

              {/* Features */}
              <ul className="flex-1 space-y-3">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    {feature.included ? (
                      <Check className="mr-3 h-5 w-5 flex-shrink-0 text-green-500" />
                    ) : (
                      <X className="mr-3 h-5 w-5 flex-shrink-0 text-gray-300" />
                    )}
                    <span
                      className={
                        feature.included ? 'text-gray-700' : 'text-gray-400'
                      }
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 text-center text-gray-600"
        >
          <p>
            All plans include a 14-day free trial. No credit card required.{' '}
            <a href="#faq" className="text-primary-600 hover:underline">
              View FAQ
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  )
}

export default Pricing
