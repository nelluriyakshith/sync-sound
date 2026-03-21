
-- Table for synced queue items
CREATE TABLE public.room_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  track_id text NOT NULL,
  name text NOT NULL DEFAULT 'Unknown Track',
  artist text NOT NULL DEFAULT 'Unknown',
  url text NOT NULL DEFAULT '',
  youtube_id text,
  is_local boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  added_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table for synced playback state
CREATE TABLE public.room_playback_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE UNIQUE,
  current_track_index integer NOT NULL DEFAULT 0,
  is_playing boolean NOT NULL DEFAULT false,
  current_time_seconds double precision NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

-- RLS
ALTER TABLE public.room_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_playback_state ENABLE ROW LEVEL SECURITY;

-- room_queue policies: members can view, authenticated can insert/delete
CREATE POLICY "Members can view queue" ON public.room_queue FOR SELECT TO authenticated
  USING (is_room_member(room_id) OR is_room_admin(room_id));

CREATE POLICY "Members can add to queue" ON public.room_queue FOR INSERT TO authenticated
  WITH CHECK (is_room_member(room_id) OR is_room_admin(room_id));

CREATE POLICY "Admin or adder can delete queue items" ON public.room_queue FOR DELETE TO authenticated
  USING (is_room_admin(room_id) OR added_by = auth.uid());

-- room_playback_state policies
CREATE POLICY "Members can view playback state" ON public.room_playback_state FOR SELECT TO authenticated
  USING (is_room_member(room_id) OR is_room_admin(room_id));

CREATE POLICY "Members can insert playback state" ON public.room_playback_state FOR INSERT TO authenticated
  WITH CHECK (is_room_member(room_id) OR is_room_admin(room_id));

CREATE POLICY "Members can update playback state" ON public.room_playback_state FOR UPDATE TO authenticated
  USING (is_room_member(room_id) OR is_room_admin(room_id));

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_playback_state;
