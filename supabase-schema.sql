-- Prometheus Gym Suite - Database Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE membership_type AS ENUM ('basic', 'premium', 'vip', 'trial');
CREATE TYPE activity_status AS ENUM ('active', 'moderate', 'inactive');
CREATE TYPE payment_status AS ENUM ('paid', 'pending', 'overdue');
CREATE TYPE session_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
CREATE TYPE staff_role AS ENUM ('owner', 'admin', 'manager', 'coach', 'receptionist');

-- ============================================
-- TABLES
-- ============================================

-- Gyms table
CREATE TABLE gyms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    logo_url TEXT,
    timezone TEXT DEFAULT 'Europe/Berlin',
    currency TEXT DEFAULT 'EUR',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    gym_id UUID REFERENCES gyms(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role staff_role DEFAULT 'coach',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff table
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role staff_role DEFAULT 'coach',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(gym_id, profile_id)
);

-- Coaches table
CREATE TABLE coaches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    specializations TEXT[] DEFAULT '{}',
    bio TEXT,
    hourly_rate DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    client_count INTEGER DEFAULT 0,
    sessions_this_month INTEGER DEFAULT 0,
    revenue_this_month DECIMAL(10,2) DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Members table
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    membership_type membership_type DEFAULT 'basic',
    membership_start DATE DEFAULT CURRENT_DATE,
    membership_end DATE,
    monthly_fee DECIMAL(10,2) DEFAULT 0,
    activity_status activity_status DEFAULT 'active',
    last_visit TIMESTAMPTZ,
    total_visits INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Member visits table
CREATE TABLE member_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    check_in TIMESTAMPTZ DEFAULT NOW(),
    check_out TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    session_type TEXT DEFAULT 'personal',
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status session_status DEFAULT 'scheduled',
    price DECIMAL(10,2) DEFAULT 0,
    max_participants INTEGER DEFAULT 1,
    current_participants INTEGER DEFAULT 0,
    location TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session participants table
CREATE TABLE session_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    attended BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, member_id)
);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    payment_type TEXT DEFAULT 'membership',
    status payment_status DEFAULT 'pending',
    due_date DATE NOT NULL,
    paid_date TIMESTAMPTZ,
    payment_method TEXT,
    invoice_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    is_broadcast BOOLEAN DEFAULT false,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts table
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    related_id UUID,
    related_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings table
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(gym_id, key)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_profiles_gym_id ON profiles(gym_id);
CREATE INDEX idx_staff_gym_id ON staff(gym_id);
CREATE INDEX idx_coaches_gym_id ON coaches(gym_id);
CREATE INDEX idx_coaches_is_active ON coaches(gym_id, is_active);
CREATE INDEX idx_members_gym_id ON members(gym_id);
CREATE INDEX idx_members_coach_id ON members(coach_id);
CREATE INDEX idx_members_activity_status ON members(gym_id, activity_status);
CREATE INDEX idx_member_visits_member_id ON member_visits(member_id);
CREATE INDEX idx_member_visits_gym_id ON member_visits(gym_id);
CREATE INDEX idx_member_visits_check_in ON member_visits(check_in);
CREATE INDEX idx_sessions_gym_id ON sessions(gym_id);
CREATE INDEX idx_sessions_coach_id ON sessions(coach_id);
CREATE INDEX idx_sessions_start_time ON sessions(start_time);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_payments_gym_id ON payments(gym_id);
CREATE INDEX idx_payments_member_id ON payments(member_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_due_date ON payments(due_date);
CREATE INDEX idx_messages_gym_id ON messages(gym_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_alerts_gym_id ON alerts(gym_id);
CREATE INDEX idx_alerts_is_read ON alerts(gym_id, is_read);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_gyms_updated_at BEFORE UPDATE ON gyms FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_coaches_updated_at BEFORE UPDATE ON coaches FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to update activity status based on last visit
CREATE OR REPLACE FUNCTION update_member_activity_status()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE members
    SET activity_status = CASE
        WHEN last_visit >= NOW() - INTERVAL '7 days' THEN 'active'::activity_status
        WHEN last_visit >= NOW() - INTERVAL '30 days' THEN 'moderate'::activity_status
        ELSE 'inactive'::activity_status
    END
    WHERE id = NEW.member_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_activity_on_visit
AFTER INSERT ON member_visits
FOR EACH ROW EXECUTE FUNCTION update_member_activity_status();

-- Function to update coach client count
CREATE OR REPLACE FUNCTION update_coach_client_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW.coach_id IS NOT NULL THEN
            UPDATE coaches
            SET client_count = (SELECT COUNT(*) FROM members WHERE coach_id = NEW.coach_id)
            WHERE id = NEW.coach_id;
        END IF;
        IF TG_OP = 'UPDATE' AND OLD.coach_id IS NOT NULL AND OLD.coach_id != NEW.coach_id THEN
            UPDATE coaches
            SET client_count = (SELECT COUNT(*) FROM members WHERE coach_id = OLD.coach_id)
            WHERE id = OLD.coach_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.coach_id IS NOT NULL THEN
            UPDATE coaches
            SET client_count = (SELECT COUNT(*) FROM members WHERE coach_id = OLD.coach_id)
            WHERE id = OLD.coach_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_coach_clients
AFTER INSERT OR UPDATE OR DELETE ON members
FOR EACH ROW EXECUTE FUNCTION update_coach_client_count();

-- Function to increment member visits
CREATE OR REPLACE FUNCTION increment_visits(member_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    new_count INTEGER;
BEGIN
    UPDATE members
    SET total_visits = total_visits + 1,
        last_visit = NOW()
    WHERE id = member_uuid
    RETURNING total_visits INTO new_count;
    RETURN new_count;
END;
$$ LANGUAGE plpgsql;

-- Function to increment/decrement session participants
CREATE OR REPLACE FUNCTION increment_session_participants(session_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE sessions
    SET current_participants = current_participants + 1
    WHERE id = session_uuid;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_session_participants(session_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE sessions
    SET current_participants = GREATEST(0, current_participants - 1)
    WHERE id = session_uuid;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Gyms policies
CREATE POLICY "Users can view their gym"
ON gyms FOR SELECT
USING (
    id IN (SELECT gym_id FROM profiles WHERE id = auth.uid())
    OR id IN (SELECT gym_id FROM staff WHERE profile_id = auth.uid())
);

CREATE POLICY "Owners can update their gym"
ON gyms FOR UPDATE
USING (
    id IN (SELECT gym_id FROM profiles WHERE id = auth.uid() AND role = 'owner')
);

CREATE POLICY "Users can create gyms"
ON gyms FOR INSERT
WITH CHECK (true);

-- Staff policies
CREATE POLICY "Staff can view gym staff"
ON staff FOR SELECT
USING (
    gym_id IN (SELECT gym_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Admins can manage staff"
ON staff FOR ALL
USING (
    gym_id IN (SELECT gym_id FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
);

-- Coaches policies
CREATE POLICY "Staff can view gym coaches"
ON coaches FOR SELECT
USING (
    gym_id IN (SELECT gym_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Admins can manage coaches"
ON coaches FOR ALL
USING (
    gym_id IN (SELECT gym_id FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'manager'))
);

-- Members policies
CREATE POLICY "Staff can view gym members"
ON members FOR SELECT
USING (
    gym_id IN (SELECT gym_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Staff can manage members"
ON members FOR ALL
USING (
    gym_id IN (SELECT gym_id FROM profiles WHERE id = auth.uid())
);

-- Member visits policies
CREATE POLICY "Staff can view gym visits"
ON member_visits FOR SELECT
USING (
    gym_id IN (SELECT gym_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Staff can manage visits"
ON member_visits FOR ALL
USING (
    gym_id IN (SELECT gym_id FROM profiles WHERE id = auth.uid())
);

-- Sessions policies
CREATE POLICY "Staff can view gym sessions"
ON sessions FOR SELECT
USING (
    gym_id IN (SELECT gym_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Staff can manage sessions"
ON sessions FOR ALL
USING (
    gym_id IN (SELECT gym_id FROM profiles WHERE id = auth.uid())
);

-- Session participants policies
CREATE POLICY "Staff can view session participants"
ON session_participants FOR SELECT
USING (
    session_id IN (
        SELECT id FROM sessions WHERE gym_id IN (
            SELECT gym_id FROM profiles WHERE id = auth.uid()
        )
    )
);

CREATE POLICY "Staff can manage session participants"
ON session_participants FOR ALL
USING (
    session_id IN (
        SELECT id FROM sessions WHERE gym_id IN (
            SELECT gym_id FROM profiles WHERE id = auth.uid()
        )
    )
);

-- Payments policies
CREATE POLICY "Staff can view gym payments"
ON payments FOR SELECT
USING (
    gym_id IN (SELECT gym_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Staff can manage payments"
ON payments FOR ALL
USING (
    gym_id IN (SELECT gym_id FROM profiles WHERE id = auth.uid())
);

-- Messages policies
CREATE POLICY "Users can view their messages"
ON messages FOR SELECT
USING (
    sender_id = auth.uid()
    OR recipient_id = auth.uid()
    OR (is_broadcast = true AND gym_id IN (SELECT gym_id FROM profiles WHERE id = auth.uid()))
);

CREATE POLICY "Users can send messages"
ON messages FOR INSERT
WITH CHECK (
    sender_id = auth.uid()
    AND gym_id IN (SELECT gym_id FROM profiles WHERE id = auth.uid())
);

-- Alerts policies
CREATE POLICY "Staff can view gym alerts"
ON alerts FOR SELECT
USING (
    gym_id IN (SELECT gym_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Staff can manage alerts"
ON alerts FOR ALL
USING (
    gym_id IN (SELECT gym_id FROM profiles WHERE id = auth.uid())
);

-- Settings policies
CREATE POLICY "Staff can view gym settings"
ON settings FOR SELECT
USING (
    gym_id IN (SELECT gym_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Admins can manage settings"
ON settings FOR ALL
USING (
    gym_id IN (SELECT gym_id FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
);

-- ============================================
-- DONE!
-- ============================================
