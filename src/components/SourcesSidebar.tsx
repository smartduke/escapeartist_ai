'use client';

import { Document } from '@langchain/core/documents';
import { X, ExternalLink, File, BookOpen } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface SourcesSidebarProps {
  sources: Document[];
  isOpen: boolean;
  onClose: () => void;
  messageIndex: number;
}

const SourcesSidebar = ({ sources, isOpen, onClose, messageIndex }: SourcesSidebarProps) => {
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen || sources.length === 0) return null;

  return (
    <div 
      ref={sidebarRef}
      className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-dark-primary border-l border-light-200 dark:border-dark-200 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-light-200 dark:border-dark-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <BookOpen size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-black dark:text-white">Sources</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {sources.length} reference{sources.length !== 1 ? 's' : ''} found
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-light-100 dark:hover:bg-dark-100 rounded-lg transition-colors"
        >
          <X size={20} className="text-gray-500 dark:text-gray-400" />
        </button>
      </div>

            {/* Content */}
      <div className="h-full overflow-y-auto pb-20">
        <div className="p-6 space-y-3">
          {sources.map((source, i) => (
            <a
              key={i}
              href={source.metadata.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block group p-4 bg-white dark:bg-dark-secondary hover:bg-light-50 dark:hover:bg-dark-100 border border-light-200 dark:border-dark-200 rounded-xl transition-all duration-200 cursor-pointer hover:border-blue-300 dark:hover:border-blue-600"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {source.metadata.url === 'File' ? (
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <File size={16} className="text-gray-600 dark:text-gray-300" />
                    </div>
                  ) : (
                    <img
                      src={`https://s2.googleusercontent.com/s2/favicons?domain_url=${source.metadata.url}`}
                      width={20}
                      height={20}
                      alt="favicon"
                      className="rounded"
                    />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-black dark:text-white text-sm leading-relaxed line-clamp-2">
                      {source.metadata.title}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                      <div className="w-1 h-1 bg-current rounded-full" />
                      <span>{i + 1}</span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                    {source.metadata.url.replace(/.+\/\/|www.|\..+/g, '')}
                  </p>
                  
                  {source.pageContent && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 line-clamp-2 leading-relaxed">
                      {source.pageContent.slice(0, 120)}...
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-end mt-3 pt-3 border-t border-light-100 dark:border-dark-300">
                <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 font-medium">
                  <ExternalLink size={12} />
                  Open
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SourcesSidebar; 