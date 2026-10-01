-- Guests per RSVP: how many people one reply can bring. 10 keeps every existing wedding as it was.
ALTER TABLE "Wedding" ADD COLUMN "maxPartySize" INTEGER NOT NULL DEFAULT 10;
