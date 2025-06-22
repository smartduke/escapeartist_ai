'use client';

/* eslint-disable @next/next/no-img-element */
import React, { MutableRefObject, useEffect, useState, useRef } from 'react';
import { Message } from './ChatWindow';
import { cn } from '@/lib/utils';
import {
  BookCopy,
  Disc3,
  ImagesIcon,
  Volume2,
  StopCircle,
  Layers3,
  Plus,
  Edit3,
  VideoIcon,
  Bot,
  Sparkles,
  Zap,
  BrainCircuit,
  MessageSquare,
  Lightbulb,
  Stars,
  Disc,
  RotateCw,
  Target,
  Compass,
  Loader,
  Circle,
  RefreshCw,
  Loader2,
  Settings,
  Cpu,
  Atom,
  Download,
  FileText,
  FileDown,
  File,
} from 'lucide-react';
import Markdown, { MarkdownToJSX } from 'markdown-to-jsx';
import Copy from './MessageActions/Copy';
import Rewrite from './MessageActions/Rewrite';
import RichTextEditor from './MessageActions/RichTextEditor';
import MessageSources from './MessageSources';
import SearchImages from './SearchImages';
import SearchVideos from './SearchVideos';
import { useSpeech } from 'react-text-to-speech';
import ThinkBox from './ThinkBox';
import SourcesSidebar from './SourcesSidebar';
import { Document } from '@langchain/core/documents';
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from '@headlessui/react';
import jsPDF from 'jspdf';
import { Document as DocxDocument, Packer, Paragraph, TextRun, AlignmentType, ImageRun } from 'docx';
import { saveAs } from 'file-saver';

const ThinkTagProcessor = ({ children }: { children: React.ReactNode }) => {
  return <ThinkBox content={children as string} />;
};

// Export functions for individual messages
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

const exportMessageAsMarkdown = (message: Message, userMessage?: Message) => {
  const date = new Date(message.createdAt || Date.now()).toLocaleString();
  const title = userMessage?.content || message.content;
  const shortContent = title.substring(0, 40).replace(/[^a-zA-Z0-9\s]/g, '').trim() || 'message';
  
  let md = `# Chat Export: ${shortContent}\n\n`;
  md += `*Exported on: ${date}*\n\n---\n`;
  
  // Add user message if available and this is an assistant response
  if (userMessage && message.role === 'assistant') {
    md += `\n---\n`;
    md += `**User**  \n`;
    md += `*${new Date(userMessage.createdAt).toLocaleString()}*\n\n`;
    md += `> ${userMessage.content.replace(/\n/g, '\n> ')}\n`;
  }
  
  md += `\n---\n`;
  md += `**${message.role === 'user' ? 'User' : 'Assistant'}**  \n`;
  md += `*${new Date(message.createdAt).toLocaleString()}*\n\n`;
  md += `> ${message.content.replace(/\n/g, '\n> ')}\n`;
  
  if (message.sources && message.sources.length > 0) {
    md += `\n**Citations:**\n`;
    message.sources.forEach((src: any, i: number) => {
      const url = src.metadata?.url || '';
      md += `- [${i + 1}] [${url}](${url})\n`;
    });
  }
  md += '\n---\n';
  
  downloadFile(`${shortContent}.md`, md, 'text/markdown');
};

const exportMessageAsPDF = async (message: Message, userMessage?: Message) => {
  try {
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

    // Brand name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Perplexica', margin, y);
    y += 20;

    // Main title (user question or message content)
    const title = userMessage?.content || message.content;
    const shortContent = title.substring(0, 80).replace(/[^\w\s]/g, '').trim() || 'Chat Export';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    const titleLines = doc.splitTextToSize(shortContent, contentWidth);
    titleLines.forEach((line: string) => {
      checkNewPage(10);
      doc.text(line, margin, y);
      y += 8;
    });
    y += 8;

    // Process user message first if this is an assistant response
    if (userMessage && message.role === 'assistant') {
      // User question
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      const questionLines = doc.splitTextToSize(userMessage.content, contentWidth);
      questionLines.forEach((line: string) => {
        checkNewPage(8);
        doc.text(line, margin, y);
        y += 8;
      });
      y += 12;
    }

    // Process assistant response content
    if (message.role === 'assistant') {
      let content = message.content
        .replace(/<think>[\s\S]*?<\/think>/g, '') // Remove think tags
        .trim();
      
      // Split content by lines and process each line
      const lines = content.split('\n');
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        
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
        } else {
          // Regular text
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(11);
          doc.setTextColor(0, 0, 0);
          
          // Process bold and italic formatting
          let processedLine = trimmedLine
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
            .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
            .replace(/`(.*?)`/g, '$1') // Remove code markdown
            .replace(/\[(\d+)\]/g, ''); // Remove citations
          
          const textLines = doc.splitTextToSize(processedLine, contentWidth);
          textLines.forEach((textLine: string) => {
            checkNewPage(8);
            doc.text(textLine, margin, y);
            y += 6;
          });
          y += 2;
        }
      }
    }

    // Sources section
    if (message.sources && message.sources.length > 0) {
      y += 10;
      addDivider();
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(120, 58, 237); // Purple color
      doc.text('Sources & References', margin, y);
      y += 15;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);

      message.sources.forEach((source: any, i: number) => {
        checkNewPage(15);
        const title = source.metadata?.title || 'Source';
        const url = source.metadata?.url || '';
        
        doc.text(`${i + 1}. ${title}`, margin, y);
        y += 8;
        
        if (url && url !== 'File') {
          doc.setTextColor(37, 99, 235);
          doc.text(`   ${url}`, margin, y);
          doc.setTextColor(0, 0, 0);
          y += 8;
        }
        y += 2;
      });
    }

    // Footer with elegant divider
    y += 20;
    addDivider();
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text('Generated by Perplexica AI • Advanced AI Search Engine', margin, y);

    const filename = message.content.substring(0, 40).replace(/[^a-zA-Z0-9\s]/g, '').trim() || 'message';
    doc.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Failed to export PDF:', error);
  }
};

const exportMessageAsWord = async (message: Message, userMessage?: Message) => {
  try {
    const children = [];

    // Helper function to fetch image and create ImageRun
    const createImageFromUrl = async (imageUrl: string, altText: string = ''): Promise<ImageRun | null> => {
      try {
        const response = await fetch(imageUrl);
        if (!response.ok) return null;
        
        const arrayBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        return new ImageRun({
          data: uint8Array,
          transformation: {
            width: 500,
            height: 375,
          },
          type: 'jpg',
        });
      } catch (error) {
        console.error('Failed to load image:', error);
        return null;
      }
    };

    // Helper function to parse text with markdown formatting
    const parseTextWithFormatting = (text: string): TextRun[] => {
      const runs: TextRun[] = [];
      let remaining = text;
      
      // Process bold, italic, and code in sequence
      while (remaining.length > 0) {
        let matched = false;
        
        // Check for bold text **text**
        const boldMatch = remaining.match(/^(.*?)\*\*(.*?)\*\*/);
        if (boldMatch) {
          const [, before, boldText] = boldMatch;
          if (before) runs.push(new TextRun({ text: before }));
          runs.push(new TextRun({ text: boldText, bold: true }));
          remaining = remaining.substring(before.length + boldText.length + 4);
          matched = true;
        }
        
        // Check for italic text *text*
        if (!matched) {
          const italicMatch = remaining.match(/^(.*?)\*(.*?)\*/);
          if (italicMatch) {
            const [, before, italicText] = italicMatch;
            if (before) runs.push(new TextRun({ text: before }));
            runs.push(new TextRun({ text: italicText, italics: true }));
            remaining = remaining.substring(before.length + italicText.length + 2);
            matched = true;
          }
        }
        
        // Check for code text `text`
        if (!matched) {
          const codeMatch = remaining.match(/^(.*?)`(.*?)`/);
          if (codeMatch) {
            const [, before, codeText] = codeMatch;
            if (before) runs.push(new TextRun({ text: before }));
            runs.push(new TextRun({ 
              text: codeText, 
              font: 'Consolas',
              shading: { fill: 'F5F5F5' },
              color: '990000'
            }));
            remaining = remaining.substring(before.length + codeText.length + 2);
            matched = true;
          }
        }
        
        // If no formatting found, take the rest as plain text
        if (!matched) {
          if (remaining) runs.push(new TextRun({ text: remaining }));
          break;
        }
      }
      
      return runs.length > 0 ? runs : [new TextRun({ text })];
    };

    // Add document header
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Perplexica AI Chat Export',
            bold: true,
            size: 32,
            color: '1a56db',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
      })
    );

    // Add export date
    const exportDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Exported on ${exportDate}`,
            italics: true,
            color: '666666',
            size: 18,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );

    // Add horizontal line
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
            color: 'CCCCCC',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );

    // Add user message first if this is an assistant response
    if (userMessage && message.role === 'assistant') {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'User',
              bold: true,
              size: 20,
              color: '22C55E',
            }),
          ],
          spacing: { after: 200 },
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: new Date(userMessage.createdAt).toLocaleString(),
              italics: true,
              color: '666666',
              size: 16,
            }),
          ],
          spacing: { after: 300 },
        })
      );

      const userParagraphs = userMessage.content.split('\n\n');
      userParagraphs.forEach(paragraph => {
        if (paragraph.trim()) {
          children.push(
            new Paragraph({
              children: parseTextWithFormatting(paragraph.trim()),
              spacing: { after: 240 },
            })
          );
        }
      });

      // Add divider after user message
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
              color: 'D1D5DB',
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 300, after: 300 },
        })
      );
    }

    // Add assistant message if applicable
    if (message.role === 'assistant') {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Assistant',
              bold: true,
              size: 20,
              color: '3B82F6',
            }),
          ],
          spacing: { after: 200 },
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: new Date(message.createdAt).toLocaleString(),
              italics: true,
              color: '666666',
              size: 16,
            }),
          ],
          spacing: { after: 300 },
        })
      );
    }

    // Process message content
    let content = message.content
      .replace(/<think>[\s\S]*?<\/think>/g, '')
      .trim();

    // Split content into paragraphs and process each
    const paragraphs = content.split('\n\n');
    
    for (const paragraph of paragraphs) {
      if (!paragraph.trim()) continue;
      
      const lines = paragraph.split('\n');
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        
        // Check for images
        const imageMatch = trimmedLine.match(/!\[([^\]]*)\]\(([^)]+)\)/);
        if (imageMatch) {
          const [, alt, url] = imageMatch;
          if (url.startsWith('http')) {
            try {
              const imageRun = await createImageFromUrl(url, alt);
              if (imageRun) {
                children.push(
                  new Paragraph({
                    children: [imageRun],
                    spacing: { after: 240 },
                    alignment: AlignmentType.CENTER,
                  })
                );
                
                if (alt) {
                  children.push(
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: alt,
                          italics: true,
                          size: 16,
                          color: '666666',
                        }),
                      ],
                      spacing: { after: 240 },
                      alignment: AlignmentType.CENTER,
                    })
                  );
                }
              }
            } catch (error) {
              console.error('Failed to process image:', error);
            }
          }
          continue;
        }
        
        // Handle headings
        if (trimmedLine.startsWith('###')) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: trimmedLine.replace(/^###\s*/, ''),
                  bold: true,
                  size: 18,
                }),
              ],
              spacing: { before: 240, after: 120 },
            })
          );
        } else if (trimmedLine.startsWith('##')) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: trimmedLine.replace(/^##\s*/, ''),
                  bold: true,
                  size: 20,
                }),
              ],
              spacing: { before: 300, after: 150 },
            })
          );
        } else if (trimmedLine.startsWith('#')) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: trimmedLine.replace(/^#\s*/, ''),
                  bold: true,
                  size: 22,
                }),
              ],
              spacing: { before: 360, after: 180 },
            })
          );
        } else {
          // Regular paragraph
          children.push(
            new Paragraph({
              children: parseTextWithFormatting(trimmedLine),
              spacing: { after: 200 },
            })
          );
        }
      }
    }

    // Add sources section
    if (message.sources && message.sources.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Sources & References',
              bold: true,
              size: 18,
              color: '7C3AED',
            }),
          ],
          spacing: { before: 400, after: 200 },
        })
      );

      message.sources.forEach((source: any, i: number) => {
        const title = source.metadata?.title || 'Source';
        const url = source.metadata?.url || '';
        
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${i + 1}. `, bold: true }),
              new TextRun({ text: title }),
              ...(url && url !== 'File' ? [
                new TextRun({ text: '\n   ' }),
                new TextRun({ text: url, color: '2563EB', underline: {} }),
              ] : []),
            ],
            spacing: { after: 120 },
            indent: { left: 300 },
          })
        );
      });

      // Add divider after sources
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
              color: 'D1D5DB',
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 300, after: 300 },
        })
      );
    }

    // Add footer
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
            color: 'CCCCCC',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 500, after: 200 },
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Generated by Perplexica AI • Advanced AI Search Engine',
            italics: true,
            color: '6B7280',
            size: 16,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      })
    );

    // Create document with proper styling
    const doc = new DocxDocument({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440,    // 1 inch
                right: 1440,  // 1 inch  
                bottom: 1440, // 1 inch
                left: 1440,   // 1 inch
              },
            },
          },
          children: children,
        },
      ],
    });

    // Generate and save
    const blob = await Packer.toBlob(doc);
    const shortContent = message.content.substring(0, 40).replace(/[^a-zA-Z0-9\s]/g, '').trim() || 'message';
    saveAs(blob, `${shortContent}.docx`);

  } catch (error) {
    console.error('Failed to export Word document:', error);
  }
};

const MessageBox = ({
  message,
  messageIndex,
  history,
  loading,
  dividerRef,
  isLast,
  rewrite,
  sendMessage,
  onMessageUpdate,
  isEditing,
  onEditStart,
  onEditEnd,
}: {
  message: Message;
  messageIndex: number;
  history: Message[];
  loading: boolean;
  dividerRef?: MutableRefObject<HTMLDivElement | null>;
  isLast: boolean;
  rewrite: (messageId: string) => void;
  sendMessage: (message: string) => void;
  onMessageUpdate?: (messageId: string, newContent: string) => void;
  isEditing?: boolean;
  onEditStart?: () => void;
  onEditEnd?: () => void;
}) => {
  const [parsedMessage, setParsedMessage] = useState(message.content);
  const [speechMessage, setSpeechMessage] = useState(message.content);
  const [showSourcesSidebar, setShowSourcesSidebar] = useState(false);
  const [sidebarSources, setSidebarSources] = useState<Document[]>([]);
  const [sidebarMessageIndex, setSidebarMessageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('answer');
  const tabNavRef = useRef<HTMLDivElement>(null);

  const handleTabClick = (tabName: string) => {
    setActiveTab(tabName);
    tabNavRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    const citationRegex = /\[([^\]]+)\]/g;
    const regex = /\[(\d+)\]/g;
    let processedMessage = message.content;

    if (message.role === 'assistant' && message.content.includes('<think>')) {
      const openThinkTag = processedMessage.match(/<think>/g)?.length || 0;
      const closeThinkTag = processedMessage.match(/<\/think>/g)?.length || 0;

      if (openThinkTag > closeThinkTag) {
        processedMessage += '</think> <a> </a>'; // The extra <a> </a> is to prevent the the think component from looking bad
      }
    }

    if (
      message.role === 'assistant' &&
      message?.sources &&
      message.sources.length > 0
    ) {
      console.log(`[MessageBox] Processing ${message.sources.length} sources for citations`);
      console.log(`[MessageBox] Sources:`, message.sources.map((s, i) => `${i+1}. ${s.metadata?.title}`));
      setParsedMessage(
        processedMessage.replace(
          citationRegex,
          (_, capturedContent: string) => {
            const numbers = capturedContent
              .split(',')
              .map((numStr) => numStr.trim());

            const linksHtml = numbers
              .map((numStr) => {
                const number = parseInt(numStr);

                if (isNaN(number) || number <= 0) {
                  return `[${numStr}]`;
                }

                const source = message.sources?.[number - 1];
                const url = source?.metadata?.url;

                if (url) {
                  return `<a href="${url}" target="_blank" className="bg-light-secondary dark:bg-dark-secondary px-1 rounded ml-1 no-underline text-xs text-black/70 dark:text-white/70 relative">${numStr}</a>`;
                } else {
                  return `[${numStr}]`;
                }
              })
              .join('');

            return linksHtml;
          },
        ),
      );
      setSpeechMessage(message.content.replace(regex, ''));
      return;
    }

    setSpeechMessage(message.content.replace(regex, ''));
    setParsedMessage(processedMessage);
  }, [message.content, message.sources, message.role]);

  const { speechStatus, start, stop } = useSpeech({ text: speechMessage });

  const handleViewSources = (sources: Document[], messageIndex: number) => {
    setSidebarSources(sources);
    setSidebarMessageIndex(messageIndex);
    setShowSourcesSidebar(true);
  };

  const handleCloseSidebar = () => {
    setShowSourcesSidebar(false);
  };

  const markdownOverrides: MarkdownToJSX.Options = {
    overrides: {
      think: {
        component: ThinkTagProcessor,
      },
    },
  };

  return (
    <div>
      {message.role === 'user' && (
        <div
          data-message-index={messageIndex}
          className={cn(
            'w-full',
            messageIndex === 0 ? 'pt-16' : 'pt-8',
            'break-words',
          )}
        >
          {/* Clean User Message */}
          <h2 className="text-black dark:text-white font-medium text-2xl lg:text-3xl leading-relaxed lg:w-9/12">
            {message.content}
          </h2>
        </div>
      )}

      {message.role === 'assistant' && (
        <div className="flex flex-col w-full">
          <div
            ref={dividerRef}
            className="w-full"
          >
            {/* Refined Tab Navigation */}
            <div 
              ref={tabNavRef}
              className={cn(
                "bg-light-primary dark:bg-dark-primary border-b border-light-200 dark:border-dark-200 mb-6",
                isEditing ? "" : "sticky top-16 z-10"
              )}>
              <nav className="flex space-x-8">
                <button
                  onClick={() => handleTabClick('answer')}
                  className={cn(
                    'py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200',
                    activeTab === 'answer'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  )}
                >
                  <div className="flex items-center space-x-2">
                    <Atom
                      className={cn(
                        isLast && loading ? 'animate-spin' : 'animate-none',
                      )}
                      size={18}
                    />
                    <span>AI Answer</span>
                  </div>
                </button>
                <button
                  onClick={() => handleTabClick('images')}
                  className={cn(
                    'py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200',
                    activeTab === 'images'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  )}
                >
                  <div className="flex items-center space-x-2">
                    <ImagesIcon size={18} />
                    <span>Images</span>
                  </div>
                </button>
                <button
                  onClick={() => handleTabClick('videos')}
                  className={cn(
                    'py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200',
                    activeTab === 'videos'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  )}
                >
                  <div className="flex items-center space-x-2">
                    <VideoIcon size={18} />
                    <span>Videos</span>
                  </div>
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'answer' && (
              <div className="flex flex-col space-y-4">
                {message.sources && message.sources.length > 0 && (
                  <div className="flex flex-col space-y-3">
                    <div className="flex flex-row items-center space-x-2">
                      <BookCopy className="text-black dark:text-white" size={20} />
                      <h3 className="text-black dark:text-white font-medium text-xl">
                        Sources
                      </h3>
                      <span className="text-xs text-gray-500">({message.sources.length} sources)</span>
                    </div>
                    <MessageSources 
                      sources={message.sources} 
                      messageIndex={messageIndex}
                      onViewSources={handleViewSources}
                    />
                  </div>
                )}
                
                <div className="flex flex-col space-y-2">
                  {isEditing && onMessageUpdate ? (
                    <RichTextEditor
                      messageId={message.messageId}
                      initialContent={message.content}
                      onUpdate={onMessageUpdate}
                      onEditStart={onEditStart}
                      onEditEnd={onEditEnd}
                      message={message}
                      history={history}
                    />
                  ) : (
                    <Markdown
                      className={cn(
                        'prose prose-h1:mb-3 prose-h2:mb-2 prose-h2:mt-6 prose-h2:font-[800] prose-h3:mt-4 prose-h3:mb-1.5 prose-h3:font-[600] dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 font-[400]',
                        'max-w-none break-words text-black dark:text-white',
                      )}
                      options={markdownOverrides}
                    >
                      {parsedMessage}
                    </Markdown>
                  )}
                  
                  {loading && isLast ? null : (
                    <div className="flex flex-row items-center justify-between w-full text-black dark:text-white py-4 -mx-2">
                      <div className="flex flex-row items-center space-x-1">
                        <Rewrite rewrite={rewrite} messageId={message.messageId} />
                        {onEditStart && !isEditing && (
                          <button
                            onClick={onEditStart}
                            className="p-2 text-black/70 dark:text-white/70 rounded-xl hover:bg-light-secondary dark:hover:bg-dark-secondary transition duration-200 hover:text-black dark:hover:text-white"
                            title="Edit message"
                          >
                            <Edit3 size={18} />
                          </button>
                        )}
                      </div>
                      <div className="flex flex-row items-center space-x-1">
                        <Copy initialMessage={message.content} message={message} />
                        <button
                          onClick={() => {
                            if (speechStatus === 'started') {
                              stop();
                            } else {
                              start();
                            }
                          }}
                          className="p-2 text-black/70 dark:text-white/70 rounded-xl hover:bg-light-secondary dark:hover:bg-dark-secondary transition duration-200 hover:text-black dark:hover:text-white"
                        >
                          {speechStatus === 'started' ? (
                            <StopCircle size={18} />
                          ) : (
                            <Volume2 size={18} />
                          )}
                        </button>
                        
                        {/* Export Dropdown */}
                        <Popover className="relative">
                          <PopoverButton className="p-2 text-black/70 dark:text-white/70 rounded-xl hover:bg-light-secondary dark:hover:bg-dark-secondary transition duration-200 hover:text-black dark:hover:text-white">
                            <Download size={18} />
                          </PopoverButton>
                          
                          <Transition
                            enter="transition ease-out duration-150"
                            enterFrom="opacity-0 translate-y-1"
                            enterTo="opacity-100 translate-y-0"
                            leave="transition ease-in duration-150"
                            leaveFrom="opacity-100 translate-y-0"
                            leaveTo="opacity-0 translate-y-1"
                          >
                            <PopoverPanel className="absolute right-0 top-full mt-2 w-48 rounded-lg bg-white dark:bg-dark-secondary shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                              <div className="flex flex-col py-3 px-3 gap-2">
                                <button
                                  className="flex items-center gap-2 px-4 py-2 text-left hover:bg-light-secondary dark:hover:bg-dark-primary transition-colors text-black dark:text-white rounded-lg font-medium"
                                  onClick={() => exportMessageAsMarkdown(message, message.role === 'assistant' && messageIndex > 0 ? history[messageIndex - 1] : undefined)}
                                >
                                  <FileText size={17} className="text-[#24A0ED]" />
                                  Export as Markdown
                                </button>
                                <button
                                  className="flex items-center gap-2 px-4 py-2 text-left hover:bg-light-secondary dark:hover:bg-dark-primary transition-colors text-black dark:text-white rounded-lg font-medium"
                                  onClick={() => exportMessageAsPDF(message, message.role === 'assistant' && messageIndex > 0 ? history[messageIndex - 1] : undefined)}
                                >
                                  <FileDown size={17} className="text-[#24A0ED]" />
                                  Export as PDF
                                </button>
                                <button
                                  className="flex items-center gap-2 px-4 py-2 text-left hover:bg-light-secondary dark:hover:bg-dark-primary transition-colors text-black dark:text-white rounded-lg font-medium"
                                  onClick={() => exportMessageAsWord(message, message.role === 'assistant' && messageIndex > 0 ? history[messageIndex - 1] : undefined)}
                                >
                                  <File size={17} className="text-[#24A0ED]" />
                                  Export as Word
                                </button>
                              </div>
                            </PopoverPanel>
                          </Transition>
                        </Popover>
                      </div>
                    </div>
                  )}
                  
                  {isLast &&
                    message.suggestions &&
                    message.suggestions.length > 0 &&
                    message.role === 'assistant' &&
                    !loading && (
                      <>
                        <div className="h-px w-full bg-light-secondary dark:bg-dark-secondary" />
                        <div className="flex flex-col space-y-3 text-black dark:text-white">
                          <div className="flex flex-row items-center space-x-2 mt-4">
                            <Layers3 />
                            <h3 className="text-xl font-medium">Related</h3>
                          </div>
                          <div className="flex flex-col space-y-3">
                            {message.suggestions.map((suggestion, i) => (
                              <div
                                className="flex flex-col space-y-3 text-sm"
                                key={i}
                              >
                                <div className="h-px w-full bg-light-secondary dark:bg-dark-secondary" />
                                <div
                                  onClick={() => {
                                    sendMessage(suggestion);
                                  }}
                                  className="cursor-pointer flex flex-row justify-between font-medium space-x-2 items-center"
                                >
                                  <p className="transition duration-200 hover:text-[#24A0ED]">
                                    {suggestion}
                                  </p>
                                  <Plus
                                    size={20}
                                    className="text-[#24A0ED] flex-shrink-0"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                </div>
              </div>
            )}

            {activeTab === 'images' && (
              <div className="w-full">
                <SearchImages
                  query={history[messageIndex - 1]?.content || ''}
                  chatHistory={history.slice(0, messageIndex - 1)}
                  messageId={message.messageId}
                  autoLoad={true}
                />
              </div>
            )}

            {activeTab === 'videos' && (
              <div className="w-full">
                <SearchVideos
                  chatHistory={history.slice(0, messageIndex - 1)}
                  query={history[messageIndex - 1]?.content || ''}
                  messageId={message.messageId}
                  autoLoad={true}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sources Sidebar */}
      <SourcesSidebar
        sources={sidebarSources}
        isOpen={showSourcesSidebar}
        onClose={handleCloseSidebar}
        messageIndex={sidebarMessageIndex}
      />
    </div>
  );
};

export default MessageBox;
