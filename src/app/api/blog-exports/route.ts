import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { blogExports } from '@/lib/db/schema';
import { eq, or, and, desc } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/blog-exports - Retrieve blog exports for a chat or user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');
    const userId = searchParams.get('userId');
    const guestId = searchParams.get('guestId');
    const messageId = searchParams.get('messageId');

    if (!chatId && !userId && !guestId) {
      return NextResponse.json(
        { error: 'chatId, userId, or guestId is required' },
        { status: 400 }
      );
    }

    let whereCondition;
    
    if (messageId) {
      // Get specific export by messageId
      whereCondition = eq(blogExports.messageId, messageId);
    } else if (chatId) {
      // Get all exports for a specific chat
      whereCondition = eq(blogExports.chatId, chatId);
    } else {
      // Get all exports for a user or guest
      whereCondition = or(
        userId ? eq(blogExports.userId, userId) : undefined,
        guestId ? eq(blogExports.guestId, guestId) : undefined
      );
    }

    const exports = await db
      .select({
        id: blogExports.id,
        chatId: blogExports.chatId,
        messageId: blogExports.messageId,
        title: blogExports.title,
        fileName: blogExports.fileName,
        modelUsed: blogExports.modelUsed,
        wordCount: blogExports.wordCount,
        createdAt: blogExports.createdAt,
      })
      .from(blogExports)
      .where(whereCondition)
      .orderBy(desc(blogExports.createdAt));

    return NextResponse.json({
      success: true,
      exports: exports
    });

  } catch (error) {
    console.error('Error retrieving blog exports:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve blog exports' },
      { status: 500 }
    );
  }
}

// POST /api/blog-exports - Download specific blog export
export async function POST(req: NextRequest) {
  try {
    const { exportId } = await req.json();

    if (!exportId) {
      return NextResponse.json(
        { error: 'exportId is required' },
        { status: 400 }
      );
    }

    const exportData = await db
      .select()
      .from(blogExports)
      .where(eq(blogExports.id, exportId))
      .limit(1);

    if (!exportData.length) {
      return NextResponse.json(
        { error: 'Blog export not found' },
        { status: 404 }
      );
    }

    const export_ = exportData[0];

    return NextResponse.json({
      success: true,
      export: {
        id: export_.id,
        title: export_.title,
        fileName: export_.fileName,
        htmlContent: export_.htmlContent,
        blogData: export_.blogData,
        modelUsed: export_.modelUsed,
        wordCount: export_.wordCount,
        createdAt: export_.createdAt,
      }
    });

  } catch (error) {
    console.error('Error retrieving blog export:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve blog export' },
      { status: 500 }
    );
  }
}

// DELETE /api/blog-exports - Delete specific blog export
export async function DELETE(req: NextRequest) {
  try {
    const { exportId } = await req.json();

    if (!exportId) {
      return NextResponse.json(
        { error: 'exportId is required' },
        { status: 400 }
      );
    }

    // Check if export exists
    const exportData = await db
      .select({ id: blogExports.id })
      .from(blogExports)
      .where(eq(blogExports.id, exportId))
      .limit(1);

    if (!exportData.length) {
      return NextResponse.json(
        { error: 'Blog export not found' },
        { status: 404 }
      );
    }

    // Delete the export
    await db.delete(blogExports).where(eq(blogExports.id, exportId));

    return NextResponse.json({
      success: true,
      message: 'Blog export deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting blog export:', error);
    return NextResponse.json(
      { error: 'Failed to delete blog export' },
      { status: 500 }
    );
  }
} 