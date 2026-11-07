// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
// Illustrative demo data for the Hostal MX sales demo ONLY.
// Never persisted to bookings/analytics/commissions. Every surface that
// renders this MUST label it "ILLUSTRATIVE EXAMPLE — NOT ACTUAL PERFORMANCE".

export const DEMO_PARTNER = {
  slug: 'hostal-mx-demo',
  referralCode: 'HOSTALMXDEMO',
  name: 'Hostal MX Demo',
  type: 'HOSTEL',
  status: 'ACTIVE',
  guestDiscountPct: 0.1,
  commissionPct: 0.1,
  attributionDays: 30,
}

export const DEMO_LABEL = 'ILLUSTRATIVE EXAMPLE — NOT ACTUAL PERFORMANCE'

export const DEMO_OVERVIEW = {
  range: { from: '2026-09-01', to: '2026-10-01' },
  visits: 126,
  uniqueSessions: 126,
  journeyViews: 74,
  landingViews: 52,
  checkoutStarts: 18,
  confirmedBookings: 9,
  completedBookings: 7,
  cancelledRefunded: 1,
  guestsBooked: 17,
  gross: 11900,
  discounts: 1190,
  net: 10710,
  pendingCommission: 0,
  payableCommission: 728,
  paidCommission: 343,
  reversedCommission: 0,
  conversionRate: 9 / 126,
  currency: 'MXN',
  timezone: 'America/Mexico_City',
}

export const DEMO_SERIES = [
  { day: '2026-09-18', visits: 4, revenue: 90, discounts: 10, commission: 9, bookings: 1 },
  { day: '2026-09-20', visits: 12, revenue: 360, discounts: 40, commission: 36, bookings: 4 },
  { day: '2026-09-24', visits: 22, revenue: 1080, discounts: 120, commission: 108, bookings: 12 },
  { day: '2026-09-26', visits: 31, revenue: 2700, discounts: 300, commission: 270, bookings: 30 },
  { day: '2026-09-28', visits: 27, revenue: 3600, discounts: 400, commission: 360, bookings: 40 },
  { day: '2026-09-30', visits: 30, revenue: 2970, discounts: 320, commission: 288, bookings: 33 },
]

export const DEMO_BREAKDOWNS = {
  byJourney: [
    { label: 'Centro Histórico', bookings: 4, revenue: 4800, commission: 480 },
    { label: 'Luchas en la Arena', bookings: 3, revenue: 3870, commission: 387 },
    { label: 'Chapultepec y Reforma', bookings: 2, revenue: 2040, commission: 204 },
  ],
  byPlacement: [
    { label: 'front-desk', bookings: 6, revenue: 7200, commission: 720 },
    { label: 'common-area', bookings: 2, revenue: 2400, commission: 240 },
    { label: 'whatsapp', bookings: 1, revenue: 1110, commission: 111 },
  ],
  byCampaign: [
    { label: 'fall-2026', bookings: 9, revenue: 10710, commission: 1071 },
    { label: '(no campaign)', bookings: 0, revenue: 0, commission: 0 },
  ],
}

export const DEMO_BOOKINGS = [
  {
    bookingReference: 'DEMO-0001',
    experienceTitle: 'Centro Histórico',
    startDate: '2026-09-28',
    guests: 2,
    originalAmount: 200,
    discountAmount: 20,
    finalAmount: 180,
    commissionAmount: 18,
    bookingStatus: 'completed',
    commissionStatus: 'PAYABLE',
    placement: 'front-desk',
    campaign: 'fall-2026',
  },
  {
    bookingReference: 'DEMO-0002',
    experienceTitle: 'Luchas en la Arena',
    startDate: '2026-09-29',
    guests: 3,
    originalAmount: 300,
    discountAmount: 30,
    finalAmount: 270,
    commissionAmount: 27,
    bookingStatus: 'paid',
    commissionStatus: 'CONFIRMED',
    placement: 'front-desk',
    campaign: 'fall-2026',
  },
]

export const DEMO_COMMISSIONS = [
  {
    bookingReference: 'DEMO-0001',
    journeyDate: '2026-09-28',
    commissionBase: 180,
    commissionRate: 0.1,
    commissionAmount: 18,
    status: 'PAYABLE',
    payableDate: '2026-09-29',
    paidDate: null,
    payoutReference: null,
  },
  {
    bookingReference: 'DEMO-0000',
    journeyDate: '2026-09-10',
    commissionBase: 343,
    commissionRate: 0.1,
    commissionAmount: 34.3,
    status: 'PAID',
    payableDate: '2026-09-11',
    paidDate: '2026-09-20',
    payoutReference: 'PAYOUT-DEMO-2026-09',
  },
]
