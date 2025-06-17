import db from '@/lib/db';
import { messages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const PATCH = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;
    const { content } = await req.json();

    if (!content) {
      return Response.json(
        { message: 'Content is required' },
        { status: 400 },
      );
    }

    const messageExists = await db.query.messages.findFirst({
      where: eq(messages.messageId, id),
    });

    if (!messageExists) {
      return Response.json({ message: 'Message not found' }, { status: 404 });
    }

    await db
      .update(messages)
      .set({ content })
      .where(eq(messages.messageId, id))
      .execute();

    return Response.json(
      { message: 'Message updated successfully' },
      { status: 200 },
    );
  } catch (err) {
    console.error('Error in updating message: ', err);
    return Response.json(
      { message: 'An error has occurred.' },
      { status: 500 },
    );
  }
}; 