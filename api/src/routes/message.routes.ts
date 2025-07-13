import { Router } from 'express';
import { MessageController } from '../controllers/message.controller';

const messageRoutes = Router();
const messageController = new MessageController();

import { Request, Response, NextFunction } from 'express';

messageRoutes.post(
  '/messages',
  (messageController.createMessage.bind(messageController)) as (
	req: Request,
	res: Response,
	next: NextFunction
  ) => any
);

// Get messages by room ID with pagination
messageRoutes.get(
  '/messages/room/:roomId',
  messageController.getMessagesByRoom.bind(messageController) as RequestHandler);

// Get a specific message by ID
messageRoutes.get(
  '/messages/:messageId',
  messageController.getMessageById.bind(messageController) as (
	req: Request,
	res: Response,
	next: NextFunction
  ) => any
);

// Update a message (edit)
import { RequestHandler } from 'express';

messageRoutes.patch(
  '/messages/:messageId',
  messageController.updateMessage.bind(messageController) as RequestHandler
);

// Delete a message
messageRoutes.delete(
  '/messages/:messageId',
  messageController.deleteMessage.bind(messageController) as RequestHandler
);

// Get messages by user ID
messageRoutes.get(
  '/messages/user/:userId',
  messageController.getMessagesByUser.bind(messageController) as RequestHandler
);

// Search messages in a room
messageRoutes.get(
  '/messages/room/:roomId/search',
  messageController.searchMessages.bind(messageController) as RequestHandler
);

export default messageRoutes;