// @generated
// This file is automatically generated by Kanel. Do not modify manually.

import { type ColumnType, type Selectable, type Insertable, type Updateable } from 'kysely';

/** Identifier type for public.Social */
export type SocialId = string & { __brand: 'SocialId' };

/** Represents the table public.Social */
export default interface SocialTable {
  id: ColumnType<SocialId, SocialId | undefined, SocialId>;

  name: ColumnType<string | null, string | null, string | null>;

  github: ColumnType<string | null, string | null, string | null>;

  website: ColumnType<string | null, string | null, string | null>;

  twitter: ColumnType<string | null, string | null, string | null>;

  telegram: ColumnType<string | null, string | null, string | null>;

  medium: ColumnType<string | null, string | null, string | null>;

  discord: ColumnType<string | null, string | null, string | null>;
}

export type Social = Selectable<SocialTable>;

export type NewSocial = Insertable<SocialTable>;

export type SocialUpdate = Updateable<SocialTable>;
