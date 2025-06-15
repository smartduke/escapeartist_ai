import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from '@headlessui/react';
import { Paperclip, File, LoaderCircle, Plus, Trash2, X } from 'lucide-react';
import { Fragment, useRef, useState } from 'react';
import { File as FileType } from '../ChatWindow';

const Attach = ({
  fileIds,
  setFileIds,
  showText,
  files,
  setFiles,
}: {
  fileIds: string[];
  setFileIds: (fileIds: string[]) => void;
  showText?: boolean;
  files: FileType[];
  setFiles: (files: FileType[]) => void;
}) => {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<any>();

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoading(true);
    const data = new FormData();

    for (let i = 0; i < e.target.files!.length; i++) {
      data.append('files', e.target.files![i]);
    }

    const embeddingModelProvider = localStorage.getItem(
      'embeddingModelProvider',
    );
    const embeddingModel = localStorage.getItem('embeddingModel');

    data.append('embedding_model_provider', embeddingModelProvider!);
    data.append('embedding_model', embeddingModel!);

    const res = await fetch(`/api/uploads`, {
      method: 'POST',
      body: data,
    });

    const resData = await res.json();

    setFiles([...files, ...resData.files]);
    setFileIds([...fileIds, ...resData.files.map((file: any) => file.fileId)]);
    setLoading(false);
  };

  return loading ? (
    <div className="flex items-center justify-center w-9 h-9 rounded-xl">
      <LoaderCircle size={16} className="text-blue-600 dark:text-blue-400 animate-spin" />
    </div>
  ) : files.length > 0 ? (
    <Popover className="relative">
      <PopoverButton
        type="button"
        className="group relative flex items-center justify-center w-9 h-9 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all duration-200"
        title={files.length > 1 ? `${files.length} files attached` : files[0]?.fileName}
      >
        <div className="text-blue-600 dark:text-blue-400">
            <File size={16} className="stroke-[1.5]" />
        </div>
        
        {/* File count indicator */}
        {files.length > 1 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {files.length}
          </div>
        )}
      </PopoverButton>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-2"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-2"
      >
        <PopoverPanel className="absolute z-10 w-64 md:w-[350px] right-0 mt-2">
          <div className="bg-light-primary dark:bg-dark-primary border rounded-lg border-black/5 dark:border-white/5 shadow-lg shadow-black/5 dark:shadow-white/5 w-full overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-black/5 dark:border-white/5">
              <h4 className="text-black dark:text-white text-sm font-medium">
                Attached files
              </h4>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="group flex items-center gap-1.5 text-black/50 dark:text-white/50 hover:text-black hover:dark:text-white transition-colors"
                >
                  <input
                    type="file"
                    onChange={handleChange}
                    ref={fileInputRef}
                    accept=".pdf,.docx,.txt"
                    multiple
                    hidden
                  />
                  <Plus size={16} className="stroke-[1.5]" />
                  <span className="text-xs">Add</span>
                </button>
                <button
                  onClick={() => {
                    setFiles([]);
                    setFileIds([]);
                  }}
                  className="group flex items-center gap-1.5 text-black/50 dark:text-white/50 hover:text-black hover:dark:text-white transition-colors"
                >
                  <Trash2 size={14} className="stroke-[1.5]" />
                  <span className="text-xs">Clear</span>
                </button>
              </div>
            </div>
            <div className="divide-y divide-black/5 dark:divide-white/5">
              {files.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 group"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded bg-black/5 dark:bg-white/5">
                    <File size={14} className="text-black/70 dark:text-white/70" />
                  </div>
                  <p className="flex-1 text-black/70 dark:text-white/70 text-sm truncate">
                    {file.fileName}
                  </p>
                  <button
                    onClick={() => {
                      setFiles(files.filter((_, index) => index !== i));
                      setFileIds(fileIds.filter((_, index) => index !== i));
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-all"
                  >
                    <X size={14} className="text-black/50 dark:text-white/50" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </PopoverPanel>
      </Transition>
    </Popover>
  ) : (
    <button
      type="button"
      onClick={() => fileInputRef.current.click()}
      className="group relative flex items-center justify-center w-9 h-9 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all duration-200"
      title="Attach files"
    >
      <input
        type="file"
        onChange={handleChange}
        ref={fileInputRef}
        accept=".pdf,.docx,.txt"
        multiple
        hidden
      />
      <div className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
      <Paperclip size={16} className="stroke-[1.5]" />
      </div>
    </button>
  );
};

export default Attach;
