// Wraps every page. Because a template is re-created on each navigation,
// the page content fades and slides in gently every time you move to a new page.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
