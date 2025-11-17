import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { UserPlus, Settings, Rocket, CheckCircle } from 'lucide-react'

const HowItWorks = () => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const steps = [
    {
      icon: UserPlus,
      title: 'Sign Up in Seconds',
      description:
        'Create your account with just your email. No credit card required for the free trial.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Settings,
      title: 'Customize Your Workspace',
      description:
        'Set up your workspace, invite team members, and configure your preferences in minutes.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Rocket,
      title: 'Launch and Grow',
      description:
        'Start using powerful features immediately. Scale as you grow with our flexible plans.',
      color: 'from-orange-500 to-red-500',
    },
    {
      icon: CheckCircle,
      title: 'Track Success',
      description:
        'Monitor your progress with detailed analytics and insights. Optimize for better results.',
      color: 'from-green-500 to-emerald-500',
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
      },
    },
  }

  return (
    <section id="how-it-works" className="section-padding bg-gradient-primary">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <h2 className="heading-lg mb-4 text-gray-900">
            Get Started in{' '}
            <span className="text-gradient">Four Simple Steps</span>
          </h2>
          <p className="text-lg text-gray-600">
            From signup to success - we've made it incredibly easy to get started
            and see results quickly.
          </p>
        </motion.div>

        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="relative mt-16"
        >
          {/* Connection Line */}
          <div className="absolute left-8 top-0 hidden h-full w-0.5 bg-gradient-to-b from-primary-300 to-secondary-300 md:block lg:left-1/2"></div>

          {/* Steps */}
          <div className="space-y-12">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isEven = index % 2 === 0

              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className={`relative grid gap-8 md:grid-cols-2 ${
                    isEven ? '' : 'md:grid-flow-dense'
                  }`}
                >
                  {/* Content */}
                  <div
                    className={`${
                      isEven ? 'md:text-right' : 'md:col-start-2'
                    } space-y-3`}
                  >
                    <div
                      className={`inline-flex items-center justify-center rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-primary-600 shadow-sm ${
                        isEven ? 'md:float-right' : ''
                      }`}
                    >
                      Step {index + 1}
                    </div>
                    <h3 className="heading-sm text-gray-900">{step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>

                  {/* Icon */}
                  <div
                    className={`flex items-center ${
                      isEven ? 'md:justify-end' : 'md:col-start-1 md:row-start-1'
                    }`}
                  >
                    <motion.div
                      whileHover={{ scale: 1.05, rotate: 5 }}
                      className={`relative z-10 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${step.color} shadow-xl md:h-20 md:w-20`}
                    >
                      <Icon className="h-8 w-8 text-white md:h-10 md:w-10" />
                    </motion.div>
                  </div>

                  {/* Mobile Connection Dot */}
                  <div className="absolute left-8 top-8 h-4 w-4 rounded-full border-4 border-white bg-primary-600 md:hidden"></div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-xl md:p-12">
            <h3 className="heading-md mb-4 text-gray-900">
              Ready to Transform Your Workflow?
            </h3>
            <p className="mb-6 text-gray-600">
              Join thousands of teams already using our platform to boost
              productivity and achieve their goals.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <a href="#contact" className="btn-primary">
                Start Free Trial
              </a>
              <a href="#pricing" className="btn-secondary">
                View Pricing
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default HowItWorks
