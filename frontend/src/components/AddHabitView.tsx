import React, { useState } from 'react';
import { Target, CalendarDays, Repeat, Ruler, FileText, Info } from 'lucide-react';
import { HabitCategory, Habit } from '../types';
import { PageHeader, Panel, Alert } from './ui';
 
// Matches backend TARGET_UNIT_CHOICES
type TargetUnit = 'MINUTES' | 'COUNT' | 'BOOL';
 
interface AddHabitViewProps {
  onSaveHabit: (habit: Omit<Habit, 'id' | 'history7d' | 'history' | 'streak'>) => void;
  onSuccessNavigate: () => void;
}
 
const CATEGORY_LABELS: HabitCategory[] = ['Health', 'Productivity', 'Finance', 'Education'];
 
const UNIT_OPTIONS: { value: TargetUnit; label: string; hint: string }[] = [
  { value: 'COUNT',   label: 'Count',    hint: 'e.g. 10 push-ups, 20 pages' },
  { value: 'MINUTES', label: 'Minutes',  hint: 'e.g. 30 min of running'     },
  { value: 'BOOL',    label: 'Yes / No', hint: 'Simply did it or not'        },
];
 
export default function AddHabitView({ onSaveHabit, onSuccessNavigate }: AddHabitViewProps) {
  const [name,        setName]        = useState('');
  const [category,    setCategory]    = useState<HabitCategory>('Health');
  const [targetValue, setTargetValue] = useState('1');
  const [targetUnit,  setTargetUnit]  = useState<TargetUnit>('COUNT');
  const [startDate,   setStartDate]   = useState(new Date().toISOString().split('T')[0]);
  const [error,       setError]       = useState('');
 
  const isBool = targetUnit === 'BOOL';
 
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
 
    if (!name.trim()) {
      setError('Please enter a habit name.');
      return;
    }
 
    const tv = parseInt(targetValue, 10);
    if (!isBool && (isNaN(tv) || tv < 1)) {
      setError('Target value must be at least 1.');
      return;
    }
 
    onSaveHabit({
      name:            name.trim(),
      category,
      targetValue:     isBool ? 1 : tv,
      targetUnit,
      // completionRate starts at 0 — backend will compute it
      completionRate:  0,
      isCompletedToday: false,
      createdDate:     startDate,
      // frequency is always DAILY per backend model
    });
 
    onSuccessNavigate();
  };
 
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <PageHeader
        title="Create habit"
        subtitle="Define a daily habit to track."
      />
 
      <Panel padding="md">
        {error && (
          <Alert variant="error" className="mb-4 text-sm flex items-center gap-1.5">
            <Info size={13} /> {error}
          </Alert>
        )}
 
        <form onSubmit={handleSubmit} className="space-y-5">
 
          {/* Name */}
          <div className="space-y-1.5">
            <label className="label flex items-center gap-1.5">
              <FileText size={13} /> Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Morning run, Read 20 pages"
              value={name}
              onChange={e => setName(e.target.value)}
              className="input-field"
            />
          </div>
 
          {/* Category */}
          <div className="space-y-1.5">
            <label className="label">Category</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORY_LABELS.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`
                    py-2.5 px-3 rounded-md text-sm font-medium transition-colors cursor-pointer
                    ${category === cat
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-high text-text-secondary hover:text-text-primary'
                    }
                  `}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
 
          {/* Target unit */}
          <div className="space-y-1.5">
            <label className="label flex items-center gap-1.5">
              <Ruler size={13} /> Measurement type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {UNIT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { setTargetUnit(opt.value); if (opt.value === 'BOOL') setTargetValue('1'); }}
                  className={`
                    py-2 px-2 rounded-md text-xs font-medium transition-colors cursor-pointer text-center
                    ${targetUnit === opt.value
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-high text-text-secondary hover:text-text-primary'
                    }
                  `}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-text-muted px-0.5">
              {UNIT_OPTIONS.find(o => o.value === targetUnit)?.hint}
            </p>
          </div>
 
          {/* Target value — hidden for BOOL */}
          {!isBool && (
            <div className="space-y-1.5">
              <label className="label flex items-center gap-1.5">
                <Target size={13} /> Daily target
                <span className="text-text-muted font-normal normal-case">
                  ({targetUnit === 'MINUTES' ? 'minutes' : 'times'})
                </span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={targetValue}
                onChange={e => setTargetValue(e.target.value)}
                placeholder="e.g. 30"
                className="input-field"
              />
            </div>
          )}
 
          {/* Start date */}
          <div className="space-y-1.5">
            <label className="label flex items-center gap-1.5">
              <CalendarDays size={13} /> Start date
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="input-field"
            />
          </div>
 
          {/* Frequency note */}
          <div className="panel-elevated p-3 flex items-start gap-2">
            <Repeat size={13} className="text-text-muted mt-0.5 shrink-0" />
            <p className="text-xs text-text-muted leading-relaxed">
              Habits are tracked <strong className="text-text-secondary font-medium">daily</strong>.
              Your habit will appear on the dashboard each day for you to log.
            </p>
          </div>
 
          {/* Actions */}
          <div className="flex gap-3 pt-2 divider">
            <button
              type="button"
              onClick={onSuccessNavigate}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="flex-2 bn-primary">
              Create habit
            </button>
          </div>
        </form>
      </Panel>
    </div>
  );
}


// import React, { useState } from 'react';
// import { BarChart, FileText } from 'lucide-react';
// import { HabitCategory, Habit } from '../types';
// import { PageHeader, Panel } from './ui';

// interface AddHabitViewProps {
//   onSaveHabit: (habit: Omit<Habit, 'id' | 'history7d' | 'history' | 'streak'>) => void;
//   onSuccessNavigate: () => void;
// }

// export default function AddHabitView({ onSaveHabit, onSuccessNavigate }: AddHabitViewProps) {
//   const [habitName, setHabitName] = useState('');
//   const [habitCategory, setHabitCategory] = useState<HabitCategory>('Health');
//   const [completionTarget, setCompletionTarget] = useState('85');

//   const handleHabitSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!habitName.trim()) {
//       alert('Please enter a habit name');
//       return;
//     }
//     onSaveHabit({
//       name: habitName.trim(),
//       category: habitCategory,
//       completionRate: parseInt(completionTarget, 10),
//       isCompletedToday: false,
//       createdDate: new Date('2026-05-20').toISOString().split('T')[0],
//     });
//     setHabitName('');
//     alert('Habit created successfully!');
//     onSuccessNavigate();
//   };

//   const habitCategories: HabitCategory[] = ['Health', 'Productivity', 'Finance', 'Education'];

//   return (
//     <div className="max-w-xl mx-auto space-y-6">
//       <PageHeader title="New habit" subtitle="Define a daily habit to track." />

//       <Panel padding="md">
//         <form onSubmit={handleHabitSubmit} className="space-y-5">
//           <div className="space-y-1.5">
//             <label className="label flex items-center gap-1.5">
//               <FileText size={14} />
//               Name
//             </label>
//             <input
//               type="text"
//               required
//               placeholder="e.g. Morning run, Read 20 pages"
//               value={habitName}
//               onChange={(e) => setHabitName(e.target.value)}
//               className="input-field"
//             />
//           </div>

//           <div className="space-y-1.5">
//             <label className="label">Category</label>
//             <div className="grid grid-cols-2 gap-2">
//               {habitCategories.map((cat) => {
//                 const isActive = habitCategory === cat;
//                 return (
//                   <button
//                     key={cat}
//                     type="button"
//                     onClick={() => setHabitCategory(cat)}
//                     className={`py-2.5 px-3 rounded-md text-sm font-medium transition-colors cursor-pointer ${
//                       isActive ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-text-secondary hover:text-text-primary'
//                     }`}
//                   >
//                     {cat}
//                   </button>
//                 );
//               })}
//             </div>
//           </div>

//           <div className="space-y-2">
//             <label className="label flex items-center gap-1.5">
//               <BarChart size={14} />
//               Target completion ({completionTarget}%)
//             </label>
//             <div className="panel-elevated p-4 space-y-3">
//               <input
//                 type="range"
//                 min="50"
//                 max="100"
//                 step="5"
//                 value={completionTarget}
//                 onChange={(e) => setCompletionTarget(e.target.value)}
//                 className="w-full accent-primary h-1 cursor-pointer"
//               />
//               <p className="text-xs text-text-muted">
//                 An 85% target means completing the habit about 6 of 7 days per week.
//               </p>
//             </div>
//           </div>

//           <p className="text-xs text-text-muted px-1">
//             New habits appear on your dashboard for daily tracking.
//           </p>

//           <div className="flex gap-3 pt-2 divider">
//             <button type="button" onClick={onSuccessNavigate} className="flex-1 btn-secondary">
//               Cancel
//             </button>
//             <button type="submit" className="flex-[2] btn-primary">
//               Create habit
//             </button>
//           </div>
//         </form>
//       </Panel>
//     </div>
//   );
// }
