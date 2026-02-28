'use client';

import { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';

export function PineEditor({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: code || '// Generated PineScript code will appear here...',
      extensions: [
        basicSetup,
        javascript(),
        oneDark,
        EditorView.editable.of(false),
        EditorView.theme({
          '&': { maxHeight: '500px' },
          '.cm-scroller': { overflow: 'auto' },
        }),
      ],
    });

    if (viewRef.current) {
      viewRef.current.destroy();
    }

    viewRef.current = new EditorView({
      state,
      parent: containerRef.current,
    });

    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  }, [code]);

  return <div ref={containerRef} className="min-h-[200px]" />;
}
