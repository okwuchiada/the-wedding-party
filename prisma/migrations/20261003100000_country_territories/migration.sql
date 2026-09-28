-- AlterTable
ALTER TABLE "Country" ADD COLUMN     "territory" BOOLEAN NOT NULL DEFAULT false;

-- Dependencies of another country, plus Western Sahara (disputed; not a UN member).
UPDATE "Country" SET "territory" = true WHERE "code" IN (
  -- Africa
  'EH', 'IO', 'RE', 'SH', 'TF', 'YT',
  -- Americas
  'AI', 'AW', 'BL', 'BM', 'BQ', 'BV', 'CW', 'FK', 'GF', 'GL', 'GP', 'GS', 'KY', 'MF', 'MQ', 'MS', 'PM', 'PR', 'SX', 'TC', 'VG', 'VI',
  -- Asia
  'HK', 'MO',
  -- Europe
  'AX', 'FO', 'GG', 'GI', 'IM', 'JE', 'SJ',
  -- Australia/Oceania
  'AS', 'CC', 'CK', 'CX', 'GU', 'HM', 'MP', 'NC', 'NF', 'NU', 'PF', 'PN', 'TK', 'UM', 'WF',
  -- Antarctica
  'AQ'
);
