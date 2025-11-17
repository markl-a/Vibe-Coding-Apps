import { useState } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Mail, CheckCircle } from 'lucide-react'

interface NewsletterFormData {
  email: string
}

const Newsletter = () => {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<NewsletterFormData>()

  const onSubmit = (data: NewsletterFormData) => {
    console.log('Newsletter subscription:', data)
    setIsSubscribed(true)
    reset()
    setTimeout(() => setIsSubscribed(false), 5000)
  }

  return (
    <section className="section-padding bg-gradient-to-r from-primary-600 to-secondary-600">
      <div className="container-custom">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-4xl"
        >
          <div className="rounded-2xl bg-white/10 p-8 backdrop-blur-lg md:p-12">
            <div className="text-center">
              {/* Icon */}
              <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                <Mail className="h-8 w-8 text-white" />
              </div>

              {/* Heading */}
              <h2 className="heading-lg mb-4 text-white">
                Stay in the Loop
              </h2>
              <p className="mx-auto mb-8 max-w-2xl text-lg text-white/90">
                Subscribe to our newsletter for the latest updates, tips, and
                exclusive offers delivered straight to your inbox.
              </p>

              {/* Form */}
              {isSubscribed ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center"
                >
                  <div className="mb-4 rounded-full bg-green-500 p-3">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-lg font-semibold text-white">
                    Thank you for subscribing!
                  </p>
                  <p className="text-white/90">
                    Check your email to confirm your subscription.
                  </p>
                </motion.div>
              ) : (
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="mx-auto max-w-md"
                >
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="flex-1">
                      <input
                        type="email"
                        {...register('email', {
                          required: 'Email is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address',
                          },
                        })}
                        className="w-full rounded-lg border-2 border-transparent bg-white px-5 py-3 text-gray-900 placeholder-gray-500 transition-all focus:border-white focus:outline-none focus:ring-2 focus:ring-white/50"
                        placeholder="Enter your email"
                      />
                      {errors.email && (
                        <p className="mt-2 text-sm text-white/90">
                          {errors.email.message}
                        </p>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="rounded-lg bg-gray-900 px-8 py-3 font-semibold text-white transition-all hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
                    >
                      Subscribe
                    </button>
                  </div>
                  <p className="mt-4 text-sm text-white/80">
                    We respect your privacy. Unsubscribe at any time.
                  </p>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Newsletter
