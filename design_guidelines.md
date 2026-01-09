# ReWear Sustainable Fashion Marketplace - Design Guidelines

## Design Approach
**Reference-Based**: Drawing inspiration from sustainable e-commerce leaders (Patagonia, Vinted, Etsy) with Zara's minimal aesthetic. Focus on trust, calm, and eco-consciousness.

## Color System
- **Primary**: Deep forest green (#2D5016, #3A5F1A)
- **Secondary**: Beige/off-white (#F5F1ED, #E8E4DF)
- **Accent**: Soft brown (#8B6F47, #A0826D)
- **Text**: Dark charcoal (#2C2C2C, #4A4A4A)
- **Backgrounds**: Off-white (#FAFAF8)
- **Borders**: Light gray (#E5E5E5)

## Typography
- **Font Family**: Inter or Poppins via Google Fonts
- **Headings**: Font weight 600-700, generous letter spacing
- **Body**: Font weight 400, line-height 1.6
- **Hierarchy**: H1 (2.5rem), H2 (2rem), H3 (1.5rem), Body (1rem), Small (0.875rem)

## Layout System
**Spacing**: Use Tailwind units of 2, 4, 6, 8, 12, 16 (e.g., p-4, m-8, gap-6)
- **Container**: max-w-7xl with px-4 md:px-6 lg:px-8
- **Sections**: py-12 md:py-16 lg:py-20
- **Cards**: p-4 md:p-6

## Component Library

### Navigation
- Sticky header with transparent-to-solid transition on scroll
- Logo left, navigation center, cart/profile/login right
- Mobile: Hamburger menu with slide-in drawer

### Cards (Product/Item)
- Rounded corners (rounded-lg to rounded-xl)
- Soft shadow (shadow-sm hover:shadow-md)
- Image aspect ratio 3:4
- Padding p-4, gap-3 between elements
- Hover: Subtle lift effect (transform translateY)

### Buttons
- **Primary**: Forest green bg, white text, rounded-lg, px-6 py-3
- **Secondary**: Beige bg, charcoal text, border
- **Text**: No background, underline on hover
- **On Images**: Backdrop blur (backdrop-blur-md), semi-transparent white bg

### Forms
- Input fields: Border gray, focus:border-green, rounded-md, p-3
- Labels: Font weight 500, mb-2
- Error states: Red border + error text below

### Hero Section
- **Homepage**: Full-width hero with sustainable fashion lifestyle image (people in natural settings wearing second-hand clothes)
- Height: h-[500px] md:h-[600px]
- Overlay: Dark gradient overlay (bg-gradient-to-r from-black/60 to-black/30)
- Content: Centered, white text, CTA buttons with backdrop blur

### Grid Layouts
- **Items Grid**: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4, gap-6
- **Features**: grid-cols-1 md:grid-cols-3, gap-8

## Images
- **Hero Image**: Sustainable fashion lifestyle (natural lighting, authentic people, earth tones)
- **Item Images**: Clean product photography, neutral backgrounds
- **About/Mission**: Natural textures (fabrics, recycling, nature)
- **Placeholders**: Soft beige backgrounds with green icons while loading

## Loading States
- Skeleton screens with pulsing animation
- Match card/component structure
- Use beige/gray gradient shimmer

## Responsive Behavior
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Single column → 2 cols → 3-4 cols progression
- Collapsible filters on mobile

## Micro-interactions
- Subtle hover states (shadow, transform)
- Smooth transitions (transition-all duration-200)
- Success/error toast notifications (top-right)
- Loading spinners: Green circular

## Accessibility
- Focus states with green ring (ring-2 ring-green-500)
- Sufficient color contrast
- Semantic HTML throughout
- Alt text for all images

**Key Principle**: Clean, trustworthy, eco-conscious aesthetic with premium feel. Generous whitespace, subtle interactions, professional grid system. NO flashy animations or bright colors.