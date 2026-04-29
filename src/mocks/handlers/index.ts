import { authHandlers } from './auth';
import { teamspaceHandlers } from './teamspace';
import { invitationHandlers } from './invitation';
import { memberHandlers } from './member';
import { documentHandlers } from './document';
import { feedbackHandlers } from './feedback';

export const handlers = [
  ...authHandlers,
  ...teamspaceHandlers,
  ...invitationHandlers,
  ...memberHandlers,
  ...documentHandlers,
  ...feedbackHandlers,
];
