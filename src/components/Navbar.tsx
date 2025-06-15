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

const exportAsPDF = (messages: Message[], title: string) => {
  const doc = new jsPDF();
  const date = new Date(messages[0]?.createdAt || Date.now()).toLocaleString();
  let y = 15;
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(18);
  doc.text(`Chat Export: ${title}`, 10, y);
  y += 8;
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Exported on: ${date}`, 10, y);
  y += 8;
  doc.setDrawColor(200);
  doc.line(10, y, 200, y);
  y += 6;
  doc.setTextColor(30);
  messages.forEach((msg, idx) => {
    if (y > pageHeight - 30) {
      doc.addPage();
      y = 15;
    }
    doc.setFont('helvetica', 'bold');
    doc.text(`${msg.role === 'user' ? 'User' : 'Assistant'}`, 10, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`${new Date(msg.createdAt).toLocaleString()}`, 40, y);
    y += 6;
    doc.setTextColor(30);
    doc.setFontSize(12);
    const lines = doc.splitTextToSize(msg.content, 180);
    for (let i = 0; i < lines.length; i++) {
      if (y > pageHeight - 20) {
        doc.addPage();
        y = 15;
      }
      doc.text(lines[i], 12, y);
      y += 6;
    }
    if (msg.sources && msg.sources.length > 0) {
      doc.setFontSize(11);
      doc.setTextColor(80);
      if (y > pageHeight - 20) {
        doc.addPage();
        y = 15;
      }
      doc.text('Citations:', 12, y);
      y += 5;
      msg.sources.forEach((src: any, i: number) => {
        const url = src.metadata?.url || '';
        if (y > pageHeight - 15) {
          doc.addPage();
          y = 15;
        }
        doc.text(`- [${i + 1}] ${url}`, 15, y);
        y += 5;
      });
      doc.setTextColor(30);
    }
    y += 6;
    doc.setDrawColor(230);
    if (y > pageHeight - 10) {
      doc.addPage();
      y = 15;
    }
    doc.line(10, y, 200, y);
    y += 4;
  });
  doc.save(`${title || 'chat'}.pdf`);
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
  const [timeAgo, setTimeAgo] = useState<string>('');
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
    router.push(url);
  };

  useEffect(() => {
    if (messages.length > 0) {
      const newTitle =
        messages[0].content.length > 20
          ? `${messages[0].content.substring(0, 20).trim()}...`
          : messages[0].content;
      setTitle(newTitle);
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
        
        {/* Separator */}
        <div className="w-px h-4 bg-light-200 dark:bg-dark-200" />
        
        {/* Time */}
        <div className="flex items-center gap-2">
          <Clock size={17} />
          <p className="text-xs">{timeAgo} ago</p>
        </div>
      </div>
      <p className="hidden lg:flex">{title}</p>

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
