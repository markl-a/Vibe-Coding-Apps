'use client'

import { useEffect } from 'react'
import { Hero } from '@/components/sections/Hero'
import { Features } from '@/components/sections/Features'
import { Pricing } from '@/components/sections/Pricing'
import { Testimonials } from '@/components/sections/Testimonials'
import { FAQ } from '@/components/sections/FAQ'
import { CTA } from '@/components/sections/CTA'
import { Footer } from '@/components/sections/Footer'
import { Header } from '@/components/Header'
import { AIChat } from '@/components/AIChat'
import { trackPageView, initScrollTracking, trackTimeOnPage } from '@/lib/analytics'

export default function Home() {
  useEffect(() => {
    // Track page view
    trackPageView(window.location.href)

    // Initialize scroll tracking
    initScrollTracking()

    // Track time on page
    trackTimeOnPage()
  }, [])

  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <Features />
      <Pricing />
      <Testimonials />
      <FAQ />
      <CTA />
      <Footer />
      <AIChat />
    </main>
  )
}
