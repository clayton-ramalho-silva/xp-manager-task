import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Play, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  MoreHorizontal,
  ArrowRight,
  Calendar,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDate } from '../utils/dateUtils';
import { Project, UserStory, Iteration, Task } from '../types';

interface KanbanProps {
  project: Project;
}

const COLUMNS = [
  { id: 'todo', title: 'A Fazer', color: 'bg-slate-500' },
  { id: 'doing', title: 'Em Andamento', color: 'bg-amber-500' },
  { id: 'testing', title: 'Em Teste', color: 'bg-indigo-500' },
  { id: 'done', title: 'Concluído', color: 'bg-emerald-500' }
];

export default function Kanban({ project }: KanbanProps) {
  const [activeIteration, setActiveIteration] = useState<Iteration | null>(null);
  const [stories, setStories] = useState<UserStory[]>([]);
  const [backlogStories, setBacklogStories] = useState<UserStory[]>([]);
  const [isNewIterationModalOpen, setIsNewIterationModalOpen] = useState(false);
  const [viewingStory, setViewingStory] = useState<UserStory | null>(null);
  const [isViewStoryModalOpen, setIsViewStoryModalOpen] = useState(false);
  const [newIteration, setNewIteration] = useState({
    name: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
  }, [project.id]);

  const fetchData = async () => {
    // Fetch iterations
    const iterRes = await fetch(`/api/projects/${project.id}/iterations`);
    const iterations: Iteration[] = await iterRes.json();
    const active = iterations.find(i => i.status === 'active');
    setActiveIteration(active || null);

    // Fetch all stories
    const storyRes = await fetch(`/api/projects/${project.id}/stories`);
    const allStories: UserStory[] = await storyRes.json();
    
    if (active) {
      setStories(allStories.filter(s => s.iteration_id === active.id));
    } else {
      setStories([]);
    }
    setBacklogStories(allStories.filter(s => s.iteration_id === null));
  };

  const handleCreateIteration = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/iterations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newIteration, project_id: project.id, status: 'active' }),
    });
    if (res.ok) {
      fetchData();
      setIsNewIterationModalOpen(false);
    }
  };

  const handleMoveStory = async (storyId: number, newStatus: string) => {
    await fetch(`/api/stories/${storyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchData();
  };

  const handleToggleTask = async (taskId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'todo' : 'done';
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    
    // Refresh data
    await fetchData();
    
    // If we are viewing a story, refresh its tasks too
    if (viewingStory) {
      const storyRes = await fetch(`/api/stories/${viewingStory.id}`);
      if (storyRes.ok) {
        const updatedStory = await storyRes.json();
        setViewingStory(updatedStory);
      }
    }
  };

  const handleAddToIteration = async (storyId: number) => {
    if (!activeIteration) return;
    await fetch(`/api/stories/${storyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ iteration_id: activeIteration.id, status: 'todo' }),
    });
    fetchData();
  };

  if (!activeIteration) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-6">
        <div className="p-6 bg-[#13161e] border border-[#252a38] rounded-2xl text-center max-w-md">
          <Clock size={48} className="mx-auto mb-4 text-indigo-400 opacity-50" />
          <h2 className="text-xl font-bold mb-2">Nenhuma Iteração Ativa</h2>
          <p className="text-slate-500 mb-6">Inicie uma nova iteração para começar a trabalhar nas histórias do backlog.</p>
          <button 
            onClick={() => setIsNewIterationModalOpen(true)}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors font-bold flex items-center justify-center gap-2"
          >
            <Play size={18} />
            Iniciar Iteração
          </button>
        </div>

        {isNewIterationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#13161e] border border-[#252a38] p-8 rounded-2xl w-full max-w-md shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-6">Nova Iteração</h2>
              <form onSubmit={handleCreateIteration} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Nome da Iteração</label>
                  <input
                    autoFocus
                    required
                    type="text"
                    value={newIteration.name}
                    onChange={(e) => setNewIteration({ ...newIteration, name: e.target.value })}
                    className="w-full bg-[#0d0f14] border border-[#252a38] rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="Ex: Iteração 01 - MVP"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Início</label>
                    <input
                      type="date"
                      value={newIteration.start_date}
                      onChange={(e) => setNewIteration({ ...newIteration, start_date: e.target.value })}
                      className="w-full bg-[#0d0f14] border border-[#252a38] rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Fim</label>
                    <input
                      type="date"
                      value={newIteration.end_date}
                      onChange={(e) => setNewIteration({ ...newIteration, end_date: e.target.value })}
                      className="w-full bg-[#0d0f14] border border-[#252a38] rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setIsNewIterationModalOpen(false)}
                    className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                  >
                    Iniciar Agora
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{activeIteration.name}</h2>
          <p className="text-slate-500 text-sm flex items-center gap-2">
            <Calendar size={14} />
            {formatDate(activeIteration.start_date)} até {formatDate(activeIteration.end_date)}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-slate-500 font-mono uppercase">Velocidade Atual</div>
            <div className="text-xl font-bold text-indigo-400">
              {stories.filter(s => s.status === 'done').reduce((acc, s) => acc + s.points, 0)} / {stories.reduce((acc, s) => acc + s.points, 0)} pts
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-4 gap-6 min-h-0">
        {COLUMNS.map(col => (
          <div key={col.id} className="flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${col.color}`} />
                <h3 className="font-bold text-sm uppercase tracking-wider">{col.title}</h3>
              </div>
              <span className="text-xs font-mono text-slate-500 bg-[#1a1e28] px-2 py-0.5 rounded-full">
                {stories.filter(s => s.status === col.id).length}
              </span>
            </div>

            <div className="flex-1 bg-[#13161e]/50 border border-[#252a38] rounded-2xl p-4 overflow-y-auto space-y-4">
              {stories.filter(s => s.status === col.id).map(story => (
                <motion.div
                  layout
                  key={story.id}
                  className="bg-[#1a1e28] border border-[#252a38] p-4 rounded-xl shadow-sm group relative"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-mono text-indigo-400 font-bold bg-indigo-400/10 px-1.5 py-0.5 rounded">
                      {story.points} PTS
                    </span>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => {
                          setViewingStory(story);
                          setIsViewStoryModalOpen(true);
                        }}
                        className="p-1 hover:bg-indigo-500/10 rounded text-indigo-400 transition-colors"
                        title="Ver detalhes"
                      >
                        <Eye size={14} />
                      </button>
                      <button className="text-slate-600 hover:text-white transition-colors">
                        <MoreHorizontal size={14} />
                      </button>
                    </div>
                  </div>
                  <h4 className="text-sm font-medium mb-1">{story.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-2">{story.description}</p>
                  
                  {story.due_date && (
                    <div className="flex items-center gap-1 text-[10px] text-indigo-400 font-mono mb-4">
                      <Calendar size={10} />
                      <span>{formatDate(story.due_date)}</span>
                    </div>
                  )}
                  
                  {story.tasks && story.tasks.length > 0 && (
                    <div className="mb-4 space-y-1.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono text-slate-600 uppercase">Tarefas</span>
                        <span className="text-[10px] font-mono text-slate-600">
                          {story.tasks.filter(t => t.status === 'done').length}/{story.tasks.length}
                        </span>
                      </div>
                      {story.tasks.map(task => (
                        <button
                          key={task.id}
                          onClick={() => handleToggleTask(task.id, task.status)}
                          className="w-full flex items-center gap-2 text-left group/task"
                        >
                          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                            task.status === 'done' 
                              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' 
                              : 'border-[#252a38] group-hover/task:border-slate-500'
                          }`}>
                            {task.status === 'done' && <CheckCircle2 size={10} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className={`text-[11px] block truncate ${
                              task.status === 'done' ? 'text-slate-600 line-through' : 'text-slate-400'
                            }`}>
                              {task.title}
                            </span>
                            {task.observation && (
                              <p className="text-[9px] text-slate-600 italic mt-0.5 truncate">{task.observation}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end gap-1">
                    {col.id !== 'done' && (
                      <button 
                        onClick={() => handleMoveStory(story.id, COLUMNS[COLUMNS.findIndex(c => c.id === col.id) + 1].id)}
                        className="p-1.5 hover:bg-indigo-500/10 rounded text-indigo-400 transition-colors"
                        title="Mover para próxima etapa"
                      >
                        <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}

              {col.id === 'todo' && backlogStories.length > 0 && (
                <div className="pt-4 border-t border-[#252a38] mt-4">
                  <h4 className="text-[10px] font-mono text-slate-600 uppercase mb-3 px-1">Disponível no Backlog</h4>
                  <div className="space-y-2">
                    {backlogStories.slice(0, 3).map(story => (
                      <div key={story.id} className="flex items-center justify-between p-2 bg-[#0d0f14] rounded-lg border border-[#252a38] group">
                        <span className="text-xs text-slate-500 truncate pr-2">{story.title}</span>
                        <button 
                          onClick={() => handleAddToIteration(story.id)}
                          className="p-1 hover:bg-indigo-500/10 rounded text-indigo-400 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* View Story Modal */}
      {isViewStoryModalOpen && viewingStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#13161e] border border-[#252a38] p-8 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                    viewingStory.status === 'done' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    viewingStory.status === 'doing' ? 'bg-amber-500/10 text-amber-400 border border-emerald-500/20' :
                    'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                  }`}>
                    {viewingStory.status}
                  </span>
                  <span className="text-xs font-mono text-indigo-400">{viewingStory.points} pontos</span>
                  {viewingStory.due_date && (
                    <span className="text-[10px] font-mono text-indigo-400 flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDate(viewingStory.due_date)}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold">{viewingStory.title}</h2>
              </div>
              <button 
                onClick={() => {
                  setIsViewStoryModalOpen(false);
                  setViewingStory(null);
                }}
                className="p-2 hover:bg-[#252a38] rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <Plus size={20} className="rotate-45" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold mb-2">Descrição</h3>
                <div className="bg-[#0d0f14] border border-[#252a38] p-4 rounded-lg text-slate-300 text-sm whitespace-pre-wrap">
                  {viewingStory.description || 'Sem descrição.'}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold mb-2">Tarefas ({viewingStory.tasks?.length || 0})</h3>
                <div className="space-y-2">
                  {viewingStory.tasks && viewingStory.tasks.length > 0 ? (
                    viewingStory.tasks.map((task: Task) => (
                      <div key={task.id} className="flex items-center justify-between bg-[#0d0f14] border border-[#252a38] p-3 rounded-lg">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => handleToggleTask(task.id, task.status)}
                            className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                              task.status === 'done' 
                                ? 'bg-emerald-500 border-emerald-500 text-white' 
                                : 'border-[#252a38] hover:border-slate-500'
                            }`}
                          >
                            {task.status === 'done' && <CheckCircle2 size={12} />}
                          </button>
                          <div className="min-w-0 flex-1">
                            <span className={`text-sm block ${task.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                              {task.title}
                            </span>
                            {task.observation && (
                              <p className="text-[10px] text-slate-500 italic mt-0.5">{task.observation}</p>
                            )}
                          </div>
                        </div>
                        {task.due_date && (
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-md text-[10px] text-indigo-400 font-mono font-bold">
                            <Calendar size={12} />
                            <span>{formatDate(task.due_date)}</span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 italic">Nenhuma tarefa associada.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <button
                onClick={() => {
                  setIsViewStoryModalOpen(false);
                  setViewingStory(null);
                }}
                className="px-6 py-2 bg-[#252a38] hover:bg-[#2e3445] text-white rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
