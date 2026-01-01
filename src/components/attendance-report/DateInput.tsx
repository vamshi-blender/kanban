interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export default function DateInput({ label, value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-400">{label}</label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-[#181b21] text-white px-3 py-1.5 rounded-lg border border-[#2D3139] text-sm focus:outline-none focus:border-rose-500"
      />
    </div>
  );
}
