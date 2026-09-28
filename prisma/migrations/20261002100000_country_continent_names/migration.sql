-- Show Oceania as "Australia/Oceania", which reads more clearly to couples.
UPDATE "Country" SET "continent" = 'Australia/Oceania' WHERE "continent" = 'Oceania';
