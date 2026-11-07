'use client'

import { useEffect, useState } from 'react'
import { getStoredReferral } from './client'

/** Reactive view of the persisted partner referral (localStorage + cookie). */
export function usePartnerReferral() {
  const [referral, setReferral] = useState(null)

  useEffect(() => {
    setReferral(getStoredReferral())
    const onChange = (e) => setReferral(e?.detail ?? getStoredReferral())
    const onStorage = (e) => {
      if (e.key === 'amaxing_referral') setReferral(getStoredReferral())
    }
    window.addEventListener('partner-referral-change', onChange)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('partner-referral-change', onChange)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  return referral
}
