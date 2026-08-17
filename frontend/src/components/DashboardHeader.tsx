import Cursor from "./Cursor";

interface DashboardHeaderProps {
  online: boolean;
}

export default function DashboardHeader({ online }: DashboardHeaderProps) {
  return (
    <header className="border-b border-term-dim bg-term-bg/80 px-6 py-4">
      <div className="mx-auto flex max-w-6xl items-center gap-2 text-[0.85rem]">
        <span className="text-term-green">user@home-control</span>
        <span className="text-term-muted">:</span>
        <span className="text-term-amber">~</span>
        <span className="text-term-muted">$</span>
        <span className="text-term-fg">status --all</span>
        <Cursor className="text-term-green" />
        <div className="ml-auto hidden items-center gap-4 text-[0.7rem] tracking-widest text-term-muted sm:flex">
          <span>[4 ROOMS]</span>
          <span className="text-term-amber">[7 DEVICES]</span>
          <span className={online ? "text-term-green" : "text-term-red"}>
            [{online ? "ONLINE" : "OFFLINE"}]
          </span>
        </div>
      </div>
    </header>
  );
}