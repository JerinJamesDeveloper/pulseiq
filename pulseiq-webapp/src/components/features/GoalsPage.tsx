import React, { useState, useMemo } from 'react';
import { Project, GoalDTO, SyncStatus } from '../../types';
// Removed redundant import

interface GoalsPageProps {
    projects: Project[];
    syncStatus: SyncStatus;
    onUpdateProject: (project: Project) => void;
    addToast: (message: string, type: 'success' | 'info' | 'error') => void;
}

export const GoalsPage: React.FC<GoalsPageProps> = ({
    projects,
}) => {
    const [selectedProjectId, setSelectedProjectId] = useState<number | 'all'>(
        projects.length > 0 ? projects[0].id : 'all'
    );
    const [isAddingGoal, setIsAddingGoal] = useState(false);
    console.log(isAddingGoal); // Temporary to avoid unused warning or just remove if not needed

    const selectedProject = useMemo(() => {
        if (selectedProjectId === 'all') return null;
        return projects.find(p => p.id === selectedProjectId) || null;
    }, [projects, selectedProjectId]);

    const displayGoals = useMemo(() => {
        if (selectedProjectId === 'all') {
            return projects.flatMap(p => p.goals.map(g => ({ ...g, projectName: p.name })));
        }
        return selectedProject?.goals || [];
    }, [selectedProjectId, selectedProject, projects]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return '#00FFB2';
            case 'in-progress': return '#38BDF8';
            default: return '#555';
        }
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <h2 style={{ margin: '0 0 6px', fontSize: 24, color: '#fff', fontWeight: 800 }}>Goals Tracking</h2>
                    <p style={{ margin: 0, color: '#555', fontFamily: 'monospace', fontSize: 12 }}>
                        Maintain and monitor your project objectives.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                    <select
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        style={{
                            background: '#08081a',
                            color: '#fff',
                            border: '1px solid #1a1a2e',
                            padding: '8px 16px',
                            borderRadius: 8,
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="all">All Projects</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>

                    {selectedProjectId !== 'all' && (
                        <button
                            onClick={() => setIsAddingGoal(true)}
                            style={{
                                background: '#00FFB2',
                                color: '#000',
                                border: 'none',
                                padding: '8px 20px',
                                borderRadius: 8,
                                fontWeight: 700,
                                cursor: 'pointer'
                            }}
                        >
                            + Add Goal
                        </button>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 20 }}>
                {displayGoals.map((goal: GoalDTO & { projectName?: string }) => (
                    <div
                        key={goal.id}
                        style={{
                            background: '#080810',
                            border: '1px solid #111122',
                            borderRadius: 16,
                            padding: 24,
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: getStatusColor(goal.status) }} />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                            <div>
                                <span style={{ fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 4 }}>
                                    {goal.projectName || selectedProject?.name} • {goal.category}
                                </span>
                                <h3 style={{ margin: 0, fontSize: 18, color: '#fff', fontWeight: 700 }}>{goal.title}</h3>
                            </div>
                            <div style={{
                                background: `${getStatusColor(goal.status)}22`,
                                color: getStatusColor(goal.status),
                                padding: '4px 10px',
                                borderRadius: 6,
                                fontSize: 10,
                                fontWeight: 700,
                                textTransform: 'uppercase'
                            }}>
                                {goal.status}
                            </div>
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}>
                                <span style={{ color: '#555' }}>Progress</span>
                                <span style={{ color: '#fff', fontWeight: 600 }}>{Math.round((goal.current / goal.target) * 100)}%</span>
                            </div>
                            <div style={{ height: 6, background: '#111122', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${Math.min(100, (goal.current / goal.target) * 100)}%`,
                                    background: `linear-gradient(90deg, ${getStatusColor(goal.status)}CC, ${getStatusColor(goal.status)})`,
                                    borderRadius: 3
                                }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginTop: 6, color: '#444' }}>
                                <span>{goal.current} / {goal.target}</span>
                                <span>Target Reached</span>
                            </div>
                        </div>

                        {goal.comments && (
                            <div style={{ background: '#0d0d1a', padding: 12, borderRadius: 8, marginBottom: 16, border: '1px solid #1a1a2e' }}>
                                <p style={{ margin: 0, fontSize: 12, color: '#888', lineHeight: 1.5 }}>{goal.comments}</p>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 16, borderTop: '1px solid #111122', paddingTop: 16 }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 10, color: '#444', marginBottom: 4 }}>LINKS</div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <div style={{ fontSize: 12, color: goal.issueIds?.length ? '#38BDF8' : '#333' }}>
                                        📦 {goal.issueIds?.length || 0}
                                    </div>
                                    <div style={{ fontSize: 12, color: goal.taskIds?.length ? '#00FFB2' : '#333' }}>
                                        ✅ {goal.taskIds?.length || 0}
                                    </div>
                                    <div style={{ fontSize: 12, color: goal.reportIds?.length ? '#A78BFA' : '#333' }}>
                                        📄 {goal.reportIds?.length || 0}
                                    </div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 10, color: '#444', marginBottom: 4 }}>HOURS</div>
                                <div style={{ fontSize: 14, color: '#fff', fontWeight: 700 }}>{goal.hoursSpent || 0}h</div>
                            </div>
                        </div>
                    </div>
                ))}

                {displayGoals.length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', border: '1px dashed #1a1a2e', borderRadius: 16, color: '#444' }}>
                        No goals found for this filter.
                    </div>
                )}
            </div>

            {/* Styles for animation */}
            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
        </div>
    );
};
