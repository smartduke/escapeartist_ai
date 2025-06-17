'use client';

import { 
  Edit3, Save, X, Bold, Italic, List, ListOrdered, Link, Quote, Code, 
  Undo, Redo, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight,
  Image
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';

const RichTextEditor = ({
  messageId,
  initialContent,
  onUpdate,
  onEditStart,
  onEditEnd,
}: {
  messageId: string;
  initialContent: string;
  onUpdate: (messageId: string, newContent: string) => void;
  onEditStart?: () => void;
  onEditEnd?: () => void;
}) => {
  const [editorContent, setEditorContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const editorRef = useRef<HTMLDivElement>(null);

  // Convert markdown to HTML for WYSIWYG editing
  const markdownToHtml = (markdown: string) => {
    if (!markdown) return '<p></p>';
    
    let html = markdown
      // Headers
      .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
      .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
      .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
      // Bold and italic
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Strikethrough
      .replace(/~~(.*?)~~/g, '<del>$1</del>')
      // Code
      .replace(/`(.*?)`/g, '<code>$1</code>')
      // Images (must come before links)
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto;" />')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      // Lists
      .replace(/^\* (.*?)$/gm, '<li>$1</li>')
      .replace(/^(\d+)\. (.*?)$/gm, '<li>$2</li>')
      // Blockquotes
      .replace(/^> (.*?)$/gm, '<blockquote>$1</blockquote>')
      // Line breaks - handle double newlines first
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');

    // Wrap in paragraphs if not already wrapped and not empty
    if (html && !html.startsWith('<h') && !html.startsWith('<li') && !html.startsWith('<blockquote') && !html.startsWith('<p>')) {
      html = '<p>' + html + '</p>';
    }

    // Clean up empty paragraphs and fix list wrapping
    html = html
      .replace(/<p><\/p>/g, '')
      .replace(/<p>(<h[1-6]>.*?<\/h[1-6]>)<\/p>/g, '$1')
      .replace(/<p>(<blockquote>.*?<\/blockquote>)<\/p>/g, '$1')
      .replace(/<p>(<li>.*?<\/li>)<\/p>/g, '<ul>$1</ul>')
      .replace(/<\/ul><ul>/g, '');

    // If still empty, provide a default paragraph
    if (!html || html.trim() === '') {
      html = '<p></p>';
    }

    return html;
  };

  // Convert HTML back to markdown
  const htmlToMarkdown = (html: string) => {
    if (!html) return '';
    
    // Create a temporary div to parse HTML properly
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const processNode = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || '';
      }
      
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        const tagName = element.tagName.toLowerCase();
        const childContent = Array.from(element.childNodes).map(processNode).join('');
        
        switch (tagName) {
          case 'h1':
            return `# ${childContent}\n\n`;
          case 'h2':
            return `## ${childContent}\n\n`;
          case 'h3':
            return `### ${childContent}\n\n`;
          case 'strong':
          case 'b':
            return `**${childContent}**`;
          case 'em':
          case 'i':
            return `*${childContent}*`;
          case 'del':
            return `~~${childContent}~~`;
          case 'code':
            return `\`${childContent}\``;
          case 'a':
            const href = element.getAttribute('href') || '';
            return `[${childContent}](${href})`;
          case 'img':
            const src = element.getAttribute('src') || '';
            const alt = element.getAttribute('alt') || '';
            return `![${alt}](${src})`;
          case 'blockquote':
            return `> ${childContent}\n\n`;
          case 'ul':
            return `${childContent}\n`;
          case 'ol':
            return `${childContent}\n`;
          case 'li':
            return `* ${childContent}\n`;
          case 'p':
            // Check for alignment styles
            const style = element.getAttribute('style');
            if (style && style.includes('text-align: center')) {
              return `<div style="text-align: center">${childContent}</div>\n\n`;
            } else if (style && style.includes('text-align: right')) {
              return `<div style="text-align: right">${childContent}</div>\n\n`;
            }
            return `${childContent}\n\n`;
          case 'br':
            return '\n';
          case 'pre':
            return `\`\`\`\n${childContent}\n\`\`\`\n\n`;
          case 'div':
            return `${childContent}\n`;
          default:
            return childContent;
        }
      }
      
      return '';
    };
    
    const result = Array.from(tempDiv.childNodes).map(processNode).join('');
    
    // Clean up extra newlines and whitespace
    return result
      .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newlines
      .replace(/^\n+|\n+$/g, '') // Remove leading/trailing newlines
      .trim();
  };

  // Initialize undo/redo stacks when component mounts
  useEffect(() => {
    const htmlContent = markdownToHtml(initialContent);
    setUndoStack([htmlContent]);
    setRedoStack([]);
  }, [initialContent]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveStateTimeout.current) {
        clearTimeout(saveStateTimeout.current);
      }
    };
  }, []);

  const handleSave = async () => {
    const markdownContent = htmlToMarkdown(editorContent);
    
    if (markdownContent.trim() === initialContent.trim()) {
      onEditEnd?.();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: markdownContent.trim() }),
      });

      if (!res.ok) {
        throw new Error('Failed to update message');
      }

      onUpdate(messageId, markdownContent.trim());
      onEditEnd?.();
      toast.success('Message updated successfully');
    } catch (error) {
      console.error('Error updating message:', error);
      toast.error('Failed to update message');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditorContent(markdownToHtml(initialContent));
    onEditEnd?.();
  };

  // Save state for undo/redo
  const saveState = () => {
    if (editorRef.current) {
      const currentContent = editorRef.current.innerHTML;
      setUndoStack(prev => {
        // Don't add duplicate states
        if (prev[prev.length - 1] !== currentContent) {
          return [...prev, currentContent];
        }
        return prev;
      });
      setRedoStack([]);
    }
  };

  // Undo function
  const handleUndo = () => {
    if (undoStack.length > 1 && editorRef.current) {
      const newUndoStack = [...undoStack];
      const currentState = newUndoStack.pop()!;
      const previousState = newUndoStack[newUndoStack.length - 1];
      
      setRedoStack(prev => [...prev, currentState]);
      setUndoStack(newUndoStack);
      
      // Set content without triggering save state
      editorRef.current.innerHTML = previousState;
      setEditorContent(previousState);
      editorRef.current.focus();
    }
  };

  // Redo function
  const handleRedo = () => {
    if (redoStack.length > 0 && editorRef.current) {
      const newRedoStack = [...redoStack];
      const nextState = newRedoStack.pop()!;
      
      setUndoStack(prev => [...prev, editorContent]);
      setRedoStack(newRedoStack);
      
      // Set content without triggering save state
      editorRef.current.innerHTML = nextState;
      setEditorContent(nextState);
      editorRef.current.focus();
    }
  };

  // Format text functions
  const formatText = (command: string, value?: string) => {
    if (!editorRef.current) return;
    
    saveState();
    editorRef.current.focus();
    
    try {
      const success = document.execCommand(command, false, value);
      if (!success) {
        console.warn(`Command ${command} failed`);
      }
    } catch (error) {
      console.error(`Error executing command ${command}:`, error);
    }
    
    setEditorContent(editorRef.current.innerHTML);
  };

  const insertImage = () => {
    // Create a hidden file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    
    fileInput.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file && editorRef.current) {
        // Check file size (limit to 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert('Image size should be less than 5MB');
          return;
        }
        
        // Check if it's an image
        if (!file.type.startsWith('image/')) {
          alert('Please select a valid image file');
          return;
        }
        
        saveState();
        editorRef.current.focus();
        
        // Create FileReader to convert image to base64
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          
          // Create image element
          const img = document.createElement('img');
          img.src = base64;
          img.style.maxWidth = '100%';
          img.style.height = 'auto';
          img.alt = file.name;
          img.title = file.name;
          
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(img);
            range.setStartAfter(img);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
          } else {
            editorRef.current!.appendChild(img);
          }
          
          setEditorContent(editorRef.current!.innerHTML);
        };
        
        reader.onerror = () => {
          alert('Error reading the image file');
        };
        
        reader.readAsDataURL(file);
      }
      
      // Clean up
      document.body.removeChild(fileInput);
    };
    
    // Add to DOM and trigger click
    document.body.appendChild(fileInput);
    fileInput.click();
  };

  const insertLink = () => {
    const url = prompt('Enter link URL:');
    if (url && url.trim()) {
      formatText('createLink', url.trim());
    }
  };

  // Apply text alignment
  const applyAlignment = (alignment: 'left' | 'center' | 'right') => {
    if (!editorRef.current) return;
    
    saveState();
    editorRef.current.focus();
    
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      let element = range.commonAncestorContainer;
      
      // Find the closest block element
      while (element && element.nodeType !== Node.ELEMENT_NODE && element.parentNode) {
        element = element.parentNode;
      }
      
      if (element && element.nodeType === Node.ELEMENT_NODE) {
        const blockElement = element as HTMLElement;
        
        // Apply alignment style
        switch (alignment) {
          case 'left':
            blockElement.style.textAlign = 'left';
            break;
          case 'center':
            blockElement.style.textAlign = 'center';
            break;
          case 'right':
            blockElement.style.textAlign = 'right';
            break;
        }
      }
    }
    
    setEditorContent(editorRef.current.innerHTML);
  };

  const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      setEditorContent(newContent);
      
      // Save state for undo/redo after a short delay to avoid too many states
      if (saveStateTimeout.current) {
        clearTimeout(saveStateTimeout.current);
      }
      saveStateTimeout.current = setTimeout(() => {
        saveState();
      }, 1000);
    }
  };

  // Add ref for timeout
  const saveStateTimeout = useRef<NodeJS.Timeout | null>(null);

  // Only set content when component first mounts or when initialContent changes
  useEffect(() => {
    if (editorRef.current) {
      const htmlContent = markdownToHtml(initialContent);
      
      // Clear existing content first
      editorRef.current.innerHTML = '';
      
      // Set the HTML content - this should render as WYSIWYG
      editorRef.current.innerHTML = htmlContent;
      setEditorContent(htmlContent);
      
      // Ensure the content is properly rendered by triggering a reflow
      editorRef.current.offsetHeight;
      
      // Focus the editor after content is set
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.focus();
          // Place cursor at the end
          const range = document.createRange();
          const selection = window.getSelection();
          if (editorRef.current.childNodes.length > 0) {
            range.selectNodeContents(editorRef.current);
            range.collapse(false);
          } else {
            range.setStart(editorRef.current, 0);
            range.collapse(true);
          }
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }, 100);
    }
  }, [initialContent]);

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-3 mb-2 bg-light-secondary/50 dark:bg-dark-secondary/50 rounded-lg border border-light-200 dark:border-dark-200 flex-wrap">
        {/* Undo/Redo */}
        <button
          onClick={handleUndo}
          disabled={undoStack.length <= 1}
          className="p-1.5 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-light-secondary dark:hover:bg-dark-secondary rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Undo"
        >
          <Undo size={14} />
        </button>
        <button
          onClick={handleRedo}
          disabled={redoStack.length === 0}
          className="p-1.5 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-light-secondary dark:hover:bg-dark-secondary rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Redo"
        >
          <Redo size={14} />
        </button>
        <div className="w-px h-5 bg-light-200 dark:bg-dark-200 mx-1" />
        
        {/* Headings and Paragraph */}
        <button
          onClick={() => formatText('formatBlock', 'p')}
          className="px-2 py-1.5 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-light-secondary dark:hover:bg-dark-secondary rounded transition-colors text-xs font-medium"
          title="Paragraph"
        >
          P
        </button>
        <button
          onClick={() => formatText('formatBlock', 'h1')}
          className="px-2 py-1.5 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-light-secondary dark:hover:bg-dark-secondary rounded transition-colors text-xs font-bold"
          title="Heading 1"
        >
          H1
        </button>
        <button
          onClick={() => formatText('formatBlock', 'h2')}
          className="px-2 py-1.5 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-light-secondary dark:hover:bg-dark-secondary rounded transition-colors text-xs font-bold"
          title="Heading 2"
        >
          H2
        </button>
        <button
          onClick={() => formatText('formatBlock', 'h3')}
          className="px-2 py-1.5 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-light-secondary dark:hover:bg-dark-secondary rounded transition-colors text-xs font-bold"
          title="Heading 3"
        >
          H3
        </button>
        <div className="w-px h-5 bg-light-200 dark:bg-dark-200 mx-1" />
        
        {/* Text Formatting */}
        <button
          onClick={() => formatText('bold')}
          className="p-1.5 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-light-secondary dark:hover:bg-dark-secondary rounded transition-colors"
          title="Bold"
        >
          <Bold size={14} />
        </button>
        <button
          onClick={() => formatText('italic')}
          className="p-1.5 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-light-secondary dark:hover:bg-dark-secondary rounded transition-colors"
          title="Italic"
        >
          <Italic size={14} />
        </button>
        <button
          onClick={() => formatText('underline')}
          className="p-1.5 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-light-secondary dark:hover:bg-dark-secondary rounded transition-colors"
          title="Underline"
        >
          <Underline size={14} />
        </button>
        <button
          onClick={() => formatText('strikeThrough')}
          className="p-1.5 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-light-secondary dark:hover:bg-dark-secondary rounded transition-colors"
          title="Strikethrough"
        >
          <Strikethrough size={14} />
        </button>
        <div className="w-px h-5 bg-light-200 dark:bg-dark-200 mx-1" />
        
        {/* Alignment */}
        <button
          onClick={() => applyAlignment('left')}
          className="p-1.5 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-light-secondary dark:hover:bg-dark-secondary rounded transition-colors"
          title="Align Left"
        >
          <AlignLeft size={14} />
        </button>
        <button
          onClick={() => applyAlignment('center')}
          className="p-1.5 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-light-secondary dark:hover:bg-dark-secondary rounded transition-colors"
          title="Align Center"
        >
          <AlignCenter size={14} />
        </button>
        <button
          onClick={() => applyAlignment('right')}
          className="p-1.5 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-light-secondary dark:hover:bg-dark-secondary rounded transition-colors"
          title="Align Right"
        >
          <AlignRight size={14} />
        </button>
        <div className="w-px h-5 bg-light-200 dark:bg-dark-200 mx-1" />
        
        {/* Lists */}
        <button
          onClick={() => formatText('insertUnorderedList')}
          className="p-1.5 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-light-secondary dark:hover:bg-dark-secondary rounded transition-colors"
          title="Bullet List"
        >
          <List size={14} />
        </button>
        <button
          onClick={() => formatText('insertOrderedList')}
          className="p-1.5 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-light-secondary dark:hover:bg-dark-secondary rounded transition-colors"
          title="Numbered List"
        >
          <ListOrdered size={14} />
        </button>
        <div className="w-px h-5 bg-light-200 dark:bg-dark-200 mx-1" />
        
        {/* Insert */}
        <button
          onClick={insertLink}
          className="p-1.5 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-light-secondary dark:hover:bg-dark-secondary rounded transition-colors"
          title="Insert Link"
        >
          <Link size={14} />
        </button>
        <button
          onClick={insertImage}
          className="p-1.5 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-light-secondary dark:hover:bg-dark-secondary rounded transition-colors"
          title="Insert Image"
        >
          <Image size={14} />
        </button>
        <button
          onClick={() => formatText('formatBlock', 'blockquote')}
          className="p-1.5 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-light-secondary dark:hover:bg-dark-secondary rounded transition-colors"
          title="Quote"
        >
          <Quote size={14} />
        </button>
        <button
          onClick={() => formatText('formatBlock', 'pre')}
          className="p-1.5 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-light-secondary dark:hover:bg-dark-secondary rounded transition-colors"
          title="Code Block"
        >
          <Code size={14} />
        </button>
      </div>

      {/* WYSIWYG Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleContentChange}
        onKeyDown={(e) => {
          if (e.ctrlKey || e.metaKey) {
            if (e.key === 'z' && !e.shiftKey) {
              e.preventDefault();
              handleUndo();
            } else if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
              e.preventDefault();
              handleRedo();
            }
          }
        }}
        className="w-full min-h-[200px] p-4 bg-white dark:bg-gray-900 border border-light-200 dark:border-dark-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black dark:text-white overflow-y-auto mb-3 wysiwyg-editor"
        style={{
          lineHeight: '1.6',
          fontSize: '14px',
          whiteSpace: 'normal',
          wordWrap: 'break-word'
        }}
        suppressContentEditableWarning={true}
      />
      
      {/* Add global styles for WYSIWYG editor */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .wysiwyg-editor {
            /* Ensure content is rendered as HTML, not text */
            white-space: normal !important;
            word-wrap: break-word !important;
          }
          .wysiwyg-editor h1 {
            font-size: 1.5em !important;
            font-weight: bold !important;
            margin: 0.5em 0 !important;
            line-height: 1.2 !important;
            display: block !important;
          }
          .wysiwyg-editor h2 {
            font-size: 1.3em !important;
            font-weight: bold !important;
            margin: 0.4em 0 !important;
            line-height: 1.2 !important;
            display: block !important;
          }
          .wysiwyg-editor h3 {
            font-size: 1.1em !important;
            font-weight: bold !important;
            margin: 0.3em 0 !important;
            line-height: 1.2 !important;
            display: block !important;
          }
          .wysiwyg-editor strong, .wysiwyg-editor b {
            font-weight: bold !important;
          }
          .wysiwyg-editor em, .wysiwyg-editor i {
            font-style: italic !important;
          }
          .wysiwyg-editor u {
            text-decoration: underline !important;
          }
          .wysiwyg-editor del, .wysiwyg-editor strike, .wysiwyg-editor s {
            text-decoration: line-through !important;
          }
          .wysiwyg-editor code {
            background-color: rgba(0, 0, 0, 0.1) !important;
            padding: 2px 4px !important;
            border-radius: 3px !important;
            font-family: monospace !important;
          }
          .wysiwyg-editor blockquote {
            border-left: 4px solid #ccc !important;
            margin: 0.5em 0 !important;
            padding-left: 1em !important;
            font-style: italic !important;
            display: block !important;
          }
          .wysiwyg-editor ul, .wysiwyg-editor ol {
            margin: 0.5em 0 !important;
            padding-left: 2em !important;
            display: block !important;
          }
          .wysiwyg-editor li {
            margin: 0.2em 0 !important;
            display: list-item !important;
          }
          .wysiwyg-editor a {
            color: #3b82f6 !important;
            text-decoration: underline !important;
          }
          .wysiwyg-editor p {
            margin: 0.5em 0 !important;
            display: block !important;
          }
          .wysiwyg-editor pre {
            background-color: rgba(0, 0, 0, 0.1) !important;
            padding: 1em !important;
            border-radius: 4px !important;
            font-family: monospace !important;
            white-space: pre-wrap !important;
            display: block !important;
          }
          .wysiwyg-editor img {
            max-width: 100% !important;
            height: auto !important;
            display: inline-block !important;
          }
          /* Alignment styles */
          .wysiwyg-editor [style*="text-align: left"] {
            text-align: left !important;
          }
          .wysiwyg-editor [style*="text-align: center"] {
            text-align: center !important;
          }
          .wysiwyg-editor [style*="text-align: right"] {
            text-align: right !important;
          }
        `
      }} />

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={handleCancel}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-light-secondary dark:hover:bg-dark-secondary rounded-lg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={loading || !editorContent.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default RichTextEditor; 