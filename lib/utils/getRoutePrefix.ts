export function getRoutePrefix(route: string) {
  const clean = route.replace(/[^\w]/g, "");
  return clean.match(/^[A-Za-z]+/)?.[0] || "";
}
