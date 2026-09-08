-- ============================================================
--  Evoline MedSlot — PostgreSQL Database Schema (Simplified)
--  Extensions: uuid-ossp, pg_trgm, citext (no postgis)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ─────────────────────────────────────────
--  ENUMS
-- ─────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('patient', 'clinic_owner', 'investor', 'admin');
CREATE TYPE user_status AS ENUM ('pending_verification', 'active', 'suspended', 'deactivated');
CREATE TYPE gender AS ENUM ('male', 'female', 'prefer_not_to_say');
CREATE TYPE emirate AS ENUM ('dubai', 'abu_dhabi', 'sharjah', 'ajman', 'umm_al_quwain', 'fujairah', 'ras_al_khaimah');
CREATE TYPE clinic_status AS ENUM ('draft', 'pending_review', 'active', 'suspended', 'closed');
CREATE TYPE listing_status AS ENUM ('draft', 'pending_admin_review', 'active', 'under_offer', 'sold', 'withdrawn');
CREATE TYPE listing_type AS ENUM ('full_sale', 'partial_stake', 'investment_opportunity', 'partnership');
CREATE TYPE inquiry_status AS ENUM ('new', 'viewed', 'in_discussion', 'nda_signed', 'offer_made', 'closed_won', 'closed_lost');
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show');
CREATE TYPE slot_status AS ENUM ('available', 'locked', 'booked', 'blocked');
CREATE TYPE day_of_week AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read');
CREATE TYPE notification_type AS ENUM ('booking_confirmed', 'booking_cancelled', 'booking_reminder', 'inquiry_received', 'inquiry_update', 'review_received', 'message_received', 'listing_approved', 'system');
CREATE TYPE notification_channel AS ENUM ('in_app', 'email', 'sms', 'whatsapp');
CREATE TYPE file_entity_type AS ENUM ('user_avatar', 'clinic_photo', 'clinic_document', 'listing_document', 'message_attachment');
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'past_due', 'cancelled', 'expired');

-- ============================================================
--  MODULE 1: USERS
-- ============================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email CITEXT NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255),
    role user_role NOT NULL DEFAULT 'patient',
    status user_status NOT NULL DEFAULT 'pending_verification',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    gender gender,
    date_of_birth DATE,
    nationality VARCHAR(100),
    profile_photo_url TEXT,
    language_preference VARCHAR(10) NOT NULL DEFAULT 'en',
    google_id VARCHAR(255),
    apple_id VARCHAR(255),
    email_verified_at TIMESTAMPTZ,
    phone_verified_at TIMESTAMPTZ,
    email_verify_token VARCHAR(255),
    phone_otp VARCHAR(10),
    phone_otp_expires TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    last_login_ip INET,
    failed_login_count SMALLINT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    two_fa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    two_fa_secret VARCHAR(255),
    tenant_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX uq_users_email ON users (email) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_users_phone ON users (phone) WHERE deleted_at IS NULL AND phone IS NOT NULL;
CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_status ON users (status);
CREATE INDEX idx_users_name_trgm ON users USING GIN ((first_name || ' ' || last_name) gin_trgm_ops);

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    user_agent TEXT,
    ip_address INET,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);

CREATE TABLE patient_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    blood_type VARCHAR(5),
    allergies TEXT[],
    chronic_conditions TEXT[],
    emergency_contact JSONB,
    insurance_provider VARCHAR(255),
    insurance_number VARCHAR(100),
    preferred_emirate emirate,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE investor_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    company_name VARCHAR(255),
    trade_license_no VARCHAR(100),
    investment_min DECIMAL(15, 2),
    investment_max DECIMAL(15, 2),
    preferred_emirates emirate[],
    preferred_specialties VARCHAR(100)[],
    bio TEXT,
    nda_template_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
--  MODULE 2: CLINICS
-- ============================================================

CREATE TABLE specialties (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    slug VARCHAR(100) NOT NULL UNIQUE,
    icon_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE clinics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    description_ar TEXT,
    status clinic_status NOT NULL DEFAULT 'draft',
    emirate emirate NOT NULL,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    area VARCHAR(100),
    phone VARCHAR(20),
    whatsapp VARCHAR(20),
    email CITEXT,
    website TEXT,
    dha_license_no VARCHAR(100),
    moh_license_no VARCHAR(100),
    haad_license_no VARCHAR(100),
    license_expiry DATE,
    is_admin_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES users (id),
    rating_avg DECIMAL(3, 2) DEFAULT 0.00,
    review_count INTEGER NOT NULL DEFAULT 0,
    booking_count INTEGER NOT NULL DEFAULT 0,
    subscription_tier subscription_tier NOT NULL DEFAULT 'free',
    tenant_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX uq_clinics_slug ON clinics (slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_clinics_owner_id ON clinics (owner_id);
CREATE INDEX idx_clinics_status ON clinics (status);
CREATE INDEX idx_clinics_emirate ON clinics (emirate);
CREATE INDEX idx_clinics_name_trgm ON clinics USING GIN (name gin_trgm_ops);

CREATE TABLE clinic_specialties (
    clinic_id UUID NOT NULL REFERENCES clinics (id) ON DELETE CASCADE,
    specialty_id INTEGER NOT NULL REFERENCES specialties (id) ON DELETE CASCADE,
    PRIMARY KEY (clinic_id, specialty_id)
);

CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics (id) ON DELETE CASCADE,
    user_id UUID REFERENCES users (id),
    full_name VARCHAR(255) NOT NULL,
    full_name_ar VARCHAR(255),
    title VARCHAR(50),
    specialty_id INTEGER REFERENCES specialties (id),
    qualifications TEXT[],
    languages VARCHAR(10)[],
    bio TEXT,
    photo_url TEXT,
    dha_reg_no VARCHAR(100),
    consultation_fee DECIMAL(10, 2),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_doctors_clinic_id ON doctors (clinic_id);
CREATE INDEX idx_doctors_is_active ON doctors (is_active) WHERE is_active = TRUE;

CREATE TABLE clinic_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics (id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors (id) ON DELETE CASCADE,
    day day_of_week NOT NULL,
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    slot_duration_minutes SMALLINT NOT NULL DEFAULT 30,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT chk_hours_order CHECK (close_time > open_time)
);

CREATE INDEX idx_clinic_hours_clinic_id ON clinic_hours (clinic_id);

CREATE TABLE slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics (id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors (id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status slot_status NOT NULL DEFAULT 'available',
    locked_until TIMESTAMPTZ,
    fee DECIMAL(10, 2),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_slot_times CHECK (end_time > start_time)
);

CREATE INDEX idx_slots_clinic_id ON slots (clinic_id);
CREATE INDEX idx_slots_doctor_id ON slots (doctor_id);
CREATE INDEX idx_slots_status ON slots (status);
CREATE INDEX idx_slots_available ON slots (doctor_id, start_time) WHERE status = 'available';

CREATE TABLE clinic_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics (id) ON DELETE CASCADE,
    uploader_id UUID NOT NULL REFERENCES users (id),
    entity_type file_entity_type NOT NULL,
    s3_bucket VARCHAR(100) NOT NULL,
    s3_key TEXT NOT NULL,
    file_name VARCHAR(255),
    mime_type VARCHAR(100),
    size_bytes BIGINT,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order SMALLINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clinic_files_clinic_id ON clinic_files (clinic_id);
CREATE INDEX idx_clinic_files_type ON clinic_files (entity_type);

-- ============================================================
--  MODULE 3: MARKETPLACE LISTINGS
-- ============================================================

CREATE TABLE marketplace_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics (id) ON DELETE RESTRICT,
    seller_id UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    listing_type listing_type NOT NULL,
    status listing_status NOT NULL DEFAULT 'draft',
    asking_price DECIMAL(15, 2) NOT NULL,
    stake_percentage DECIMAL(5, 2),
    annual_revenue DECIMAL(15, 2),
    annual_profit DECIMAL(15, 2),
    ebitda DECIMAL(15, 2),
    established_year SMALLINT,
    staff_count SMALLINT,
    title VARCHAR(255) NOT NULL,
    headline VARCHAR(500),
    description TEXT,
    highlights TEXT[],
    reason_for_sale TEXT,
    is_admin_verified BOOLEAN NOT NULL DEFAULT FALSE,
    admin_note TEXT,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES users (id),
    success_fee_pct DECIMAL(4, 2) NOT NULL DEFAULT 2.50,
    success_fee_paid BOOLEAN NOT NULL DEFAULT FALSE,
    is_confidential BOOLEAN NOT NULL DEFAULT FALSE,
    view_count INTEGER NOT NULL DEFAULT 0,
    inquiry_count INTEGER NOT NULL DEFAULT 0,
    published_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_listings_seller_id ON marketplace_listings (seller_id);
CREATE INDEX idx_listings_clinic_id ON marketplace_listings (clinic_id);
CREATE INDEX idx_listings_status ON marketplace_listings (status);
CREATE INDEX idx_listings_type ON marketplace_listings (listing_type);

CREATE TABLE listing_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES marketplace_listings (id) ON DELETE CASCADE,
    uploader_id UUID NOT NULL REFERENCES users (id),
    label VARCHAR(255) NOT NULL,
    s3_bucket VARCHAR(100) NOT NULL,
    s3_key TEXT NOT NULL,
    mime_type VARCHAR(100),
    size_bytes BIGINT,
    requires_nda BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_listing_docs_listing_id ON listing_documents (listing_id);

-- ============================================================
--  MODULE 4: INQUIRIES
-- ============================================================

CREATE TABLE inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES marketplace_listings (id) ON DELETE CASCADE,
    investor_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    status inquiry_status NOT NULL DEFAULT 'new',
    budget_min DECIMAL(15, 2),
    budget_max DECIMAL(15, 2),
    stake_interest_pct DECIMAL(5, 2),
    message TEXT NOT NULL,
    timeline VARCHAR(100),
    nda_required BOOLEAN NOT NULL DEFAULT TRUE,
    nda_signed_at TIMESTAMPTZ,
    nda_document_url TEXT,
    seller_notes TEXT,
    admin_notes TEXT,
    first_viewed_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inquiries_listing_id ON inquiries (listing_id);
CREATE INDEX idx_inquiries_investor_id ON inquiries (investor_id);
CREATE INDEX idx_inquiries_status ON inquiries (status);
CREATE UNIQUE INDEX uq_inquiries_investor_listing ON inquiries (investor_id, listing_id) WHERE status NOT IN ('closed_won', 'closed_lost');

CREATE TABLE inquiry_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inquiry_id UUID NOT NULL REFERENCES inquiries (id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES users (id),
    from_status inquiry_status,
    to_status inquiry_status,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inquiry_activities_inquiry_id ON inquiry_activities (inquiry_id);

CREATE TABLE watchlist (
    investor_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES marketplace_listings (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (investor_id, listing_id)
);

-- ============================================================
--  MODULE 5: APPOINTMENTS
-- ============================================================

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    clinic_id UUID NOT NULL REFERENCES clinics (id) ON DELETE RESTRICT,
    doctor_id UUID NOT NULL REFERENCES doctors (id) ON DELETE RESTRICT,
    slot_id UUID NOT NULL REFERENCES slots (id) ON DELETE RESTRICT,
    status appointment_status NOT NULL DEFAULT 'pending',
    appointment_date TIMESTAMPTZ NOT NULL,
    reason TEXT,
    patient_notes TEXT,
    is_first_visit BOOLEAN NOT NULL DEFAULT FALSE,
    clinic_notes TEXT,
    diagnosis_code VARCHAR(20),
    fee_charged DECIMAL(10, 2),
    fee_paid BOOLEAN NOT NULL DEFAULT FALSE,
    payment_ref VARCHAR(255),
    reminder_24h_sent BOOLEAN NOT NULL DEFAULT FALSE,
    reminder_2h_sent BOOLEAN NOT NULL DEFAULT FALSE,
    confirmed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancel_reason TEXT,
    cancelled_by UUID REFERENCES users (id),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_appointments_patient_id ON appointments (patient_id);
CREATE INDEX idx_appointments_clinic_id ON appointments (clinic_id);
CREATE INDEX idx_appointments_doctor_id ON appointments (doctor_id);
CREATE INDEX idx_appointments_status ON appointments (status);
CREATE INDEX idx_appointments_date ON appointments (appointment_date DESC);
CREATE UNIQUE INDEX uq_appointments_slot ON appointments (slot_id) WHERE status NOT IN ('cancelled', 'no_show');

CREATE TABLE appointment_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES appointments (id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES users (id),
    from_status appointment_status,
    to_status appointment_status NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_appt_history_appointment_id ON appointment_status_history (appointment_id);

-- ============================================================
--  MODULE 6: REVIEWS
-- ============================================================

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES appointments (id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinics (id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors (id) ON DELETE SET NULL,
    rating_overall SMALLINT NOT NULL CHECK (rating_overall BETWEEN 1 AND 5),
    rating_doctor SMALLINT CHECK (rating_doctor BETWEEN 1 AND 5),
    rating_staff SMALLINT CHECK (rating_staff BETWEEN 1 AND 5),
    rating_facility SMALLINT CHECK (rating_facility BETWEEN 1 AND 5),
    rating_wait_time SMALLINT CHECK (rating_wait_time BETWEEN 1 AND 5),
    title VARCHAR(255),
    body TEXT,
    is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users (id),
    is_flagged BOOLEAN NOT NULL DEFAULT FALSE,
    flag_reason TEXT,
    clinic_response TEXT,
    clinic_responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX uq_reviews_appointment ON reviews (appointment_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_reviews_clinic_id ON reviews (clinic_id);
CREATE INDEX idx_reviews_patient_id ON reviews (patient_id);
CREATE INDEX idx_reviews_doctor_id ON reviews (doctor_id) WHERE doctor_id IS NOT NULL;
CREATE INDEX idx_reviews_approved ON reviews (clinic_id, rating_overall DESC) WHERE is_approved = TRUE AND deleted_at IS NULL;

CREATE TABLE review_votes (
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    review_id UUID NOT NULL REFERENCES reviews (id) ON DELETE CASCADE,
    is_helpful BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, review_id)
);

-- ============================================================
--  MODULE 7: MESSAGES
-- ============================================================

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_a UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    participant_b UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    inquiry_id UUID REFERENCES inquiries (id) ON DELETE SET NULL,
    listing_id UUID REFERENCES marketplace_listings (id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES appointments (id) ON DELETE SET NULL,
    last_message_at TIMESTAMPTZ,
    last_message_preview VARCHAR(255),
    unread_count_a INTEGER NOT NULL DEFAULT 0,
    unread_count_b INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_diff_participants CHECK (participant_a <> participant_b)
);

CREATE UNIQUE INDEX uq_conversations_pair ON conversations (
    LEAST(participant_a::TEXT, participant_b::TEXT),
    GREATEST(participant_a::TEXT, participant_b::TEXT),
    COALESCE(inquiry_id::TEXT, 'none')
);
CREATE INDEX idx_conversations_participant_a ON conversations (participant_a);
CREATE INDEX idx_conversations_last_msg ON conversations (last_message_at DESC);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    body TEXT,
    status message_status NOT NULL DEFAULT 'sent',
    has_attachment BOOLEAN NOT NULL DEFAULT FALSE,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    edited_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_id ON messages (conversation_id);
CREATE INDEX idx_messages_sender_id ON messages (sender_id);

CREATE TABLE message_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages (id) ON DELETE CASCADE,
    s3_bucket VARCHAR(100) NOT NULL,
    s3_key TEXT NOT NULL,
    file_name VARCHAR(255),
    mime_type VARCHAR(100),
    size_bytes BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_msg_attachments_message_id ON message_attachments (message_id);

-- ============================================================
--  MODULE 8: NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    channel notification_channel NOT NULL DEFAULT 'in_app',
    title VARCHAR(255) NOT NULL,
    body TEXT,
    entity_type VARCHAR(50),
    entity_id UUID,
    action_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    fail_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications (user_id);
CREATE INDEX idx_notifications_unread ON notifications (user_id, created_at DESC) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_type ON notifications (type);

-- ============================================================
--  MODULE 9: SUBSCRIPTIONS
-- ============================================================

CREATE TABLE clinic_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL UNIQUE REFERENCES clinics (id) ON DELETE CASCADE,
    tier subscription_tier NOT NULL DEFAULT 'free',
    status subscription_status NOT NULL DEFAULT 'active',
    stripe_customer_id VARCHAR(255),
    stripe_sub_id VARCHAR(255),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    cancelled_at TIMESTAMPTZ,
    price_aed DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clinic_subs_stripe_sub ON clinic_subscriptions (stripe_sub_id) WHERE stripe_sub_id IS NOT NULL;

-- ============================================================
--  MODULE 10: AUDIT LOG
-- ============================================================

CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    actor_id UUID REFERENCES users (id) ON DELETE SET NULL,
    actor_role user_role,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_actor_id ON audit_log (actor_id);
CREATE INDEX idx_audit_log_entity ON audit_log (entity_type, entity_id);
CREATE INDEX idx_audit_log_created_at ON audit_log (created_at DESC);

-- ============================================================
--  TRIGGERS — updated_at auto-maintenance
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_patient_profiles_updated_at BEFORE UPDATE ON patient_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_investor_profiles_updated_at BEFORE UPDATE ON investor_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_clinics_updated_at BEFORE UPDATE ON clinics FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_doctors_updated_at BEFORE UPDATE ON doctors FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_marketplace_listings_updated_at BEFORE UPDATE ON marketplace_listings FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_inquiries_updated_at BEFORE UPDATE ON inquiries FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_clinic_subscriptions_updated_at BEFORE UPDATE ON clinic_subscriptions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
--  SEED: SPECIALTIES
-- ============================================================

INSERT INTO specialties (name, name_ar, slug) VALUES
    ('General Practice', 'الطب العام', 'general-practice'),
    ('Dentistry', 'طب الأسنان', 'dentistry'),
    ('Dermatology', 'الأمراض الجلدية', 'dermatology'),
    ('Cardiology', 'أمراض القلب', 'cardiology'),
    ('Orthopedics', 'جراحة العظام', 'orthopedics'),
    ('Pediatrics', 'طب الأطفال', 'pediatrics'),
    ('Obstetrics & Gynecology', 'أمراض النساء والتوليد', 'obs-gynecology'),
    ('Ophthalmology', 'طب العيون', 'ophthalmology'),
    ('ENT', 'الأنف والأذن والحنجرة', 'ent'),
    ('Psychiatry', 'الطب النفسي', 'psychiatry'),
    ('Physiotherapy', 'العلاج الطبيعي', 'physiotherapy'),
    ('Radiology', 'الأشعة التشخيصية', 'radiology'),
    ('Oncology', 'طب الأورام', 'oncology'),
    ('Neurology', 'طب الأعصاب', 'neurology'),
    ('Urology', 'المسالك البولية', 'urology'),
    ('Plastic Surgery', 'الجراحة التجميلية', 'plastic-surgery'),
    ('Nutrition & Dietetics', 'التغذية والحمية', 'nutrition'),
    ('Internal Medicine', 'الطب الباطني', 'internal-medicine');

-- ============================================================
--  ROW LEVEL SECURITY (SaaS Phase 2)
-- ============================================================

ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;

-- ============================================================
--  SCHEMA COMPLETE
-- ============================================================
