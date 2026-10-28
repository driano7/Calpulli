'use client'

import { useState } from 'react'
import { useRouter } from 'next/router'
import { ShoppingBag, Check } from 'lucide-react'
import { useCartStore } from '@/lib/store/useCartStore'
import { useAuth } from '@/lib/hooks/useAuth'

export function AddToCartButton({ tour, locale }) {
  const { addItem, clearCart } = useCartStore()
  const router = useRouter()
  const { user } = useAuth()
  const [added, setAdded] = useState(false)
  const isEs = locale === 'es'

  const handleAdd = () => {
    if (!user) {
      router.push(`/login?redirect=/tours/${tour.id}`)
      return
    }
    // Al elegir un tour se reemplaza el carrito: si el usuario se arrepiente
    // de lo anterior, no queda nada acumulado.
    clearCart()
    addItem({
      experienceId: tour.id,
      title: tour.title,
      imageUrl: tour.imageUrl,
      price: tour.price,
      currency: 'USD',
      location: tour.location,
      maxGuests: tour.maxGuests,
      highlights: tour.highlights,
    })
    setAdded(true)
    setTimeout(() => router.push('/cart'), 500)
  }

  return (
    <button
      onClick={handleAdd}
      className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 font-semibold transition-all ${
        added
          ? 'bg-emerald-500 text-white hover:bg-emerald-600'
          : 'border border-[var(--a30)] bg-[var(--a10)] text-[var(--accent)] hover:bg-[var(--a20)] hover:brightness-105'
      }`}
    >
      {added ? <Check className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
      {added ? (isEs ? '¡Agregado!' : 'Added!') : isEs ? 'Agregar al carrito' : 'Add to cart'}
    </button>
  )
}
