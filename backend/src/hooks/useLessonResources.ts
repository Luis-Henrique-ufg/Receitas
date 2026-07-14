import { useEffect, useRef, useState } from "react";
import useApiUrl from "./useApiUrl";
import { toast } from "sonner";

export type LessonNote = {
  id: number;
  time: number;
  content: string;
};

export type LessonAttachment = {
  name: string;
  path: string;
};

export default function useLessonResources(lessonId?: number) {
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [attachments, setAttachments] = useState<LessonAttachment[]>([]);
  const [newNote, setNewNote] = useState("");
  const [isNotesLoading, setIsNotesLoading] = useState(false);
  const [isAttachmentsLoading, setIsAttachmentsLoading] = useState(false);
  const { apiUrl } = useApiUrl();
  const timeRef = useRef(0);

  useEffect(() => {
    const onTimeUpdate = (e: Event) => {
      const ce = e as CustomEvent<number>;
      timeRef.current = ce.detail;
    };

    window.addEventListener("playerTimeUpdate", onTimeUpdate);

    return () => window.removeEventListener("playerTimeUpdate", onTimeUpdate);
  }, []);

  async function fetchNotes() {
    if (!lessonId) {
      setNotes([]);
      return;
    }

    setIsNotesLoading(true);

    try {
      const response = await fetch(`${apiUrl}/api/lessons/${lessonId}/notes`);
      const data = await response.json();

      if (Array.isArray(data)) {
        setNotes(data);
      } else {
        setNotes([]);
      }
    } catch {
      toast.error("Erro ao carregar anotações.");
    } finally {
      setIsNotesLoading(false);
    }
  }

  async function fetchAttachments() {
    if (!lessonId) {
      setAttachments([]);
      return;
    }

    setIsAttachmentsLoading(true);

    try {
      const response = await fetch(
        `${apiUrl}/api/lessons/${lessonId}/attachments`
      );
      const data = await response.json();

      if (Array.isArray(data)) {
        setAttachments(data);
      } else {
        setAttachments([]);
      }
    } catch {
      toast.error("Erro ao carregar anexos.");
    } finally {
      setIsAttachmentsLoading(false);
    }
  }

  useEffect(() => {
    void fetchNotes();
    void fetchAttachments();
    setNewNote("");
  }, [lessonId, apiUrl]);

  async function saveNote() {
    if (!newNote.trim() || !lessonId) {
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/lessons/${lessonId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          time: Math.floor(timeRef.current),
          content: newNote,
        }),
      });

      if (response.ok) {
        setNewNote("");
        await fetchNotes();
        toast.success("Anotação salva!");
      }
    } catch {
      toast.error("Erro ao salvar anotação.");
    }
  }

  async function deleteNote(noteId: number) {
    try {
      const response = await fetch(`${apiUrl}/api/notes/${noteId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchNotes();
        toast.success("Anotação removida!");
      }
    } catch {
      toast.error("Erro ao remover anotação.");
    }
  }

  function seekTo(time: number) {
    window.dispatchEvent(new CustomEvent("playerSeek", { detail: time }));
  }

  return {
    apiUrl,
    notes,
    attachments,
    newNote,
    setNewNote,
    isNotesLoading,
    isAttachmentsLoading,
    saveNote,
    deleteNote,
    seekTo,
  };
}