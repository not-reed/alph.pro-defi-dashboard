export function proxyImage(uri: string, width: number, height = width) {
  return `${
    import.meta.env.VITE_IMAGE_PROXY_ENDPOINT
  }?width=${width}&height=${height}&uri=${encodeURIComponent(uri)}`;
}
