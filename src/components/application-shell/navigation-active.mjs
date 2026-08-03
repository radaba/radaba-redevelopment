export function getActiveNavigationItem(pathname, navigation) {
  return [...navigation]
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((left, right) => right.href.length - left.href.length)[0];
}
