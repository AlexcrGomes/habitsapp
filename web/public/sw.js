// Service worker do Habits (spec 011, plan P3): só recebe notificações push e abre o app ao
// toque. Não guarda nada em cache e não tem modo offline, por isso não tem handler de "fetch":
// o carregamento das páginas continua igual e a versão nova chega com um recarregar comum.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  // Todo push recebido é mostrado: o iPhone e o Chrome punem push "silencioso" (plan P7)
  event.waitUntil(
    self.registration.showNotification(data.title || "Habits", {
      body: data.body || "",
      tag: data.tag,
      icon: "/icon-192.png",
      lang: "pt-BR",
      data: { url: data.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || "/", self.location.origin);
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const open = windows.find((client) => new URL(client.url).origin === url.origin);
      if (open) {
        // Sem recarregar: o app vai para a semana atual sem perder um formulário aberto
        open.postMessage({ type: "habits:open", path: url.pathname });
        await open.focus();
        return;
      }
      await self.clients.openWindow(url.href);
    })(),
  );
});
