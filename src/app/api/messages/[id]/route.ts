import db from '@/lib/db';
import { messages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const PATCH = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;
    const { content, suggestions } = await req.json();

    if (!content && !suggestions) {
      return Response.json(
        { message: 'Content or suggestions is required' },
        { status: 400 },
      );
    }

    const messageExists = await db.query.messages.findFirst({
      where: eq(messages.messageId, id),
    });

    if (!messageExists) {
      return Response.json({ message: 'Message not found' }, { status: 404 });
    }

    // Parse existing metadata or create new one
    let metadata = {};
    try {
      metadata = messageExists.metadata ? JSON.parse(messageExists.metadata as string) : {};
    } catch (e) {
      metadata = {};
    }

    // Update content if provided
    const updateData: any = {};
    if (content) {
      updateData.content = content;
    }

    // Update suggestions in metadata if provided
    if (suggestions) {
      metadata = { ...metadata, suggestions };
      updateData.metadata = JSON.stringify(metadata);
    }

    await db
      .update(messages)
      .set(updateData)
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