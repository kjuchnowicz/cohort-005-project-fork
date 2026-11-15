// PROTOTYPE — throwaway. Wayfinder ticket "Prototype: notification UX".
// Three variants of in-app Notifications, switchable via ?nvariant=A|B|C on any
// page inside the app layout. Mock data only, in-memory state, no persistence.
//   A — Bell + dropdown in the sidebar header
//   B — "Inbox" sidebar item + right-hand slide-over drawer
//   C — Live toasts + inline unread list folded into the sidebar nav
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";
import {
  Bell,
  BellDot,
  ChevronLeft,
  ChevronRight,
  Inbox,
  MessageSquare,
  Receipt,
  Ticket,
  X,
  Check,
  Plus,
} from "lucide-react";
import { cn } from "~/lib/utils";

type Kind =
  | "refund-approved"
  | "refund-declined"
  | "refund-requested"
  | "reply"
  | "lesson-question"
  | "coupon-redeemed";

type Notification = {
  id: number;
  kind: Kind;
  text: string;
  href: string;
  minutesAgo: number;
  read: boolean;
};

const ICONS: Record<Kind, typeof Bell> = {
  "refund-approved": Receipt,
  "refund-declined": Receipt,
  "refund-requested": Receipt,
  reply: MessageSquare,
  "lesson-question": MessageSquare,
  "coupon-redeemed": Ticket,
};

// Catalogue v1 from "Grilling: which events notify whom".
function mockFor(role: string, isTeamAdmin: boolean): Notification[] {
  let id = 1;
  const n = (
    kind: Kind,
    text: string,
    href: string,
    minutesAgo: number,
    read = false
  ): Notification => ({ id: id++, kind, text, href, minutesAgo, read });

  const list: Notification[] = [];
  if (role === "student") {
    list.push(
      n("refund-approved", "Your refund for **TypeScript Pro Essentials** was approved.", "/settings", 12),
      n("reply", "**Sarah Chen** replied to your comment on **Generics in Depth**.", "/courses", 95),
      n("refund-declined", "Your refund request for **React Patterns** was declined: *Over 2 hours watched.*", "/settings", 60 * 26, true),
      n("reply", "**Marcus Webb** replied to your comment on **Intro to Hooks**.", "/courses", 60 * 50, true)
    );
  }
  if (role === "instructor") {
    for (let i = 0; i < 6; i++) {
      list.push(
        n(
          "lesson-question",
          `**Learner ${i + 1}** asked a question on **Lesson ${i + 3}** in **TypeScript Pro Essentials**.`,
          "/instructor/questions",
          10 + i * 47,
          i > 3
        )
      );
    }
    list.push(n("reply", "**Alex Rivera** replied to your comment on **Mapped Types**.", "/courses", 60 * 30, true));
  }
  if (role === "admin") {
    list.push(
      n("refund-requested", "**Jamie Park** asked for a refund on **React Patterns**.", "/admin/refunds", 5),
      n("refund-requested", "**Priya Singh** asked for a refund on **Node Fundamentals**.", "/admin/refunds", 140),
      n("refund-requested", "**Tom Lee** asked for a refund on **CSS Mastery**.", "/admin/refunds", 60 * 28, true)
    );
  }
  if (isTeamAdmin) {
    list.push(
      n("coupon-redeemed", "**Dana Cole** claimed a seat on **TypeScript Pro Essentials** (3 left).", "/team", 33),
      n("coupon-redeemed", "**Eli Moss** claimed a seat on **TypeScript Pro Essentials** (4 left).", "/team", 60 * 20, true)
    );
  }
  return list;
}

function ago(m: number) {
  if (m < 60) return `${m}m ago`;
  if (m < 60 * 24) return `${Math.floor(m / 60)}h ago`;
  return `${Math.floor(m / (60 * 24))}d ago`;
}

// tiny **bold** / *italic* renderer for mock text
function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") ? (
          <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>
        ) : p.startsWith("*") ? (
          <em key={i}>{p.slice(1, -1)}</em>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

type Api = {
  items: Notification[];
  unread: number;
  markRead: (id: number) => void;
  markAllRead: () => void;
};

function useNotifications(role: string, isTeamAdmin: boolean) {
  const [items, setItems] = useState(() => mockFor(role, isTeamAdmin));
  useEffect(() => setItems(mockFor(role, isTeamAdmin)), [role, isTeamAdmin]);
  const api: Api = {
    items,
    unread: items.filter((i) => !i.read).length,
    markRead: (id) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, read: true } : x))),
    markAllRead: () => setItems((xs) => xs.map((x) => ({ ...x, read: true }))),
  };
  const push = (n: Notification) => setItems((xs) => [n, ...xs]);
  return { api, push };
}

function Row({ n, onOpen, compact }: { n: Notification; onOpen: () => void; compact?: boolean }) {
  const Icon = ICONS[n.kind];
  return (
    <Link
      to={n.href}
      onClick={onOpen}
      className={cn(
        "flex gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent",
        !n.read && "bg-primary/5"
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className={cn(compact && "line-clamp-2")}>
          <Rich text={n.text} />
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">{ago(n.minutesAgo)}</div>
      </div>
      {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
    </Link>
  );
}

function Badge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="ml-auto min-w-5 rounded-full bg-primary px-1.5 text-center text-[11px] font-semibold leading-5 text-primary-foreground">
      {count > 9 ? "9+" : count}
    </span>
  );
}

// ─── Variant A: bell + dropdown ───
function VariantABell({ api }: { api: Api }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-md p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent"
        title="Notifications"
      >
        {api.unread ? <BellDot className="size-5" /> : <Bell className="size-5" />}
        {api.unread > 0 && (
          <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-red-500 px-1 text-center text-[10px] font-bold leading-4 text-white">
            {api.unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute left-0 top-10 z-50 w-96 rounded-lg border bg-popover text-popover-foreground shadow-xl">
          <div className="flex items-center justify-between border-b px-4 py-2.5">
            <span className="font-semibold">Notifications</span>
            <button onClick={api.markAllRead} className="text-xs text-primary hover:underline">
              Mark all as read
            </button>
          </div>
          <div className="max-h-96 space-y-0.5 overflow-y-auto p-1.5">
            {api.items.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">You're all caught up.</div>
            )}
            {api.items.map((n) => (
              <Row key={n.id} n={n} compact onOpen={() => { api.markRead(n.id); setOpen(false); }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Variant B: Inbox nav item + slide-over drawer ───
function VariantBNav({ api, onOpen }: { api: Api; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    >
      <Inbox className="size-4" />
      Inbox
      <Badge count={api.unread} />
    </button>
  );
}

function VariantBDrawer({ api, open, onClose }: { api: Api; open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<"unread" | "all">("unread");
  if (!open) return null;
  const shown = tab === "unread" ? api.items.filter((i) => !i.read) : api.items;
  const today = shown.filter((i) => i.minutesAgo < 60 * 24);
  const earlier = shown.filter((i) => i.minutesAgo >= 60 * 24);
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/20" onClick={onClose}>
      <aside
        className="flex h-full w-[420px] flex-col border-l bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b px-5 py-4">
          <Inbox className="size-5" />
          <h2 className="text-lg font-semibold">Inbox</h2>
          <button onClick={onClose} className="ml-auto rounded p-1 hover:bg-accent">
            <X className="size-4" />
          </button>
        </div>
        <div className="flex items-center gap-1 border-b px-5 py-2 text-sm">
          {(["unread", "all"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn("rounded-md px-3 py-1 capitalize", tab === t ? "bg-accent font-medium" : "text-muted-foreground")}
            >
              {t}
              {t === "unread" && api.unread ? ` (${api.unread})` : ""}
            </button>
          ))}
          <button onClick={api.markAllRead} className="ml-auto flex items-center gap-1 text-xs text-primary hover:underline">
            <Check className="size-3" /> Mark all read
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {shown.length === 0 && (
            <div className="mt-20 text-center text-sm text-muted-foreground">Nothing here. You're all caught up.</div>
          )}
          {[["Today", today], ["Earlier", earlier]].map(([label, group]) =>
            (group as Notification[]).length ? (
              <section key={label as string} className="mb-4">
                <div className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {label as string}
                </div>
                {(group as Notification[]).map((n) => (
                  <Row key={n.id} n={n} onOpen={() => { api.markRead(n.id); onClose(); }} />
                ))}
              </section>
            ) : null
          )}
        </div>
      </aside>
    </div>
  );
}

// ─── Variant C: toasts + inline list in sidebar ───
function VariantCNav({ api }: { api: Api }) {
  const [expanded, setExpanded] = useState(true);
  const unread = api.items.filter((i) => !i.read);
  return (
    <div className="mb-2 rounded-md border border-sidebar-border bg-sidebar-accent/40">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60"
      >
        <Bell className="size-3.5" /> New for you
        <Badge count={unread.length} />
      </button>
      {expanded && (
        <div className="space-y-0.5 px-1 pb-1">
          {unread.length === 0 && (
            <div className="px-3 pb-2 text-xs text-sidebar-foreground/50">All caught up.</div>
          )}
          {unread.slice(0, 3).map((n) => (
            <Row key={n.id} n={n} compact onOpen={() => api.markRead(n.id)} />
          ))}
          {unread.length > 3 && (
            <div className="px-3 pb-1 text-xs text-sidebar-foreground/50">+{unread.length - 3} more</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Switcher ───
const VARIANTS = [
  { key: "A", name: "Bell + dropdown" },
  { key: "B", name: "Inbox drawer" },
  { key: "C", name: "Toasts + sidebar list" },
];

function PrototypeSwitcher({ current, api, onIncoming }: { current: string; api: Api; onIncoming: () => void }) {
  const [params, setParams] = useSearchParams();
  const idx = Math.max(0, VARIANTS.findIndex((v) => v.key === current));
  const go = (d: number) => {
    const next = VARIANTS[(idx + d + VARIANTS.length) % VARIANTS.length];
    const p = new URLSearchParams(params);
    p.set("nvariant", next.key);
    setParams(p, { replace: true, preventScrollReset: true });
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input,textarea,[contenteditable=true]")) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  return (
    <div className="fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-full bg-zinc-900 px-2 py-1.5 text-sm text-white shadow-2xl ring-2 ring-fuchsia-500">
      <button onClick={() => go(-1)} className="rounded-full p-1 hover:bg-white/10"><ChevronLeft className="size-4" /></button>
      <span className="min-w-44 text-center font-medium">
        {VARIANTS[idx].key} ({VARIANTS[idx].name})
      </span>
      <button onClick={() => go(1)} className="rounded-full p-1 hover:bg-white/10"><ChevronRight className="size-4" /></button>
      <span className="mx-1 h-4 w-px bg-white/20" />
      <span className="text-xs text-white/70">unread {api.unread} / {api.items.length}</span>
      <button onClick={onIncoming} className="flex items-center gap-1 rounded-full bg-fuchsia-600 px-2.5 py-0.5 text-xs hover:bg-fuchsia-500" title="Simulate a new Notification arriving">
        <Plus className="size-3" /> incoming
      </button>
    </div>
  );
}

// ─── Entry: returns pieces for the layout to place ───
export function useNotificationsPrototype(role: string | null, isTeamAdmin: boolean) {
  const [params] = useSearchParams();
  const variant = params.get("nvariant") ?? "A";
  const { api, push } = useNotifications(role ?? "", isTeamAdmin);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const enabled = import.meta.env.DEV && !!role;

  const incoming = useMemo(
    () => () => {
      const sample = mockFor(role ?? "", isTeamAdmin)[0];
      if (!sample) return;
      const n = { ...sample, id: Date.now(), minutesAgo: 0, read: false };
      push(n);
      if (variant === "C") {
        toast(<Rich text={n.text} />, {
          action: { label: "Open", onClick: () => (window.location.href = n.href) },
        });
      }
    },
    [role, isTeamAdmin, variant]
  );

  if (!enabled) return { headerSlot: null, navSlot: null, overlay: null };

  return {
    headerSlot: variant === "A" ? <VariantABell api={api} /> : null,
    navSlot:
      variant === "B" ? (
        <VariantBNav api={api} onOpen={() => setDrawerOpen(true)} />
      ) : variant === "C" ? (
        <VariantCNav api={api} />
      ) : null,
    overlay: (
      <>
        {variant === "B" && <VariantBDrawer api={api} open={drawerOpen} onClose={() => setDrawerOpen(false)} />}
        <PrototypeSwitcher current={variant} api={api} onIncoming={incoming} />
      </>
    ),
  };
}
