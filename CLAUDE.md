# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a mixed-architecture project containing both a static HTML website and a Next.js application:

### Static HTML Site (Root Level)
- `index.html`, `contact.html`, `news.html`, `talents.html` - Main static pages
- `script.js` - JavaScript for interactive features (smooth scrolling, slideshow, hamburger menu)
- `style.css` - Main CSS with custom design system using ocean/aqua color palette

### Next.js Application (`/raru` directory)
- **Framework**: Next.js 14 with React 18
- **Pages**: `/raru/pages/` - API routes, admin dashboard, media management, talent profiles
- **Components**: `/raru/components/` - Reusable React components (Header, Footer, Layout)
- **Static Assets**: `/raru/public/` - Images and other static files

## Development Commands

### Next.js Application (`/raru` directory)
```bash
cd raru
npm run dev     # Start development server
npm run build   # Build for production
npm run start   # Start production server
npm run lint    # Run ESLint
```

### Static HTML Site (Root Level)
- Open HTML files directly in browser for development
- No build process required for static files

## Architecture Overview

### Dual Structure Design
The project maintains both static HTML pages and a Next.js application, likely for different purposes:
- **Static HTML**: Marketing/landing pages with custom animations and design
- **Next.js App**: Dynamic content management, admin features, talent profiles

### Key Features
- **Responsive Design**: Mobile-first with hamburger menu for mobile devices
- **Custom Slideshow**: Auto-advancing hero slideshow with wheel scroll interaction
- **Smooth Scrolling**: Custom JavaScript implementation for navigation
- **Color System**: Ocean/aqua themed palette defined in CSS variables
- **API Routes**: Backend functionality for contact forms, talent management, media uploads
- **Admin Dashboard**: Content management system for articles and talent profiles

### Dependencies
- **Frontend**: React, Next.js, Bootstrap 5.3.7
- **Backend**: Formidable (file uploads), Nodemailer (email handling)
- **Styling**: Custom CSS with design system, Google Fonts (Montserrat, Noto Serif JP)

## File Organization

```
/
├── *.html              # Static marketing pages
├── script.js           # Static site JavaScript
├── style.css           # Static site styles
└── raru/               # Next.js application
    ├── pages/          # Next.js pages and API routes
    │   ├── api/        # Backend API endpoints
    │   ├── admin/      # Admin dashboard
    │   ├── media/      # Media management
    │   └── talents/    # Talent profiles
    ├── components/     # React components
    ├── public/         # Static assets
    └── data/           # Data files
```

## Important Notes

- Both static HTML and Next.js parts reference images in `/raru/public/images/`
- The project uses Japanese language content for RARU entertainment agency
- Custom animations and smooth scrolling are implemented in vanilla JavaScript
- Admin functionality requires proper authentication (check API routes)
- Form submissions use Nodemailer for email handling