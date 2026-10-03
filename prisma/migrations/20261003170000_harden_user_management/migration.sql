-- Preserve financial records when an administrator account is permanently removed.
ALTER TABLE "financial_transactions" DROP CONSTRAINT "financial_transactions_createdById_fkey";
ALTER TABLE "financial_transactions" ALTER COLUMN "createdById" DROP NOT NULL;
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Direct Supabase Data API access follows the same role hierarchy as server actions.
CREATE POLICY "super administrators create user profiles"
  ON "user_profiles" FOR INSERT TO authenticated
  WITH CHECK (public.current_app_role() = 'SUPER_ADMIN');

CREATE POLICY "administrators update permitted user profiles"
  ON "user_profiles" FOR UPDATE TO authenticated
  USING (
    public.current_app_role() = 'SUPER_ADMIN'
    OR (public.current_app_role() = 'ADMIN' AND "role" <> 'SUPER_ADMIN')
  )
  WITH CHECK (
    public.current_app_role() = 'SUPER_ADMIN'
    OR (public.current_app_role() = 'ADMIN' AND "role" <> 'SUPER_ADMIN')
  );

