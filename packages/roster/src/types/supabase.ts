export type Profile = {
  id: string;
  name: string;
  role: 'admin' | 'director';
  created_at: string;
  updated_at: string;
};

export type User = {
  id: string;
  email: string;
  profile?: Profile;
};

export type Musician = {
  id: string;
  name: string;
  instrument: string | null;
  phone: string | null;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
      };
      musicians: {
        Row: Musician;
        Insert: Omit<Musician, 'id'>;
        Update: Partial<Omit<Musician, 'id'>>;
      };
    };
  };
};
