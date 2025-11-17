import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import {
  Zap,
  Shield,
  Users,
  BarChart3,
  Clock,
  Globe,
} from 'lucide-react'

const Features = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description:
        'Experience blazing-fast performance with our optimized infrastructure. Load times reduced by 10x.',
      color: 'from-yellow-500 to-orange-500',
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description:
        'Bank-level encryption and security measures to keep your data safe and compliant with regulations.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description:
        'Work seamlessly with your team in real-time. Share, comment, and collaborate effortlessly.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description:
        'Get deep insights with powerful analytics and reporting tools. Make data-driven decisions.',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: Clock,
      title: '24/7 Support',
      description:
        'Round-the-clock customer support ready to help you whenever you need assistance.',
      color: 'from-red-500 to-rose-500',
    },
    {
      icon: Globe,
      title: 'Global Infrastructure',
      description:
        'Deployed across multiple regions worldwide for maximum reliability and low latency.',
      color: 'from-indigo-500 to-blue-500',
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
    <section id="features" className="section-padding bg-white">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <h2 className="heading-lg mb-4 text-gray-900">
            Everything You Need to{' '}
            <span className="text-gradient">Succeed</span>
          </h2>
          <p className="text-lg text-gray-600">
            Powerful features designed to help you work smarter, not harder.
            Everything you need in one platform.
          </p>
        </motion.div>

        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="group relative rounded-2xl border border-gray-200 bg-white p-8 transition-shadow hover:shadow-xl"
              >
                {/* Icon */}
                <div
                  className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} shadow-lg`}
                >
                  <Icon className="h-7 w-7 text-white" />
                </div>

                {/* Content */}
                <h3 className="heading-sm mb-3 text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>

                {/* Hover Effect */}
                <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-primary-50 to-secondary-50 opacity-0 transition-opacity group-hover:opacity-100"></div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <p className="mb-4 text-lg text-gray-600">
            Want to see all features in action?
          </p>
          <a href="#contact" className="btn-primary">
            Start Your Free Trial
          </a>
        </motion.div>
      </div>
    </section>
  )
}

export default Features
