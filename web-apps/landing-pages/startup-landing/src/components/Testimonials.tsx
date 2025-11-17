import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react'

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'CEO at TechStart',
      image: 'https://i.pravatar.cc/150?img=1',
      content:
        'This platform has completely transformed how we work. The productivity gains have been incredible, and our team loves using it every day.',
      rating: 5,
    },
    {
      name: 'Michael Chen',
      role: 'Product Manager at InnovateCo',
      image: 'https://i.pravatar.cc/150?img=13',
      content:
        "Best investment we've made this year. The ROI was visible within the first month. Highly recommended for any growing business.",
      rating: 5,
    },
    {
      name: 'Emily Rodriguez',
      role: 'Founder of DesignHub',
      image: 'https://i.pravatar.cc/150?img=5',
      content:
        'Outstanding support and an intuitive interface. My team was up and running in minutes. The features are exactly what we needed.',
      rating: 5,
    },
    {
      name: 'David Park',
      role: 'CTO at DataFlow',
      image: 'https://i.pravatar.cc/150?img=12',
      content:
        'The analytics and reporting features are game-changing. We can now make data-driven decisions faster than ever before.',
      rating: 5,
    },
    {
      name: 'Lisa Anderson',
      role: 'Marketing Director at GrowthLab',
      image: 'https://i.pravatar.cc/150?img=9',
      content:
        'Incredible value for money. The platform pays for itself through the time we save and the productivity improvements we see.',
      rating: 5,
    },
  ]

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    )
  }

  useEffect(() => {
    const timer = setInterval(nextTestimonial, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section id="testimonials" className="section-padding bg-gradient-primary">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <h2 className="heading-lg mb-4 text-gray-900">
            Loved by <span className="text-gradient">Thousands</span>
          </h2>
          <p className="text-lg text-gray-600">
            Don't just take our word for it. Here's what our customers have to say
            about their experience.
          </p>
        </motion.div>

        <div ref={ref} className="relative mt-16">
          {/* Main Testimonial Carousel */}
          <div className="mx-auto max-w-4xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="relative rounded-2xl bg-white p-8 shadow-2xl md:p-12"
              >
                {/* Quote Icon */}
                <div className="absolute -left-4 -top-4 rounded-full bg-gradient-to-br from-primary-600 to-secondary-600 p-3 shadow-lg">
                  <Quote className="h-6 w-6 text-white" />
                </div>

                {/* Rating */}
                <div className="mb-4 flex justify-center">
                  {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>

                {/* Content */}
                <blockquote className="mb-8 text-center text-lg text-gray-700 md:text-xl">
                  "{testimonials[currentIndex].content}"
                </blockquote>

                {/* Author */}
                <div className="flex flex-col items-center">
                  <img
                    src={testimonials[currentIndex].image}
                    alt={testimonials[currentIndex].name}
                    className="mb-4 h-16 w-16 rounded-full border-4 border-primary-100"
                  />
                  <div className="text-center">
                    <p className="font-semibold text-gray-900">
                      {testimonials[currentIndex].name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {testimonials[currentIndex].role}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="mt-8 flex items-center justify-center space-x-4">
              <button
                onClick={prevTestimonial}
                className="rounded-full bg-white p-3 shadow-lg transition-all hover:bg-gray-50 hover:shadow-xl"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="h-6 w-6 text-gray-600" />
              </button>

              {/* Dots */}
              <div className="flex space-x-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentIndex
                        ? 'w-8 bg-primary-600'
                        : 'w-2 bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={nextTestimonial}
                className="rounded-full bg-white p-3 shadow-lg transition-all hover:bg-gray-50 hover:shadow-xl"
                aria-label="Next testimonial"
              >
                <ChevronRight className="h-6 w-6 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-16 grid gap-8 sm:grid-cols-3"
          >
            {[
              { value: '10,000+', label: 'Happy Customers' },
              { value: '4.9/5', label: 'Average Rating' },
              { value: '99%', label: 'Customer Satisfaction' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="mb-2 text-4xl font-bold text-gray-900">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default Testimonials
