import { UUID } from './Common';

export type UserDto = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  teams: {
    id: UUID;
    name: string;
  }[];
};
