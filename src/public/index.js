document.addEventListener("alpine:init", () => {
  Alpine.store("plugins", {
    items: [],

    set(plugins) {
      this.items = [...plugins];
    },

    get forDisplay() {
      const genesis = 1636383299070;
      const genesisDate = new Date(genesis);
      const end = new Date();
      return this.items.map((p) => {
        const current = Math.min(new Date(p.timestamp).getTime(), Date.now());
        return {
          name: p.name,
          start: genesis, //genesis block
          startDate: `${genesisDate.toLocaleDateString()}<br>${genesisDate.toLocaleTimeString()}`,
          current,
          currentDate: `${new Date(current).toLocaleDateString()}<br>${new Date(
            current
          ).toLocaleTimeString()}`,

          end: end.getTime(),
          endDate: `${end.toLocaleDateString()}<br>${end.toLocaleTimeString()}`,
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
