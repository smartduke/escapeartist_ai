'use client';

import { 
  Edit3, Save, X, Bold, Italic, List, ListOrdered, Link, Quote, Code, 
  Undo, Redo, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight,
  Image, Video, BookCopy, Sparkles, CheckCircle, RefreshCw,
  ArrowDown, ArrowUp
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import crypto from 'crypto';

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
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiAssistantLoading, setAIAssistantLoading] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [aiSuggestions, setAISuggestions] = useState<string[]>([]);
  const [showContextualAI, setShowContextualAI] = useState(false);
  const [contextualAIPosition, setContextualAIPosition] = useState({ x: 0, y: 0, above: false });
  const [selectionRange, setSelectionRange] = useState<Range | null>(null);
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

  // Handle text selection to show contextual AI toolbar
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const selectedText = selection.toString().trim();
      
      if (selectedText.length > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // Calculate available space below and above the selection
        const toolbarHeight = 250; // Approximate height of the AI toolbar
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        
        // Position the contextual AI toolbar - above if not enough space below
        const shouldPositionAbove = spaceBelow < toolbarHeight && spaceAbove > toolbarHeight;
        
        setContextualAIPosition({
          x: rect.left + rect.width / 2,
          y: shouldPositionAbove ? rect.top - 10 : rect.bottom + 10,
          above: shouldPositionAbove
        });
        
        setSelectedText(selectedText);
        setSelectionRange(range.cloneRange());
        setShowContextualAI(true);
      } else {
        setShowContextualAI(false);
        setSelectedText('');
        setSelectionRange(null);
      }
    } else {
      setShowContextualAI(false);
      setSelectedText('');
      setSelectionRange(null);
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

  // Hide contextual AI toolbar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showContextualAI && event.target instanceof Element && !event.target.closest('.contextual-ai-toolbar')) {
        setShowContextualAI(false);
      }
    };

    if (showContextualAI) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showContextualAI]);

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

  // AI Writing Assistant Functions
  const openAIAssistant = () => {
    // Save current cursor position
    saveSelection();
    
    // Get selected text
    const selection = window.getSelection();
    const selected = selection?.toString() || '';
    setSelectedText(selected);
    
    // If no text is selected, get the current paragraph/line
    if (!selected && editorRef.current && selection?.rangeCount) {
      const range = selection.getRangeAt(0);
      let element = range.commonAncestorContainer;
      
      // Find the closest block element
      while (element && element.nodeType !== Node.ELEMENT_NODE && element.parentNode) {
        element = element.parentNode;
      }
      
      if (element && element.nodeType === Node.ELEMENT_NODE) {
        const blockElement = element as HTMLElement;
        setSelectedText(blockElement.textContent || '');
      }
    }
    
    setShowAIAssistant(true);
  };



  // Process AI request and apply directly to editor
  const processContextualAI = async (action: string) => {
    if (!selectedText || !selectionRange) {
      toast.error('Please select some text first');
      return;
    }

    // Hide the contextual toolbar and show loading state
    setShowContextualAI(false);
    
    // Show a loading indicator where the text was selected
    const loadingSpan = document.createElement('span');
    loadingSpan.style.background = 'linear-gradient(90deg, #e5e7eb, #f3f4f6, #e5e7eb)';
    loadingSpan.style.backgroundSize = '200% 100%';
    loadingSpan.style.animation = 'shimmer 1.5s infinite';
    loadingSpan.style.borderRadius = '4px';
    loadingSpan.style.padding = '2px 4px';
    loadingSpan.textContent = selectedText;
    
    // Add shimmer animation to head if not already present
    if (!document.querySelector('#shimmer-style')) {
      const style = document.createElement('style');
      style.id = 'shimmer-style';
      style.textContent = `
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `;
      document.head.appendChild(style);
    }

    // Replace selected text with loading indicator
    selectionRange.deleteContents();
    selectionRange.insertNode(loadingSpan);

    try {
      // Get the current chat model configuration
      const chatModelProvider = localStorage.getItem('chatModelProvider');
      const chatModel = localStorage.getItem('chatModel');
      const customOpenAIBaseURL = localStorage.getItem('openAIBaseURL');
      const customOpenAIKey = localStorage.getItem('openAIApiKey');

      // Debug: Log what we're getting from localStorage
      console.log('AI Writing Assistant - localStorage config:', {
        chatModelProvider,
        chatModel,
        customOpenAIBaseURL,
        customOpenAIKey: customOpenAIKey ? '[REDACTED]' : 'null'
      });

      // Validate required configuration
      if (!chatModelProvider || !chatModel) {
        toast.error('Please select a chat model in settings first');
        return;
      }

      let prompt = '';
      const textToProcess = selectedText;

      switch (action) {
        case 'improve':
          prompt = `Improve the following text by making it clearer, more engaging, and better structured. Keep the same meaning and tone but enhance readability:\n\n${textToProcess}`;
          break;
        case 'grammar':
          prompt = `Fix grammar, spelling, and punctuation errors in the following text. Return only the corrected version:\n\n${textToProcess}`;
          break;
        case 'formal':
          prompt = `Rewrite the following text in a more formal, professional tone:\n\n${textToProcess}`;
          break;
        case 'casual':
          prompt = `Rewrite the following text in a more casual, friendly tone:\n\n${textToProcess}`;
          break;
        case 'shorter':
          prompt = `Make the following text more concise while keeping all important information:\n\n${textToProcess}`;
          break;
        case 'longer':
          prompt = `Expand the following text with more details, examples, and explanations:\n\n${textToProcess}`;
          break;
        case 'translate':
          prompt = `Translate the following text to English (if it's not English) or to the most appropriate language based on context:\n\n${textToProcess}`;
          break;
        default:
          prompt = `Help improve the following text:\n\n${textToProcess}`;
      }

      const requestPayload = {
        text: textToProcess,
        action: action,
        chatModel: {
          name: chatModel,
          provider: chatModelProvider,
          ...(chatModelProvider === 'custom_openai' && {
            customOpenAIBaseURL: customOpenAIBaseURL,
            customOpenAIKey: customOpenAIKey,
          }),
        },
        embeddingModel: {
          name: localStorage.getItem('embeddingModel'),
          provider: localStorage.getItem('embeddingModelProvider'),
        },
      };

      // Debug: Log request payload (without sensitive data)
      console.log('AI Writing Assistant - Request payload:', {
        ...requestPayload,
        chatModel: {
          ...requestPayload.chatModel,
          ...(requestPayload.chatModel.customOpenAIKey && {
            customOpenAIKey: '[REDACTED]'
          })
        }
      });

      const res = await fetch('/api/writing-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to get AI suggestions');
      }

      const data = await res.json();
      
      if (data.suggestions && data.suggestions.length > 0) {
        // Replace the loading indicator with the AI suggestion
        const suggestion = data.suggestions[0];
        loadingSpan.textContent = suggestion;
        loadingSpan.style.background = 'transparent';
        loadingSpan.style.animation = 'none';
        loadingSpan.style.padding = '0';
        
        // Update editor content and save state
        if (editorRef.current) {
          setEditorContent(editorRef.current.innerHTML);
          saveState();
        }
        
        toast.success('Text improved successfully!');
      } else {
        // Restore original text if no suggestion
        loadingSpan.textContent = selectedText;
        loadingSpan.style.background = 'transparent';
        loadingSpan.style.animation = 'none';
        loadingSpan.style.padding = '0';
        toast.error('No suggestions received from AI');
      }
    } catch (error) {
      // Restore original text on error
      loadingSpan.textContent = selectedText;
      loadingSpan.style.background = 'transparent';
      loadingSpan.style.animation = 'none';
      loadingSpan.style.padding = '0';
      console.error('AI Assistant error:', error);
      toast.error('Failed to get AI suggestions');
    }
  };

  // Keep the original processAIRequest for the modal (backup)
  const processAIRequest = async (action: string, customPrompt?: string) => {
    if (!selectedText && !customPrompt) {
      toast.error('Please select some text first');
      return;
    }

    setAIAssistantLoading(true);
    setAISuggestions([]);

    try {
      const requestPayload = {
        text: selectedText || '',
        action: action,
        customPrompt: customPrompt,
        chatModel: {
          name: localStorage.getItem('chatModel'),
          provider: localStorage.getItem('chatModelProvider'),
        },
        embeddingModel: {
          name: localStorage.getItem('embeddingModel'),
          provider: localStorage.getItem('embeddingModelProvider'),
        },
      };

      const res = await fetch('/api/writing-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to get AI suggestions');
      }

      const data = await res.json();
      
      if (data.suggestions && data.suggestions.length > 0) {
        setAISuggestions(data.suggestions);
      } else {
        toast.error('No suggestions received from AI');
      }
    } catch (error) {
      console.error('AI Assistant error:', error);
      toast.error('Failed to get AI suggestions');
    } finally {
      setAIAssistantLoading(false);
    }
  };

  const applyAISuggestion = (suggestion: string) => {
    // Restore the saved cursor position
    restoreSelection();
    
    if (selectedText && editorRef.current) {
      // Replace selected text with suggestion
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(suggestion));
        range.setStartAfter(range.endContainer);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } else {
      // If no text was selected, append to the end
      if (editorRef.current) {
        const p = document.createElement('p');
        p.textContent = suggestion;
        editorRef.current.appendChild(p);
      }
    }
    
    if (editorRef.current) {
      setEditorContent(editorRef.current.innerHTML);
      saveState();
    }
    
    setShowAIAssistant(false);
    setAISuggestions([]);
    toast.success('AI suggestion applied');
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
      <div className="sticky top-0 z-40 flex items-center justify-between gap-3 p-3 mb-2 bg-light-secondary/90 dark:bg-dark-secondary/90 backdrop-blur-sm rounded-lg border border-light-200 dark:border-dark-200 shadow-sm">
        {/* Left side - Formatting tools */}
        <div className="flex items-center gap-1 flex-wrap">
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

        {/* Right side - Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="px-3 py-1.5 text-sm font-medium text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-light-secondary dark:hover:bg-dark-secondary rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !editorContent.trim()}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* WYSIWYG Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleContentChange}
        onMouseUp={handleTextSelection}
        onKeyUp={handleTextSelection}
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
        className="w-full min-h-[400px] p-4 pt-6 bg-white dark:bg-gray-900 border border-light-200 dark:border-dark-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black dark:text-white overflow-y-auto mb-3 wysiwyg-editor"
        style={{
          lineHeight: '1.6',
          fontSize: '14px',
          whiteSpace: 'normal',
          wordWrap: 'break-word'
        }}
        suppressContentEditableWarning={true}
      />

      {/* Contextual AI Toolbar */}
      {showContextualAI && (
        <div
          className="contextual-ai-toolbar fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-2"
          style={{
            left: contextualAIPosition.x - 150, // Center the toolbar
            top: contextualAIPosition.above ? contextualAIPosition.y - 250 : contextualAIPosition.y,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 px-2">
            AI Actions for selected text
          </div>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => processContextualAI('improve')}
              className="flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <Sparkles size={14} />
              Improve
            </button>
            <button
              onClick={() => processContextualAI('grammar')}
              className="flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <CheckCircle size={14} />
              Fix Grammar
            </button>
            <button
              onClick={() => processContextualAI('formal')}
              className="flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <Edit3 size={14} />
              Make Formal
            </button>
            <button
              onClick={() => processContextualAI('casual')}
              className="flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <RefreshCw size={14} />
              Make Casual
            </button>
            <button
              onClick={() => processContextualAI('shorter')}
              className="flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <ArrowDown size={14} />
              Make Shorter
            </button>
            <button
              onClick={() => processContextualAI('longer')}
              className="flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <ArrowUp size={14} />
              Make Longer
            </button>
            <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
            <button
              onClick={() => setShowContextualAI(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-500"
            >
              <X size={14} />
              Close
            </button>
          </div>
        </div>
      )}
      
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

      {/* AI Writing Assistant Modal */}
      {showAIAssistant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-black dark:text-white flex items-center gap-2">
                <Sparkles size={20} className="text-purple-600" />
                AI Writing Assistant
              </h3>
              <button
                onClick={() => setShowAIAssistant(false)}
                className="p-2 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-light-secondary dark:hover:bg-dark-secondary rounded transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {selectedText && (
              <div className="mb-4 p-3 bg-light-secondary/50 dark:bg-dark-secondary/50 rounded-lg border">
                <p className="text-xs text-black/60 dark:text-white/60 mb-1">Selected text:</p>
                <p className="text-sm text-black dark:text-white line-clamp-3">
                  {selectedText.slice(0, 200)}{selectedText.length > 200 ? '...' : ''}
                </p>
              </div>
            )}
            
            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => processAIRequest('improve')}
                  disabled={aiAssistantLoading}
                  className="p-3 text-left border border-light-200 dark:border-dark-200 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition duration-200 hover:bg-light-secondary/50 dark:hover:bg-dark-secondary/50 disabled:opacity-50"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={16} className="text-blue-600" />
                    <span className="font-medium text-black dark:text-white">Improve</span>
                  </div>
                  <p className="text-xs text-black/70 dark:text-white/70">Make text clearer and more engaging</p>
                </button>
                
                <button
                  onClick={() => processAIRequest('grammar')}
                  disabled={aiAssistantLoading}
                  className="p-3 text-left border border-light-200 dark:border-dark-200 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition duration-200 hover:bg-light-secondary/50 dark:hover:bg-dark-secondary/50 disabled:opacity-50"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle size={16} className="text-green-600" />
                    <span className="font-medium text-black dark:text-white">Fix Grammar</span>
                  </div>
                  <p className="text-xs text-black/70 dark:text-white/70">Correct grammar and spelling</p>
                </button>
                
                <button
                  onClick={() => processAIRequest('formal')}
                  disabled={aiAssistantLoading}
                  className="p-3 text-left border border-light-200 dark:border-dark-200 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition duration-200 hover:bg-light-secondary/50 dark:hover:bg-dark-secondary/50 disabled:opacity-50"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Edit3 size={16} className="text-purple-600" />
                    <span className="font-medium text-black dark:text-white">Formal Tone</span>
                  </div>
                  <p className="text-xs text-black/70 dark:text-white/70">Make more professional</p>
                </button>
                
                <button
                  onClick={() => processAIRequest('casual')}
                  disabled={aiAssistantLoading}
                  className="p-3 text-left border border-light-200 dark:border-dark-200 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition duration-200 hover:bg-light-secondary/50 dark:hover:bg-dark-secondary/50 disabled:opacity-50"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <RefreshCw size={16} className="text-orange-600" />
                    <span className="font-medium text-black dark:text-white">Casual Tone</span>
                  </div>
                  <p className="text-xs text-black/70 dark:text-white/70">Make more friendly</p>
                </button>
                
                <button
                  onClick={() => processAIRequest('shorter')}
                  disabled={aiAssistantLoading}
                  className="p-3 text-left border border-light-200 dark:border-dark-200 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition duration-200 hover:bg-light-secondary/50 dark:hover:bg-dark-secondary/50 disabled:opacity-50"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Underline size={16} className="text-red-600" />
                    <span className="font-medium text-black dark:text-white">Make Shorter</span>
                  </div>
                  <p className="text-xs text-black/70 dark:text-white/70">Condense to key points</p>
                </button>
                
                <button
                  onClick={() => processAIRequest('longer')}
                  disabled={aiAssistantLoading}
                  className="p-3 text-left border border-light-200 dark:border-dark-200 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition duration-200 hover:bg-light-secondary/50 dark:hover:bg-dark-secondary/50 disabled:opacity-50"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <List size={16} className="text-indigo-600" />
                    <span className="font-medium text-black dark:text-white">Expand</span>
                  </div>
                  <p className="text-xs text-black/70 dark:text-white/70">Add more details</p>
                </button>
              </div>
              
              <div className="border-t border-light-200 dark:border-dark-200 pt-3">
                <button
                  onClick={() => {
                    const customPrompt = prompt('Enter your custom instruction:');
                    if (customPrompt) {
                      processAIRequest('custom', customPrompt);
                    }
                  }}
                  disabled={aiAssistantLoading}
                  className="w-full p-3 text-left border border-light-200 dark:border-dark-200 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition duration-200 hover:bg-light-secondary/50 dark:hover:bg-dark-secondary/50 disabled:opacity-50"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Edit3 size={16} className="text-gray-600" />
                    <span className="font-medium text-black dark:text-white">Custom Request</span>
                  </div>
                  <p className="text-xs text-black/70 dark:text-white/70">Enter your own instruction</p>
                </button>
              </div>
            </div>
            
            {aiAssistantLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mr-3"></div>
                <span className="text-black dark:text-white">AI is processing your request...</span>
              </div>
            )}
            
            {aiSuggestions.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-black dark:text-white">AI Suggestions:</h4>
                {aiSuggestions.map((suggestion, i) => (
                  <div key={i} className="border border-light-200 dark:border-dark-200 rounded-lg p-4">
                    <div className="text-sm text-black dark:text-white mb-3 whitespace-pre-wrap">
                      {suggestion}
                    </div>
                    <button
                      onClick={() => applyAISuggestion(suggestion)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Apply This Suggestion
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor; 