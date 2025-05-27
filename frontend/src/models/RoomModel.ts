export interface RoomModel {
  id: string;
  name: string;
  participants?: number;
  created_at: Date;
  owner_id?: number;
  is_owner?: boolean;
}
