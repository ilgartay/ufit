export default function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  const cls = size === "lg" ? "text-3xl" : "text-xl";
  return (
    <span className={`font-extrabold tracking-tight ${cls}`}>
      <span className="text-slate-800">u</span>
      <span className="text-brand">FIT</span>
    </span>
  );
}
