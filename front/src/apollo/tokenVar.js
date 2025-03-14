import { makeVar } from '@apollo/client';

/**
 * Holds the current access token in memory.
 * makeVar creates a reactive variable that can be read or written.
 */
export const accessTokenVar = makeVar(null);
