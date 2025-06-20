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

    console.log('PATCH Debug - messageId:', id);
    console.log('PATCH Debug - request body:', { content: !!content, suggestions: !!suggestions });

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

    console.log('PATCH Debug - existing metadata raw:', messageExists.metadata);
    console.log('PATCH Debug - existing metadata type:', typeof messageExists.metadata);
    console.log('PATCH Debug - existing metadata stringified:', JSON.stringify(messageExists.metadata));

    // Parse existing metadata or create new one
    let metadata = {};
    
    // For jsonb columns, metadata is already an object, not a string
    if (messageExists.metadata && typeof messageExists.metadata === 'object') {
      metadata = messageExists.metadata as any;
      console.log('PATCH Debug - using existing metadata object:', metadata);
      console.log('PATCH Debug - existing metadata has sources:', !!(metadata as any).sources);
      console.log('PATCH Debug - existing metadata sources length:', (metadata as any).sources?.length || 0);
    } else if (messageExists.metadata && typeof messageExists.metadata === 'string') {
      // Fallback for legacy string data
      try {
        metadata = JSON.parse(messageExists.metadata as string);
        console.log('PATCH Debug - parsed existing metadata from string:', metadata);
      } catch (e) {
        console.log('PATCH Debug - failed to parse metadata string, using empty object:', e);
        console.log('PATCH Debug - failed metadata value was:', messageExists.metadata);
        metadata = {};
      }
    } else {
      console.log('PATCH Debug - no existing metadata, using empty object');
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
      console.log('PATCH Debug - final metadata to save:', metadata);
      console.log('PATCH Debug - final metadata has sources:', !!(metadata as any).sources);
      console.log('PATCH Debug - final metadata sources length:', (metadata as any).sources?.length || 0);
      updateData.metadata = metadata;  // Pass object directly for jsonb column
    }

    console.log('PATCH Debug - updateData:', updateData);

    await db
      .update(messages)
      .set(updateData)
      .where(eq(messages.messageId, id))
      .execute();

    console.log('PATCH Debug - message updated successfully');

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