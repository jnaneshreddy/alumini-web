-- Match direct authenticated Data API deletion to the server-action hierarchy.
-- Service-role operations still perform the same checks in application code.
CREATE POLICY "administrators delete permitted user profiles"
  ON "user_profiles" FOR DELETE TO authenticated
  USING (
    "authUserId" <> auth.uid()::text
    AND (
      public.current_app_role() = 'SUPER_ADMIN'
      OR (public.current_app_role() = 'ADMIN' AND "role" <> 'SUPER_ADMIN')
    )
  );
