'use client';

import { useState, useEffect } from 'react';
import { Download, FileText, Calendar, Cpu, Hash, Eye } from 'lucide-react';

interface BlogExport {
  id: number;
  chatId: string;
  messageId: string;
  title: string;
  fileName: string;
  modelUsed: string;
  wordCount: number;
  createdAt: string;
}

interface BlogExportsPanelProps {
  chatId?: string;
  userId?: string;
  guestId?: string;
}

const downloadFile = (filename: string, content: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const BlogExportsPanel = ({ chatId, userId, guestId }: BlogExportsPanelProps) => {
  const [exports, setExports] = useState<BlogExport[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<number | null>(null);

  const fetchExports = async () => {
    if (!chatId && !userId && !guestId) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (chatId) params.append('chatId', chatId);
      if (userId) params.append('userId', userId);
      if (guestId) params.append('guestId', guestId);

      const response = await fetch(`/api/blog-exports?${params}`);
      const data = await response.json();

      if (data.success) {
        setExports(data.exports);
      }
    } catch (error) {
      console.error('Failed to fetch blog exports:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadExport = async (exportId: number, fileName: string) => {
    setDownloading(exportId);
    try {
      const response = await fetch('/api/blog-exports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exportId })
      });

      const data = await response.json();

      if (data.success) {
        downloadFile(fileName, data.export.htmlContent, 'text/html');
        
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
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        successToast.innerHTML = `
          <div style="display: flex; align-items: center; gap: 12px;">
            <span>✅ Blog export downloaded successfully!</span>
          </div>
        `;
        document.body.appendChild(successToast);
        setTimeout(() => {
          if (document.body.contains(successToast)) {
            document.body.removeChild(successToast);
          }
        }, 3000);
      }
    } catch (error) {
      console.error('Failed to download export:', error);
    } finally {
      setDownloading(null);
    }
  };

  useEffect(() => {
    fetchExports();
  }, [chatId, userId, guestId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatWordCount = (count: number) => {
    return count.toLocaleString();
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Blog Exports</h3>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (exports.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Blog Exports</h3>
        </div>
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No blog exports yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Export an AI response as a blog post to see it here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Blog Exports</h3>
          <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full">
            {exports.length}
          </span>
        </div>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {exports.map((export_) => (
          <div
            key={export_.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate mb-2">
                  {export_.title}
                </h4>
                
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(export_.createdAt)}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    <span>{formatWordCount(export_.wordCount)} words</span>
                  </div>
                  
                  {export_.modelUsed && (
                    <div className="flex items-center gap-1">
                      <Cpu className="w-3 h-3" />
                      <span className="truncate max-w-24">{export_.modelUsed}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-3">
                <button
                  onClick={() => downloadExport(export_.id, export_.fileName)}
                  disabled={downloading === export_.id}
                  className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Download Blog Export"
                >
                  {downloading === export_.id ? (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Blog exports are automatically saved when you generate them from AI responses
        </p>
      </div>
    </div>
  );
};

export default BlogExportsPanel; 