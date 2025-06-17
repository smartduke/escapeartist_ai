import { Edit3, Save, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import TextareaAutosize from 'react-textarea-autosize';

const Edit = ({
  messageId,
  initialContent,
  onUpdate,
}: {
  messageId: string;
  initialContent: string;
  onUpdate: (messageId: string, newContent: string) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(initialContent);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (editedContent.trim() === initialContent.trim()) {
      setIsEditing(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: editedContent.trim() }),
      });

      if (!res.ok) {
        throw new Error('Failed to update message');
      }

      onUpdate(messageId, editedContent.trim());
      setIsEditing(false);
      toast.success('Message updated successfully');
    } catch (error) {
      console.error('Error updating message:', error);
      toast.error('Failed to update message');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedContent(initialContent);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="w-full space-y-3">
        <TextareaAutosize
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          className="w-full p-3 bg-light-secondary dark:bg-dark-secondary border border-light-200 dark:border-dark-200 rounded-lg text-black dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          minRows={3}
          placeholder="Edit your message..."
          autoFocus
        />
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={loading || !editedContent.trim()}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Save size={14} />
            {loading ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <X size={14} />
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="p-2 text-black/70 dark:text-white/70 rounded-xl hover:bg-light-secondary dark:hover:bg-dark-secondary transition duration-200 hover:text-black dark:hover:text-white"
      title="Edit message"
    >
      <Edit3 size={18} />
    </button>
  );
};

export default Edit; 