╔══════════════════════════════════════════════════════════════════════╗
║              EVOLINE MEDSLOT — FULL-STACK MVP DEVELOPER GUIDE               ║
║                  Next.js 14 · NestJS · PostgreSQL                   ║
╚══════════════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MONOREPO STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

evoline-medslot/
├── package.json                    # Root workspace (Turborepo)
├── turbo.json                      # Build pipeline config
│
├── apps/
│   ├── backend/                    # NestJS API (port 3001)
│   │   ├── src/
│   │   │   ├── main.ts             # Bootstrap: Swagger, CORS, guards
│   │   │   ├── app.module.ts       # Root module wiring
│   │   │   ├── config/
│   │   │   │   └── database.config.ts
│   │   │   ├── common/
│   │   │   │   ├── decorators/     # @Roles, @CurrentUser
│   │   │   │   ├── filters/        # HttpExceptionFilter
│   │   │   │   ├── guards/         # JwtAuthGuard, RolesGuard
│   │   │   │   ├── interceptors/   # TransformInterceptor, LoggingInterceptor
│   │   │   │   ├── pipes/          # ValidationPipe config
│   │   │   │   └── entities/       # BaseEntity (UUID, timestamps, soft-delete)
│   │   │   ├── database/
│   │   │   │   ├── migrations/     # TypeORM migration files
│   │   │   │   └── seeds/          # Development seed data
│   │   │   └── modules/
│   │   │       ├── auth/
│   │   │       │   ├── user.entity.ts
│   │   │       │   ├── auth.service.ts   # register, login, JWT
│   │   │       │   ├── auth.controller.ts
│   │   │       │   ├── auth.module.ts
│   │   │       │   ├── dto/auth.dto.ts
│   │   │       │   ├── guards/           # jwt-auth.guard, roles.guard
│   │   │       │   └── strategies/       # jwt.strategy.ts
│   │   │       ├── clinics/
│   │   │       │   ├── clinic.entity.ts
│   │   │       │   ├── clinics.service.ts  # search, CRUD, slug, rating
│   │   │       │   ├── clinics.controller.ts
│   │   │       │   ├── clinics.module.ts
│   │   │       │   └── dto/clinic.dto.ts
│   │   │       ├── doctors/
│   │   │       │   ├── doctor.entity.ts
│   │   │       │   ├── doctors.service.ts
│   │   │       │   ├── doctors.controller.ts
│   │   │       │   └── doctors.module.ts
│   │   │       ├── slots/
│   │   │       │   ├── slot.entity.ts
│   │   │       │   ├── slots.service.ts    # bulk create, availability
│   │   │       │   ├── slots.controller.ts
│   │   │       │   └── slots.module.ts
│   │   │       ├── bookings/
│   │   │       │   ├── appointment.entity.ts
│   │   │       │   ├── bookings.service.ts # atomic lock, create, cancel
│   │   │       │   ├── bookings.controller.ts
│   │   │       │   ├── bookings.module.ts
│   │   │       │   └── dto/booking.dto.ts
│   │   │       ├── inquiries/
│   │   │       │   ├── inquiry.entity.ts
│   │   │       │   ├── inquiries.service.ts
│   │   │       │   ├── inquiries.controller.ts
│   │   │       │   └── inquiries.module.ts
│   │   │       └── notifications/
│   │   │           ├── notifications.service.ts  # WhatsApp, Email
│   │   │           └── notifications.module.ts
│   │   ├── .env.example
│   │   └── package.json
│   │
│   └── frontend/                   # Next.js 14 App Router (port 3000)
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.tsx              # Root layout + QueryClientProvider
│       │   │   ├── globals.css
│       │   │   ├── page.tsx                # Homepage
│       │   │   ├── clinics/
│       │   │   │   ├── page.tsx            # Clinic search with filters
│       │   │   │   └── [slug]/page.tsx     # Clinic detail + booking widget
│       │   │   ├── booking/
│       │   │   │   └── [id]/page.tsx       # Post-booking confirmation
│       │   │   ├── dashboard/
│       │   │   │   ├── page.tsx            # Owner dashboard
│       │   │   │   └── bookings/page.tsx   # Patient appointments
│       │   │   └── auth/
│       │   │       ├── login/page.tsx
│       │   │       └── register/page.tsx
│       │   ├── components/
│       │   │   ├── ui/
│       │   │   │   ├── index.tsx           # StarRating, Skeleton, Pagination, Badge
│       │   │   │   ├── StarRating.tsx
│       │   │   │   ├── Skeleton.tsx
│       │   │   │   ├── Pagination.tsx
│       │   │   │   └── VerifiedBadge.tsx
│       │   │   ├── clinic/
│       │   │   │   ├── ClinicCard.tsx      # Listing grid card
│       │   │   │   └── SearchFilters.tsx   # Sidebar filters
│       │   │   ├── booking/
│       │   │   │   └── BookingWidget.tsx   # Date/slot/form flow
│       │   │   ├── inquiry/
│       │   │   │   └── InquiryForm.tsx     # Investor inquiry
│       │   │   └── layout/
│       │   │       ├── Navbar.tsx
│       │   │       └── Footer.tsx
│       │   ├── hooks/
│       │   │   └── index.ts                # All React Query hooks
│       │   ├── lib/
│       │   │   ├── api/
│       │   │   │   ├── client.ts           # Axios + interceptors + token mgmt
│       │   │   │   └── services.ts         # All API call functions
│       │   │   └── utils/
│       │   │       └── index.ts            # cn(), formatAED(), timeAgo(), etc.
│       │   ├── store/
│       │   │   └── auth.store.ts           # Zustand persisted auth state
│       │   └── types/
│       │       └── index.ts                # All shared TypeScript interfaces
│       ├── next.config.js
│       ├── tailwind.config.js
│       └── package.json
│
└── packages/
    └── shared/                     # Shared Zod schemas, types (Phase 2)
        └── src/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 API ENDPOINT REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AUTH
  POST   /api/v1/auth/register         Register (patient/investor/clinic_owner)
  POST   /api/v1/auth/login            Login → returns JWT pair
  POST   /api/v1/auth/refresh          Refresh access token
  GET    /api/v1/auth/me               Get current user [JWT]

CLINICS
  GET    /api/v1/clinics               Search + filter (public)
  GET    /api/v1/clinics/:id           Get clinic by ID (public)
  GET    /api/v1/clinics/slug/:slug    Get clinic by slug (public)
  POST   /api/v1/clinics               Create clinic [CLINIC_OWNER]
  PUT    /api/v1/clinics/:id           Update clinic [CLINIC_OWNER|ADMIN]
  DELETE /api/v1/clinics/:id           Soft-delete clinic [CLINIC_OWNER|ADMIN]
  GET    /api/v1/clinics/my/clinic     Get owner's clinic [CLINIC_OWNER]
  PATCH  /api/v1/clinics/:id/verify    Verify listing [ADMIN]

SLOTS
  GET    /api/v1/slots/clinic/:id      Get slots for clinic + date (public)
  GET    /api/v1/slots/doctor/:id      Get slots for doctor + range (public)
  POST   /api/v1/slots/bulk            Bulk-generate slots [CLINIC_OWNER]
  PATCH  /api/v1/slots/:id/block       Block a slot [CLINIC_OWNER]

BOOKINGS
  POST   /api/v1/bookings              Book an appointment [PATIENT]
  POST   /api/v1/bookings/lock-slot    Lock slot for 10 min [PATIENT]
  GET    /api/v1/bookings/my           Patient's appointments [PATIENT]
  GET    /api/v1/bookings/clinic/:id   Clinic appointments [CLINIC_OWNER]
  GET    /api/v1/bookings/:id          Get single appointment [AUTH]
  PATCH  /api/v1/bookings/:id/cancel   Cancel appointment [AUTH]
  PATCH  /api/v1/bookings/:id/confirm  Confirm appointment [CLINIC_OWNER]

INQUIRIES
  POST   /api/v1/inquiries             Submit inquiry [INVESTOR]
  GET    /api/v1/inquiries/my          My inquiries [INVESTOR]
  GET    /api/v1/inquiries/listing/:id Listing's inquiries [CLINIC_OWNER|ADMIN]
  PATCH  /api/v1/inquiries/:id/status  Update pipeline stage [CLINIC_OWNER]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 QUICK START
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# 1. Prerequisites
   PostgreSQL 15+, Node.js 20+, Redis (optional for MVP)

# 2. Clone and install
   git clone https://github.com/your-org/medslot
   cd medslot && npm install

# 3. Configure backend
   cd apps/backend
   cp .env.example .env
   # Edit .env: DB credentials, JWT secrets

# 4. Create database
   createdb medslot
   npm run db:migrate
   npm run db:seed         # Optional: loads sample clinics

# 5. Start development servers
   cd ../..
   npm run dev             # Starts both frontend + backend via Turborepo

   Backend:  http://localhost:3001/api
   Frontend: http://localhost:3000
   Swagger:  http://localhost:3001/api/docs

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 KEY ARCHITECTURAL DECISIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. SLOT LOCKING
   - POST /bookings/lock-slot sets slot.status = LOCKED + slot.lockedUntil = now+10min
   - Uses DB transaction with SELECT FOR UPDATE (pessimistic locking)
   - BookingsService.releaseExpiredLocks() runs every 5 min via cron
   - Final guard: UNIQUE constraint on appointments.slot_id (DB-level safety net)

2. STANDARD API ENVELOPE
   All responses: { success: true, data: <payload>, timestamp: "..." }
   All errors:    { statusCode, timestamp, path, method, message }
   Frontend axios interceptor unwraps .data automatically

3. ROLE-BASED ACCESS
   @Roles(UserRole.CLINIC_OWNER) + @UseGuards(JwtAuthGuard, RolesGuard)
   Resource ownership checked in service layer (not just role)

4. REACT QUERY STRATEGY
   - staleTime: 30s for clinic list, 10s for slots (slots change fast)
   - refetchInterval: 30s for slots (shows real-time availability)
   - keepPreviousData on paginated clinic search (smooth page transitions)
   - Optimistic invalidation after booking (slot list + bookings list)

5. SOFT DELETES
   All entities use TypeORM @DeleteDateColumn (deleted_at)
   TypeORM withDeleted: false by default everywhere

6. NOTIFICATIONS
   Fire-and-forget via setImmediate() inside transaction success
   Graceful degradation: mock logs if Twilio/SendGrid not configured
   Promise.allSettled() — WhatsApp failure doesn't block email

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 SCALING CHECKLIST (Phase 2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Replace setTimeout locks with Redis SETNX (sub-millisecond)
□ Add read replica for clinic search queries
□ Move notification dispatch to SQS worker queue
□ Enable PostgreSQL Row Level Security for multi-tenant SaaS
□ Add ElasticSearch for full-text clinic search at scale
□ CDN-cache GET /api/v1/clinics with 30s TTL via CloudFront
□ Migrate slot locking from DB to Redis with Lua scripts
□ Add WebSocket gateway (Socket.io + Redis adapter) for real-time booking updates
