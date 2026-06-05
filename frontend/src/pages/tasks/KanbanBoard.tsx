import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Task, TaskStatus } from '../../types/api.types';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useUpdateTask } from '../../hooks/useTasks';
import { useToast } from '../../hooks/use-toast';

interface KanbanBoardProps {
  tasks: Task[];
}

const STATUS_COLUMNS: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'BLOCKED'];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks }) => {
  const [columns, setColumns] = useState<Record<TaskStatus, Task[]>>({
    TODO: [],
    IN_PROGRESS: [],
    IN_REVIEW: [],
    COMPLETED: [],
    BLOCKED: [],
  });

  const { mutate: updateTask } = useUpdateTask();
  const { toast } = useToast();

  useEffect(() => {
    const newColumns: Record<TaskStatus, Task[]> = {
      TODO: [],
      IN_PROGRESS: [],
      IN_REVIEW: [],
      COMPLETED: [],
      BLOCKED: [],
    };
    tasks.forEach(task => {
      if (newColumns[task.status]) {
        newColumns[task.status].push(task);
      }
    });
    setColumns(newColumns);
  }, [tasks]);

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceStatus = source.droppableId as TaskStatus;
    const destStatus = destination.droppableId as TaskStatus;

    // Optimistically update UI
    const sourceTasks = Array.from(columns[sourceStatus]);
    const destTasks = Array.from(columns[destStatus]);
    const [movedTask] = sourceTasks.splice(source.index, 1);

    if (sourceStatus === destStatus) {
      sourceTasks.splice(destination.index, 0, movedTask);
      setColumns({ ...columns, [sourceStatus]: sourceTasks });
    } else {
      movedTask.status = destStatus;
      destTasks.splice(destination.index, 0, movedTask);
      setColumns({
        ...columns,
        [sourceStatus]: sourceTasks,
        [destStatus]: destTasks,
      });

      // Fire mutation to backend
      updateTask(
        { id: movedTask.id, data: { status: destStatus } },
        {
          onError: () => {
            toast({ title: 'Failed to update task status', variant: 'destructive' });
            // Ideally, rollback the optimistic update here if needed.
          }
        }
      );
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'CRITICAL': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'HIGH': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'MEDIUM': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'LOW': return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
      default: return '';
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-280px)]">
      <DragDropContext onDragEnd={onDragEnd}>
        {STATUS_COLUMNS.map(status => (
          <div key={status} className="min-w-[280px] w-[280px] sm:min-w-[300px] sm:w-[300px] flex flex-col bg-slate-900/50 rounded-xl border-2 border-slate-700 mb-0">
            <div className="p-3 border-b-2 border-slate-700 bg-slate-800 rounded-t-xl flex justify-between items-center">
              <h3 className="font-bold text-slate-200">{status.replace('_', ' ')}</h3>
              <Badge variant="outline" className="bg-slate-900 border-slate-600">{columns[status].length}</Badge>
            </div>
            
            <Droppable droppableId={status}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-1 p-3 overflow-y-auto space-y-3 transition-colors ${snapshot.isDraggingOver ? 'bg-slate-800/30' : ''}`}
                >
                  {columns[status].map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`bg-slate-900 border-2 border-slate-700 p-4 rounded-xl shadow-sm ${snapshot.isDragging ? 'shadow-[4px_4px_0px_0px_rgba(30,58,138,0.5)] border-blue-500/50 rotate-2' : 'hover:border-slate-600'}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <Badge className={`text-[10px] uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </Badge>
                          </div>
                          <h4 className="font-semibold text-slate-200 mb-1 leading-tight">{task.name}</h4>
                          <div className="flex items-center text-xs text-slate-400 mb-4 gap-2">
                            {task.deadline && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(task.deadline), 'MMM d')}</span>}
                            {task.estimatedHours && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {task.estimatedHours}h</span>}
                          </div>
                          
                          <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                            {task.assignments?.[0]?.user || task.assignee ? (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6 border border-slate-600">
                                  <AvatarFallback className="text-[10px] bg-slate-700">
                                    {(task.assignments?.[0]?.user?.name || task.assignee?.name || 'U').substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-500 italic">Unassigned</span>
                            )}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </DragDropContext>
    </div>
  );
};
