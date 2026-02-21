
-- Create rooms table
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create room_members table (tracks devices/users in a room)
CREATE TABLE public.room_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  device_name TEXT NOT NULL DEFAULT 'Unknown Device',
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  is_muted BOOLEAN NOT NULL DEFAULT false,
  is_online BOOLEAN NOT NULL DEFAULT true,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_rooms_code ON public.rooms(code);
CREATE INDEX idx_room_members_room_id ON public.room_members(room_id);
CREATE INDEX idx_room_members_user_id ON public.room_members(user_id);

-- Enable RLS
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;

-- Helper: check if user is member of a room
CREATE OR REPLACE FUNCTION public.is_room_member(_room_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.room_members
    WHERE room_id = _room_id AND user_id = auth.uid() AND is_online = true
  )
$$;

-- Helper: check if user is admin of a room
CREATE OR REPLACE FUNCTION public.is_room_admin(_room_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.room_members
    WHERE room_id = _room_id AND user_id = auth.uid() AND role = 'admin'
  )
$$;

-- Rooms RLS policies
CREATE POLICY "Anyone authenticated can create rooms"
  ON public.rooms FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Members can view their rooms"
  ON public.rooms FOR SELECT
  TO authenticated
  USING (public.is_room_member(id) OR created_by = auth.uid());

CREATE POLICY "Admin can update room"
  ON public.rooms FOR UPDATE
  TO authenticated
  USING (public.is_room_admin(id));

CREATE POLICY "Admin can delete room"
  ON public.rooms FOR DELETE
  TO authenticated
  USING (public.is_room_admin(id));

-- Allow anon to check if a room code exists (for joining validation)
CREATE POLICY "Anyone can check room exists by code"
  ON public.rooms FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Room members RLS policies
CREATE POLICY "Members can view room members"
  ON public.room_members FOR SELECT
  TO authenticated
  USING (public.is_room_member(room_id) OR public.is_room_admin(room_id));

CREATE POLICY "Authenticated can join rooms"
  ON public.room_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can update members"
  ON public.room_members FOR UPDATE
  TO authenticated
  USING (public.is_room_admin(room_id) OR user_id = auth.uid());

CREATE POLICY "Admin can remove members or self leave"
  ON public.room_members FOR DELETE
  TO authenticated
  USING (public.is_room_admin(room_id) OR user_id = auth.uid());

-- Enable realtime for room_members
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_members;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
