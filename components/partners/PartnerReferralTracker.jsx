'use client'

// Global partner tracker: detects ?ref=, validates via /api/partners/resolve
// and persists LAST VALID TOUCH. Invalid links never overwrite a valid referral.
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { captureReferral } from '@/lib/partners/client'

export default function PartnerReferralTracker() {
  const router = useRouter()

  useEffect(() => {
    void captureReferral(router.asPath || router.pathname)
  }, [router.asPath, router.pathname])

  return null
}
