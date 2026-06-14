export interface Team {
  id: string;
  name: string;
  /** 3-letter code, e.g. "BRA". */
  code: string;
  flag?: string;
  /** Group assignment, if applicable. */
  group?: string;
}
