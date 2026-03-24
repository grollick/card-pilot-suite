-- Allow users to read organizations they created (fixes RLS error during org creation)
DROP POLICY IF EXISTS "Members can view their orgs" ON public.organizations;
CREATE POLICY "Members can view their orgs" ON public.organizations
  FOR SELECT USING (
    is_org_member(auth.uid(), id) OR auth.uid() = created_by
  );