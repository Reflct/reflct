import { z } from "zod";
import { IsoDate, UUID } from "./Common";

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
    role: "ADMIN" | "MEMBER";
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
