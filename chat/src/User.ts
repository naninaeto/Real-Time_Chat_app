export interface User {
    _id: string;
    name?: string;
    email: string;
    avatar?: string;
    status?: 'online' | 'offline' | 'idle' | 'dnd';
    // Add other relevant user properties here
  }