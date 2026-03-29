"use client";

import * as React from "react";
import { toast } from "sonner";

/** @react-compiler-skip */
import {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Pencil, Trash2 } from "lucide-react";
import { useTodos, useTodoActions } from "@/hooks/useTodos";
import type { Todo } from "@/types/todo";
import TodoEditDialog from "@/components/TodoEditDialog";
import TodoForm from "@/components/TodoForm";

export default function TodosPage() {
  // Consumir dados da API
  const { todos, isLoading, error } = useTodos();
  const { toggleTodo, deleteTodo } = useTodoActions();

  // Estados de controle do TanStack Table
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [combinedFilter, setCombinedFilter] = React.useState<string>("all");

  // Estados para diálogos
  const [editingTodo, setEditingTodo] = React.useState<Todo | null>(null);
  const [newTodoOpen, setNewTodoOpen] = React.useState(false);
  const [updatingIds, setUpdatingIds] = React.useState<Set<number>>(new Set());

  // Definição das colunas da tabela
  const columns = React.useMemo<ColumnDef<Todo>[]>(() => [
    // Coluna do título da tarefa
    {
      accessorKey: "title",
      header: "Título",
      cell: info => (
        <span className={info.row.original.completed ? "line-through text-zinc-400" : ""}>
          {info.getValue<string>()}
        </span>
      ),
    },
    // Coluna da data de criação
    {
      accessorKey: "createdAt",
      header: "Data de Criação",
      cell: info => {
      const date = new Date(info.getValue<string>());
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      },
    },
    // Coluna de concluído (checkbox)
    {
      accessorKey: "completed",
      header: "Concluída",
      cell: info => (
        <Checkbox
          checked={info.getValue<boolean>()}
          disabled={updatingIds.has(info.row.original.id)}
          onCheckedChange={async () => {
            const todo = info.row.original;
            try {
              setUpdatingIds(prev => new Set(prev).add(todo.id));
              await toggleTodo(todo);
              toast.success("Tarefa atualizada");
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : "Erro ao atualizar tarefa";
              toast.error(errorMsg);
              console.error("Erro ao atualizar tarefa:", error);
            } finally {
              setUpdatingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(todo.id);
                return newSet;
              });
            }
          }}
        />
      ),
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
          >
            <Pencil className="w-4 h-4" aria-label="Editar" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={async () => {
              if (confirm(`Excluir "${row.original.title}"?`)) {
                try {
                  await deleteTodo(row.original.id);
                  toast.success("Tarefa deletada com sucesso");
                } catch (error) {
                  const errorMsg = error instanceof Error ? error.message : "Erro ao deletar tarefa";
                  toast.error(errorMsg);
                  console.error("Erro ao deletar tarefa:", error);
                }
              }
            }}
          >
            <Trash2 className="w-4 h-4" aria-label="Deletar" />
          </Button>
        </div>
      ),
    },
  ], [updatingIds, toggleTodo, deleteTodo]);

  // Configuração da tabela usando TanStack Table
  const table = useReactTable({
    data: todos,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

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
  const totalCount = todos.length;
  const openCount = todos.filter(t => !t.completed).length;
  const doneCount = todos.filter(t => t.completed).length;

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
          <p className="text-xs mt-1">{error instanceof Error ? error.message : String(error)}</p>
        </div>
      )}

      {/* Renderizar conteúdo apenas se não estiver carregando */}
      {!isLoading && !error && (
        <>
          {/* Controles: busca, filtro, nova tarefa */}
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Buscar tarefas..."
              value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
              onChange={e =>
                table.getColumn("title")?.setFilterValue(e.target.value)
              }
              className="max-w-sm"
            />
            <select
              className="h-9 rounded-md border bg-background px-3 text-sm"
              value={combinedFilter}
              onChange={e => setCombinedFilter(e.target.value)}
            >
              <option value="all">Todos</option>
              <option value="open">Em aberto</option>
              <option value="done">Concluídas</option>
              <option value="createdAt">Data de criação</option>
              <option value="alphabetical">Ordem alfabética</option>
            </select>
            <Dialog open={newTodoOpen} onOpenChange={setNewTodoOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="ml-auto">
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
            {/* Menu para visibilidade de colunas (opcional) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Colunas</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table.getAllColumns().filter(col => col.getCanHide()).map(column => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={value => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Estatísticas de totais */}
          <div className="text-sm text-muted-foreground flex space-x-4">
            <p><strong>{openCount}</strong> em aberto</p>
            <p><strong>{doneCount}</strong> concluídas</p>
            <p><strong>{totalCount}</strong> total</p>
          </div>

          {/* Tabela de tarefas */}
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder ? null : (
                          <div
                            {...{
                              style: { cursor: header.column.getCanSort() ? "pointer" : undefined },
                              onClick: header.column.getToggleSortingHandler(),
                            }}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {/* Indicador de ordenação */}
                            {header.column.getIsSorted() === "asc" ? " 🔼" : header.column.getIsSorted() === "desc" ? " 🔽" : ""}
                          </div>
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map(row => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map(cell => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      Nenhuma tarefa encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginação */}
          <div className="flex items-center justify-end space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Próximo
            </Button>
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
