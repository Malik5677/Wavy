DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'otp_codes' AND column_name = 'email'
  ) THEN
    ALTER TABLE "otp_codes" ADD COLUMN "email" varchar(255);
    UPDATE "otp_codes" SET "email" = '' WHERE "email" IS NULL;
    ALTER TABLE "otp_codes" ALTER COLUMN "email" SET NOT NULL;
  END IF;
END
$$;
