-- Remove duplicate membership rows and keep the most recent/online one per user per room
WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY room_id, user_id
      ORDER BY is_online DESC, last_seen DESC, joined_at DESC, id DESC
    ) AS rn
  FROM public.room_members
)
DELETE FROM public.room_members rm
USING ranked r
WHERE rm.id = r.id
  AND r.rn > 1;

-- Enforce single membership row per user per room
ALTER TABLE public.room_members
ADD CONSTRAINT room_members_room_user_unique UNIQUE (room_id, user_id);

-- Membership should not depend on online status (online is a presence flag only)
CREATE OR REPLACE FUNCTION public.is_room_member(_room_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.room_members
    WHERE room_id = _room_id
      AND user_id = auth.uid()
  )
$function$;