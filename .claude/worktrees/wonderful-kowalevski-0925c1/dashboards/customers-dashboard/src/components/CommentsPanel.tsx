import React, { useEffect, useState } from 'react';
import { addComment, subscribeComments } from '../services/salesService';
import type { CommentRecord } from '../types';

interface CommentsPanelProps {
  saleId: string;
  authorUid: string;
  authorLabel?: string | null;
}

export const CommentsPanel: React.FC<CommentsPanelProps> = ({ saleId, authorUid, authorLabel }) => {
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadComments = async () => {
      try {
        const result = await subscribeComments(saleId);
        if (isMounted) {
          setComments(result);
        }
      } catch (error) {
        console.error('Error cargando comentarios:', error);
      }
    };

    loadComments();

    return () => {
      isMounted = false;
    };
  }, [saleId]);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setIsSubmitting(true);
    try {
      await addComment(saleId, message.trim(), authorUid);
      setMessage('');
      const updated = await subscribeComments(saleId);
      setComments(updated);
    } catch (error) {
      console.error('Error enviando comentario:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3 max-h-64 overflow-auto pr-2">
        {comments.length === 0 && (
          <p className="text-xs text-gray-400">Aún no hay comentarios. Puedes dejar tu mensaje aquí.</p>
        )}
        {comments.map((comment) => (
          <div key={comment.id} className="bg-gray-50 border border-gray-100 rounded-xl p-3">
            <p className="text-xs text-gray-600 leading-relaxed">{comment.message}</p>
            <p className="text-[10px] text-gray-400 mt-2">
              {comment.authorUid === authorUid && authorLabel ? `Por ${authorLabel}` : 'Cliente'}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={3}
          placeholder="Escribe tu comentario"
          className="w-full rounded-xl border border-gray-200 p-3 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-sbs-blue/20"
        />
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full text-xs font-bold text-white bg-sbs-blue py-3 rounded-xl disabled:opacity-60"
        >
          {isSubmitting ? 'Enviando...' : 'Enviar comentario'}
        </button>
      </div>
    </div>
  );
};
