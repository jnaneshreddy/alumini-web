ALTER TABLE "admin_notifications" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read own notifications"
  ON "admin_notifications" FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM "user_profiles" profile
      WHERE profile."id" = "admin_notifications"."recipientId"
        AND profile."authUserId" = auth.uid()::text
        AND profile."active" = true
        AND profile."role" IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

CREATE POLICY "admins update own notifications"
  ON "admin_notifications" FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM "user_profiles" profile
      WHERE profile."id" = "admin_notifications"."recipientId"
        AND profile."authUserId" = auth.uid()::text
        AND profile."active" = true
        AND profile."role" IN ('ADMIN', 'SUPER_ADMIN')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM "user_profiles" profile
      WHERE profile."id" = "admin_notifications"."recipientId"
        AND profile."authUserId" = auth.uid()::text
        AND profile."active" = true
        AND profile."role" IN ('ADMIN', 'SUPER_ADMIN')
    )
  );
