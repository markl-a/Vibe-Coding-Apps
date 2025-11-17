import { Calendar } from 'lucide-react';
import { DateRange } from '@/types';
import { getDateRangeLabel } from '@/lib/utils';

interface DateRangeSelectorProps {
  selected: DateRange;
  onChange: (range: DateRange) => void;
}

export default function DateRangeSelector({ selected, onChange }: DateRangeSelectorProps) {
  const ranges: DateRange[] = ['today', 'week', 'month'];

  return (
    <div className="flex items-center gap-2 bg-white rounded-lg shadow-md p-1">
      <Calendar className="w-5 h-5 text-gray-500 ml-2" />
      {ranges.map((range) => (
        <button
          key={range}
          onClick={() => onChange(range)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            selected === range
              ? 'bg-primary-500 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {getDateRangeLabel(range)}
        </button>
      ))}
    </div>
  );
}
