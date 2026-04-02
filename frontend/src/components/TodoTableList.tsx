"use client";

import * as React from "react";
import { toast } from "sonner";

/** @react-compiler-skip */
import {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {CircleArrowDown, CircleArrowUp, Pencil, Trash2,  } from "lucide-react";
import { useTodos, useTodoActions } from "@/hooks/useTodos";
import type { Todo } from "@/types/todo";
import TodoEditDialog from "@/components/TodoEditDialog";
import TodoForm from "@/components/TodoForm";

export default function TodosPage() {
  const PAGE_SIZE = 15;
  const [page, setPage] = React.useState(1);

  // Consumir dados da API
  const {
    todos,
    total,
    totalPages,
    openCount,
    doneCount,
    isLoading,
    error,
  } = useTodos(page, PAGE_SIZE);
  const { toggleTodo, deleteTodo } = useTodoActions();

  // Estados de controle do TanStack Table
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [combinedFilter, setCombinedFilter] = React.useState<string>("all");

  // Estados para diálogos
  const [editingTodo, setEditingTodo] = React.useState<Todo | null>(null);
  const [newTodoOpen, setNewTodoOpen] = React.useState(false);
  const [updatingIds, setUpdatingIds] = React.useState<Set<number>>(new Set());

  // Definição das colunas da tabela
  const columns = React.useMemo<ColumnDef<Todo>[]>(
    () => [
      // Coluna de concluído (checkbox)
      {
        accessorKey: "completed",
        header: "Concluída",
        cell: (info) => (
          <Checkbox
            checked={info.getValue<boolean>()}
            disabled={updatingIds.has(info.row.original.id)}
            onCheckedChange={async () => {
              const todo = info.row.original;
              try {
                setUpdatingIds((prev) => new Set(prev).add(todo.id));
                await toggleTodo(todo);
                toast.success("Tarefa atualizada");
              } catch (error) {
                const errorMsg =
                  error instanceof Error
                    ? error.message
                    : "Erro ao atualizar tarefa";
                toast.error(errorMsg);
                console.error("Erro ao atualizar tarefa:", error);
              } finally {
                setUpdatingIds((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(todo.id);
                  return newSet;
                });
              }
            }}
          />
        ),
      },
      // Coluna do título da tarefa
      {
        accessorKey: "title",
        header: "Título",
        cell: (info) => (
          <span
            className={
              info.row.original.completed ? "line-through text-zinc-400" : ""
            }
          >
            {info.getValue<string>()}
          </span>
        ),
      },
      // Coluna da data de criação
      {
        accessorKey: "createdAt",
        header: "Data de Criação",
        cell: (info) => {
          const date = new Date(info.getValue<string>());
          return date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });
        },
      },

      // Coluna de ações (editar, excluir)
      {
        id: "actions",
        header: "Ações",
        cell: ({ row }) => (
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditingTodo(row.original)}
              className="cursor-pointer"
            >
              <Pencil className="w-4 h-4" aria-label="Editar" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="cursor-pointer"
              >
                <Trash2 className="w-4 h-4" aria-label="Deletar" />
              </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Deletar Tarefa</AlertDialogTitle>
                <AlertDialogDescription>
                Tem certeza que deseja deletar &quot;{row.original.title}&quot;? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="cursor-pointer">Cancelar</AlertDialogCancel>
                <AlertDialogAction
                onClick={async () => {
                  try {
                  await deleteTodo(row.original.id);
                  toast.success("Tarefa deletada com sucesso");
                  } catch (error) {
                  const errorMsg =
                    error instanceof Error
                    ? error.message
                    : "Erro ao deletar tarefa";
                  toast.error(errorMsg);
                  console.error("Erro ao deletar tarefa:", error);
                  }
                }}
                className="bg-red-600 text-white hover:bg-red-700 hover:text-white transition-colors duration-200 cursor-pointer"
                >
                Deletar
                </AlertDialogAction>
              </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ),
      },
    ],
    [updatingIds, toggleTodo, deleteTodo],
  );

  // Configuração da tabela usando TanStack Table
  const table = useReactTable({
    data: todos,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  React.useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  // Efeito para aplicar o filtro/sorting combinado
  React.useEffect(() => {
    // Filtrar por concluído ou não concluído
    if (combinedFilter === "open") {
      table.getColumn("completed")?.setFilterValue(false);
    } else if (combinedFilter === "done") {
      table.getColumn("completed")?.setFilterValue(true);
    } else {
      table.getColumn("completed")?.setFilterValue(undefined);
    }
    // Ordenar por título ou data, se selecionado
    if (combinedFilter === "alphabetical") {
      table.setSorting([{ id: "title", desc: false }]);
    } else if (combinedFilter === "createdAt") {
      table.setSorting([{ id: "createdAt", desc: true }]);
    }
    // Em "all", removemos ordenação personalizada (fallback para padrão criado)
  }, [combinedFilter, table]);

  // Contagens de tarefas para estatísticas
  const totalCount = total;

  return (
    <div className="p-4 space-y-4">
      {/* Estado de carregamento */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-muted-foreground">Carregando tarefas...</p>
        </div>
      )}

      {/* Estado de erro */}
      {error && !isLoading && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          <p className="font-medium">Erro ao carregar tarefas</p>
          <p className="text-xs mt-1">
            {error instanceof Error ? error.message : String(error)}
          </p>
        </div>
      )}

      {/* Renderizar conteúdo apenas se não estiver carregando */}
      {!isLoading && !error && (
        <>
          {/* Controles: busca, filtro, nova tarefa */}
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Buscar tarefas..."
              value={
                (table.getColumn("title")?.getFilterValue() as string) ?? ""
              }
              onChange={(e) =>
                table.getColumn("title")?.setFilterValue(e.target.value)
              }
              className="max-w-sm"
            />
            <Select value={combinedFilter} onValueChange={setCombinedFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Status</SelectLabel>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="open">Em aberto</SelectItem>
                  <SelectItem value="done">Concluídas</SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Ordenar por</SelectLabel>
                  <SelectItem value="createdAt">Data de criação</SelectItem>
                  <SelectItem value="alphabetical">Ordem alfabética</SelectItem> 
                </SelectGroup>
              </SelectContent>
            </Select>

            
            <Dialog open={newTodoOpen} onOpenChange={setNewTodoOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="ml-auto cursor-pointer px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 hover:text-white transition-colors duration-200 border-blue-600 hover:border-blue-700"
                >
                  Nova Tarefa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Nova Tarefa</DialogTitle>
                </DialogHeader>
                <TodoForm onSuccess={() => setNewTodoOpen(false)} />
              </DialogContent>
            </Dialog>

          </div>

          {/* Estatísticas de totais */}
          <div className="text-sm text-muted-foreground flex space-x-4">
            <p className="text-amber-400">
              <strong>{openCount}</strong> em aberto
            </p>
            <p className="text-green-500">
              <strong>{doneCount}</strong> concluídas
            </p>
            <p className="text-blue-500">
              <strong>{totalCount}</strong> total
            </p>
          </div>

          {/* Tabela de tarefas */}
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder ? null : (
                          <div
                            {...{
                              style: {
                                cursor: header.column.getCanSort()
                                  ? "pointer"
                                  : undefined,
                              },
                              onClick: header.column.getToggleSortingHandler(),
                            }}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {/* Indicador de ordenação */}
                            {header.column.getIsSorted() === "asc"
                              ? <CircleArrowUp className="inline-block ml-1" />
                              : header.column.getIsSorted() === "desc"
                                ? <CircleArrowDown className="inline-block ml-1" />
                                : ""}
                          </div>
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      Nenhuma tarefa encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginação */}
          <div className="flex items-center justify-between space-x-2 py-4">
            <p className="text-sm text-muted-foreground">
              Página {page} de {Math.max(totalPages, 1)} • {PAGE_SIZE} itens por página
            </p>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages}
              >
                Próximo
              </Button>
            </div>
          </div>

          {/* Diálogo de edição */}
          {editingTodo && (
            <TodoEditDialog
              todo={editingTodo}
              open={editingTodo !== null}
              onOpenChange={(open) => {
                if (!open) setEditingTodo(null);
              }}
              showTrigger={false}
            />
          )}
        </>
      )}
    </div>
  );
}
