// Shared UI components and utilities
export * from './credentialRequirements'

export const CATEGORIES = [
  { name: 'Locksmith', slug: 'locksmith', icon: 'lock' },
  { name: 'Electrician', slug: 'electrician', icon: 'bolt' },
  { name: 'Plumber', slug: 'plumber', icon: 'droplet' },
  { name: 'Painter', slug: 'painter', icon: 'palette' },
  { name: 'Carpenter', slug: 'carpenter', icon: 'hammer' },
  { name: 'Cleaner', slug: 'cleaner', icon: 'sparkles' },
  { name: 'HVAC', slug: 'hvac', icon: 'wind' },
  { name: 'Landscaper', slug: 'landscaper', icon: 'plant' },
  { name: 'Handyman', slug: 'handyman', icon: 'tool' },
  { name: 'Pest Control', slug: 'pest_control', icon: 'bug' },
  { name: 'Roofing', slug: 'roofing', icon: 'home-2' },
  { name: 'Flooring', slug: 'flooring', icon: 'layout-grid' },
  { name: 'Tiling', slug: 'tiling', icon: 'grid-4x4' },
  { name: 'Pool Service', slug: 'pool_service', icon: 'swimming' },
  { name: 'Moving', slug: 'moving', icon: 'truck' },
  { name: 'Appliance Repair', slug: 'appliance_repair', icon: 'device-floppy' },
  { name: 'Security Systems', slug: 'security_systems', icon: 'shield' },
  { name: 'Garage Door', slug: 'garage_door', icon: 'door' },
  { name: 'Pressure Washing', slug: 'pressure_washing', icon: 'droplets' },
  { name: 'Window Cleaning', slug: 'window_cleaning', icon: 'window' },
  { name: 'Personal Trainer', slug: 'personal_trainer', icon: 'barbell' },
  { name: 'Pet Grooming', slug: 'pet_grooming', icon: 'paw' },
  { name: 'Tutoring', slug: 'tutoring', icon: 'book' },
  { name: 'Photography', slug: 'photography', icon: 'camera' },
  { name: 'Catering', slug: 'catering', icon: 'chef-hat' },
  { name: 'Mobile Mechanic', slug: 'mobile_mechanic', icon: 'car' },
  { name: 'Mobile Detailing', slug: 'mobile_detailing', icon: 'car-crash' },
  { name: 'Auto Glass', slug: 'auto_glass', icon: 'eye' },
  { name: 'Towing', slug: 'towing', icon: 'crane' },
  { name: 'Auto Painting', slug: 'auto_painting', icon: 'spray' },
]

export const getBookingFee = (amount: number): { fee: number; label: string } => {
  if (amount < 100) return { fee: 5, label: 'Under $100' }
  if (amount < 200) return { fee: 10, label: '$100–$199' }
  return { fee: 20, label: '$200+' }
}

export const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso))

export const formatTime = (iso: string) =>
  new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(iso))

export const formatRelative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'Just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  return formatDate(iso)
}

export const getInitials = (name: string) =>
  name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)

export const AVATAR_COLORS = [
  { bg: '#FDE8E0', tc: '#d44808' },
  { bg: '#EAF3DE', tc: '#3B6D11' },
  { bg: '#E6F1FB', tc: '#185FA5' },
  { bg: '#FAEEDA', tc: '#BA7517' },
  { bg: '#EEEDFE', tc: '#534AB7' },
  { bg: '#E1F5EE', tc: '#0F6E56' },
]

export const getAvatarColor = (name: string) =>
  AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length]

export const urgencyLabels: Record<string, string> = {
  asap: 'As soon as possible',
  today: 'Today',
  this_week: 'This week',
  flexible: "I'm flexible",
}

export const statusLabels: Record<string, { label: string; color: string }> = {
  open:        { label: 'Open',        color: 'purple' },
  bidding:     { label: 'Bids in',     color: 'amber'  },
  accepted:    { label: 'Accepted',    color: 'blue'   },
  in_progress: { label: 'In progress', color: 'blue'   },
  completed:   { label: 'Completed',   color: 'green'  },
  cancelled:   { label: 'Cancelled',   color: 'gray'   },
}

export const pricingLabels: Record<string, string> = {
  fixed_incl: 'Fixed price (includes parts)',
  fixed_excl: 'Fixed price (parts extra)',
  hourly:     'Hourly rate',
  estimate:   'Free estimate on-site',
}
