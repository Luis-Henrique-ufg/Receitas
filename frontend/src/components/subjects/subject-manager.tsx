import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  BookOpen,
  Archive,
  ArchiveRestore,
  Pencil,
  Trash2,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { Subject } from "@/models/models";
import { subjectsApi } from "@/services/subjectsApi";
import useApiUrl from "@/hooks/useApiUrl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PRESET_COLORS = [
  { name: "Esmeralda", hex: "#10b981" },
  { name: "Azul Elétrico", hex: "#3b82f6" },
  { name: "Âmbar", hex: "#f59e0b" },
  { name: "Violeta", hex: "#8b5cf6" },
  { name: "Coral / Rosa", hex: "#f43f5e" },
  { name: "Ciano", hex: "#06b6d4" },
  { name: "Lima", hex: "#84cc16" },
  { name: "Ardósia", hex: "#64748b" },
];

export default function SubjectManager() {
  const { apiUrl } = useApiUrl();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState(PRESET_COLORS[0].hex);
  const [formCode, setFormCode] = useState("");
  const [formSemester, setFormSemester] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchSubjects = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await subjectsApi.getAll(apiUrl, true);
      setSubjects(data);
    } catch {
      toast.error("Erro ao carregar matérias.");
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  function handleOpenCreate() {
    setEditingSubject(null);
    setFormName("");
    setFormColor(PRESET_COLORS[0].hex);
    setFormCode("");
    setFormSemester("");
    setIsDialogOpen(true);
  }

  function handleOpenEdit(subject: Subject) {
    setEditingSubject(subject);
    setFormName(subject.name);
    setFormColor(subject.color || PRESET_COLORS[0].hex);
    setFormCode(subject.code || "");
    setFormSemester(subject.semester || "");
    setIsDialogOpen(true);
  }

  async function handleSaveSubject() {
    const trimmedName = formName.trim();
    if (!trimmedName) {
      toast.error("O nome da matéria é obrigatório.");
      return;
    }

    try {
      setIsSaving(true);
      if (editingSubject) {
        await subjectsApi.update(apiUrl, editingSubject.id, {
          name: trimmedName,
          color: formColor,
          code: formCode.trim() || null,
          semester: formSemester.trim() || null,
        });
        toast.success("Matéria atualizada com sucesso!");
      } else {
        await subjectsApi.create(apiUrl, {
          name: trimmedName,
          color: formColor,
          code: formCode.trim() || undefined,
          semester: formSemester.trim() || undefined,
        });
        toast.success("Matéria criada com sucesso!");
      }
      setIsDialogOpen(false);
      window.dispatchEvent(new CustomEvent("subjectsUpdated"));
      window.dispatchEvent(new CustomEvent("statsUpdated"));
      fetchSubjects();
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : "Erro ao salvar matéria.";
      toast.error(errorMsg || "Erro ao salvar matéria.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleArchive(subject: Subject) {
    try {
      const nextState = !subject.is_archived;
      await subjectsApi.archive(apiUrl, subject.id, nextState);
      toast.success(
        nextState
          ? `"${subject.name}" foi arquivada.`
          : `"${subject.name}" foi desarquivada.`
      );
      window.dispatchEvent(new CustomEvent("subjectsUpdated"));
      window.dispatchEvent(new CustomEvent("statsUpdated"));
      fetchSubjects();
    } catch {
      toast.error("Erro ao alterar estado de arquivamento.");
    }
  }

  async function handleDelete(subject: Subject) {
    if (
      !window.confirm(
        `Tem certeza que deseja excluir a matéria "${subject.name}"? O histórico de foco registrado será mantido como "Sem matéria".`
      )
    ) {
      return;
    }

    try {
      await subjectsApi.delete(apiUrl, subject.id);
      toast.success(`"${subject.name}" foi excluída.`);
      window.dispatchEvent(new CustomEvent("subjectsUpdated"));
      window.dispatchEvent(new CustomEvent("statsUpdated"));
      fetchSubjects();
    } catch {
      toast.error("Erro ao excluir matéria.");
    }
  }

  const activeSubjects = subjects.filter((s) => !s.is_archived);
  const archivedSubjects = subjects.filter((s) => s.is_archived);

  return (
    <div className="space-y-6">
      {/* Header with Title and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-xl font-heading font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            Matérias de Estudo
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Cadastre disciplinas, semestres e cores para classificar seus pomodoros e tempo de foco.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-500 text-white gap-2 shadow-lg shadow-blue-600/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Nova Matéria
        </Button>
      </div>

      {/* Active Subjects List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          <span>Disciplinas Ativas ({activeSubjects.length})</span>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-16 rounded-xl bg-white/[0.03] animate-pulse border border-white/10"
              />
            ))}
          </div>
        ) : activeSubjects.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-dashed border-white/15 bg-white/[0.02]">
            <BookOpen className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-zinc-300">Nenhuma matéria ativa</p>
            <p className="text-xs text-zinc-500 mt-1">
              Cadastre suas disciplinas (ex: Estatística, Algoritmos, Cálculo) para começar a vincular aos seus pomodoros.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenCreate}
              className="mt-4 text-xs gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar Primeira Matéria
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeSubjects.map((subject) => (
              <div
                key={subject.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05] transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: subject.color }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {subject.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {subject.code && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] py-0 px-1.5 font-mono bg-white/10 text-zinc-300 border-none"
                        >
                          {subject.code}
                        </Badge>
                      )}
                      {subject.semester && (
                        <span className="text-[11px] text-zinc-400">
                          {subject.semester}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenEdit(subject)}
                    title="Editar Matéria"
                    className="h-8 w-8 text-zinc-400 hover:text-white"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleArchive(subject)}
                    title="Arquivar (semestre antigo)"
                    className="h-8 w-8 text-zinc-400 hover:text-amber-400"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(subject)}
                    title="Excluir Matéria"
                    className="h-8 w-8 text-zinc-400 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Archived Subjects Section */}
      {archivedSubjects.length > 0 && (
        <div className="pt-4 border-t border-white/10">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            <span>Matérias Arquivadas ({archivedSubjects.length})</span>
            {showArchived ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showArchived && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              {archivedSubjects.map((subject) => (
                <div
                  key={subject.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-black/30 opacity-70 hover:opacity-100 transition-opacity"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0 grayscale"
                      style={{ backgroundColor: subject.color }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-300 truncate">
                        {subject.name}
                      </p>
                      {subject.semester && (
                        <p className="text-[11px] text-zinc-500">
                          {subject.semester}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleArchive(subject)}
                      className="text-xs h-7 text-zinc-400 hover:text-white gap-1"
                    >
                      <ArchiveRestore className="w-3.5 h-3.5" /> Desarquivar
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(subject)}
                      className="h-7 w-7 text-zinc-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal / Dialog for Create & Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md bg-[#0a0f1d] border-white/15 text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-heading font-bold">
              {editingSubject ? "Editar Matéria" : "Nova Matéria de Estudo"}
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Configure os dados da disciplina para identificação visual nas estatísticas e no Pomodoro.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                Nome da Matéria <span className="text-rose-400">*</span>
              </label>
              <Input
                placeholder="Ex: Estatística Aplicada, Cálculo II..."
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="bg-white/5 border-white/15 text-white placeholder:text-zinc-500"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                  Código (Opcional)
                </label>
                <Input
                  placeholder="Ex: INF0124"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  className="bg-white/5 border-white/15 text-white placeholder:text-zinc-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                  Semestre (Opcional)
                </label>
                <Input
                  placeholder="Ex: 2026/2"
                  value={formSemester}
                  onChange={(e) => setFormSemester(e.target.value)}
                  className="bg-white/5 border-white/15 text-white placeholder:text-zinc-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-2">
                Cor de Identificação
              </label>
              <div className="flex flex-wrap gap-2.5 items-center">
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => setFormColor(preset.hex)}
                    style={{ backgroundColor: preset.hex }}
                    title={preset.name}
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 relative border border-white/20"
                  >
                    {formColor.toLowerCase() === preset.hex.toLowerCase() && (
                      <Check className="w-4 h-4 text-white drop-shadow-md stroke-[3]" />
                    )}
                  </button>
                ))}
                {/* Custom Color Input */}
                <div className="flex items-center gap-1.5 ml-2 border border-white/15 rounded-lg px-2 py-1 bg-white/5">
                  <input
                    type="color"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                    title="Cor Personalizada"
                  />
                  <span className="font-mono text-[11px] text-zinc-300 uppercase">
                    {formColor}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-white/10">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSaving}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveSubject}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs gap-1.5"
            >
              <Check className="w-4 h-4" />
              {isSaving ? "Salvando..." : "Salvar Matéria"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
