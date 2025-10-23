import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered, X } from 'lucide-react';

interface NotesEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotesEditor = ({ isOpen, onClose }: NotesEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Write your notes here...',
      }),
    ],
    content: localStorage.getItem('userNotes') || '',
    onUpdate: ({ editor }) => {
      localStorage.setItem('userNotes', editor.getHTML());
    },
  });

  if (!isOpen) return null;

  const MenuButton = ({ onClick, children, isActive = false }: { onClick: () => void; children: React.ReactNode; isActive?: boolean }) => (
    <button
      onClick={onClick}
      className={`p-2 rounded hover:bg-[#2D3139] transition-colors duration-200 ${
        isActive ? 'bg-[#2D3139] text-rose-500' : 'text-white'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="w-[800px] h-[80vh] flex flex-col bg-[#181b21] bg-opacity-70 backdrop-blur-md rounded-lg shadow-xl border border-[#2D3139]">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-[#2D3139]">
          <h2 className="text-lg font-semibold text-white">Notes</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors duration-200"
          >
            <X size={16} />
          </button>
        </div>
        {/* Toolbar */}
        <div className="p-2 border-b border-[#2D3139] flex gap-2">
          <MenuButton
            onClick={() => editor?.chain().focus().toggleBold().run()}
            isActive={editor?.isActive('bold')}
          >
            <Bold size={18} />
          </MenuButton>
          <MenuButton
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            isActive={editor?.isActive('italic')}
          >
            <Italic size={18} />
          </MenuButton>
          <MenuButton
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            isActive={editor?.isActive('bulletList')}
          >
            <List size={18} />
          </MenuButton>
          <MenuButton
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            isActive={editor?.isActive('orderedList')}
          >
            <ListOrdered size={18} />
          </MenuButton>
        </div>
        {/* Editor area */}
        <div className="flex-1 overflow-y-auto p-4">
          <EditorContent
            editor={editor}
            className="prose prose-invert max-w-none focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};

export default NotesEditor;
