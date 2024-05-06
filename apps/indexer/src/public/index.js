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
      return this.items
        .map((p) => {
          const current = new Date(
            Math.min(new Date(p.timestamp).getTime(), Date.now())
          );
          return {
            status: p.status ? 'Active' : 'Paused',
            name: p.name,
            start: genesis, //genesis block
            // startDate: `${genesisDate.toLocaleDateString()}<br>${genesisDate.toLocaleTimeString()}`,
            startDate: `${genesisDate.toLocaleString()}`,
            current: current.getTime(),
            currentDate: `${current.toLocaleString()}`,
            // currentDate: `${current.toLocaleDateString()}<br>${current.toLocaleTimeString()}`,

            end: end.getTime(),
            endDate: `${end.toLocaleString()}`,
            // endDate: `${end.toLocaleDateString()}<br>${end.toLocaleTimeString()}`,
          };
        })
        .sort((a, b) => a.status === b.status ? a.name.localeCompare(b.name) : a.status.localeCompare(b.status));
    },
  });

  if (location.pathname === "/") {
    // initial load
    fetch(`${location.origin}/api/sse/plugins-poll`).then(a => a.json()).then(a => a.plugins).then(plugins => {
      Alpine.store("plugins").set(plugins);
    })


    setInterval(async () => {
      const {plugins} = await fetch(`${location.origin}/api/sse/plugins-poll`).then(a => a.json())
      Alpine.store("plugins").set(plugins);
    }, 1000);

    // SSE is slow here for some reason
    // const sse = new EventSource(`${location.origin}/api/sse/plugins`);

    // sse.addEventListener("plugin-status", (e) => {
    //   Alpine.store("plugins").set(Array.from(JSON.parse(e.data).plugins));
    // });

    // sse.addEventListener("close", (event) => {
    //   console.log('Received "close" event. Closing connection...');
    //   sse.close();
    // });

    // sse.onerror = (error) => {
    //   console.error("EventSource error:", error);
    // };
  }
});

// function selfDestruction() {
//   return {
//     //   expiry: new Date().setSeconds(
//     //     new Date().getSeconds() + DEFAULT_CLOSE_TIMER
//     //   ),
//     //   remaining: null,
//     close() {
//       window.close();
//     },
//   };
// }
