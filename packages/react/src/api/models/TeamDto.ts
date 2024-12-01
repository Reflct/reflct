import { Role } from '@prisma/client';
import { IsoDate, UUID } from './Common';
import { z } from 'zod';

export type TeamDto = {
  id: UUID;
  name: string;
  description: string;
  createdAt: IsoDate;
  updatedAt: IsoDate;
  scenes: {
    id: UUID;
    name: string;
    description: string;
    version: string;
    tags: string[];
    createdAt: IsoDate;
    updatedAt: IsoDate;
    publishedAt?: IsoDate;
  }[];
  sceneTags: string[];
  users: {
    id: string;
    name: string;
    email: string;
    role: Role;
  }[];
};

export type TeamApiKeyDto = {
  id: string;
  apiKey: string;
};

export const createTeamRequestSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});

export type CreateTeamRequestBody = z.infer<typeof createTeamRequestSchema>;
