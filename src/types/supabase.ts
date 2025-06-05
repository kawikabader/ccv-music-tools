export type User = {
  id: string;
  name: string;
  username: string;
  password: string;
  role: 'admin' | 'director';
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
      users: {
        Row: User;
        Insert: Omit<User, 'id'>;
        Update: Partial<Omit<User, 'id'>>;
      };
      musicians: {
        Row: Musician;
        Insert: Omit<Musician, 'id'>;
        Update: Partial<Omit<Musician, 'id'>>;
      };
    };
  };
};
