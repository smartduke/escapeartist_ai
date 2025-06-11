import db from '@/lib/db';
import { chats } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const GET = async (req: Request) => {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const guestId = url.searchParams.get('guestId');
    
    let chatList;
    if (userId) {
      // Get chats for authenticated user
      chatList = await db.query.chats.findMany({
        where: eq(chats.userId, userId),
      });
    } else if (guestId) {
      // Get chats for guest user
      chatList = await db.query.chats.findMany({
        where: eq(chats.guestId, guestId),
      });
    } else {
      // Fallback to all chats (for backward compatibility)
      chatList = await db.query.chats.findMany();
    }
    
    chatList = chatList.reverse();
    return Response.json({ chats: chatList }, { status: 200 });
  } catch (err) {
    console.error('Error in getting chats: ', err);
    return Response.json(
      { message: 'An error has occurred.' },
      { status: 500 },
    );
  }
};
