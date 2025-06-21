/* eslint-disable @next/next/no-img-element */
import { Document } from '@langchain/core/documents';
import { File, ChevronRight } from 'lucide-react';

interface MessageSourcesProps {
  sources: Document[];
  onViewSources?: (sources: Document[], messageIndex: number) => void;
  messageIndex: number;
}

const MessageSources = ({ sources, onViewSources, messageIndex }: MessageSourcesProps) => {

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5">
      {sources.slice(0, 3).map((source, i) => (
        <a
          className="group bg-white dark:bg-dark-secondary hover:bg-light-50 dark:hover:bg-dark-100 border border-light-200 dark:border-dark-200 transition-all duration-200 rounded-lg p-2 flex flex-col space-y-1"
          key={i}
          href={source.metadata.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className="flex items-start gap-2">
            {source.metadata.url === 'File' ? (
              <div className="p-1 bg-gray-100 dark:bg-gray-700 rounded flex-shrink-0">
                <File size={12} className="text-gray-600 dark:text-gray-300" />
              </div>
            ) : (
              <img
                src={`https://s2.googleusercontent.com/s2/favicons?domain_url=${source.metadata.url}`}
                width={14}
                height={14}
                alt="favicon"
                className="rounded mt-0.5 flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-black dark:text-white line-clamp-2 leading-tight">
                {source.metadata.title}
              </p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1">
                  {source.metadata.url.replace(/.+\/\/|www.|\..+/g, '')}
                </p>
                <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 ml-1">
                  <div className="w-1 h-1 bg-current rounded-full" />
                  <span>{i + 1}</span>
                </div>
              </div>
            </div>
          </div>
        </a>
      ))}
      
      {/* View all sources card */}
      <button
        onClick={() => onViewSources?.(sources, messageIndex)}
        className="group bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-2 flex flex-col justify-center items-center transition-all duration-200"
      >
        <div className="p-1 bg-blue-100 dark:bg-blue-800 rounded-lg mb-1">
          <ChevronRight size={12} className="text-blue-600 dark:text-blue-300 group-hover:translate-x-0.5 transition-transform duration-200" />
        </div>
        <p className="text-xs font-medium text-blue-700 dark:text-blue-300 text-center">
          View all {sources.length}
        </p>
        <p className="text-xs text-blue-600 dark:text-blue-400 text-center">
          sources
        </p>
      </button>
    </div>
  );
};

export default MessageSources;
