'use client';

/* eslint-disable @next/next/no-img-element */
import React, { MutableRefObject, useEffect, useState, useRef } from 'react';
import { Message } from './ChatWindow';
import { useAuth } from './auth/AuthProvider';
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
  PenTool,
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
    doc.text('Infoxai', margin, y);
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
    doc.text('Generated by Infoxai • Advanced AI Search Engine', margin, y);

    const filename = message.content.substring(0, 40).replace(/[^a-zA-Z0-9\s]/g, '').trim() || 'message';
    doc.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Failed to export PDF:', error);
  }
};

const convertMarkdownToHtml = (markdown: string): string => {
  if (!markdown) return '';
  
  let html = markdown;
  
  // Remove think tags
  html = html.replace(/<think>[\s\S]*?<\/think>/g, '');
  
  // Split into lines for better processing
  let lines = html.split('\n');
  let processedLines: string[] = [];
  let inCodeBlock = false;
  let inList = false;
  let currentListItems: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmedLine = line.trim();
    
    // Handle code blocks
    if (trimmedLine.startsWith('```')) {
      if (inCodeBlock) {
        processedLines.push('</code></pre>');
        inCodeBlock = false;
      } else {
        processedLines.push('<pre><code>');
        inCodeBlock = true;
      }
      continue;
    }
    
    if (inCodeBlock) {
      processedLines.push(line);
      continue;
    }
    
    // Handle headers (order matters - longest first)
    if (trimmedLine.match(/^#{1,6}\s/)) {
      // Close any open lists
      if (inList && currentListItems.length > 0) {
        processedLines.push('<ul>');
        processedLines.push(...currentListItems);
        processedLines.push('</ul>');
        currentListItems = [];
        inList = false;
      }
      
      const headerMatch = trimmedLine.match(/^(#{1,6})\s(.+)$/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const text = headerMatch[2];
        processedLines.push(`<h${level}>${text}</h${level}>`);
        continue;
      }
    }
    
    // Handle unordered lists
    if (trimmedLine.match(/^[\*\-\+]\s/)) {
      const listItem = trimmedLine.replace(/^[\*\-\+]\s/, '');
      currentListItems.push(`<li>${listItem}</li>`);
      inList = true;
      continue;
    }
    
    // Handle ordered lists
    if (trimmedLine.match(/^\d+\.\s/)) {
      const listItem = trimmedLine.replace(/^\d+\.\s/, '');
      currentListItems.push(`<li>${listItem}</li>`);
      inList = true;
      continue;
    }
    
    // Close list if we're not in a list item anymore
    if (inList && !trimmedLine.match(/^[\*\-\+\d+\.]\s/) && trimmedLine !== '') {
      processedLines.push('<ul>');
      processedLines.push(...currentListItems);
      processedLines.push('</ul>');
      currentListItems = [];
      inList = false;
    }
    
    // Handle empty lines
    if (trimmedLine === '') {
      processedLines.push('');
      continue;
    }
    
    // Convert inline formatting
    line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    line = line.replace(/(?<!\*)\*([^\*]+)\*(?!\*)/g, '<em>$1</em>');
    line = line.replace(/`([^`]+)`/g, '<code>$1</code>');
    line = line.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Remove citation numbers
    line = line.replace(/\[\d+\]/g, '');
    
    // Wrap in paragraph if it's regular text
    if (trimmedLine && !trimmedLine.match(/^<[h1-6]>/)) {
      processedLines.push(`<p>${line.trim()}</p>`);
    } else {
      processedLines.push(line);
    }
  }
  
  // Close any remaining list
  if (inList && currentListItems.length > 0) {
    processedLines.push('<ul>');
    processedLines.push(...currentListItems);
    processedLines.push('</ul>');
  }
  
  html = processedLines.join('\n');
  
  // Clean up extra whitespace and empty paragraphs
  html = html.replace(/\n\s*\n/g, '\n');
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p>\s*<\/p>/g, '');
  
  return html.trim();
};

const exportMessageAsBlogPost = async (message: Message, userMessage?: Message, currentChatModel?: any, user?: any, guestId?: string) => {
  try {
    // Show loading state
    const loadingToast = document.createElement('div');
    loadingToast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #1f2937;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      z-index: 1000;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    `;
    loadingToast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="width: 20px; height: 20px; border: 2px solid #3b82f6; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <span>Generating SEO-optimized blog post...</span>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
    document.body.appendChild(loadingToast);

    const response = await fetch('/api/blog-export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
              body: JSON.stringify({
          content: message.content,
          userQuestion: userMessage?.content,
          chatModel: currentChatModel,
          sources: message.sources || [],
          chatId: message.chatId,
          messageId: message.messageId,
          userId: user?.id,
          guestId: !user ? guestId : undefined,
        }),
    });

    // Remove loading toast
    document.body.removeChild(loadingToast);

    // Handle usage limit errors
    if (response.status === 429) {
      try {
        const errorData = await response.json();
        if (errorData.details?.feature === 'Blog Export') {
          alert(`Usage Limit Exceeded: ${errorData.details.message}\n\nConsider upgrading to Pro for higher limits.`);
        } else {
          alert(errorData.details?.message || 'Blog export temporarily unavailable. Please try again later.');
        }
        return;
      } catch (parseError) {
        alert('Blog export temporarily unavailable. Please try again later.');
        return;
      }
    }

    if (!response.ok) {
      throw new Error('Failed to generate blog post');
    }

    const result = await response.json();
    const blogData = result.data;
    
    console.log('✅ Blog export generated using model:', blogData.modelUsed);
    
    // Dispatch custom event to notify that a new blog export was created
    window.dispatchEvent(new CustomEvent('blogExportCreated'));

    // Create comprehensive HTML blog post
    const blogHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${blogData.title}</title>
  <meta name="description" content="${blogData.metaDescription}">
  <meta name="keywords" content="${[blogData.keywords?.focus || '', ...(blogData.keywords?.related || []), ...(blogData.keywords?.longTail || []), ...(blogData.keywords?.lsi || [])].filter(k => k).join(', ')}">
  
  <!-- Open Graph Meta Tags -->
  <meta property="og:title" content="${blogData.title}">
  <meta property="og:description" content="${blogData.metaDescription}">
  <meta property="og:type" content="article">
  
  <!-- Twitter Card Meta Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${blogData.title}">
  <meta name="twitter:description" content="${blogData.metaDescription}">
  
  <!-- Schema.org JSON-LD -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": "${blogData.title}",
    "description": "${blogData.metaDescription}",
    "author": {
      "@type": "Organization",
      "name": "Infoxai"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Infoxai"
    },
    "datePublished": "${new Date().toISOString()}",
    "dateModified": "${new Date().toISOString()}"
  }
  </script>
  

  
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      color: #333;
    }
    h1, h2, h3, h4, h5, h6 {
      color: #2c3e50;
      margin-top: 2em;
      margin-bottom: 0.5em;
    }
         h1 { font-size: 2.5em; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
     h2 { font-size: 2em; color: #34495e; }
     h3 { font-size: 1.5em; }
     h4 { font-size: 1.25em; color: #2c3e50; }
     h5 { font-size: 1.1em; color: #2c3e50; }
     h6 { font-size: 1em; color: #2c3e50; font-weight: 600; }
         .meta-info {
       background: #f8f9fa;
       padding: 30px;
       border-radius: 12px;
       margin: 30px 0;
       border-left: 4px solid #3498db;
       box-shadow: 0 4px 6px rgba(0,0,0,0.1);
     }
     .seo-section, .yoast-analysis, .keywords-section, .content-structure {
       background: white;
       padding: 20px;
       border-radius: 8px;
       margin: 20px 0;
       border: 1px solid #e1e8ed;
     }
     .analysis-grid {
       display: grid;
       grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
       gap: 15px;
       margin: 15px 0;
     }
     .metric {
       display: flex;
       justify-content: space-between;
       align-items: center;
       padding: 12px 15px;
       border-radius: 6px;
       border-left: 4px solid #ddd;
     }
     .metric.good {
       background: #d4edda;
       border-left-color: #28a745;
       color: #155724;
     }
     .metric.warning {
       background: #fff3cd;
       border-left-color: #ffc107;
       color: #856404;
     }
     .metric.error {
       background: #f8d7da;
       border-left-color: #dc3545;
       color: #721c24;
     }
     .metric .label {
       font-weight: 600;
       font-size: 0.9em;
     }
     .metric .value {
       font-weight: bold;
       font-size: 0.95em;
     }
     .keyword-categories {
       display: flex;
       flex-direction: column;
       gap: 15px;
     }
     .keyword-group {
       display: flex;
       flex-wrap: wrap;
       align-items: center;
       gap: 8px;
       margin: 10px 0;
     }
     .keyword {
       padding: 6px 12px;
       border-radius: 20px;
       font-size: 0.85em;
       font-weight: 500;
       white-space: nowrap;
     }
     .keyword.focus {
       background: #e3f2fd;
       color: #1976d2;
       border: 2px solid #1976d2;
     }
     .keyword.related {
       background: #e8f5e8;
       color: #2e7d32;
     }
     .keyword.longtail {
       background: #fff3e0;
       color: #f57c00;
     }
     .keyword.lsi {
       background: #f3e5f5;
       color: #7b1fa2;
     }
     .focus-keyword {
       background: linear-gradient(45deg, #1976d2, #42a5f5);
       color: white;
       padding: 4px 12px;
       border-radius: 20px;
       font-weight: bold;
       font-size: 0.9em;
     }
     .structure-grid {
       display: grid;
       grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
       gap: 15px;
       margin: 15px 0;
     }
     .structure-item {
       display: flex;
       justify-content: space-between;
       align-items: center;
       padding: 10px 15px;
       background: #f8f9fa;
       border-radius: 6px;
     }
     .structure-item .label {
       font-weight: 600;
       color: #495057;
     }
     .structure-item .value {
       font-weight: bold;
       color: #212529;
     }
     .structure-item .value.good {
       color: #28a745;
     }
     .structure-item .value.warning {
       color: #ffc107;
     }
     table {
       width: 100%;
       border-collapse: collapse;
       margin: 20px 0;
       font-size: 0.9em;
     }
     table th, table td {
       border: 1px solid #ddd;
       padding: 12px;
       text-align: left;
     }
     table th {
       background-color: #f8f9fa;
       font-weight: bold;
       color: #495057;
     }
     table tr:nth-child(even) {
       background-color: #f8f9fa;
     }
     table tr:hover {
       background-color: #e9ecef;
     }
     blockquote {
       border-left: 4px solid #007bff;
       margin: 20px 0;
       padding: 15px 20px;
       background-color: #f8f9fa;
       font-style: italic;
       color: #495057;
     }
     .highlight {
       background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
       color: white;
       padding: 20px;
       border-radius: 8px;
       margin: 20px 0;
       box-shadow: 0 4px 6px rgba(0,0,0,0.1);
     }
     ul li, ol li {
       margin-bottom: 8px;
       line-height: 1.6;
     }
     ul li strong, ol li strong {
       color: #2c3e50;
     }

    .references-section {
      background: #f0f9ff;
      padding: 30px;
      border-radius: 12px;
      margin: 40px 0;
      border-left: 4px solid #0ea5e9;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .references-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
      margin-top: 20px;
    }
    .reference-item {
      display: flex;
      align-items: flex-start;
      gap: 15px;
      padding: 15px;
      background: white;
      border-radius: 8px;
      border: 1px solid #e0f2fe;
    }
    .reference-number {
      background: #0ea5e9;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 0.85em;
      flex-shrink: 0;
    }
    .reference-details {
      flex: 1;
    }
    .reference-title {
      color: #0c4a6e;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.95em;
      line-height: 1.4;
      display: block;
      margin-bottom: 4px;
    }
    .reference-title:hover {
      color: #0ea5e9;
      text-decoration: underline;
    }
    .reference-domain {
      font-size: 0.8em;
      color: #64748b;
      font-style: italic;
    }
         .internal-links, .external-links, .image-requirements {
       background: #fff3cd;
       padding: 20px;
       border-radius: 8px;
       margin: 20px 0;
       border-left: 4px solid #ffc107;
     }
     .external-links {
       background: #e2f3ff;
       border-left-color: #2196f3;
     }
     .image-requirements {
       background: #f0f4f8;
       border-left-color: #607d8b;
     }
    .seo-recommendations {
      background: #d1ecf1;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #17a2b8;
    }
    .generated-by {
      text-align: center;
      margin-top: 50px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      color: #6c757d;
    }
  </style>
</head>
<body>
  <article>
    <h1>${blogData.title}</h1>
    


    <div class="content">
      ${blogData.content && blogData.content.includes('<') ? blogData.content : convertMarkdownToHtml(blogData.content)}
    </div>

    ${blogData.references && blogData.references.length > 0 ? `
    <div class="references-section">
      <h2>📚 References</h2>
      <div class="references-list">
        ${blogData.references.map((ref: any) => `
          <div class="reference-item">
            <span class="reference-number">[${ref.id}]</span>
            <div class="reference-details">
              <a href="${ref.url}" target="_blank" rel="noopener noreferrer" class="reference-title">${ref.title}</a>
              <div class="reference-domain">${ref.domain}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <div class="meta-info">
      <h2>📊 SEO Analysis & Meta Information</h2>
      
      <div class="seo-section">
        <h3>🎯 Focus Keyword & SEO Settings</h3>
        <p><strong>Focus Keyword:</strong> <span class="focus-keyword">${blogData.focusKeyword}</span></p>
        <p><strong>Meta Description:</strong> ${blogData.metaDescription}</p>
        <p><strong>URL Slug:</strong> /${blogData.urlSlug}</p>
      </div>

      <div class="yoast-analysis">
        <h3>🟢 SEO Score</h3>
        <div class="analysis-grid">
          <div class="metric ${blogData.yoastAnalysis?.titleLength >= 50 && blogData.yoastAnalysis?.titleLength <= 60 ? 'good' : 'warning'}">
            <span class="label">Title Length:</span>
            <span class="value">${blogData.yoastAnalysis?.titleLength || 0} chars</span>
          </div>
          <div class="metric ${blogData.yoastAnalysis?.metaLength >= 150 && blogData.yoastAnalysis?.metaLength <= 160 ? 'good' : 'warning'}">
            <span class="label">Meta Length:</span>
            <span class="value">${blogData.yoastAnalysis?.metaLength || 0} chars</span>
          </div>
          <div class="metric ${blogData.yoastAnalysis?.keywordInTitle ? 'good' : 'error'}">
            <span class="label">Keyword in Title:</span>
            <span class="value">${blogData.yoastAnalysis?.keywordInTitle ? '✅ Yes' : '❌ No'}</span>
          </div>
          <div class="metric ${blogData.yoastAnalysis?.keywordInMeta ? 'good' : 'error'}">
            <span class="label">Keyword in Meta:</span>
            <span class="value">${blogData.yoastAnalysis?.keywordInMeta ? '✅ Yes' : '❌ No'}</span>
          </div>
          <div class="metric ${blogData.yoastAnalysis?.keywordInFirstParagraph ? 'good' : 'error'}">
            <span class="label">Keyword in First 100 words:</span>
            <span class="value">${blogData.yoastAnalysis?.keywordInFirstParagraph ? '✅ Yes' : '❌ No'}</span>
          </div>
          <div class="metric ${parseFloat(blogData.yoastAnalysis?.keywordDensity || '0') >= 0.5 && parseFloat(blogData.yoastAnalysis?.keywordDensity || '0') <= 2.5 ? 'good' : 'warning'}">
            <span class="label">Keyword Density:</span>
            <span class="value">${blogData.yoastAnalysis?.keywordDensity || '0%'}</span>
          </div>
          <div class="metric ${(blogData.yoastAnalysis?.readabilityScore || 0) >= 60 ? 'good' : 'warning'}">
            <span class="label">Readability Score:</span>
            <span class="value">${blogData.yoastAnalysis?.readabilityScore || 0}</span>
          </div>
          <div class="metric ${blogData.yoastAnalysis?.sentenceLength === 'Good' ? 'good' : 'warning'}">
            <span class="label">Sentence Length:</span>
            <span class="value">${blogData.yoastAnalysis?.sentenceLength || 'Unknown'}</span>
          </div>
          <div class="metric ${parseFloat(blogData.yoastAnalysis?.passiveVoice || '100') < 10 ? 'good' : 'warning'}">
            <span class="label">Passive Voice:</span>
            <span class="value">${blogData.yoastAnalysis?.passiveVoice || '0%'}</span>
          </div>
          <div class="metric ${parseFloat(blogData.yoastAnalysis?.transitionWords || '0') >= 30 ? 'good' : 'warning'}">
            <span class="label">Transition Words:</span>
            <span class="value">${blogData.yoastAnalysis?.transitionWords || '0%'}</span>
          </div>
        </div>
      </div>

      <div class="keywords-section">
        <h3>🔑 Keyword Strategy</h3>
        <div class="keyword-categories">
          <div class="keyword-group">
            <strong>Focus Keyword:</strong>
            <span class="keyword focus">${blogData.keywords?.focus || blogData.focusKeyword}</span>
          </div>
          ${blogData.keywords?.related ? `
          <div class="keyword-group">
            <strong>Related Keywords:</strong>
            ${blogData.keywords.related.map((keyword: string) => `<span class="keyword related">${keyword}</span>`).join('')}
          </div>
          ` : ''}
          ${blogData.keywords?.longTail ? `
          <div class="keyword-group">
            <strong>Long-tail Keywords:</strong>
            ${blogData.keywords.longTail.map((keyword: string) => `<span class="keyword longtail">${keyword}</span>`).join('')}
          </div>
          ` : ''}
          ${blogData.keywords?.lsi ? `
          <div class="keyword-group">
            <strong>LSI Keywords:</strong>
            ${blogData.keywords.lsi.map((keyword: string) => `<span class="keyword lsi">${keyword}</span>`).join('')}
          </div>
          ` : ''}
        </div>
      </div>

      <div class="content-structure">
        <h3>📋 Content Structure Analysis</h3>
        <div class="structure-grid">
          <div class="structure-item">
            <span class="label">Word Count:</span>
            <span class="value ${(blogData.contentStructure?.wordCount || 0) >= 800 ? 'good' : 'warning'}">${blogData.contentStructure?.wordCount || 0} words</span>
          </div>
          <div class="structure-item">
            <span class="label">Headings:</span>
            <span class="value">H1: ${blogData.contentStructure?.headings?.h1 || 0}, H2: ${blogData.contentStructure?.headings?.h2 || 0}, H3: ${blogData.contentStructure?.headings?.h3 || 0}</span>
          </div>
          <div class="structure-item">
            <span class="label">Paragraphs:</span>
            <span class="value">${blogData.contentStructure?.paragraphs || 0}</span>
          </div>
          <div class="structure-item">
            <span class="label">Sentences:</span>
            <span class="value">${blogData.contentStructure?.sentences || 0}</span>
          </div>
        </div>
      </div>
    </div>

    ${blogData.internalLinks && blogData.internalLinks.length > 0 ? `
    <div class="internal-links">
      <h3>🔗 Internal Linking Opportunities</h3>
      <ul>
        ${blogData.internalLinks.map((link: any) => `
          <li>
            <strong>Anchor Text:</strong> "${link.anchorText}" 
            <br><strong>Suggested URL:</strong> ${link.suggestedUrl}
            <br><strong>Placement:</strong> ${link.placement || link.context}
          </li>
        `).join('')}
      </ul>
    </div>
    ` : ''}

    ${blogData.externalLinks && blogData.externalLinks.length > 0 ? `
    <div class="external-links">
      <h3>🌐 External Links (Authority Building)</h3>
      <ul>
        ${blogData.externalLinks.map((link: any) => `
          <li>
            <strong>Anchor Text:</strong> "${link.anchorText}" 
            <br><strong>Domain:</strong> ${link.domain}
            <br><strong>Context:</strong> ${link.context}
          </li>
        `).join('')}
      </ul>
    </div>
    ` : ''}

    ${blogData.imageRequirements && blogData.imageRequirements.length > 0 ? `
    <div class="image-requirements">
      <h3>🖼️ Image SEO Requirements</h3>
      <ul>
        ${blogData.imageRequirements.map((img: any) => `
          <li>
            <strong>Alt Text:</strong> "${img.altText}" 
            <br><strong>Placement:</strong> ${img.placement}
            <br><strong>Purpose:</strong> ${img.purpose}
          </li>
        `).join('')}
      </ul>
    </div>
    ` : ''}

    ${blogData.seoRecommendations && blogData.seoRecommendations.length > 0 ? `
    <div class="seo-recommendations">
      <h3>🚀 SEO Recommendations</h3>
      <ul>
        ${blogData.seoRecommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
      </ul>
    </div>
    ` : ''}
  </article>

  <div class="generated-by">
    <p>Generated by <strong>Infoxai</strong> - Advanced AI Search Engine</p>
    <p>Model Used: <strong>${blogData.modelUsed || 'Unknown'}</strong></p>
    <p>Exported on: ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>`;

    // Download the HTML file
    const title = userMessage?.content || message.content;
    const shortContent = title.substring(0, 40).replace(/[^a-zA-Z0-9\s]/g, '').trim() || 'blog-post';
    downloadFile(`${shortContent}-seo-optimized.html`, blogHtml, 'text/html');

    // Show success toast
    const successToast = document.createElement('div');
    successToast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      z-index: 1000;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    `;
    successToast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <span>✅ SEO-optimized blog post generated successfully!</span>
      </div>
      <div style="font-size: 12px; margin-top: 8px; opacity: 0.9;">
        Generated using: ${blogData.modelUsed || 'Unknown'}
      </div>
    `;
    document.body.appendChild(successToast);
    setTimeout(() => {
      document.body.removeChild(successToast);
    }, 3000);

  } catch (error) {
    console.error('Blog export error:', error);
    
    // Show error toast
    const errorToast = document.createElement('div');
    errorToast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ef4444;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      z-index: 1000;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    `;
    errorToast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <span>❌ Failed to generate blog post. Please try again.</span>
      </div>
    `;
    document.body.appendChild(errorToast);
    setTimeout(() => {
      document.body.removeChild(errorToast);
    }, 3000);
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
            text: 'Infoxai Chat Export',
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
            text: 'Generated by Infoxai • Advanced AI Search Engine',
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
  const { user, guestId } = useAuth();
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
                            className="py-2 px-3 text-black/70 dark:text-white/70 rounded-xl hover:bg-light-secondary dark:hover:bg-dark-secondary transition duration-200 hover:text-black dark:hover:text-white flex flex-row items-center space-x-1"
                            title="Edit message"
                          >
                            <Edit3 size={18} />
                            <p className="text-xs font-medium">Edit</p>
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
                                <button
                                  className="flex items-center gap-2 px-4 py-2 text-left hover:bg-light-secondary dark:hover:bg-dark-primary transition-colors text-black dark:text-white rounded-lg font-medium"
                                  onClick={() => exportMessageAsBlogPost(message, message.role === 'assistant' && messageIndex > 0 ? history[messageIndex - 1] : undefined, undefined, user, guestId)}
                                >
                                  <PenTool size={17} className="text-[#24A0ED]" />
                                  Export as Blog Post
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
