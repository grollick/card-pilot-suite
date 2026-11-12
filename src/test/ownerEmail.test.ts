import { readFileSync } from "node:fs";
import ts from "typescript";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => vi.unstubAllGlobals());

function loadFunction(path: string, client: unknown) {
  let handler: (req: Request) => Promise<Response> = async () => new Response();
  const exports: Record<string, any> = {};
  const env = { get: (key: string) => key === "RESEND_API_KEY" ? "test-resend-key" : "test-service-key" };
  const code = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function("require", "exports", "Deno", code)(
    () => ({ createClient: () => client, serve: (fn: typeof handler) => { handler = fn; } }),
    exports,
    { env, serve: (fn: typeof handler) => { handler = fn; } },
  );
  return { exports, run: () => handler(new Request("http://localhost", { headers: { Authorization: "Bearer test-service-key" } })) };
}

function mockClient(profileEmail: string | null, authEmail: string | undefined, reminder = false) {
  const getUserById = vi.fn().mockResolvedValue({ data: { user: { email: authEmail } }, error: null });
  const invoke = vi.fn().mockResolvedValue({ error: null });
  const from = vi.fn((table: string) => {
    const result = table === "leads" ? { data: { user_id: "owner-id", name: "Customer" }, count: 0 }
      : table === "profiles" ? { data: reminder ? [{ id: "owner-id", email: profileEmail }] : { email: profileEmail } }
      : table === "lead_routing_log" ? { data: [{ id: "log-id", user_id: "owner-id", lead_id: "lead-id" }] }
      : { data: null, count: 0 };
    const chain: any = { then: (resolve: any) => Promise.resolve(result).then(resolve) };
    for (const method of ["select", "eq", "single", "lt", "not", "is", "insert", "update"]) chain[method] = () => chain;
    return chain;
  });
  return { from, functions: { invoke }, auth: { admin: { getUserById } } };
}

describe("new lead owner email", () => {
  it("uses the account email when the public profile email was cleared", async () => {
    const client = mockClient(null, "account@example.org");
    const { exports } = loadFunction("supabase/functions/create-booking/lead-notification.ts", client);
    await exports.notifyLeadOwner(client, "lead-id", "event-id", "New enquiry");
    expect(client.auth.admin.getUserById).toHaveBeenCalledWith("owner-id");
    expect(client.functions.invoke).toHaveBeenCalledWith("send-transactional-email", expect.objectContaining({
      body: expect.objectContaining({ recipientEmail: "account@example.org", templateName: "new-lead" }),
    }));
  });

  it("prefers the pro's chosen contact email", async () => {
    const client = mockClient("chosen@example.org", "account@example.org");
    const { exports } = loadFunction("supabase/functions/create-booking/lead-notification.ts", client);
    await exports.notifyLeadOwner(client, "lead-id", "event-id", "New enquiry");
    expect(client.auth.admin.getUserById).not.toHaveBeenCalled();
    expect(client.functions.invoke.mock.calls[0][1].body.recipientEmail).toBe("chosen@example.org");
  });

  it("warns with the lead id only when both addresses are missing", async () => {
    const client = mockClient("  ", undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const { exports } = loadFunction("supabase/functions/create-booking/lead-notification.ts", client);
      await exports.notifyLeadOwner(client, "lead-id", "event-id", "New enquiry");
      expect(client.functions.invoke).not.toHaveBeenCalled();
      expect(warn).toHaveBeenCalledWith(expect.any(String), { leadId: "lead-id" });
    } finally { warn.mockRestore(); }
  });
});

describe("owner reminder email fallbacks", () => {
  it("uses the account email for both one-hour and 24-hour lead reminders", async () => {
    const client = mockClient(null, "account@example.org");
    const { run } = loadFunction("supabase/functions/lead-followup-reminders/index.ts", client);
    expect((await run()).status).toBe(200);
    expect(client.auth.admin.getUserById).toHaveBeenCalledTimes(2);
    expect(client.functions.invoke).toHaveBeenCalledTimes(2);
    for (const [name, options] of client.functions.invoke.mock.calls) {
      expect(name).toBe("send-transactional-email");
      expect(options.body.templateName).toBe("lead-reminder");
      expect(options.body.recipientEmail).toBe("account@example.org");
      expect(options.headers["x-internal-service-key"]).toBe("test-service-key");
    }
  });

  it("uses the account email for the activation reminder", async () => {
    const client = mockClient(null, "account@example.org", true);
    const fetch = vi.fn().mockResolvedValue(new Response("{}"));
    vi.stubGlobal("fetch", fetch);
    const { run } = loadFunction("supabase/functions/activation-reminder/index.ts", client);
    expect((await run()).status).toBe(200);
    expect(client.auth.admin.getUserById).toHaveBeenCalledWith("owner-id");
    expect(JSON.parse(fetch.mock.calls[0][1].body).to).toEqual(["account@example.org"]);
  });
});

describe("onboarding email prefill", () => {
  function emailBox(initial: string) {
    const source = readFileSync("src/modules/onboarding/pages/Onboarding.tsx", "utf8");
    const start = source.indexOf("  const emailPrefilled =");
    const end = source.indexOf("  const [city,", start);
    const code = ts.transpileModule(source.slice(start, end), {}).outputText;
    const ref = { current: false };
    let value = initial;
    return {
      load: (accountEmail: string | undefined) => new Function("useRef", "useEffect", "setEmail", "user", code)(
        () => ref, (effect: () => void) => effect(), (update: (current: string) => string) => { value = update(value); }, { email: accountEmail },
      ),
      edit: (email: string) => { value = email; },
      read: () => value,
    };
  }

  it("prefills once when account email arrives and preserves a deliberate clearing", () => {
    const box = emailBox("");
    box.load(undefined);
    expect(box.read()).toBe("");
    box.load("account@example.org");
    expect(box.read()).toBe("account@example.org");
    box.edit("");
    box.load("account@example.org");
    expect(box.read()).toBe("");
  });

  it("never replaces an address already typed before account hydration", () => {
    const box = emailBox("chosen@example.org");
    box.load("account@example.org");
    expect(box.read()).toBe("chosen@example.org");
  });

  it("saves a trimmed address or null without substituting the account email", () => {
    const source = readFileSync("src/modules/onboarding/pages/Onboarding.tsx", "utf8");
    const ast = ts.createSourceFile("Onboarding.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    let expression = "";
    function visit(node: ts.Node) {
      if (ts.isPropertyAssignment(node) && node.name.getText(ast) === "email") expression = node.initializer.getText(ast);
      ts.forEachChild(node, visit);
    }
    visit(ast);
    const save = new Function("email", `return ${expression}`);
    expect(save("  chosen@example.org  ")).toBe("chosen@example.org");
    expect(save("  ")).toBeNull();
    expect(save("")).toBeNull();
  });
});