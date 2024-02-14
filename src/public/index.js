document.addEventListener("alpine:init", () => {
  Alpine.store("plugins", {
    items: [],

    set(plugins) {
      this.items = [...plugins];
    },

    get forDisplay() {
      return this.items.map((p) => {
        return {
          name: p.name,
          start: 1636383299070, //genesis block
          end: Date.now(),
          current: new Date(p.timestamp).getTime(),
        };
      });
    },
  });

  const sse = new EventSource(`${location.origin}/api/sse/plugins`);

  sse.addEventListener("plugin-status", (e) => {
    Alpine.store("plugins").set(Array.from(JSON.parse(e.data).plugins));
  });

  sse.addEventListener("close", (event) => {
    console.log('Received "close" event. Closing connection...');
    sse.close();
  });

  sse.onerror = (error) => {
    console.error("EventSource error:", error);
  };
});
