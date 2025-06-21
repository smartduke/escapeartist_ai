import { Clock, Edit, Share, Trash, FileText, FileDown } from 'lucide-react';
import { Message } from './ChatWindow';
import { useEffect, useState, Fragment } from 'react';
import React from 'react';
import { formatTimeDifference } from '@/lib/utils';
import DeleteChat from './DeleteChat';
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from '@headlessui/react';
import jsPDF from 'jspdf';
import { useSidebar } from './SidebarContext';
import { cn } from '@/lib/utils';
import { allTemplates } from './MessageInputActions/Focus';
import { useRouter } from 'next/navigation';

const downloadFile = (filename: string, content: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
};

const exportAsMarkdown = (messages: Message[], title: string) => {
  const date = new Date(messages[0]?.createdAt || Date.now()).toLocaleString();
  let md = `# 💬 Chat Export: ${title}\n\n`;
  md += `*Exported on: ${date}*\n\n---\n`;
  messages.forEach((msg, idx) => {
    md += `\n---\n`;
    md += `**${msg.role === 'user' ? '🧑 User' : '🤖 Assistant'}**  
`;
    md += `*${new Date(msg.createdAt).toLocaleString()}*\n\n`;
    md += `> ${msg.content.replace(/\n/g, '\n> ')}\n`;
    if (msg.sources && msg.sources.length > 0) {
      md += `\n**Citations:**\n`;
      msg.sources.forEach((src: any, i: number) => {
        const url = src.metadata?.url || '';
        md += `- [${i + 1}] [${url}](${url})\n`;
      });
    }
  });
  md += '\n---\n';
  downloadFile(`${title || 'chat'}.md`, md, 'text/markdown');
};

const exportAsPDF = async (messages: Message[], title: string) => {
  try {
    // Show loading state
    const button = document.querySelector('[data-pdf-export]') as HTMLElement;
    const originalText = button?.textContent;
    if (button) {
      button.textContent = 'Generating PDF...';
      button.style.pointerEvents = 'none';
    }

    // Use setTimeout to allow UI to update
    await new Promise(resolve => setTimeout(resolve, 100));

    const doc = new jsPDF();
    const margin = 20;
    const contentWidth = doc.internal.pageSize.width - (margin * 2);
    let y = margin;

    const checkNewPage = (space: number) => {
      if (y + space > doc.internal.pageSize.height - 20) {
        doc.addPage();
        y = margin;
      }
    };

    // Helper function to draw a nice divider
    const addDivider = () => {
      checkNewPage(15);
      y += 5;
      
      // Draw a subtle line with dots
      doc.setDrawColor(200, 200, 200); // Light gray
      doc.setLineWidth(0.5);
      
      // Main line
      doc.line(margin, y, doc.internal.pageSize.width - margin, y);
      
      // Add small decorative dots
      doc.setFillColor(150, 150, 150);
      const centerX = doc.internal.pageSize.width / 2;
      doc.circle(centerX - 10, y, 1, 'F');
      doc.circle(centerX, y, 1, 'F');
      doc.circle(centerX + 10, y, 1, 'F');
      
      y += 10;
    };

    // Helper function to add image from URL
    const addImageFromUrl = async (imageUrl: string, altText: string = '') => {
      try {
        const response = await fetch(imageUrl);
        if (!response.ok) return;
        
        const blob = await response.blob();
        const reader = new FileReader();
        
        return new Promise<void>((resolve) => {
          reader.onload = () => {
            try {
              const base64 = reader.result as string;
              const img = new Image();
              img.onload = () => {
                const maxWidth = contentWidth * 0.7;
                const aspectRatio = img.width / img.height;
                const imgWidth = Math.min(maxWidth, img.width);
                const imgHeight = imgWidth / aspectRatio;
                
                checkNewPage(imgHeight + 15);
                doc.addImage(base64, 'JPEG', margin, y, imgWidth, imgHeight);
                y += imgHeight + 5;
                
                // Add image caption if available
                if (altText) {
                  doc.setFont('times', 'italic');
                  doc.setFontSize(9);
                  doc.setTextColor(100, 100, 100);
                  doc.text(altText, margin, y);
                  y += 8;
                  doc.setTextColor(0, 0, 0);
                }
                
                resolve();
              };
              img.onerror = () => resolve();
              img.src = base64;
            } catch (error) {
              resolve();
            }
          };
          reader.onerror = () => resolve();
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        return Promise.resolve();
      }
    };

    // Brand name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Perplexica', margin, y);
    y += 20;

    // Main title (first user question)
    const userQuery = messages.find(msg => msg.role === 'user')?.content || title;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    const titleLines = doc.splitTextToSize(userQuery, contentWidth);
    titleLines.forEach((line: string) => {
      checkNewPage(10);
      doc.text(line, margin, y);
      y += 8;
    });
    y += 8; // Reduced from 15 to 8

    // Process messages with proper formatting
    for (let index = 0; index < messages.length; index++) {
      const message = messages[index];
      
      if (message.role === 'user' && index > 0) {
        // Follow-up questions without "Q:" prefix
        checkNewPage(15);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        const questionLines = doc.splitTextToSize(message.content, contentWidth);
        questionLines.forEach((line: string) => {
          checkNewPage(8);
          doc.text(line, margin, y);
          y += 8;
        });
        y += 12;
      }
      
      if (message.role === 'assistant') {
        // Process content with inline images
        let content = message.content
          .replace(/<think>[\s\S]*?<\/think>/g, '') // Remove think tags
          .trim();
        
        // Split content by lines and process each line
        const lines = content.split('\n');
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;
          
          // Check if line contains an image
          const imageMatch = trimmedLine.match(/!\[([^\]]*)\]\(([^)]+)\)/);
          if (imageMatch) {
            const [, alt, url] = imageMatch;
            if (url.startsWith('http')) {
              await addImageFromUrl(url, alt);
            }
            continue;
          }
          
          // Handle headings
          if (trimmedLine.startsWith('###')) {
            checkNewPage(12);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text(trimmedLine.replace(/^###\s*/, ''), margin, y);
            y += 10;
          } else if (trimmedLine.startsWith('##')) {
            checkNewPage(14);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(13);
            doc.text(trimmedLine.replace(/^##\s*/, ''), margin, y);
            y += 12;
          } else if (trimmedLine.startsWith('#')) {
            checkNewPage(16);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.text(trimmedLine.replace(/^#\s*/, ''), margin, y);
            y += 14;
          }
          // Handle bullet points
          else if (trimmedLine.match(/^[-*•]\s/) || trimmedLine.includes('•')) {
            checkNewPage(8);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            const bulletText = trimmedLine.replace(/^[-*•]\s*/, '');
            const bulletLines = doc.splitTextToSize('• ' + bulletText, contentWidth - 10);
            bulletLines.forEach((bLine: string) => {
              checkNewPage(6);
              doc.text(bLine, margin + 5, y);
              y += 6;
            });
            y += 2;
          }
          // Handle numbered lists
          else if (trimmedLine.match(/^\d+\.\s/)) {
            checkNewPage(8);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            const listLines = doc.splitTextToSize(trimmedLine, contentWidth - 10);
            listLines.forEach((lLine: string, idx: number) => {
              checkNewPage(6);
              doc.text(lLine, margin + (idx === 0 ? 0 : 15), y);
              y += 6;
            });
            y += 2;
          }
          // Regular text
          else {
            checkNewPage(8);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
            
            // Clean markdown formatting
            let cleanText = trimmedLine
              .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
              .replace(/\*(.*?)\*/g, '$1')     // Italic
              .replace(/`(.*?)`/g, '$1');      // Code
            
            const textLines = doc.splitTextToSize(cleanText, contentWidth);
            textLines.forEach((tLine: string) => {
              checkNewPage(6);
              doc.text(tLine, margin, y);
              y += 6;
            });
            y += 4;
          }
        }
        
        y += 6;

        // Sources
        if (message.sources && message.sources.length > 0) {
          checkNewPage(15);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.text('Sources:', margin, y);
          y += 10;
          
          message.sources.forEach((source: any, i: number) => {
            checkNewPage(8);
            const title = source.metadata?.title || 'Source';
            const url = source.metadata?.url || '';
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            
            const sourceText = `${i + 1}. ${title.substring(0, 60)}${title.length > 60 ? '...' : ''}`;
            
            if (url && url !== 'File') {
              doc.setTextColor(0, 0, 255);
              doc.textWithLink(sourceText, margin + 5, y, { url: url });
              doc.setTextColor(0, 0, 0);
            } else {
              doc.text(sourceText, margin + 5, y);
            }
            
            y += 7;
          });
          y += 8;
        }
        
        // Add divider after each assistant response (except the last one)
        if (index < messages.length - 1) {
          addDivider();
        }
      }
      
      // Allow UI to breathe every few messages
      if (index % 3 === 0) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    // Save
    const filename = userQuery.substring(0, 50).replace(/[^a-zA-Z0-9\s]/g, '') || 'chat';
    doc.save(`${filename}.pdf`);

    // Reset button state
    if (button && originalText) {
      button.textContent = originalText;
      button.style.pointerEvents = 'auto';
    }

  } catch (error) {
    console.error('PDF generation failed:', error);
    // Reset button state on error
    const button = document.querySelector('[data-pdf-export]') as HTMLElement;
    if (button) {
      button.textContent = 'Export as PDF';
      button.style.pointerEvents = 'auto';
    }
  }
};

const Navbar = ({
  chatId,
  messages,
  focusMode,
}: {
  messages: Message[];
  chatId: string;
  focusMode?: string;
}) => {
  const [title, setTitle] = useState<string>('');
  const [currentTitle, setCurrentTitle] = useState<string>('');
  const [timeAgo, setTimeAgo] = useState<string>('');
  const [showTitle, setShowTitle] = useState<boolean>(false);
  const { isExpanded } = useSidebar();
  const router = useRouter();

  // Get current template info
  const currentTemplate = allTemplates.find(template => template.key === focusMode);
  const templateName = currentTemplate?.title || 'All Sources';

  const handleTemplateClick = () => {
    // Navigate to homepage with template selected
    const url = focusMode && focusMode !== 'webSearch' 
      ? `/?template=${focusMode}` 
      : '/';
    window.location.href = url;
  };

  useEffect(() => {
    if (messages.length > 0) {
      const newTitle =
        messages[0].content.length > 20
          ? `${messages[0].content.substring(0, 20).trim()}...`
          : messages[0].content;
      setTitle(newTitle);
      setCurrentTitle(newTitle); // Initialize current title
      const newTimeAgo = formatTimeDifference(
        new Date(),
        messages[0].createdAt,
      );
      setTimeAgo(newTimeAgo);
    }
  }, [messages]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (messages.length > 0) {
        const newTimeAgo = formatTimeDifference(
          new Date(),
          messages[0].createdAt,
        );
        setTimeAgo(newTimeAgo);
      }
    }, 1000);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setShowTitle(scrollY > 100);
      
      // Find which message is currently in view
      if (messages.length > 0) {
        // Get all user message elements (these contain the titles we want to track)
        const messageElements = document.querySelectorAll('[data-message-index]');
        let currentMessageIndex = 0;
        
        // Find the topmost user message that has passed the navbar (100px from top)
        for (let i = messageElements.length - 1; i >= 0; i--) {
          const element = messageElements[i] as HTMLElement;
          const rect = element.getBoundingClientRect();
          const messageIndex = parseInt(element.getAttribute('data-message-index') || '0');
          
          // If the message has scrolled past the navbar area (100px), use this message
          if (rect.top <= 100) {
            currentMessageIndex = messageIndex;
            break;
          }
        }
        
        // Update current title based on the determined message
        if (messages[currentMessageIndex] && messages[currentMessageIndex].role === 'user') {
          const messageContent = messages[currentMessageIndex].content;
          const displayTitle = messageContent.length > 50
            ? `${messageContent.substring(0, 50).trim()}...`
            : messageContent;
          setCurrentTitle(displayTitle);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [messages]);

  return (
    <div className={cn(
      "fixed z-40 top-0 left-0 right-0 flex flex-row items-center justify-between w-full py-4 text-sm text-black dark:text-white/70 border-b bg-light-primary dark:bg-dark-primary border-light-100 dark:border-dark-200 transition-all duration-300 ease-in-out",
      isExpanded ? "lg:pl-[280px]" : "lg:pl-[60px]",
      "px-4 lg:pr-6"
    )}>
      <div className="flex items-center gap-3 lg:hidden">
        <a
          href="/"
          className="active:scale-95 transition duration-100 cursor-pointer"
        >
          <Edit size={17} />
        </a>
        
        {/* Mobile Template Name */}
        <button
          onClick={handleTemplateClick}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-light-secondary dark:hover:bg-dark-secondary transition-colors"
          title={`Switch to ${templateName} template`}
        >
          {currentTemplate && (
            <div className="text-blue-600 dark:text-blue-400">
              {React.cloneElement(currentTemplate.icon as React.ReactElement, { 
                size: 12, 
                className: "stroke-[1.5]" 
              })}
            </div>
          )}
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
            {templateName}
          </span>
        </button>
      </div>
      <div className="hidden lg:flex flex-row items-center justify-center space-x-4">
        {/* Template Name */}
        <button
          onClick={handleTemplateClick}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-light-secondary dark:hover:bg-dark-secondary transition-colors group"
          title={`Switch to ${templateName} template`}
        >
          {currentTemplate && (
            <div className="text-blue-600 dark:text-blue-400">
              {React.cloneElement(currentTemplate.icon as React.ReactElement, { 
                size: 14, 
                className: "stroke-[1.5]" 
              })}
            </div>
          )}
          <span className="text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
            {templateName}
          </span>
        </button>
        
        {/* Show title when scrolled */}
        {showTitle && (
          <>
            <div className="w-px h-4 bg-light-200 dark:bg-dark-200" />
            <div className="flex items-center">
              <p className="text-lg font-semibold truncate max-w-lg">{currentTitle || title}</p>
            </div>
          </>
        )}
      </div>
      <p className={cn("hidden lg:flex transition-opacity duration-300", showTitle ? "opacity-0" : "opacity-100")}>{title}</p>

      <div className="flex flex-row items-center space-x-4">
        <Popover className="relative">
          <PopoverButton className="active:scale-95 transition duration-100 cursor-pointer p-2 rounded-full hover:bg-light-secondary dark:hover:bg-dark-secondary">
            <Share size={17} />
          </PopoverButton>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-75"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <PopoverPanel className="absolute right-0 mt-2 w-64 rounded-xl shadow-xl bg-light-primary dark:bg-dark-primary border border-light-200 dark:border-dark-200 z-50">
              <div className="flex flex-col py-3 px-3 gap-2">
                <button
                  className="flex items-center gap-2 px-4 py-2 text-left hover:bg-light-secondary dark:hover:bg-dark-secondary transition-colors text-black dark:text-white rounded-lg font-medium"
                  onClick={() => exportAsMarkdown(messages, title || '')}
                >
                  <FileText size={17} className="text-[#24A0ED]" />
                  Export as Markdown
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2 text-left hover:bg-light-secondary dark:hover:bg-dark-secondary transition-colors text-black dark:text-white rounded-lg font-medium"
                  onClick={() => exportAsPDF(messages, title || '')}
                  data-pdf-export
                >
                  <FileDown size={17} className="text-[#24A0ED]" />
                  Export as PDF
                </button>
              </div>
            </PopoverPanel>
          </Transition>
        </Popover>
        <DeleteChat redirect chatId={chatId} chats={[]} setChats={() => {}} />
      </div>
    </div>
  );
};

export default Navbar;
