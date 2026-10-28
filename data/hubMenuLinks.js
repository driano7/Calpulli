/**
 * Centralized Hub Menu Links Configuration
 * ----------------------------------------
 * This file documents all header navigation options for both
 * desktop and mobile (drawer) views.
 *
 * Layout split (desktop):
 *   - navItemsConfig        -> Header bar
 *   - headerDropdownConfig  -> Header secondary dropdown ("More")
 *
 * Mobile:
 *   - drawerItemsConfig     -> HubMenu drawer list + MobileDock nav
 */

// Desktop header items — orden: /journeys, /maps, /guides, /local, /about
const navItemsConfig = [
  {
    labelKey: 'nav.header.journeys',
    fallback: 'Caminatas',
    href: '/journeys',
    icon: 'Footprints',
  },
  { labelKey: 'nav.header.maps', fallback: 'Maps', href: '/maps', icon: 'MapPinned' },
  { labelKey: 'nav.header.guides', fallback: 'Guides', href: '/guides', icon: 'BookOpen' },
  {
    labelKey: 'nav.header.localPicks',
    fallback: 'Selección Local',
    href: '/local',
    icon: 'Star',
  },
  { labelKey: 'nav.header.about', fallback: 'About Us', href: '/about', icon: 'Users' },
]

// Desktop "More" dropdown — removido por petición (antes 3 Local Picks)
const headerDropdownConfig = []

// Mobile drawer main list (HubMenu + MobileDock) — nueva navegación
const drawerItemsConfig = [
  { labelKey: 'header.nav.home', fallback: 'Home', href: '/', icon: 'Home' },
  {
    labelKey: 'header.nav.journeys',
    fallback: 'Caminatas',
    href: '/journeys',
    icon: 'Footprints',
  },
  { labelKey: 'header.nav.maps', fallback: 'Maps', href: '/maps', icon: 'MapPinned' },
  { labelKey: 'header.nav.guides', fallback: 'Guides', href: '/guides', icon: 'BookOpen' },
  {
    labelKey: 'header.nav.localPicks',
    fallback: 'Selección Local',
    href: '/local',
    icon: 'Star',
  },
  { labelKey: 'header.nav.about', fallback: 'About Us', href: '/about', icon: 'Users' },
]

// Mobile drawer "Categories" section: eliminada junto con la seccion /tours.

module.exports = {
  navItemsConfig,
  drawerItemsConfig,
  headerDropdownConfig,
}
