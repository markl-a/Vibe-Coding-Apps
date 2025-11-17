import { motion } from 'framer-motion'
import { ArrowRight, Play } from 'lucide-react'

const Hero = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      },
    },
  }

  return (
    <section className="relative overflow-hidden bg-gradient-primary pt-20 md:pt-24">
      <div className="container-custom section-padding">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-4xl text-center"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="mb-6">
            <span className="inline-flex items-center rounded-full bg-primary-100 px-4 py-1.5 text-sm font-medium text-primary-700">
              <span className="mr-2 h-2 w-2 animate-pulse rounded-full bg-primary-600"></span>
              Now in Beta - Join 10,000+ Users
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={itemVariants}
            className="heading-xl mb-6 text-gray-900"
          >
            Transform Your Business with{' '}
            <span className="text-gradient">Intelligent Solutions</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            variants={itemVariants}
            className="mx-auto mb-10 max-w-2xl text-lg text-gray-600 md:text-xl"
          >
            Streamline your workflow, boost productivity, and scale your business
            with our cutting-edge platform. Join thousands of companies already
            growing faster.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <a href="#contact" className="btn-primary group w-full sm:w-auto">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </a>
            <button className="btn-secondary group w-full sm:w-auto">
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </button>
          </motion.div>

          {/* Social Proof */}
          <motion.div
            variants={itemVariants}
            className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-600"
          >
            <div className="flex items-center">
              <div className="mr-2 flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-8 w-8 rounded-full border-2 border-white bg-gradient-to-br from-primary-400 to-secondary-400"
                  />
                ))}
              </div>
              <span>
                <strong className="font-semibold text-gray-900">10,000+</strong>{' '}
                active users
              </span>
            </div>
            <div className="flex items-center">
              <svg
                className="mr-1 h-5 w-5 fill-yellow-400"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>
                <strong className="font-semibold text-gray-900">4.9/5</strong>{' '}
                rating
              </span>
            </div>
            <div>
              <span>
                <strong className="font-semibold text-gray-900">Free</strong> 14-day
                trial
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* Hero Image/Illustration */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mx-auto mt-16 max-w-5xl"
        >
          <div className="relative rounded-2xl bg-gradient-to-br from-primary-600 to-secondary-600 p-1 shadow-2xl">
            <div className="rounded-xl bg-white p-4">
              <div className="aspect-video rounded-lg bg-gradient-to-br from-gray-100 to-gray-200">
                {/* Placeholder for dashboard/product image */}
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-gradient-to-br from-primary-600 to-secondary-600"></div>
                    <p className="text-lg font-semibold text-gray-600">
                      Product Dashboard Preview
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Elements */}
          <motion.div
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute -left-4 top-1/4 hidden rounded-lg bg-white p-4 shadow-lg md:block"
          >
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-full bg-green-100">
                <svg
                  className="h-12 w-12 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Tasks Done</p>
                <p className="text-xs text-gray-600">+25% this week</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            animate={{
              y: [0, 10, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1,
            }}
            className="absolute -right-4 top-1/2 hidden rounded-lg bg-white p-4 shadow-lg md:block"
          >
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-full bg-blue-100">
                <svg
                  className="h-12 w-12 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Revenue Up</p>
                <p className="text-xs text-gray-600">+42% increase</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Background Decoration */}
      <div className="absolute left-0 top-0 -z-10 h-full w-full overflow-hidden">
        <div className="absolute -left-4 top-0 h-72 w-72 rounded-full bg-primary-200 opacity-20 blur-3xl"></div>
        <div className="absolute -right-4 top-1/4 h-72 w-72 rounded-full bg-secondary-200 opacity-20 blur-3xl"></div>
      </div>
    </section>
  )
}

export default Hero
