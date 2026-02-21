import React, { useMemo } from 'react';
import { useShift } from '../context/ShiftContext';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Users, Moon, Calendar, AlertCircle } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function Analytics() {
  const { employees, rosters, leaves } = useShift();

  const stats = useMemo(() => {
    return employees.map(emp => {
      const empRosters = rosters.filter(r => 
        r.days && Object.values(r.days).some((day: any) => 
          day.morning.includes(emp.id) || 
          day.evening.includes(emp.id) || 
          day.night.includes(emp.id)
        )
      );

      let nightCount = 0;
      let totalShifts = 0;
      
      rosters.forEach(r => {
        if (r.days) {
          Object.values(r.days).forEach((day: any) => {
            if (day.night.includes(emp.id)) nightCount++;
            if (day.morning.includes(emp.id) || day.evening.includes(emp.id) || day.night.includes(emp.id)) totalShifts++;
          });
        }
      });

      const empLeaves = leaves.filter(l => l.employeeId === emp.id).length;

      return {
        name: emp.name,
        nightCount,
        totalShifts,
        leaveCount: empLeaves
      };
    });
  }, [employees, rosters, leaves]);

  const barData = {
    labels: stats.map(s => s.name),
    datasets: [
      {
        label: 'Total Shifts',
        data: stats.map(s => s.totalShifts),
        backgroundColor: 'rgba(79, 70, 229, 0.6)',
      },
      {
        label: 'Night Shifts',
        data: stats.map(s => s.nightCount),
        backgroundColor: 'rgba(147, 51, 234, 0.6)',
      }
    ],
  };

  return (
    <div className="space-y-4">
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <StatCard label="Total Employees" value={employees.length} icon={<Users className="text-primary" />} />
        </div>
        <div className="col-md-3">
          <StatCard label="Total Night Shifts" value={stats.reduce((acc, s) => acc + s.nightCount, 0)} icon={<Moon className="text-info" />} />
        </div>
        <div className="col-md-3">
          <StatCard label="Active Leaves" value={leaves.filter(l => !l.approved).length} icon={<Calendar className="text-warning" />} />
        </div>
        <div className="col-md-3">
          <StatCard label="System Health" value="100%" icon={<AlertCircle className="text-success" />} />
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 p-4">
            <h5 className="fw-black mb-4">Shift Distribution</h5>
            <Bar data={barData} options={{ responsive: true, plugins: { legend: { position: 'top' as const } } }} />
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
            <h5 className="fw-black mb-4">Employee Performance</h5>
            <div className="table-responsive">
              <table className="table table-sm table-hover align-middle">
                <thead>
                  <tr className="small text-muted text-uppercase tracking-wider">
                    <th>Name</th>
                    <th className="text-center">Nights</th>
                    <th className="text-center">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.sort((a, b) => b.totalShifts - a.totalShifts).map(s => (
                    <tr key={s.name}>
                      <td className="fw-bold small">{s.name}</td>
                      <td className="text-center small">{s.nightCount}</td>
                      <td className="text-center small">
                        <span className="badge bg-light text-dark">{s.totalShifts}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="card border-0 shadow-sm rounded-4 p-4">
      <div className="d-flex justify-content-between align-items-start mb-2">
        <p className="text-muted small fw-bold text-uppercase tracking-wider mb-0">{label}</p>
        <div className="bg-light rounded-3 p-2">{icon}</div>
      </div>
      <h2 className="fw-black mb-0">{value}</h2>
    </div>
  );
}
