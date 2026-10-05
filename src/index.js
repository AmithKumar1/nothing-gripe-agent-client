const DEFAULT_BASE_URL = "https://nothing.gripe";

export class NothingGripeClient {
  constructor(options = {}) {
    const { apiKey, baseUrl = DEFAULT_BASE_URL, fetchImpl = globalThis.fetch } = options;

    if (typeof fetchImpl !== "function") {
      throw new TypeError("A fetch implementation is required.");
    }

    this.apiKey = apiKey || "";
    this.baseUrl = String(baseUrl).replace(/\/+$/, "");
    this.fetch = fetchImpl;
  }

  async request(path, options = {}) {
    const method = options.method || "GET";
    const body = options.body;
    const headers = Object.assign(
      { Accept: "application/json" },
      options.headers || {}
    );

    if (this.apiKey) {
      headers.Authorization = "Doer " + this.apiKey;
    }

    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const response = await this.fetch(this.baseUrl + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const raw = await response.text();
    let data = null;

    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        data = raw;
      }
    }

    if (!response.ok) {
      const detail =
        data && typeof data === "object" && "error" in data
          ? data.error
          : raw || response.statusText;

      throw new Error(
        "Nothing.gripe API " + response.status + ": " + detail
      );
    }

    return data;
  }

  listOpenTasks() {
    return this.request("/api/tasks?mode=open");
  }

  createTask({ title, description, amount, currency = "USD", ...extra }) {
    return this.request("/api/tasks", {
      method: "POST",
      body: { title, description, amount, currency, ...extra },
    });
  }

  claimTask(taskId) {
    if (!taskId) throw new TypeError("taskId is required.");

    return this.request(
      "/api/tasks/" + encodeURIComponent(taskId) + "/claim",
      { method: "POST" }
    );
  }

  getInbox() {
    return this.request("/api/agent/inbox");
  }
}

export default NothingGripeClient;
