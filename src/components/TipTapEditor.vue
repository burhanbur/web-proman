<template>
  <div class="tiptap-editor-wrapper">
    <div v-if="editor" class="tiptap-toolbar">
      <button
        @click="editor.chain().focus().toggleBold().run()"
        :class="{ 'is-active': editor.isActive('bold') }"
        type="button"
        title="Bold"
      >
        <font-awesome-icon icon="bold" />
      </button>
      <button
        @click="editor.chain().focus().toggleItalic().run()"
        :class="{ 'is-active': editor.isActive('italic') }"
        type="button"
        title="Italic"
      >
        <font-awesome-icon icon="italic" />
      </button>
      <button
        @click="editor.chain().focus().toggleUnderline().run()"
        :class="{ 'is-active': editor.isActive('underline') }"
        type="button"
        title="Underline"
      >
        <font-awesome-icon icon="underline" />
      </button>
      <button
        @click="editor.chain().focus().toggleStrike().run()"
        :class="{ 'is-active': editor.isActive('strike') }"
        type="button"
        title="Strikethrough"
      >
        <font-awesome-icon icon="strikethrough" />
      </button>
      
      <span class="toolbar-divider"></span>
      
      <button
        @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
        :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }"
        type="button"
        title="Heading 1"
      >
        H1
      </button>
      <button
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
        :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
        type="button"
        title="Heading 2"
      >
        H2
      </button>
      <button
        @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
        :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }"
        type="button"
        title="Heading 3"
      >
        H3
      </button>
      
      <span class="toolbar-divider"></span>
      
      <button
        @click="editor.chain().focus().toggleBulletList().run()"
        :class="{ 'is-active': editor.isActive('bulletList') }"
        type="button"
        title="Bullet List"
      >
        <font-awesome-icon icon="list-ul" />
      </button>
      <button
        @click="editor.chain().focus().toggleOrderedList().run()"
        :class="{ 'is-active': editor.isActive('orderedList') }"
        type="button"
        title="Ordered List"
      >
        <font-awesome-icon icon="list-ol" />
      </button>
      
      <span class="toolbar-divider"></span>
      
      <button
        @click="editor.chain().focus().toggleBlockquote().run()"
        :class="{ 'is-active': editor.isActive('blockquote') }"
        type="button"
        title="Blockquote"
      >
        <font-awesome-icon icon="quote-right" />
      </button>
      <button
        @click="editor.chain().focus().toggleCodeBlock().run()"
        :class="{ 'is-active': editor.isActive('codeBlock') }"
        type="button"
        title="Code Block"
      >
        <font-awesome-icon icon="code" />
      </button>
      
      <span class="toolbar-divider"></span>
      
      <button
        @click="setLink"
        :class="{ 'is-active': editor.isActive('link') }"
        type="button"
        title="Add Link"
      >
        <font-awesome-icon icon="link" />
      </button>
      
      <span class="toolbar-divider"></span>
      
      <button
        @click="editor.chain().focus().setTextAlign('left').run()"
        :class="{ 'is-active': editor.isActive({ textAlign: 'left' }) }"
        type="button"
        title="Align Left"
      >
        <font-awesome-icon icon="align-left" />
      </button>
      <button
        @click="editor.chain().focus().setTextAlign('center').run()"
        :class="{ 'is-active': editor.isActive({ textAlign: 'center' }) }"
        type="button"
        title="Align Center"
      >
        <font-awesome-icon icon="align-center" />
      </button>
      <button
        @click="editor.chain().focus().setTextAlign('right').run()"
        :class="{ 'is-active': editor.isActive({ textAlign: 'right' }) }"
        type="button"
        title="Align Right"
      >
        <font-awesome-icon icon="align-right" />
      </button>
      
      <span class="toolbar-divider"></span>
      
      <button
        @click="editor.chain().focus().undo().run()"
        :disabled="!editor.can().undo()"
        type="button"
        title="Undo"
      >
        <font-awesome-icon icon="undo" />
      </button>
      <button
        @click="editor.chain().focus().redo().run()"
        :disabled="!editor.can().redo()"
        type="button"
        title="Redo"
      >
        <font-awesome-icon icon="redo" />
      </button>
    </div>
    
    <editor-content :editor="editor" class="tiptap-content" />
  </div>
</template>

<script setup>
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Mulai menulis...'
  }
});

const emit = defineEmits(['update:modelValue']);

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        target: '_blank',
        rel: 'noopener noreferrer',
      },
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    Underline,
  ],
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML());
  },
  editorProps: {
    attributes: {
      class: 'tiptap-editor',
      placeholder: props.placeholder,
    },
  },
});

// Watch for external changes to modelValue
watch(() => props.modelValue, (value) => {
  const isSame = editor.value.getHTML() === value;
  if (!isSame) {
    editor.value.commands.setContent(value, false);
  }
});

const setLink = () => {
  const previousUrl = editor.value.getAttributes('link').href;
  const url = window.prompt('URL:', previousUrl);

  if (url === null) {
    return;
  }

  if (url === '') {
    editor.value.chain().focus().extendMarkRange('link').unsetLink().run();
    return;
  }

  editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
};
</script>

<style scoped>
.tiptap-editor-wrapper {
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  overflow: hidden;
  background: white;
}

.tiptap-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  padding: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.tiptap-toolbar button {
  padding: 0.375rem 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
  background: white;
  color: #374151;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.15s;
  min-width: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tiptap-toolbar button:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.tiptap-toolbar button.is-active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.tiptap-toolbar button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar-divider {
  width: 1px;
  background: #e5e7eb;
  margin: 0.25rem 0.5rem;
}

.tiptap-content {
  min-height: 150px;
  max-height: 400px;
  overflow-y: auto;
}

:deep(.tiptap-editor) {
  padding: 0.75rem;
  outline: none;
  min-height: 150px;
}

:deep(.tiptap-editor p) {
  margin: 0 0 0.75rem 0;
}

:deep(.tiptap-editor p:last-child) {
  margin-bottom: 0;
}

:deep(.tiptap-editor h1) {
  font-size: 1.875rem;
  font-weight: bold;
  margin: 1rem 0 0.5rem 0;
}

:deep(.tiptap-editor h2) {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0.875rem 0 0.5rem 0;
}

:deep(.tiptap-editor h3) {
  font-size: 1.25rem;
  font-weight: bold;
  margin: 0.75rem 0 0.5rem 0;
}

:deep(.tiptap-editor ul),
:deep(.tiptap-editor ol) {
  padding-left: 2rem;
  margin: 0.75rem 0;
  list-style-position: outside;
}

:deep(.tiptap-editor ul) {
  list-style-type: disc;
}

:deep(.tiptap-editor ol) {
  list-style-type: decimal;
}

:deep(.tiptap-editor li) {
  margin: 0.25rem 0;
  display: list-item;
}

:deep(.tiptap-editor ul ul) {
  list-style-type: circle;
  margin-top: 0.25rem;
}

:deep(.tiptap-editor ul ul ul) {
  list-style-type: square;
}

:deep(.tiptap-editor blockquote) {
  border-left: 3px solid #e5e7eb;
  padding-left: 1rem;
  margin: 1rem 0;
  color: #6b7280;
  font-style: italic;
}

:deep(.tiptap-editor code) {
  background: #f3f4f6;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-family: 'Courier New', monospace;
  font-size: 0.875em;
}

:deep(.tiptap-editor pre) {
  background: #1f2937;
  color: #f9fafb;
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  overflow-x: auto;
  margin: 1rem 0;
}

:deep(.tiptap-editor pre code) {
  background: none;
  padding: 0;
  color: inherit;
  font-size: 0.875rem;
  line-height: 1.5;
}

:deep(.tiptap-editor a) {
  color: #3b82f6;
  text-decoration: underline;
  cursor: pointer;
}

:deep(.tiptap-editor a:hover) {
  color: #2563eb;
}

:deep(.tiptap-editor strong) {
  font-weight: bold;
}

:deep(.tiptap-editor em) {
  font-style: italic;
}

:deep(.tiptap-editor u) {
  text-decoration: underline;
}

:deep(.tiptap-editor s) {
  text-decoration: line-through;
}

/* Placeholder */
:deep(.tiptap-editor p.is-editor-empty:first-child::before) {
  content: attr(placeholder);
  color: #9ca3af;
  pointer-events: none;
  height: 0;
  float: left;
}

/* Dark mode */
html.dark .tiptap-editor-wrapper {
  border-color: #374151;
  background: #1f2937;
}

html.dark .tiptap-toolbar {
  background: #111827;
  border-bottom-color: #374151;
}

html.dark .tiptap-toolbar button {
  background: #1f2937;
  color: #e5e7eb;
  border-color: #374151;
}

html.dark .tiptap-toolbar button:hover:not(:disabled) {
  background: #374151;
  border-color: #4b5563;
}

html.dark .tiptap-toolbar button.is-active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

html.dark .toolbar-divider {
  background: #374151;
}

html.dark :deep(.tiptap-editor) {
  color: #e5e7eb;
}

html.dark :deep(.tiptap-editor blockquote) {
  border-left-color: #374151;
  color: #9ca3af;
}

html.dark :deep(.tiptap-editor code) {
  background: #374151;
  color: #e5e7eb;
}

html.dark :deep(.tiptap-editor a) {
  color: #60a5fa;
}

html.dark :deep(.tiptap-editor a:hover) {
  color: #93c5fd;
}
</style>
