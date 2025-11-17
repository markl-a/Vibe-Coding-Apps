import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react'

interface FormData {
  name: string
  email: string
  company: string
  message: string
}

const Contact = () => {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>()

  const onSubmit = (data: FormData) => {
    console.log('Form submitted:', data)
    setIsSubmitted(true)
    reset()
    setTimeout(() => setIsSubmitted(false), 5000)
  }

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email',
      content: 'support@startup.com',
      link: 'mailto:support@startup.com',
    },
    {
      icon: Phone,
      title: 'Phone',
      content: '+1 (555) 123-4567',
      link: 'tel:+15551234567',
    },
    {
      icon: MapPin,
      title: 'Office',
      content: '123 Business St, Suite 100, San Francisco, CA 94107',
      link: '#',
    },
  ]

  return (
    <section id="contact" className="section-padding bg-gradient-primary">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <h2 className="heading-lg mb-4 text-gray-900">
            Get in <span className="text-gradient">Touch</span>
          </h2>
          <p className="text-lg text-gray-600">
            Have a question or want to work together? We'd love to hear from you.
          </p>
        </motion.div>

        <div ref={ref} className="mt-16 grid gap-8 lg:grid-cols-3">
          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            transition={{ duration: 0.6 }}
            className="space-y-6 lg:col-span-1"
          >
            <div className="rounded-2xl bg-white p-8 shadow-lg">
              <h3 className="heading-sm mb-6 text-gray-900">
                Contact Information
              </h3>
              <div className="space-y-6">
                {contactInfo.map((info, index) => {
                  const Icon = info.icon
                  return (
                    <a
                      key={index}
                      href={info.link}
                      className="group flex items-start transition-transform hover:translate-x-1"
                    >
                      <div className="mr-4 rounded-lg bg-gradient-to-br from-primary-600 to-secondary-600 p-3">
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="mb-1 text-sm font-semibold text-gray-900">
                          {info.title}
                        </p>
                        <p className="text-sm text-gray-600 group-hover:text-primary-600">
                          {info.content}
                        </p>
                      </div>
                    </a>
                  )
                })}
              </div>

              {/* Social Links */}
              <div className="mt-8 border-t border-gray-200 pt-6">
                <p className="mb-4 text-sm font-semibold text-gray-900">
                  Follow Us
                </p>
                <div className="flex space-x-3">
                  {['twitter', 'facebook', 'linkedin', 'github'].map(
                    (social) => (
                      <a
                        key={social}
                        href="#"
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 transition-colors hover:bg-primary-600 hover:text-white"
                      >
                        <span className="sr-only">{social}</span>
                        <div className="h-5 w-5 rounded bg-gray-400"></div>
                      </a>
                    )
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2"
          >
            <div className="rounded-2xl bg-white p-8 shadow-lg">
              {isSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <div className="mb-4 rounded-full bg-green-100 p-4">
                    <CheckCircle className="h-16 w-16 text-green-600" />
                  </div>
                  <h3 className="heading-sm mb-2 text-gray-900">
                    Message Sent!
                  </h3>
                  <p className="text-gray-600">
                    Thank you for reaching out. We'll get back to you soon.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="name"
                      className="mb-2 block text-sm font-semibold text-gray-900"
                    >
                      Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      {...register('name', { required: 'Name is required' })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="John Doe"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-semibold text-gray-900"
                    >
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address',
                        },
                      })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="john@example.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Company */}
                  <div>
                    <label
                      htmlFor="company"
                      className="mb-2 block text-sm font-semibold text-gray-900"
                    >
                      Company
                    </label>
                    <input
                      type="text"
                      id="company"
                      {...register('company')}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Your Company"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label
                      htmlFor="message"
                      className="mb-2 block text-sm font-semibold text-gray-900"
                    >
                      Message *
                    </label>
                    <textarea
                      id="message"
                      rows={5}
                      {...register('message', {
                        required: 'Message is required',
                        minLength: {
                          value: 10,
                          message: 'Message must be at least 10 characters',
                        },
                      })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Tell us about your project..."
                    />
                    {errors.message && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.message.message}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button type="submit" className="btn-primary group w-full">
                    Send Message
                    <Send className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default Contact
