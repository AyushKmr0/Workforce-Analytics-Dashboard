import { useState } from 'react';
import { EmployeeTable } from '../../components/ui/EmployeeTable';
import { useAsync } from '../../hooks/useAsync';
import { hrService } from '../../services/hrService';

export function HRPeople() {
  const [search, setSearch] = useState('');
  const [params, setParams] = useState({});
  const employees = useAsync(() => hrService.employees(params), [params]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-blue-600">People</p>
        <h2 className="text-3xl font-black tracking-tight text-slate-950">Department Employees</h2>
      </div>
      <section className="card p-5">
        <form className="flex flex-wrap gap-3" onSubmit={(event) => { event.preventDefault(); setParams({ search }); }}>
          <input className="field min-w-72 flex-1" placeholder="Search department employees" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="btn-primary">Search</button>
          <button type="button" className="btn-secondary" onClick={() => { setSearch(''); setParams({}); }}>Clear</button>
        </form>
      </section>
      <EmployeeTable employees={employees.data?.items || []} />
    </div>
  );
}
