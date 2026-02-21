import React, { useState, useMemo } from 'react';
import { useShift } from '../context/ShiftContext';
import { useRoster } from '../hooks/useRoster';
import { format, startOfWeek, addDays, parseISO } from 'date-fns';
import { Calendar, Plus, Download, FileSpreadsheet, AlertCircle, Zap, Moon, Sun, Coffee, AlertTriangle } from 'lucide-react';
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import RosterGrid from '../components/RosterGrid';
import { EmployeeBadge } from '../components/EmployeeBadge';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';

interface DashboardProps {
  isPublic?: boolean;
}

export default function Dashboard({ isPublic = false }: DashboardProps) {
  const { employees, rosters, isBillingMode, setBillingMode, isRamadanMode, setRamadanMode, user } = useShift();
  const { generateRoster, updateShift, updating } = useRoster();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeId, setActiveId] = useState<string | null>(null);

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 6 });
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  
  const currentRoster = useMemo(() => rosters.find(r => r.weekStartDate === weekStartStr), [rosters, weekStartStr]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    if (isPublic) return;
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    if (isPublic || !currentRoster) return;

    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData || !overData) return;

    const employeeId = activeData.employeeId;
    const fromShift = activeData.shift;
    const toShift = overData.shift;
    const date = overData.date;

    if (fromShift === toShift && activeData.date === date) return;

    try {
      await updateShift(currentRoster.id, date, employeeId, fromShift, toShift, currentRoster);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const activeEmployee = useMemo(() => 
    activeId ? employees.find(e => e.id === activeId.split('-')[0]) : null
  , [activeId, employees]);

  if (employees.length === 0) {
    return (
      <div className="text-center py-5">
        <div className="bg-warning bg-opacity-10 text-warning p-4 rounded-circle d-inline-flex mb-4">
          <AlertTriangle size={48} />
        </div>
        <h3>No Employees Found</h3>
        <p className="text-muted">
          The database seems to be empty or access is denied. 
          Please ensure you have created the <strong>employees</strong> collection in Firestore and set your <strong>Rules</strong> to allow read/write.
        </p>
      </div>
    );
  }

  return (
    <div className="row g-4">
      <div className="col-12">
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="card-header bg-white border-0 py-4 px-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-primary bg-opacity-10 text-primary p-3 rounded-4">
                <Calendar size={28} />
              </div>
              <div>
                <h3 className="fw-black mb-0">Weekly Roster</h3>
                <p className="text-muted small mb-0">Week starting {format(weekStart, 'MMMM d, yyyy')}</p>
              </div>
            </div>

            <div className="d-flex flex-wrap align-items-center gap-2">
              <div className="input-group input-group-sm" style={{ width: 'auto' }}>
                <span className="input-group-text bg-light border-0"><Calendar size={16} /></span>
                <input 
                  type="date" 
                  className="form-control bg-light border-0 fw-bold" 
                  value={format(selectedDate, 'yyyy-MM-dd')}
                  onChange={(e) => setSelectedDate(parseISO(e.target.value))}
                />
              </div>

              {!isPublic && user && (
                <>
                  <button 
                    className={`btn btn-sm fw-bold rounded-3 d-flex align-items-center gap-2 ${isBillingMode ? 'btn-warning' : 'btn-outline-warning'}`}
                    onClick={() => setBillingMode(!isBillingMode)}
                  >
                    <Zap size={16} /> Billing Mode
                  </button>
                  <button 
                    className={`btn btn-sm fw-bold rounded-3 d-flex align-items-center gap-2 ${isRamadanMode ? 'btn-info text-white' : 'btn-outline-info'}`}
                    onClick={() => setRamadanMode(!isRamadanMode)}
                  >
                    <Coffee size={16} /> Ramadan Mode
                  </button>
                  <button 
                    className="btn btn-primary btn-sm fw-bold rounded-3 px-3 shadow-sm"
                    onClick={() => generateRoster(selectedDate)}
                    disabled={updating}
                  >
                    {updating ? 'Generating...' : 'Generate Roster'}
                  </button>
                </>
              )}

              {currentRoster && (
                <div className="btn-group">
                  <button className="btn btn-outline-secondary btn-sm rounded-start-3" onClick={() => exportToPDF(currentRoster)}>
                    <Download size={16} className="me-1" /> PDF
                  </button>
                  <button className="btn btn-outline-secondary btn-sm rounded-end-3" onClick={() => exportToExcel(currentRoster)}>
                    <FileSpreadsheet size={16} className="me-1" /> Excel
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="card-body p-0">
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <RosterGrid 
                roster={currentRoster} 
                employees={employees} 
                isPublic={isPublic}
              />
              
              <DragOverlay>
                {activeEmployee ? (
                  <div className="shadow-lg rounded-3" style={{ opacity: 0.8 }}>
                    <EmployeeBadge employee={activeEmployee} isDragging />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
      </div>
    </div>
  );
}
