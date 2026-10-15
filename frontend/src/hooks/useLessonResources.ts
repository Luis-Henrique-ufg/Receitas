import { useEffect, useRef, useState, useCallback } from "react";
import useApiUrl from "./useApiUrl";
import { toast } from "sonner";
import {
  lessonsApi,
  LessonNote,
  CourseNote,
  LessonAttachment,
} from "@/services/lessonsApi";
import { usePlaybackStore } from "@/store/usePlaybackStore";

export type { LessonNote, CourseNote, LessonAttachment };

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

  const playbackCurrentTime = usePlaybackStore((state) => state.currentTime);
  const storeSeekTo = usePlaybackStore((state) => state.seekTo);

  useEffect(() => {
    timeRef.current = playbackCurrentTime;
  }, [playbackCurrentTime]);

  const fetchNotes = useCallback(async () => {
    if (!lessonId) {
      setNotes([]);
      return;
    }

    setIsNotesLoading(true);
    try {
      const data = await lessonsApi.getLessonNotes(apiUrl, lessonId);
      setNotes(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Erro ao carregar anotações da aula.");
      setNotes([]);
    } finally {
      setIsNotesLoading(false);
    }
  }, [apiUrl, lessonId]);

  const fetchCourseNotes = useCallback(async () => {
    if (!courseId) {
      setCourseNotes([]);
      return;
    }

    setIsCourseNotesLoading(true);
    try {
      const data = await lessonsApi.getCourseNotes(apiUrl, courseId);
      setCourseNotes(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Erro ao carregar anotações do curso.");
      setCourseNotes([]);
    } finally {
      setIsCourseNotesLoading(false);
    }
  }, [apiUrl, courseId]);

  const fetchAttachments = useCallback(async () => {
    if (!lessonId) {
      setAttachments([]);
      return;
    }

    setIsAttachmentsLoading(true);
    try {
      const data = await lessonsApi.getAttachments(apiUrl, lessonId);
      setAttachments(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Erro ao carregar anexos.");
      setAttachments([]);
    } finally {
      setIsAttachmentsLoading(false);
    }
  }, [apiUrl, lessonId]);

  useEffect(() => {
    void fetchNotes();
    void fetchAttachments();
    setNewNote("");
  }, [fetchNotes, fetchAttachments]);

  useEffect(() => {
    void fetchCourseNotes();
  }, [fetchCourseNotes]);

  async function saveNote() {
    if (!newNote.trim() || !lessonId) {
      return;
    }

    try {
      await lessonsApi.createNote(apiUrl, lessonId, {
        time: Math.floor(timeRef.current),
        content: newNote.trim(),
      });
      setNewNote("");
      await Promise.all([fetchNotes(), fetchCourseNotes()]);
      toast.success("Anotação salva!");
    } catch {
      toast.error("Erro ao salvar anotação.");
    }
  }

  async function editNote(noteId: number, content: string, time?: number) {
    if (!content.trim()) {
      return;
    }

    try {
      await lessonsApi.updateNote(apiUrl, noteId, {
        content: content.trim(),
        ...(time !== undefined ? { time } : {}),
      });
      await Promise.all([fetchNotes(), fetchCourseNotes()]);
      toast.success("Anotação atualizada!");
    } catch {
      toast.error("Erro ao atualizar anotação.");
    }
  }

  async function deleteNote(noteId: number) {
    try {
      await lessonsApi.deleteNote(apiUrl, noteId);
      await Promise.all([fetchNotes(), fetchCourseNotes()]);
      toast.success("Anotação removida!");
    } catch {
      toast.error("Erro ao remover anotação.");
    }
  }

  function seekTo(time: number) {
    storeSeekTo(time);
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