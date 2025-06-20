'use client';

import { 
  Edit3, Save, X, Bold, Italic, List, ListOrdered, Link, Quote, Code, 
  Undo, Redo, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight,
  Image, Video, BookCopy
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';

const RichTextEditor = ({
  messageId,
  initialContent,
  onUpdate,
  onEditStart,
  onEditEnd,
  message,
  history,
}: {
  messageId: string;
  initialContent: string;
  onUpdate: (messageId: string, newContent: string) => void;
  onEditStart?: () => void;
  onEditEnd?: () => void;
  message?: any;
  history?: any[];
}) => {
  const [editorContent, setEditorContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [availableImages, setAvailableImages] = useState<any[]>([]);
  const [imageLoading, setImageLoading] = useState(false);
  const [showVideoSelector, setShowVideoSelector] = useState(false);
  const [availableVideos, setAvailableVideos] = useState<any[]>([]);
  const [videoLoading, setVideoLoading] = useState(false);
  const [savedSelection, setSavedSelection] = useState<Range | null>(null);
  const [showCitationSelector, setShowCitationSelector] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Save current cursor position
  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      setSavedSelection(selection.getRangeAt(0).cloneRange());
    }
  };

  // Restore saved cursor position
  const restoreSelection = () => {
    if (savedSelection && editorRef.current) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(savedSelection);
      editorRef.current.focus();
    }
  };

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
      // Iframes (for videos - must come before images)
      .replace(/<iframe([^>]+)><\/iframe>/g, '<iframe$1></iframe>');

    // Handle images with source links (must come before regular images)
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)\n\*Source: \[([^\]]*)\]\(([^)]+)\)\*/g, 
      '<div style="display: block; margin: 1em 0;"><img src="$2" alt="$1" style="max-width: 100%; height: auto; display: block; border-radius: 8px;" /><div style="font-size: 12px; color: #666; margin-top: 4px;">Source: <a href="$4" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;">$3</a></div></div>');

    // Handle regular images - using a more robust pattern for all types of URLs including base64
    html = html.replace(/!\[([^\]]*)\]\(([^)]*)\)/g, (match, alt, src) => {
      // Make sure we have valid src
      if (!src) return match;
      return `<img src="${src}" alt="${alt}" style="max-width: 100%; height: auto;" />`;
    });

    html = html
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
            // Handle both regular images and base64 images
            if (src) {
              return `![${alt}](${src})`;
            }
            return '';
          case 'iframe':
            const iframeSrc = element.getAttribute('src') || '';
            const width = element.getAttribute('width') || '560';
            const height = element.getAttribute('height') || '315';
            return `<iframe src="${iframeSrc}" width="${width}" height="${height}" frameborder="0" allowfullscreen></iframe>\n\n`;
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
            // Check if this is an image container with source link
            const hasImg = element.querySelector('img');
            const hasSourceLink = element.querySelector('a[href]');
            if (hasImg && hasSourceLink) {
              const img = hasImg as HTMLImageElement;
              const link = hasSourceLink as HTMLAnchorElement;
              const src = img.getAttribute('src') || '';
              const alt = img.getAttribute('alt') || '';
              const sourceUrl = link.getAttribute('href') || '';
              const websiteName = link.textContent || 'View source';
              return `![${alt}](${src})\n*Source: [${websiteName}](${sourceUrl})*\n\n`;
            }
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
    console.log('Rich Editor Debug - Initial markdown:', initialContent);
    console.log('Rich Editor Debug - Converted to HTML:', htmlContent);
    console.log('Rich Editor Debug - Contains base64 image:', initialContent.includes('data:image'));
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
    
    console.log('Rich Editor Debug - HTML content:', editorContent);
    console.log('Rich Editor Debug - Generated markdown:', markdownContent);
    
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

  const insertImage = async () => {
    // Save current cursor position before opening modal
    saveSelection();
    
    if (!message || !history) {
      // Fallback to file upload if no message context
      insertImageFromFile();
      return;
    }

    setImageLoading(true);
    try {
      // Find the user message before this assistant message to get the query
      const messageIndex = history.findIndex(msg => msg.messageId === message.messageId);
      const userQuery = messageIndex > 0 ? history[messageIndex - 1].content : '';

      if (!userQuery) {
        insertImageFromFile();
        return;
      }

      // Fetch images using the same API as SearchImages component
      const chatModelProvider = localStorage.getItem('chatModelProvider');
      const chatModel = localStorage.getItem('chatModel');
      const customOpenAIBaseURL = localStorage.getItem('openAIBaseURL');
      const customOpenAIKey = localStorage.getItem('openAIApiKey');

      const res = await fetch(`/api/images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userQuery,
          chatHistory: history.slice(0, messageIndex - 1),
          chatModel: {
            provider: chatModelProvider,
            model: chatModel,
            ...(chatModelProvider === 'custom_openai' && {
              customOpenAIBaseURL: customOpenAIBaseURL,
              customOpenAIKey: customOpenAIKey,
            }),
          },
        }),
      });

      const data = await res.json();
      const images = data.images ?? [];
      
      setAvailableImages(images);
      setShowImageSelector(true);
    } catch (error) {
      console.error('Failed to fetch images:', error);
      // Fallback to file upload on error
      insertImageFromFile();
    } finally {
      setImageLoading(false);
    }
  };

  const insertImageFromFile = () => {
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
          insertImageElement(base64, file.name);
          // Close the image selector modal after successful upload
          setShowImageSelector(false);
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

  const insertImageElement = (src: string, alt: string = 'Image', sourceUrl?: string) => {
    if (!editorRef.current) return;

    // Create a container div for the image and source link
    const container = document.createElement('div');
    container.style.display = 'block';
    container.style.margin = '1em 0';

    // Create image element
    const img = document.createElement('img');
    img.src = src;
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.alt = alt;
    img.title = alt;
    img.style.display = 'block';
    img.style.borderRadius = '8px';
    
    container.appendChild(img);

    // Add source link if provided
    if (sourceUrl && sourceUrl !== src) {
      const sourceLink = document.createElement('div');
      sourceLink.style.fontSize = '12px';
      sourceLink.style.color = '#666';
      sourceLink.style.marginTop = '4px';
      
      // Extract website name from URL
      let websiteName = '';
      try {
        const url = new URL(sourceUrl);
        websiteName = url.hostname.replace('www.', '');
      } catch {
        websiteName = 'View source';
      }
      
      sourceLink.innerHTML = `Source: <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;">${websiteName}</a>`;
      container.appendChild(sourceLink);
    }
    
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(container);
      range.setStartAfter(container);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      editorRef.current.appendChild(container);
    }
    
    setEditorContent(editorRef.current.innerHTML);
  };

  const selectImageFromResults = (imageUrl: string, title: string, sourceUrl?: string) => {
    saveState();
    
    // Restore the saved cursor position
    restoreSelection();
    
    insertImageElement(imageUrl, title, sourceUrl);
    setShowImageSelector(false);
  };

  const insertVideo = async () => {
    // Save current cursor position before opening modal
    saveSelection();
    
    if (!message || !history) {
      // Fallback to URL input if no message context
      insertVideoFromURL();
      return;
    }

    setVideoLoading(true);
    try {
      // Find the user message before this assistant message to get the query
      const messageIndex = history.findIndex(msg => msg.messageId === message.messageId);
      const userQuery = messageIndex > 0 ? history[messageIndex - 1].content : '';

      if (!userQuery) {
        insertVideoFromURL();
        return;
      }

      // Fetch videos using the same API as SearchVideos component
      const chatModelProvider = localStorage.getItem('chatModelProvider');
      const chatModel = localStorage.getItem('chatModel');
      const customOpenAIBaseURL = localStorage.getItem('openAIBaseURL');
      const customOpenAIKey = localStorage.getItem('openAIApiKey');

      const res = await fetch(`/api/videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userQuery,
          chatHistory: history.slice(0, messageIndex - 1),
          chatModel: {
            provider: chatModelProvider,
            model: chatModel,
            ...(chatModelProvider === 'custom_openai' && {
              customOpenAIBaseURL: customOpenAIBaseURL,
              customOpenAIKey: customOpenAIKey,
            }),
          },
        }),
      });

      const data = await res.json();
      const videos = data.videos ?? [];
      
      setAvailableVideos(videos);
      setShowVideoSelector(true);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
      // Fallback to URL input on error
      insertVideoFromURL();
    } finally {
      setVideoLoading(false);
    }
  };

  const insertVideoFromURL = () => {
    const url = prompt('Enter YouTube video URL or video embed URL:');
    if (url && url.trim() && editorRef.current) {
      saveState();
      editorRef.current.focus();
      
      let embedUrl = url.trim();
      
      // Convert YouTube URLs to embed format
      if (embedUrl.includes('youtube.com/watch?v=')) {
        const videoId = embedUrl.split('watch?v=')[1].split('&')[0];
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (embedUrl.includes('youtu.be/')) {
        const videoId = embedUrl.split('youtu.be/')[1].split('?')[0];
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      }
      
      insertVideoElement(embedUrl, url.trim());
      // Close the video selector modal after successful URL input
      setShowVideoSelector(false);
    }
  };

  const insertVideoElement = (embedUrl: string, originalUrl: string) => {
    if (!editorRef.current) return;

    // Create iframe element for video embed
    const iframe = document.createElement('iframe');
    iframe.src = embedUrl;
    iframe.width = '560';
    iframe.height = '315';
    iframe.style.maxWidth = '100%';
    iframe.style.height = 'auto';
    iframe.style.aspectRatio = '16/9';
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allowfullscreen', 'true');
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
    iframe.title = 'Embedded Video';
    
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(iframe);
      range.setStartAfter(iframe);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      editorRef.current.appendChild(iframe);
    }
    
    setEditorContent(editorRef.current.innerHTML);
  };

  const selectVideoFromResults = (videoUrl: string, title: string) => {
    saveState();
    
    // Restore the saved cursor position
    restoreSelection();
    
    let embedUrl = videoUrl;
    
    // Convert YouTube URLs to embed format
    if (embedUrl.includes('youtube.com/watch?v=')) {
      const videoId = embedUrl.split('watch?v=')[1].split('&')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (embedUrl.includes('youtu.be/')) {
      const videoId = embedUrl.split('youtu.be/')[1].split('?')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }
    
    insertVideoElement(embedUrl, title);
    setShowVideoSelector(false);
  };

  const insertCitation = () => {
    // Save current cursor position before opening modal
    saveSelection();
    
    if (!message || !message.sources || message.sources.length === 0) {
      toast.error('No sources available for citations');
      return;
    }

    setShowCitationSelector(true);
  };

  const selectCitationFromSources = (sourceIndex: number) => {
    saveState();
    
    // Restore the saved cursor position
    restoreSelection();
    
    // Insert citation with proper format [1], [2], etc.
    const citationNumber = sourceIndex + 1;
    const citationText = `[${citationNumber}]`;
    
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(citationText));
        range.setStartAfter(range.endContainer);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        // Fallback: insert at end
        editorRef.current.appendChild(document.createTextNode(citationText));
      }
      
      setEditorContent(editorRef.current.innerHTML);
    }
    
    setShowCitationSelector(false);
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
      
      console.log('Rich Editor Content Init - Initial markdown:', initialContent);
      console.log('Rich Editor Content Init - HTML content:', htmlContent);
      console.log('Rich Editor Content Init - HTML contains img tag:', htmlContent.includes('<img'));
      
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
          disabled={imageLoading}
          className="p-1.5 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-light-secondary dark:hover:bg-dark-secondary rounded transition-colors disabled:opacity-50"
          title="Insert Image from Search Results"
        >
          {imageLoading ? (
            <div className="animate-spin w-3 h-3 border border-gray-400 border-t-transparent rounded-full" />
          ) : (
            <Image size={14} />
          )}
        </button>
        <button
          onClick={insertVideo}
          disabled={videoLoading}
          className="p-1.5 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-light-secondary dark:hover:bg-dark-secondary rounded transition-colors disabled:opacity-50"
          title="Insert Video from Search Results"
        >
          {videoLoading ? (
            <div className="animate-spin w-3 h-3 border border-gray-400 border-t-transparent rounded-full" />
          ) : (
            <Video size={14} />
          )}
        </button>
        <button
          onClick={insertCitation}
          className="p-1.5 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-light-secondary dark:hover:bg-dark-secondary rounded transition-colors"
          title="Insert Citation"
        >
          <BookCopy size={14} />
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
          .wysiwyg-editor iframe {
            max-width: 100% !important;
            aspect-ratio: 16/9 !important;
            border: none !important;
            border-radius: 8px !important;
            display: block !important;
            margin: 0.5em 0 !important;
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

      {/* Image Selector Modal */}
      {showImageSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-black dark:text-white">Select Image</h3>
              <button
                onClick={() => setShowImageSelector(false)}
                className="p-2 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-light-secondary dark:hover:bg-dark-secondary rounded transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {imageLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-light-secondary dark:bg-dark-secondary h-32 w-full rounded-lg animate-pulse aspect-video object-cover"
                  />
                ))}
              </div>
            ) : availableImages.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                  {availableImages.map((image, i) => (
                    <div
                      key={i}
                      onClick={() => selectImageFromResults(image.img_src, image.title, image.url)}
                      className="cursor-pointer transition duration-200 hover:scale-105 active:scale-95"
                    >
                      <img
                        src={image.img_src}
                        alt={image.title}
                        className="w-full h-32 object-cover rounded-lg border border-light-200 dark:border-dark-200 hover:border-blue-500"
                      />
                      <p className="text-xs text-black/70 dark:text-white/70 mt-1 truncate" title={image.title}>
                        {image.title}
                      </p>
                      {image.url && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 truncate" title={image.url}>
                          {new URL(image.url).hostname}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-light-200 dark:border-dark-200">
                  <button
                    onClick={insertImageFromFile}
                    className="w-full px-4 py-2 text-sm font-medium text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-light-secondary dark:hover:bg-dark-secondary rounded-lg transition-colors border border-light-200 dark:border-dark-200"
                  >
                    Or upload from device
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-black/70 dark:text-white/70 mb-4">No images found for this search</p>
                <button
                  onClick={insertImageFromFile}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Upload from device
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Video Selector Modal */}
      {showVideoSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-black dark:text-white">Select Video</h3>
              <button
                onClick={() => setShowVideoSelector(false)}
                className="p-2 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-light-secondary dark:hover:bg-dark-secondary rounded transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {videoLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-light-secondary dark:bg-dark-secondary h-48 w-full rounded-lg animate-pulse aspect-video"
                  />
                ))}
              </div>
            ) : availableVideos.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {availableVideos.map((video, i) => (
                    <div
                      key={i}
                      onClick={() => selectVideoFromResults(video.url, video.title)}
                      className="cursor-pointer transition duration-200 hover:scale-105 active:scale-95"
                    >
                      <div className="relative">
                        <img
                          src={video.img_src || `https://img.youtube.com/vi/${video.url.split('v=')[1]?.split('&')[0]}/maxresdefault.jpg`}
                          alt={video.title}
                          className="w-full h-48 object-cover rounded-lg border border-light-200 dark:border-dark-200 hover:border-blue-500"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-black/70 rounded-full p-3">
                            <Video size={20} className="text-white" />
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-black dark:text-white mt-2 font-medium line-clamp-2" title={video.title}>
                        {video.title}
                      </p>
                      <p className="text-xs text-black/70 dark:text-white/70 mt-1">
                        {video.views} • {video.upload_date}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-light-200 dark:border-dark-200">
                  <button
                    onClick={insertVideoFromURL}
                    className="w-full px-4 py-2 text-sm font-medium text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-light-secondary dark:hover:bg-dark-secondary rounded-lg transition-colors border border-light-200 dark:border-dark-200"
                  >
                    Or enter video URL
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-black/70 dark:text-white/70 mb-4">No videos found for this search</p>
                <button
                  onClick={insertVideoFromURL}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Enter video URL
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Citation Selector Modal */}
      {showCitationSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-black dark:text-white">Select Citation</h3>
              <button
                onClick={() => setShowCitationSelector(false)}
                className="p-2 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-light-secondary dark:hover:bg-dark-secondary rounded transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {message?.sources && message.sources.length > 0 ? (
              <div className="space-y-3">
                {message.sources.map((source: any, i: number) => (
                  <div
                    key={i}
                    onClick={() => selectCitationFromSources(i)}
                    className="cursor-pointer p-4 border border-light-200 dark:border-dark-200 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition duration-200 hover:bg-light-secondary/50 dark:hover:bg-dark-secondary/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-xs font-medium rounded-full">
                            {i + 1}
                          </span>
                          <h4 className="text-sm font-medium text-black dark:text-white line-clamp-1">
                            {source.metadata?.title || 'Untitled Source'}
                          </h4>
                        </div>
                        <p className="text-xs text-black/70 dark:text-white/70 line-clamp-2 mb-2">
                          {source.pageContent.slice(0, 150)}...
                        </p>
                        {source.metadata?.url && (
                          <a
                            href={source.metadata.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {new URL(source.metadata.url).hostname}
                          </a>
                        )}
                      </div>
                      <div className="text-xs text-black/50 dark:text-white/50">
                        Click to insert [{i + 1}]
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-black/70 dark:text-white/70 mb-4">No sources available for citations</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor; 