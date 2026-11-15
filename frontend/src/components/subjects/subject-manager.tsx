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
  ArrowRightLeft,
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
  { name: "Laranja Tangerina", hex: "#FF7020" },
  { name: "Verde Smiles", hex: "#00A196" },
  { name: "Rosa Solar", hex: "#E33D6C" },
  { name: "Roxo Tangerina", hex: "#663399" },
  { name: "Amarelo Sol", hex: "#FFAB3B" },
  { name: "Laranja Intenso", hex: "#EA3600" },
  { name: "Verde Folha", hex: "#2AC500" },
  { name: "Magenta", hex: "#B70B6C" },
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

  // Reassign unassigned focus state
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [selectedTargetSubjectId, setSelectedTargetSubjectId] = useState<number | null>(null);
  const [isReassigning, setIsReassigning] = useState(false);

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

  function handleOpenReassign() {
    if (activeSubjects.length > 0) {
      setSelectedTargetSubjectId(activeSubjects[0].id);
    }
    setIsReassignOpen(true);
  }

  async function handleConfirmReassign() {
    if (!selectedTargetSubjectId) return;
    try {
      setIsReassigning(true);
      const res = await subjectsApi.reassignUnassigned(apiUrl, selectedTargetSubjectId);
      toast.success(res.message || "Histórico reatribuído com sucesso!");
      setIsReassignOpen(false);
      window.dispatchEvent(new CustomEvent("subjectsUpdated"));
      window.dispatchEvent(new CustomEvent("statsUpdated"));
      await fetchSubjects();
    } catch {
      toast.error("Erro ao reatribuir histórico de foco.");
    } finally {
      setIsReassigning(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Title and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h2 className="text-lg sm:text-xl font-display font-semibold text-foreground tracking-[-0.015em] flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Matérias de Estudo
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Cadastre disciplinas, semestres e cores para classificar seus pomodoros e tempo de foco.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {activeSubjects.length > 0 && (
            <Button
              variant="outline"
              onClick={handleOpenReassign}
              className="bg-secondary/60 hover:bg-secondary text-foreground border-border text-xs gap-1.5 rounded-xl"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-primary" /> Atribuir Tempo Sem Matéria
            </Button>
          )}
          <Button
            onClick={handleOpenCreate}
            className="bg-primary hover:brightness-105 text-[#030607] font-semibold gap-2 shadow-[0_4px_14px_rgba(255,112,32,0.3)] text-xs rounded-xl transition-all duration-200"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" /> Nova Matéria
          </Button>
        </div>
      </div>

      {/* Active Subjects List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">
          <span>Disciplinas Ativas ({activeSubjects.length})</span>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-16 rounded-2xl bg-secondary/40 animate-pulse border border-border"
              />
            ))}
          </div>
        ) : activeSubjects.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-secondary/25">
            <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">Nenhuma matéria ativa</p>
            <p className="text-xs text-muted-foreground mt-1">
              Cadastre suas disciplinas (ex: Estatística, Algoritmos, Cálculo) para começar a vincular aos seus pomodoros.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenCreate}
              className="mt-4 text-xs gap-1.5 rounded-xl bg-card border-border hover:bg-secondary text-foreground"
            >
              <Plus className="w-3.5 h-3.5 text-primary" /> Adicionar Primeira Matéria
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeSubjects.map((subject) => (
              <div
                key={subject.id}
                className="flex items-center justify-between p-4 rounded-2xl border border-border bg-secondary/35 hover:border-primary/35 hover:bg-secondary/65 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: subject.color }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {subject.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {subject.code && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] py-0 px-1.5 font-mono bg-card text-foreground border border-border"
                        >
                          {subject.code}
                        </Badge>
                      )}
                      {subject.semester && (
                        <span className="text-[11px] text-muted-foreground">
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
                    className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-card"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleArchive(subject)}
                    title="Arquivar (semestre antigo)"
                    className="h-8 w-8 rounded-xl text-muted-foreground hover:text-primary hover:bg-card"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(subject)}
                    title="Excluir Matéria"
                    className="h-8 w-8 rounded-xl text-muted-foreground hover:text-destructive hover:bg-card"
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
        <div className="pt-4 border-t border-border">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
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
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-border/60 bg-muted/25 opacity-75 hover:opacity-100 transition-opacity"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0 grayscale"
                      style={{ backgroundColor: subject.color }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground/85 truncate">
                        {subject.name}
                      </p>
                      {subject.semester && (
                        <p className="text-[11px] text-muted-foreground">
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
                      className="text-xs h-7 rounded-lg text-muted-foreground hover:text-foreground gap-1"
                    >
                      <ArchiveRestore className="w-3.5 h-3.5" /> Desarquivar
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(subject)}
                      className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive"
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
        <DialogContent className="max-w-md bg-card border-border text-foreground rounded-3xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-display font-semibold text-foreground">
              {editingSubject ? "Editar Matéria" : "Nova Matéria de Estudo"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Configure os dados da disciplina para identificação visual nas estatísticas e no Pomodoro.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Nome da Matéria <span className="text-primary">*</span>
              </label>
              <Input
                placeholder="Ex: Estatística Aplicada, Cálculo II..."
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground rounded-xl"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  Código (Opcional)
                </label>
                <Input
                  placeholder="Ex: INF0124"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  Semestre (Opcional)
                </label>
                <Input
                  placeholder="Ex: 2026/2"
                  value={formSemester}
                  onChange={(e) => setFormSemester(e.target.value)}
                  className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-2">
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
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 relative border border-black/10 dark:border-white/20 cursor-pointer"
                  >
                    {formColor.toLowerCase() === preset.hex.toLowerCase() && (
                      <Check className="w-4 h-4 text-white drop-shadow-md stroke-[3]" />
                    )}
                  </button>
                ))}
                {/* Custom Color Input */}
                <div className="flex items-center gap-1.5 ml-2 border border-border rounded-xl px-2.5 py-1 bg-secondary/50">
                  <input
                    type="color"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                    title="Cor Personalizada"
                  />
                  <span className="font-mono text-[11px] text-foreground uppercase">
                    {formColor}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSaving}
              className="text-xs rounded-xl bg-secondary/50 border-border text-foreground hover:bg-secondary"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveSubject}
              disabled={isSaving}
              className="bg-primary hover:brightness-105 text-[#030607] font-semibold text-xs gap-1.5 rounded-xl shadow-[0_4px_14px_rgba(255,112,32,0.3)]"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              {isSaving ? "Salvando..." : "Salvar Matéria"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassign "Sem matéria" Dialog */}
      <Dialog open={isReassignOpen} onOpenChange={setIsReassignOpen}>
        <DialogContent className="max-w-md bg-card border-border text-foreground rounded-3xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground font-display font-semibold">
              <ArrowRightLeft className="w-5 h-5 text-primary" />
              Atribuir Tempo de "Sem matéria"
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Transfira todo o histórico de tempo e pomodoros acumulados sem matéria para uma das suas disciplinas ativas.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-medium">Matéria Destino</label>
              <select
                value={selectedTargetSubjectId ?? ""}
                onChange={(e) => setSelectedTargetSubjectId(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-xl bg-secondary/50 border border-border text-foreground text-sm focus:outline-none focus:border-primary cursor-pointer"
              >
                {activeSubjects.map((s) => (
                  <option key={s.id} value={s.id} className="bg-card text-foreground">
                    {s.name} {s.code ? `(${s.code})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsReassignOpen(false)}
              className="text-xs rounded-xl border-border bg-secondary/50 text-foreground hover:bg-secondary"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmReassign}
              disabled={isReassigning || !selectedTargetSubjectId || activeSubjects.length === 0}
              className="text-xs bg-primary hover:brightness-105 text-[#030607] font-semibold rounded-xl shadow-[0_4px_14px_rgba(255,112,32,0.3)] transition-all duration-200"
            >
              {isReassigning ? "Atribuindo..." : "Confirmar Atribuição"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
