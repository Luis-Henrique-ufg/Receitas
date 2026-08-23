import { useEffect, useRef, useState } from "react";
import useApiUrl from "./useApiUrl";
import { toast } from "sonner";

export type LessonNote = {
  id: number;
  time: number;
  content: string;
};

export type CourseNote = {
  id: number;
  lesson_id: number;
  lesson_title: string;
  module: string;
  time: number;
  content: string;
};

export type LessonAttachment = {
  name: string;
  path: string;
};

export default function useLessonResources(
  lessonId?: number,
  courseId?: string | number
) {
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [courseNotes, setCourseNotes] = useState<CourseNote[]>([]);
  const [attachments, setAttachments] = useState<LessonAttachment[]>([]);
  const [newNote, setNewNote] = useState("");
  const [isNotesLoading, setIsNotesLoading] = useState(false);
  const [isCourseNotesLoading, setIsCourseNotesLoading] = useState(false);
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
      if (!response.ok) {
        if (response.status === 404) {
          setNotes([]);
          return;
        }
        throw new Error("Erro na requisição");
      }
      const data = await response.json();

      if (Array.isArray(data)) {
        setNotes(data);
      } else {
        setNotes([]);
      }
    } catch {
      toast.error("Erro ao carregar anotações da aula.");
    } finally {
      setIsNotesLoading(false);
    }
  }

  async function fetchCourseNotes() {
    if (!courseId) {
      setCourseNotes([]);
      return;
    }

    setIsCourseNotesLoading(true);

    try {
      const response = await fetch(`${apiUrl}/api/courses/${courseId}/notes`);
      if (!response.ok) {
        if (response.status === 404) {
          setCourseNotes([]);
          return;
        }
        throw new Error("Erro na requisição");
      }
      const data = await response.json();

      if (Array.isArray(data)) {
        setCourseNotes(data);
      } else {
        setCourseNotes([]);
      }
    } catch {
      toast.error("Erro ao carregar anotações do curso.");
    } finally {
      setIsCourseNotesLoading(false);
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
      if (!response.ok) {
        if (response.status === 404) {
          setAttachments([]);
          return;
        }
        throw new Error("Erro na requisição");
      }
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

  useEffect(() => {
    void fetchCourseNotes();
  }, [courseId, apiUrl]);

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
        await Promise.all([fetchNotes(), fetchCourseNotes()]);
        toast.success("Anotação salva!");
      }
    } catch {
      toast.error("Erro ao salvar anotação.");
    }
  }

  async function editNote(noteId: number, content: string, time?: number) {
    if (!content.trim()) {
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/notes/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          ...(time !== undefined ? { time } : {}),
        }),
      });

      if (response.ok) {
        await Promise.all([fetchNotes(), fetchCourseNotes()]);
        toast.success("Anotação atualizada!");
      } else {
        throw new Error("Erro ao atualizar");
      }
    } catch {
      toast.error("Erro ao atualizar anotação.");
    }
  }

  async function deleteNote(noteId: number) {
    try {
      const response = await fetch(`${apiUrl}/api/notes/${noteId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await Promise.all([fetchNotes(), fetchCourseNotes()]);
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
    courseNotes,
    attachments,
    newNote,
    setNewNote,
    isNotesLoading,
    isCourseNotesLoading,
    isAttachmentsLoading,
    saveNote,
    editNote,
    deleteNote,
    seekTo,
    fetchNotes,
    fetchCourseNotes,
  };
}