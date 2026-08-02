"use client";

export type FlowState =
  "live" | "loading" | "success" | "empty" | "error" | "unauthorized";
export type FlowScope = "application" | "page" | "data";

export function FlowSidebar({ query, scope }: { query: string; scope: FlowScope }) {
  if (scope === "page") return <div><p className="px-2 pb-2 font-mono text-[9px] uppercase tracking-[.12em] text-zinc-400">Pages</p><FlowPage name="Login" route="/login" states="Selected · 4 connected steps"/><FlowPage name="Dashboard" route="/dashboard" states="5 generated states"/></div>;
  if (scope === "data") return <div><p className="px-2 pb-2 font-mono text-[9px] uppercase tracking-[.12em] text-zinc-400">API operations</p><div className="mb-2 rounded-xl border border-blue-300 bg-blue-50 p-3"><span className="rounded bg-blue-100 px-1.5 py-1 font-mono text-[8px] font-semibold text-blue-700">POST</span><b className="ml-2 font-mono text-[9px]">/api/auth/login</b><p className="mt-2 text-[8px] text-zinc-500">Login Form · Authentication Flow · Login Test</p></div><div className="rounded-xl border border-zinc-200 p-3"><span className="rounded bg-blue-100 px-1.5 py-1 font-mono text-[8px] font-semibold text-blue-700">GET</span><b className="ml-2 font-mono text-[9px]">/api/dashboard</b><p className="mt-2 text-[8px] text-zinc-500">Dashboard · Dashboard Data</p></div></div>;
  const flows = [
    "Authentication Flow",
    "Dashboard Loading",
    "Create Project",
    "Update Settings",
    "Logout Flow",
  ].filter((item) => item.toLowerCase().includes(query.toLowerCase()));
  return (
    <div>
      <p className="px-2 pb-2 font-mono text-[9px] uppercase tracking-[.12em] text-zinc-400">
        Application flows
      </p>
      {flows.map((flow, index) => (
        <button
          key={flow}
          className={`mb-1 w-full rounded-xl border p-3 text-left ${index === 0 ? "border-blue-200 bg-blue-50" : "border-transparent hover:bg-zinc-50"}`}
        >
          <span className="block text-[11px] font-semibold">{flow}</span>
          {index === 0 && (
            <>
              <span className="mt-1 block text-[9px] text-zinc-500">
                2 pages · 2 API operations · 5 actions
              </span>
              <span className="mt-2 inline-flex rounded-full bg-emerald-100 px-2 py-1 text-[8px] font-semibold text-emerald-700">
                ✓ All connected
              </span>
              <span className="mt-3 block border-l border-blue-200 pl-2">
                {["Login", "POST /api/auth/login", "Store Session", "Navigate /dashboard", "Dashboard", "GET /api/dashboard"].map((item) => <span key={item} className={`flex items-center py-1 text-[8px] ${item.startsWith("POST") ? "font-semibold text-blue-700" : "text-zinc-500"}`}><i className={`mr-2 h-1.5 w-1.5 rounded-full ${item.startsWith("POST") ? "bg-blue-500" : "bg-emerald-500"}`}/>{item}</span>)}
              </span>
            </>
          )}
        </button>
      ))}
      <p className="px-2 pb-2 pt-4 font-mono text-[9px] uppercase tracking-[.12em] text-zinc-400">
        Pages in this flow
      </p>
      <FlowPage
        name="Login"
        route="/login"
        states="Loading · Success · Error · Unauthorized"
      />
      <FlowPage
        name="Dashboard"
        route="/dashboard"
        states="Loading · Success · Empty · Error · Unauthorized"
      />
    </div>
  );
}

function FlowPage({
  name,
  route,
  states,
}: {
  name: string;
  route: string;
  states: string;
}) {
  return (
    <div className="mb-2 rounded-xl border border-zinc-200 p-3">
      <div className="flex items-center">
        <b className="text-[11px]">{name}</b>
        <span className="ml-auto rounded-full bg-emerald-50 px-2 py-1 text-[8px] text-emerald-700">
          Connected
        </span>
      </div>
      <p className="mt-1 font-mono text-[9px] text-zinc-400">{route}</p>
      <p className="mt-2 text-[8px] leading-4 text-zinc-500">{states}</p>
    </div>
  );
}

const FLOW_NODES = [
  {
    type: "PAGE",
    title: "Login",
    sub: "/login",
    status: "Generated",
    body: "Welcome back",
    detail: "rizal@forge.app · ••••••••••",
    tone: "zinc",
  },
  {
    type: "API",
    title: "Login Request",
    sub: "POST /api/auth/login",
    status: "200 OK · 183 ms",
    body: "3 request fields mapped",
    detail: "email · password · remember",
    tone: "blue",
    selected: true,
  },
  {
    type: "ACTION",
    title: "Store Session",
    sub: "On success",
    status: "Configured",
    body: "Session saved",
    detail: "accessToken · currentUser · expiresAt",
    tone: "violet",
  },
  {
    type: "NAVIGATION",
    title: "Navigate",
    sub: "/login → /dashboard",
    status: "Configured",
    body: "Replace history: Yes",
    detail: "Authenticated user · 0 ms",
    tone: "amber",
  },
  {
    type: "PAGE",
    title: "Dashboard",
    sub: "/dashboard",
    status: "Generated",
    body: "Build with clarity.",
    detail: "12 projects · 84 tasks · 98% coverage",
    tone: "zinc",
  },
  {
    type: "API",
    title: "Dashboard Request",
    sub: "GET /api/dashboard",
    status: "Connected · 146 ms",
    body: "Trigger: On page load",
    detail: "Success, loading, empty, error",
    tone: "blue",
  },
  {
    type: "BINDING",
    title: "Dashboard Data",
    sub: "Render response",
    status: "4 fields mapped",
    body: "activeProjects → Card.value",
    detail: "tasks · coverage · activities",
    tone: "emerald",
  },
];

export function ApplicationFlowGraph({ state, scope }: { state: FlowState; scope: FlowScope }) {
  const visibleNodes = scope === "application" ? FLOW_NODES : scope === "page" ? FLOW_NODES.slice(0, 4) : [FLOW_NODES[1], FLOW_NODES[0], FLOW_NODES[2]];
  return (
    <div className="relative h-[760px] w-[1740px] rounded-3xl border border-zinc-200/80 bg-white/50 p-10 shadow-sm">
      <div className="mb-7 flex items-center">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[.16em] text-blue-600">
            Authentication Flow
          </p>
          <h2 className="mt-1 text-lg font-semibold">Success path selected</h2>
        </div>
        <div className="ml-auto flex gap-2">
          <Badge green>Healthy</Badge>
          <Badge>0 disconnected</Badge>
          <Badge amber>1 warning</Badge>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-x-14 gap-y-20">
        {visibleNodes.map((node, index) => (
          <div key={node.title} className="relative">
            <FlowNode {...node} state={state} />
            {index < visibleNodes.length - 1 && (
              <Connector
                label={
                  ["Submit form", "On success", "Session saved", "Redirect", "On mount", "On success"][index]
                }
              />
            )}{" "}
            {index === 1 && (
              <div className="absolute ml-24 mt-3 flex items-center gap-2 text-[9px] text-red-600">
                <span className="h-px w-16 bg-red-300" />
                On error → Show form error
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="absolute bottom-8 left-10 right-10 grid grid-cols-2 gap-4">
        <StateCoverage
          title="Login"
          states={[
            "Idle — Ready",
            "Loading — Generated",
            "Error — Generated",
            "Unauthorized — Generated",
          ]}
        />
        <StateCoverage
          title="Dashboard"
          states={[
            "Loading — Generated",
            "Success — Active",
            "Empty — Generated",
            "Error — Generated",
            "Unauthorized — Generated",
          ]}
        />
      </div>
    </div>
  );
}

function FlowNode({
  type,
  title,
  sub,
  status,
  body,
  detail,
  tone,
  selected,
  state,
}: (typeof FLOW_NODES)[number] & { state: FlowState }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700",
    violet: "bg-violet-50 text-violet-700",
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
    zinc: "bg-zinc-100 text-zinc-600",
  };
  const stateMessage =
    state === "loading"
      ? "Request running… 92 ms"
      : state === "error"
        ? "Email or password is incorrect."
        : state === "unauthorized"
          ? "Session expired · Back to login"
          : state === "empty"
            ? "No activity yet"
            : body;
  return (
    <article
      data-fc-selectable
      className={`relative h-[180px] w-[340px] rounded-2xl border bg-white p-4 shadow-sm ${selected ? "border-blue-500 ring-4 ring-blue-100" : "border-zinc-200"}`}
    >
      <div className="flex items-center">
        <span
          className={`rounded-md px-2 py-1 font-mono text-[8px] font-semibold ${colors[tone]}`}
        >
          {type}
        </span>
        <span className="ml-auto flex items-center gap-1 text-[9px] font-medium text-emerald-700">
          <i className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {status}
        </span>
      </div>
      <h3 className="mt-3 text-sm font-semibold">{title}</h3>
      <p className="font-mono text-[9px] text-zinc-400">{sub}</p>
      <div
        className={`mt-4 rounded-xl border p-3 ${state === "error" || state === "unauthorized" ? "border-red-200 bg-red-50" : state === "loading" ? "animate-pulse border-blue-100 bg-blue-50" : "border-zinc-100 bg-zinc-50"}`}
      >
        <p className="text-[10px] font-medium">{stateMessage}</p>
        <p className="mt-1 text-[8px] text-zinc-400">{detail}</p>
      </div>
    </article>
  );
}

function Connector({ label }: { label: string }) {
  return (
    <div className="absolute left-[340px] top-[88px] flex w-14 items-center">
      <span className="h-px flex-1 bg-blue-300" />
      <span className="h-2 w-2 rounded-full bg-blue-500" />
      <span className="absolute -top-4 whitespace-nowrap font-mono text-[8px] text-zinc-400">
        {label}
      </span>
    </div>
  );
}
function Badge({
  children,
  green,
  amber,
}: {
  children: React.ReactNode;
  green?: boolean;
  amber?: boolean;
}) {
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[9px] font-medium ${green ? "border-emerald-200 bg-emerald-50 text-emerald-700" : amber ? "border-amber-200 bg-amber-50 text-amber-700" : "border-zinc-200 bg-white text-zinc-500"}`}
    >
      {children}
    </span>
  );
}
function StateCoverage({ title, states }: { title: string; states: string[] }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3">
      <div className="flex items-center">
        <b className="text-[10px]">State Coverage · {title}</b>
        <span className="ml-auto text-[8px] text-emerald-600">✓ Complete</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {states.map((state) => (
          <span
            key={state}
            className="rounded-lg bg-zinc-50 px-2 py-1 text-[8px] text-zinc-500"
          >
            <b className="text-emerald-600">✓</b> {state}
          </span>
        ))}
      </div>
      {title === "Login" && (
        <p className="mt-2 text-[8px] text-amber-600">
          ⚠ Login error copy uses fallback text
        </p>
      )}
    </div>
  );
}

export function FlowInspector({
  testing,
  tested,
  onTest,
}: {
  testing: boolean;
  tested: boolean;
  onTest: () => void;
}) {
  const request = {
    email: "rizal@forge.app",
    password: "••••••••",
    remember: true,
  };
  return (
    <div>
      <div className="mb-4 border-b border-zinc-200 pb-4">
        <div className="flex items-center">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-700">
            ↗
          </span>
          <div className="ml-3">
            <p className="text-xs font-semibold">Login Request</p>
            <p className="font-mono text-[8px] text-zinc-400">
              POST /api/auth/login
            </p>
          </div>
          <Badge green>Connected</Badge>
        </div>
      </div>
      <Section title="Used by">
        {[
          ["Flow", "Authentication Flow"],
          ["Page", "Login"],
          ["Component", "Login Form"],
          ["Trigger", "On submit"],
        ].map(([a, b]) => (
          <Row key={a} a={a} b={b} />
        ))}
      </Section>
      <Section title="Request configuration">
        {[
          ["Method", "POST"],
          ["Endpoint", "/api/auth/login"],
          ["Environment", "Development"],
          ["Authentication", "Public endpoint"],
        ].map(([a, b]) => (
          <Row key={a} a={a} b={b} />
        ))}
      </Section>
      <div className="mb-3 flex border-b border-zinc-200">
        <button className="border-b-2 border-blue-600 px-2 py-2 text-[9px] text-blue-700">
          Body
        </button>
        <button className="px-2 py-2 text-[9px] text-zinc-400">Headers</button>
        <button className="px-2 py-2 text-[9px] text-zinc-400">
          Query Params
        </button>
      </div>
      {[
        ["email", "emailInput.value"],
        ["password", "passwordInput.value"],
        ["remember", "rememberMe.checked"],
      ].map(([a, b]) => (
        <Row key={a} a={a} b={`← ${b}`} />
      ))}
      <pre className="my-3 rounded-xl bg-zinc-950 p-3 font-mono text-[8px] leading-4 text-zinc-300">
        {JSON.stringify(request, null, 2)}
      </pre>
      <Section title="Success behavior">
        <p className="text-[9px] leading-5 text-zinc-600">
          1. Store accessToken
          <br />
          2. Store currentUser
          <br />
          3. Navigate to /dashboard
        </p>
      </Section>
      <Section title="Error behavior">
        <p className="text-[9px] leading-5 text-zinc-600">
          Map response.message to LoginForm.error
          <br />
          Clear and focus password field
        </p>
      </Section>
      <button
        onClick={onTest}
        disabled={testing}
        className="w-full rounded-lg bg-blue-600 py-2.5 text-[10px] font-semibold text-white"
      >
        {testing ? "Testing flow…" : "Test Request"}
      </button>
      {tested && (
        <p className="mt-2 rounded-lg bg-emerald-50 p-2 text-center text-[9px] font-semibold text-emerald-700">
          200 OK · 183 ms · Development
        </p>
      )}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button className="rounded-lg border border-zinc-200 py-2 text-[9px]">
          Edit Mapping
        </button>
        <button className="rounded-lg border border-zinc-200 py-2 text-[9px]">
          Open Backend
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-4">
      <p className="mb-2 font-mono text-[8px] uppercase tracking-[.12em] text-zinc-400">
        {title}
      </p>
      {children}
    </section>
  );
}
function Row({ a, b }: { a: string; b: string }) {
  return (
    <div className="flex border-b border-zinc-100 py-2 text-[9px]">
      <span className="text-zinc-400">{a}</span>
      <b className="ml-auto font-medium">{b}</b>
    </div>
  );
}

export function FlowBottom() {
  return (
    <div className="grid h-[149px] grid-cols-[1fr_1.4fr_1fr] gap-5 overflow-auto p-4">
      <div>
        <b className="text-[10px]">Flow Summary</b>
        <div className="mt-2 grid grid-cols-2 gap-1 text-[8px] text-zinc-500">
          <span>Pages: 2</span>
          <span>API operations: 2</span>
          <span>Actions: 5</span>
          <span>Mappings: 4</span>
          <span>Generated states: 9</span>
          <span>Unconnected: 0</span>
        </div>
      </div>
      <div>
        <b className="text-[10px]">Execution Path</b>
        <p className="mt-2 text-[8px] leading-4 text-zinc-500">
          Login submitted → POST /api/auth/login → Store session → Navigate
          /dashboard → GET /api/dashboard → Map response → Render success
        </p>
        <p className="mt-2 text-[8px] text-amber-600">
          ⚠ Login error message uses default fallback copy
        </p>
      </div>
      <div>
        <b className="text-[10px]">Latest Test Run</b>
        <p className="mt-2 text-[8px] leading-4 text-zinc-500">
          Authentication Flow · <span className="text-emerald-600">Passed</span>
          <br />
          1.42 s · 2 requests · 6 / 6 assertions
        </p>
        <button className="mt-2 rounded-lg bg-blue-600 px-3 py-1.5 text-[8px] font-semibold text-white">
          Run Full Flow
        </button>
      </div>
    </div>
  );
}
