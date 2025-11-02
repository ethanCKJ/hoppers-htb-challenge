/*
In Neon, databases are stored on branches. By default, a project has one branch and one database.
You can select the branch and database to use from the drop-down menus above.

Try generating sample data and querying it by running the example statements below, or click
New Query to clear the editor.
*/
-- CREATE TABLE IF NOT EXISTS playing_with_neon(id SERIAL PRIMARY KEY, name TEXT NOT NULL, value REAL);
-- INSERT INTO playing_with_neon(name, value)
--   SELECT LEFT(md5(i::TEXT), 10), random() FROM generate_series(1, 10) s(i);
-- SELECT * FROM playing_with_neon;

-- Extensions (Neon supports these)
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;   -- case-insensitive email/tag names

-- Enumerations
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_status') THEN
CREATE TYPE listing_status AS ENUM ('active', 'reserved', 'sold', 'withdrawn');
END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conversation_status') THEN
CREATE TYPE conversation_status AS ENUM ('open', 'closed', 'blocked');
END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_type') THEN
CREATE TYPE message_type AS ENUM ('user', 'system');
END IF;
END$$;

-- Users (no email_verified_at)
CREATE TABLE IF NOT EXISTS users (
                                     id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           CITEXT UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,          -- e.g., Argon2id/bcrypt hash
    name            TEXT,
    phone           TEXT UNIQUE,            -- optional
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    );

CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Listings (no currency_code, no condition, no area_text; add location + address + postcode)
CREATE TABLE IF NOT EXISTS listings (
                                        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title             TEXT NOT NULL,
    description       TEXT NOT NULL,
    price_pence       INTEGER NOT NULL CHECK (price_pence >= 0),
    -- Location fields
    latitude          DOUBLE PRECISION,     -- optional for privacy; add when provided
    longitude         DOUBLE PRECISION,
    address           TEXT,                 -- coarse address (e.g., street only)
    postcode          TEXT,                 -- keep simple for MVP; add regex if you like
    hide_exact_location BOOLEAN NOT NULL DEFAULT TRUE,
    status            listing_status NOT NULL DEFAULT 'active',
    buyer_id          UUID REFERENCES users(id),    -- set when sold
    archived_at       TIMESTAMPTZ,                  -- set when withdrawn/sold if you want to hide
    views_count       INTEGER NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Full-text search vector
    search_tsv        tsvector
    );

-- Basic sanity checks for coordinates (optional but recommended)
ALTER TABLE listings
    ADD CONSTRAINT chk_latitude_range CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90));
ALTER TABLE listings
    ADD CONSTRAINT chk_longitude_range CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180));

CREATE INDEX IF NOT EXISTS idx_listings_status_created ON listings(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price_pence);
CREATE INDEX IF NOT EXISTS idx_listings_location ON listings(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_listings_postcode ON listings(postcode);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_listings_search_tsv ON listings USING GIN (search_tsv);

-- Trigger to keep tsvector updated
CREATE OR REPLACE FUNCTION listings_tsv_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_tsv :=
    setweight(to_tsvector('simple', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.description, '')), 'B');
RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_listings_tsv ON listings;
CREATE TRIGGER trg_listings_tsv
    BEFORE INSERT OR UPDATE OF title, description ON listings
    FOR EACH ROW EXECUTE FUNCTION listings_tsv_trigger();

-- Listing images
CREATE TABLE IF NOT EXISTS listing_images (
                                              id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id   UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    position     INTEGER NOT NULL DEFAULT 0,
    url          TEXT NOT NULL,                 -- public URL or signed path
    storage_key  TEXT,                          -- provider key (e.g., S3 path)
    width_px     INTEGER,
    height_px    INTEGER,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    );

CREATE INDEX IF NOT EXISTS idx_listing_images_listing_pos ON listing_images(listing_id, position);

-- Tags (category as tags)
CREATE TABLE IF NOT EXISTS tags (
                                    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         CITEXT NOT NULL UNIQUE,  -- case-insensitive uniqueness
    slug         TEXT UNIQUE,             -- optional; useful for SEO/URLs
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    );

-- Listing <-> Tags (many-to-many)
CREATE TABLE IF NOT EXISTS listing_tags (
                                            listing_id   UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    tag_id       UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (listing_id, tag_id)
    );

CREATE INDEX IF NOT EXISTS idx_listing_tags_tag ON listing_tags(tag_id);

-- Conversations (created when a buyer signals interest)
CREATE TABLE IF NOT EXISTS conversations (
                                             id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id      UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    seller_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    buyer_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status          conversation_status NOT NULL DEFAULT 'open',
    last_message_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    closed_at       TIMESTAMPTZ,
    CONSTRAINT chk_buyer_not_seller CHECK (buyer_id <> seller_id),
    -- One conversation per buyer per listing
    CONSTRAINT uq_conversation_unique UNIQUE (listing_id, buyer_id)
    );

CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(seller_id, buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_listing ON conversations(listing_id);
CREATE INDEX IF NOT EXISTS idx_conversations_lastmsg ON conversations(last_message_at DESC);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
                                        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id  UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type             message_type NOT NULL DEFAULT 'user',
    body             TEXT,                         -- required for type='user'
    image_url        TEXT,                         -- optional attachment
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at          TIMESTAMPTZ,
    CONSTRAINT chk_message_body_required CHECK (
(type = 'user' AND body IS NOT NULL) OR (type = 'system')
    )
    );

CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON messages(conversation_id, created_at);

-- Generic updated_at trigger (for tables with updated_at)
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_listings_updated_at ON listings;
CREATE TRIGGER trg_listings_updated_at BEFORE UPDATE ON listings
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
